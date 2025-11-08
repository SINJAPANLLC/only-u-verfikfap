# ONLY-U パフォーマンス & セキュリティ最終確認

## パフォーマンス
- [ ] Lighthouse モバイル/デスクトップ 90 点以上
- [ ] 主要ページの LCP < 2.5s
- [ ] 画像・動画の CDN (Bunny) 配信を確認
- [ ] LiveKit 配信にて CPU/帯域幅を計測

## セキュリティ
- [ ] Firestore ルールを `firebase emulators:exec` で検証
- [ ] Stripe Webhook Secret / Connect ID が最新
- [ ] Firebase Admin キーが Secret Manager に保管
- [ ] Sentry, SendGrid のアクセス制御

## 追加 TODO
- [ ] Upstash Redis で Rate Limit を設定
- [ ] Admin アクション時に 2FA / ログイン監査
