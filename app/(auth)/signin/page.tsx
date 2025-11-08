"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { z } from "zod";

import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase.client";

const schema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "8文字以上のパスワードを設定してください")
});

export default function SignInPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? "")
    };

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.errors[0]?.message ?? "入力内容を確認してください");
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      router.push("/");
    } catch (error: any) {
      console.error("Sign in error", error);
      setFormError(
        error?.code === "auth/user-not-found"
          ? "ユーザーが見つかりません。サインアップしてください。"
          : "サインインに失敗しました。もう一度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card mx-auto w-full max-w-md space-y-6 p-8 text-neutral-900">
      <div className="space-y-3 text-center">
        <div className="tag-pill mx-auto max-w-max">WELCOME BACK</div>
        <h1 className="text-2xl font-semibold">ONLY-U にログイン</h1>
        <p className="text-sm text-neutral-500">ライブ、コンテンツ、マッチングのすべてにアクセス</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-medium text-neutral-500">
            メールアドレス
          </label>
          <input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-medium text-neutral-500">
            パスワード
          </label>
          <input id="password" name="password" type="password" required placeholder="********" />
        </div>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <button type="submit" disabled={loading} className="brand-button w-full">
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="text-center text-xs text-neutral-500">
        アカウントをお持ちでない方は
        <Link href="/signup" className="ml-1 text-pink-500">
          新規登録
        </Link>
      </p>
    </div>
  );
}
