# ONLY-U フェーズ3 コンテンツ課金・Bunny CDN 設計

## 1. ゴール
- クリエイターが VOD コンテンツをアップロードし、Bunny CDN 経由で配信可能にする。
- ファンがコンテンツを購入し、決済完了後に視聴アクセスが解放されるフローを構築。
- Stripe Webhook と Firestore で購入履歴・視聴権限を同期。

## 2. コンテンツライフサイクル
1. クリエイターが動画/画像をアップロード → `temp/` ストレージに保存。
2. サーバー API (`/api/content/upload`) が Bunny Storage に転送し、CDN URL を取得。
3. Firestore `contents/{contentId}` にメタ情報 + CDN URL を保存。`status` は `draft` → `review_required` → `published`。
4. 公開後、ファンは商品ページから Stripe 支払い → 購入完了で `purchases` コレクションに記録。
5. 視聴アクセスガードは `getServerSession` で購入済み判定し、未購入ユーザーにはロック表示。

## 3. Firestore 拡張
```
contents/{contentId}
  creatorUid
  title
  description
  price
  currency: "JPY"
  status
  categories: []
  asset: {
    type: "video" | "image" | "bundle",
    storagePath,
    cdnUrl,
    duration,
    size
  }
  publishedAt

purchases/{purchaseId}
  uid
  contentId
  amount
  status
  stripePaymentIntentId
  grantedAt
```

## 4. API 設計
- `POST /api/content/upload` : クリエイターのみ。Bunny に `uploadBunny` を使ってアップロードし、Firestore にドラフト保存。
- `POST /api/content/publish` : 運営または本人がコンテンツを公開状態に更新。
- `POST /api/content/purchase` : 既存の `/api/payments` を改修し、`contentId` を受け取りメタデータに付与。
- `GET /api/content/{id}` : コンテンツ詳細と視聴可否を返す。

## 5. Stripe 連携
- `metadata` に `contentId` と `purchaseId` を付与し、Webhook (`payment_intent.succeeded`) で `accessGranted` を `true` に更新。

## 6. フロント UI
- `app/content/page.tsx` : コンテンツ一覧。
- `app/content/[id]/page.tsx` : 詳細・購入ボタン・視聴可能な場合は埋め込みプレーヤー。
- クリエイター用 `app/content/new/page.tsx` : アップロードフォーム。

## 7. バリデーション・制御
- `zod` でタイトル・価格・ファイルタイプをチェック。
- ファイルサイズ上限と許可 MIME タイプをサーバー側で制御。
- アクセス制御: AuthGuard + Firestore 購入チェック。

## 8. 後続項目
- 自動サムネイル生成（別フェーズ）。
- 収益分配レポート（フェーズ6）。

```
フェーズ3タスク: Upload API, 購入フロー調整, 視聴ガード, フロント UI。
```

```
フェーズ3進捗: アップロード/公開/購入/アクセスチェック API と UI を実装。
```
