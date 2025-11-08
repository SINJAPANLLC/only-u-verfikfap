# ONLY-U フェーズ5 マッチングサブスク設計

## 1. ゴール
- ファンがサブスクプランを選択し、マッチングリクエストを送信できる仕組みを構築。
- クリエイター/代理店側でマッチング承認・チャット導線を管理。
- Stripe サブスク決済と Firestore のマッチング履歴を同期。

## 2. マッチングフロー
1. `/matching/plans` からプラン (Basic/Plus/Premium) を説明。
2. プラン選択 → Stripe サブスク (既存 API `/api/matching` を利用) → Firestore `subscriptions` を更新。
3. 有効なサブスクユーザーはマッチングフォーム `/matching/request` から希望条件を送信。
4. `matchRequests/{requestId}` に保存し、クリエイター/代理店が承認。
5. 承認後 `matches/{matchId}` に確定し、チャットページ `/matching/chat/[matchId]` へ遷移。

## 3. Firestore 拡張
```
matchRequests/{requestId}
  fanUid
  preferredCreatorId
  message
  status: "pending" | "approved" | "rejected"
  subscriptionId
  createdAt, updatedAt

matches/{matchId}
  fanUid
  creatorUid
  status: "active" | "closed"
  chatRoomId
  createdAt, updatedAt
```

## 4. UI
- `matching/plans/page.tsx`: プラン紹介 + CTA。
- `matching/subscribe/page.tsx`: プラン選択 + Stripe Checkout ラッパー。
- `matching/request/page.tsx`: マッチングフォーム。
- `matching/dashboard/page.tsx`: 承認済みマッチ一覧 + チャット導線。
- `matching/chat/[matchId]/page.tsx`: チャット UI (簡易)。

## 5. Stripe 連携
- プランID: `price_basic`, `price_plus`, `price_premium`。
- サブスク作成後の Webhook (`customer.subscription.updated`) で `subscriptions` を更新済み。
- プラン購読時に Firestore `subscriptions` の `plan` と `status` を更新。

## 6. セキュリティ
- `matchRequests` は本人または admin のみ読み書き。
- `matches` は参加者と admin のみ読取。
- チャットルーム ID を Firestore Security Rules に追加予定。

## 7. 後続項目
- チャット通知 (Push/メール) はフェーズ6 で実装。
- AI レコメンドは将来フェーズ。

```
フェーズ5タスク: プランUI、サブスク導線、マッチングフォーム、チャット。
```

```
フェーズ5進捗: プランUI、サブスク導線、マッチングフォーム、ダッシュボード/チャットを実装。
```
