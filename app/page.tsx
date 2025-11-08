"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [livers, setLivers] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);

  useEffect(() => {
    setVideos([
      { id: "1", title: "Starlight Session", thumbnail: "/thumb.jpg", tag: "LIVE" },
      { id: "2", title: "Behind the Glow", thumbnail: "/thumb.jpg", tag: "VOD" }
    ]);
    setLivers([{ id: "L1", name: "Mizuki", avatar: "/user.jpg" }]);
    setCreators([{ id: "C1", name: "Kazuya", avatar: "/user.jpg" }]);
  }, []);

  return (
    <div className="space-y-10">
      <section className="glass-card p-8 md:p-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <div className="tag-pill">FAN × CREATOR × LIVE × MATCHING</div>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              心を惹きつけるライブとコンテンツで、
              <span className="section-title"> ファンと創り手がひとつに。</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted md:text-base">
              ONLY-U はライブ配信、オンデマンドコンテンツ、マッチング体験を一つに束ねた商用プラットフォームです。洗練されたライブ演出と透明性のある課金モデルで、ファンとクリエイター双方の体験をアップデートします。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/live" className="brand-button">
                ライブを探す
              </Link>
              <Link href="/matching/plans" className="brand-outline">
                マッチングプランを見る
              </Link>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="glass-card h-48 w-full overflow-hidden rounded-3xl border-none bg-transparent p-0 shadow-inner">
              <video
                className="h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                poster="/thumb.jpg"
              >
                <source src="/demo.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted">
              <span className="tag-pill">ライブ課金</span>
              <span className="tag-pill">Stripe Connect</span>
              <span className="tag-pill">LiveKit</span>
              <span className="tag-pill">Bunny CDN</span>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="tag-pill">NEW CONTENTS</p>
            <h2 className="section-title text-2xl">新着コンテンツ</h2>
            <p className="text-sm text-muted">ライブの余韻を残すアフタームービーや限定コンテンツ</p>
          </div>
          <Link href="/content" className="brand-outline">
            すべて見る
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="group overflow-hidden rounded-2xl bg-white/10">
              <div className="relative h-48 overflow-hidden">
                <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <span className="tag-pill absolute left-4 top-4 bg-black/40 backdrop-blur">{v.tag}</span>
              </div>
              <div className="space-y-2 p-5 text-neutral-900">
                <h3 className="text-lg font-semibold text-neutral-900/90">{v.title}</h3>
                <p className="text-sm text-neutral-600">ライブのハイライトをダイジェストでチェック。</p>
                <Link href={`/content/${v.id}`} className="brand-outline">
                  詳細を見る
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="section-title text-2xl">注目ライバー</h2>
        <p className="mt-1 text-sm text-muted">ひときわ輝く配信者たち</p>
        <div className="mt-5 flex flex-wrap gap-5">
          {livers.map((u) => (
            <div key={u.id} className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-300 via-fuchsia-400 to-purple-500 blur" />
                <img src={u.avatar} alt={u.name} className="relative h-20 w-20 rounded-full border-2 border-white/40 object-cover" />
              </div>
              <p className="text-sm text-neutral-100">{u.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <h2 className="section-title text-2xl">人気クリエイター</h2>
        <p className="mt-1 text-sm text-muted">マッチングでつながるパートナー</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {creators.map((u) => (
            <div key={u.id} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
              <img src={u.avatar} alt={u.name} className="h-14 w-14 rounded-full border border-white/30 object-cover" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-neutral-900/90">{u.name}</p>
                <p className="text-xs text-neutral-500">ライブ制作・企画 / コラボ受付中</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
