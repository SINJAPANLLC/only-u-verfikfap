import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

import { adminAuth, adminDb } from "@/lib/firebase.admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  preferredCreatorId?: string;
  message?: string;
};

async function hasActiveSubscription(uid: string) {
  const snap = await adminDb
    .collection("subscriptions")
    .where("customerUid", "==", uid)
    .where("status", "==", "active")
    .limit(1)
    .get();

  return !snap.empty ? snap.docs[0] : null;
}

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
    console.error("match request verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const subscriptionDoc = await hasActiveSubscription(decoded.uid);
  if (!subscriptionDoc) {
    return new NextResponse("Active subscription required", { status: 403 });
  }

  const requestId = randomUUID();

  try {
    await adminDb.collection("matchRequests").doc(requestId).set({
      requestId,
      fanUid: decoded.uid,
      preferredCreatorId: body.preferredCreatorId ?? null,
      message: body.message ?? "",
      status: "pending",
      subscriptionId: subscriptionDoc.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ requestId });
  } catch (error) {
    console.error("match request error", error);
    return new NextResponse("Unable to create request", { status: 500 });
  }
}
