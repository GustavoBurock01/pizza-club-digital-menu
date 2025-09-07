import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('[CREATE-ORDER-PIX] Function loaded successfully');

serve(async (req) => {
  console.log('[CREATE-ORDER-PIX] Request received:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CREATE-ORDER-PIX] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check MercadoPago access token
    const mercadoPagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN_PROD');
    if (!mercadoPagoToken) {
      console.error('[CREATE-ORDER-PIX] MERCADOPAGO_ACCESS_TOKEN_PROD not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'MercadoPago token não configurado' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authentication required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[CREATE-ORDER-PIX] Authentication failed:', authError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid authentication' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[CREATE-ORDER-PIX] User authenticated:', user.id);

    // Parse request body
    const body = await req.text();
    if (!body.trim()) {
      throw new Error('Empty request body');
    }
    
    const orderData = JSON.parse(body);
    console.log('[CREATE-ORDER-PIX] Order data received:', { 
      user_id: orderData.user_id,
      total_amount: orderData.total_amount,
      items_count: orderData.items?.length 
    });

    // Get service role client for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Start transaction-like operations
    let addressId = null;
    
    // Create address if needed
    if (orderData.delivery_method === 'delivery' && orderData.addressData) {
      if (orderData.addressData.id) {
        addressId = orderData.addressData.id;
      } else {
        const { data: addressResult, error: addressError } = await supabaseServiceClient
          .from('addresses')
          .insert({
            user_id: user.id,
            ...orderData.addressData
          })
          .select()
          .single();

        if (addressError) {
          console.error('[CREATE-ORDER-PIX] Error creating address:', addressError);
          throw new Error('Erro ao criar endereço');
        }
        
        addressId = addressResult.id;
        console.log('[CREATE-ORDER-PIX] Address created:', addressId);
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabaseServiceClient
      .from('orders')
      .insert({
        user_id: user.id,
        address_id: addressId,
        total_amount: orderData.total_amount,
        delivery_fee: orderData.delivery_fee,
        delivery_method: orderData.delivery_method,
        status: 'pending',
        payment_status: 'pending',
        payment_method: orderData.payment_method,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        notes: orderData.notes
      })
      .select()
      .single();

    if (orderError) {
      console.error('[CREATE-ORDER-PIX] Error creating order:', orderError);
      throw new Error('Erro ao criar pedido');
    }

    console.log('[CREATE-ORDER-PIX] Order created:', order.id);

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      customizations: item.customizations
    }));

    const { error: itemsError } = await supabaseServiceClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('[CREATE-ORDER-PIX] Error creating order items:', itemsError);
      // Try to rollback order
      await supabaseServiceClient.from('orders').delete().eq('id', order.id);
      throw new Error('Erro ao criar itens do pedido');
    }

    console.log('[CREATE-ORDER-PIX] Order items created:', orderItems.length);

    // Get user profile for payment details
    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Create PIX payment with MercadoPago API
    const paymentData = {
      transaction_amount: parseFloat(order.total_amount),
      description: `Pedido PizzaClub #${order.id.slice(-8)}`,
      payment_method_id: 'pix',
      payer: {
        email: profile?.email || user.email,
        first_name: profile?.full_name?.split(' ')[0] || 'Cliente',
        last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'PizzaClub',
        identification: {
          type: 'CPF',
          number: profile?.cpf?.replace(/\D/g, '') || '00000000000'
        }
      },
      external_reference: order.id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
    };

    console.log('[CREATE-ORDER-PIX] Creating MercadoPago payment for order:', order.id);

    // Call MercadoPago API
    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${order.id}-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const mercadoPagoResult = await mercadoPagoResponse.json();

    if (!mercadoPagoResponse.ok) {
      console.error('[CREATE-ORDER-PIX] MercadoPago API error:', mercadoPagoResult);
      // Rollback order
      await supabaseServiceClient.from('order_items').delete().eq('order_id', order.id);
      await supabaseServiceClient.from('orders').delete().eq('id', order.id);
      throw new Error('Erro ao criar pagamento PIX');
    }

    console.log('[CREATE-ORDER-PIX] MercadoPago payment created:', {
      id: mercadoPagoResult.id,
      status: mercadoPagoResult.status
    });

    // Extract PIX data from MercadoPago response
    const pixTransactionData = mercadoPagoResult.point_of_interaction?.transaction_data;
    
    if (!pixTransactionData || !pixTransactionData.qr_code) {
      console.error('[CREATE-ORDER-PIX] No PIX data received from MercadoPago');
      // Rollback order
      await supabaseServiceClient.from('order_items').delete().eq('order_id', order.id);
      await supabaseServiceClient.from('orders').delete().eq('id', order.id);
      throw new Error('PIX não foi gerado pelo MercadoPago');
    }

    // Store PIX transaction in database
    const transactionId = `MP-${mercadoPagoResult.id}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseServiceClient
      .from('pix_transactions')
      .insert({
        id: transactionId,
        order_id: order.id,
        user_id: user.id,
        amount: parseFloat(order.total_amount),
        br_code: pixTransactionData.qr_code,
        status: 'pending',
        expires_at: expiresAt
      });

    if (insertError) {
      console.error('[CREATE-ORDER-PIX] Error storing PIX transaction:', insertError);
      // Don't rollback here as payment was created successfully
    }

    // Generate QR Code image URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixTransactionData.qr_code)}`;

    const pixData = {
      transactionId,
      brCode: pixTransactionData.qr_code,
      qrCodeUrl,
      qrCodeBase64: pixTransactionData.qr_code_base64 || null,
      amount: parseFloat(order.total_amount).toFixed(2),
      expiresAt,
      mercadoPagoId: mercadoPagoResult.id,
      ticketUrl: pixTransactionData.ticket_url || null
    };

    console.log('[CREATE-ORDER-PIX] Order and PIX created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        order,
        pixData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CREATE-ORDER-PIX] Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});