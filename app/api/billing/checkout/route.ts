import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

// Initialize Stripe with secret key (read from environment)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planName } = await req.json();
    if (!planName || (planName !== "Pro" && planName !== "Unlimited")) {
      return NextResponse.json({ error: "Invalid plan name" }, { status: 400 });
    }

    const priceAmount = planName === "Pro" ? 1900 : 4900; // $19.00 or $49.00
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create session with dynamic price definition (no hardcoded Price/Plan IDs)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${planName} Plan`,
              description: planName === "Pro" 
                ? "Maximum 25 AI job applications per day" 
                : "Unlimited AI job applications per day",
              metadata: {
                plan: planName,
              },
            },
            unit_amount: priceAmount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/billing`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planName: planName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
