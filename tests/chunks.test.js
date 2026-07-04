/* chunks.test.js — チャンクリーディング機能（ChunkData）純ロジックのテスト（node実行・ブラウザ不要）
 * extractJson / parseResult / normCandidate / joinMatches / gradeItem3 / buildDeck /
 * addItem / removeItem / setRate / validateDoc / buildPrompt を検証する。 */
"use strict";
var path = require("path");
var WEB = path.join(__dirname, "..", "web");

// ブラウザグローバルのスタブ
global.window = {};
global.document = { getElementById: function () { return null; } };

require(path.join(WEB, "chunks-data.js"));

var C = window.ChunkData;
var L = C.logic;

var n = 0, ng = 0;
function t(name, cond) {
  n++;
  if (!cond) { ng++; console.error("  ✗ " + name); }
  else console.log("  ✓ " + name);
}

// ══════════════════════════════════════════════════════════
// extractJson
// ══════════════════════════════════════════════════════════
console.log("― extractJson ―");
var plain = '{"version":1,"candidates":[]}';
t("素のJSON", L.extractJson(plain) === plain);

var fenced = "```json\n" + plain + "\n```";
t("jsonフェンス", L.extractJson(fenced) === plain);

var fencedNoLang = "```\n" + plain + "\n```";
t("言語指定なしフェンス", L.extractJson(fencedNoLang) === plain);

var withPreamble = "はい、こちらが結果です。\n" + plain + "\nいかがでしょうか。";
t("前置き文付き", L.extractJson(withPreamble) === plain);

var withBracesInString = '{"a":"{not real}","b":"say \\"hi\\"","c":1}';
t("文字列値内に{}や\\\"を含むJSON", L.extractJson(withBracesInString) === withBracesInString);

t("JSONなし→null", L.extractJson("こんにちは、JSONはありません。") === null);

// ══════════════════════════════════════════════════════════
// parseResult
// ══════════════════════════════════════════════════════════
console.log("― parseResult ―");
function candJson(cands) {
  return JSON.stringify({ version: 1, candidates: cands });
}
function okCand(label) {
  return {
    label: label, nuance: "ニュアンス", en: "I go to school.",
    chunks: [
      { en: "I", jp: "私は", note: "主語" },
      { en: "go", jp: "行く", note: "動詞" },
      { en: "to school.", jp: "学校へ", note: "前置詞句" }
    ]
  };
}
function okCand2(label) {
  return {
    label: label, nuance: "ニュアンス2", en: "She likes it.",
    chunks: [
      { en: "She", jp: "彼女は", note: "主語" },
      { en: "likes", jp: "好き", note: "動詞" },
      { en: "it.", jp: "それが", note: "目的語" }
    ]
  };
}

var r1 = C.parseResult(candJson([okCand("plain"), okCand("natural")]));
t("正常2候補: ok", r1.ok === true);
t("正常2候補: candidates2件", r1.candidates.length === 2);
t("正常2候補: warnsは空", r1.warns.length === 0);

var r2 = C.parseResult('{"version":1}');
t("candidates欠落→error文言", r2.ok === false && r2.error === "翻訳候補が読み取れません。プロンプトを再コピーして最初からやり直してください。");

var missingEn = JSON.parse(candJson([okCand("plain")]));
delete missingEn.candidates[0].en;
var r3 = C.parseResult(JSON.stringify(missingEn));
var withGoodOne = JSON.parse(candJson([okCand("plain")]));
delete withGoodOne.candidates[0].en;
withGoodOne.candidates.push(okCand("natural"));
var r3b = C.parseResult(JSON.stringify(withGoodOne));
t("en欠落候補は破棄され1候補でok", r3b.ok === true && r3b.candidates.length === 1);
t("1候補になったらwarnsに「候補が1つだけ返りました。」", r3b.warns.indexOf("候補が1つだけ返りました。") !== -1);

var r4 = C.parseResult(candJson([{ label: "plain" }]));
t("全滅→error", r4.ok === false && r4.error === "翻訳候補が読み取れません。プロンプトを再コピーして最初からやり直してください。");

var noteMissing = JSON.parse(candJson([okCand("plain"), okCand("natural")]));
delete noteMissing.candidates[0].chunks[0].note;
var r5 = C.parseResult(JSON.stringify(noteMissing));
t("note欠落→\"\"補完", r5.ok === true && r5.candidates[0].chunks[0].note === "");

var nuanceBad = JSON.parse(candJson([okCand("plain"), okCand("natural")]));
nuanceBad.candidates[0].nuance = 123;
var r6 = C.parseResult(JSON.stringify(nuanceBad));
t("nuance非string→\"\"", r6.ok === true && r6.candidates[0].nuance === "");

var r7 = C.parseResult(candJson([okCand("plain"), okCand("natural"), okCand("extra")]));
t("3候補→2つ採用", r7.ok === true && r7.candidates.length === 2);

var manyChunks = JSON.parse(candJson([okCand("plain"), okCand("natural")]));
var bigChunks = [];
for (var i = 0; i < 21; i++) bigChunks.push({ en: "w" + i, jp: "w" + i, note: "" });
manyChunks.candidates[0].chunks = bigChunks;
var r8 = C.parseResult(JSON.stringify(manyChunks));
t("chunks21個→候補破棄（残り1件でok）", r8.ok === true && r8.candidates.length === 1);

t("JSONなし→error文言", C.parseResult("説明だけでJSONなし").error === "JSONが見つかりません。AIの返答を最初から最後までそのまま貼り付けてください。");
t("JSON壊れ→error文言", C.parseResult('{"version":1,"candidates":[,]}').error === "JSONの形が壊れています。AIにもう一度『JSONだけを出力して』と頼んでください。");

// ══════════════════════════════════════════════════════════
// joinMatches
// ══════════════════════════════════════════════════════════
console.log("― joinMatches ―");
var goodCand = okCand("plain");
t("完全一致", L.joinMatches(goodCand) === true);

var punctCand = {
  en: "I go to school!",
  chunks: [{ en: "I" }, { en: "go" }, { en: "to school." }]
};
t("句読点・大小文字差は一致扱い", L.joinMatches(punctCand) === true);

var missingWordCand = {
  en: "I go to school.",
  chunks: [{ en: "I" }, { en: "to school." }]
};
t("単語欠落は不一致", L.joinMatches(missingWordCand) === false);

var r9 = C.parseResult(candJson([
  { label: "plain", nuance: "n", en: "I go to school.", chunks: [{ en: "I", jp: "私", note: "" }, { en: "to school.", jp: "学校", note: "" }] },
  okCand("natural")
]));
t("不一致候補があればwarnsに追加される", r9.warns.indexOf("チャンクの結合が全文と一致しません（AIの分割ミスの可能性）。") !== -1);
t("不一致でもerrorにはしない", r9.ok === true);

// ══════════════════════════════════════════════════════════
// gradeItem3
// ══════════════════════════════════════════════════════════
console.log("― gradeItem3 ―");
var today0 = "2026-07-04";
var g1 = C.gradeItem3(null, "ok", today0);
t("null srsにok→box1", g1.box === 1);
t("null srsにok→due明日", g1.due === "2026-07-05");
t("null srsにok→seen1,ok1", g1.seen === 1 && g1.ok === 1);

var g2 = C.gradeItem3(null, "soft", today0);
t("soft→box0", g2.box === 0);
t("soft→due明日", g2.due === "2026-07-05");
t("soft→okは加算されない", g2.ok === 0 && g2.seen === 1);

var g3 = C.gradeItem3(null, "ng", today0);
t("ng→box0", g3.box === 0);
t("ng→due今日", g3.due === today0);

var box4srs = { box: 4, due: "2026-01-01", seen: 10, ok: 8 };
var g4 = C.gradeItem3(box4srs, "ok", today0);
t("box4でok→頭打ち", g4.box === 4);
t("box4でokのdueは14日後", g4.due === "2026-07-18");

var badBoxSrs = { box: "abc", due: "2026-01-01", seen: 3, ok: 2 };
var g5 = C.gradeItem3(badBoxSrs, "ok", today0);
t("不正box(\"abc\")→0扱い→ok後box1", g5.box === 1);

var seenOkSrs = { box: 1, due: "2026-01-01", seen: 5, ok: 3 };
var g6 = C.gradeItem3(seenOkSrs, "ok", today0);
t("seen加算", g6.seen === 6);
t("ok加算", g6.ok === 4);
var g7 = C.gradeItem3(seenOkSrs, "ng", today0);
t("ng時seenのみ加算", g7.seen === 6 && g7.ok === 3);

// 非破壊確認
t("gradeItem3は元srsを変更しない", seenOkSrs.box === 1 && seenOkSrs.seen === 5);

// ══════════════════════════════════════════════════════════
// buildDeck / isDue / dueCount
// ══════════════════════════════════════════════════════════
console.log("― buildDeck / isDue / dueCount ―");
t("isDue: null srsはfalse", C.isDue(null, today0) === false);
t("isDue: 不正srsはfalse", C.isDue({ box: 1 }, today0) === false);
t("isDue: 期限切れはtrue", C.isDue({ box: 1, due: "2026-07-01" }, today0) === true);
t("isDue: 当日due", C.isDue({ box: 1, due: today0 }, today0) === true);
t("isDue: 未来はfalse", C.isDue({ box: 1, due: "2026-07-05" }, today0) === false);

function mkItem(id, srs) {
  return { id: id, jp: "j" + id, en: "e" + id, chunks: [{ en: "e" + id, jp: "j" + id, note: "" }], altEn: "", altLabel: "", altNuance: "", tags: [], createdAt: today0, srs: srs };
}
var items = [
  mkItem("a", { box: 1, due: "2026-07-01", seen: 1, ok: 1 }), // 期限切れ
  mkItem("b", null), // 未学習
  mkItem("c", { box: 2, due: "2026-07-10", seen: 2, ok: 2 }), // 将来（遠い）
  mkItem("d", { box: 1, due: "2026-07-06", seen: 1, ok: 1 }), // 将来（近い）
  mkItem("e", { box: 1, due: today0, seen: 1, ok: 1 }) // 当日due
];
var deck = C.buildDeck(items, today0);
t("全件含む", deck.length === 5);
t("due(期限切れ含む当日)が先頭グループ", deck[0].id === "a" || deck[0].id === "e");
var dueIds = deck.slice(0, 2).map(function (x) { return x.id; }).sort();
t("due2件がaとe", JSON.stringify(dueIds) === JSON.stringify(["a", "e"]));
t("未学習がdueの次", deck[2].id === "b");
t("将来dueは昇順(d→c)", deck[3].id === "d" && deck[4].id === "c");

t("dueCount: due件数(a,e)", C.dueCount(items, today0) === 2);

// ══════════════════════════════════════════════════════════
// addItem / removeItem / setRate
// ══════════════════════════════════════════════════════════
console.log("― addItem / removeItem / setRate ―");
function emptyDoc() { return { version: 1, settings: { rate: 0.85 }, items: [] }; }
var cand1 = okCand("plain");
var item1 = C.newItem("私は学校へ行く。", cand1, null);
t("newItem: idにcプレフィックス", /^c[0-9a-z]+$/.test(item1.id));
t("newItem: altがnullならaltEnは\"\"", item1.altEn === "" && item1.altLabel === "" && item1.altNuance === "");
t("newItem: jp/enが設定される", item1.jp === "私は学校へ行く。" && item1.en === cand1.en);
t("newItem: srsはnull", item1.srs === null);
t("newItem: createdAtがYYYY-MM-DD形式", /^\d{4}-\d{2}-\d{2}$/.test(item1.createdAt));

var doc0 = emptyDoc();
var doc1 = C.addItem(doc0, item1);
t("addItem: 先頭追加", doc1.items.length === 1 && doc1.items[0].id === item1.id);
t("addItem: 非破壊（元docは変わらない）", doc0.items.length === 0);

var item2 = C.newItem("二つ目", okCand2("natural"), null);
var doc2 = C.addItem(doc1, item2);
t("addItem: 新しい方が先頭", doc2.items[0].id === item2.id && doc2.items[1].id === item1.id);

// en完全一致重複
var dupItem = C.newItem("重複テスト", cand1, null); // enはcand1.enと同じ "I go to school."
var doc3 = C.addItem(doc2, dupItem);
t("addItem: en重複は既存を除いて先頭に", doc3.items.length === 2 && doc3.items[0].id === dupItem.id);
t("addItem: 重複除去後、古い方(item1)は消える", doc3.items.filter(function (x) { return x.id === item1.id; }).length === 0);

// 201件目切り捨て
var bigDoc = emptyDoc();
for (var k = 0; k < C.MAX_ITEMS + 1; k++) {
  bigDoc = C.addItem(bigDoc, C.newItem("s" + k, { label: "plain", nuance: "", en: "s" + k + " sentence.", chunks: [{ en: "s" + k, jp: "j", note: "" }, { en: "sentence.", jp: "j2", note: "" }] }, null));
}
t("addItem: MAX_ITEMS(=" + C.MAX_ITEMS + ")で頭打ち", bigDoc.items.length === C.MAX_ITEMS);
t("addItem: 先頭は最後に追加したもの", bigDoc.items[0].en === "s" + C.MAX_ITEMS + " sentence.");

var docForRemove = C.addItem(C.addItem(emptyDoc(), item1), item2);
var docRemoved = C.removeItem(docForRemove, item1.id);
t("removeItem: 指定id削除", docRemoved.items.length === 1 && docRemoved.items[0].id === item2.id);
t("removeItem: 非破壊", docForRemove.items.length === 2);

var docRate0 = emptyDoc();
var docRate1 = C.setRate(docRate0, 1.2);
t("setRate: 値が反映される", docRate1.settings.rate === 1.2);
t("setRate: 非破壊", docRate0.settings.rate === 0.85);

// ══════════════════════════════════════════════════════════
// validateDoc
// ══════════════════════════════════════════════════════════
console.log("― validateDoc（logic.validateDoc）―");
var brokenRaw = {
  version: 1,
  settings: { rate: 999 },
  items: [
    { id: "c1", jp: "正常", en: "Normal.", chunks: [{ en: "Normal.", jp: "正常" }], altEn: "", altLabel: "", altNuance: "", tags: [], createdAt: "2026-07-01", srs: { box: 9, due: "NaN-NaN-NaN" } },
    { id: "c2", en: "no jp field.", chunks: [{ en: "x", jp: "y" }] }, // jp欠落
    { id: "c3", jp: "chunks空", en: "Empty chunks.", chunks: [] }, // chunks空
    { jp: "id欠落", en: "No id.", chunks: [{ en: "x", jp: "y" }] } // id欠落
  ]
};
var validated = L.validateDoc(brokenRaw);
t("validateDoc: rate範囲外は0.85に落ちる", validated.settings.rate === 0.85);
t("validateDoc: 壊れたitemsは全部捨てられる", validated.items.length === 1);
t("validateDoc: srs.due不正(NaN-NaN-NaN)はnullに落ちる", validated.items[0].srs === null);

var allBroken = { version: 1, settings: {}, items: [{ id: "x" }] };
var validatedAllBroken = L.validateDoc(allBroken);
t("validateDoc: 全壊→items:[]", validatedAllBroken.items.length === 0);
t("validateDoc: settings欠落→rate 0.85", validatedAllBroken.settings.rate === 0.85);

var goodRaw = {
  version: 1,
  settings: { rate: 1.1 },
  items: [
    { id: "c9", jp: "良い", en: "Good one.", chunks: [{ en: "Good", jp: "良い" }, { en: "one.", jp: "の" }], altEn: "Alt.", altLabel: "natural", altNuance: "n", tags: ["t1"], createdAt: "2026-07-01", srs: { box: 2, due: "2026-08-01" } }
  ]
};
var validatedGood = L.validateDoc(goodRaw);
t("validateDoc: 正常itemはそのまま残る", validatedGood.items.length === 1 && validatedGood.items[0].id === "c9");
t("validateDoc: 正常srsは保持される", validatedGood.items[0].srs.box === 2 && validatedGood.items[0].srs.due === "2026-08-01");

// ══════════════════════════════════════════════════════════
// load / save（localStorage未定義環境でも落ちない）
// ══════════════════════════════════════════════════════════
console.log("― load / save（localStorage無し環境）―");
var loaded = C.load();
t("load: localStorage無しでも例外なく既定doc", loaded && loaded.version === 1 && Array.isArray(loaded.items) && loaded.items.length === 0);
t("load: settings.rateの既定値", loaded.settings.rate === 0.85);
var saveThrew = false;
try { C.save(loaded); } catch (e) { saveThrew = true; }
t("save: localStorage無しでも例外を投げない", saveThrew === false);

// ══════════════════════════════════════════════════════════
// buildPrompt
// ══════════════════════════════════════════════════════════
console.log("― buildPrompt ―");
var prompt = C.buildPrompt("これはテストです。");
t("buildPrompt: 入力jpが埋まる", prompt.indexOf("これはテストです。") !== -1);
t("buildPrompt: 前置詞句ルールを含む", prompt.indexOf("前置詞句の直前を主な境界とする") !== -1);
t("buildPrompt: 主語・動詞・目的語ルールを含む", prompt.indexOf("主語・動詞・目的語の核は分断しない") !== -1);
t("buildPrompt: 句動詞等のルールを含む", prompt.indexOf("句動詞・複合前置詞・固定表現・不定詞の to は途中で切らない") !== -1);
t("buildPrompt: 結合一致ルールを含む", prompt.indexOf("チャンクを順に空白1つで結合すると英文全体と完全一致すること（句読点も含める）") !== -1);

// ══════════════════════════════════════════════════════════
// 文字列長キャップ（AI/localStorage由来の巨大文字列への防御）
// ══════════════════════════════════════════════════════════
console.log("― 文字列長キャップ ―");
var huge = new Array(10002).join("x"); // 10001文字
var hugeCand = {
  label: "plain", nuance: huge, en: huge,
  chunks: [{ en: huge, jp: huge, note: huge }]
};
var capped = L.normCandidate(hugeCand, 0);
t("cap: en は300文字以内", capped.en.length <= 300);
t("cap: chunk.en は200文字以内", capped.chunks[0].en.length <= 200);
t("cap: note は120文字以内", capped.chunks[0].note.length <= 120);
t("cap: nuance は100文字以内", capped.nuance.length <= 100);
var hugeDoc = L.validateDoc({
  version: 1, settings: { rate: 0.85 },
  items: [{ id: "x1", jp: huge, en: huge, chunks: [{ en: huge, jp: huge, note: huge }], altEn: huge, srs: null }]
});
t("cap: validateDoc でも jp/en/altEn が切り詰められる",
  hugeDoc.items[0].jp.length <= 300 && hugeDoc.items[0].en.length <= 300 && hugeDoc.items[0].altEn.length <= 300);
t("cap: 通常の長さの文字列は変化しない", L.normCandidate(okCand("plain"), 0).en === "I go to school.");

// 空文字チャンクを持つitemはvalidateDocで丸ごと捨てられる（normChunkのnullがchunksに混入しない）
var emptyChunkDoc = L.validateDoc({
  version: 1, settings: { rate: 0.85 },
  items: [{ id: "x2", jp: "テスト", en: "Test.", chunks: [{ en: "", jp: "空" }], srs: null }]
});
t("空文字チャンクのitemはvalidateDocで破棄される", emptyChunkDoc.items.length === 0);

// ══════════════════════════════════════════════════════════
// プロンプト見本（…プレースホルダ）の取り込み防止
// ══════════════════════════════════════════════════════════
console.log("― プレースホルダ防止 ―");
var promptText = C.buildPrompt("キックオフで色々なエンジニアと話せて楽しかった");
var pr1 = C.parseResult(promptText);
t("プロンプト自体を貼る→error", pr1.ok === false);
t("プロンプト自体を貼る→見本と伝える文言", pr1.error.indexOf("見本") !== -1);

var echoThenAnswer = promptText + "\n以下が翻訳です。\n" + candJson([okCand("plain"), okCand("natural")]);
var pr2 = C.parseResult(echoThenAnswer);
t("見本の復唱＋本物の回答→ok", pr2.ok === true);
t("見本の復唱＋本物の回答→本物側が採用される", pr2.candidates[0].en === "I go to school.");
t("見本の復唱＋本物の回答→候補2件", pr2.candidates.length === 2);

var dotsCand = { label: "plain", nuance: "…", en: "…", chunks: [{ en: "…", jp: "…", note: "…" }] };
t("en:\"…\"の候補はnormCandidateで破棄", L.normCandidate(dotsCand, 0) === null);

var dotsDoc = L.validateDoc({
  version: 1, settings: { rate: 0.85 },
  items: [{ id: "x3", jp: "見本を保存してしまった", en: "…", chunks: [{ en: "…", jp: "…" }], srs: null }]
});
t("en:\"…\"の保存済みitemは読み込み時に破棄される", dotsDoc.items.length === 0);

var all = L.extractJsonAll('前置き {"a":1} 中間 {"b":{"c":2}} 後置き');
t("extractJsonAll: 複数ブロックを出現順に列挙", all.length === 2 && all[0] === '{"a":1}' && all[1] === '{"b":{"c":2}}');

console.log("");
if (ng) { console.error(ng + " / " + n + " 件失敗"); process.exit(1); }
console.log("全 " + n + " 件パス ✓");
