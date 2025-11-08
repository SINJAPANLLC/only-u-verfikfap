# ONLY-U フェーズ7 QA・リリース設計

## 1. QA ゴール
- コア機能（認証/課金/ライブ/マッチング/管理）の動作確認と回帰防止。
- パフォーマンス・アクセシビリティ・セキュリティの確認ポイントを整理。
- リリース手順およびロールバック戦略を策定。

## 2. テストスコープ
| 項目 | 内容 | 判定方法 |
|------|------|----------|
| 認証 | サインアップ/ログイン/プロフィール編集 | Cypress or 手動 |
| 課金 | コンテンツ購入、Stripe サブスク作成 | Stripe Test Keys |
| ライブ | ライブ開始→トークン取得→視聴 | LiveKit Dev Server |
| マッチング | プラン購読→リクエスト→承認→チャット | Firestore Emulator |
| 管理 | `/admin` で承認・レポート表示 | `admin` カスタムクレーム |

## 3. 自動チェック
- `npm run lint`
- `npm run type-check`
- `npm run build`
- GitHub Actions `CI` (push/pull_request) が同じコマンドを実行。

## 4. 手動テストチェックリスト
1. サインアップ→プロフィール編集→コンテンツ購入。
2. クリエイターとしてライブを開始し、別ブラウザで視聴。
3. サブスク購読→マッチングリクエスト→管理者で承認。
4. 管理ダッシュボードの指標が更新されるか確認。
5. Sentry DSN 設定後、意図的なエラーで通知送信を確認。

## 5. パフォーマンス/ハードニング
- Lighthouse スコア測定 (モバイル/デスクトップ)。
- 重要 API へ Rate Limit (Upstash) 追加検討。
- Firestore ルール・Stripe Webhook シークレットが最新か確認。

## 6. リリース手順
1. `deploy/verify.sh` を実行しビルド検証。
2. Firebase ルール/インデックス: `./deploy/firebase-init.sh`。
3. Hostinger へ `deploy/deploy.sh` を実行。
4. カナリア監視 (Sentry/ログ) で24時間モニタリング。
5. 問題があれば `cleanup.js`・`report.sh` で調査後ロールバック。

## 7. ロールバック戦略
- Git ブランチを直近安定版にリセットし再デプロイ。
- Stripe ダッシュボードで未処理の PaymentIntent をキャンセル。
- Firestore `auditLogs` から影響範囲を特定し `cleanup.js` で巻き戻し。

```
フェーズ7タスク: QA 実行、verify スクリプト、リリースチェックリスト作成。
```
