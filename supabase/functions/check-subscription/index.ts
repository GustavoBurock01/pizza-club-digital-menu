
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        status: 'inactive',
        plan_name: 'Nenhum',
        plan_price: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        status: 'inactive',
        plan_name: 'Nenhum',
        plan_price: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let planName = 'Nenhum';
    let planPrice = 0;
    let expiresAt = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: expiresAt });
      
      // Determine plan details from price_id using env secrets
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
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
      
      logStep("Determined subscription plan", { priceId, amount, planName, planPrice });
    } else {
      logStep("No active subscription found");
    }

    // Update Supabase subscriptions table with new columns
    await supabaseClient.from("subscriptions").upsert({
      user_id: user.id,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: hasActiveSub ? subscription.items.data[0].price.id : null,
      status: hasActiveSub ? 'active' : 'inactive',
      plan_name: planName,
      plan_price: planPrice,
      expires_at: expiresAt,
      sync_status: 'manual',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      status: hasActiveSub ? 'active' : 'inactive',
      planName, 
      planPrice 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      status: hasActiveSub ? 'active' : 'inactive',
      plan_name: planName,
      plan_price: planPrice,
      expires_at: expiresAt
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
