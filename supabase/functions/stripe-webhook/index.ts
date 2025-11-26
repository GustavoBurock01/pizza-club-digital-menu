import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/secure-logger.ts";

const logger = createLogger('STRIPE-WEBHOOK');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const validateEnvironment = (stripeKey: string) => {
  const isTestMode = stripeKey.startsWith('sk_test');
  const mode = isTestMode ? 'TEST' : 'PRODUCTION';
  logger.info(`RUNNING IN ${mode} MODE`);
  
  const priceIds = [
    { id: Deno.env.get("STRIPE_PRICE_ID_ANNUAL"), name: "ANNUAL" },
    { id: Deno.env.get("STRIPE_PRICE_ID_MONTHLY"), name: "MONTHLY" },
    { id: Deno.env.get("STRIPE_PRICE_ID_TRIAL"), name: "TRIAL" }
  ].filter(p => p.id);
  
  for (const price of priceIds) {
    const priceIsTest = price.id?.startsWith('price_test');
    if (priceIsTest === !isTestMode) {
      throw new Error(`Price ID mode mismatch: ${price.name} vs ${mode}`);
    }
  }
  
  return { isTestMode, mode };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.info("Webhook function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const env = validateEnvironment(stripeKey);
    logger.success("Stripe key verified", { mode: env.mode });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      logger.error("No signature found in headers");
      return new Response(JSON.stringify({ error: "No signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let event: Stripe.Event;

    if (!webhookSecret) {
      logger.error("CRITICAL: STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("PRODUCTION REQUIRES STRIPE_WEBHOOK_SECRET");
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logger.success("Webhook signature verified", { eventType: event.type, eventId: event.id });
    } catch (err: any) {
      logger.error("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

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
        logger.info("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionEvent(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const subscription = event.data.object as Stripe.Subscription;
  logger.info("Processing subscription event", { 
    eventType: event.type, 
    subscriptionId: subscription.id,
    status: subscription.status
  });

  const { data: existingEvent } = await supabaseClient
    .from('webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    logger.info("Event already processed, skipping", { eventId: event.id });
    return;
  }

  await supabaseClient
    .from('webhook_events')
    .insert({
      event_id: event.id,
      provider: 'stripe',
      event_type: event.type,
      payload: event
    });

  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
  if (!customer.email) {
    logger.warn("No email found for customer", { customerId: customer.id });
    return;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id, email')
    .eq('email', customer.email)
    .single();

  if (profileError || !profile) {
    logger.error("User not found in profiles", { email: customer.email });
    return;
  }

  if (!profile.stripe_customer_id) {
    await supabaseClient
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', profile.id);
    logger.success("Updated profile with stripe_customer_id");
  }

  const priceId = subscription.items.data[0].price.id;
  const price = await stripe.prices.retrieve(priceId);
  const planPrice = (price.unit_amount || 0) / 100;
  
  const trialPriceId = Deno.env.get("STRIPE_PRICE_ID_TRIAL");
  const monthlyPriceId = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
  const annualPriceId = Deno.env.get("STRIPE_PRICE_ID_ANNUAL");
  
  let planName = 'Desconhecido';
  if (priceId === annualPriceId) planName = "Anual";
  else if (priceId === monthlyPriceId) planName = "Mensal";
  else if (priceId === trialPriceId) planName = "Trial";

  const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  logger.info("Subscription details", { planName, planPrice, status: subscription.status, isActive });

  const subscriptionData = {
    user_id: profile.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status: isActive ? 'active' : 'inactive',
    plan_name: planName,
    plan_price: planPrice,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: expiresAt,
    expires_at: expiresAt,
    cancel_at_period_end: subscription.cancel_at_period_end,
    sync_status: 'stripe',
    last_webhook_event: event.type,
    webhook_event_id: event.id,
    last_synced_at: new Date().toISOString(),
    raw_metadata: {
      stripe_customer_id: customer.id,
      subscription_status: subscription.status
    },
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabaseClient
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' });

  if (upsertError) {
    logger.error("Error updating subscription", { error: upsertError });
    throw upsertError;
  }

  logger.success("Subscription updated successfully");

  try {
    await supabaseClient
      .channel(`subscription_${profile.id}`)
      .send({
        type: 'broadcast',
        event: 'subscription_updated',
        payload: { userId: profile.id, status: isActive ? 'active' : 'inactive', planName, expiresAt },
      });
    logger.info("Realtime broadcast sent");
  } catch (broadcastError) {
    logger.warn("Realtime broadcast failed", { error: broadcastError });
  }
}

async function handleInvoiceEvent(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const invoice = event.data.object as Stripe.Invoice;
  logger.info("Processing invoice event", { eventType: event.type, invoiceId: invoice.id });

  if (!invoice.subscription) {
    logger.info("Invoice not related to subscription, skipping");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const mockEvent = { ...event, type: 'customer.subscription.updated', data: { object: subscription } } as Stripe.Event;
  await handleSubscriptionEvent(mockEvent, supabaseClient, stripe);
}

async function handleCheckoutCompleted(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const session = event.data.object as Stripe.Checkout.Session;
  logger.info("Processing checkout session completed", { sessionId: session.id, mode: session.mode });

  const { data: existingEvent } = await supabaseClient
    .from("webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();
    
  if (existingEvent) {
    logger.info("Event already processed, skipping");
    return;
  }
  
  await supabaseClient.from("webhook_events").insert({
    event_id: event.id,
    provider: "stripe",
    event_type: event.type,
    payload: event,
  });
  
  if (session.mode === 'subscription') {
    logger.info("Subscription checkout completed");
    return;
  }

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
      .update({ status: orderStatus, payment_status: paymentStatus, payment_method: 'credit_card', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      logger.error("Error updating order from checkout", { error: updateError });
      throw updateError;
    }

    logger.success("Order confirmed automatically from checkout", { orderId, orderStatus });
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, supabaseClient: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  logger.info("Processing payment intent succeeded", { paymentIntentId: paymentIntent.id });

  const { data: existingEvent } = await supabaseClient
    .from("webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();
    
  if (existingEvent) {
    logger.info("Event already processed");
    return;
  }
  
  const orderId = paymentIntent.metadata?.order_id;
  
  if (orderId) {
    await supabaseClient
      .from('orders')
      .update({ status: 'confirmed', payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', orderId);
      
    logger.success("Order confirmed from payment_intent.succeeded", { orderId });
  }
  
  await supabaseClient.from("webhook_events").insert({
    event_id: event.id,
    provider: "stripe",
    event_type: event.type,
    order_id: orderId,
    payload: event,
  });
}

async function handlePaymentIntentFailed(event: Stripe.Event, supabaseClient: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.order_id;
  
  if (orderId) {
    await supabaseClient
      .from('orders')
      .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', orderId);
      
    logger.warn("Order payment marked as failed", { orderId });
  }
}
