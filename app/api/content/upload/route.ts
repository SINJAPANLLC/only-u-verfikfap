import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { uploadBunny } from "@/lib/bunny";
import { adminAuth, adminDb } from "@/lib/firebase.admin";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["video/mp4", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 500 * 1024 * 1024; // 500MB

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
    console.error("upload verify error", error);
    return new NextResponse("Invalid token", { status: 401 });
  }

  const roles = Array.isArray(decoded.roles) ? decoded.roles : [];
  if (!(roles.includes("creator") || roles.includes("admin"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const price = Number(form.get("price") ?? 0);
  const categoriesRaw = String(form.get("categories") ?? "").trim();

  if (!file || typeof file === "string") {
    return new NextResponse("Missing file", { status: 400 });
  }

  if (!title) {
    return new NextResponse("Missing title", { status: 400 });
  }

  if (Number.isNaN(price) || price < 100) {
    return new NextResponse("Invalid price", { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new NextResponse("Unsupported file type", { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_BYTES) {
    return new NextResponse("File too large", { status: 400 });
  }

  const contentId = randomUUID();
  const extension = file.name.split(".").pop();
  const storagePath = `content/${decoded.uid}/${contentId}.${extension ?? "bin"}`;

  try {
    const cdnUrl = await uploadBunny(storagePath, arrayBuffer);
    const categories = categoriesRaw
      ? categoriesRaw.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    await adminDb.collection("contents").doc(contentId).set({
      contentId,
      creatorUid: decoded.uid,
      title,
      description,
      price,
      currency: "JPY",
      status: "draft",
      categories,
      asset: {
        type: file.type.startsWith("video") ? "video" : "image",
        storagePath,
        cdnUrl,
        size: arrayBuffer.byteLength
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    await writeAuditLog("content.upload", { contentId, creatorUid: decoded.uid, path: storagePath });
    return NextResponse.json({ contentId, cdnUrl });
  } catch (error) {
    console.error("content upload error", error);
    return new NextResponse("Upload failed", { status: 500 });
  }
}
