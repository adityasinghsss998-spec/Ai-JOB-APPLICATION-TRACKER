import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error("STRIPE_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Stripe configuration is missing on server" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2024-06-20" as any,
  });

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn("STRIPE_WEBHOOK_SECRET missing in development mode. Bypassing signature verification.");
        event = JSON.parse(body) as Stripe.Event;
      } else {
        return NextResponse.json({ error: "Missing webhook signature or secret" }, { status: 400 });
      }
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    console.log(`Received Stripe Webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName || "Free";

        if (!userId) {
          console.error("No userId found in checkout session metadata");
          break;
        }

        const subscriptionId = session.subscription as string;
        let periodStart = new Date().toISOString();
        let periodEnd = new Date().toISOString();

        if (subscriptionId) {
          const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
          periodStart = new Date(subscription.current_period_start * 1000).toISOString();
          periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        }

        const planLimit = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.Free;

        const { error } = await supabase
          .from("profiles" as any)
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            subscription_status: "active",
            plan_name: planName,
            plan_limit: planLimit,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", userId);

        if (error) {
          console.error("Error updating profile in checkout.session.completed:", error);
          return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
        }

        console.log(`Successfully subscribed user ${userId} to plan ${planName}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        
        // Find profile with this subscription ID
        const { data: profile, error: findError } = await supabase
          .from("profiles" as any)
          .select("id, plan_name")
          .eq("stripe_subscription_id", subscription.id)
          .single() as any;

        if (findError || !profile) {
          console.warn(`No user profile found for subscription update ID: ${subscription.id}`);
          break;
        }

        let planName = subscription.metadata?.planName || profile.plan_name;

        if (!subscription.metadata?.planName && subscription.items?.data?.[0]) {
          const prodId = subscription.items.data[0].price.product as string;
          const product = await stripe.products.retrieve(prodId);
          if (product.name.includes("Pro")) planName = "Pro";
          if (product.name.includes("Unlimited")) planName = "Unlimited";
        }

        const planLimit = PLAN_LIMITS[planName as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.Free;
        const freePlanLimit = PLAN_LIMITS.Free;
        const status = subscription.status;

        const { error: updateError } = await supabase
          .from("profiles" as any)
          .update({
            subscription_status: status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            payment_status: status === "active" ? "paid" : "unpaid",
            plan_name: status === "active" ? planName : "Free",
            plan_limit: status === "active" ? planLimit : freePlanLimit,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", profile.id);

        if (updateError) {
          console.error("Error updating profile in customer.subscription.updated:", updateError);
          return NextResponse.json({ error: "Failed to update profile subscription details" }, { status: 500 });
        }

        console.log(`Updated subscription details for user ${profile.id} to status: ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        const { data: profile, error: findError } = await supabase
          .from("profiles" as any)
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single() as any;

        if (findError || !profile) {
          console.warn(`No user profile found for subscription deletion ID: ${subscription.id}`);
          break;
        }

        // Reset user back to the Free plan
        const { error: resetError } = await supabase
          .from("profiles" as any)
          .update({
            plan_name: "Free",
            plan_limit: PLAN_LIMITS.Free,
            subscription_status: "canceled",
            payment_status: "unpaid",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", profile.id);

        if (resetError) {
          console.error("Error demoting profile on subscription deletion:", resetError);
          return NextResponse.json({ error: "Failed to demote user plan" }, { status: 500 });
        }

        console.log(`Demoted user ${profile.id} to Free plan due to subscription cancellation`);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook execution error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
