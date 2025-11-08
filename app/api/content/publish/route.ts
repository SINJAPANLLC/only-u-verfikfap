import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebase.admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishBody = {
  contentId: string;
  status: "published" | "unpublished";
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
    console.error("publish verify error", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  if (!(roles.includes("creator") || roles.includes("admin"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let body: PublishBody;
  try {
    body = await req.json();
  } catch (error) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.contentId) {
    return new NextResponse("Missing contentId", { status: 400 });
  }

  if (!["published", "unpublished"].includes(body.status)) {
    return new NextResponse("Invalid status", { status: 400 });
  }

  try {
    const contentRef = adminDb.collection("contents").doc(body.contentId);
    const snapshot = await contentRef.get();

    if (!snapshot.exists) {
      return new NextResponse("Not found", { status: 404 });
    }

    const data = snapshot.data();

    if (!roles.includes("admin") && data?.creatorUid !== decoded.uid) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await contentRef.update({
      status: body.status,
      publishedAt: body.status === "published" ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("publish error", error);
    return new NextResponse("Failed to update", { status: 500 });
  }
}
