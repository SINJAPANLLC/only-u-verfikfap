import type { Metadata } from "next";
import "./globals.css";
import "@/lib/sentry.client";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ONLY-U",
  description: "Fan × Creator × Live × Matching プラットフォーム",
  themeColor: "#ff2d92",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent"
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
