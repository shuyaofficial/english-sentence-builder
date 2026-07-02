/* quiz.js — 逆クイズ（日本語 → 英語）の出題ロジック
 * 出題プールの構築・重み付き抽選・正答率に基づく重み計算を純関数で提供し、
 * window.Quiz に公開する（DOM操作は一切行わない）。
 * 依存: sentence_builder_data.js (WORD_DATA.verbs / .functions / .phrases)
 * localStorage キー: srb.quiz.v1 に { version:1, items:{ "src:en": {seen,ok,last} } } を保存する。
 * 読み込み順: sentence_builder_data.js → quiz.js（app.js からの利用時） */
(function () {
  "use strict";

  var LS_KEY = "srb.quiz.v1";
  var SOURCES = [
    ["verbs", "動詞の例文"],
    ["functions", "機能フレーズ"],
    ["phrases", "必須フレーズ"],
    ["all", "すべて"]
  ];

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function stripEndPunct(s) { return (s || "").replace(/[.?!]+$/, ""); }

  // ── プール構築（純関数・非破壊）─────────────────────────
  function verbItems(data) {
    return (data.verbs || []).filter(function (v) {
      if (!v.ex_en) return false;
      var n = v.ex_en.split(" ").length;
      return n >= 3 && n <= 6;
    }).map(function (v) {
      return { key: "verbs:" + v.en, jp: v.ex_jp, en: stripEndPunct(v.ex_en), src: "verbs" };
    });
  }
  function functionItems(data) {
    return (data.functions || []).map(function (f) {
      return { key: "functions:" + f.ex_en, jp: f.ex_jp, en: stripEndPunct(f.ex_en), src: "functions" };
    });
  }
  function phraseItems(data) {
    return (data.phrases || []).filter(function (p) {
      return p.blank === "none";
    }).map(function (p) {
      return { key: "phrases:" + p.en, jp: p.jp, en: stripEndPunct(p.en), src: "phrases" };
    });
  }
  function buildPool(data, source) {
    if (source === "verbs") return verbItems(data);
    if (source === "functions") return functionItems(data);
    if (source === "phrases") return phraseItems(data);
    return verbItems(data).concat(functionItems(data), phraseItems(data));
  }

  // ── 重み付け（未出題を優先、正答率が低いものも優先） ───────
  function weightFor(item, items) {
    var it = items[item.key];
    if (!it || !it.seen) return 3.0;
    if (it.seen > 0 && it.ok / it.seen < 0.8) return 2.0;
    return 1.0;
  }
  // 重み付き抽選。pool/items は変更しない。rand() は [0,1) を返す関数
  function pickWeighted(pool, items, rand) {
    if (!pool.length) return null;
    var rf = typeof rand === "function" ? rand : Math.random;
    var weights = pool.map(function (item) { return weightFor(item, items); });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = rf() * total;
    var acc = 0;
    for (var i = 0; i < pool.length; i++) {
      acc += weights[i];
      if (r < acc) return pool[i];
    }
    return pool[pool.length - 1];
  }

  // ── localStorage 層（壊れたデータは黙って初期値に落とす） ──
  function validHistItem(it) {
    return !!it && typeof it.seen === "number" && it.seen >= 0 &&
      typeof it.ok === "number" && it.ok >= 0 &&
      typeof it.last === "string";
  }
  function loadHist() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return { version: 1, items: {} };
      var d = JSON.parse(raw);
      if (!d || typeof d.items !== "object" || !d.items) return { version: 1, items: {} };
      var items = {};
      Object.keys(d.items).forEach(function (k) {
        if (validHistItem(d.items[k])) items[k] = d.items[k];
      });
      return { version: 1, items: items };
    } catch (e) { return { version: 1, items: {} }; }
  }
  function saveHist(h) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(h)); } catch (e) { }
  }

  // ── 公開API ─────────────────────────────────────────────
  function next(source) {
    var D = window.WORD_DATA;
    if (!D) return null;
    var pool = buildPool(D, source);
    var hist = loadHist();
    return pickWeighted(pool, hist.items, Math.random);
  }
  function record(key, ok) {
    var hist = loadHist();
    var cur = hist.items[key];
    hist.items[key] = {
      seen: ((cur && cur.seen) || 0) + 1,
      ok: ((cur && cur.ok) || 0) + (ok ? 1 : 0),
      last: todayStr()
    };
    saveHist(hist);
  }
  function stats(source) {
    var D = window.WORD_DATA;
    var pool = D ? buildPool(D, source) : [];
    var hist = loadHist();
    var answered = 0, correct = 0;
    pool.forEach(function (item) {
      var it = hist.items[item.key];
      if (!it) return;
      answered++;
      if (it.seen > 0 && it.ok / it.seen >= 0.8) correct++;
    });
    return { answered: answered, correct: correct, total: pool.length };
  }

  window.Quiz = {
    SOURCES: SOURCES,
    next: next,
    record: record,
    stats: stats,
    logic: {
      buildPool: buildPool,
      weightFor: weightFor,
      pickWeighted: pickWeighted
    }
  };
})();
