"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user.firebaseUser.getIdToken();
        const res = await fetch("/api/admin/requests", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        setData(await res.json());
      } catch (err: any) {
        console.error("admin requests error", err);
        setError(err?.message ?? "取得に失敗しました");
      }
    }
    void load();
  }, [user]);

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="space-y-3">
          <div className="tag-pill">REVIEW QUEUE</div>
          <h1 className="text-3xl font-semibold">審査キュー</h1>
          <p className="text-sm text-neutral-500">マッチング申請とコンテンツ審査を管理します。</p>
        </div>
      </section>

      {error && <div className="glass-card p-5 text-sm text-red-200">{error}</div>}

      <section className="glass-card space-y-4 p-6 text-neutral-900">
        <h2 className="section-title text-2xl">マッチングリクエスト</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data?.matchRequests?.map((request: any) => (
            <div key={request.requestId} className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm">
              <p className="font-semibold text-neutral-900/90">リクエストID: {request.requestId}</p>
              <p className="text-xs text-neutral-500">Fan: {request.fanUid}</p>
              <p className="text-xs text-neutral-500">メッセージ: {request.message}</p>
            </div>
          ))}
          {!data?.matchRequests?.length && <p className="text-sm text-neutral-400">審査待ちのリクエストはありません。</p>}
        </div>
      </section>

      <section className="glass-card space-y-4 p-6 text-neutral-900">
        <h2 className="section-title text-2xl">コンテンツ審査</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data?.contents?.map((content: any) => (
            <div key={content.contentId} className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm">
              <p className="font-semibold text-neutral-900/90">タイトル: {content.title}</p>
              <p className="text-xs text-neutral-500">クリエイター: {content.creatorUid}</p>
              <p className="text-xs text-neutral-500">ステータス: {content.status}</p>
            </div>
          ))}
          {!data?.contents?.length && <p className="text-sm text-neutral-400">審査待ちのコンテンツはありません。</p>}
        </div>
      </section>
    </div>
  );
}
