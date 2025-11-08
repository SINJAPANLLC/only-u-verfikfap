import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase.admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Query = {
  contentId?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const authorization = headers().get("authorization");

  if (!contentId) {
    return new NextResponse("Missing contentId", { status: 400 });
  }

  if (!authorization?.startsWith("Bearer ")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const idToken = authorization.replace("Bearer ", "").trim();

  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const uid = decoded.uid;

    const contentSnap = await adminDb.collection("contents").doc(contentId).get();
    if (!contentSnap.exists) {
      return new NextResponse("Not found", { status: 404 });
    }

    const content = contentSnap.data();
    if (content?.creatorUid === uid || (Array.isArray(decoded.roles) && decoded.roles.includes("admin"))) {
      return NextResponse.json({ access: true, reason: "owner" });
    }

    const purchasesSnap = await adminDb
      .collection("purchases")
      .where("buyerUid", "==", uid)
      .where("contentId", "==", contentId)
      .where("status", "==", "succeeded")
      .limit(1)
      .get();

    if (!purchasesSnap.empty) {
      return NextResponse.json({ access: true, reason: "purchased" });
    }

    return NextResponse.json({ access: false });
  } catch (error) {
    console.error("access check error", error);
    return new NextResponse("Error", { status: 500 });
  }
}
