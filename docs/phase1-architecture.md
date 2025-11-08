# ONLY-U フェーズ1 基盤設計

## 1. プロジェクト概要
- Fan × Creator × Live × Matching を統合する商用プラットフォーム。
- Next.js (App Router) + Firebase + Stripe Connect + LiveKit + Bunny CDN + Redis (Upstash)。
- ユーザーロール: ファン、クリエイター、代理店、運営管理者。

## 2. ロールと権限
| ロール | 主な権限 |
|--------|----------|
| ファン | コンテンツ購入、ライブ視聴、マッチング申込、メッセージ送信 |
| クリエイター | コンテンツアップロード、ライブ配信、売上確認、プロフィール管理 |
| 代理店 | 所属クリエイター管理、ライブ分配設定、レポート確認 |
| 運営管理者 | 全体監視、承認・審査、収益配分設定、コンテンツモデレーション |

## 3. サービス構成
- Next.js: フロントエンド + API Routes (サーバーアクション)。
- Firebase: Auth (+ Identity Platform), Firestore, Storage, Cloud Functions (Webhook、バッチ処理)。
- Stripe Connect: プラットフォーム課金、クリエイター/代理店への分配。
- LiveKit: リアルタイム配信、音声/映像データ。
- Bunny CDN: VOD コンテンツ配信、ライブ録画保存。
- Upstash Redis: キャッシュ、レートリミット、リアルタイム presence。
- その他: SendGrid (メール), Sentry (監視), Vercel Analytics or Plausible。

## 4. Firestore データモデリング（初期案）
```
users/{uid}
  role: "fan" | "creator" | "agency" | "admin"
  profile: {
    displayName, avatarUrl, bio, socials, ...
  }
  onboardingStatus: "pending" | "approved" | ...

creators/{creatorId}
  ownerUid
  agencyId
  stripeAccountId
  liveStatus
  metrics: {...}

agencies/{agencyId}
  ownerUid
  members: [creatorId]

contents/{contentId}
  creatorId
  creatorUid
  title, description, price, type: "vod" | "downloadable"
  asset: { storagePath, cdnUrl }
  status: "draft" | "published" | "review_required"

purchases/{purchaseId}
  buyerUid
  contentId | liveSessionId
  amount, fees, tax, net
  stripePaymentIntentId
  status

liveSessions/{sessionId}
  creatorId
  roomName
  scheduledAt, startedAt, endedAt
  pricing: { ratePerMinute, viewerFee, agencyFee }

subscriptions/{subscriptionId}
  customerUid
  plan: "basic" | "plus" | "premium"
  stripeSubscriptionId
  status

matches/{matchId}
  fanUid
  creatorId
  status: "pending" | "accepted" | "rejected"
  notes

notifications/{notificationId}
  targetUid
  type, payload, read
```

## 5. Stripe Connect 設計
- クリエイター/代理店ともに Standard Connect アカウント。
- 代理店は `agencyFee` を運営が徴収後に別途 `stripe.transfers` で配分。
- 決済フロー:
  1. ファン側から Payment Intent 作成（プラットフォームが作成）。
  2. `application_fee_amount` に プラットフォームフィー + 代理店フィー。
  3. `transfer_data.destination` にクリエイターアカウント。
  4. Webhook (`checkout.session.completed`, `payment_intent.succeeded`) で Firestore を更新。

## 6. LiveKit 設計
- ルーム命名: `creator_{creatorId}_{timestamp}`。
- トークン発行 API (Next.js route) が管理。
- 役割: `host`, `cohost`, `viewer`。
- 分課金: Firebase Functions で分単位集計し Stripe Usage Record へ反映。
- 録画: LiveKit Cloud 連携 or 自前 S3 バックアップ。初期はオンデマンド録画なし。

## 7. セキュリティ
- Firebase Auth + Custom Claims でロール管理。
- Firestore Security Rules をロールベースで制御。
- Stripe Webhook Secret 検証。
- LiveKit API Key/Secret はサーバーサイドのみ。
- Redis 機密キーは Edge Runtime では使用しない。

## 8. 環境構成
- `.env.example` に主要キーを定義済み。
- Secret Manager (Hostinger) or GitHub Actions Secrets で本番・ステージング分離。
- Firebase プロジェクト: `onlyu-prod`, `onlyu-stg` を用意。

## 9. 今後のステップ
1. Firebase プロジェクト設定スクリプト作成。
2. Firestore Security Rules/Indexes のドラフト作成。
3. Stripe Webhook ハンドラーの Next.js API 実装。
4. CI (GitHub Actions) で lint/test/build、自動デプロイ連携。

```
フェーズ1進捗: 設計ドキュメント初版の作成。
```

## 10. Stripe Webhook 実装概要
- エンドポイント: `app/api/stripe/webhook/route.ts`
- Node.js ランタイム必須 (App Router)。
- 署名検証後に `purchases` および `subscriptions` コレクションを更新。
- `metadata.purchaseId` / `metadata.subscriptionId` を優先使用し、未設定時は Stripe ID をキーに利用。
- 失敗時は 500 を返し、Stripe 側で再試行可能にする。

## 11. CI / デプロイ戦略
- GitHub Actions (`.github/workflows/ci.yml`) で lint / type-check / build を自動実行。
- アーティファクトとして `.next` を保存し、Hostinger へのデプロイに活用可能。
- Hostinger では `deploy/deploy.sh` を使用し PM2 + Nginx + Certbot を自動構成。
- Firebase ルール/インデックスは `deploy/firebase-init.sh` で CLI 配備。
- Secrets は GitHub `ONLYU_*`、Hostinger 環境変数、Firebase Config で管理。
