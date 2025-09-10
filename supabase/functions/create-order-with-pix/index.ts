import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('[CREATE-ORDER-PIX] 🚀 FASE 1 - REAL PIX IMPLEMENTATION LOADED');

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
      console.error('[CREATE-ORDER-PIX] ❌ MERCADOPAGO_ACCESS_TOKEN_PROD not configured');
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

    // Get real PIX key from environment with validation
    const pixKey = Deno.env.get('PIX_KEY_PROD') || Deno.env.get('PIX_KEY');
    if (!pixKey) {
      console.error('[CREATE-ORDER-PIX] ❌ No PIX key configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Chave PIX não configurada' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate PIX key format (basic validation)
    const pixKeyValidated = pixKey.trim();
    if (pixKeyValidated.length < 11) {
      console.error('[CREATE-ORDER-PIX] ❌ Invalid PIX key format');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Formato de chave PIX inválido' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[CREATE-ORDER-PIX] ✅ Using REAL PIX key (first 4 chars):', pixKeyValidated.substring(0, 4) + '...');
    console.log('[CREATE-ORDER-PIX] ✅ Environment:', pixKeyValidated.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION');

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
      console.error('[CREATE-ORDER-PIX] ❌ Authentication failed:', authError);
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

    console.log('[CREATE-ORDER-PIX] ✅ User authenticated:', user.id);

    // Parse request body
    const body = await req.text();
    if (!body.trim()) {
      throw new Error('Empty request body');
    }
    
    const orderData = JSON.parse(body);
    console.log('[CREATE-ORDER-PIX] 📦 Order data received:', { 
      user_id: orderData.user_id,
      total_amount: orderData.total_amount,
      items_count: orderData.items?.length 
    });

    // Get service role client for database operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ETAPA 1: Preparar dados do endereço se necessário
    let addressId = null;
    
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
          console.error('[CREATE-ORDER-PIX] ❌ Error creating address:', addressError);
          throw new Error('Erro ao criar endereço');
        }
        
        addressId = addressResult.id;
        console.log('[CREATE-ORDER-PIX] ✅ Address created:', addressId);
      }
    }

    // ETAPA 2: Obter perfil do usuário para dados do pagamento
    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('[CREATE-ORDER-PIX] 👤 User profile:', {
      email: profile?.email,
      full_name: profile?.full_name,
      cpf: profile?.cpf ? profile.cpf.substring(0, 3) + '***' : 'not_provided'
    });

    // ETAPA 3: 🎯 CRIAR PIX REAL COM CHAVE REAL - FASE 1 IMPLEMENTATION
    const paymentData = {
      transaction_amount: parseFloat(orderData.total_amount),
      description: `Pedido PizzaClub #${orderData.user_id.slice(-8)}`,
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
      external_reference: `temp-${user.id}-${Date.now()}`, // Referência temporária
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      metadata: {
        integration: 'pizzaclub_unified_flow',
        environment: pixKeyValidated.includes('sandbox') ? 'sandbox' : 'production',
        pix_key_hash: pixKeyValidated.substring(0, 8) + '***'
      }
    };

    console.log('[CREATE-ORDER-PIX] 🌐 Creating REAL PIX payment with real key - amount:', orderData.total_amount);
    console.log('[CREATE-ORDER-PIX] 📋 Payment data:', {
      amount: paymentData.transaction_amount,
      payer_email: paymentData.payer.email,
      payer_cpf: paymentData.payer.identification.number.substring(0, 3) + '***',
      pix_key_used: pixKey.substring(0, 10) + '...'
    });

    // 🌐 REAL MERCADOPAGO API CALL
    const mercadoPagoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${user.id}-${Date.now()}`
      },
      body: JSON.stringify(paymentData)
    });

    const mercadoPagoResult = await mercadoPagoResponse.json();

    // Se PIX falhou, NÃO criar pedido
    if (!mercadoPagoResponse.ok) {
      console.error('[CREATE-ORDER-PIX] ❌ REAL PIX creation failed:', {
        status: mercadoPagoResponse.status,
        error: mercadoPagoResult
      });
      throw new Error(`Erro ao gerar PIX real: ${mercadoPagoResult.message || 'Erro desconhecido'}`);
    }

    // Verificar se dados do PIX foram retornados
    const pixTransactionData = mercadoPagoResult.point_of_interaction?.transaction_data;
    
    if (!pixTransactionData || !pixTransactionData.qr_code) {
      console.error('[CREATE-ORDER-PIX] ❌ No REAL PIX data received from MercadoPago');
      throw new Error('PIX real não foi gerado pelo MercadoPago');
    }

    console.log('[CREATE-ORDER-PIX] ✅ REAL PIX created successfully:', {
      mercadopago_id: mercadoPagoResult.id,
      status: mercadoPagoResult.status,
      live_mode: mercadoPagoResult.live_mode,
      has_qr_code: !!pixTransactionData.qr_code,
      expires_at: mercadoPagoResult.date_of_expiration
    });

    // ETAPA 4: PIX criado com sucesso - AGORA criar o pedido
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
      console.error('[CREATE-ORDER-PIX] ❌ Error creating order:', orderError);
      // PIX já foi criado, mas não conseguimos criar o pedido
      // Em um cenário real, seria ideal cancelar o PIX aqui
      throw new Error('Erro ao criar pedido (PIX já foi gerado)');
    }

    console.log('[CREATE-ORDER-PIX] ✅ Order created:', order.id);

    // ETAPA 5: Criar itens do pedido
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
      console.error('[CREATE-ORDER-PIX] ❌ Error creating order items:', itemsError);
      // Rollback do pedido
      await supabaseServiceClient.from('orders').delete().eq('id', order.id);
      throw new Error('Erro ao criar itens do pedido');
    }

    console.log('[CREATE-ORDER-PIX] ✅ Order items created:', orderItems.length);

    // ETAPA 6: Atualizar a referência externa do PIX com o ID real do pedido
    const updateExternalRefResponse = await fetch(`https://api.mercadopago.com/v1/payments/${mercadoPagoResult.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_reference: order.id
      })
    });

    if (!updateExternalRefResponse.ok) {
      console.warn('[CREATE-ORDER-PIX] ⚠️ Warning: Could not update external reference');
    } else {
      console.log('[CREATE-ORDER-PIX] ✅ External reference updated to order ID');
    }

    // ETAPA 7: Armazenar transação PIX no banco COM MERCADOPAGO ID (FASE 1)
    const transactionId = `MP-${mercadoPagoResult.id}`;
    const expiresAt = mercadoPagoResult.date_of_expiration || 
                    new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseServiceClient
      .from('pix_transactions')
      .insert({
        id: transactionId,
        order_id: order.id,
        user_id: user.id,
        amount: parseFloat(order.total_amount),
        br_code: pixTransactionData.qr_code,
        status: 'pending',
        expires_at: expiresAt,
        mercadopago_payment_id: mercadoPagoResult.id.toString() // 🔑 STORING REAL MERCADOPAGO ID
      });

    if (insertError) {
      console.error('[CREATE-ORDER-PIX] ❌ Error storing PIX transaction:', insertError);
      // Não fazer rollback aqui pois PIX e pedido já foram criados com sucesso
    } else {
      console.log('[CREATE-ORDER-PIX] ✅ PIX transaction stored with MercadoPago ID:', mercadoPagoResult.id);
    }

    // ETAPA 8: Gerar dados finais do PIX
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixTransactionData.qr_code)}`;

    const pixData = {
      transactionId,
      brCode: pixTransactionData.qr_code,
      qrCodeUrl,
      qrCodeBase64: pixTransactionData.qr_code_base64 || null,
      amount: parseFloat(order.total_amount).toFixed(2),
      expiresAt,
      mercadoPagoId: mercadoPagoResult.id,
      ticketUrl: pixTransactionData.ticket_url || null,
      isRealPix: true, // Flag indicating this is a real PIX
      pixKeyUsed: pixKey.substring(0, 10) + '...' // Partial key for confirmation
    };

    console.log('[CREATE-ORDER-PIX] 🎉 ✅ REAL PIX CREATED FIRST → ORDER CREATED SUCCESSFULLY - FASE 1 COMPLETE');
    console.log('[CREATE-ORDER-PIX] 📊 Summary:', {
      orderId: order.id,
      mercadopagoId: mercadoPagoResult.id,
      amount: order.total_amount,
      pixKey: pixKey.substring(0, 10) + '...',
      liveMode: mercadoPagoResult.live_mode
    });

    return new Response(
      JSON.stringify({
        success: true,
        order,
        pixData,
        phase1Complete: true,
        realPixImplemented: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CREATE-ORDER-PIX] ❌ Error processing request:', error);
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