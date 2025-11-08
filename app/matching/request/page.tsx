"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";

export default function MatchingRequestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="px-4 py-10 text-center text-sm text-neutral-500">
        マッチングリクエストにはログインが必要です。<Link href="/signin" className="ml-1 text-brand">ログイン</Link>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      preferredCreatorId: String(formData.get("preferredCreatorId") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim()
    };

    try {
      const idToken = await user.firebaseUser.getIdToken();
      const response = await fetch("/api/matching/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStatus("マッチングリクエストを送信しました。結果をお待ちください。");
      (event.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      console.error("matching request error", err);
      if (err?.message?.includes("Active subscription")) {
        setError("有効なサブスクが必要です。プランを購読してください。");
      } else {
        setError(err?.message ?? "送信に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-xl font-semibold">マッチングリクエスト</h1>
      <p className="mt-2 text-sm text-neutral-500">
        希望するクリエイターや自己アピールを記載してください。運営または代理店が内容を確認し、ご連絡いたします。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="preferredCreatorId" className="block text-xs font-medium text-neutral-600">
            希望クリエイターID (任意)
          </label>
          <input
            id="preferredCreatorId"
            name="preferredCreatorId"
            type="text"
            placeholder="creator_123"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-medium text-neutral-600">
            メッセージ / 自己紹介
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            placeholder="ご希望のプラン、自己アピール、活動内容など"
          />
        </div>

        {status && <p className="text-xs text-green-600">{status}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "送信中..." : "リクエストを送信"}
        </button>

        <p className="text-[11px] text-neutral-400">
          ※ 有効なサブスクがない場合、先に<Link href="/matching/plans" className="ml-1 text-brand">プラン</Link>を購読してください。
        </p>
      </form>
    </div>
  );
}
