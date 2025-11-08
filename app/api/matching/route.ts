import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebase.admin";

type PlanKey = "basic" | "plus" | "premium";

const prices: Record<PlanKey, string> = {
  basic: "price_basic",
  plus: "price_plus",
  premium: "price_premium"
};

export async function POST(req: Request) {
  const authHeader = headers().get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const idToken = authHeader.replace("Bearer ", "").trim();
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch (error) {
    console.error("matching subscribe verify", error);
    return new Response("Invalid token", { status: 401 });
  }

  const { plan, customerId } = await req.json();
  if (!plan || !customerId) {
    return new Response("Missing plan or customerId", { status: 400 });
  }

  const priceId = prices[plan as PlanKey];

  if (!priceId) {
    return new Response("Invalid plan", { status: 400 });
  }

  const sub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    metadata: { uid: decoded.uid, plan },
    expand: ["latest_invoice.payment_intent"]
  });

  await adminDb.collection("subscriptions").doc(sub.id).set(
    {
      customerUid: decoded.uid,
      status: sub.status,
      planId: priceId,
      stripeSubscriptionId: sub.id,
      createdAt: new Date()
    },
    { merge: true }
  );

  const paymentIntent = sub.latest_invoice?.payment_intent;

  if (!paymentIntent || typeof paymentIntent === "string") {
    return new Response("Unable to create payment intent", { status: 500 });
  }

  return Response.json({ client_secret: paymentIntent.client_secret });
}
