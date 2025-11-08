# ONLY-U

Fan × Creator × Live × Matching プラットフォームの Next.js 商用スタックです。

## 開発セットアップ

```bash
npm install
npm run dev
npm run lint
npm run type-check
```

## 環境変数

`.env.example` をコピーして `.env.local` を作成し、Firebase / Stripe / Bunny / LiveKit / Redis の値を設定してください。

## デプロイ

Hostinger 環境で `deploy/deploy.sh` を実行します。

```bash
bash deploy/deploy.sh
```
### Firebase ルール/インデックス

```bash
export FIREBASE_PROJECT_ID=onlyu-prod
./deploy/firebase-init.sh
```


## 認証

- `/signup`: メール/パスワードによる新規登録フォーム。
- `/signin`: 既存ユーザーのログインフォーム。
- `/profile`: プロフィール編集・ロール申請ページ。


## コンテンツ課金

- `/content`: 公開中コンテンツの一覧
- `/content/[id]`: コンテンツ詳細・購入
- `/content/new`: クリエイターのアップロードフォーム (要 Creator/Admin ロール)
- `/api/content/upload`: Bunny CDN へ転送してドラフト作成
- `/api/content/purchase`: Stripe PaymentIntent を作成し購入フローを開始
- `deploy/firebase-init.sh`: Firestore インデックスをデプロイしてクエリ性能を確保


## ライブ配信

- `/live`: ライブ一覧・視聴/配信者導線
- `/live/new`: クリエイターのライブ開始フォーム
- `/live/[id]`: 視聴者向けライブ視聴ページ
- `/live/[id]/host`: 配信者向けコントロールページ
- `/api/livekit/start|end|token|billing`: LiveKit トークン発行と分課金処理


## マッチング

- `/matching/plans`: プラン紹介ページ
- `/matching/subscribe`: サブスク購読フォーム
- `/matching/request`: マッチングリクエスト送信
- `/matching/dashboard`: リクエスト状況と承認管理
- `/matching/chat/[matchId]`: チャットUI
- `/api/matching/request|matches|approve`: マッチング API


## 管理・監視

- `/admin`: 運営ダッシュボード (要 admin ロール)
- `/admin/requests`: 審査キュー管理
- `/admin/reports`: レポート (仮)
- `.env`: `SENTRY_DSN` / `SENDGRID_API_KEY` を設定してエラー通知・メール通知を有効化
- `deploy/ops/report.sh`: Stripe/ライブ利用サマリを出力
- `deploy/ops/cleanup.js`: 古いデータのクリーンアップ


## QA / リリース

- QA: `./deploy/verify.sh` で lint / type-check / build
- 手動チェックリスト: `docs/phase7-qa.md`
- リリース手順: `docs/release-checklist.md`
- 運用スクリプト: `deploy/ops/report.sh`, `deploy/ops/cleanup.js`

