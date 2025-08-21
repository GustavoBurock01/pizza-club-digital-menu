import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { generateBRCode } from './pix-utils.ts';

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
    // Check if PIX_KEY_PROD is configured
    const pixKey = Deno.env.get('PIX_KEY_PROD');
    if (!pixKey) {
      console.error('[PIX] PIX_KEY_PROD not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'PIX configuration not available' 
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
      console.error('[PIX] No authorization header');
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
      console.error('[PIX] No orderId provided');
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

    console.log('[PIX] Looking for order:', orderId);

    // Get order details using service role client (bypasses RLS)
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: order, error: orderError } = await supabaseServiceClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id) // Still check user ownership
      .single();

    if (orderError || !order) {
      console.error('[PIX] Order not found or error:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Order not found',
          details: orderError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[PIX] Order found:', { id: order.id, amount: order.total_amount });

    // Generate transaction ID
    const transactionId = `PIX-${Date.now()}-${order.id.slice(-8)}`;

    // Prepare PIX data
    const pixData = {
      pixKey: pixKey,
      merchantName: 'Rei da Pizza',
      merchantCity: 'São Paulo',
      amount: parseFloat(order.total_amount),
      transactionId,
      description: `Pedido #${order.id.slice(-8)}`
    };

    console.log('[PIX] Generating PIX with data:', pixData);

    // Generate PIX BR Code
    const brCode = generateBRCode(pixData);
    console.log('[PIX] BR Code generated:', brCode.substring(0, 50) + '...');

    // Generate QR Code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(brCode)}`;

    // Calculate expiration time (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Store PIX transaction in database
    const { error: insertError } = await supabaseServiceClient
      .from('pix_transactions')
      .insert({
        id: transactionId,
        order_id: order.id,
        user_id: user.id,
        amount: parseFloat(order.total_amount),
        br_code: brCode,
        status: 'pending',
        expires_at: expiresAt
      });

    if (insertError) {
      console.error('[PIX] Error storing PIX transaction:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to store transaction' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[PIX] PIX payment created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        pixData: {
          transactionId,
          brCode,
          qrCodeUrl,
          amount: parseFloat(order.total_amount).toFixed(2),
          expiresAt
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