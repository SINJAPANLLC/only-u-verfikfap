import Link from "next/link";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 3000,
    perks: ["月1マッチング", "プロフィール診断", "チャット48時間"],
    highlight: "スターターに最適"
  },
  {
    id: "plus",
    name: "Plus",
    price: 6000,
    perks: ["月3マッチング", "運営コンシェルジュ", "チャット1週間", "限定イベント先行"],
    highlight: "人気 No.1"
  },
  {
    id: "premium",
    name: "Premium",
    price: 12000,
    perks: ["無制限マッチング", "専属マネージャー", "優先チャット", "シークレットイベント"],
    highlight: "VIP 体験"
  }
];

export default function MatchingPlansPage() {
  return (
    <div className="space-y-8">
      <section className="glass-card p-8 text-neutral-900">
        <div className="space-y-4 text-center">
          <div className="tag-pill mx-auto max-w-max">MATCHING SUBSCRIPTION</div>
          <h1 className="text-3xl font-semibold">ONLY-U マッチングプラン</h1>
          <p className="text-sm text-neutral-500">ファンとクリエイターの距離を縮めるためのサブスクプランです。</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card flex flex-col space-y-5 p-6 text-neutral-900">
            <div className="space-y-2">
              <p className="tag-pill w-max">{plan.highlight}</p>
              <h2 className="text-2xl font-semibold text-neutral-900/90">{plan.name}</h2>
              <p className="text-sm text-neutral-500">¥{plan.price.toLocaleString()} / 月</p>
            </div>
            <ul className="space-y-2 text-sm text-neutral-600">
              {plan.perks.map((perk) => (
                <li key={perk}>・{perk}</li>
              ))}
            </ul>
            <Link href={`/matching/subscribe?plan=${plan.id}`} className="brand-button justify-center">
              このプランを選ぶ
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
