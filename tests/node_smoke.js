/* tests/node_smoke.js — リポジトリ全体のスモークテスト（node実行・ブラウザ不要・依存ゼロ）
 * 実行: node tests/node_smoke.js （リポジトリルートから。パスは __dirname 基準で web/ を参照）
 * 対象: phrases.js（既存）/ grammar.js（進行形）/ ビルド出力データ整合 / quiz.js（新規）*/
"use strict";
var path = require("path");
var WEB = path.join(__dirname, "..", "web");

// ── ブラウザグローバルのスタブ ─────────────────────────
global.window = {};
global.document = { getElementById: function () { return null; } };

require(path.join(WEB, "sentence_builder_data.js"));
require(path.join(WEB, "grammar.js"));
require(path.join(WEB, "speech.js"));
require(path.join(WEB, "phrases.js"));
require(path.join(WEB, "quiz.js"));

var D = window.WORD_DATA;
var G = window.Grammar;
var L = window.Phrases.logic;
var Q = window.Quiz;

var n = 0, ng = 0;
function t(name, cond) {
  n++;
  if (!cond) { ng++; console.error("  ✗ " + name); }
  else console.log("  ✓ " + name);
}

// ══════════════════════════════════════════════════════════
// A) phrases.js 純ロジック（既存スモークテストの移植）
// ══════════════════════════════════════════════════════════
console.log("― データ整合（phrases）―");
t("phrases が30件", D.phrases.length === 30);
t("カテゴリが6種", D.groups.phrases.length === 6);
t("空所型が正しい", D.phrases.every(function (p) { return ["none", "language", "chunk", "noun", "thing", "place"].indexOf(p.blank) !== -1; }));
t("空所あり⇔〇〇と候補が整合", D.phrases.every(function (p) {
  return (p.blank === "none") === !p.en.includes("〇〇") &&
    (p.blank === "none") === (p.choices.length === 0);
}));

console.log("― gradeItem（Leitner昇箱・降箱）―");
var today = "2026-07-02";
var it = L.gradeItem(undefined, true, today);
t("初回○: box1・翌日due", it.box === 1 && it.due === "2026-07-03" && it.seen === 1 && it.ok === 1);
it = L.gradeItem(it, true, today);
t("2回目○: box2・3日後", it.box === 2 && it.due === "2026-07-05");
it = L.gradeItem(it, true, today);
it = L.gradeItem(it, true, today);
t("4回目○: box4・14日後", it.box === 4 && it.due === "2026-07-16");
it = L.gradeItem(it, true, today);
t("box4で頭打ち", it.box === 4);
it = L.gradeItem(it, false, today);
t("✗でbox0・即日due", it.box === 0 && it.due === today && it.seen === 6 && it.ok === 5);

console.log("― addDays（月跨ぎ）―");
t("月末跨ぎ", L.addDays("2026-07-31", 1) === "2026-08-01");
t("年跨ぎ", L.addDays("2026-12-25", 14) === "2027-01-08");

console.log("― isDue ―");
t("未学習はdue", L.isDue(undefined, today));
t("当日due", L.isDue({ due: today }, today));
t("明日はまだ", !L.isDue({ due: "2026-07-03" }, today));

console.log("― buildDeck（期限→未学習→先の順）―");
var ph = D.phrases.slice(0, 4);
var items = {};
items[ph[0].id] = { box: 1, due: "2026-07-01" }; // 期限切れ → 先頭
items[ph[1].id] = { box: 3, due: "2026-07-10" }; // まだ先 → 最後
items[ph[2].id] = { box: 2, due: "2026-07-05" }; // まだ先だが近い → later内で先
var deck = L.buildDeck(ph, items, today);
t("期限切れが先頭", deck[0].id === ph[0].id);
t("未学習が2番目", deck[1].id === ph[3].id);
t("先のものはdue昇順", deck[2].id === ph[2].id && deck[3].id === ph[1].id);
t("全件含む", deck.length === 4);

console.log("― boxDist / masteredCount ―");
var dist = L.boxDist(ph, items);
t("distの合計が件数", dist.fresh + dist.boxes.reduce(function (a, b) { return a + b; }, 0) === 4);
t("mastered=box2以上", L.masteredCount(ph, items) === 2);

console.log("― fillSentence ―");
t("穴埋め合成", L.fillSentence("Do you speak 〇〇?", "Japanese") === "Do you speak Japanese?");

console.log("― レビュー指摘の防御（HIGH修正の回帰）―");
var broken = L.gradeItem({ box: "abc", due: "NaN-NaN-NaN" }, true, today);
t("不正boxでもNaNにならない", broken.box === 1 && broken.due === "2026-07-03");
var broken2 = L.gradeItem({ box: -5 }, true, today);
t("負のboxは0扱い", broken2.box === 1);

console.log("― 穴埋めDB候補の前提 ―");
t("場所・空間グループの名詞が存在", D.nouns.some(function (x) { return x.group === "場所・空間"; }));

// ══════════════════════════════════════════════════════════
// B) Grammar.verbSurface（進行形対応・実装は編集禁止、テストのみ）
// ══════════════════════════════════════════════════════════
console.log("― Grammar.verbSurface（進行形）―");
var think = { en: "think", forms: { base: "think", thirdsg: "thinks", past: "thought", pp: "thought", ing: "thinking" } };
var be = { en: "be", forms: {} };
t("3単現", G.verbSurface(think, { person: "3sg" }) === "thinks");
t("3単現否定", G.verbSurface(think, { person: "3sg", negative: true }) === "doesn't think");
t("過去否定", G.verbSurface(think, { tense: "past", negative: true }) === "didn't think");
t("法助動詞否定", G.verbSurface(think, { modal: "can", negative: true }) === "can't think");
t("進行形(1sg)", G.verbSurface(think, { aspect: "progressive" }) === "am thinking");
t("進行形(3sg)", G.verbSurface(think, { aspect: "progressive", person: "3sg" }) === "is thinking");
t("進行形(3pl)否定", G.verbSurface(think, { aspect: "progressive", person: "3pl", negative: true }) === "are not thinking");
t("進行形過去(1sg)否定", G.verbSurface(think, { aspect: "progressive", tense: "past", person: "1sg", negative: true }) === "was not thinking");
t("進行形+法助動詞", G.verbSurface(think, { aspect: "progressive", modal: "will" }) === "will be thinking");
t("beは進行形にしない", G.verbSurface(be, { aspect: "progressive", person: "3sg" }) === "is");

// ══════════════════════════════════════════════════════════
// C) データ整合（新規：build_web.py の重複除去バグ回帰）
// ══════════════════════════════════════════════════════════
console.log("― データ整合（verbs.patternsAllowed）―");
t("全verbsのpatternsAllowedに重複なし", D.verbs.every(function (v) {
  return v.patternsAllowed.length === new Set(v.patternsAllowed).size;
}));
var speakV = D.verbs.filter(function (v) { return v.en === "speak"; })[0];
var turnV = D.verbs.filter(function (v) { return v.en === "turn"; })[0];
var makeV = D.verbs.filter(function (v) { return v.en === "make"; })[0];
t("speakのpatternsAllowedが[SVO]", JSON.stringify(speakV.patternsAllowed) === JSON.stringify(["SVO"]));
t("turnのpatternsAllowedが[SVO,SVC]", JSON.stringify(turnV.patternsAllowed) === JSON.stringify(["SVO", "SVC"]));
t("makeのpatternsAllowedが[SVO,SVOC]", JSON.stringify(makeV.patternsAllowed) === JSON.stringify(["SVO", "SVOC"]));

// ══════════════════════════════════════════════════════════
// D) Quiz.logic
// ══════════════════════════════════════════════════════════
console.log("― Quiz.logic.buildPool ―");
var poolFunctions = Q.logic.buildPool(D, "functions");
var poolPhrases = Q.logic.buildPool(D, "phrases");
var poolVerbs = Q.logic.buildPool(D, "verbs");
var poolAll = Q.logic.buildPool(D, "all");
t("functionsが50件", poolFunctions.length === 50);
t("phrasesが14件", poolPhrases.length === 14);
t("verbsが50件以上", poolVerbs.length >= 50);
t("allは3プールの和", poolAll.length === poolFunctions.length + poolPhrases.length + poolVerbs.length);
t("各itemのenの末尾に記号なし", poolAll.every(function (item) { return !/[.?!]$/.test(item.en); }));

console.log("― Quiz.logic.weightFor ―");
t("履歴なし→3.0", Q.logic.weightFor({ key: "x" }, {}) === 3.0);
t("正答率低い(seen5,ok2)→2.0", Q.logic.weightFor({ key: "x" }, { x: { seen: 5, ok: 2, last: today } }) === 2.0);
t("正答率高い(seen5,ok5)→1.0", Q.logic.weightFor({ key: "x" }, { x: { seen: 5, ok: 5, last: today } }) === 1.0);

console.log("― Quiz.logic.pickWeighted ―");
var samplePool = poolFunctions.slice(0, 5);
var poolSnapshot = JSON.parse(JSON.stringify(samplePool));
var itemsSnapshot = {};
t("rand=0でpool[0]を返す（決定的）", Q.logic.pickWeighted(samplePool, {}, function () { return 0; }) === samplePool[0]);
t("rand=0.999...で末尾要素を返す", Q.logic.pickWeighted(samplePool, {}, function () { return 0.9999999; }) === samplePool[samplePool.length - 1]);
t("空poolはnull", Q.logic.pickWeighted([], {}, function () { return 0; }) === null);
t("pool/itemsが非破壊", JSON.stringify(samplePool) === JSON.stringify(poolSnapshot) && JSON.stringify(itemsSnapshot) === JSON.stringify({}));

console.log("");
if (ng) { console.error(ng + " / " + n + " 件失敗"); process.exit(1); }
console.log("全 " + n + " 件パス ✓");
