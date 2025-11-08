import Link from "next/link";

import { adminDb } from "@/lib/firebase.admin";

async function fetchLiveSessions() {
  const snapshot = await adminDb
    .collection("liveSessions")
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => doc.data() as any);
}

export default async function LiveIndexPage() {
  const sessions = await fetchLiveSessions();

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag-pill">LIVE ARENA</div>
            <h1 className="mt-3 text-3xl font-semibold">ライブ配信</h1>
            <p className="text-sm text-neutral-500">配信を開始したり、現在のライブをチェックできます。</p>
          </div>
          <Link href="/live/new" className="brand-button">
            ライブを開始
          </Link>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {sessions.map((session) => (
            <div key={session.sessionId} className="rounded-3xl bg-white/10 p-6 text-neutral-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-neutral-500">{session.status}</p>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-900/90">{session.title ?? "Untitled Live"}</h2>
                </div>
                <Link href={`/live/${session.sessionId}`} className="brand-button">
                  視聴する
                </Link>
              </div>

              <div className="mt-5 grid gap-2 text-xs text-neutral-500 md:grid-cols-2">
                <span>レート: ¥{session.ratePerMinute}/分</span>
                <span>トークン発行: {session.tokensIssued ?? 0}</span>
                <span>合計視聴時間: {session.billing?.totalMinutes ?? 0} 分</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/live/${session.sessionId}/host`} className="brand-outline">
                  配信者画面へ
                </Link>
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted">
              まだライブ配信はありません。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
