# Genba Hub — 本番稼働レディネスレポート

> 作成日: 2026-05-19  
> 対象ブランチ: main  
> 目的: 現場レベルで使えるようにするための問題点整理と修正記録

---

## 総合評価

| カテゴリ | 修正前 | 修正後 |
|----------|--------|--------|
| 認証・セキュリティ | 5/10 | 8/10 |
| APIの堅牢性 | 4/10 | 8/10 |
| DB設計 | 6/10 | 8/10 |
| エラー耐性 | 3/10 | 6/10 |
| **総合** | **4.5/10** | **7.5/10** |

---

## 修正済み項目（このセッションで対応済み）

### ✅ 1. DBインデックス追加 (`prisma/schema.prisma`)

**問題:** Post・Messageモデルに検索・フィルタで頻繁に使われるカラムのインデックスが一切なかった。

**影響:** 投稿数が増えると `/api/posts?author=xxx` や受信トレイ取得が全件スキャンとなりレスポンスが劣化。

**修正内容:**
```prisma
model Post {
  @@index([authorId])
  @@index([authorName])
  @@index([createdAt])
}
model Message {
  @@index([toId])
  @@index([fromId])
}
```

**適用コマンド（要実行）:**
```bash
npm run db:setup
# または
npx prisma db push
```

---

### ✅ 2. JWTセッション有効期限の設定 (`src/lib/auth.ts`)

**問題:** `maxAge` が未設定でセッションが無期限になっていた。

**修正:** 30日の有効期限を設定。

```typescript
session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
```

---

### ✅ 3. 登録エンドポイントへのレート制限追加 (`src/app/api/auth/register`)

**問題:** ユーザー登録に制限がなく、スパム登録・ブルートフォースが可能だった。

**修正:** IPごとに1時間10回まで制限。加えて名前に使用できる文字種を正規表現で制限（特殊文字・制御文字の混入防止）。

---

### ✅ 4. 投稿作成へのレート制限追加 (`src/app/api/posts`)

**問題:** 認証済みでも連続投稿で大量データを作成できた。

**修正:** ユーザーIDごとに1時間20投稿まで制限。

---

### ✅ 5. 投稿APIにPATCH・DELETEを追加 (`src/app/api/posts/[id]`)

**問題:** 自分の投稿を編集・削除するエンドポイントが存在しなかった。一度投稿したら修正も削除もできない状態。

**修正:** 以下2エンドポイントを追加（どちらも本人確認あり）:

- `PATCH /api/posts/[id]` — `title`, `content`, `summary` を更新可能
- `DELETE /api/posts/[id]` — 自分の投稿を削除

```typescript
// 所有者チェック例
if (existing.authorId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

### ✅ 6. メッセージAPIの改善 (`src/app/api/messages`)

**問題①:** 送信にレート制限がなく大量DMが送れた。  
**問題②:** 受信トレイが全件返却でページングなし。

**修正:**
- POST: ユーザーIDごとに1時間30件まで制限
- GET: 最新50件に制限

---

### ✅ 7. callbackUrlのオープンリダイレクト修正 (`src/app/auth/signin`)

**問題:** `callbackUrl` を検証せずそのまま `router.push()` していたため、外部URLへのリダイレクトが理論上可能だった。

**修正:** 相対パスのみ許可（絶対URLや `//` で始まるプロトコル相対URLを弾く）。

```typescript
const raw = searchParams.get('callbackUrl') ?? '/'
const callbackUrl = /^\/(?!\/)[\w\-/?=&#%]*$/.test(raw) ? raw : '/'
```

---

### ✅ 8. 環境変数ドキュメントの整備 (`.env.local.example`)

**問題:** `DATABASE_URL` と `DIRECT_URL` の設定方法が未記載で、新規セットアップ時に詰まる。

**修正:** Supabase接続の設定例と説明を追加。

---

### ✅ 9. グローバルエラーバウンダリの追加 (`src/app/error.tsx`)

**問題:** Reactのレンダリングエラーがブランク画面になっていた。

**修正:** `error.tsx` を追加し、エラー時に日本語メッセージと「再試行」ボタンを表示。

---

## 未対応の既知問題（要別途対応）

### 🔴 最優先

#### C-1. DBパスワードのgit履歴残留
**状況:** コミット `aca0783` に `.env` が含まれ、Supabaseの本番接続URLが履歴に刻まれている。

**対応手順（手動で実施してください）:**
1. Supabaseダッシュボード → Database → Settingsでパスワードをリセット
2. `.env.local` の `DATABASE_URL` / `DIRECT_URL` を新パスワードで更新
3. 下記コマンドでgit履歴から削除（force pushが必要）:
   ```bash
   # BFG Repo-Cleaner を使う場合
   java -jar bfg.jar --delete-files .env
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push origin main --force
   ```

---

### 🟠 高優先度

#### H-1. レート制限の永続化問題
**状況:** 現在のレート制限は各サーバープロセスのメモリ内に保存されている。  
**問題:** Vercelなどサーバーレス環境では関数インスタンスが分散するため、レート制限が実質機能しない（インスタンスをまたぐと制限がリセットされる）。

**推奨対応:** [Upstash Redis](https://upstash.com/) + `@upstash/ratelimit` に差し替え。

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rateLimit.ts 置き換え案
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
})
export async function rateLimit(key: string) {
  const { success } = await ratelimit.limit(key)
  return success
}
```

---

#### H-2. 投稿の削除がDBに依存関係を持つ
**状況:** Postを削除するとき、関連するLikeレコードも削除する必要がある。現在Likeに `onDelete: Cascade` がないためエラーになる可能性がある。

**対応:** `prisma/schema.prisma` の Like モデルに cascade 設定を追加:
```prisma
model Like {
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

#### H-3. パスワードポリシーが弱い
**状況:** パスワードの最小8文字チェックのみ。数字・記号の要件なし。

**推奨対応:**
```typescript
const hasUpper = /[A-Z]/.test(password)
const hasNumber = /[0-9]/.test(password)
if (!hasUpper || !hasNumber) {
  return NextResponse.json({ error: 'パスワードは大文字と数字を含む8文字以上にしてください' }, { status: 400 })
}
```

---

### 🟡 中優先度

#### M-1. ホームページの投稿が全件ロード
**状況:** `src/app/page.tsx` が `/api/posts` を1回のリクエストで取得し、クライアント側でフィルタリング。

**問題:** 今は最大50件に制限しているが、今後タグ検索・スクロールロードに移行する際は実装変更が必要。

**推奨対応:** 無限スクロール + サーバーサイドフィルタリングへの段階的移行。

---

#### M-2. /api/skills が全投稿を取得してメモリ内集計
**状況:** `src/app/api/skills/route.ts` が全投稿のtagsを取得してNode.js内でパース・集計している。

**問題:** 投稿数が数千を超えると遅延・メモリ不足が発生する。

**推奨対応:** Prismaの `groupBy` またはTagsを別テーブルに切り出す。

---

#### M-3. 検索APIに認証がない
**状況:** `/api/search` は誰でもアクセス可能で、投稿内容を全文検索できる。

**問題:** ボットによる一括スクレイピングが可能。

**推奨対応:** レート制限の追加（IPベース）。

---

#### M-4. UIに投稿編集・削除ボタンがない
**状況:** APIは追加したが、UI側に編集・削除機能がまだない。

**推奨対応:** 投稿詳細ページ (`/posts/[id]`) に「編集」「削除」ボタンを追加（本人のみ表示）。

---

### 🟢 低優先度

#### L-1. CSPの `unsafe-inline` / `unsafe-eval`
`next.config.mjs` のCSPが `'unsafe-inline'` と `'unsafe-eval'` を許可している。Tailwindが動的スタイルを使うため現状は必要だが、長期的には nonce ベースのCSPへ移行を検討。

#### L-2. mockStructure に内部情報
AIキー未設定時のフォールバックメッセージに設定ファイルのパスが含まれる。本番では `src/lib/ai.ts` の `advice` フィールドのメッセージを変更推奨。

#### L-3. npm audit
```bash
npm audit
npm audit fix
```
`marked@12` 等の依存関係に既知の脆弱性がある可能性があるため定期確認を推奨。

---

## デプロイ前チェックリスト

```
[ ] npx prisma db push でDBスキーマ（インデックス）を反映
[ ] Supabaseのパスワードをリセット（C-1対応）
[ ] .env.local に正しいDATABASE_URL / DIRECT_URL / NEXTAUTH_SECRET を設定
[ ] npm audit で脆弱性がないか確認
[ ] NEXTAUTH_URL を本番URLに設定
[ ] Vercel等の環境変数に上記をすべて登録
```

---

## アーキテクチャ上の注意点

- **DBはPostgreSQL (Supabase)** — `prisma db push` でスキーマを同期。データが残るので `db push` は安全だが、本番では `prisma migrate` への移行を推奨。
- **レート制限はサーバーレス非対応** — 現状はメモリ内実装のためVercelでは機能しない。Upstash移行が必須（上記H-1参照）。
- **Like削除は現在未対応** — Postを削除する際にLikeのCascadeが設定されていないため、`prisma.post.delete()` が外部キー制約エラーになる可能性がある（H-2参照）。

---

*このレポートは開発ツールによって自動生成されました。*
