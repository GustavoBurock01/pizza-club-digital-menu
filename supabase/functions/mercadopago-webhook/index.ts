import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function logStep(step: string, details?: any) {
  console.log(`[MERCADOPAGO-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
}

function logSecurity(action: string, details: any) {
  console.log(`[SECURITY-ALERT] ${action}`, JSON.stringify(details));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Webhook received');

    // Get MercadoPago credentials
    const mercadopagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN_PROD');
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

    // Log source information for security analysis
    const sourceInfo = {
      userAgent: req.headers.get('user-agent'),
      contentType: req.headers.get('content-type'),
      origin: req.headers.get('origin'),
      forwardedFor: req.headers.get('x-forwarded-for'),
      realIp: req.headers.get('x-real-ip'),
      timestamp: new Date().toISOString()
    };
    logSecurity('Webhook source', sourceInfo);

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
        externalReference: payment.external_reference,
        paymentMethod: payment.payment_method_id,
        amount: payment.transaction_amount,
        dateCreated: payment.date_created,
        statusDetail: payment.status_detail
      });

      // Security check: Log detailed payment analysis
      logSecurity('Payment analysis', {
        paymentId: payment.id,
        isTestPayment: payment.live_mode === false,
        statusTransition: `unknown -> ${payment.status}`,
        amountCents: payment.transaction_amount * 100,
        processingTime: payment.date_approved ? 
          new Date(payment.date_approved).getTime() - new Date(payment.date_created).getTime() : null,
        suspiciousIndicators: {
          instantApproval: payment.status === 'approved' && 
            payment.date_approved && 
            (new Date(payment.date_approved).getTime() - new Date(payment.date_created).getTime()) < 1000,
          missingExternalRef: !payment.external_reference,
          testEnvironment: payment.live_mode === false
        }
      });

      const orderId = payment.external_reference;
      if (!orderId) {
        logSecurity('Missing external reference', { 
          paymentId: payment.id, 
          status: payment.status,
          suspiciousLevel: 'HIGH' 
        });
        logStep('No external reference found in payment');
        return new Response('OK', { status: 200 });
      }

      // Validate external reference format (should be UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderId)) {
        logSecurity('Invalid order ID format', { 
          orderId, 
          paymentId: payment.id,
          suspiciousLevel: 'CRITICAL',
          possibleAttack: 'Invalid UUID format detected' 
        });
        return new Response('Invalid order format', { status: 400 });
      }

      // Update order status based on payment status
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      switch (payment.status) {
        case 'approved':
          orderStatus = 'confirmed';
          paymentStatus = 'approved';  // Mudando para 'approved'
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'cancelled';
          paymentStatus = 'rejected';  // Mudando para 'rejected'
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
        paymentMethod: payment.payment_method_id,
        previousStatus: 'unknown',
        transactionAmount: payment.transaction_amount
      });

      // Additional security validation before updating
      if (payment.status === 'approved' && payment.payment_method_id === 'pix') {
        logSecurity('PIX payment approved', {
          orderId,
          paymentId: payment.id,
          amount: payment.transaction_amount,
          approvalSpeed: payment.date_approved ? 
            new Date(payment.date_approved).getTime() - new Date(payment.date_created).getTime() : 'unknown',
          requiresVerification: true
        });
      }

      // Verify order exists and get current status before updating
      const { data: existingOrder, error: selectError } = await supabaseService
        .from('orders')
        .select('id, status, payment_status, user_id, total_amount, created_at')
        .eq('id', orderId)
        .single();

      if (selectError || !existingOrder) {
        logSecurity('Order not found', { 
          orderId, 
          paymentId: payment.id,
          error: selectError?.message,
          suspiciousLevel: 'HIGH' 
        });
        return new Response('Order not found', { status: 404 });
      }

      logStep('Existing order found', {
        orderId,
        currentStatus: existingOrder.status,
        currentPaymentStatus: existingOrder.payment_status,
        orderAmount: existingOrder.total_amount,
        paymentAmount: payment.transaction_amount
      });

      // Validate amount matches (convert to avoid floating point issues)
      const orderAmountCents = Math.round(existingOrder.total_amount * 100);
      const paymentAmountCents = Math.round(payment.transaction_amount * 100);
      
      if (orderAmountCents !== paymentAmountCents) {
        logSecurity('Amount mismatch detected', {
          orderId,
          orderAmount: existingOrder.total_amount,
          paymentAmount: payment.transaction_amount,
          difference: Math.abs(orderAmountCents - paymentAmountCents),
          suspiciousLevel: 'CRITICAL'
        });
        return new Response('Amount mismatch', { status: 400 });
      }

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

      logStep('Order updated successfully', { 
        orderId, 
        orderStatus, 
        paymentStatus,
        previousStatus: existingOrder.status,
        previousPaymentStatus: existingOrder.payment_status,
        statusTransition: `${existingOrder.status}/${existingOrder.payment_status} -> ${orderStatus}/${paymentStatus}`
      });

      // Log any suspicious auto-approvals
      if (payment.status === 'approved' && existingOrder.status === 'pending') {
        const orderAge = new Date().getTime() - new Date(existingOrder.created_at).getTime();
        logSecurity('Auto-approval detected', {
          orderId,
          paymentId: payment.id,
          orderAgeMinutes: Math.round(orderAge / 60000),
          paymentMethod: payment.payment_method_id,
          isInstantApproval: orderAge < 60000, // Less than 1 minute
          requiresInvestigation: true
        });
      }
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