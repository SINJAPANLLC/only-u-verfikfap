"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/signin");
      } else if (!user.roles.includes("admin")) {
        router.replace("/");
      }
    }
  }, [loading, router, user]);

  if (loading || !user?.roles.includes("admin")) {
    return <div className="px-4 py-10 text-center text-sm text-neutral-500">アクセスを確認しています...</div>;
  }

  return <>{children}</>;
}
