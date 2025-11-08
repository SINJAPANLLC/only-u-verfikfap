# ONLY-U デプロイガイド

1. QA 実行
   ```bash
   ./deploy/verify.sh
   ```
2. Firebase 更新
   ```bash
   ./deploy/firebase-init.sh
   ```
3. Hostinger
   ```bash
   bash deploy/deploy.sh
   ```
4. デプロイ後モニタリング
   - Sentry ダッシュボード
   - Firestore Logs
   - Stripe Dashboard
5. ロールバック
   ```bash
   git checkout <stable-tag>
   bash deploy/deploy.sh
   ```
