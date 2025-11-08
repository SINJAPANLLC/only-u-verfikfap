import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase.admin";

const allowedRoles = ["creator", "agency"] as const;
type AllowedRole = (typeof allowedRoles)[number];

type RequestBody = {
  desiredRole: AllowedRole;
  motivation?: string;
};

export async function POST(req: Request) {
  const authorization = headers().get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const idToken = authorization.replace("Bearer ", "").trim();

  let payload: RequestBody;
  try {
    payload = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!allowedRoles.includes(payload.desiredRole)) {
    return new NextResponse("Invalid desiredRole", { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const uid = decoded.uid;

    const requestRef = adminDb.collection("roleRequests").doc(`${uid}_${Date.now()}`);
    await requestRef.set({
      uid,
      email: decoded.email ?? null,
      desiredRole: payload.desiredRole,
      motivation: payload.motivation ?? "",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("role request error", error);
    return new NextResponse("Unable to process role request", { status: 500 });
  }
}
