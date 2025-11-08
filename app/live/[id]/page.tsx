"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveKitClient } from "@/components/live/useLiveKitClient";

export default function LiveViewerPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        if (!user) {
          setError("ライブ視聴にはログインが必要です");
          return;
        }
        const idToken = await user.firebaseUser.getIdToken();
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify({ sessionId: params.id, role: "viewer" })
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        setToken(data.token);
        setUrl(data.url);
      } catch (err: any) {
        console.error("viewer token error", err);
        setError(err?.message ?? "トークン取得に失敗しました");
      }
    }

    void fetchToken();
  }, [params.id, user]);

  const { room, error: roomError } = useLiveKitClient({
    token: token ?? "",
    url: url ?? "",
    autoPublish: false
  });

  const combinedError = error || roomError;

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag-pill">LIVE VIEW</div>
            <h1 className="mt-3 text-3xl font-semibold">ライブ視聴</h1>
            <p className="text-sm text-neutral-200">リアルタイムのライブ配信に参加しましょう。</p>
          </div>
          <Link href="/live" className="brand-outline">
            ライブ一覧へ
          </Link>
        </div>
      </section>

      {combinedError && (
        <div className="glass-card p-5 text-sm text-red-200">
          {combinedError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="glass-card flex min-h-[360px] items-center justify-center overflow-hidden bg-black/40 text-sm text-neutral-200">
          {room ? "ライブ視聴に接続しました。映像/音声をお楽しみください。" : "接続中..."}
        </div>

        <aside className="glass-card space-y-5 p-6 text-neutral-900">
          <div className="rounded-2xl border border-white/25 bg-white/10 p-4 text-xs text-neutral-200">
            視聴時間に応じて分課金が発生します。配信終了後に購入履歴ページへ記録されます。
          </div>

          <button className="brand-button w-full justify-center" onClick={() => alert("ギフト機能は今後実装予定です")}
          >
            ギフトを送る
          </button>
          <button className="brand-outline w-full justify-center" onClick={() => alert("視聴を終了しました")}
          >
            視聴を終了
          </button>
        </aside>
      </div>
    </div>
  );
}
