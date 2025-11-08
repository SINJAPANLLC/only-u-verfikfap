# ONLY-U フェーズ4 LiveKit ライブ配信設計

## 1. ゴール
- クリエイターが LiveKit を用いてライブ配信を開始／終了できる機能を実装。
- ファンはライブ視聴ページから視聴し、分課金の決済導線を通じて貢献できる。
- 配信中の課金データを Stripe に Usage Record として送信し、支払いが正しく反映されるようにする。

## 2. LiveKit コンポーネント
- LiveKit Cloud/Server: ルーム生成、トークン発行に使用。
- Client SDK (browser): 視聴/配信 UI を提供する。
- Server API: `/api/livekit/token` で配信者/視聴者に適切なロールのトークンを発行。

## 3. ライブセッションフロー
1. クリエイターが `app/live/new` から配信を予約/開始。
2. `/api/livekit/token` が `host` ロールでトークン発行。
3. 視聴者は `app/live/[id]` にアクセスし、`viewer` ロールのトークンを取得。
4. 配信中の分課金は一定間隔で `/api/live/billing` に minutes+rate を送信し Stripe Usage Record を更新。
5. 終了時に `liveSessions/{sessionId}` のステータス更新しアーカイブ処理（Bunny 録画 or LiveKit Cloud）をキューイング。

## 4. API 設計
- `POST /api/livekit/token` : { roomName, role } を受け取り LiveKit サーバー API で JWT を生成。
- `POST /api/live/billing` : { sessionId, minutes } を受け取り Stripe usage record を作成・Firestore 更新。
- `POST /api/live/start` : ライブセッション開始、Firestore に記録。
- `POST /api/live/end` : セッション終了処理。

## 5. Stripe Usage
- `product_live_minute` を用意し、`price_live_minute` に使用量を記録。
- 課金単位は 1 分。`minutes` を Usage Record に加算し、アプリ側でも累積を保持。

## 6. UI
a. 配信者
- `app/live/new`: 配信タイトル、レート、代理店比率を設定。
- `app/live/[id]/host`: 配信画面（LiveKit broadcast + チャット + コントロール）。

b. 視聴者
- `app/live/[id]`: ライブ視聴プレーヤー + ギフト/コメント + 分課金ナビ。

## 7. Firestore モデル拡張
```
liveSessions/{sessionId}
  creatorUid
  title
  ratePerMinute
  agencyFeeRate
  status: "scheduled" | "live" | "ended"
  roomName
  tokensIssued: number
  billing: {
    totalMinutes,
    lastUsageReportedAt
  }
  createdAt, updatedAt
```

## 8. セキュリティ
- `/api/livekit/token` は creator/admin だけが `host` ロールを取得可能。
- viewer トークンは認証済みファン＋購入済み(サブスク)ユーザーに限定。
- `/api/live/billing` はライブ中のセッションのみ許可し、クリエイター/代理店APIキーで署名。

## 9. 後続項目
- ライブチャット (Socket.io or LiveKit DataTrack) はフェーズ5以降で強化。
- 録画 -> VOD 化はフェーズ3のフローを再利用。

```
フェーズ4タスク: トークンAPI、ライブ開始/終了、視聴UI、Usage連携。
```

```
フェーズ4進捗: トークン/開始/終了/課金 API を実装。
```
