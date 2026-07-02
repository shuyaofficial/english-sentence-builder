/* app.js — 母語思考回路ビルダー UI（state＋render＋イベント） 依存: grammar.js, sentence_builder_data.js */
(function () {
  "use strict";
  var D = window.WORD_DATA, G = window.Grammar;
  if (!D) { document.body.innerHTML = "<p style='padding:2rem'>データ読込エラー：sentence_builder_data.js が見つかりません。</p>"; return; }

  var OBJ_PRONOUNS = [
    { en: "me", jp: "私を" }, { en: "you", jp: "あなたを" }, { en: "him", jp: "彼を" },
    { en: "her", jp: "彼女を" }, { en: "it", jp: "それを" }, { en: "us", jp: "私たちを" }, { en: "them", jp: "彼らを" }
  ];
  var SLOT_TAG = {
    SV: "そのままで文になる", SVC: "→ 補語（どんな/なに）", SVO: "→ 目的語（なにを）",
    SVOO: "→ 人 ＋ 物", SVOC: "→ 目的語 ＋ 補語"
  };
  var PATTERN_SHORT = { SV: "自動詞", SVC: "〜になる", SVO: "〜を", SVOO: "人に物を", SVOC: "〜を…に" };
  var JP_PRIORITY = { subject: 0, extra: 2, objectPerson: 3, object: 4, objectThing: 4, complement: 4, verb: 6 };

  // ── state ───────────────────────────────────────────────
  var S = freshState("subject");
  function freshState(mode) {
    return {
      mode: mode, subject: null, verb: null, pattern: null,
      tense: "present", modal: "none", negative: false, aspect: "simple",
      slots: [], extras: [], activeSlot: "subject",
      activeGroup: null, search: "", highlight: 0,
      subjectSource: "pron", compSource: "adj",
      func: null, funcPick: null,
      quizTarget: null, quizChecked: false, quizPass: false, quizSource: "verbs",
      jpOrder: false, justAddedKey: null
    };
  }
  function resetClause() {
    var m = S.mode, f = S.func, fp = S.funcPick, qt = S.quizTarget, qs = S.quizSource;
    S = freshState(m);
    if (m === "function") { S.func = f; S.funcPick = fp; }
    if (m === "quiz") { S.quizTarget = qt; S.quizSource = qs; }
  }

  // ── helpers ─────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function filterByGroup(arr, g) { return g ? arr.filter(function (x) { return x.group === g; }) : arr.slice(); }
  function artTag(n) { return n.article === "uncount" ? "不可算" : n.article === "plural" ? "複数" : "a/an"; }
  function coreSeq() { return G.slotsForPattern(S.pattern); }

  function computeActiveSlot() {
    if (!S.subject) return "subject";
    if (!S.verb) return "verb";
    var seq = coreSeq();
    if (S.slots.length < seq.length) return seq[S.slots.length].type;
    return "extra";
  }

  // 現在の節タイル（英語順）
  function clauseTiles() {
    var tiles = [];
    if (S.subject) tiles.push({ role: "subject", en: S.subject.en, jp: S.subject.jp });
    if (S.verb) {
      tiles.push({
        role: "verb", jp: S.verb.jp,
        en: G.verbSurface(S.verb, { person: S.subject ? S.subject.person : "1sg", tense: S.tense, modal: S.modal, negative: S.negative, aspect: S.aspect })
      });
    }
    S.slots.forEach(function (sl) { tiles.push(sl.tile); });
    S.extras.forEach(function (e) { tiles.push(e); });
    return tiles;
  }
  function clauseString(tiles) {
    tiles = tiles || clauseTiles();
    if (!tiles.length) return "";
    var s = tiles.map(function (t) { return t.en; }).join(" ");
    return cap(s);
  }
  function coreNouns() {
    return S.slots.filter(function (s) { return s.tile.noun; }).map(function (s) { return s.tile.noun; });
  }

  // ── candidates ─────────────────────────────────────────
  function currentCandidates() {
    var slot = S.activeSlot, list = [], q = S.search.trim().toLowerCase();
    if (slot === "subject") {
      if (S.subjectSource === "noun") {
        D.subjectNouns.forEach(function (s) {
          var en = s.article === "plural" ? cap(s.en) : "The " + s.en;
          list.push({ en: en, jp: s.jp, tag: "人", ref: { en: en, jp: s.jp, person: s.person }, kind: "subject" });
        });
      } else {
        D.subjects.forEach(function (s) { list.push({ en: s.en, jp: s.jp, ref: s, kind: "subject" }); });
      }
    } else if (slot === "verb") {
      filterByGroup(D.verbs, S.activeGroup).forEach(function (v) {
        list.push({ en: v.en, jp: v.jp, meta: v.group, tag: SLOT_TAG[v.pattern], ref: v, kind: "verb" });
      });
    } else if (slot === "object" || slot === "objectThing") {
      OBJ_PRONOUNS.forEach(function (p) { list.push({ en: p.en, jp: p.jp, tag: "代名詞", ref: p, kind: "objPron" }); });
      filterByGroup(D.nouns, S.activeGroup).forEach(function (n) { list.push({ en: n.en, jp: n.jp, meta: n.group, tag: artTag(n), ref: n, kind: "noun" }); });
    } else if (slot === "objectPerson") {
      OBJ_PRONOUNS.forEach(function (p) { list.push({ en: p.en, jp: p.jp, tag: "代名詞", ref: p, kind: "objPron" }); });
      D.subjectNouns.forEach(function (s) { list.push({ en: s.en, jp: s.jp, tag: "人", ref: s, kind: "personNoun" }); });
    } else if (slot === "complement") {
      if (S.compSource === "noun") {
        filterByGroup(D.nouns, S.activeGroup).forEach(function (n) { list.push({ en: n.en, jp: n.jp, meta: n.group, tag: artTag(n), ref: n, kind: "noun" }); });
      } else {
        filterByGroup(D.adjectives, S.activeGroup).forEach(function (a) { list.push({ en: a.en, jp: a.jp, meta: a.group, ref: a, kind: "adj" }); });
      }
    } else if (slot === "extra") {
      filterByGroup(D.adverbs, S.activeGroup).forEach(function (a) { list.push({ en: a.en, jp: a.jp, meta: a.group, ref: a, kind: "adv" }); });
    }
    if (q) list = list.filter(function (c) { return (c.en + " " + (c.jp || "") + " " + (c.meta || "")).toLowerCase().indexOf(q) >= 0; });
    return list;
  }

  function currentChips() {
    var slot = S.activeSlot;
    if (slot === "verb") return D.groups.verbs;
    if (slot === "object" || slot === "objectThing") return D.groups.nouns;
    if (slot === "complement") return S.compSource === "noun" ? D.groups.nouns : D.groups.adjectives;
    if (slot === "extra") return D.groups.adverbs;
    return null;
  }

  // ── pick / undo ────────────────────────────────────────
  function pick(c) {
    if (S.activeSlot === "subject") { S.subject = c.ref; S.justAddedKey = "subject:" + c.ref.en; }
    else if (S.activeSlot === "verb") { S.verb = c.ref; S.pattern = c.ref.pattern; S.slots = []; S.justAddedKey = "verb:" + c.ref.en; }
    else {
      var role = S.activeSlot, tile;
      if (c.kind === "noun") tile = { role: role, en: G.nounPhrase(c.ref), jp: c.jp, noun: c.ref };
      else if (c.kind === "adj") tile = { role: role, en: c.ref.en, jp: c.jp };
      else tile = { role: role, en: c.ref.en, jp: c.jp }; // pronoun / person
      if (role === "extra") S.extras.push(tile);
      else S.slots.push({ type: role, tile: tile });
      S.justAddedKey = role + ":" + tile.en;
    }
    S.search = ""; S.highlight = 0; S.activeSlot = computeActiveSlot(); S.activeGroup = null;
    render();
  }
  function undo() {
    if (S.extras.length) S.extras.pop();
    else if (S.slots.length) S.slots.pop();
    else if (S.verb) { S.verb = null; S.pattern = null; S.slots = []; }
    else if (S.subject) S.subject = null;
    else return;
    S.search = ""; S.highlight = 0; S.activeSlot = computeActiveSlot(); render();
  }

  // ── TTS ────────────────────────────────────────────────
  function speak(text) {
    if (window.Speech) window.Speech.speak(text); // speech.js（en音声の優先選択つき）
  }
  function currentUtterance() {
    if (S.mode === "function") return S.funcPick ? S.funcPick.ex_en : "";
    var tiles = clauseTiles(); return tiles.length ? clauseString(tiles) + "." : "";
  }

  // ── render ─────────────────────────────────────────────
  function render() {
    renderModes();
    var isFunc = S.mode === "function";
    var isPhr = S.mode === "phrases";
    $("phrases").classList.toggle("hidden", !isPhr);
    document.querySelector(".tray-wrap").classList.toggle("hidden", isPhr);
    $("panel").classList.toggle("hidden", isPhr);
    if (isPhr) { // 必須フレーズモードは phrases.js に全面委譲
      $("quiz-prompt").classList.add("hidden");
      $("controls").classList.add("hidden");
      $("stepper").classList.add("hidden");
      $("hints").classList.add("hidden");
      window.Phrases.enter();
      return;
    }
    $("quiz-prompt").classList.toggle("hidden", S.mode !== "quiz");
    if (S.mode === "quiz") renderQuizPrompt();
    renderTray();
    $("controls").classList.toggle("hidden", isFunc || !S.verb);
    if (!isFunc && S.verb) renderControls();
    $("stepper").classList.toggle("hidden", isFunc);
    if (!isFunc) renderStepper();
    if (isFunc) { if (S.funcPick) renderFunctionResult(); else renderFunctionPicker(); }
    else renderPanel();
    $("hints").classList.toggle("hidden", isFunc);
    if (!isFunc) renderHints();
  }

  function renderModes() {
    var modes = [["subject", "主語スタート", "だれが→どうする"], ["function", "機能スタート", "言いたいこと→型"], ["phrases", "必須フレーズ", "型を丸ごと→入替"], ["quiz", "逆クイズ", "日本語→英語"]];
    $("modes").innerHTML = modes.map(function (m) {
      return '<button class="mode" role="tab" data-mode="' + m[0] + '" aria-selected="' + (S.mode === m[0]) + '"><small>' + m[2] + '</small>' + m[1] + '</button>';
    }).join("");
  }

  function renderTray() {
    var u = currentUtterance();
    var uttEl = $("utterance");

    // 機能モード：組み立てず、選んだ型の実例文を大きく見せる
    if (S.mode === "function") {
      if (S.funcPick) {
        uttEl.classList.remove("hidden");
        uttEl.innerHTML = '<span style="color:var(--accent);font-size:.72rem;letter-spacing:.1em">例文</span><br>' + esc(u);
        $("tray").innerHTML = '<span class="tray-empty">上の例文を 🔊 で発音。左で別の型に切替。</span>';
      } else {
        uttEl.classList.add("hidden");
        $("tray").innerHTML = '<span class="tray-empty">「言いたいこと」を選ぶと、その型の例文がここに出ます。</span>';
      }
      $("tray-ord").textContent = "会話の型";
      $("act-speak").disabled = !u;
      $("act-quizcheck").classList.add("hidden");
      $("act-quiznext").classList.add("hidden");
      return;
    }
    uttEl.classList.add("hidden");

    var tiles = clauseTiles();
    if (S.jpOrder) tiles = tiles.slice().sort(function (a, b) { return (JP_PRIORITY[a.role] || 5) - (JP_PRIORITY[b.role] || 5); });
    var html = "";
    if (!tiles.length) html = '<span class="tray-empty">下から選ぶとここに文ができます。まず「だれが（主語）」から。</span>';
    else {
      html = tiles.map(function (t) {
        var key = t.role + ":" + t.en;
        var add = (key === S.justAddedKey) ? " just-added" : "";
        return '<span class="tray-tile role-' + t.role + add + '" data-key="' + esc(key) + '"><span class="en">' + esc(t.en) + '</span><span class="jp">' + esc(t.jp || "") + '</span></span>';
      }).join("");
      html += '<span class="tray-period">' + (S.jpOrder ? "。" : ".") + '</span>';
    }
    $("tray").innerHTML = html;
    S.justAddedKey = null;

    $("tray-ord").textContent = S.jpOrder ? "日本語順（動詞が最後）" : "英語順 S→V→O";
    $("act-speak").disabled = !u;
    $("act-quizcheck").classList.toggle("hidden", S.mode !== "quiz");
    $("act-quiznext").classList.toggle("hidden", S.mode !== "quiz");
  }

  function renderControls() {
    var tenseDisabled = S.modal !== "none";
    var g = "";
    // 文型スイッチ（make: SVO 〜を作る / SVOC 〜を…にする 等の分岐がある動詞のみ）
    if (S.verb && S.verb.patternsAllowed && S.verb.patternsAllowed.length > 1) {
      g += '<span class="glabel">文型</span><div class="grp">';
      S.verb.patternsAllowed.forEach(function (p) {
        g += '<button class="toggle' + (S.pattern === p ? " active" : "") + '" data-ctl="pattern" data-val="' + p +
          '" title="' + esc(G.PATTERN_JP[p] || "") + '">' + p + '<small>' + (PATTERN_SHORT[p] || "") + '</small></button>';
      });
      g += '</div>';
    }
    g += '<span class="glabel">時制</span><div class="grp">';
    g += ctlBtn("tense", "present", "現在", S.tense === "present" && !tenseDisabled, tenseDisabled);
    g += ctlBtn("tense", "past", "過去", S.tense === "past" && !tenseDisabled, tenseDisabled);
    g += '</div>';
    // 進行形（be動詞自体は対象外）
    if (S.verb && S.verb.en !== "be") {
      g += '<span class="glabel">進行</span><div class="grp">';
      g += ctlBtn("aspect", "simple", "ふつう", S.aspect === "simple", false);
      g += ctlBtn("aspect", "progressive", "〜している", S.aspect === "progressive", false);
      g += '</div>';
    }
    g += '<span class="glabel">助動詞</span><div class="grp">';
    [["none", "なし"], ["can", "can"], ["could", "could"], ["will", "will"], ["would", "would"]].forEach(function (m) {
      g += ctlBtn("modal", m[0], m[1], S.modal === m[0], false);
    });
    g += '</div>';
    g += '<div class="grp">' + '<button class="toggle neg' + (S.negative ? " active" : "") + '" data-ctl="negative" data-val="toggle">否定</button></div>';
    $("controls").innerHTML = g;
  }
  function ctlBtn(ctl, val, label, active, disabled) {
    return '<button class="toggle' + (active ? " active" : "") + '" data-ctl="' + ctl + '" data-val="' + val + '"' + (disabled ? " disabled" : "") + '>' + label + '</button>';
  }

  function renderStepper() {
    var seq = S.verb ? coreSeq() : [{ type: "object", pending: true }];
    var steps = [{ type: "subject" }, { type: "verb" }].concat(seq).concat([{ type: "extra" }]);
    var html = steps.map(function (st, i) {
      var lab = G.SLOT_LABEL[st.type] || st.type;
      var done = isDone(st.type, i, steps);
      var active = S.activeSlot === st.type && !done;
      var cls = "step" + (active ? " active" : "") + (done ? " done" : "");
      var arrow = i < steps.length - 1 ? '<span class="arrow">›</span>' : "";
      return '<span class="' + cls + '"><b>' + lab + '</b></span>' + arrow;
    }).join("");
    var patBadge = S.verb && S.pattern
      ? '<span class="step pattern-badge" title="' + esc(G.PATTERN_JP[S.pattern] || "") + '"><b>' + esc(S.pattern) + '</b></span><span class="arrow">›</span>'
      : "";
    $("stepper").innerHTML = patBadge + html;
  }
  function isDone(type, i, steps) {
    if (type === "subject") return !!S.subject;
    if (type === "verb") return !!S.verb;
    if (type === "extra") return false;
    // core slot: count how many core steps precede
    var coreIdx = 0;
    for (var k = 2; k < i; k++) if (steps[k].type !== "extra") coreIdx++;
    return S.slots.length > coreIdx;
  }

  function renderPanel() {
    var slot = S.activeSlot;
    var title = (G.SLOT_LABEL[slot] || slot);
    var hint = { subject: "文の主人公。誰が動作するか", verb: "動詞。これが文の形を決める", object: "動作の対象（〜を）", objectPerson: "誰に渡す/伝えるか", objectThing: "何を渡す/伝えるか", complement: "主語や目的語の説明（形容詞/名詞）", extra: "副詞で味付け。無くてもOK" }[slot] || "";
    var head = '<div class="panel-head"><div class="panel-title">' + title + ' <span>' + esc(hint) + '</span></div>';
    // source toggles
    if (slot === "subject") head += '<div class="grp" style="display:flex;gap:.25rem">' + srcBtn("subjectSource", "pron", "代名詞") + srcBtn("subjectSource", "noun", "人（名詞）") + '</div>';
    else if (slot === "complement") head += '<div class="grp" style="display:flex;gap:.25rem">' + srcBtn("compSource", "adj", "形容詞") + srcBtn("compSource", "noun", "名詞") + '</div>';
    head += '<input id="search" class="search" type="text" placeholder="日本語で検索（例: 依頼 / 好き）" autocomplete="off" value="' + esc(S.search) + '"></div>';

    var chips = currentChips();
    var chipHtml = "";
    if (chips) {
      chipHtml = '<div class="chips"><button class="chip' + (S.activeGroup === null ? " active" : "") + '" data-group="__all">すべて</button>' +
        chips.map(function (g) { return '<button class="chip' + (S.activeGroup === g ? " active" : "") + '" data-group="' + esc(g) + '">' + esc(g) + '</button>'; }).join("") + '</div>';
    }
    var doneBtn = slot === "extra" ? '<div style="margin-bottom:.6rem"><button class="act primary" data-act="done">✓ この文で完成（読み上げ）</button></div>' : "";
    $("panel").innerHTML = head + chipHtml + doneBtn + '<div id="candidates" class="candidates"></div>';
    renderCandidates();
  }
  function srcBtn(ctl, val, label) {
    var active = S[ctl] === val;
    return '<button class="toggle' + (active ? " active" : "") + '" data-src="' + ctl + '" data-val="' + val + '">' + label + '</button>';
  }
  function renderCandidates() {
    var list = currentCandidates(); S._cands = list;
    if (S.highlight >= list.length) S.highlight = 0;
    var box = $("candidates"); if (!box) return;
    if (!list.length) { box.innerHTML = '<div class="cand-empty">該当なし。検索やグループを変えてみて。</div>'; return; }
    box.innerHTML = list.map(function (c, i) {
      var meta = c.meta ? '<span class="meta">' + esc(c.meta) + '</span>' : "";
      var tag = c.tag ? '<span class="tag">' + esc(c.tag) + '</span>' : "";
      return '<button class="cand' + (i === S.highlight ? " hl" : "") + '" data-idx="' + i + '"><span class="en">' + esc(c.en) + '</span><span class="jp">' + esc(c.jp || "") + '</span>' + meta + tag + '</button>';
    }).join("");
  }

  function renderFunctionPicker() {
    var head = '<div class="panel-head"><div class="panel-title">言いたいこと <span>会話の型を選ぶ</span></div>' +
      '<input id="search" class="search" type="text" placeholder="日本語で検索（例: 依頼 / 提案）" autocomplete="off" value="' + esc(S.search) + '"></div>';
    var chipHtml = '<div class="chips">' + D.groups.functions.map(function (g) {
      return '<button class="chip' + (S.func === g ? " active" : "") + '" data-func="' + esc(g) + '">' + esc(g) + '</button>';
    }).join("") + '</div>';
    var q = S.search.trim().toLowerCase();
    var list = D.functions.filter(function (f) { return (!S.func || f.func === S.func) && (!q || (f.template + f.meaning_jp + f.trigger_jp).toLowerCase().indexOf(q) >= 0); });
    S._funcList = list;
    var cards = list.map(function (f, i) {
      return '<button class="cand" data-fidx="' + i + '"><span class="en">' + esc(f.template) + '</span><span class="jp">' + esc(f.meaning_jp) + '</span><span class="meta">' + esc(f.func) + '</span><span class="tag">' + esc(f.politeness) + '</span></button>';
    }).join("");
    $("panel").innerHTML = head + chipHtml + '<div id="candidates" class="candidates">' + (cards || '<div class="cand-empty">該当なし</div>') + '</div>';
  }
  function pickFunction(f) { S.funcPick = f; render(); }

  function renderFunctionResult() {
    var f = S.funcPick;
    var html = '<div class="panel-head"><div class="panel-title">この型を使う <span>' + esc(f.func) + '・' + esc(f.politeness) + '</span></div>' +
      '<button class="act" data-funcback="1">← 型を選び直す</button></div>';
    html += '<div class="quiz-prompt" style="margin:0">' +
      '<div class="q-label">型（' + esc(f.trigger_jp) + '）</div>' +
      '<div class="q-jp">' + esc(f.template) + '</div>' +
      '<div style="margin-top:.5rem;color:var(--ink-soft)">' + esc(f.meaning_jp) + '</div>' +
      '<div class="model" style="margin-top:.7rem">' + esc(f.ex_en) + ' <button class="act" data-act="speak">🔊</button></div>' +
      '<div style="color:var(--ink-soft);margin-top:.2rem">' + esc(f.ex_jp) + '</div>' +
      (f.note ? '<div class="hint" style="margin-top:.7rem"><b>メモ</b>　' + esc(f.note) + '</div>' : '') +
      '</div>';
    $("panel").innerHTML = html;
  }

  function renderHints() {
    var ctx = { subject: S.subject, verb: S.verb, pattern: S.pattern, tense: S.tense, modal: S.modal, negative: S.negative, aspect: S.aspect, coreNouns: coreNouns() };
    var hints = G.grammarHints(ctx);
    $("hints").innerHTML = hints.map(function (h) {
      return '<div class="hint' + (h.level === "warn" ? " warn" : "") + '"><b>' + esc(h.b) + '</b>　' + esc(h.msg) + '</div>';
    }).join("");
  }

  // ── quiz ───────────────────────────────────────────────
  function newQuiz() {
    var t = window.Quiz.next(S.quizSource); // 苦手・未出題を優先する重み付き出題
    S.quizTarget = t ? { jp: t.jp, en: t.en, key: t.key } : null;
    S.quizChecked = false; S.quizPass = false; resetClause();
    render();
  }
  function renderQuizPrompt() {
    var t = S.quizTarget || {};
    var st = window.Quiz.stats(S.quizSource);
    var chips = '<div class="chips q-src">' + window.Quiz.SOURCES.map(function (s) {
      return '<button class="chip' + (S.quizSource === s[0] ? " active" : "") + '" data-qsrc="' + s[0] + '">' + s[1] + '</button>';
    }).join("") + '</div>';
    var res = "";
    if (S.quizChecked && t.en) {
      res = '<div class="quiz-result ' + (S.quizPass ? "ok" : "ng") + '">' + (S.quizPass ? "✓ 正解！" : "△ 自己採点：下の模範解答と比べてみて") +
        '<div class="model">' + esc(t.en) + '. <button class="act" data-act="quizspeak">🔊</button></div></div>';
    }
    $("quiz-prompt").innerHTML =
      '<div class="q-label">この日本語を英語で組み立てて' +
      '<span class="q-stat">挑戦 ' + st.answered + '/' + st.total + '・得意 ' + st.correct + '</span></div>' +
      chips +
      '<div class="q-jp">' + esc(t.jp || "") + '</div>' + res;
  }
  function checkQuiz() {
    if (!S.quizTarget) return;
    var mine = G.normalize(clauseString());
    S.quizPass = mine === G.normalize(S.quizTarget.en);
    var first = !S.quizChecked; // 同じ問題の再採点は履歴に数えない
    S.quizChecked = true;
    if (first && S.quizTarget.key) window.Quiz.record(S.quizTarget.key, S.quizPass);
    render();
    if (!S.quizPass) speak(S.quizTarget.en);
  }
  function onQuizPrompt(e) {
    var src = e.target.closest("[data-qsrc]");
    if (src) { S.quizSource = src.dataset.qsrc; newQuiz(); return; }
    var b = e.target.closest('[data-act="quizspeak"]');
    if (b && S.quizTarget) speak(S.quizTarget.en);
  }

  // ── JP↔EN 並べ替えアニメ（FLIP）─────────────────────────
  function toggleJpOrder() {
    var tray = $("tray");
    var prev = {}; tray.querySelectorAll(".tray-tile").forEach(function (t) { prev[t.dataset.key] = t.getBoundingClientRect(); });
    S.jpOrder = !S.jpOrder; renderTray();
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (reduce) return;
    tray.querySelectorAll(".tray-tile").forEach(function (t) {
      var p = prev[t.dataset.key]; if (!p) return;
      var n = t.getBoundingClientRect(); var dx = p.left - n.left, dy = p.top - n.top;
      if (dx || dy) {
        t.style.transform = "translate(" + dx + "px," + dy + "px)"; t.style.transition = "none";
        requestAnimationFrame(function () { t.style.transition = "transform .5s cubic-bezier(.16,1,.3,1)"; t.style.transform = ""; });
      }
    });
  }

  // ── events ─────────────────────────────────────────────
  function onModeClick(e) { var b = e.target.closest("[data-mode]"); if (!b) return; S = freshState(b.dataset.mode); if (b.dataset.mode === "quiz") newQuiz(); else render(); }
  function onControls(e) {
    var b = e.target.closest("[data-ctl]"); if (!b || b.disabled) return;
    var c = b.dataset.ctl;
    if (c === "tense") S.tense = b.dataset.val;
    else if (c === "modal") S.modal = b.dataset.val;
    else if (c === "negative") S.negative = !S.negative;
    else if (c === "aspect") S.aspect = b.dataset.val;
    else if (c === "pattern") {
      if (S.pattern !== b.dataset.val) { // 文型が変わると必要なスロットが変わるのでコアを組み直す
        S.pattern = b.dataset.val;
        S.slots = []; S.activeGroup = null; S.search = ""; S.highlight = 0;
        S.activeSlot = computeActiveSlot();
      }
    }
    render();
  }
  function onPanel(e) {
    var back = e.target.closest("[data-funcback]");
    if (back) { S.funcPick = null; render(); return; }
    var sp = e.target.closest('[data-act="speak"]');
    if (sp) { speak(currentUtterance()); return; }
    var chip = e.target.closest("[data-group]");
    if (chip) { S.activeGroup = chip.dataset.group === "__all" ? null : chip.dataset.group; S.highlight = 0; renderPanel(); return; }
    var src = e.target.closest("[data-src]");
    if (src) { S[src.dataset.src] = src.dataset.val; S.activeGroup = null; S.highlight = 0; renderPanel(); return; }
    var fn = e.target.closest("[data-func]");
    if (fn) { S.func = S.func === fn.dataset.func ? null : fn.dataset.func; render(); return; }
    var fc = e.target.closest("[data-fidx]");
    if (fc) { pickFunction(S._funcList[+fc.dataset.fidx]); return; }
    var cand = e.target.closest("[data-idx]");
    if (cand) { var c = S._cands[+cand.dataset.idx]; if (c) pick(c); return; }
  }
  function onPanelInput(e) { if (e.target.id === "search") { S.search = e.target.value; if (S.mode === "function" && !S.funcPick) renderFunctionPicker(); else renderCandidates(); } }
  function onTrayActions(e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var a = b.dataset.act;
    if (a === "speak" || a === "done" || a === "quizspeak") speak(a === "quizspeak" ? S.quizTarget.en : currentUtterance());
    if (a === "undo") undo();
    if (a === "clear") { resetClause(); render(); }
    if (a === "jporder") toggleJpOrder();
    if (a === "quizcheck") checkQuiz();
    if (a === "quiznext") newQuiz();
  }
  function onKey(e) {
    if (S.mode === "phrases") { if (window.Phrases.onKey(e)) e.preventDefault(); return; }
    if (S.mode === "function") return;
    var cands = S._cands || [];
    if (e.key === "ArrowDown") { S.highlight = Math.min(S.highlight + 1, cands.length - 1); renderCandidates(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { S.highlight = Math.max(S.highlight - 1, 0); renderCandidates(); e.preventDefault(); }
    else if (e.key === "Enter") { if (cands[S.highlight]) pick(cands[S.highlight]); e.preventDefault(); }
    else if (e.key === "Backspace") { var s = $("search"); if (!s || document.activeElement !== s || !s.value) { undo(); e.preventDefault(); } }
  }

  function init() {
    $("modes").addEventListener("click", onModeClick);
    $("controls").addEventListener("click", onControls);
    $("panel").addEventListener("click", onPanel);
    $("panel").addEventListener("input", onPanelInput);
    $("tray-actions").addEventListener("click", onTrayActions);
    $("quiz-prompt").addEventListener("click", onQuizPrompt);
    document.addEventListener("keydown", onKey);
    // PWA: http(s)配信時のみService Worker登録（file://では不可）
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(function () { });
    }
    render();
  }
  init();
})();
