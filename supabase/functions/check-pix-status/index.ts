import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('[PIX-STATUS] Checking PIX payment status...');

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { transactionId } = await req.json();
    console.log('[PIX-STATUS] Checking transaction:', transactionId);

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[PIX-STATUS] Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch PIX transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('pix_transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (transactionError || !transaction) {
      console.error('[PIX-STATUS] Transaction not found:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if transaction has expired
    const now = new Date();
    const expiresAt = new Date(transaction.expires_at);
    
    if (now > expiresAt && transaction.status === 'pending') {
      console.log('[PIX-STATUS] Transaction expired, updating status');
      
      // Update transaction status to expired
      const { error: updateError } = await supabase
        .from('pix_transactions')
        .update({ status: 'expired' })
        .eq('id', transactionId);

      if (updateError) {
        console.error('[PIX-STATUS] Error updating expired transaction:', updateError);
      }

      return new Response(
        JSON.stringify({ 
          status: 'expired',
          message: 'Transaction has expired'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // In a real implementation, you would check with your payment provider here
    // For now, we'll simulate payment confirmation based on certain conditions
    
    // Simulate payment confirmation (in production, this would be triggered by webhook)
    if (transaction.status === 'pending') {
      // Simulate random payment confirmation for demo purposes
      // In production, this would be updated by a webhook from your bank/payment provider
      const shouldConfirm = Math.random() > 0.8; // 20% chance for demo
      
      if (shouldConfirm) {
        console.log('[PIX-STATUS] Simulating payment confirmation');
        
        // Update transaction status
        const { error: updateTxError } = await supabase
          .from('pix_transactions')
          .update({ status: 'paid' })
          .eq('id', transactionId);

        if (updateTxError) {
          console.error('[PIX-STATUS] Error updating transaction:', updateTxError);
        } else {
          // Update order status
          const { error: updateOrderError } = await supabase
            .from('orders')
            .update({ 
              payment_status: 'paid',
              status: 'confirmed'
            })
            .eq('id', transaction.order_id);

          if (updateOrderError) {
            console.error('[PIX-STATUS] Error updating order:', updateOrderError);
          }
        }

        return new Response(
          JSON.stringify({ 
            status: 'paid',
            message: 'Payment confirmed'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Return current status
    console.log('[PIX-STATUS] Current transaction status:', transaction.status);

    return new Response(
      JSON.stringify({ 
        status: transaction.status,
        message: transaction.status === 'pending' ? 'Payment pending' : transaction.status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[PIX-STATUS] Error checking PIX status:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})