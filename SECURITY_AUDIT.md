# セキュリティ監査レポート — Genba Hub

> 作成日: 2026-05-19  
> 対象ブランチ: main  
> 目的: 商用リリースに向けたセキュリティ課題の洗い出し

---

## 重大度の定義

| レベル | 意味 |
|--------|------|
| 🔴 CRITICAL | 即時対応必須。悪用されると取り返しのつかない被害が生じる |
| 🟠 HIGH | リリース前に必ず修正が必要 |
| 🟡 MEDIUM | 早期対応が望ましい |
| 🟢 LOW | 時間があれば対応 |

---

## 🔴 CRITICAL

### C-1. データベース認証情報がgit履歴に漏洩

**ファイル:** `.env` / コミット `aca0783`

**問題:**  
`.env` ファイルに本番 Supabase の接続 URL（パスワード含む）が記載された状態で、コミット `aca0783 remove unused gemini.ts` にて git 履歴に刻まれた。現在 `.gitignore` に追加されているが、**過去コミットには今も残っている**。リポジトリを `git clone` すれば誰でも `git show aca0783:.env` で認証情報を取得できる。

```
# git show aca0783:.env の出力（実際の値）
DATABASE_URL="postgresql://postgres.xydmxdvallhwdoluqzmk:<password>@aws-1-ap-southeast-1.pooler.supabase.com:..."
DIRECT_URL="postgresql://postgres.xydmxdvallhwdoluqzmk:<password>@aws-1-ap-southeast-1.pooler.supabase.com:..."
```

**対応手順:**
1. **今すぐ** Supabase ダッシュボードでデータベースパスワードをリセットする
2. `git filter-repo` または BFG Repo-Cleaner でgit履歴から `.env` を削除する（force push が必要）
3. GitHub にプッシュ済みの場合は Secret Scanning アラートを確認する

---

### C-2. XSS（クロスサイトスクリプティング）

**ファイル:** `src/components/MarkdownContent.tsx:12-18`

**問題:**  
AI が生成したり、ユーザーが入力したMarkdownをサニタイズなしで `dangerouslySetInnerHTML` に渡している。悪意あるユーザーが投稿に `<script>alert(1)</script>` や `[link](javascript:void(0))` などを含めると、閲覧者のブラウザで任意のJavaScriptが実行される。セッションハイジャック・フィッシング・マルウェア配布などに悪用される。

```tsx
// 現状（危険）
const html = useMemo(() => marked.parse(content) as string, [content])
return <div dangerouslySetInnerHTML={{ __html: html }} />
```

**対応:**  
`dompurify` を使ってHTMLをサニタイズしてから渡す。

```tsx
import DOMPurify from 'dompurify'

const html = useMemo(() => DOMPurify.sanitize(marked.parse(content) as string), [content])
```

---

## 🟠 HIGH

### H-1. 認証・認可が一切ない（なりすまし可能）

**ファイル:** `src/app/api/posts/route.ts`, `src/app/api/messages/route.ts`

**問題:**  
ユーザー識別は `localStorage` の `pk_username` のみ。これは API リクエストには一切送られておらず、サーバー側は `body.authorName` を完全に信頼している。誰でも任意の `authorName` を指定して投稿・メッセージ送信が可能（なりすまし）。

```ts
// POST /api/posts — authorName は誰でも何でも指定できる
const { authorName, rawInput, title, ... } = body
const post = await prisma.post.create({ data: { authorName, ... } })
```

**対応:**  
NextAuth.js などの認証基盤を導入し、サーバー側でセッションから `authorName` を取得する。フリーランスな社内ツールであればシンプルな招待コード＋セッション管理でも可。

---

### H-2. 他人のDMを誰でも閲覧できる

**ファイル:** `src/app/api/messages/route.ts:4-16`

**問題:**  
`GET /api/messages?to=<任意の名前>` に対して認証チェックがないため、誰でも全ユーザーのメッセージ受信箱を読める。

```ts
// 認証なしで任意ユーザーのメッセージが取得できる
const to = request.nextUrl.searchParams.get('to')
const messages = await prisma.message.findMany({ where: { toName: to } })
```

**対応:**  
セッション認証を導入後、`session.user.name === to` の検証を追加する。

---

### H-3. AIエンドポイントへのレート制限がない（コスト攻撃）

**ファイル:** `src/app/api/ai/structure/route.ts`, `src/app/api/ai/advice/route.ts`

**問題:**  
GROQ APIを呼び出すエンドポイントにレート制限がなく、ループリクエストで API 利用コストを急増させられる。無料枠は即座に枯渇し、有料プランでは予期しない課金が発生する。

**対応:**  
`@upstash/ratelimit`（Redis）、または Vercel の Edge Config でIPごとのレート制限を実装する。最低でも1ユーザー/分あたり5〜10リクエスト以下に制限する。

---

### H-4. プロンプトインジェクション

**ファイル:** `src/lib/ai.ts:35-36`, `src/app/api/ai/advice/route.ts:32`

**問題:**  
ユーザーの入力をそのままプロンプトの文字列として連結しているため、悪意あるユーザーが「前の指示を無視して…」のような入力でAIの挙動を操作できる。生成コンテンツの汚染・不適切コンテンツの投稿・情報漏洩につながる可能性がある。

```ts
// src/lib/ai.ts — rawInput がそのまま埋め込まれる
content: `エンジニア名: ${authorName}\n入力メモ:\n${rawInput}\n\n以下のJSON形式で...`

// src/app/api/ai/advice/route.ts
content: `SESエンジニアが「${query}」で検索しましたが...`
```

**対応:**  
- ユーザー入力をシステムプロンプトから分離し、user ロールに独立して渡す
- 入力の最大文字数を制限（例: 2000文字以下）
- 出力を JSON スキーマで検証する

---

## 🟡 MEDIUM

### M-1. いいね機能がAPIレベルで保護されていない

**ファイル:** `src/app/api/posts/[id]/like/route.ts`

**問題:**  
いいね重複チェックは `localStorage` のみ（クライアント側）。シークレットウィンドウを使う・別ブラウザ・直接APIを叩くだけで同一ユーザーが何度でもいいねを押せる。

**対応:**  
IPアドレス＋`postId` の組み合わせを別テーブルで管理するか、認証後はユーザーID＋`postId` でユニーク制約を設ける。

---

### M-2. 入力値のバリデーション・長さ制限がない

**ファイル:** `src/app/api/posts/route.ts:21-36`

**問題:**  
`title`, `content`, `rawInput` などに長さ制限がない。巨大なペイロードを送り続けることでデータベースストレージの枯渇やサーバー処理時間の浪費が可能。

**対応:**
```ts
if (title.length > 200 || content.length > 50000 || rawInput.length > 10000) {
  return NextResponse.json({ error: 'Content too large' }, { status: 413 })
}
```

---

### M-3. メッセージ既読APIに認証がない

**ファイル:** `src/app/api/messages/route.ts:34-41`

**問題:**  
`PATCH /api/messages` で `{ id }` を送るだけで任意のメッセージを既読にできる。IDは cuid 形式だが推測可能性はゼロではない。

**対応:**  
認証後、対象メッセージの `toName` が現在のセッションユーザーと一致するか確認する。

---

### M-4. 全投稿に `rawInput`（生のメモ）が含まれ公開されている

**ファイル:** `src/app/api/posts/route.ts:7-11`, `prisma/schema.prisma:17`

**問題:**  
`rawInput` フィールドはユーザーが入力した生のメモで、機密情報（パスワード・社内URLなど）が含まれている可能性がある。`GET /api/posts` で全件返却されるためフロントエンドに露出している。

**対応:**  
APIレスポンスから `rawInput` を除外する（`select` 句で明示的に除外）。

```ts
const posts = await prisma.post.findMany({
  select: { id: true, authorName: true, title: true, summary: true,
            content: true, tags: true, likes: true, createdAt: true },
  // rawInput と advice はフロントエンドに返さない
})
```

---

### M-5. 依存パッケージの脆弱性

**ファイル:** `package.json`

**問題:**  
`marked@12`（XSSリスクがある）・`next@14.2.21`（最新は 15.x）など、既知の脆弱性が含まれている可能性がある。

**対応:**
```bash
npm audit
npm audit fix
```

---

## 🟢 LOW

### L-1. CSRFトークンがない

Next.js の Server Actions ではなく fetch + API Routes を使っているため、SameSite Cookie が主な防御になっている。認証基盤導入時にCSRFトークンも合わせて実装することを推奨。

---

### L-2. エラーレスポンスの統一が不十分

一部のエンドポイント（`/api/ai/advice`）は `try/catch` のブロックが不完全で、未処理のエラーが 500 ではなく空のレスポンスになる可能性がある。

---

### L-3. Content Security Policy (CSP) ヘッダーが未設定

`next.config.js` に CSP ヘッダーを設定することでXSSの影響範囲を限定できる。

```js
// next.config.js
headers: async () => [{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ]
}]
```

---

### L-4. `mockStructure` の戻り値にAPIキー設定案内が含まれる

**ファイル:** `src/lib/ai.ts:66-68`

APIキーが未設定の場合のフォールバックコンテンツに、設定ファイルのパスが含まれている。社内情報として問題はないが、本番環境では除去するか別のメッセージに変更する。

---

## 優先対応ロードマップ

```
フェーズ1（今週中・リリース前必須）
  [C-1] DBパスワードリセット + git履歴クリーン
  [C-2] DOMPurify による XSS 対策
  [H-1] NextAuth.js による認証導入
  [H-2] メッセージAPIの認証チェック

フェーズ2（リリース後1ヶ月以内）
  [H-3] レート制限の実装
  [H-4] プロンプトインジェクション対策
  [M-4] rawInput をAPIレスポンスから除外
  [M-5] npm audit 実施・修正

フェーズ3（中期対応）
  [M-1] いいねのサーバー側重複防止
  [M-2] 入力値の長さ制限
  [L-3] CSP ヘッダー設定
```

---

## 参考リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js ドキュメント](https://next-auth.js.org/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
