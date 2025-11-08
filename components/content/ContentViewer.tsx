"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";

export function ContentViewer({
  contentId,
  price,
  currency,
  previewUrl
}: {
  contentId: string;
  price: number;
  currency: string;
  previewUrl?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }
      try {
        const token = await user.firebaseUser.getIdToken();
        const response = await fetch(`/api/content/access?contentId=${contentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          setHasAccess(false);
          return;
        }

        const data = await response.json();
        setHasAccess(Boolean(data.access));
      } catch (error) {
        console.error("access check failed", error);
        setHasAccess(false);
      }
    };

    void checkAccess();
  }, [contentId, user]);

  const handlePurchase = async () => {
    if (!user) {
      router.push("/signin");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = await user.firebaseUser.getIdToken();
      const response = await fetch("/api/content/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contentId })
      });

      if (!response.ok) {
        throw new Error(`Purchase failed ${response.status}`);
      }

      const data = await response.json();
      setClientSecret(data.client_secret ?? null);
      setMessage("決済を続行するためにクレジットカード情報を入力してください。Stripe Dashboard で確認できます。");
    } catch (error) {
      console.error("purchase error", error);
      setMessage("購入処理に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-neutral-900">
      <div className="rounded-2xl border border-white/30 bg-white/10 p-5 text-sm text-neutral-100">
        <p className="text-xs uppercase tracking-widest text-neutral-300">価格</p>
        <p className="mt-1 text-3xl font-semibold text-white">¥{price.toLocaleString()}</p>
        <p className="text-xs text-neutral-300">税込 / {currency}</p>
      </div>

      {hasAccess ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-500/15 px-4 py-3 text-xs text-emerald-200">
          購入済みです。いつでも視聴できます。
        </div>
      ) : (
        <button onClick={handlePurchase} disabled={loading} className="brand-button w-full justify-center">
          {loading ? "処理中..." : "購入して視聴する"}
        </button>
      )}

      {!user && (
        <p className="text-xs text-neutral-400">
          視聴するにはアカウントが必要です。<span className="ml-1 text-pink-300">ログイン / サインアップ</span> を行ってください。
        </p>
      )}

      {message && <p className="text-xs text-neutral-300">{message}</p>}
      {clientSecret && (
        <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-[11px] text-neutral-200">
          PaymentIntent Client Secret: <span className="break-all">{clientSecret}</span>
        </div>
      )}

      {previewUrl && (
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-xs text-neutral-200">
          <p className="font-semibold text-neutral-100">プレビューURL</p>
          <p className="mt-1 break-all">{previewUrl}</p>
        </div>
      )}
    </div>
  );
}
