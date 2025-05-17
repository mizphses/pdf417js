# PDF417.js

TypeScript implementation of PDF417 barcode generator.

[日本語版ドキュメントはこちら](./docs/README.ja.md)

## Features

- 🚀 Pure TypeScript implementation - no external dependencies
- 🌐 Web standards compliant - works in any modern browser and workers ... maybe
- 📦 Standalone library - easy to integrate into any project
- 🔧 Fully customizable barcode generation
- 📱 Responsive and scalable output

## Installation

```bash
npm install pdf417js
```

## Usage

```typescript
import { PDF417 } from "pdf417js";

// Create a new instance
const pdf417 = new PDF417();

// Generate barcode
const barcode = pdf417.generate("Hello, World!");

// Get barcode as string
console.log(pdf417.toString());
```

## Options

You can customize the barcode generation with the following options:

```typescript
const pdf417 = new PDF417({
  rowHeight: 4, // Height of each row in modules
  quietH: 2, // Horizontal quiet zone in modules
  quietV: 2, // Vertical quiet zone in modules
});
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## License

ISC
