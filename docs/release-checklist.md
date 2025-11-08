# ONLY-U リリースチェックリスト

## 1. 事前準備
- [ ] 環境変数 (Firebase/Stripe/Bunny/LiveKit/Redis/Sentry/SendGrid) の最新化
- [ ] `npm run lint` / `npm run type-check` / `npm run build` 実行
- [ ] Firestore ルール/インデックスを最新化: `./deploy/firebase-init.sh`

## 2. 機能確認
- [ ] 認証フロー (サインアップ/プロフィール更新)
- [ ] Stripe 決済 (コンテンツ/マッチング)
- [ ] ライブ配信 (配信開始→視聴)
- [ ] マッチングリクエスト→承認→チャット
- [ ] 管理ダッシュボード (審査/レポート)

## 3. 監視・ログ
- [ ] Sentry DSN を設定しテスト例外で通知確認
- [ ] `deploy/ops/report.sh` を実行し Stripe/ライブ統計を取得
- [ ] `deploy/ops/cleanup.js` の dry-run で不要データが無いか確認

## 4. デプロイ
- [ ] `./deploy/verify.sh` でビルド検証
- [ ] Hostinger へ `deploy/deploy.sh` を実行
- [ ] デプロイ後 24 時間モニタリング (Sentry / Firebase Logs)

## 5. ロールバック対策
- [ ] Git タグ作成 (`vX.Y.Z`)
- [ ] ロールバック手順確認 (Git revert + `deploy/deploy.sh`)
- [ ] Stripe ダッシュボードの PaymentIntent を確認
