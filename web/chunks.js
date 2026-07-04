/* chunks.js — チャンクリーディング UI（state＋render＋イベント）
 * 依存: speech.js, chunks-data.js（別エージェント開発中。契約: 冒頭コメント参照）
 * Phase 2: home（一覧）・add（追加3ステップ）を実装。read/drill は最小スタブ。
 * 流儀は app.js / phrases.js に合わせる: ES5・IIFE・イベント委譲・グローバルS＋render()全再描画。 */
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var view = document.getElementById("view");
  var stickybar = document.getElementById("stickybar");

  if (!window.ChunkData) {
    if (view) view.innerHTML = '<div class="ck-empty">読み込みエラー：chunks-data.js が見つかりません。</div>';
    if (stickybar) stickybar.innerHTML = "";
  } else {
    (function (ChunkData) {
      var doc = ChunkData.load();

      var S = {
        view: "home", addStep: "input", addJp: "", pasteText: "", parsed: null, parseError: "", pickWarns: [],
        readId: null, showJp: true, noteIdx: -1, showAlt: false,
        playIdx: -1, playing: false, rate: (doc.settings && doc.settings.rate) || 0.85,
        deck: [], deckIdx: 0, revealed: 0, drillDone: 0, drillAgain: 0
      };

      // ── helpers ───────────────────────────────────────────
      function findItem(id) {
        var items = doc.items || [];
        for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
        return null;
      }
      function srsDots(srs) {
        var box = srs && typeof srs.box === "number" ? srs.box : -1;
        var out = "";
        for (var i = 0; i < 5; i++) out += '<span class="ck-dot' + (i <= box ? " on" : "") + '"></span>';
        return out;
      }
      // phrases.js の copyMine と同じ方式（clipboard→失敗時prompt）
      function copyText(text, onDone) {
        function fallback() { try { window.prompt("コピーしてください", text); } catch (e) { } if (onDone) onDone(); }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { if (onDone) onDone(); }, fallback);
          } else { fallback(); }
        } catch (e) { fallback(); }
      }

      // ── Player: 逐次再生（実装は chunks-player.js）────────
      var Player = window.createChunkPlayer
        ? window.createChunkPlayer({ state: S, render: render, view: view })
        : { play: function () { }, stop: function () { }, isPlaying: function () { return false; } };

      // ── render: dispatch ─────────────────────────────────
      function render() {
        if (!view) return;
        document.body.className = "view-" + S.view; // 非ホーム画面でヘッダーを圧縮するため
        if (S.view === "add") {
          view.innerHTML = renderAdd();
        } else if (S.view === "read") {
          view.innerHTML = renderRead();
        } else if (S.view === "drill") {
          view.innerHTML = renderDrill();
        } else {
          view.innerHTML = renderHome();
        }
        renderStickybar();
      }

      // ── home ──────────────────────────────────────────────
      function renderHome() {
        var items = doc.items || [];
        var due = ChunkData.dueCount(items, ChunkData.today());
        // 初回（0件）はカウンタ等を出さず、3行の説明と「＋追加」だけに絞る
        if (!items.length) {
          return '<div class="ck-empty">' +
            '<div>① 日本語で言いたいことを書く</div>' +
            '<div>② AIに翻訳・分割してもらう</div>' +
            '<div>③ チャンクで聞いて、話す</div>' +
            '</div>';
        }

        var top = '<div class="ck-topbar">' +
          (due > 0 ? '<span class="ck-due">今日の復習 ' + due + '件</span>' : "") +
          '<span class="ck-count">' + items.length + ' / ' + ChunkData.MAX_ITEMS + ' 文</span>' +
          '</div>';

        var list = items.map(function (it) {
          return '<div class="ck-card" data-act="open" data-id="' + esc(it.id) + '" tabindex="0" role="button">' +
            '<div class="ck-body">' +
            '<div class="ck-jp">' + esc(it.jp) + '</div>' +
            '<div class="ck-en">' + esc(it.en) + '</div>' +
            '<div class="ck-dots">' + srsDots(it.srs) + '</div>' +
            '</div>' +
            '<button class="ck-del" data-act="del" data-id="' + esc(it.id) + '" aria-label="削除">✕</button>' +
            '</div>';
        }).join("");

        return top + '<div class="ck-list">' + list + '</div>' +
          '<button class="ck-export" data-act="export">📋 すべて書き出し</button>';
      }

      // ── add ───────────────────────────────────────────────
      function stepIndicator() {
        var steps = [["input", "① 入力"], ["paste", "② 貼り付け"], ["pick", "③ 選ぶ"]];
        return '<div class="ck-steps">' + steps.map(function (s) {
          return '<span class="ck-step' + (S.addStep === s[0] ? " on" : "") + '">' + s[1] + '</span>';
        }).join("") + '</div>';
      }
      function backTarget() {
        if (S.addStep === "input") return "home";
        if (S.addStep === "paste") return "input";
        return "paste";
      }
      function renderAdd() {
        var head = '<div class="ck-addhead">' +
          '<button class="ck-back" data-act="back">← 戻る</button>' +
          stepIndicator() + '</div>';
        var body;
        if (S.addStep === "paste") body = renderAddPaste();
        else if (S.addStep === "pick") body = renderAddPick();
        else body = renderAddInput();
        return head + body;
      }
      function renderAddInput() {
        return '<div class="ck-panel">' +
          '<textarea id="add-jp" class="ck-textarea" maxlength="200" rows="4" ' +
          'placeholder="例: 明日の朝までにこの障害の原因を調べておきます">' + esc(S.addJp) + '</textarea>' +
          '<div class="ck-note">🔒 業務の固有名詞・IPアドレス等は伏せ字にして入力</div>' +
          '</div>';
      }
      function renderAddPaste() {
        var warn = S.parseError
          ? '<div class="ck-warn">' + esc(S.parseError) + '　<button class="ck-link" data-act="recopy">プロンプトを再コピー</button></div>'
          : "";
        return warn + '<div class="ck-lead">ChatGPT・Claude・Gemini などにプロンプトを貼り、返ってきた答えを<b>そのまま全部</b>下に貼り付けてください</div>' +
          '<div class="ck-panel"><textarea id="add-paste" class="ck-textarea" rows="8" placeholder="AIの返答をそのまま貼り付け">' + esc(S.pasteText) + '</textarea></div>';
      }
      function renderAddPick() {
        if (!S.parsed || !S.parsed.candidates) return '<div class="ck-empty">候補がありません。</div>';
        var warnHtml = S.pickWarns && S.pickWarns.length
          ? '<div class="ck-pickwarn">' + S.pickWarns.map(esc).join("<br>") + '</div>' : "";
        var labelMap = { plain: ["まず通じる", "plain"], natural: ["より自然", "natural"] };
        var cards = S.parsed.candidates.slice(0, 2).map(function (cand, i) {
          var lm = labelMap[cand.label] || [cand.label, "natural"];
          var chunksHtml = (cand.chunks || []).map(function (c) { return esc(c.en); }).join(' <span class="sep">/</span> ');
          return '<div class="ck-cand">' +
            '<span class="ck-label ' + lm[1] + '">' + esc(lm[0]) + '</span>' +
            '<div class="ck-nuance">' + esc(cand.nuance || "") + '</div>' +
            '<div class="ck-fullen">' + chunksHtml + '</div>' +
            '<button class="ck-pickbtn" data-act="pick" data-i="' + i + '">この文で練習する</button>' +
            '</div>';
        }).join("");
        return warnHtml + cards;
      }

      // ── read: チャンクリーディング ─────────────────────────
      function renderRead() {
        var it = findItem(S.readId);
        if (!it) return '<div class="ck-empty">文が見つかりません。</div>';
        var pills = (it.chunks || []).map(function (c, i) {
          var cls = "chunk-pill" + (S.playIdx === i ? " speaking" : "") + (S.noteIdx === i ? " sel" : "");
          return (i > 0 ? '<span class="ck-pillsep">/</span>' : "") +
            '<button class="' + cls + '" data-act="pill" data-i="' + i + '">' +
            '<span class="en">' + esc(c.en) + '</span>' +
            (S.showJp ? '<span class="jp">' + esc(c.jp || "") + '</span>' : "") +
            '</button>';
        }).join("");
        var note = "";
        if (S.noteIdx >= 0 && it.chunks[S.noteIdx] && it.chunks[S.noteIdx].note) {
          note = '<div class="ck-notebox">' + esc(it.chunks[S.noteIdx].note) + '</div>';
        }
        var alt = "";
        if (it.altEn) {
          var altLabel = it.altLabel === "plain" ? "まず通じる"
            : it.altLabel === "natural" ? "より自然" : (it.altLabel || "別案");
          alt = '<div class="ck-alt">' +
            '<button class="ck-althead" data-act="togglealt">別候補（' + esc(altLabel) + '）' + (S.showAlt ? "▴" : "▾") + '</button>' +
            (S.showAlt
              ? '<div class="ck-altbody"><span class="ck-alten">' + esc(it.altEn) + '</span>' +
                (window.Speech && window.Speech.available
                  ? '<button class="ck-altspeak" data-act="speakalt" aria-label="別候補を読み上げ">🔊</button>' : "") +
                (it.altNuance ? '<div class="ck-nuance">' + esc(it.altNuance) + '</div>' : "") +
                '</div>'
              : "") +
            '</div>';
        }
        return '<button class="ck-back" data-act="back-home">← 一覧</button>' +
          (S.showJp ? '<div class="ck-jpbox">' + esc(it.jp) + '</div>' : "") +
          '<div class="ck-pills">' + pills + '</div>' +
          note + alt +
          '<button class="ck-delread" data-act="del-read" data-id="' + esc(it.id) + '">この文を削除</button>';
      }

      // ── drill: 瞬間英作文（jpのみ→タップでチャンク開示→採点）─
      function nextDueLabel(grade, box) {
        if (grade === "ng") return "今日";
        if (grade === "soft") return "明日";
        var nb = Math.min(box + 1, ChunkData.BOX_DAYS.length - 1);
        return ChunkData.BOX_DAYS[nb] + "日後";
      }
      function renderDrillDone() {
        return '<div class="ck-drilldone">' +
          '<div class="ck-drilldone-emoji">🎉</div>' +
          '<div class="ck-drilldone-title">一周おわり</div>' +
          '<div class="ck-drilldone-stats">' +
          '<div>○/△で覚えた: ' + S.drillDone + ' 文</div>' +
          '<div>もう一度に回した: ' + S.drillAgain + ' 回</div>' +
          '</div></div>';
      }
      function renderDrillCard() {
        var it = S.deck[S.deckIdx];
        var chunks = it.chunks || [];
        var remain = S.deck.length - S.deckIdx;
        var top = '<div class="ck-drilltop">' +
          '<button class="ck-back" data-act="back-home">← やめる</button>' +
          '<span class="ck-drillremain">残り ' + remain + '</span>' +
          '</div>';
        var allRevealed = S.revealed >= chunks.length;
        var cardBottom = allRevealed ? "" :
          '<div class="ck-drillhint">タップでチャンクをひとつずつ開示</div>';
        var card = '<div class="ck-drillcard" data-act="reveal" role="button" tabindex="0">' +
          '<div class="ck-drilljp">' + esc(it.jp) + '</div>' +
          cardBottom +
          '</div>';
        var pills = chunks.slice(0, S.revealed).map(function (c, i) {
          return (i > 0 ? '<span class="ck-pillsep">/</span>' : "") +
            '<span class="chunk-pill' + (S.playIdx === i ? " speaking" : "") + '">' +
            '<span class="en">' + esc(c.en) + '</span>' +
            '<span class="jp">' + esc(c.jp || "") + '</span>' +
            '</span>';
        }).join("");
        if (!allRevealed) {
          pills += (S.revealed > 0 ? '<span class="ck-pillsep">/</span>' : "") +
            '<span class="ck-hidden-pill">…</span>';
        }
        return top + card + '<div class="ck-pills">' + pills + '</div>';
      }
      function renderDrill() {
        if (S.deckIdx >= S.deck.length) return renderDrillDone();
        return renderDrillCard();
      }

      // ── drill: stickybar（開示中 or 採点3ボタン or 周回終了）──
      function renderDrillStickybar() {
        if (S.deckIdx >= S.deck.length) {
          return '<button class="ck-btn outline" data-act="drillrestart">↻ もう一周</button>' +
            '<button class="ck-btn primary" data-act="back-home">一覧へ</button>';
        }
        var it = S.deck[S.deckIdx];
        var chunks = it.chunks || [];
        if (S.revealed < chunks.length) {
          return '<button class="ck-btn primary" data-act="reveal">チャンクを開く</button>' +
            '<button class="ck-btn outline" data-act="revealall">全部見る</button>';
        }
        var box = (it.srs && it.srs.box) || 0;
        return '<div class="ck-gradebar">' +
          '<button class="ck-grade3 ng" data-act="grade" data-grade="ng"><b>✗ もう一度</b><small>' + nextDueLabel("ng", box) + '</small></button>' +
          '<button class="ck-grade3 soft" data-act="grade" data-grade="soft"><b>△ あやしい</b><small>' + nextDueLabel("soft", box) + '</small></button>' +
          '<button class="ck-grade3 ok" data-act="grade" data-grade="ok"><b>○ 言えた</b><small>' + nextDueLabel("ok", box) + '</small></button>' +
          '</div>';
      }

      // ── stickybar ────────────────────────────────────────
      function renderStickybar() {
        if (!stickybar) return;
        if (S.view === "home") {
          var items = doc.items || [];
          var due = ChunkData.dueCount(items, ChunkData.today());
          var drillBtn = due > 0
            ? '<button class="ck-btn outline" data-act="drill">⚡ 瞬間英作文 (' + due + ')</button>' : "";
          stickybar.innerHTML = drillBtn + '<button class="ck-btn primary" data-act="add">＋ 追加</button>';
        } else if (S.view === "add" && S.addStep === "input") {
          var disabled = !S.addJp.trim();
          stickybar.innerHTML = '<button class="ck-btn primary" data-act="copyprompt"' + (disabled ? " disabled" : "") + '>📋 AI用プロンプトをコピー</button>';
        } else if (S.view === "add" && S.addStep === "paste") {
          stickybar.innerHTML = '<button class="ck-btn primary" data-act="ingest">取り込む</button>';
        } else if (S.view === "drill") {
          stickybar.innerHTML = renderDrillStickybar();
        } else if (S.view === "read" && findItem(S.readId)) {
          var jpBtn = '<button class="ck-jptoggle' + (S.showJp ? " on" : "") + '" data-act="togglejp" aria-label="訳の表示切替">あ/A</button>';
          if (window.Speech && window.Speech.available) {
            var rates = [["0.7", 0.7], ["0.85", 0.85], ["1.0", 1.0]].map(function (r) {
              return '<button class="ck-rate' + (S.rate === r[1] ? " on" : "") + '" data-act="rate" data-rate="' + r[1] + '">' + r[0] + '</button>';
            }).join("");
            stickybar.innerHTML =
              '<button class="ck-btn primary" data-act="' + (S.playing ? "stopplay" : "playall") + '">' +
              (S.playing ? "■ 停止" : "▶ 通し再生") + '</button>' +
              '<div class="ck-rates">' + rates + '</div>' + jpBtn;
          } else {
            stickybar.innerHTML = '<span class="ck-nospeech">この端末は読み上げ非対応です</span>' + jpBtn;
          }
        } else {
          stickybar.innerHTML = "";
        }
      }

      // ── actions ──────────────────────────────────────────
      function goHome() { Player.stop(); S.view = "home"; S.readId = null; render(); }
      function goAdd() { Player.stop(); S.view = "add"; S.addStep = "input"; S.addJp = ""; S.pasteText = ""; S.parseError = ""; S.parsed = null; S.pickWarns = []; render(); }
      function goRead(id) {
        Player.stop();
        S.readId = id; S.view = "read";
        S.noteIdx = -1; S.showAlt = false; S.showJp = true;
        render();
      }
      function goDrill() {
        Player.stop();
        var deck = ChunkData.buildDeck(doc.items, ChunkData.today());
        if (!deck.length) return; // 防御（ボタンは due>0 でしか出ない）
        S.deck = deck; S.deckIdx = 0; S.revealed = 0; S.drillDone = 0; S.drillAgain = 0;
        S.view = "drill";
        render();
      }

      // ── drill: actions ───────────────────────────────────
      function onReveal() {
        if (S.deckIdx >= S.deck.length) return;
        var it = S.deck[S.deckIdx];
        var chunks = it.chunks || [];
        if (S.revealed >= chunks.length) return;
        var i = S.revealed;
        S.revealed++;
        if (window.Speech && window.Speech.available) Player.play([chunks[i]], S.rate, i);
        else render();
      }
      function onRevealAll() {
        if (S.deckIdx >= S.deck.length) return;
        var it = S.deck[S.deckIdx];
        S.revealed = (it.chunks || []).length;
        render();
      }
      // srs だけ差し替えたコピーを返す（既存流儀に合わせ ES5 のオブジェクトリテラルで）
      function withSrs(x, srs) {
        return {
          id: x.id, jp: x.jp, en: x.en, chunks: x.chunks,
          altEn: x.altEn, altLabel: x.altLabel, altNuance: x.altNuance,
          tags: x.tags, createdAt: x.createdAt, srs: srs
        };
      }
      function onDrillGrade(grade) {
        if (S.deckIdx >= S.deck.length) return;
        Player.stop();
        var item = S.deck[S.deckIdx];
        var srs = ChunkData.gradeItem3(item.srs, grade, ChunkData.today());
        doc = {
          version: doc.version,
          settings: doc.settings,
          items: doc.items.map(function (x) { return x.id === item.id ? withSrs(x, srs) : x; })
        };
        ChunkData.save(doc);
        if (grade === "ng") {
          S.deck = S.deck.concat([withSrs(item, srs)]);
          S.drillAgain++;
        } else {
          S.drillDone++;
        }
        S.deckIdx++; S.revealed = 0;
        render();
      }
      function onDrillRestart() { goDrill(); }

      function onPill(i) {
        var it = findItem(S.readId);
        if (!it || !it.chunks[i]) return;
        S.noteIdx = i;
        if (window.Speech && window.Speech.available) Player.play([it.chunks[i]], S.rate, i);
        else render();
      }
      function onPlayAll() {
        var it = findItem(S.readId);
        if (!it || !it.chunks.length) return;
        S.noteIdx = -1;
        Player.play(it.chunks, S.rate, 0);
      }
      function onRate(r) {
        Player.stop();
        S.rate = r;
        doc = ChunkData.setRate(doc, r);
        ChunkData.save(doc);
        render();
      }
      function onSpeakAlt() {
        var it = findItem(S.readId);
        if (!it || !it.altEn) return;
        Player.stop();
        if (window.Speech) window.Speech.speak(it.altEn, { rate: S.rate });
      }

      function onCopyPrompt() {
        var jp = S.addJp.trim();
        if (!jp) return;
        var prompt = ChunkData.buildPrompt(jp);
        copyText(prompt, function () {
          var btn = stickybar.querySelector('[data-act="copyprompt"]');
          if (btn) btn.textContent = "コピーしました ✓";
          setTimeout(function () {
            if (S.view !== "add" || S.addStep !== "input") return; // コピー後600ms以内に離脱済みなら何もしない
            S.addStep = "paste";
            render();
          }, 600);
        });
      }
      function onRecopyPrompt() {
        var prompt = ChunkData.buildPrompt(S.addJp.trim());
        copyText(prompt, function () { });
        S.addStep = "paste";
        render();
      }
      function onIngest() {
        var ta = document.getElementById("add-paste");
        var text = ta ? ta.value : "";
        S.pasteText = text; // エラーで再描画しても貼り付け内容を失わない
        var result = ChunkData.parseResult(text);
        if (!result.ok) {
          S.parseError = result.error;
          render();
          return;
        }
        S.parsed = result;
        S.pickWarns = result.warns || [];
        S.parseError = "";
        S.addStep = "pick";
        render();
      }
      function onPickCandidate(i) {
        if (!S.parsed || !S.parsed.candidates) return;
        var chosen = S.parsed.candidates[i];
        var other = S.parsed.candidates.length > 1
          ? S.parsed.candidates[i === 0 ? 1 : 0] : null;
        if (!chosen) return;
        var item = ChunkData.newItem(S.addJp.trim(), chosen, other);
        doc = ChunkData.addItem(doc, item);
        ChunkData.save(doc);
        goRead(item.id);
      }
      function onDelete(id) {
        doc = ChunkData.removeItem(doc, id);
        ChunkData.save(doc);
        render();
      }
      function onExport() {
        var raw = "";
        try { raw = window.localStorage.getItem(ChunkData.STORE_KEY) || ""; } catch (e) { }
        copyText(raw, function () {
          var btn = view.querySelector('[data-act="export"]');
          if (btn) {
            btn.textContent = "コピーしました ✓";
            setTimeout(function () { if (S.view === "home") render(); }, 2000);
          }
        });
      }

      // ── events (イベント委譲) ────────────────────────────
      function onViewClick(e) {
        var t;
        // del はカード（open）の内側にあるため、必ず open より先に判定する
        t = e.target.closest('[data-act="del"]');
        if (t) { onDelete(t.dataset.id); return; }
        t = e.target.closest('[data-act="open"]');
        if (t) { goRead(t.dataset.id); return; }
        t = e.target.closest('[data-act="export"]');
        if (t) { onExport(); return; }
        t = e.target.closest('[data-act="back"]');
        if (t) { S.addStep = backTarget(); if (S.addStep === "home") { goHome(); return; } render(); return; }
        t = e.target.closest('[data-act="recopy"]');
        if (t) { onRecopyPrompt(); return; }
        t = e.target.closest('[data-act="pick"]');
        if (t) { onPickCandidate(+t.dataset.i); return; }
        t = e.target.closest('[data-act="pill"]');
        if (t) { onPill(+t.dataset.i); return; }
        t = e.target.closest('[data-act="togglealt"]');
        if (t) { S.showAlt = !S.showAlt; render(); return; }
        t = e.target.closest('[data-act="speakalt"]');
        if (t) { onSpeakAlt(); return; }
        t = e.target.closest('[data-act="back-home"]');
        if (t) { goHome(); return; }
        t = e.target.closest('[data-act="del-read"]');
        if (t) { Player.stop(); onDelete(t.dataset.id); goHome(); return; }
        t = e.target.closest('[data-act="reveal"]');
        if (t) { onReveal(); return; }
      }
      function onStickybarClick(e) {
        var t;
        t = e.target.closest('[data-act="add"]');
        if (t) { goAdd(); return; }
        t = e.target.closest('[data-act="drill"]');
        if (t) { goDrill(); return; }
        t = e.target.closest('[data-act="copyprompt"]');
        if (t && !t.disabled) { onCopyPrompt(); return; }
        t = e.target.closest('[data-act="ingest"]');
        if (t) { onIngest(); return; }
        t = e.target.closest('[data-act="playall"]');
        if (t) { onPlayAll(); return; }
        t = e.target.closest('[data-act="stopplay"]');
        if (t) { Player.stop(); return; }
        t = e.target.closest('[data-act="rate"]');
        if (t) { onRate(parseFloat(t.dataset.rate)); return; }
        t = e.target.closest('[data-act="togglejp"]');
        if (t) { S.showJp = !S.showJp; render(); return; }
        t = e.target.closest('[data-act="reveal"]');
        if (t) { onReveal(); return; }
        t = e.target.closest('[data-act="revealall"]');
        if (t) { onRevealAll(); return; }
        t = e.target.closest('[data-act="grade"]');
        if (t) { onDrillGrade(t.dataset.grade); return; }
        t = e.target.closest('[data-act="drillrestart"]');
        if (t) { onDrillRestart(); return; }
        t = e.target.closest('[data-act="back-home"]');
        if (t) { goHome(); return; }
      }
      function onViewInput(e) {
        if (e.target && e.target.id === "add-jp") {
          S.addJp = e.target.value;
          renderStickybar();
        }
      }

      if (view) {
        view.addEventListener("click", onViewClick);
        view.addEventListener("input", onViewInput);
      }
      if (stickybar) stickybar.addEventListener("click", onStickybarClick);

      // drill 専用キーボード操作（phrases.js の onKey と同じパターン）
      function onDrillKey(e) {
        if (S.view !== "drill" || S.deckIdx >= S.deck.length) return;
        var chunks = S.deck[S.deckIdx].chunks || [];
        var allRevealed = S.revealed >= chunks.length;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (!allRevealed) onReveal();
          return;
        }
        if (allRevealed) {
          if (e.key === "1") { onDrillGrade("ng"); return; }
          if (e.key === "2") { onDrillGrade("soft"); return; }
          if (e.key === "3") { onDrillGrade("ok"); return; }
        }
      }
      document.addEventListener("keydown", onDrillKey);

      // タブ切替・画面ロックで裏に回ったら再生を止める（iOSで再開が不安定なため）
      document.addEventListener("visibilitychange", function () {
        if (document.hidden && S.playing) Player.stop();
      });

      render();
    })(window.ChunkData);
  }

  // PWA: http(s)配信時のみService Worker登録（file://では不可。app.js と同型）
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(function () { });
  }
})();
