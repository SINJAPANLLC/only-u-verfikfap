"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user.firebaseUser.getIdToken();
        const res = await fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        setData(await res.json());
      } catch (err: any) {
        console.error("admin overview error", err);
        setError(err?.message ?? "ロードに失敗しました");
      }
    }
    void load();
  }, [user]);

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="space-y-3">
          <div className="tag-pill">ADMIN DASHBOARD</div>
          <h1 className="text-3xl font-semibold">運営ダッシュボード</h1>
          <p className="text-sm text-neutral-500">全体指標と最新アクティビティを確認できます。</p>
        </div>
      </section>

      {error && <div className="glass-card p-5 text-sm text-red-200">{error}</div>}

      <section className="glass-card grid gap-6 p-6 text-neutral-900 md:grid-cols-3">
        <div className="rounded-2xl border border-white/30 bg-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Pending Requests</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-900/90">{data?.totalRequests ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/30 bg-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Recent Purchases</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-900/90">{data?.recentPurchases?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/30 bg-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Live Sessions</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-900/90">{data?.liveSessions?.length ?? 0}</p>
        </div>
      </section>

      <section className="glass-card space-y-4 p-6 text-neutral-900">
        <h2 className="section-title text-2xl">最近のライブセッション</h2>
        <div className="space-y-3">
          {data?.liveSessions?.map((session: any) => (
            <div key={session.sessionId} className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm">
              <p className="font-semibold text-neutral-900/90">{session.title ?? "Untitled"}</p>
              <p className="text-xs text-neutral-500">ステータス: {session.status}</p>
              <p className="text-xs text-neutral-500">レート: ¥{session.ratePerMinute}/分</p>
            </div>
          ))}
          {!data?.liveSessions?.length && <p className="text-sm text-neutral-400">データなし</p>}
        </div>
      </section>

      <section className="glass-card space-y-4 p-6 text-neutral-900">
        <h2 className="section-title text-2xl">最新の購入</h2>
        <div className="space-y-3">
          {data?.recentPurchases?.map((purchase: any) => (
            <div key={purchase.purchaseId ?? purchase.stripePaymentIntentId} className="rounded-2xl border border-white/30 bg-white/10 p-4 text-sm">
              <p className="font-semibold text-neutral-900/90">Amount: ¥{(purchase.amount ?? 0).toLocaleString()}</p>
              <p className="text-xs text-neutral-500">Status: {purchase.status}</p>
            </div>
          ))}
          {!data?.recentPurchases?.length && <p className="text-sm text-neutral-400">データなし</p>}
        </div>
      </section>
    </div>
  );
}
