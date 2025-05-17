# PDF417.js

PDF417 バーコードジェネレーター。オープンソースで、TypeScript 製。

[English documentation](../README.md)

## 特徴

- 🚀 純粋な TypeScript 実装 - 外部依存関係なし
- 🌐 Web 標準に準拠 - モダンブラウザや Workers で動作...するはず
- 📦 スタンドアロンライブラリ - どのプロジェクトにも簡単に統合可能
- 🔧 完全にカスタマイズ可能なバーコード生成
- 📱 レスポンシブでスケーラブルな出力

## インストール

```bash
npm install pdf417js
```

## 使用方法

```typescript
import { PDF417 } from "pdf417js";

// 新しいインスタンスを作成
const pdf417 = new PDF417();

// バーコードを生成
const barcode = pdf417.generate("Hello, World!");

// バーコードを文字列として取得
console.log(pdf417.toString());
```

## オプション

以下のオプションでバーコード生成をカスタマイズできます：

```typescript
const pdf417 = new PDF417({
  rowHeight: 4, // 各行の高さ（モジュール単位）
  quietH: 2, // 水平方向のクワイエットゾーン（モジュール単位）
  quietV: 2, // 垂直方向のクワイエットゾーン（モジュール単位）
});
```

## 開発

```bash
# 依存関係のインストール
npm install

# テストの実行
npm test

# ビルド
npm run build
```

## ライセンス

ISC
