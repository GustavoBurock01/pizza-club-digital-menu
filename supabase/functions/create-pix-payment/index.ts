import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateBRCode, formatCurrency } from "./pix-utils.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PIX] Creating PIX payment...');

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const pixKey = Deno.env.get('PIX_KEY_PROD');
    
    if (!pixKey || pixKey.trim().length === 0) {
      console.error('[PIX] PIX_KEY_PROD not configured or empty');
      return new Response(
        JSON.stringify({ error: 'PIX key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('[PIX] PIX Key configured, length:', pixKey.length);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { orderId } = await req.json();
    console.log('[PIX] Processing order:', orderId);

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[PIX] Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('[PIX] Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[PIX] Order found:', order.id, 'Amount:', order.total_amount);

    // Generate unique transaction ID
    const transactionId = `${orderId}-${Date.now()}`;
    
    // Generate PIX BR Code
    const pixData = {
      pixKey: pixKey.trim(),
      merchantName: "Pizza Club",
      merchantCity: "Sua Cidade",
      amount: parseFloat(order.total_amount),
      transactionId: transactionId,
      description: `Pedido ${order.id.substring(0, 8)}`
    };

    try {
      const brCode = generateBRCode(pixData);
      console.log('[PIX] BR Code generated successfully, length:', brCode.length);
      console.log('[PIX] BR Code sample:', brCode.substring(0, 100) + '...');
      
      // Validate BR Code format
      if (!brCode.startsWith('00020101')) {
        console.error('[PIX] Invalid BR Code format - wrong header');
        throw new Error('Invalid BR Code format');
      }
      
      // Generate QR code using a more reliable service
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(brCode)}&format=png`;
      console.log('[PIX] QR Code URL generated:', qrCodeUrl.substring(0, 100) + '...');

      // Update order with PIX information
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_method: 'pix',
          payment_status: 'pending'
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('[PIX] Error updating order:', updateError);
      }

      // Store PIX transaction for verification
      const { error: pixError } = await supabase
        .from('pix_transactions')
        .insert({
          id: transactionId,
          order_id: orderId,
          user_id: user.id,
          br_code: brCode,
          amount: order.total_amount,
          status: 'pending',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        });

      if (pixError) {
        console.error('[PIX] Error creating PIX transaction:', pixError);
      }

      const response = {
        success: true,
        transactionId,
        brCode,
        qrCodeUrl,
        amount: formatCurrency(parseFloat(order.total_amount)),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      };

      console.log('[PIX] PIX payment created successfully');

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (brCodeError) {
      console.error('[PIX] Error generating BR Code:', brCodeError);
      return new Response(
        JSON.stringify({ error: `BR Code generation failed: ${brCodeError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('[PIX] Error creating PIX payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})