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
    console.error("admin overview verify", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  if (!roles.includes("admin")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const [requestsSnap, liveSnap, salesSnap] = await Promise.all([
      adminDb.collection("matchRequests").where("status", "==", "pending").get(),
      adminDb.collection("liveSessions").orderBy("updatedAt", "desc").limit(5).get(),
      adminDb.collection("purchases").orderBy("createdAt", "desc").limit(5).get()
    ]);

    const totalRequests = requestsSnap.size;
    const liveSessions = liveSnap.docs.map((doc) => doc.data());
    const recentPurchases = salesSnap.docs.map((doc) => doc.data());

    return NextResponse.json({
      totalRequests,
      liveSessions,
      recentPurchases
    });
  } catch (error) {
    console.error("admin overview error", error);
    return new NextResponse("Failed to load overview", { status: 500 });
  }
}
