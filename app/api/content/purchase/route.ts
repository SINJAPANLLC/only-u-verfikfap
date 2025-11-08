import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { stripe } from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebase.admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PurchaseBody = {
  contentId: string;
};

const PLATFORM_FEE_RATE = 0.15;
const TAX_RATE = 0.1;

export async function POST(req: Request) {
  const authorization = headers().get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const idToken = authorization.replace("Bearer ", "").trim();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch (error) {
    console.error("purchase verify error", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  let body: PurchaseBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.contentId) {
    return new NextResponse("Missing contentId", { status: 400 });
  }

  try {
    const contentSnap = await adminDb.collection("contents").doc(body.contentId).get();
    if (!contentSnap.exists) {
      return new NextResponse("Content not found", { status: 404 });
    }

    const content = contentSnap.data();
    if (content?.status !== "published") {
      return new NextResponse("Content not available", { status: 400 });
    }

    const price = Number(content.price ?? 0);
    if (!Number.isInteger(price) || price <= 0) {
      return new NextResponse("Invalid content price", { status: 400 });
    }

    const baseAmount = price;
    const platformFee = Math.floor(baseAmount * PLATFORM_FEE_RATE);
    const tax = Math.floor(baseAmount * TAX_RATE);
    const total = baseAmount + tax;

    const purchaseId = randomUUID();

    await adminDb.collection("purchases").doc(purchaseId).set({
      purchaseId,
      buyerUid: decoded.uid,
      creatorUid: content.creatorUid ?? null,
      contentId: body.contentId,
      amount: total,
      baseAmount,
      platformFee,
      tax,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    const transferData = content.creatorConnectId || content.creatorAccountId
      ? { destination: String(content.creatorConnectId || content.creatorAccountId) }
      : undefined;

    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: "jpy",
      application_fee_amount: platformFee,
      transfer_data: transferData,
      metadata: {
        type: "content",
        contentId: body.contentId,
        purchaseId,
        buyerUid: decoded.uid,
        creatorUid: content.creatorUid ?? ""
      }
    });

    await adminDb
      .collection("purchases")
      .doc(purchaseId)
      .update({ stripePaymentIntentId: intent.id });

    return NextResponse.json({ client_secret: intent.client_secret, purchaseId });
  } catch (error) {
    console.error("content purchase error", error);
    return new NextResponse("Payment initiation failed", { status: 500 });
  }
}
