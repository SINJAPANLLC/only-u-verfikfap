import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase.admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  const updatedAt = new Date(intent.created * 1000);
  const purchaseId = intent.metadata.purchaseId ?? intent.id;

  const purchaseRef = adminDb.collection("purchases").doc(purchaseId);
  await purchaseRef.set(
    {
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      metadata: intent.metadata || {},
      stripePaymentIntentId: intent.id,
      updatedAt,
      receivedAt: new Date()
    },
    { merge: true }
  );
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const updatedAt = new Date(subscription.created * 1000);
  const subscriptionId = subscription.metadata.subscriptionId ?? subscription.id;

  const subscriptionRef = adminDb.collection("subscriptions").doc(subscriptionId);
  await subscriptionRef.set(
    {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      planId: subscription.items.data[0]?.price.id,
      stripeSubscriptionId: subscription.id,
      customerUid: subscription.metadata.uid ?? null,
      updatedAt,
      receivedAt: new Date()
    },
    { merge: true }
  );
}

export async function POST(req: Request) {
  const headerList = headers();
  const signature = headerList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse("Missing webhook configuration", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log("Unhandled Stripe event", event.type);
    }
  } catch (error) {
    console.error("Stripe webhook handler error", error);
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
