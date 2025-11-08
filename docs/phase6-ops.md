# ONLY-U フェーズ6 管理・監視・運用設計

## 1. ゴール
- 運営向け管理ダッシュボードでリクエスト承認・コンテンツレビュー・売上分析を提供。
- Sentry 等を用いた監視体制、重要イベント通知（メール/Slack）の基盤を整備。
- ログ (Audit Trail) の収集と、運用タスク自動化スクリプトを準備。

## 2. 管理ダッシュボード
- `/admin` 配下で運営専用 UI を提供。Firebase Custom Claims で `admin` のみアクセス。
- 機能: マッチング申請承認、コンテンツレビュー、ライブ・売上指標可視化。
- 主要ページ:
  - `/admin/dashboard`: KPI・売上サマリ・アクティビティログ。
  - `/admin/requests`: マッチング/コンテンツ審査キュー。
  - `/admin/reports`: Stripe 売上、利用状況グラフ（仮実装）。

## 3. 監視・通知
- Sentry (クライアント/サーバ) 初期化。`.env` に `SENTRY_DSN` を追加。
- Firebase Functions/Next API エラーで Sentry Capture。
- SendGrid/Webhook を使った重要イベント通知（サブスク承認、ライブ終了）。

## 4. ログ収集
- Firestore `auditLogs/{logId}` で主要アクションを記録（API Hook）。
- `adminDb.collection("auditLogs").add({ action, uid, targetId, ... })` を共通関数化。

## 5. 運用スクリプト
- `deploy/ops/report.sh`: Stripe 売上とライブ Usage 集計。
- `deploy/ops/cleanup.js`: 古いライブセッション/リクエストのクリーンアップ。

## 6. セキュリティ
- `/admin` は Server Component で認証・ロールチェック。
- API に監査ログ記録 + Rate limit (Upstash Redis) を追加検討。

```
フェーズ6タスク: 管理ダッシュボード、監視/通知、監査ログ・運用スクリプト。
```

```
フェーズ6進捗: 管理ダッシュボード/API、監査ログ、Sentry・運用スクリプトを整備。
```
