import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

import { adminAuth, adminDb } from "@/lib/firebase.admin";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StartBody = {
  title: string;
  ratePerMinute: number;
  agencyFeeRate?: number;
};

export async function POST(req: Request) {
  const authHeader = headers().get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const idToken = authHeader.replace("Bearer ", "").trim();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch (error) {
    console.error("live start verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  if (!(roles.includes("creator") || roles.includes("admin"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let body: StartBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.title) {
    return new NextResponse("Missing title", { status: 400 });
  }

  if (!body.ratePerMinute || body.ratePerMinute <= 0) {
    return new NextResponse("Invalid rate", { status: 400 });
  }

  const sessionId = randomUUID();
  const roomName = `onlyu_${decoded.uid}_${Date.now()}`;

  try {
    await adminDb.collection("liveSessions").doc(sessionId).set({
      sessionId,
      creatorUid: decoded.uid,
      title: body.title,
      ratePerMinute: body.ratePerMinute,
      agencyFeeRate: body.agencyFeeRate ?? 0,
      status: "live",
      roomName,
      billing: {
        totalMinutes: 0,
        lastUsageReportedAt: null
      },
      tokensIssued: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    await writeAuditLog("live.start", { sessionId, uid: decoded.uid });
    return NextResponse.json({ sessionId, roomName });
  } catch (error) {
    console.error("live start error", error);
    return new NextResponse("Failed to start session", { status: 500 });
  }
}
