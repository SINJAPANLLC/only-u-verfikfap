"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const navLinks = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/content", label: "コンテンツ", icon: "🎬" },
  { href: "/live", label: "ライブ", icon: "🎤" },
  { href: "/matching/plans", label: "マッチング", icon: "🤝" },
  { href: "/profile", label: "プロフィール", icon: "👤" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    navLinks.forEach((link) => {
      map[link.href] = pathname === link.href || pathname.startsWith(`${link.href}/`);
    });
    return map;
  }, [pathname]);

  return (
    <div className="app-shell">
      <div className="app-device">
        <header className="app-header">
          <div className="app-header-brand">
            <img src="/icons/logo-72.png" alt="ONLY-U" className="app-header-logo" />
            <span className="app-header-sub">Fan × Creator × Live × Matching</span>
          </div>
          <div className="app-header-actions">
            <span className="app-header-dot" />
            <span className="app-header-dot" />
          </div>
        </header>
        <main className="app-main">
          <div className="app-main-inner">{children}</div>
        </main>
        <nav className="app-bottom-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`app-bottom-link ${activeMap[link.href] ? "active" : ""}`}
            >
              <span className="app-bottom-icon" aria-hidden>
                {link.icon}
              </span>
              <span className="app-bottom-label">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
