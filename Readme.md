# well-archi-checker

## 🔍 これは何？

AWS Well-Architected Framework（6つの柱）に基づいて、AWSインフラの構成状態を自動チェックする TypeScript 製 CLIツールです。  
CloudWatchアラーム、IAM、S3、RDS、タグ管理など、各柱の代表的なリスクや構成ミスを検知するために使用します。

---

## ⚙️ セットアップ手順

### 1. `.env` ファイルを作成

`.env.example` をコピーして `.env` を作成し、必要な AWS 認証情報を入力してください。

```bash
cp .env.example .env
```

### 2. Node.js バージョン

本プロジェクトは **Node.js 20** LTS 以上 を対象としています。

### 3. 必要な VSCode 拡張機能

| 拡張機能名                                                                                                      | 拡張機能ID                              | 説明                                                                     |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)         | `esbenp.prettier-vscode`                | 保存時に自動でコードを整形します                                         |
| [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv)                                  | `mikestead.dotenv`                      | `.env` ファイルにシンタックスハイライトを追加します                      |
| [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) | `streetsidesoftware.code-spell-checker` | スペルミスを検知・ハイライトします（`archi` は `.cspell.json` で除外済） |

### 4. 🛠 開発者向けメモ

VSCode保存時整形：`settings.json` に `"editor.formatOnSave": true` を推奨

---

## 🚀 実行方法

CLIツールは `cli.ts` をエントリポイントとしています。

```bash
npx tsx cli.ts
```

### 任意のフィルタ指定

- ピラー単位で指定：
  ```bash
  npm run check -- --pillar security
  ```
- カテゴリ単位で指定：
  ```bash
  npm run check -- --category audit
  ```
- 関数名で指定：
  ```bash
  npm run check -- --check checkIamUserMfa
  ```

### 📦 チェック結果

すべてのチェック結果は CSV形式で `output/well-archi-report.csv` に出力されます。

---

## ディレクトリ構成

well-archi-checker/
├── .env.example # 環境変数の雛形
├── .cspell.json # スペルチェック除外リスト（archiなど）
├── .node-version # Node.jsバージョン指定ファイル
├── .prettierrc # Prettierの設定
├── package.json
├── tsconfig.json
├── src/
│ ├── index.ts # 実行エントリーポイント
│ ├── shared/ # AWS SDK クライアントなど共通処理
│ │ └── awsClient.ts
│ ├── operational-excellence/ # 1. 運用上の優秀性
│ │ └── checkCWAlarm.ts
│ ├── security/ # 2. セキュリティ
│ ├── reliability/ # 3. 信頼性
│ ├── performance-efficiency/ # 4. パフォーマンス効率
│ ├── cost-optimization/ # 5. コスト最適化
│ └── sustainability/ # 6. 持続可能性（予定）

---

## コーディング規約（命名・記述スタイル）

### 📁 ディレクトリ・ファイル命名規則

- **ディレクトリ名**：`kebab-case`（例：`operational-excellence`, `shared/types`）
- **ファイル名**：`kebab-case`（例：`check-cloud-trail.ts`, `check-result.ts`）
- **クラスやインターフェース名**：`PascalCase`（例：`CheckResult`）

> ✅ CLIツール、ユーティリティ系の構成では `kebab-case` をファイル名に統一することで、保守性と検索性が向上します。

---

#### 🧾 記述スタイル統一ルール（関数型優先）

- **リスト処理には `map()` を使うことを推奨します**
  - 副作用のないデータ変換は `for` より `map` を優先
  - `filter().map()` や `flatMap()` もOK
- **`for` 文は以下のようなケースのみに限定します**
  - 非同期処理が絡む（`for await` など）
  - 副作用・エラーハンドリングを伴う処理が必要
  - 処理の中で `break` / `continue` など制御が必要

```ts
// ✅ 推奨スタイル：map を使って CheckResult を生成
const results: CheckResult[] = resources.map(({ id, name }) => {
  const valid = validate(id);
  return {
    pillar,
    category,
    checkName,
    resource: `${name} (${id})`,
    status: valid ? 'OK' : 'NG',
    detail: valid ? '条件を満たしています' : '条件未達です',
  };
});
```
