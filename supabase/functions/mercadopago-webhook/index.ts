import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function logStep(step: string, details?: any) {
  console.log(`[MERCADOPAGO-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Webhook received');

    // Get MercadoPago credentials
    const mercadopagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mercadopagoAccessToken) {
      throw new Error('MercadoPago access token not configured');
    }

    // Create Supabase service client (bypasses RLS)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Parse webhook data
    const webhookData = await req.json();
    logStep('Webhook data received', webhookData);

    // Handle payment notifications
    if (webhookData.type === 'payment') {
      const paymentId = webhookData.data.id;
      logStep('Processing payment notification', { paymentId });

      // Get payment details from MercadoPago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadopagoAccessToken}`
        }
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to get payment details: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      logStep('Payment details retrieved', { 
        paymentId: payment.id,
        status: payment.status,
        externalReference: payment.external_reference 
      });

      const orderId = payment.external_reference;
      if (!orderId) {
        logStep('No external reference found in payment');
        return new Response('OK', { status: 200 });
      }

      // Update order status based on payment status
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      switch (payment.status) {
        case 'approved':
          orderStatus = 'confirmed';
          paymentStatus = 'paid';
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'cancelled';
          paymentStatus = 'failed';
          break;
        case 'pending':
        case 'in_process':
          orderStatus = 'pending';
          paymentStatus = 'pending';
          break;
        default:
          logStep('Unknown payment status', { status: payment.status });
          return new Response('OK', { status: 200 });
      }

      logStep('Updating order status', { 
        orderId, 
        orderStatus, 
        paymentStatus,
        paymentMethod: payment.payment_method_id 
      });

      // Update order in database
      const { error: updateError } = await supabaseService
        .from('orders')
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          payment_method: payment.payment_method_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        logStep('Error updating order', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      logStep('Order updated successfully', { orderId, orderStatus, paymentStatus });
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    logStep('Webhook error', { error: error.message });
    return new Response('Error', { 
      headers: corsHeaders,
      status: 500 
    });
  }
});