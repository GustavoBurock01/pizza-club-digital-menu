import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('[PIX] Function loaded successfully');

serve(async (req) => {
  console.log('[PIX] Request received:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[PIX] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check MercadoPago access token
    const mercadoPagoToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN_PROD');
    if (!mercadoPagoToken) {
      console.error('[PIX] MERCADOPAGO_ACCESS_TOKEN_PROD not configured');
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
      console.error('[PIX] Authentication failed:', authError);
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

    console.log('[PIX] User authenticated:', user.id);

    // Parse request body
    const body = await req.text();
    if (!body.trim()) {
      throw new Error('Empty request body');
    }
    
    const { orderId } = JSON.parse(body);
    if (!orderId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Order ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[PIX] Processing PIX for order:', orderId);

    // Get order details using service role client
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: order, error: orderError } = await supabaseServiceClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('[PIX] Order not found:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Order not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[PIX] Order found:', { id: order.id, amount: order.total_amount });

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

    console.log('[PIX] Creating MercadoPago payment:', {
      amount: paymentData.transaction_amount,
      description: paymentData.description,
      external_reference: paymentData.external_reference
    });

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
      console.error('[PIX] MercadoPago API error:', mercadoPagoResult);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao criar pagamento PIX',
          details: mercadoPagoResult.message || 'Erro na API do MercadoPago'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[PIX] MercadoPago payment created:', {
      id: mercadoPagoResult.id,
      status: mercadoPagoResult.status,
      qr_code: mercadoPagoResult.point_of_interaction?.transaction_data?.qr_code ? 'Generated' : 'Not available'
    });

    // Extract PIX data from MercadoPago response
    const pixData = mercadoPagoResult.point_of_interaction?.transaction_data;
    
    if (!pixData || !pixData.qr_code) {
      console.error('[PIX] No PIX data received from MercadoPago:', mercadoPagoResult);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'PIX não foi gerado pelo MercadoPago',
          details: 'Dados PIX não encontrados na resposta'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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
        br_code: pixData.qr_code,
        status: 'pending',
        expires_at: expiresAt
      });

    if (insertError) {
      console.error('[PIX] Error storing PIX transaction:', insertError);
    }

    // Generate QR Code image URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixData.qr_code)}`;

    console.log('[PIX] Real MercadoPago PIX created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        pixData: {
          transactionId,
          brCode: pixData.qr_code,
          qrCodeUrl,
          qrCodeBase64: pixData.qr_code_base64 || null,
          amount: parseFloat(order.total_amount).toFixed(2),
          expiresAt,
          mercadoPagoId: mercadoPagoResult.id,
          ticketUrl: pixData.ticket_url || null
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[PIX] Error processing request:', error);
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