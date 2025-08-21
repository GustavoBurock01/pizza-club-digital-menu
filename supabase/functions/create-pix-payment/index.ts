import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateBRCode, formatCurrency } from './pix-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
          error: 'PIX_KEY_PROD not configured. Please configure the secret first.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[PIX] No authorization header');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authorization required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
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
    const { orderId } = await req.json();
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

    console.log('[PIX] Processing PIX for order:', orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
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

    // Generate transaction ID
    const transactionId = `PIX-${orderId}-${Date.now()}`;
    
    // Generate PIX BR Code
    const pixData = {
      pixKey: pixKey,
      merchantName: 'PizzaClub',
      merchantCity: 'Sao Paulo',
      amount: order.total_amount,
      transactionId: transactionId,
      description: `Pedido ${orderId.substring(0, 8)}`
    };

    console.log('[PIX] Generating BR Code with data:', {
      merchantName: pixData.merchantName,
      merchantCity: pixData.merchantCity,
      amount: pixData.amount,
      transactionId: pixData.transactionId
    });

    const brCode = generateBRCode(pixData);
    
    // Generate QR Code URL (using a QR code service)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(brCode)}`;
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    console.log('[PIX] PIX payment created successfully:', {
      transactionId,
      amount: formatCurrency(order.total_amount),
      expiresAt
    });

    // Return PIX data
    const response = {
      success: true,
      transactionId,
      brCode,
      qrCodeUrl,
      amount: formatCurrency(order.total_amount),
      expiresAt
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[PIX] Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})