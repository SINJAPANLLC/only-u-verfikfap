import Link from "next/link";

import { adminDb } from "@/lib/firebase.admin";

async function fetchContents() {
  const snapshot = await adminDb
    .collection("contents")
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .limit(24)
    .get();

  return snapshot.docs.map((doc) => doc.data() as any);
}

export default async function ContentIndexPage() {
  const contents = await fetchContents();

  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag-pill">VOD LIBRARY</div>
            <h1 className="mt-3 text-3xl font-semibold">コンテンツ一覧</h1>
            <p className="text-sm text-neutral-500">ライブの余韻や限定アーカイブをいつでも楽しめます。</p>
          </div>
          <Link href="/content/new" className="brand-button">
            コンテンツを投稿
          </Link>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => (
            <div key={content.contentId} className="group overflow-hidden rounded-3xl bg-white/10">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={content.asset?.cdnUrl ?? "/thumb.jpg"}
                  alt={content.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <span className="tag-pill absolute left-4 top-4 bg-black/40 text-white">
                  ¥{(content.price ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="space-y-3 p-5 text-neutral-900">
                <h2 className="text-lg font-semibold text-neutral-900/90">{content.title}</h2>
                <p className="text-sm text-neutral-600">
                  {content.description ?? "クリエイターの限定コンテンツをチェックしましょう。"}
                </p>
                <Link href={`/content/${content.contentId}`} className="brand-outline">
                  詳細を見る
                </Link>
              </div>
            </div>
          ))}
          {contents.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted">
              まだ公開中のコンテンツがありません。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
