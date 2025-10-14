import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const validateEnvironment = (stripeKey: string) => {
  const isTestMode = stripeKey.startsWith('sk_test');
  const mode = isTestMode ? 'TEST' : 'PRODUCTION';
  logStep(`🔥 RUNNING IN ${mode} MODE`);
  
  // Validar que todos os secrets estejam no mesmo modo
  const priceIds = [
    { id: Deno.env.get("STRIPE_PRICE_ID_ANNUAL"), name: "ANNUAL" },
    { id: Deno.env.get("STRIPE_PRICE_ID_MONTHLY"), name: "MONTHLY" },
    { id: Deno.env.get("STRIPE_PRICE_ID_TRIAL"), name: "TRIAL" }
  ].filter(p => p.id);
  
  for (const price of priceIds) {
    const priceIsTest = price.id?.startsWith('price_test');
    if (priceIsTest === !isTestMode) {
      throw new Error(`Price ID mode mismatch: ${price.name} (${price.id?.substring(0, 15)}...) vs ${mode}`);
    }
  }
  
  return { isTestMode, mode };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    // Validar ambiente e configuração
    const env = validateEnvironment(stripeKey);
    logStep("Stripe key verified", { mode: env.mode });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Initialize Supabase with service role for database writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      logStep("No signature found in headers");
      return new Response(JSON.stringify({ error: "No signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let event: Stripe.Event;

    // PRODUÇÃO REQUER VERIFICAÇÃO DE ASSINATURA
    if (!webhookSecret) {
      logStep("CRITICAL: STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("PRODUCTION REQUIRES STRIPE_WEBHOOK_SECRET. Configure it in Supabase Edge Functions secrets.");
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type, eventId: event.id });
    } catch (err: any) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, supabaseClient, stripe);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event, supabaseClient);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event, supabaseClient);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event, supabaseClient, stripe);
        break;
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await handleInvoiceEvent(event, supabaseClient, stripe);
        break;
      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionEvent(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Processing subscription event", { 
    eventType: event.type, 
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status
  });

  try {
    // ✅ ERRO 2 FIX: Idempotência - verificar se já processamos
    const { data: existingEvent } = await supabaseClient
      .from('webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      logStep("Event already processed, skipping", { eventId: event.id });
      return;
    }

    // Record event for idempotency
    await supabaseClient
      .from('webhook_events')
      .insert({
        event_id: event.id,
        provider: 'stripe',
        event_type: event.type,
        payload: event
      });

    // ... keep existing code (customer retrieval and profile update)
    
  } catch (error) {
    logStep("Error in handleSubscriptionEvent", { error });
    throw error;
  }
}

    // Get customer to find user email
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    if (!customer.email) {
      logStep("No email found for customer", { customerId: customer.id });
      return;
    }

    // Get user from profiles table using email
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('email', customer.email)
      .single();

    if (profileError || !profile) {
      logStep("User not found in profiles", { email: customer.email, error: profileError });
      return;
    }

    // Update profile with stripe_customer_id if missing
    if (!profile.stripe_customer_id) {
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', profile.id);
      logStep("Updated profile with stripe_customer_id", { userId: profile.id, customerId: customer.id });
    }

    // Determine plan details from price_id - BUSCAR VALORES REAIS DO STRIPE
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const planPrice = (price.unit_amount || 0) / 100; // Converter centavos para reais
    
    // Map plan name by price_id from secrets
    const trialPriceId = Deno.env.get("STRIPE_PRICE_ID_TRIAL");
    const monthlyPriceId = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
    const annualPriceId = Deno.env.get("STRIPE_PRICE_ID_ANNUAL");
    
    let planName = 'Desconhecido';
    
    if (priceId === annualPriceId) {
      planName = "Anual";
    } else if (priceId === monthlyPriceId) {
      planName = "Mensal";
    } else if (priceId === trialPriceId) {
      planName = "Trial";
    }

    logStep("Plan details determined from Stripe", { 
      priceId: `${priceId.substring(0, 15)}...`,
      planName, 
      planPrice,
      currency: price.currency 
    });

    const isActive = subscription.status === 'active';
    const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const expiresAt = isActive ? currentPeriodEnd : null;
    const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null;

    // Enhanced subscription data
    const subscriptionData = {
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      status: isActive ? 'active' : 'inactive',
      plan_name: planName,
      plan_price: planPrice,
      expires_at: expiresAt,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: canceledAt,
      sync_status: 'webhook',
      last_webhook_event: event.type,
      webhook_event_id: event.id,
      last_synced_at: new Date().toISOString(),
      raw_metadata: {
        stripe_customer_id: customer.id,
        subscription_status: subscription.status,
        payment_method: subscription.default_payment_method
      },
      updated_at: new Date().toISOString(),
    };

    // Update subscriptions table
    const { error: upsertError } = await supabaseClient
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (upsertError) {
      logStep("Error updating subscription", { error: upsertError });
      throw upsertError;
    }

    logStep("Subscription updated successfully", {
      userId: profile.id,
      subscriptionId: subscription.id,
      status: isActive ? 'active' : 'inactive',
      planName,
      planPrice,
      expiresAt
    });

  } catch (error) {
    logStep("Error in handleSubscriptionEvent", { error });
    throw error;
  }
}

async function handleInvoiceEvent(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Processing invoice event", { 
    eventType: event.type, 
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    status: invoice.status
  });

  if (!invoice.subscription) {
    logStep("Invoice not related to subscription, skipping");
    return;
  }

  try {
    // Get subscription to update status
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    
    // Process as subscription event to keep data in sync
    const mockEvent = {
      ...event,
      type: 'customer.subscription.updated',
      data: { object: subscription }
    } as Stripe.Event;
    
    await handleSubscriptionEvent(mockEvent, supabaseClient, stripe);
    
  } catch (error) {
    logStep("Error in handleInvoiceEvent", { error });
    throw error;
  }
}

async function handleCheckoutCompleted(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const session = event.data.object as Stripe.Checkout.Session;
  logStep("Processing checkout session completed", { 
    sessionId: session.id,
    mode: session.mode,
    customerId: session.customer,
    paymentStatus: session.payment_status
  });

  try {
    // ✅ ERRO 2 FIX: Idempotência - verificar se já processamos este evento
    const { data: existingEvent } = await supabaseClient
      .from("webhook_events")
      .select("id")
      .eq("event_id", event.id)
      .maybeSingle();
      
    if (existingEvent) {
      logStep(`Event ${event.id} already processed, skipping`);
      return;
    }
    
    // Salvar evento para idempotência
    await supabaseClient.from("webhook_events").insert({
      event_id: event.id,
      provider: "stripe",
      event_type: event.type,
      payload: event,
    });
    
    // If this is a subscription checkout, the subscription events will handle it
    if (session.mode === 'subscription') {
      logStep("Subscription checkout completed, subscription events will handle the update");
      return;
    }

    // ✅ ERRO 2 FIX: Para pedidos (não assinaturas), confirmar automaticamente
    if (session.mode === 'payment' && session.metadata?.order_id) {
      const orderId = session.metadata.order_id;
      
      let orderStatus = 'pending';
      let paymentStatus = 'pending';
      
      if (session.payment_status === 'paid') {
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
      } else if (session.payment_status === 'unpaid') {
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
      }

      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          payment_method: 'credit_card',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        logStep("Error updating order from checkout", { error: updateError, orderId });
        throw updateError;
      }

      logStep("✅ Order confirmed automatically from checkout", {
        orderId,
        orderStatus,
        paymentStatus,
        sessionId: session.id
      });
    }
    
  } catch (error) {
    logStep("Error in handleCheckoutCompleted", { error });
    throw error;
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, supabaseClient: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  logStep("Processing payment intent succeeded", { paymentIntentId: paymentIntent.id });

  try {
    // Idempotência
    const { data: existingEvent } = await supabaseClient
      .from("webhook_events")
      .select("id")
      .eq("event_id", event.id)
      .maybeSingle();
      
    if (existingEvent) {
      logStep(`Event ${event.id} already processed`);
      return;
    }
    
    const orderId = paymentIntent.metadata?.order_id;
    
    if (orderId) {
      await supabaseClient
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
        
      logStep("✅ Order confirmed from payment_intent.succeeded", { orderId });
    }
    
    // Salvar evento
    await supabaseClient.from("webhook_events").insert({
      event_id: event.id,
      provider: "stripe",
      event_type: event.type,
      order_id: orderId,
      payload: event,
    });
  } catch (error) {
    logStep("Error in handlePaymentIntentSucceeded", { error });
    throw error;
  }
}

async function handlePaymentIntentFailed(event: Stripe.Event, supabaseClient: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.order_id;
  
  if (orderId) {
    await supabaseClient
      .from('orders')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
      
    logStep("Order payment marked as failed", { orderId });
  }
}
