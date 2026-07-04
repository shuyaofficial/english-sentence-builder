/* chunks-data.js — チャンクリーディング機能の純ロジック層
 * 日本語→英訳AIプロンプト生成・AI返答のJSON抽出/検証・SRS（3段階Leitner）・
 * アイテムの永続化まわりを window.ChunkData に公開する（DOM操作は一切行わない）。
 * 依存: なし（依存ゼロ）。UI層（未実装・並行開発中）から window.ChunkData を利用する想定。
 * localStorage キー: srb.chunks.v1 に { version:1, settings:{rate}, items:[...] } を保存する。 */
(function () {
  "use strict";

  var MAX_ITEMS = 200; // 保存上限（超過分は末尾＝古い方から切り捨て）
  var BOX_DAYS = [0, 1, 3, 7, 14]; // 箱ごとの復習間隔（日）
  var STORE_KEY = "srb.chunks.v1";
  var DEFAULT_RATE = 0.85; // 読み上げ速度の既定値

  // ── 日付ユーティリティ（phrases.js と同じロジック）───────
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function toDateStr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function today() { return toDateStr(new Date()); }
  function addDays(dateStr, n) {
    var p = dateStr.split("-");
    return toDateStr(new Date(+p[0], +p[1] - 1, +p[2] + n));
  }

  // ── プロンプト生成 ──────────────────────────────────────
  function buildPrompt(jp) {
    return "あなたは日本人英語学習者（CEFR A2〜B1）のための英語コーチです。\n" +
      "次の日本語を英語にしてください。\n\n" +
      "【日本語】\n" + jp + "\n\n" +
      "【要件】\n" +
      "1. 英訳は2案。\n" +
      "   - 1案目 label:\"plain\" — まず確実に通じる平易な表現（中学英語レベルの語彙を優先）\n" +
      "   - 2案目 label:\"natural\" — ネイティブがより自然に言う表現\n" +
      "   - 各案に nuance（ニュアンスや使い分けの説明。日本語で30字以内）を付ける。\n" +
      "2. 各案の英文を意味チャンクに分割する。分割ルール：\n" +
      "   - 前置詞句の直前を主な境界とする\n" +
      "   - 主語・動詞・目的語の核は分断しない\n" +
      "   - 句動詞・複合前置詞・固定表現・不定詞の to は途中で切らない\n" +
      "   - チャンクを順に空白1つで結合すると英文全体と完全一致すること（句読点も含める）\n" +
      "3. 各チャンクに、対応する日本語 jp と、「なぜここで区切るか／このチャンクの働き」の短い説明 note（日本語40字以内）を付ける。英語チャンクと日本語チャンクは1対1対応。\n" +
      "4. 出力は次のJSONだけ。前置き・説明・コードフェンスは一切書かないこと。\n\n" +
      '{"version":1,"candidates":[{"label":"plain","nuance":"…","en":"…","chunks":[{"en":"…","jp":"…","note":"…"}]},{"label":"natural","nuance":"…","en":"…","chunks":[{"en":"…","jp":"…","note":"…"}]}]}';
  }

  // ── AI返答からのJSON抽出（前置き・後置き・コードフェンスに耐える）──
  // scanBalanced: start の "{" に対応する "}" の位置を返す（文字列リテラル内の
  // {} と \" エスケープは深度カウントの対象外）。見つからなければ -1。
  function scanBalanced(text, start) {
    var depth = 0, inString = false, escaped = false;
    for (var i = start; i < text.length; i++) {
      var ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }
  // 後方互換API: ①```json〜``` フェンスがあれば最初のフェンスの中身 ②なければ最初の {…}
  function extractJson(text) {
    if (typeof text !== "string") return null;
    var fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) return fenceMatch[1].trim();
    var start = text.indexOf("{");
    if (start === -1) return null;
    var end = scanBalanced(text, start);
    return end === -1 ? null : text.slice(start, end + 1);
  }
  // テキスト中の {…} ブロックを全て列挙（出現順）。プロンプトの見本JSONを復唱した後に
  // 本物の回答が続くケースに備え、parseResult は末尾側から順に試す。
  function extractJsonAll(text) {
    if (typeof text !== "string") return [];
    var out = [], i = 0;
    while (i < text.length) {
      var start = text.indexOf("{", i);
      if (start === -1) break;
      var end = scanBalanced(text, start);
      if (end === -1) break;
      out.push(text.slice(start, end + 1));
      i = end + 1;
    }
    return out;
  }

  // ── 候補の正規化（不正な候補は破棄）─────────────────────
  // en が非空stringでなければ候補ごと破棄。chunks は1〜20個、各要素 en/jp が
  // 非空stringでなければ候補ごと破棄。note/nuance/label は欠落・型不正なら補完する。
  // AI/localStorage 由来の文字列は信頼しないため長さも切り詰める（巨大文字列でDOM/quotaを守る）。
  var MAX_CHUNKS = 20;
  var CAP_EN = 300, CAP_CHUNK = 200, CAP_NOTE = 120, CAP_NUANCE = 100;
  function capStr(s, n) {
    s = String(s);
    return s.length > n ? s.slice(0, n) : s;
  }
  // 英文フィールドは英数字を最低1文字含むこと。プロンプトの見本 "…" や記号だけの
  // プレースホルダを「翻訳結果」として取り込まないための検査（日本語欄には使わない）。
  function hasRealText(s) {
    return /[a-z0-9]/i.test(String(s));
  }
  function normChunk(raw) {
    if (!raw || typeof raw.en !== "string" || !hasRealText(raw.en) || typeof raw.jp !== "string" || !raw.jp) return null;
    return { en: capStr(raw.en, CAP_CHUNK), jp: capStr(raw.jp, CAP_CHUNK), note: typeof raw.note === "string" ? capStr(raw.note, CAP_NOTE) : "" };
  }
  function normCandidate(c, i) {
    if (!c || typeof c.en !== "string" || !hasRealText(c.en)) return null;
    if (!Array.isArray(c.chunks) || c.chunks.length < 1 || c.chunks.length > MAX_CHUNKS) return null;
    var chunks = c.chunks.map(normChunk);
    if (chunks.indexOf(null) !== -1) return null;
    var label = c.label === "plain" || c.label === "natural" ? c.label : "案" + (i + 1);
    var nuance = typeof c.nuance === "string" ? capStr(c.nuance, CAP_NUANCE) : "";
    return { label: label, nuance: nuance, en: capStr(c.en, CAP_EN), chunks: chunks };
  }

  // ── チャンク結合と全文の一致チェック（警告用・エラーにはしない）──
  function normalizeForCompare(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9']+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function joinMatches(cand) {
    var joined = cand.chunks.map(function (c) { return c.en; }).join(" ");
    return normalizeForCompare(joined) === normalizeForCompare(cand.en);
  }

  // ── AI返答のパース ──────────────────────────────────────
  // 貼り付けテキスト中の全JSONブロックを末尾側から試す（AIがプロンプトの見本JSONを
  // 復唱してから本物の回答を書くことがあるため。見本は "…" プレースホルダで弾かれる）。
  function parseResult(text) {
    var texts = extractJsonAll(text);
    if (!texts.length) {
      return { ok: false, error: "JSONが見つかりません。AIの返答を最初から最後までそのまま貼り付けてください。" };
    }
    var parsedAny = false, sawPlaceholder = false;
    for (var k = texts.length - 1; k >= 0; k--) {
      var data;
      try { data = JSON.parse(texts[k]); } catch (e) { continue; }
      if (!data) continue;
      parsedAny = true;
      if (!Array.isArray(data.candidates) || data.candidates.length === 0) continue;
      var candidates = [];
      for (var i = 0; i < data.candidates.length; i++) {
        var norm = normCandidate(data.candidates[i], i);
        if (norm) candidates.push(norm);
      }
      if (candidates.length === 0) {
        if (texts[k].indexOf('"en":"…"') !== -1) sawPlaceholder = true; // 見本JSONの痕跡
        continue;
      }
      if (candidates.length > 2) candidates = candidates.slice(0, 2);

      var warns = [];
      if (candidates.length === 1) warns.push("候補が1つだけ返りました。");
      var hasMismatch = candidates.some(function (c) { return !joinMatches(c); });
      if (hasMismatch) warns.push("チャンクの結合が全文と一致しません（AIの分割ミスの可能性）。");

      return { ok: true, candidates: candidates, warns: warns };
    }
    if (sawPlaceholder) {
      return { ok: false, error: "貼られたのはプロンプトの見本（…）のようです。プロンプトをAIに送り、返ってきた翻訳結果を貼り付けてください。" };
    }
    if (parsedAny) {
      return { ok: false, error: "翻訳候補が読み取れません。プロンプトを再コピーして最初からやり直してください。" };
    }
    return { ok: false, error: "JSONの形が壊れています。AIにもう一度『JSONだけを出力して』と頼んでください。" };
  }

  // ── ドキュメント検証（壊れたitemsは黙って捨てる）─────────
  function validSrs(srs) {
    return !!srs && typeof srs.box === "number" && srs.box >= 0 && srs.box <= 4 &&
      typeof srs.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(srs.due);
  }
  // normChunk が null を返す条件（空文字・"…"プレースホルダ含む）と揃える。
  // 緩めると normItem の chunks に null が混入する
  function validChunk(c) {
    return !!c && typeof c.en === "string" && hasRealText(c.en) && typeof c.jp === "string" && !!c.jp;
  }
  function validItem(raw) {
    if (!raw || typeof raw.id !== "string" || !raw.id) return false;
    if (typeof raw.jp !== "string" || !raw.jp) return false;
    if (typeof raw.en !== "string" || !hasRealText(raw.en)) return false;
    if (!Array.isArray(raw.chunks) || raw.chunks.length < 1) return false;
    return raw.chunks.every(validChunk);
  }
  function normItem(raw) {
    return {
      id: capStr(raw.id, 60),
      jp: capStr(raw.jp, CAP_EN),
      en: capStr(raw.en, CAP_EN),
      chunks: raw.chunks.map(normChunk),
      altEn: typeof raw.altEn === "string" ? capStr(raw.altEn, CAP_EN) : "",
      altLabel: typeof raw.altLabel === "string" ? capStr(raw.altLabel, 40) : "",
      altNuance: typeof raw.altNuance === "string" ? capStr(raw.altNuance, CAP_NUANCE) : "",
      tags: Array.isArray(raw.tags) ? raw.tags.slice() : [],
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : today(),
      srs: validSrs(raw.srs) ? { box: raw.srs.box, due: raw.srs.due, seen: typeof raw.srs.seen === "number" ? raw.srs.seen : 0, ok: typeof raw.srs.ok === "number" ? raw.srs.ok : 0 } : null
    };
  }
  function validRate(rate) {
    return typeof rate === "number" && rate >= 0.5 && rate <= 1.5;
  }
  function validateDoc(raw) {
    var items = Array.isArray(raw && raw.items) ? raw.items : [];
    var validated = items.filter(validItem).map(normItem).slice(0, MAX_ITEMS);
    var rate = raw && raw.settings && validRate(raw.settings.rate) ? raw.settings.rate : DEFAULT_RATE;
    return { version: 1, settings: { rate: rate }, items: validated };
  }

  // ── 永続化（localStorage未定義環境でも落ちない）───────────
  function defaultDoc() { return { version: 1, settings: { rate: DEFAULT_RATE }, items: [] }; }
  function load() {
    try {
      if (typeof localStorage === "undefined") return defaultDoc();
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultDoc();
      return validateDoc(JSON.parse(raw));
    } catch (e) { return defaultDoc(); }
  }
  function save(doc) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORE_KEY, JSON.stringify(doc));
    } catch (e) { /* quota等は黙殺 */ }
  }

  // ── アイテムの作成・追加・削除 ───────────────────────────
  function randomSuffix() {
    return Math.random().toString(36).slice(2, 6);
  }
  function newItem(jp, cand, alt) {
    return {
      id: "c" + Date.now().toString(36) + randomSuffix(),
      jp: jp,
      en: cand.en,
      chunks: cand.chunks.map(function (c) { return { en: c.en, jp: c.jp, note: c.note }; }),
      altEn: alt ? alt.en : "",
      altLabel: alt ? alt.label : "",
      altNuance: alt ? alt.nuance : "",
      tags: [],
      createdAt: today(),
      srs: null
    };
  }
  // en完全一致の重複を除去してから先頭に追加。MAX_ITEMS超は末尾を切り捨てる（非破壊）。
  function addItem(doc, item) {
    var kept = doc.items.filter(function (x) { return x.en !== item.en; });
    var items = [item].concat(kept).slice(0, MAX_ITEMS);
    return { version: doc.version, settings: doc.settings, items: items };
  }
  function removeItem(doc, id) {
    var items = doc.items.filter(function (x) { return x.id !== id; });
    return { version: doc.version, settings: doc.settings, items: items };
  }
  function setRate(doc, rate) {
    return { version: doc.version, settings: { rate: rate }, items: doc.items };
  }

  // ── SRS（3段階Leitner：ok/soft/ng）────────────────────────
  // ok: 箱を1つ進める（最大4） / soft: 箱は据え置き・明日に再出題 / ng: 箱0・即日再出題
  function gradeItem3(srs, grade, todayStr) {
    var cur = validSrs(srs) ? srs.box : 0;
    var box, due;
    if (grade === "ok") {
      box = Math.min(cur + 1, BOX_DAYS.length - 1);
      due = addDays(todayStr, BOX_DAYS[box]);
    } else if (grade === "soft") {
      box = cur;
      due = addDays(todayStr, 1);
    } else {
      box = 0;
      due = todayStr;
    }
    return {
      box: box,
      due: due,
      seen: ((srs && srs.seen) || 0) + 1,
      ok: ((srs && srs.ok) || 0) + (grade === "ok" ? 1 : 0)
    };
  }
  function isDue(srs, todayStr) {
    return validSrs(srs) && srs.due <= todayStr;
  }
  function dueCount(items, todayStr) {
    return items.filter(function (it) { return isDue(it.srs, todayStr); }).length;
  }
  // 出題順: ①期限切れ含む due → ②未学習(srs===null) → ③将来due（昇順）
  function buildDeck(items, todayStr) {
    var due = [], fresh = [], later = [];
    items.forEach(function (it) {
      if (it.srs === null || it.srs === undefined) fresh.push(it);
      else if (isDue(it.srs, todayStr)) due.push(it);
      else later.push(it);
    });
    later.sort(function (a, b) { return a.srs.due < b.srs.due ? -1 : 1; });
    return due.concat(fresh, later);
  }

  window.ChunkData = {
    MAX_ITEMS: MAX_ITEMS,
    BOX_DAYS: BOX_DAYS,
    STORE_KEY: STORE_KEY,
    buildPrompt: buildPrompt,
    parseResult: parseResult,
    load: load,
    save: save,
    newItem: newItem,
    addItem: addItem,
    removeItem: removeItem,
    setRate: setRate,
    today: today,
    isDue: isDue,
    dueCount: dueCount,
    buildDeck: buildDeck,
    gradeItem3: gradeItem3,
    logic: {
      extractJson: extractJson,
      extractJsonAll: extractJsonAll,
      normCandidate: normCandidate,
      joinMatches: joinMatches,
      validateDoc: validateDoc
    }
  };
})();
