import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase.admin";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EndBody = {
  sessionId: string;
  summary?: {
    totalMinutes: number;
    totalViewers?: number;
  };
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
    console.error("live end verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  let body: EndBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  const sessionRef = adminDb.collection("liveSessions").doc(body.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    return new NextResponse("Not found", { status: 404 });
  }

  const session = sessionSnap.data();

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];

  if (session?.creatorUid !== decoded.uid && !roles.includes("admin")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    await sessionRef.update({
      status: "ended",
      billing: {
        ...(session?.billing ?? {}),
        totalMinutes: body.summary?.totalMinutes ?? session?.billing?.totalMinutes ?? 0
      },
      summary: body.summary ?? null,
      endedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    await writeAuditLog("live.end", { sessionId: body.sessionId, uid: decoded.uid });
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("live end error", error);
    return new NextResponse("Failed to end session", { status: 500 });
  }
}
