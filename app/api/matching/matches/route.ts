import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase.admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authorization = headers().get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const idToken = authorization.replace("Bearer ", "").trim();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch (error) {
    console.error("matches verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  const uid = decoded.uid;
  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];

  try {
    const matchSnap = await adminDb
      .collection("matches")
      .where("participants", "array-contains", uid)
      .orderBy("updatedAt", "desc")
      .limit(20)
      .get();

    const matches = matchSnap.docs.map((doc) => doc.data());

    const requestSnap = await adminDb
      .collection("matchRequests")
      .where("fanUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const requests = requestSnap.docs.map((doc) => doc.data());

    const pendingSnap = roles.includes("creator")
      ? await adminDb
          .collection("matchRequests")
          .where("preferredCreatorId", "==", uid)
          .where("status", "==", "pending")
          .orderBy("createdAt", "desc")
          .limit(5)
          .get()
      : null;

    const pending = pendingSnap ? pendingSnap.docs.map((doc) => doc.data()) : [];

    return NextResponse.json({ matches, requests, pending });
  } catch (error) {
    console.error("matches fetch error", error);
    return new NextResponse("Failed to fetch matches", { status: 500 });
  }
}
