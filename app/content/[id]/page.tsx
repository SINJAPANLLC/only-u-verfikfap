import Link from "next/link";
import { notFound } from "next/navigation";

import { adminDb } from "@/lib/firebase.admin";
import { ContentViewer } from "@/components/content/ContentViewer";

type ContentDoc = {
  contentId: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  status: string;
  asset?: {
    cdnUrl?: string;
    type?: string;
  };
};

async function getContent(id: string) {
  const snapshot = await adminDb.collection("contents").doc(id).get();
  if (!snapshot.exists) {
    return null;
  }
  return snapshot.data() as ContentDoc;
}

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const content = await getContent(params.id);

  if (!content || content.status !== "published") {
    notFound();
  }

  return (
    <div className="space-y-10">
      <section className="glass-card p-8 text-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag-pill">PREMIUM CONTENT</div>
            <h1 className="mt-3 text-3xl font-semibold">{content.title}</h1>
            <p className="text-sm text-neutral-500">
              {content.description ?? "クリエイターの限定コンテンツを視聴しましょう。"}
            </p>
          </div>
          <Link href="/content" className="brand-outline">
            一覧に戻る
          </Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="glass-card overflow-hidden text-neutral-900">
          {content.asset?.type === "video" ? (
            <video controls className="h-full w-full" src={content.asset?.cdnUrl} preload="metadata" />
          ) : content.asset?.cdnUrl ? (
            <img src={content.asset.cdnUrl} alt={content.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-white/10 text-sm text-neutral-500">
              PREVIEWなし
            </div>
          )}
        </div>

        <div className="glass-card p-6 text-neutral-900">
          <ContentViewer
            contentId={content.contentId}
            price={content.price}
            currency={content.currency}
            previewUrl={content.asset?.cdnUrl}
          />
        </div>
      </div>
    </div>
  );
}
