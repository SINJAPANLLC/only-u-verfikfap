"use client";

import { FormEvent, useState } from "react";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ContentNewPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError("ログインが必要です");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      setError("ファイルを選択してください");
      return;
    }

    setUploading(true);
    setError(null);
    setStatus(null);

    try {
      const token = await user.firebaseUser.getIdToken();
      const response = await fetch("/api/content/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      setStatus(`アップロードしました。コンテンツID: ${data.contentId}`);
      (event.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      console.error("upload error", err);
      setError("アップロードに失敗しました: " + (err?.message ?? "unknown"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["creator", "admin"]}>
      <div className="glass-card mx-auto w-full max-w-3xl space-y-6 p-8 text-neutral-900">
        <div className="space-y-3 text-left">
          <div className="tag-pill max-w-max">CONTENT UPLOAD</div>
          <h1 className="text-3xl font-semibold">コンテンツを投稿</h1>
          <p className="text-sm text-neutral-500">Bunny CDN を通じて高品質なコンテンツを提供できます。</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-xs font-medium text-neutral-500">
              タイトル
            </label>
            <input id="title" name="title" type="text" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="price" className="text-xs font-medium text-neutral-500">
              価格 (JPY)
            </label>
            <input id="price" name="price" type="number" min={100} step={100} required />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="description" className="text-xs font-medium text-neutral-500">
              説明
            </label>
            <textarea id="description" name="description" rows={4} />
          </div>

          <div className="space-y-2">
            <label htmlFor="categories" className="text-xs font-medium text-neutral-500">
              カテゴリ (カンマ区切り)
            </label>
            <input id="categories" name="categories" type="text" placeholder="music,live" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-500">ファイル</label>
            <input
              name="file"
              type="file"
              accept="video/mp4,image/jpeg,image/png,image/webp"
              required
              className="rounded-full border border-dashed border-white/40 bg-transparent p-3 text-xs"
            />
            <p className="text-[11px] text-neutral-400">最大 500MB / MP4, JPG, PNG, WEBP</p>
          </div>

          {error && <p className="text-xs text-red-500 md:col-span-2">{error}</p>}
          {status && <p className="text-xs text-green-600 md:col-span-2">{status}</p>}

          <div className="md:col-span-2">
            <button type="submit" disabled={uploading} className="brand-button w-full justify-center">
              {uploading ? "アップロード中..." : "アップロード"}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
