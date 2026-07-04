/* chunk-prompt.js — チャンクリーディング用プロンプトを標準出力に出す（Node実行）
 * アプリ本体と同じ buildPrompt を使う（文面の二重管理を避ける）。
 * 使い方: node tools/chunk-prompt.js "日本語の文" */
"use strict";
var path = require("path");

// chunks-data.js はブラウザ用なので window をスタブして読み込む
global.window = {};
require(path.join(__dirname, "..", "web", "chunks-data.js"));

var jp = process.argv.slice(2).join(" ").trim();
if (!jp) {
  console.error('使い方: node tools/chunk-prompt.js "日本語の文"');
  process.exit(1);
}
process.stdout.write(global.window.ChunkData.buildPrompt(jp));
