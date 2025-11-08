# ONLY-U フェーズ2 認証・プロフィール実装計画

## 1. ゴール
- Firebase Auth (Email/Password + Apple/Google 拡張余地) を用いたサインアップ/ログイン/ログアウトを実装。
- 認証情報に紐づく Firestore 上のユーザープロファイルを同期。
- カスタムクレームを用いたロール管理の申請フロー基盤を整備。
- UI: サインイン/サインアップページ、プロフィール編集ページ。

## 2. 認証フロー
1. ユーザーがサインアップフォームからメール/パスワードで登録。
2. Firebase Auth ユーザー作成後、Firestore `users/{uid}` に初期プロファイルを書き込み。
3. サインイン時は Auth 状態を監視し、`getIdTokenResult` でカスタムクレーム (roles) を取得。
4. `AuthProvider` コンテキストでアプリ全体にユーザーステートを配信。

## 3. プロフィール同期
- Firestore `users/{uid}` に `displayName`, `avatarUrl`, `bio`, `links` 等を保持。
- プロフィール編集ページから Firestore を直接更新 (セキュリティルールにより本人のみ編集可)。

## 4. ロール申請
- クリエイター/代理店希望ユーザーは申請フォームから `roleRequests` コレクションへ投稿。
- API Route `app/api/roles/request` が ID トークンを検証し Firestore に記録。
- 承認は別フェーズで実装（管理者がカスタムクレームを付与）。

## 5. UI コンポーネント
- `components/providers/AuthProvider.tsx` : Auth 状態を監視し、ユーザーデータを提供。
- `components/auth/AuthGuard.tsx` : 認証必須ページのラッパー。
- サインアップ/サインインフォーム: `app/(auth)/signup`, `app/(auth)/signin`。
- プロフィール編集フォーム: `app/profile/page.tsx`。

## 6. トークン検証
- API Routes では `Authorization: Bearer <ID_TOKEN>` を受け取り、`adminAuth.verifyIdToken` で検証。

## 7. バリデーション
- クライアント: `zod` で入力チェック。
- メールの正規化、パスワード長 (>= 8) を enforce。

## 8. テスト
- 単体: コンポーネントレベルは React Testing Library (後続フェーズ)。
- 手動: Firebase Emulator Suite で Auth/Firestore の動作確認。

```
フェーズ2タスク: AuthProvider 実装、UI ページ作成、API ルート構築。
```

```
フェーズ2進捗: AuthProvider、サインイン/サインアップ/プロフィール/ロール申請を実装。
```
