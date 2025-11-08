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
    console.error("admin requests verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  if (!roles.includes("admin")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const [matchRequestsSnap, contentsSnap] = await Promise.all([
      adminDb.collection("matchRequests").where("status", "==", "pending").limit(20).get(),
      adminDb.collection("contents").where("status", "==", "review_required").limit(20).get()
    ]);

    return NextResponse.json({
      matchRequests: matchRequestsSnap.docs.map((doc) => doc.data()),
      contents: contentsSnap.docs.map((doc) => doc.data())
    });
  } catch (error) {
    console.error("admin requests error", error);
    return new NextResponse("Failed to fetch requests", { status: 500 });
  }
}
