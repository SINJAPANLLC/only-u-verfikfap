"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/providers/AuthProvider";

type Message = {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
};

export default function MatchingChatPage({ params }: { params: { matchId: string } }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        author: "system",
        text: "チャット機能は今後強化予定です。ここではメッセージの送受信が表示されます。",
        createdAt: new Date()
      }
    ]);
  }, []);

  if (!user) {
    return (
      <div className="glass-card px-4 py-10 text-center text-sm text-neutral-200">
        チャットを利用するにはログインが必要です。
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag-pill">MATCH CHAT</div>
            <h1 className="mt-3 text-3xl font-semibold">Match ID: {params.matchId}</h1>
            <p className="text-sm text-neutral-500">
              近日中にリアルタイムチャット機能を実装予定です。現在はサンプルメッセージが表示されています。
            </p>
          </div>
          <Link href="/matching/dashboard" className="brand-outline">
            ダッシュボードへ
          </Link>
        </div>
      </section>

      <div className="glass-card space-y-5 p-6 text-neutral-900">
        <div className="rounded-3xl border border-white/25 bg-white/10 p-4 text-xs text-neutral-500">
          チャットは近日中に Firestore または LiveKit DataTrack と接続してリアルタイム化されます。
        </div>

        <div className="min-h-[320px] space-y-3 rounded-3xl border border-white/25 bg-white/10 p-4">
          {messages.map((message) => (
            <div key={message.id} className="rounded-2xl bg-white/20 px-4 py-3 text-sm text-neutral-800">
              <p className="text-[11px] uppercase tracking-widest text-neutral-500">{message.author}</p>
              <p className="mt-1 whitespace-pre-wrap">{message.text}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input) return;
            setMessages((prev) => [
              ...prev,
              { id: String(Date.now()), author: user.email ?? "you", text: input, createdAt: new Date() }
            ]);
            setInput("");
          }}
          className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-neutral-900 focus:outline-none"
            placeholder="メッセージを入力..."
          />
        </form>
      </div>
    </div>
  );
}
