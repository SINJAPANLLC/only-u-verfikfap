"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMetrics(await res.json());
      }
    }
    void load();
  }, [user]);

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="space-y-3">
          <div className="tag-pill">REPORTS</div>
          <h1 className="text-3xl font-semibold">レポート</h1>
          <p className="text-sm text-neutral-500">Stripe 売上やライブ利用状況を確認するための仮レポートです。</p>
        </div>
      </section>

      <section className="glass-card space-y-5 p-6 text-neutral-900">
        <h2 className="section-title text-2xl">Stripe 指標 (サンプル)</h2>
        <p className="text-sm text-neutral-500">本番環境では Stripe Report API やデータウェアハウスと連携してください。</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/30 bg-white/10 p-5 text-sm text-neutral-600">
            <p className="text-xs uppercase tracking-widest text-neutral-500">Pending Requests</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900/90">{metrics?.totalRequests ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/10 p-5 text-sm text-neutral-600">
            <p className="text-xs uppercase tracking-widest text-neutral-500">Recent Purchases</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900/90">{metrics?.recentPurchases?.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/10 p-5 text-sm text-neutral-600">
            <p className="text-xs uppercase tracking-widest text-neutral-500">Live Sessions</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900/90">{metrics?.liveSessions?.length ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-4 p-6 text-neutral-900">
        <h2 className="section-title text-2xl">監視 / 通知メモ</h2>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>・Sentry DSN を設定すると自動でエラーが集約されます。</li>
          <li>・SendGrid API Key を設定すると重要イベントのメール通知に利用できます。</li>
          <li>・`deploy/ops/report.sh` で日次レポートを生成できます。</li>
        </ul>
      </section>
    </div>
  );
}
