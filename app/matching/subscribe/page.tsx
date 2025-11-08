"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";

const planNames: Record<string, string> = {
  basic: "Basic",
  plus: "Plus",
  premium: "Premium"
};

export default function MatchingSubscribePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const plan = params.get("plan") ?? "basic";
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/signin");
    }
  }, [router, user]);

  const subscribe = async () => {
    if (!user) return;
    if (!customerId) {
      setError("Stripe カスタマーIDを入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const idToken = await user.firebaseUser.getIdToken();
      const response = await fetch("/api/matching", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ plan, customerId })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setMessage("サブスクを作成しました。決済完了後にマッチングフォームが利用できます。");
      setCustomerId("");
    } catch (err: any) {
      console.error("subscribe error", err);
      setError(err?.message ?? "サブスク作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card mx-auto w-full max-w-xl space-y-6 p-8 text-neutral-900">
      <div className="space-y-3">
        <div className="tag-pill">SUBSCRIPTION</div>
        <h1 className="text-3xl font-semibold">{planNames[plan] ?? plan} プランを購読</h1>
        <p className="text-sm text-neutral-500">
          Stripe カスタマーIDを入力し、購入を続行してください。決済完了後にマッチングフォームが開放されます。
        </p>
      </div>

      <div className="space-y-4 text-sm">
        <label className="space-y-2 text-xs font-medium text-neutral-500">
          Stripe カスタマーID
          <input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            placeholder="cus_xxx"
          />
        </label>

        {message && <p className="text-xs text-green-600">{message}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}

        <button onClick={subscribe} disabled={loading} className="brand-button w-full justify-center">
          {loading ? "処理中..." : "サブスクを開始"}
        </button>

        <p className="text-[11px] text-neutral-400">
          ※ Stripe Customer ID は管理ダッシュボードから払い出してください。
        </p>
      </div>
    </div>
  );
}
