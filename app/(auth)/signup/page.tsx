"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { z } from "zod";

import { useAuth } from "@/components/providers/AuthProvider";
import { auth, db } from "@/lib/firebase.client";

const schema = z.object({
  displayName: z.string().min(2, "2文字以上で入力してください").max(30, "30文字以内で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "8文字以上のパスワードを設定してください")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "英字と数字を含めてください")
});

export default function SignUpPage() {
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
      displayName: String(formData.get("displayName") ?? "").trim(),
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
      const credential = await createUserWithEmailAndPassword(
        auth,
        parsed.data.email,
        parsed.data.password
      );

      await updateProfile(credential.user, {
        displayName: parsed.data.displayName
      });

      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        roles: ["fan"],
        profile: {
          displayName: parsed.data.displayName,
          avatarUrl: credential.user.photoURL ?? "",
          bio: "",
          links: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      router.push("/");
    } catch (error: any) {
      console.error("Sign up error", error);
      setFormError(
        error?.code === "auth/email-already-in-use"
          ? "このメールアドレスは既に使用されています。"
          : "登録に失敗しました。時間をおいて再度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card mx-auto w-full max-w-md space-y-6 p-8 text-neutral-900">
      <div className="space-y-3 text-center">
        <div className="tag-pill mx-auto max-w-max">JOIN ONLY-U</div>
        <h1 className="text-2xl font-semibold">新規アカウント登録</h1>
        <p className="text-sm text-neutral-500">ライブ・コンテンツ・マッチングの体験を始めましょう</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-xs font-medium text-neutral-500">
            表示名
          </label>
          <input id="displayName" name="displayName" type="text" required placeholder="ONLY-U Fan" />
        </div>

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
          <input id="password" name="password" type="password" required placeholder="英数字8文字以上" />
          <p className="text-[11px] text-neutral-400">※ 8文字以上で英字と数字を含めてください。</p>
        </div>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <button type="submit" disabled={loading} className="brand-button w-full">
          {loading ? "登録中..." : "アカウントを作成"}
        </button>
      </form>

      <p className="text-center text-xs text-neutral-500">
        既にアカウントをお持ちの方は
        <Link href="/signin" className="ml-1 text-pink-500">
          ログイン
        </Link>
      </p>
    </div>
  );
}
