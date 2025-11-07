import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { validateStoreIsOpen } from '../_shared/store-schedule-validator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  customizations?: any;
}

interface OrderData {
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  delivery_fee?: number;
  payment_method?: string;
  delivery_method?: string;
  address_id?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
}

// Rate limiting em memória para múltiplas instâncias
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const stockReservations = new Map<string, { quantity: number; expires: number }>();

function checkRateLimit(userId: string, maxRequests: number = 25, windowMs: number = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const key = `orders:${userId}`;
  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetTime <= now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}

function checkConcurrentLimit(userId: string, maxConcurrent: number = 3): boolean {
  const now = Date.now();
  const key = `concurrent:${userId}`;
  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetTime <= now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + (5 * 60 * 1000) }); // 5 minutos
    return true;
  }

  return existing.count < maxConcurrent;
}

async function validateProductAvailability(
  supabaseClient: any, 
  items: OrderItem[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    const productIds = items.map(item => item.product_id);
    
    const { data: products, error } = await supabaseClient
      .from('products')
      .select('id, is_available, name')
      .in('id', productIds);

    if (error) {
      console.error('Error fetching products:', error);
      return { valid: false, errors: ['Erro ao verificar produtos'] };
    }

    for (const item of items) {
      const product = products?.find((p: any) => p.id === item.product_id);
      
      if (!product) {
        errors.push(`Produto não encontrado: ${item.product_id}`);
        continue;
      }

      if (!product.is_available) {
        errors.push(`Produto indisponível: ${product.name}`);
        continue;
      }

      // Verificar reservas temporárias
      const reservationKey = `product:${item.product_id}`;
      const reservation = stockReservations.get(reservationKey);
      
      if (reservation && reservation.quantity >= 15) { // Limite de reservas
        errors.push(`Produto temporariamente indisponível: ${product.name}`);
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    console.error('Unexpected error in product validation:', error);
    return { valid: false, errors: ['Erro interno na validação'] };
  }
}

function reserveStock(items: OrderItem[], userId: string): void {
  const now = Date.now();
  const expiresAt = now + (5 * 60 * 1000); // 5 minutos

  for (const item of items) {
    const key = `product:${item.product_id}`;
    const existing = stockReservations.get(key);
    
    stockReservations.set(key, {
      quantity: (existing?.quantity || 0) + item.quantity,
      expires: expiresAt
    });
  }

  console.log(`Stock reserved for user ${userId}:`, items.length, 'items');
}

function releaseStock(items: OrderItem[]): void {
  for (const item of items) {
    const key = `product:${item.product_id}`;
    const existing = stockReservations.get(key);
    
    if (existing) {
      const newQuantity = Math.max(0, existing.quantity - item.quantity);
      
      if (newQuantity === 0) {
        stockReservations.delete(key);
      } else {
        stockReservations.set(key, {
          ...existing,
          quantity: newQuantity
        });
      }
    }
  }
}

// Limpeza periódica de reservas expiradas
setInterval(() => {
  const now = Date.now();
  for (const [key, reservation] of stockReservations.entries()) {
    if (reservation.expires <= now) {
      stockReservations.delete(key);
    }
  }
}, 30 * 1000); // A cada 30 segundos

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
      }
    );

    // Autenticar usuário
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar rate limits
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Muitos pedidos recentes. Aguarde antes de tentar novamente.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!checkConcurrentLimit(user.id)) {
      return new Response(
        JSON.stringify({ 
          error: 'Concurrent limit exceeded', 
          message: 'Muitos pedidos simultâneos. Aguarde a conclusão dos anteriores.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData: OrderData = await req.json();
    console.log('Processing order for user:', user.id);

    // VALIDAÇÃO 0: Verificar se loja está aberta e logar tentativa
    const storeStatus = await validateStoreIsOpen(
      supabaseClient,
      user.id,
      user.email,
      {
        items: orderData.items || [],
        total: orderData.total_amount || 0
      }
    );
    
    if (!storeStatus.isOpen) {
      console.warn('[CREATE-ORDER-OPTIMIZED] Store closed - rejecting order');
      return new Response(
        JSON.stringify({
          error: storeStatus.error,
          nextOpening: storeStatus.nextOpening,
          message: `Não é possível criar pedidos no momento. ${storeStatus.nextOpening ? `Abriremos ${storeStatus.nextOpening}` : ''}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar dados básicos
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar disponibilidade de produtos
    const { valid, errors } = await validateProductAvailability(supabaseClient, orderData.items);
    
    if (!valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Product validation failed', 
          details: errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reservar estoque temporariamente
    reserveStock(orderData.items, user.id);

    try {
      // Iniciar transação para criar pedido
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: orderData.total_amount,
          delivery_fee: orderData.delivery_fee || 0,
          payment_method: orderData.payment_method,
          delivery_method: orderData.delivery_method || 'delivery',
          address_id: orderData.address_id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          notes: orderData.notes,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        releaseStock(orderData.items);
        return new Response(
          JSON.stringify({ error: 'Failed to create order', details: orderError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar itens do pedido
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        customizations: item.customizations
      }));

      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        
        // Rollback: deletar pedido
        await supabaseClient
          .from('orders')
          .delete()
          .eq('id', order.id);
        
        releaseStock(orderData.items);
        
        return new Response(
          JSON.stringify({ error: 'Failed to create order items', details: itemsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Order created successfully:', order.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          order,
          message: 'Pedido criado com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Unexpected error during order creation:', error);
      releaseStock(orderData.items);
      
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});