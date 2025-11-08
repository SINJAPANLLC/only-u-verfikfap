"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/providers/AuthProvider";

type MatchItem = {
  matchId: string;
  creatorUid: string;
  fanUid: string;
  status: string;
  chatRoomId: string;
  updatedAt?: { seconds: number; nanoseconds: number };
};

type RequestItem = {
  requestId: string;
  status: string;
  preferredCreatorId?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

export default function MatchingDashboardPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [pending, setPending] = useState<RequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const idToken = await user.firebaseUser.getIdToken();
        const response = await fetch("/api/matching/matches", {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        setMatches(data.matches ?? []);
        setRequests(data.requests ?? []);
        setPending(data.pending ?? []);
      } catch (err: any) {
        console.error("dashboard error", err);
        setError(err?.message ?? "データ取得に失敗しました");
      }
    }

    void load();
  }, [user]);

  if (!user) {
    return (
      <div className="glass-card px-4 py-10 text-center text-sm text-neutral-200">
        マッチングダッシュボードにはログインが必要です。
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag-pill">MATCH DASHBOARD</div>
            <h1 className="mt-3 text-3xl font-semibold">マッチングダッシュボード</h1>
            <p className="text-sm text-neutral-500">進行中のマッチングや申請状況を確認できます。</p>
          </div>
          <Link href="/matching/request" className="brand-button">
            新規リクエスト
          </Link>
        </div>
      </section>

      {error && <div className="glass-card p-5 text-sm text-red-200">{error}</div>}

      <section className="glass-card space-y-5 p-6 text-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-2xl">マッチング</h2>
          <span className="tag-pill">{matches.length} 件</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <div key={match.matchId} className="rounded-2xl border border-white/30 bg-white/10 p-5">
              <p className="text-sm font-semibold text-neutral-900/90">Match ID: {match.matchId}</p>
              <p className="mt-1 text-xs text-neutral-500">クリエイター: {match.creatorUid}</p>
              <p className="text-xs text-neutral-500">ステータス: {match.status}</p>
              <Link href={`/matching/chat/${match.matchId}`} className="brand-outline mt-4 inline-flex">
                チャットへ
              </Link>
            </div>
          ))}
          {!matches.length && <p className="text-sm text-neutral-400">まだマッチングはありません。</p>}
        </div>
      </section>

      <section className="glass-card space-y-5 p-6 text-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="section-title text-2xl">送信したリクエスト</h2>
          <span className="tag-pill">{requests.length} 件</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <div key={request.requestId} className="rounded-2xl border border-white/30 bg-white/10 p-5 text-sm">
              <p className="font-semibold text-neutral-900/90">リクエストID: {request.requestId}</p>
              <p className="text-xs text-neutral-500">ステータス: {request.status}</p>
              {request.preferredCreatorId && (
                <p className="text-xs text-neutral-400">希望: {request.preferredCreatorId}</p>
              )}
            </div>
          ))}
          {!requests.length && <p className="text-sm text-neutral-400">送信したリクエストはありません。</p>}
        </div>
      </section>

      {pending.length > 0 && (
        <section className="glass-card space-y-5 p-6 text-neutral-900">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-2xl">あなた宛の未処理リクエスト</h2>
            <span className="tag-pill">{pending.length} 件</span>
          </div>
          <div className="space-y-3">
            {pending.map((request) => (
              <div key={request.requestId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/30 bg-white/10 p-4 text-sm">
                <div>
                  <p className="font-semibold text-neutral-900/90">リクエストID: {request.requestId}</p>
                  <p className="text-xs text-neutral-500">希望: {request.preferredCreatorId ?? "未指定"}</p>
                </div>
                <button
                  className="brand-button"
                  onClick={async () => {
                    try {
                      const idToken = await user.firebaseUser.getIdToken();
                      const response = await fetch("/api/matching/approve", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${idToken}`
                        },
                        body: JSON.stringify({ requestId: request.requestId })
                      });
                      if (!response.ok) {
                        throw new Error(await response.text());
                      }
                      window.location.reload();
                    } catch (err) {
                      console.error("approve error", err);
                      setError("承認に失敗しました");
                    }
                  }}
                >
                  承認
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
