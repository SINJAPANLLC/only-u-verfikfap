"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveKitClient } from "@/components/live/useLiveKitClient";

export default function LiveHostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/signin");
      return;
    }

    async function fetchToken() {
      try {
        const idToken = await user.firebaseUser.getIdToken();
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify({ sessionId: params.id, role: "host" })
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        setToken(data.token);
        setUrl(data.url);
      } catch (err: any) {
        console.error("host token error", err);
        setError(err?.message ?? "トークン取得に失敗しました");
      }
    }

    void fetchToken();
  }, [params.id, router, user]);

  const { room, error: roomError } = useLiveKitClient({
    token: token ?? "",
    url: url ?? "",
    autoPublish: true
  });

  const combinedError = error || roomError;

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag-pill">LIVE BROADCAST</div>
            <h1 className="mt-3 text-3xl font-semibold">配信コントロール</h1>
            <p className="text-sm text-neutral-200">視聴者リンク共有・ライブ終了処理をここから行います。</p>
          </div>
          <Link href="/live" className="brand-outline">
            ライブ一覧へ戻る
          </Link>
        </div>
      </section>

      {combinedError && (
        <div className="glass-card p-5 text-sm text-red-200">{combinedError}</div>
      )}

      <div className="glass-card grid gap-10 p-8 text-neutral-900 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-5">
          <div className="rounded-3xl border border-white/30 bg-black/60 p-6 text-sm text-neutral-200">
            {room ? (
              <>
                <p className="text-xs uppercase tracking-widest text-neutral-400">LIVEKIT CONNECTED</p>
                <p className="mt-2 text-lg font-semibold text-white">ブラウザのカメラ/マイクを共有しています。</p>
                <p className="text-xs text-neutral-400">別ブラウザから視聴者としてアクセスし、配信を確認してください。</p>
              </>
            ) : (
              <p>接続中...</p>
            )}
          </div>
          <div className="grid gap-4 text-xs text-neutral-500 md:grid-cols-2">
            <div className="rounded-2xl border border-white/25 bg-white/10 p-4">
              <p className="font-semibold text-neutral-100">チェックリスト</p>
              <ul className="mt-2 space-y-1">
                <li>・ライト・カメラを確認</li>
                <li>・サウンドチェック</li>
                <li>・視聴リンクを共有</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/25 bg-white/10 p-4">
              <p className="font-semibold text-neutral-100">視聴者リンク</p>
              <p className="mt-2 break-all text-neutral-300">https://onlyu.jp/live/{params.id}</p>
            </div>
          </div>
        </div>

        <aside className="space-y-5 text-sm">
          <div className="rounded-2xl border border-white/25 bg-white/10 p-5 text-neutral-200">
            <p className="text-xs uppercase tracking-widest text-neutral-400">LIVE STATUS</p>
            <p className="mt-2 text-lg font-semibold text-white">視聴者動向を確認しながら進行してください。</p>
          </div>

          <button
            className="brand-button w-full justify-center"
            onClick={async () => {
              if (!user) return;
              try {
                const idToken = await user.firebaseUser.getIdToken();
                await fetch("/api/livekit/end", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`
                  },
                  body: JSON.stringify({ sessionId: params.id })
                });
                router.push("/live");
              } catch (err) {
                console.error("end error", err);
                setError("ライブ終了処理に失敗しました");
              }
            }}
          >
            ライブ終了
          </button>
        </aside>
      </div>
    </div>
  );
}
