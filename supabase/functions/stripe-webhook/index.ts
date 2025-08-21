import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    logStep("Keys verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No signature provided");

    // Get raw body
    const body = await req.text();
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err: any) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400 
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription event", { 
          subscriptionId: subscription.id, 
          customerId: subscription.customer,
          status: subscription.status 
        });

        // Get customer info
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer || customer.deleted) {
          throw new Error("Customer not found");
        }

        const customerEmail = (customer as Stripe.Customer).email;
        if (!customerEmail) {
          throw new Error("Customer email not found");
        }

        // Get user by email
        const { data: authData, error: authError } = await supabaseClient.auth.admin.listUsers();
        if (authError) throw authError;

        const user = authData.users.find(u => u.email === customerEmail);
        if (!user) {
          logStep("User not found for email", { email: customerEmail });
          throw new Error(`User not found for email: ${customerEmail}`);
        }

        // Determine plan details
        let planName = 'Mensal';
        let planPrice = 9.90;
        
        if (subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          
          if (amount === 100) {
            planName = "Trial";
            planPrice = 1.00;
          } else if (amount === 9990) {
            planName = "Anual";
            planPrice = 99.90;
          }
        }

        const subscriptionData = {
          user_id: user.id,
          stripe_subscription_id: subscription.id,
          status: subscription.status === 'active' ? 'active' : 'inactive',
          plan_name: planName,
          plan_price: planPrice,
          started_at: subscription.status === 'active' ? new Date().toISOString() : null,
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Upsert subscription
        const { error: upsertError } = await supabaseClient
          .from('subscriptions')
          .upsert(subscriptionData, { onConflict: 'user_id' });

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError });
          throw upsertError;
        }

        logStep("Subscription updated successfully", { userId: user.id, status: subscriptionData.status });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { subscriptionId: subscription.id });

        // Update subscription to inactive
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'inactive',
            expires_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          logStep("Error updating subscription to inactive", { error: updateError });
          throw updateError;
        }

        logStep("Subscription cancelled successfully", { subscriptionId: subscription.id });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          logStep("Processing successful payment", { 
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid 
          });

          // Update subscription status to active if payment succeeded
          const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (updateError) {
            logStep("Error updating subscription after payment", { error: updateError });
            throw updateError;
          }

          logStep("Subscription activated after payment", { subscriptionId: invoice.subscription });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          logStep("Processing failed payment", { 
            subscriptionId: invoice.subscription,
            amount: invoice.amount_due 
          });

          // Update subscription status to past_due if payment failed
          const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription);

          if (updateError) {
            logStep("Error updating subscription after failed payment", { error: updateError });
            throw updateError;
          }

          logStep("Subscription marked as past_due", { subscriptionId: invoice.subscription });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});