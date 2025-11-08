"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export function AuthGuard({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-neutral-500">
        認証状態を確認しています...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm">このページを利用するにはログインが必要です。</p>
        <Link
          href="/signin"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
        >
          サインインへ
        </Link>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.some((role) => user.roles.includes(role as any))) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm">権限がありません。別のアカウントでログインしてください。</p>
      </div>
    );
  }

  return <>{children}</>;
}
