/* mine.test.js — 文集（自分の文）純ロジックのテスト（node実行・ブラウザ不要）
 * Phrases.logic の addSentence / removeSentence / hasSentence を検証する。 */
"use strict";
const path = require("path");
const WEB = path.join(__dirname, "..", "web");

// ブラウザグローバルのスタブ
global.window = {};
global.document = { getElementById: () => null };

require(path.join(WEB, "sentence_builder_data.js"));
require(path.join(WEB, "grammar.js"));
require(path.join(WEB, "speech.js"));
require(path.join(WEB, "phrases.js"));

const L = window.Phrases.logic;
let n = 0, ng = 0;
function t(name, cond) {
  n++;
  if (!cond) { ng++; console.error("  ✗ " + name); }
  else console.log("  ✓ " + name);
}

console.log("― addSentence（追加・先頭・不変）―");
const base = [];
const a1 = L.addSentence(base, "I like it.", "好きだ", "2026-07-02");
t("空配列に1件追加できる", a1.length === 1 && a1[0].en === "I like it.");
t("jp/at が保持される", a1[0].jp === "好きだ" && a1[0].at === "2026-07-02");
t("元配列を変更しない（純関数）", base.length === 0);
const a2 = L.addSentence(a1, "You know it.", "分かるよ", "2026-07-03");
t("新しい文が先頭（新しい順）", a2[0].en === "You know it." && a2[1].en === "I like it." && a2.length === 2);

console.log("― addSentence（重複除去）―");
const dup = L.addSentence(a2, "I like it.", "好きだ（再）", "2026-07-04");
t("同じenは追加せず重複除去（件数維持）", dup.length === 2);
t("重複時は先頭に付け直され最新jpになる", dup[0].en === "I like it." && dup[0].jp === "好きだ（再）");

console.log("― addSentence（200上限・古い方から切り捨て）―");
let big = [];
for (let i = 0; i < L.MINE_MAX + 25; i++) big = L.addSentence(big, "s" + i + ".", "", "2026-07-02");
t("上限は MINE_MAX(=" + L.MINE_MAX + ") で頭打ち", big.length === L.MINE_MAX);
t("先頭は最後に入れた最新の文", big[0].en === "s" + (L.MINE_MAX + 24) + ".");
t("末尾（古い方）から捨てられる（s0は残らない）", !L.hasSentence(big, "s0."));

console.log("― removeSentence ―");
const rm = L.removeSentence(a2, "I like it.");
t("指定enを削除した新配列", rm.length === 1 && rm[0].en === "You know it.");
t("removeも元配列を変更しない", a2.length === 2);
t("存在しないenの削除は無害", L.removeSentence(a2, "nope.").length === 2);

console.log("― hasSentence ―");
t("存在すればtrue", L.hasSentence(a2, "I like it."));
t("なければfalse", !L.hasSentence(a2, "missing."));

console.log("");
if (ng) { console.error(ng + " / " + n + " 件失敗"); process.exit(1); }
console.log("全 " + n + " 件パス ✓");
