import { headers } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { adminAuth, adminDb } from "@/lib/firebase.admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_SECRET = process.env.LIVEKIT_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

if (!LIVEKIT_API_KEY || !LIVEKIT_SECRET || !LIVEKIT_URL) {
  throw new Error("LiveKit 環境変数が不足しています");
}

type TokenBody = {
  sessionId: string;
  role: "host" | "viewer";
};

const TTL_SECONDS = 60 * 60; // 1 hour

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
    console.error("livekit token verify error", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  let body: TokenBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  if (!["host", "viewer"].includes(body.role)) {
    return new NextResponse("Invalid role", { status: 400 });
  }

  const sessionRef = adminDb.collection("liveSessions").doc(body.sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    return new NextResponse("Session not found", { status: 404 });
  }

  const session = sessionSnap.data();

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];

  if (body.role === "host") {
    if (!(roles.includes("creator") || roles.includes("admin"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (session?.creatorUid !== decoded.uid && !roles.includes("admin")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const grant = {
    iss: "onlyu-platform",
    sub: decoded.uid,
    aud: "livekit",
    exp: now + TTL_SECONDS,
    nbf: now,
    metadata: JSON.stringify({
      uid: decoded.uid,
      role: body.role
    }),
    video: {
      room: session?.roomName,
      room_join: true,
      can_publish: body.role === "host",
      can_subscribe: true
    }
  };

  const token = jwt.sign(grant, { key: LIVEKIT_SECRET, passphrase: "" }, { algorithm: "HS256", header: { kid: LIVEKIT_API_KEY } });

  await sessionRef.update({
    tokensIssued: (session?.tokensIssued ?? 0) + 1,
    updatedAt: new Date()
  });

  return NextResponse.json({ token, url: LIVEKIT_URL, room: session?.roomName });
}
