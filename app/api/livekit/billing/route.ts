import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase.admin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillingBody = {
  sessionId: string;
  minutes: number;
};

const STRIPE_SUBSCRIPTION_ITEM_ID = process.env.STRIPE_LIVE_SUBSCRIPTION_ITEM_ID;

export async function POST(req: Request) {
  const authHeader = headers().get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!STRIPE_SUBSCRIPTION_ITEM_ID) {
    return new NextResponse("Billing price not configured", { status: 500 });
  }

  const idToken = authHeader.replace("Bearer ", "").trim();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch (error) {
    console.error("billing verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  let body: BillingBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.sessionId || !body.minutes || body.minutes <= 0) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const sessionRef = adminDb.collection("liveSessions").doc(body.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    return new NextResponse("Session not found", { status: 404 });
  }

  const session = sessionSnap.data();
  if (session?.status !== "live") {
    return new NextResponse("Session not live", { status: 400 });
  }

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  if (session?.creatorUid !== decoded.uid && !roles.includes("admin")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(STRIPE_SUBSCRIPTION_ITEM_ID, {
      quantity: body.minutes,
      timestamp: Math.floor(Date.now() / 1000),
      action: "increment"
    });

    await sessionRef.update({
      billing: {
        ...(session.billing ?? {}),
        totalMinutes: (session.billing?.totalMinutes ?? 0) + body.minutes,
        lastUsageReportedAt: FieldValue.serverTimestamp()
      },
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ usageRecord });
  } catch (error) {
    console.error("billing error", error);
    return new NextResponse("Failed to record usage", { status: 500 });
  }
}
