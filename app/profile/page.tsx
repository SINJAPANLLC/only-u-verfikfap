"use client";

import { FormEvent, useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { z } from "zod";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase.client";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "2文字以上で入力してください")
    .max(30, "30文字以内で入力してください"),
  bio: z.string().max(280, "280文字以内で入力してください").optional(),
  avatarUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal(""))
});

const roleSchema = z.object({
  desiredRole: z.enum(["creator", "agency"]),
  motivation: z.string().max(500).optional()
});

export default function ProfilePage() {
  const { user, signOutUser } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const defaultDisplayName = user?.profile.displayName ?? user?.firebaseUser.displayName ?? "";
  const defaultBio = user?.profile.bio ?? "";
  const defaultAvatar = user?.profile.avatarUrl ?? "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      displayName: String(formData.get("displayName") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").slice(0, 280),
      avatarUrl: String(formData.get("avatarUrl") ?? "").trim()
    };

    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "入力内容を確認してください");
      setStatus(null);
      return;
    }

    setStatus(null);
    setError(null);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          profile: {
            displayName: parsed.data.displayName,
            bio: parsed.data.bio ?? "",
            avatarUrl: parsed.data.avatarUrl ?? ""
          },
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      await updateProfile(user.firebaseUser, {
        displayName: parsed.data.displayName,
        photoURL: parsed.data.avatarUrl || undefined
      });

      setStatus("プロフィールを更新しました。");
    } catch (err) {
      console.error("Profile update error", err);
      setError("プロフィールの更新に失敗しました。時間をおいて再度お試しください。");
    }
  };

  const handleRoleRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      desiredRole: String(formData.get("desiredRole") ?? ""),
      motivation: String(formData.get("motivation") ?? "").trim()
    };

    const parsed = roleSchema.safeParse(payload);
    if (!parsed.success) {
      setRoleError(parsed.error.errors[0]?.message ?? "申請内容を確認してください");
      setRoleMessage(null);
      return;
    }

    setRoleError(null);
    setRoleMessage(null);
    setRoleLoading(true);

    try {
      const token = await user.firebaseUser.getIdToken();
      const response = await fetch("/api/roles/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(parsed.data)
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      setRoleMessage("ロール申請を受け付けました。審査完了までお待ちください。");
      (event.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      console.error("Role request error", err);
      setRoleError("申請に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setRoleLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-10">
        <section className="glass-card p-8 text-neutral-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="tag-pill">MY PROFILE</div>
              <h1 className="mt-3 text-3xl font-semibold">プロフィール設定</h1>
              <p className="text-sm text-neutral-500">公開プロフィールとロール申請を管理します。</p>
            </div>
            <button onClick={() => signOutUser()} className="brand-outline">
              ログアウト
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-xs font-medium text-neutral-500">
                  表示名
                </label>
                <input id="displayName" name="displayName" type="text" defaultValue={defaultDisplayName} required />
              </div>

              <div className="space-y-2">
                <label htmlFor="avatarUrl" className="text-xs font-medium text-neutral-500">
                  アバターURL
                </label>
                <input
                  id="avatarUrl"
                  name="avatarUrl"
                  type="url"
                  placeholder="https://"
                  defaultValue={defaultAvatar}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {status && <p className="text-xs text-green-600">{status}</p>}

              <button type="submit" className="brand-button">
                保存する
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-xs font-medium text-neutral-500">
                自己紹介 (最大280文字)
              </label>
              <textarea id="bio" name="bio" defaultValue={defaultBio} rows={9} />
            </div>
          </form>
        </section>

        <section className="glass-card p-8 text-neutral-900">
          <h2 className="text-2xl font-semibold">ロール申請</h2>
          <p className="mt-2 text-sm text-neutral-500">
            クリエイター/代理店として活動する場合、以下のフォームから申請してください。運営が内容を確認後、承認時に通知します。
          </p>

          <form onSubmit={handleRoleRequest} className="mt-6 space-y-4 text-sm">
            <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-600">
              <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <input type="radio" name="desiredRole" value="creator" required /> クリエイター申請
              </label>
              <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <input type="radio" name="desiredRole" value="agency" required /> 代理店申請
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="motivation" className="text-xs font-medium text-neutral-500">
                活動内容・実績 (任意)
              </label>
              <textarea
                id="motivation"
                name="motivation"
                rows={4}
                placeholder="自己紹介や実績を記載してください"
              />
            </div>

            {roleError && <p className="text-xs text-red-500">{roleError}</p>}
            {roleMessage && <p className="text-xs text-green-600">{roleMessage}</p>}

            <button type="submit" disabled={roleLoading} className="brand-outline">
              {roleLoading ? "送信中..." : "申請を送信"}
            </button>
          </form>
        </section>
      </div>
    </AuthGuard>
  );
}
