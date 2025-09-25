import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MercadoPago official IP ranges (to validate webhook origin)
const MERCADOPAGO_IP_RANGES = [
  '209.225.49.0/24',
  '216.33.197.0/24', 
  '216.33.196.0/24',
  '209.225.48.0/24'
];

function logStep(step: string, details?: any) {
  console.log(`[MERCADOPAGO-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
}

function logSecurity(action: string, details: any) {
  console.log(`[SECURITY-ALERT] ${action}`, JSON.stringify(details));
}

// Validate webhook signature using MercadoPago secret
async function validateWebhookSignature(
  payload: string, 
  signature: string | null, 
  secret: string
): Promise<boolean> {
  if (!signature) {
    logSecurity('Missing signature', { hasSignature: false });
    return false;
  }

  try {
    // MercadoPago signature format: ts=timestamp,v1=hash
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('ts='))?.substring(3);
    const hash = parts.find(p => p.startsWith('v1='))?.substring(3);

    if (!timestamp || !hash) {
      logSecurity('Invalid signature format', { signature });
      return false;
    }

    // Create signature payload: timestamp + payload
    const signaturePayload = `${timestamp}.${payload}`;
    
    // Generate HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(signaturePayload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const expectedHash = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = expectedHash === hash;
    
    if (!isValid) {
      logSecurity('Signature validation failed', { 
        expected: expectedHash.substring(0, 10) + '...', 
        received: hash.substring(0, 10) + '...' 
      });
    }

    return isValid;
  } catch (error) {
    logSecurity('Signature validation error', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

// Validate IP origin
function validateIPOrigin(ip: string | null): boolean {
  if (!ip) return false;
  
  // For development, allow localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    logStep('Development IP detected', { ip });
    return true;
  }

  // Check against MercadoPago IP ranges
  // Note: This is a simplified check. In production, use proper CIDR validation
  const isValidIP = MERCADOPAGO_IP_RANGES.some(range => {
    const [network] = range.split('/');
    return ip.startsWith(network.substring(0, network.lastIndexOf('.')));
  });

  if (!isValidIP) {
    logSecurity('Invalid IP origin', { ip, allowedRanges: MERCADOPAGO_IP_RANGES });
  }

  return isValidIP;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('🚀 REAL WEBHOOK RECEIVED - FASE 1 IMPLEMENTATION');

    // Get environment variables
    const mercadopagoAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN_PROD');
    const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
    
    if (!mercadopagoAccessToken) {
      throw new Error('MercadoPago access token not configured');
    }

    if (!webhookSecret) {
      logSecurity('CRITICAL: Webhook secret not configured', { 
        security_level: 'CRITICAL',
        recommendation: 'Configure MERCADOPAGO_WEBHOOK_SECRET immediately'
      });
    }

    // Create Supabase service client (bypasses RLS)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get request body and headers for validation
    const payload = await req.text();
    const signature = req.headers.get('x-signature');
    const userAgent = req.headers.get('user-agent');
    const contentType = req.headers.get('content-type');
    const origin = req.headers.get('origin');
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');

    // Log comprehensive security information
    const sourceInfo = {
      userAgent,
      contentType,
      origin,
      forwardedFor,
      realIp,
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    };
    logSecurity('🔍 WEBHOOK SOURCE ANALYSIS', sourceInfo);

    // SECURITY VALIDATIONS
    
    // 1. Validate webhook signature (if secret is configured)
    if (webhookSecret) {
      const isValidSignature = await validateWebhookSignature(payload, signature, webhookSecret);
      if (!isValidSignature) {
        logSecurity('🚨 INVALID SIGNATURE - POTENTIAL ATTACK', {
          signature: signature?.substring(0, 20) + '...',
          payload_length: payload.length,
          threat_level: 'HIGH'
        });
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }
      logStep('✅ Signature validation passed');
    }

    // 2. Validate IP origin
    const clientIp = realIp || forwardedFor || 'unknown';
    if (!validateIPOrigin(clientIp)) {
      logSecurity('🚨 INVALID IP ORIGIN - POTENTIAL ATTACK', {
        ip: clientIp,
        threat_level: 'HIGH'
      });
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }
    logStep('✅ IP origin validation passed', { ip: clientIp });

    // Parse webhook data
    const webhookData = JSON.parse(payload);
    logStep('📨 Webhook data received', webhookData);

    // Handle payment notifications
    if (webhookData.type === 'payment') {
      const paymentId = webhookData.data.id;
      logStep('💳 Processing payment notification', { paymentId });

      // 🔄 REAL API QUERY TO MERCADOPAGO (FASE 1 IMPLEMENTATION)
      logStep('🌐 Querying REAL MercadoPago API for payment status');
      
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadopagoAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        logSecurity('❌ MercadoPago API error', {
          status: paymentResponse.status,
          error: errorText,
          paymentId
        });
        throw new Error(`Failed to get payment details: ${paymentResponse.status} - ${errorText}`);
      }

      const payment = await paymentResponse.json();
      logStep('📊 REAL Payment details retrieved from MercadoPago API', { 
        paymentId: payment.id,
        status: payment.status,
        externalReference: payment.external_reference,
        paymentMethod: payment.payment_method_id,
        amount: payment.transaction_amount,
        dateCreated: payment.date_created,
        statusDetail: payment.status_detail,
        liveMode: payment.live_mode
      });

      // 🔒 ENHANCED SECURITY ANALYSIS (FASE 1)
      const securityAnalysis = {
        paymentId: payment.id,
        isTestPayment: payment.live_mode === false,
        statusTransition: `webhook -> ${payment.status}`,
        amountCents: payment.transaction_amount * 100,
        processingTime: payment.date_approved ? 
          new Date(payment.date_approved).getTime() - new Date(payment.date_created).getTime() : null,
        suspiciousIndicators: {
          instantApproval: payment.status === 'approved' && 
            payment.date_approved && 
            (new Date(payment.date_approved).getTime() - new Date(payment.date_created).getTime()) < 1000,
          missingExternalRef: !payment.external_reference,
          testEnvironment: payment.live_mode === false,
          autoApproval: payment.status === 'approved' && payment.status_detail === 'approved'
        }
      };

      logSecurity('🔍 REAL PAYMENT SECURITY ANALYSIS', securityAnalysis);

      // Filter out test payments in production
      if (payment.live_mode === false) {
        logSecurity('🧪 TEST PAYMENT DETECTED - IGNORING IN PRODUCTION', {
          paymentId: payment.id,
          action: 'IGNORED',
          reason: 'Test payment should not affect production orders'
        });
        return new Response('Test payment ignored', { status: 200, headers: corsHeaders });
      }

      const orderId = payment.external_reference;
      if (!orderId) {
        logSecurity('❌ Missing external reference', { 
          paymentId: payment.id, 
          status: payment.status,
          threat_level: 'HIGH' 
        });
        return new Response('No external reference', { status: 400, headers: corsHeaders });
      }

      // Validate external reference format (should be UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderId)) {
        logSecurity('❌ Invalid order ID format', { 
          orderId, 
          paymentId: payment.id,
          threat_level: 'CRITICAL'
        });
        return new Response('Invalid order format', { status: 400, headers: corsHeaders });
      }

      // Verify order exists and get current status
      const { data: existingOrder, error: selectError } = await supabaseService
        .from('orders')
        .select('id, status, payment_status, user_id, total_amount, created_at')
        .eq('id', orderId)
        .single();

      if (selectError || !existingOrder) {
        logSecurity('❌ Order not found in database', { 
          orderId, 
          paymentId: payment.id,
          error: selectError?.message,
          threat_level: 'HIGH' 
        });
        return new Response('Order not found', { status: 404, headers: corsHeaders });
      }

      logStep('📋 Existing order found', {
        orderId,
        currentStatus: existingOrder.status,
        currentPaymentStatus: existingOrder.payment_status,
        orderAmount: existingOrder.total_amount,
        paymentAmount: payment.transaction_amount
      });

      // 💰 CRITICAL: Validate amount matches exactly
      const orderAmountCents = Math.round(existingOrder.total_amount * 100);
      const paymentAmountCents = Math.round(payment.transaction_amount * 100);
      
      if (orderAmountCents !== paymentAmountCents) {
        logSecurity('🚨 AMOUNT MISMATCH DETECTED - POSSIBLE FRAUD', {
          orderId,
          orderAmount: existingOrder.total_amount,
          paymentAmount: payment.transaction_amount,
          difference: Math.abs(orderAmountCents - paymentAmountCents),
          threat_level: 'CRITICAL',
          action: 'PAYMENT_REJECTED'
        });
        return new Response('Amount mismatch', { status: 400, headers: corsHeaders });
      }

      // Map payment status to order status
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      switch (payment.status) {
        case 'approved':
          orderStatus = 'confirmed';
          paymentStatus = 'paid';  // Changed to standardize with PIX
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'cancelled';
          paymentStatus = 'rejected';
          break;
        case 'pending':
        case 'in_process':
          orderStatus = 'pending';
          paymentStatus = 'pending';
          break;
        default:
          logStep('❓ Unknown payment status', { status: payment.status });
          return new Response('Unknown status', { status: 200, headers: corsHeaders });
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
        logStep('❌ Error updating order', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // 🔄 UPDATE PIX TRANSACTION STATUS (if exists)
      if (payment.payment_method_id === 'pix') {
        logStep('🔄 Updating PIX transaction status');
        
        const { error: pixUpdateError } = await supabaseService
          .from('pix_transactions')
          .update({
            status: paymentStatus,
            mercadopago_payment_id: payment.id.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);

        if (pixUpdateError) {
          logStep('⚠️ Warning: Could not update PIX transaction', pixUpdateError);
        } else {
          logStep('✅ PIX transaction updated successfully');
        }
      }

      logStep('✅ Order updated successfully', { 
        orderId, 
        orderStatus, 
        paymentStatus,
        previousStatus: existingOrder.status,
        previousPaymentStatus: existingOrder.payment_status,
        statusTransition: `${existingOrder.status}/${existingOrder.payment_status} -> ${orderStatus}/${paymentStatus}`
      });

      // Final security log for approved payments
      if (payment.status === 'approved') {
        const orderAge = new Date().getTime() - new Date(existingOrder.created_at).getTime();
        logSecurity('✅ PAYMENT APPROVED - SECURITY SUMMARY', {
          orderId,
          paymentId: payment.id,
          paymentMethod: payment.payment_method_id,
          amount: payment.transaction_amount,
          orderAgeMinutes: Math.round(orderAge / 60000),
          validatedSignature: !!webhookSecret,
          validatedIP: true,
          validatedAmount: true,
          approvalTime: payment.date_approved,
          isLiveMode: payment.live_mode
        });
      }
    }

    return new Response('✅ REAL WEBHOOK PROCESSED SUCCESSFULLY', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : String(error);
    logStep('❌ Webhook processing error', { error: errorMessage, stack: errorStack });
    logSecurity('WEBHOOK_ERROR', { 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
    
    return new Response('Error', { 
      headers: corsHeaders,
      status: 500 
    });
  }
});