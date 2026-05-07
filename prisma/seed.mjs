import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const posts = [
  // ── 田中 健 ──────────────────────────────────────────────
  {
    authorName: '田中 健',
    rawInput: 'dockerコンテナ間通信できなくてハマった。depends_onだけじゃだめ。networksの設定が必要だった。bridgeとhostの違いもわかった',
    title: 'Docker Compose でコンテナ間通信ができない問題の解決法',
    summary: 'docker-compose.yml で depends_on を設定してもコンテナ間通信ができないケースがある。networks キーで明示的にネットワークを定義することで解決できる。bridge モードと host モードの使い分けも重要なポイント。',
    content: `## 問題

docker-compose.yml で \`depends_on\` を設定したが、フロントエンドコンテナからバックエンドコンテナへの通信が失敗し続けた。

## 原因

\`depends_on\` は「起動順序」を制御するだけで、ネットワーク接続を保証しない。別途 \`networks\` の設定が必要。

## 解決策

\`\`\`yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    networks:
      - app-network
    depends_on:
      - backend

  backend:
    build: ./backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
\`\`\`

同じ \`networks\` に属するサービスは、**サービス名をホスト名として**相互通信できる。

## bridge vs host モード

| モード | 用途 |
|--------|------|
| bridge | 通常の開発環境（デフォルト） |
| host | ホストのネットワークを直接使う（本番で稀に使用） |

開発環境では \`bridge\` 一択。`,
    tags: JSON.stringify(['Docker', 'docker-compose', 'ネットワーク', 'エラー解決']),
    advice: 'depends_on はヘルスチェックと組み合わせて condition: service_healthy を使うと起動順序をより確実に制御できる。',
    createdAt: new Date('2026-04-28T10:30:00'),
  },
  {
    authorName: '田中 健',
    rawInput: 'goのgoroutineがリークしてた。チャネルを閉じ忘れてた。contextのキャンセルで制御するのが正解らしい',
    title: 'Go の goroutine リーク：チャネルとコンテキストによる制御',
    summary: 'Go で goroutine が終了せずメモリが増加し続ける goroutine leak の原因と対策。チャネルのクローズ忘れが典型的な原因で、context.WithCancel を使った制御が推奨パターン。',
    content: `## goroutine leak とは

goroutine が終了せずに残り続ける状態。メモリ使用量が増加し続け、最終的にOOMになる。

## よくある原因

\`\`\`go
// NG: チャネルが閉じられないと goroutine が永遠にブロック
func leak() {
    ch := make(chan int)
    go func() {
        val := <-ch // ch が閉じられないと永遠に待機
        fmt.Println(val)
    }()
    // ch を閉じ忘れ → goroutine リーク
}
\`\`\`

## 解決策：context による制御

\`\`\`go
func noLeak(ctx context.Context) {
    go func() {
        select {
        case <-ctx.Done():
            return // キャンセルされたら終了
        case val := <-dataCh:
            fmt.Println(val)
        }
    }()
}

// 呼び出し側
ctx, cancel := context.WithCancel(context.Background())
defer cancel() // 関数終了時に全 goroutine をキャンセル
noLeak(ctx)
\`\`\`

## 検出方法

runtime パッケージで goroutine 数を監視：

\`\`\`go
fmt.Println(runtime.NumGoroutine())
\`\`\``,
    tags: JSON.stringify(['Go', 'goroutine', '非同期処理', 'メモリリーク', 'エラー解決']),
    advice: 'pprof の /debug/pprof/goroutine エンドポイントを本番に仕込んでおくとリーク検出が劇的に楽になる。',
    createdAt: new Date('2026-04-22T14:15:00'),
  },
  {
    authorName: '田中 健',
    rawInput: 'lambdaのコールドスタートが遅すぎる問題。provisioned concurrencyとかwarming lambdaとか調べた。go言語に変えたら劇的に改善した',
    title: 'AWS Lambda コールドスタート対策：Provisioned Concurrency と言語選択',
    summary: 'Lambda のコールドスタートによる初回レイテンシ問題の対策を調査・実施。Provisioned Concurrency の設定と、ランタイムを Node.js から Go に変更することで初回応答時間を 3.2秒 → 180ms に改善。',
    content: `## 問題の概要

API Gateway + Lambda 構成でたまに初回レスポンスが 3〜4 秒かかるとクレームが来た。

## コールドスタートとは

Lambda の実行環境が初期化される時間。一定時間アクセスがないと実行環境が破棄されるため発生する。

## 計測結果

| ランタイム | コールドスタート | ウォーム |
|---|---|---|
| Node.js 20 | ~800ms | ~50ms |
| Python 3.12 | ~900ms | ~40ms |
| Go 1.21 | ~180ms | ~10ms |
| Java 21 (Snap Start) | ~300ms | ~8ms |

## 対策①：Provisioned Concurrency

\`\`\`bash
aws lambda put-provisioned-concurrency-config \\
  --function-name my-function \\
  --qualifier prod \\
  --provisioned-concurrent-executions 5
\`\`\`

コスト増だが、常時 5 インスタンスをウォーム状態に保てる。

## 対策②：ランタイムを Go に変更

初期化処理が軽い Go はコールドスタートが最速クラス。バイナリサイズも小さい。

## 結果

Go へ移行後、コールドスタートが **3.2秒 → 180ms** に改善。`,
    tags: JSON.stringify(['AWS', 'Lambda', 'Go', 'パフォーマンス', 'サーバーレス']),
    advice: 'SnapStart（Java）や Lambda Web Adapter も選択肢。コスト最優先なら Go、既存資産活用なら SnapStart が現実的。',
    createdAt: new Date('2026-04-15T09:00:00'),
  },

  // ── 佐藤 美咲 ──────────────────────────────────────────────
  {
    authorName: '佐藤 美咲',
    rawInput: 'useEffectで無限ループになってた。依存配列にオブジェクトを入れてたのが原因。毎回新しい参照になるから。useMemoかuseCallbackで解決した',
    title: 'React useEffect の無限ループ：依存配列とオブジェクト参照の落とし穴',
    summary: 'useEffect の依存配列にオブジェクト・配列・関数を指定すると、毎レンダリングで参照が変わり無限ループが発生する。useMemo / useCallback でメモ化することで解決できる。',
    content: `## 症状

\`\`\`tsx
const [data, setData] = useState([])
const filter = { status: 'active' } // コンポーネント内で定義

useEffect(() => {
  fetchData(filter).then(setData)
}, [filter]) // ← 毎レンダリングで filter の参照が変わる → 無限ループ！
\`\`\`

## なぜ無限ループになるか

JavaScript のオブジェクト比較は参照比較。\`{ status: 'active' } === { status: 'active' }\` は **false**。
useEffect は依存配列の値が変わったとみなして再実行 → setData → 再レンダリング → filter 再生成 → …

## 解決策①：useMemo でメモ化

\`\`\`tsx
const filter = useMemo(() => ({ status: 'active' }), [])
\`\`\`

## 解決策②：個別のプリミティブ値を依存配列に

\`\`\`tsx
const status = 'active'
useEffect(() => {
  fetchData({ status }).then(setData)
}, [status]) // ← 文字列はプリミティブなので参照が変わらない
\`\`\`

## 解決策③：関数は useCallback

\`\`\`tsx
const fetchCallback = useCallback(() => fetchData(filter), [filter])
useEffect(() => { fetchCallback() }, [fetchCallback])
\`\`\``,
    tags: JSON.stringify(['React', 'useEffect', 'useMemo', 'useCallback', 'Hooks', 'エラー解決']),
    advice: 'ESLint の react-hooks/exhaustive-deps ルールを有効にするとこの手のバグをコンパイル時に検出できる。',
    createdAt: new Date('2026-04-27T16:00:00'),
  },
  {
    authorName: '佐藤 美咲',
    rawInput: 'Next.js app routerでSSRとCSRをどう使い分けるか。server componentとclient componentの境界線がわかってきた。データフェッチはできるだけサーバーでやるべき',
    title: 'Next.js App Router：Server Component と Client Component の使い分け指針',
    summary: 'Next.js 13+ の App Router における Server Component と Client Component の特性を整理。データフェッチはサーバーサイドで行い、インタラクティブな UI のみ Client Component にすることでパフォーマンスと SEO を両立できる。',
    content: `## 基本原則

**デフォルトは Server Component**。"use client" が必要な理由がある場合のみ Client に切り替える。

## 判断フロー

\`\`\`
useState / useEffect / イベントハンドラを使う？
  → YES → Client Component ("use client")
  → NO  → Server Component（デフォルト）
\`\`\`

## Server Component でできること

\`\`\`tsx
// app/posts/page.tsx (Server Component)
async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  // ↑ サーバーで直接 fetch。クライアントに API キーが漏れない
  return <PostList posts={posts} />
}
\`\`\`

## Client Component が必要なケース

- useState, useReducer などの状態管理
- useEffect, useLayoutEffect
- onClick などのイベントハンドラ
- ブラウザ専用 API（localStorage, window 等）

## コンポーネントツリーの設計

\`\`\`
Page (Server) ← データフェッチここで
  ├── Header (Server)
  ├── PostList (Server) ← 一覧表示
  │   └── LikeButton (Client) ← インタラクション部分だけ Client
  └── SearchBar (Client) ← 検索入力は Client
\`\`\`

## パフォーマンスへの影響

Server Component は JS バンドルに含まれないためクライアントの JS 量が削減される。`,
    tags: JSON.stringify(['Next.js', 'React', 'App Router', 'SSR', 'Server Component', 'パフォーマンス']),
    advice: 'Client Component の境界をできるだけ葉ノードに近い位置に置くと、全体のバンドルサイズを最小化できる。',
    createdAt: new Date('2026-04-20T11:30:00'),
  },
  {
    authorName: '佐藤 美咲',
    rawInput: 'TypeScriptのas constとsatisfiesの使い方をちゃんと理解した。asで型をキャストするのは最後の手段。unknownをanyの代わりに使うべき',
    title: 'TypeScript 実践：as const / satisfies / unknown を使いこなす',
    summary: '型アサーション（as）の乱用はバグの温床になる。as const でリテラル型を保持し、satisfies で型チェックを維持しながら推論させ、any の代わりに unknown を使うことで型安全性を高められる。',
    content: `## as const：リテラル型を保持する

\`\`\`ts
// NG: string[] と推論される
const STATUS = ['active', 'inactive', 'pending']

// OK: readonly ["active", "inactive", "pending"] と推論される
const STATUS = ['active', 'inactive', 'pending'] as const
type Status = typeof STATUS[number] // "active" | "inactive" | "pending"
\`\`\`

## satisfies：型チェックしつつ推論を維持

\`\`\`ts
type Config = { [key: string]: string | number }

// NG: Record<string, string | number> になり host が string | number になる
const config: Config = { host: 'localhost', port: 3000 }
config.host.toUpperCase() // Error: number かもしれない

// OK: satisfies は型チェックのみ行い、推論は維持される
const config = { host: 'localhost', port: 3000 } satisfies Config
config.host.toUpperCase() // OK: string と推論される
\`\`\`

## unknown vs any

\`\`\`ts
// NG: any は型チェックをすり抜ける
function parse(data: any) {
  return data.name.toUpperCase() // 実行時エラーの危険
}

// OK: unknown は使う前に型ガードが必須
function parse(data: unknown) {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data.name as string).toUpperCase() // 安全
  }
}
\`\`\``,
    tags: JSON.stringify(['TypeScript', '型安全', 'as const', 'satisfies', 'ベストプラクティス']),
    advice: 'eslint-plugin-@typescript-eslint の no-explicit-any ルールを有効にすると any の混入を防げる。',
    createdAt: new Date('2026-04-10T13:45:00'),
  },

  // ── 山田 大輔 ──────────────────────────────────────────────
  {
    authorName: '山田 大輔',
    rawInput: 'Spring Bootの@Transactionalがプライベートメソッドで効かない問題にハマった。プロキシ経由じゃないと動かないのが原因。self-invocationの問題',
    title: 'Spring Boot @Transactional が効かない：self-invocation とプロキシの仕組み',
    summary: '@Transactional は Spring の AOP プロキシ経由で動作するため、同一クラス内からの呼び出し（self-invocation）や private メソッドでは機能しない。回避策として別クラスへの分離または ApplicationContext からの Bean 取得が有効。',
    content: `## 症状

\`\`\`java
@Service
public class OrderService {
    public void placeOrder(Order order) {
        validateOrder(order);
        saveOrder(order); // ← ここのトランザクションが効かない！
    }

    @Transactional
    private void saveOrder(Order order) { // private は効かない
        orderRepo.save(order);
    }
}
\`\`\`

## 原因：Spring AOP プロキシの仕組み

Spring は \`@Transactional\` をプロキシクラスで実装する。外部からの呼び出しはプロキシを経由するが、**同一クラス内の self-invocation はプロキシをバイパスする**。

## 解決策①：別クラスに切り出す（推奨）

\`\`\`java
@Service
public class OrderPersistService {
    @Transactional
    public void saveOrder(Order order) {
        orderRepo.save(order);
    }
}

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderPersistService persistService;

    public void placeOrder(Order order) {
        persistService.saveOrder(order); // 別クラス経由でプロキシが効く
    }
}
\`\`\`

## 解決策②：アクセス修飾子を public に変更

private / protected メソッドにはプロキシが効かない。public にする。

## 注意点

- \`@Transactional\` は **public メソッドにのみ付与**する（Checkstyle で強制可能）
- デフォルトの伝播は \`REQUIRED\`（既存トランザクションがあれば参加）`,
    tags: JSON.stringify(['Java', 'Spring Boot', '@Transactional', 'AOP', 'エラー解決']),
    advice: 'AspectJ の compile-time weaving を使えば self-invocation 問題を根本解決できるが、設定コストと相談。',
    createdAt: new Date('2026-04-25T10:00:00'),
  },
  {
    authorName: '山田 大輔',
    rawInput: 'JVMのGCチューニングをやった。G1GCのヒープ設定とか、GCログの見方とか。OOMエラーの原因調査方法も学んだ',
    title: 'JVM GC チューニング入門：G1GC 設定と OOM 解析',
    summary: 'Java アプリのパフォーマンス問題を G1GC のチューニングで改善。ヒープサイズ・リージョンサイズの設定、GC ログの分析方法、OutOfMemoryError の原因調査フローを整理した。',
    content: `## 基本設定（本番推奨）

\`\`\`bash
java -Xms4g -Xmx4g \\          # ヒープサイズは固定（動的変更をなくす）
     -XX:+UseG1GC \\            # G1GC を明示的に指定
     -XX:MaxGCPauseMillis=200 \\ # STW の目標停止時間（ms）
     -XX:G1HeapRegionSize=16m \\ # リージョンサイズ（1MB〜32MB、2の冪乗）
     -Xlog:gc*:file=gc.log:time,uptime,level,tags \\
     -jar app.jar
\`\`\`

## GC ログの読み方

\`\`\`
[4.567s][info][gc] GC(42) Pause Young (Normal) (G1 Evacuation Pause) 512M->128M(4096M) 23.456ms
         ^^^                                                            ^^^    ^^^  ^^^    ^^^
         経過時間                                                      GC前   GC後 ヒープ  停止時間
\`\`\`

## OOM エラーの原因調査

### ヒープダンプの取得

\`\`\`bash
# OOM 発生時に自動取得
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heap.hprof

# 実行中に取得
jmap -dump:format=b,file=heap.hprof <PID>
\`\`\`

### Eclipse Memory Analyzer (MAT) で分析

1. heap.hprof を MAT で開く
2. "Leak Suspects" レポートを確認
3. Retained Heap が大きいオブジェクトを特定

## よくある OOM 原因

| 原因 | 症状 | 対策 |
|------|------|------|
| セッションの溜まりすぎ | HTTP セッション肥大 | TTL 短縮 |
| 静的フィールドへの蓄積 | キャッシュが無制限に成長 | サイズ上限設定 |
| スレッドローカル変数 | リクエスト終了後も残存 | remove() 呼び出し |`,
    tags: JSON.stringify(['Java', 'JVM', 'GC', 'G1GC', 'パフォーマンス', 'OOM']),
    advice: 'Xms と Xmx は同じ値にしてヒープのリサイズを防ぐのが本番では鉄則。動的リサイズは GC 負荷増大の原因になる。',
    createdAt: new Date('2026-04-18T14:30:00'),
  },

  // ── 鈴木 優 ──────────────────────────────────────────────
  {
    authorName: '鈴木 優',
    rawInput: 'FastAPIの非同期処理でブロッキングIOをasync defに入れてたら逆に遅くなった。asyncioのイベントループをブロックしてたのが原因。run_in_executorで解決',
    title: 'FastAPI 非同期処理の落とし穴：ブロッキング IO で逆に遅くなる問題',
    summary: 'FastAPI で async def 関数内にブロッキング I/O（同期的 DB クエリ、requests ライブラリ等）を呼ぶと、asyncio のイベントループがブロックされ全リクエストが停止する。asyncio.run_in_executor でスレッドプールに委譲するか、非同期ライブラリに移行することで解決。',
    content: `## 問題のコード

\`\`\`python
import requests

@app.get("/data")
async def get_data():
    # NG: requests はブロッキング。イベントループが止まる
    response = requests.get("https://api.example.com/data")
    return response.json()
\`\`\`

同時リクエストが来ると全員が待たされる。

## 解決策①：非同期ライブラリに置き換え（推奨）

\`\`\`python
import httpx

@app.get("/data")
async def get_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
    return response.json()
\`\`\`

## 解決策②：run_in_executor でスレッドプール実行

\`\`\`python
import asyncio
from functools import partial

@app.get("/data")
async def get_data():
    loop = asyncio.get_event_loop()
    # ブロッキング関数をスレッドプールで実行
    result = await loop.run_in_executor(None, blocking_function)
    return result
\`\`\`

## 解決策③：同期関数のまま def にする

FastAPI は通常の \`def\` 関数を自動的にスレッドプールで実行するため、ブロッキング処理は \`async def\` より \`def\` の方が適切なこともある。

\`\`\`python
@app.get("/data")
def get_data():  # async def ではなく def
    response = requests.get("https://api.example.com/data")
    return response.json()
\`\`\`

## 使い分けまとめ

| 関数定義 | ブロッキング IO | 非同期 IO |
|---------|--------------|---------|
| async def | ❌ イベントループブロック | ✅ |
| def | ✅ スレッドプールで自動実行 | △ await 不可 |`,
    tags: JSON.stringify(['Python', 'FastAPI', '非同期処理', 'asyncio', 'パフォーマンス', 'エラー解決']),
    advice: 'DB アクセスは SQLAlchemy の async セッション（asyncpg）か databases ライブラリに移行すると全体的に非同期化できる。',
    createdAt: new Date('2026-04-26T15:00:00'),
  },
  {
    authorName: '鈴木 優',
    rawInput: 'Pythonの型ヒントをちゃんと使い始めた。TypedDictとProtocolが便利。mypyの設定も整えた',
    title: 'Python 型ヒント実践：TypedDict・Protocol・mypy で型安全な開発',
    summary: 'Python の型ヒントを TypedDict・Protocol を活用して体系的に適用する方法を整理。mypy の strict モードを導入することで、実行前に型エラーを検出できるようになった。',
    content: `## TypedDict：辞書の型定義

\`\`\`python
from typing import TypedDict

class UserDict(TypedDict):
    id: int
    name: str
    email: str

def get_user(user_id: int) -> UserDict:
    return {"id": user_id, "name": "田中", "email": "tanaka@example.com"}

user = get_user(1)
user["name"]   # OK
user["age"]    # mypy エラー：KeyError の可能性
\`\`\`

## Protocol：構造的サブタイピング

\`\`\`python
from typing import Protocol

class Saveable(Protocol):
    def save(self) -> None: ...

def persist(obj: Saveable) -> None:
    obj.save()

class User:
    def save(self) -> None:
        print("User saved")

# User が Saveable を継承していなくても OK（duck typing）
persist(User())
\`\`\`

## mypy 設定（mypy.ini）

\`\`\`ini
[mypy]
python_version = 3.12
strict = true           # strict モードで厳格チェック
ignore_missing_imports = true

[mypy-sqlalchemy.*]
ignore_missing_imports = true
\`\`\`

## よく使う型

\`\`\`python
from typing import Optional, Union, Literal, Final

def process(mode: Literal["read", "write"]) -> None: ...

MAX_RETRY: Final = 3  # 再代入不可

def find_user(id: int) -> Optional[User]:  # None かもしれない
    ...
\`\`\``,
    tags: JSON.stringify(['Python', 'TypedDict', 'Protocol', 'mypy', '型安全', 'ベストプラクティス']),
    advice: 'CI に mypy --strict を組み込んで型チェックをゲートにすると、チーム全体の型ヒント品質が保ちやすい。',
    createdAt: new Date('2026-04-12T10:00:00'),
  },

  // ── 高橋 翔 ──────────────────────────────────────────────
  {
    authorName: '高橋 翔',
    rawInput: 'GitHub Actionsのmatrix戦略を使ってテストを並列化した。Node16,18,20の3バージョンで同時テスト走らせたら3倍速くなった。fail-fastもオフにしてる',
    title: 'GitHub Actions matrix 戦略でテストを並列化して CI を高速化',
    summary: 'GitHub Actions の matrix strategy を使い、複数 Node.js バージョン・OS の組み合わせで並列テストを実現。3バージョン直列から並列化し、CI 時間を 12 分から 5 分に短縮した。',
    content: `## before：直列テスト（遅い）

\`\`\`yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm test
\`\`\`

## after：matrix 戦略で並列化

\`\`\`yaml
jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      fail-fast: false          # 一部失敗しても全部実行
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm test

      - name: Upload coverage
        if: matrix.node-version == 20 && matrix.os == 'ubuntu-latest'
        uses: codecov/codecov-action@v4
\`\`\`

## 特定の組み合わせを除外

\`\`\`yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest]
    exclude:
      - node-version: 18
        os: windows-latest  # この組み合わせはスキップ
\`\`\`

## 結果

| 構成 | 時間 |
|------|------|
| 直列 3 バージョン | 12 分 |
| matrix 並列 | 5 分 |`,
    tags: JSON.stringify(['GitHub Actions', 'CI/CD', 'matrix', 'テスト自動化', 'DevOps']),
    advice: 'キャッシュは actions/cache を使い node_modules をキャッシュすると npm ci の時間をさらに半減できる。',
    createdAt: new Date('2026-04-24T09:30:00'),
  },
  {
    authorName: '高橋 翔',
    rawInput: 'Dockerfileのlayer cacheを最適化した。package.jsonだけ先にコピーしてnpm installするとキャッシュが効きやすい。マルチステージビルドも使った',
    title: 'Dockerfile のレイヤーキャッシュ最適化とマルチステージビルド',
    summary: 'Dockerfile のレイヤー順序を最適化し、package.json だけを先にコピーして npm install を行うことでキャッシュヒット率を大幅改善。マルチステージビルドでイメージサイズを 1.2GB から 180MB に削減した。',
    content: `## NG パターン：キャッシュが効かない

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app

COPY . .                # ← ソースコードが変わるたびにキャッシュ無効化
RUN npm ci              # ← 毎回 npm install が走る（遅い）
RUN npm run build
CMD ["node", "dist/index.js"]
\`\`\`

## OK パターン：依存関係だけ先にキャッシュ

\`\`\`dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./  # ← 依存ファイルだけコピー
RUN npm ci                               # ← package.json が変わらない限りキャッシュされる

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 本番イメージ（node_modules の devDependencies を除外）
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules  # prod deps のみ
CMD ["node", "dist/index.js"]
\`\`\`

## 効果

| 項目 | 改善前 | 改善後 |
|------|-------|-------|
| ソース変更時のビルド時間 | 3 分 | 45 秒 |
| イメージサイズ | 1.2 GB | 180 MB |
| 本番イメージに devDeps | あり | なし |

## .dockerignore も忘れずに

\`\`\`
node_modules
.next
.git
*.md
\`\`\``,
    tags: JSON.stringify(['Docker', 'Dockerfile', 'マルチステージビルド', 'CI/CD', 'DevOps', 'パフォーマンス']),
    advice: 'docker buildx bake を使うと複数プラットフォーム（linux/amd64, linux/arm64）の並列ビルドが簡単になる。',
    createdAt: new Date('2026-04-16T11:00:00'),
  },
]

async function main() {
  console.log('Seeding database...')

  // 既存データを削除
  await prisma.post.deleteMany()

  for (const post of posts) {
    await prisma.post.create({ data: post })
    process.stdout.write('.')
  }

  console.log(`\nDone! ${posts.length} posts created.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
