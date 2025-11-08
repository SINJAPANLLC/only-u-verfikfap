import { adminDb } from "@/lib/firebase.admin";

export async function writeAuditLog(action: string, data: Record<string, unknown>) {
  try {
    await adminDb.collection("auditLogs").add({
      action,
      data,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
