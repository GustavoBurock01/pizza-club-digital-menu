import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

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

    // Verify webhook signature if secret is available
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified", { eventType: event.type });
      } catch (err: any) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Parse event without verification (for testing)
      event = JSON.parse(body) as Stripe.Event;
      logStep("WARNING: Processing webhook without signature verification", { eventType: event.type });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event, supabaseClient, stripe);
        break;
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await handleInvoiceEvent(event, supabaseClient, stripe);
        break;
      case 'checkout.session.completed':
        await handleCheckoutEvent(event, supabaseClient, stripe);
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

    // Determine plan details from price_id
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    
    let planName = 'Desconhecido';
    let planPrice = 0;
    
    // Map by price_id from secrets
    const trialPriceId = Deno.env.get("STRIPE_PRICE_ID_TRIAL");
    const monthlyPriceId = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
    const annualPriceId = Deno.env.get("STRIPE_PRICE_ID_ANNUAL");
    
    if (priceId === trialPriceId) {
      planName = "Trial";
      planPrice = 1.00;
    } else if (priceId === monthlyPriceId) {
      planName = "Mensal";
      planPrice = 9.90;
    } else if (priceId === annualPriceId) {
      planName = "Anual";
      planPrice = 99.90;
    } else {
      // Fallback para compatibilidade
      if (amount === 100) {
        planName = "Trial";
        planPrice = 1.00;
      } else if (amount === 990) {
        planName = "Mensal";
        planPrice = 9.90;
      } else if (amount === 9990) {
        planName = "Anual";
        planPrice = 99.90;
      }
    }

    const isActive = subscription.status === 'active';
    const expiresAt = isActive ? new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Update subscriptions table
    const { error: upsertError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: profile.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: isActive ? 'active' : 'inactive',
        plan_name: planName,
        plan_price: planPrice,
        expires_at: expiresAt,
        sync_status: 'webhook',
        last_webhook_event: event.type,
        webhook_event_id: event.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      logStep("Error updating subscription", { error: upsertError });
      throw upsertError;
    }

    logStep("Subscription updated successfully", {
      userId: profile.id,
      subscriptionId: subscription.id,
      status: isActive ? 'active' : 'inactive',
      planName,
      planPrice
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

async function handleCheckoutEvent(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const session = event.data.object as Stripe.Checkout.Session;
  logStep("Processing checkout session completed", { 
    eventType: event.type, 
    sessionId: session.id,
    customerId: session.customer,
    paymentStatus: session.payment_status
  });

  try {
    // For order payments (not subscriptions)
    if (session.mode === 'payment' && session.metadata?.order_id) {
      const orderId = session.metadata.order_id;
      
      // Update order status based on payment status
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

      logStep("Order updated from checkout session", {
        orderId,
        orderStatus,
        paymentStatus,
        sessionId: session.id
      });
    }
    
  } catch (error) {
    logStep("Error in handleCheckoutEvent", { error });
    throw error;
  }
}
