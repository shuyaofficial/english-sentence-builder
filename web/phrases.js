/* phrases.js — 必須フレーズモード（チャンク学習：一覧・暗記カード・〇〇穴埋め）
 * 『ゼロから12ヵ国語マスターした私の最強の外国語習得法』の
 * 「高レバレッジな30フレーズを丸暗記 → 〇〇を入れ替えて即使う」を実装する。
 * 依存: sentence_builder_data.js (WORD_DATA.phrases), grammar.js, speech.js
 * SRS（Leitner 5箱）の計算と穴埋め合成は純関数 → window.Phrases.logic に公開（node単体テスト可） */
(function () {
  "use strict";

  // ── 純ロジック（DOM非依存）─────────────────────────────
  var BOX_DAYS = [0, 1, 3, 7, 14]; // 箱ごとの復習間隔（日）
  var LS_KEY = "srb.phrases.v1";

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function toDateStr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function today() { return toDateStr(new Date()); }
  function addDays(dateStr, n) {
    var p = dateStr.split("-");
    return toDateStr(new Date(+p[0], +p[1] - 1, +p[2] + n));
  }
  // 自己評価を反映した新しい進捗レコードを返す（元オブジェクトは変更しない）
  function gradeItem(item, ok, todayStr) {
    var cur = item && typeof item.box === "number" && item.box >= 0 ? item.box : 0;
    var box = ok ? Math.min(cur + 1, BOX_DAYS.length - 1) : 0;
    return {
      box: box,
      due: addDays(todayStr, BOX_DAYS[box]),
      seen: ((item && item.seen) || 0) + 1,
      ok: ((item && item.ok) || 0) + (ok ? 1 : 0)
    };
  }
  function isDue(item, todayStr) { return !item || !item.due || item.due <= todayStr; }
  // 出題順: 復習期限が来たもの → 未学習 → まだ先のもの（期限が近い順）
  function buildDeck(phrases, items, todayStr) {
    var due = [], fresh = [], later = [];
    phrases.forEach(function (p) {
      var it = items[p.id];
      if (!it) fresh.push(p);
      else if (isDue(it, todayStr)) due.push(p);
      else later.push(p);
    });
    later.sort(function (a, b) { return items[a.id].due < items[b.id].due ? -1 : 1; });
    return due.concat(fresh, later);
  }
  function boxDist(phrases, items) {
    var dist = { fresh: 0, boxes: [0, 0, 0, 0, 0] };
    phrases.forEach(function (p) {
      var it = items[p.id];
      if (!it) dist.fresh++;
      else dist.boxes[Math.min(it.box || 0, 4)]++;
    });
    return dist;
  }
  function masteredCount(phrases, items) {
    return phrases.filter(function (p) {
      var it = items[p.id]; return it && (it.box || 0) >= 2;
    }).length;
  }
  function fillSentence(en, choice) { return en.replace("〇〇", choice); }

  // ── 進捗の保存（localStorage・使えない環境では黙って諦める）──
  // 壊れたitem（boxが非数値・dueが日付でない等）は捨てる。
  // 例: due:"NaN-NaN-NaN" は文字列比較で永遠に期限が来ず、そのカードが二度と出題されなくなる
  function validItem(it) {
    return !!it && typeof it.box === "number" && it.box >= 0 && it.box < BOX_DAYS.length &&
      typeof it.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(it.due);
  }
  function loadProgress() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return { version: 1, items: {} };
      var d = JSON.parse(raw);
      if (!d || typeof d.items !== "object" || !d.items) return { version: 1, items: {} };
      var items = {};
      Object.keys(d.items).forEach(function (k) {
        if (validItem(d.items[k])) items[k] = d.items[k];
      });
      return { version: 1, items: items };
    } catch (e) { return { version: 1, items: {} }; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch (e) { }
  }

  // ── UI状態 ──────────────────────────────────────────────
  var D = window.WORD_DATA;
  var root = null;
  var prog = loadProgress();
  var P = {
    tab: "list", cat: null,
    deck: [], idx: 0, flipped: false, done: 0, again: 0,
    fillList: [], fillIdx: 0, fillPick: null
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function enHtml(en) { return esc(en).replace(/〇〇/g, '<span class="blank-slot">〇〇</span>'); }
  function speakText(p) {
    return p.blank !== "none" && p.choices && p.choices.length ? fillSentence(p.en, p.choices[0]) : p.en;
  }
  function srsLevel(it) {
    if (!it) return { cls: "lv0", label: "未学習" };
    if ((it.box || 0) >= 4) return { cls: "lv3", label: "定着" };
    if ((it.box || 0) >= 2) return { cls: "lv2", label: "覚えた" };
    return { cls: "lv1", label: "学習中" };
  }
  function intervalLabel(days) { return days === 0 ? "すぐ再出題" : days + "日後に復習"; }

  // ── render ──────────────────────────────────────────────
  function render() {
    if (!root) return;
    if (!D || !D.phrases) {
      root.innerHTML = '<div class="cand-empty">必須フレーズのデータがありません。python3 build/build_web.py を実行してください。</div>';
      return;
    }
    var tabs = [
      ["list", "一覧", "30の型を眺める"],
      ["cards", "暗記カード", "日本語 → 英語"],
      ["fill", "穴埋め", "〇〇を入れ替える"]
    ];
    var nav = '<div class="subtabs" role="tablist" aria-label="学習方法">' + tabs.map(function (t) {
      return '<button class="subtab" role="tab" data-ptab="' + t[0] + '" aria-selected="' + (P.tab === t[0]) + '"><b>' + t[1] + '</b><small>' + t[2] + '</small></button>';
    }).join("") + '</div>';
    var body = P.tab === "cards" ? cardsBody() : P.tab === "fill" ? fillBody() : listBody();
    root.innerHTML = nav + '<div class="phrases-body">' + body + '</div>';
  }

  // 一覧：カテゴリ別に30フレーズ＋進捗
  function listBody() {
    var mastered = masteredCount(D.phrases, prog.items);
    var pct = Math.round(mastered / D.phrases.length * 100);
    var head =
      '<div class="hint" style="margin-bottom:.8rem"><b>使い方</b>　まずこの30個を丸暗記 → 「入替OK」の型は 〇〇 を入れ替えて自分の文にする。</div>' +
      '<div class="phrase-progress"><span class="pp-label">覚えた <b>' + mastered + '</b> / ' + D.phrases.length + '</span>' +
      '<span class="progress-track"><span class="progress-fill" style="width:' + pct + '%"></span></span></div>';
    var chips = '<div class="chips">' +
      '<button class="chip' + (P.cat === null ? " active" : "") + '" data-pcat="__all">すべて</button>' +
      D.groups.phrases.map(function (c) {
        return '<button class="chip' + (P.cat === c ? " active" : "") + '" data-pcat="' + esc(c) + '">' + esc(c) + '</button>';
      }).join("") + '</div>';
    var list = D.phrases.filter(function (p) { return !P.cat || p.cat === P.cat; });
    var cards = list.map(function (p) {
      var lvl = srsLevel(prog.items[p.id]);
      return '<div class="phrase-card">' +
        '<div class="pc-en">' + enHtml(p.en) + '</div>' +
        '<div class="pc-jp">' + esc(p.jp) + '</div>' +
        (p.note ? '<div class="pc-note">' + esc(p.note) + '</div>' : "") +
        '<div class="pc-foot">' +
        '<span class="srs-dot ' + lvl.cls + '" title="' + lvl.label + '"></span>' +
        '<span class="pc-cat">' + esc(p.cat) + '</span>' +
        (p.blank !== "none" ? '<span class="tag">入替OK</span>' : "") +
        '<button class="act pc-speak" data-speak="' + esc(speakText(p)) + '" aria-label="読み上げ">🔊</button>' +
        '</div></div>';
    }).join("");
    return head + chips + '<div class="phrase-grid">' + cards + '</div>';
  }

  // 暗記カード：日→英フラッシュカード（Leitner SRS）
  function startDeck() {
    P.deck = buildDeck(D.phrases, prog.items, today());
    P.idx = 0; P.flipped = false; P.done = 0; P.again = 0;
  }
  function distStrip() {
    var dist = boxDist(D.phrases, prog.items);
    var total = D.phrases.length || 1;
    var segs = [{ cls: "seg-fresh", n: dist.fresh, label: "未学習" }];
    dist.boxes.forEach(function (c, i) {
      segs.push({ cls: "seg-b" + i, n: c, label: "箱" + (i + 1) + "（" + (BOX_DAYS[i] === 0 ? "毎回出題" : BOX_DAYS[i] + "日間隔") + "）" });
    });
    var bars = segs.filter(function (s) { return s.n > 0; }).map(function (s) {
      return '<span class="dist-seg ' + s.cls + '" style="width:' + (s.n / total * 100) + '%" title="' + s.label + '：' + s.n + '枚"></span>';
    }).join("");
    return '<div class="dist-strip" title="学習の定着度（左=未学習 → 右=定着）">' + bars + '</div>';
  }
  function cardsBody() {
    if (!P.deck.length) startDeck();
    if (P.idx >= P.deck.length) {
      var mastered = masteredCount(D.phrases, prog.items);
      return '<div class="fc-done">' +
        '<div class="fc-done-emoji">🎉</div>' +
        '<div class="fc-done-title">一周おつかれさま！</div>' +
        '<div class="fc-done-stats">' + P.done + ' 枚学習 ・ もう一度 ' + P.again + ' 回 ・ 覚えた ' + mastered + ' / ' + D.phrases.length + '</div>' +
        distStrip() +
        '<div class="fc-done-acts">' +
        '<button class="act primary" data-fcrestart="1">↻ もう一周</button>' +
        '<button class="act" data-ptab="list">一覧に戻る</button>' +
        '</div></div>';
    }
    var p = P.deck[P.idx];
    var it = prog.items[p.id];
    var okBox = Math.min(((it && it.box) || 0) + 1, BOX_DAYS.length - 1);
    var meta = '<div class="fc-meta"><span>残り <b>' + (P.deck.length - P.idx) + '</b> 枚</span>' + distStrip() + '</div>';
    var card =
      '<div class="flashcard' + (P.flipped ? " flipped" : "") + '" data-fc="1" role="button" tabindex="0" aria-label="カードをめくる">' +
      '<div class="fc-inner">' +
      '<div class="fc-face fc-front"><span class="fc-label">' + esc(p.cat) + '</span>' +
      '<div class="fc-text">' + esc(p.jp) + '</div>' +
      '<span class="fc-flip-hint">クリック / Space で答え</span></div>' +
      '<div class="fc-face fc-back"><span class="fc-label">英語で</span>' +
      '<div class="fc-text fc-en">' + enHtml(p.en) + '</div>' +
      (p.note ? '<div class="fc-note">' + esc(p.note) + '</div>' : "") +
      '<button class="act" data-speak="' + esc(speakText(p)) + '">🔊 発音</button></div>' +
      '</div></div>';
    var grades =
      '<div class="fc-grades' + (P.flipped ? "" : " hidden") + '">' +
      '<button class="fc-grade ng" data-grade="0"><b>✗ もう一度</b><small>' + intervalLabel(BOX_DAYS[0]) + '</small></button>' +
      '<button class="fc-grade ok" data-grade="1"><b>✓ 言えた</b><small>' + intervalLabel(BOX_DAYS[okBox]) + '</small></button>' +
      '</div>';
    return meta + card + grades +
      '<div class="fc-kbd">キーボード: Space=めくる ・ 1=もう一度 ・ 2=言えた</div>';
  }
  function toggleFlip() {
    if (P.tab !== "cards" || P.idx >= P.deck.length) return;
    P.flipped = !P.flipped;
    var fc = root.querySelector(".flashcard");
    if (fc) fc.classList.toggle("flipped", P.flipped);
    var g = root.querySelector(".fc-grades");
    if (g) g.classList.toggle("hidden", !P.flipped);
  }
  function grade(ok) {
    var p = P.deck[P.idx];
    if (!p) return;
    prog.items[p.id] = gradeItem(prog.items[p.id], ok, today());
    saveProgress(prog);
    P.done++;
    if (!ok) { P.again++; P.deck.push(p); } // 覚えるまで同じ周回に再登場
    P.idx++; P.flipped = false;
    render();
  }

  // 穴埋め：〇〇に語を入れて自分の文にする
  function fillCandidatesDb(p) {
    var G = window.Grammar;
    if (p.blank === "noun") {
      var bare = /^Which\b/.test(p.en); // Which 〇〇? は冠詞なし
      return D.nouns.map(function (n) { return { en: bare ? n.en : G.nounPhrase(n), jp: n.jp }; });
    }
    if (p.blank === "place") {
      return D.nouns.filter(function (n) { return n.group === "場所・空間"; })
        .map(function (n) { return { en: "the " + n.en, jp: n.jp }; });
    }
    return []; // language / chunk / thing はCSV候補のみ
  }
  function fillBody() {
    if (!P.fillList.length) P.fillList = D.phrases.filter(function (p) { return p.blank !== "none"; });
    var p = P.fillList[P.fillIdx];
    var head = '<div class="fill-nav">' +
      '<button class="act" data-fillnav="-1" aria-label="前のフレーズ">‹ 前</button>' +
      '<span class="fill-counter">' + (P.fillIdx + 1) + ' / ' + P.fillList.length + '</span>' +
      '<button class="act" data-fillnav="1" aria-label="次のフレーズ">次 ›</button></div>';
    var stage;
    if (P.fillPick) {
      var full = fillSentence(p.en, P.fillPick);
      // 〇〇の位置で分割して合成（replaceだと文中の同語を誤ハイライトしうる）
      var parts = p.en.split("〇〇");
      var fullHtml = esc(parts[0]) +
        '<span class="blank-slot filled">' + esc(P.fillPick) + '</span>' +
        esc(parts.slice(1).join("〇〇"));
      stage = '<div class="fill-stage done-fill">' +
        '<div class="fs-label">できた文</div>' +
        '<div class="fs-en">' + fullHtml + '</div>' +
        '<div class="fs-jp">' + esc(p.jp) + '</div>' +
        '<div class="fs-acts"><button class="act primary" data-speak="' + esc(full) + '">🔊 発音する</button>' +
        '<button class="act" data-fillreset="1">↺ 別の語で</button></div></div>';
    } else {
      stage = '<div class="fill-stage">' +
        '<div class="fs-label">〇〇 に入れる語を下から選ぶ</div>' +
        '<div class="fs-en">' + enHtml(p.en) + '</div>' +
        '<div class="fs-jp">' + esc(p.jp) + (p.note ? '　<span class="fs-note">' + esc(p.note) + '</span>' : "") + '</div></div>';
    }
    var picks = '<div class="fill-src"><div class="fill-src-label">おすすめ</div><div class="fill-chips">' +
      p.choices.map(function (c) {
        return '<button class="fill-chip' + (P.fillPick === c ? " active" : "") + '" data-pick="' + esc(c) + '"><b>' + esc(c) + '</b></button>';
      }).join("") + '</div></div>';
    var db = fillCandidatesDb(p);
    if (db.length) {
      picks += '<div class="fill-src"><div class="fill-src-label">単語DBから</div><div class="fill-chips scroll">' +
        db.map(function (c) {
          return '<button class="fill-chip' + (P.fillPick === c.en ? " active" : "") + '" data-pick="' + esc(c.en) + '"><b>' + esc(c.en) + '</b><small>' + esc(c.jp) + '</small></button>';
        }).join("") + '</div></div>';
    }
    return head + stage + picks;
  }
  function fillNav(d) {
    var n = P.fillList.length; if (!n) return;
    P.fillIdx = (P.fillIdx + d + n) % n;
    P.fillPick = null;
    render();
  }

  // ── events ──────────────────────────────────────────────
  function onClick(e) {
    var t;
    t = e.target.closest("[data-ptab]");
    if (t) {
      var tab = t.dataset.ptab;
      if (tab !== P.tab) { P.tab = tab; if (tab === "cards") startDeck(); }
      render(); return;
    }
    t = e.target.closest("[data-speak]");
    if (t) { window.Speech.speak(t.dataset.speak); return; }
    t = e.target.closest("[data-grade]");
    if (t) { grade(t.dataset.grade === "1"); return; }
    t = e.target.closest("[data-fc]");
    if (t) { toggleFlip(); return; }
    t = e.target.closest("[data-fcrestart]");
    if (t) { startDeck(); render(); return; }
    t = e.target.closest("[data-pcat]");
    if (t) { P.cat = t.dataset.pcat === "__all" ? null : t.dataset.pcat; render(); return; }
    t = e.target.closest("[data-fillnav]");
    if (t) { fillNav(+t.dataset.fillnav); return; }
    t = e.target.closest("[data-fillreset]");
    if (t) { P.fillPick = null; render(); return; }
    t = e.target.closest("[data-pick]");
    if (t) {
      P.fillPick = t.dataset.pick;
      render();
      var p = P.fillList[P.fillIdx];
      if (p) window.Speech.speak(fillSentence(p.en, P.fillPick));
      return;
    }
  }
  // app.js から委譲される。処理したら true を返す（呼び元が preventDefault する）
  function onKey(e) {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return false;
    if (P.tab === "cards") {
      if (e.key === " " || e.key === "Enter") { toggleFlip(); return true; }
      if (P.flipped && e.key === "1") { grade(false); return true; }
      if (P.flipped && e.key === "2") { grade(true); return true; }
    } else if (P.tab === "fill") {
      if (e.key === "ArrowLeft") { fillNav(-1); return true; }
      if (e.key === "ArrowRight") { fillNav(1); return true; }
    }
    return false;
  }

  root = typeof document !== "undefined" ? document.getElementById("phrases") : null;
  if (root) root.addEventListener("click", onClick);

  window.Phrases = {
    enter: render,
    render: render,
    onKey: onKey,
    logic: {
      BOX_DAYS: BOX_DAYS, gradeItem: gradeItem, isDue: isDue, buildDeck: buildDeck,
      boxDist: boxDist, masteredCount: masteredCount, fillSentence: fillSentence,
      addDays: addDays
    }
  };
})();
