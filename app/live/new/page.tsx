"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LiveNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setError("ログインが必要です");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      ratePerMinute: Number(formData.get("ratePerMinute") ?? 0),
      agencyFeeRate: Number(formData.get("agencyFeeRate") ?? 0)
    };

    if (!payload.title) {
      setError("タイトルは必須です");
      return;
    }

    if (!payload.ratePerMinute || payload.ratePerMinute < 100) {
      setError("レートは100円以上で入力してください");
      return;
    }

    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      const idToken = await user.firebaseUser.getIdToken();
      const response = await fetch("/api/livekit/start", {
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

      const data = await response.json();
      setStatus("ライブセッションを開始しました");
      router.push(`/live/${data.sessionId}/host`);
    } catch (err: any) {
      console.error("live start error", err);
      setError(err?.message ?? "ライブ開始に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["creator", "admin"]}>
      <div className="glass-card mx-auto w-full max-w-3xl space-y-6 p-8 text-neutral-900">
        <div className="space-y-3">
          <div className="tag-pill">LIVE SETUP</div>
          <h1 className="text-3xl font-semibold">新しいライブを開始</h1>
          <p className="text-sm text-neutral-500">タイトルとレートを設定してライブを開始しましょう。</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-xs font-medium text-neutral-500">
              タイトル
            </label>
            <input id="title" name="title" type="text" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="ratePerMinute" className="text-xs font-medium text-neutral-500">
              レート (円/分)
            </label>
            <input id="ratePerMinute" name="ratePerMinute" type="number" min={100} step={10} required />
          </div>

          <div className="space-y-2">
            <label htmlFor="agencyFeeRate" className="text-xs font-medium text-neutral-500">
              代理店フィー (%)
            </label>
            <input id="agencyFeeRate" name="agencyFeeRate" type="number" min={0} max={100} step={1} defaultValue={0} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-500">ヒント</label>
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4 text-xs text-neutral-500">
              ・ライブ開始後、配信者画面から視聴者トークンを発行できます。
              <br />・レートは税抜価格として計算され、プラットフォーム/代理店フィーが自動加算されます。
            </div>
          </div>

          {error && <p className="text-xs text-red-500 md:col-span-2">{error}</p>}
          {status && <p className="text-xs text-green-600 md:col-span-2">{status}</p>}

          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="brand-button w-full justify-center">
              {loading ? "作成中..." : "ライブを開始"}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
