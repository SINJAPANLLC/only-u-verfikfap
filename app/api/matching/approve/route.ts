import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

import { adminAuth, adminDb } from "@/lib/firebase.admin";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApproveBody = {
  requestId: string;
  creatorUid?: string;
};

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
    console.error("approve verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];

  let body: ApproveBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.requestId) {
    return new NextResponse("Missing requestId", { status: 400 });
  }

  const requestRef = adminDb.collection("matchRequests").doc(body.requestId);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    return new NextResponse("Request not found", { status: 404 });
  }

  const request = requestSnap.data();

  if (request?.status !== "pending") {
    return new NextResponse("Request already processed", { status: 400 });
  }

  const creatorUid = body.creatorUid || request?.preferredCreatorId;

  if (!creatorUid) {
    return new NextResponse("Creator not specified", { status: 400 });
  }

  if (creatorUid !== decoded.uid && !roles.includes("admin")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const matchId = randomUUID();

  try {
    await adminDb.runTransaction(async (tx) => {
      const requestDoc = await tx.get(requestRef);
      if (!requestDoc.exists || requestDoc.data()?.status !== "pending") {
        throw new Error("Request already processed");
      }

      const matchRef = adminDb.collection("matches").doc(matchId);
      tx.set(matchRef, {
        matchId,
        fanUid: requestDoc.data()?.fanUid,
        creatorUid,
        status: "active",
        participants: [requestDoc.data()?.fanUid, creatorUid],
        chatRoomId: `chat_${matchId}`,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      tx.update(requestRef, {
        status: "approved",
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    await writeAuditLog("matching.approve", { matchId, requestId: body.requestId, approver: decoded.uid });
    return NextResponse.json({ matchId });
  } catch (error) {
    console.error("approve error", error);
    return new NextResponse("Failed to approve request", { status: 500 });
  }
}
