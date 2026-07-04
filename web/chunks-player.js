/* chunks-player.js — チャンクの逐次再生プレイヤー（chunks.js から利用）
 * iOS Safari 対策の要点:
 *  - 再生開始のタップハンドラ内で全チャンクを同期的にキュー（発話許可はジェスチャ内が条件。
 *    チャンク毎に cancel→speak を繰り返すと無音化しやすい）
 *  - utterance の参照を配列で保持（ChromeはGCされると onend が届かない）
 *  - 世代トークンで stop/cancel 後に遅れて届くイベントを無視
 *  - ウォッチドッグ: onstart/onend が来ないままの停止を検知して前進・終了
 *  - キープアライブ: paused に落ちたら resume（Chromeの長文停止・iOSのスタック対策）
 * ctx: { state: 共有状態S（playing/playIdxを書く）, render: 再描画関数, view: ハイライト追従用要素 } */
(function () {
  "use strict";

  window.createChunkPlayer = function (ctx) {
    var S = ctx.state;
    var token = 0, timer = null, keepAlive = null, utts = [];

    function watchdogMs(text, rate) {
      var words = String(text).split(/\s+/).length;
      return Math.max(2500, (words * 450) / rate + 1500);
    }
    function clearTimers() {
      if (timer) { clearTimeout(timer); timer = null; }
      if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
    }
    function setIdx(i) {
      S.playIdx = i;
      ctx.render();
      var el = ctx.view && ctx.view.querySelector(".chunk-pill.speaking");
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    }
    function finish() {
      token++;
      clearTimers();
      utts = [];
      if (window.Speech) window.Speech.cancel();
      S.playing = false;
      S.playIdx = -1;
      ctx.render();
    }

    // ウォッチドッグ: 発話中なら resume して再監視（上限あり）、止まっていたら前進 or 終了
    // tries: speaking=true のまま音声イベントが来ない状態の連続回数。上限を超えたら
    // エンジンがゾンビ化（iOSで既知）とみなして終了し、UIが再生中のまま固まるのを防ぐ。
    function arm(hi, text, rate, myToken, isLast, tries) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (myToken !== token) return;
        try {
          if (window.speechSynthesis && speechSynthesis.speaking) {
            if ((tries || 0) >= 3) { finish(); return; }
            speechSynthesis.resume();
            arm(hi, text, rate, myToken, isLast, (tries || 0) + 1);
            return;
          }
        } catch (e) { }
        if (isLast) { finish(); return; }
        setIdx(hi + 1); // onstart欠落時もUIを追従させる
        armZombie(myToken); // 以降イベントが一切来ないままなら終了させる
      }, watchdogMs(text, rate));
    }
    // 合成前進後の保険: 8秒ごとに発話状況を見て、完全に止まっていたら終了
    function armZombie(myToken) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        if (myToken !== token) return;
        try {
          if (window.speechSynthesis && speechSynthesis.speaking) { armZombie(myToken); return; }
        } catch (e) { }
        finish();
      }, 8000);
    }

    // chunks: [{en,...}] / indexOffset: ハイライト位置の起点（単発再生で使う）
    function play(chunks, rate, indexOffset) {
      finish(); // 先行再生の後始末（token++ 済み）
      var myToken = token;
      S.playing = true;
      keepAlive = setInterval(function () {
        try { if (speechSynthesis.paused) speechSynthesis.resume(); } catch (e) { }
      }, 8000);
      chunks.forEach(function (c, i) {
        var hi = indexOffset + i;
        var isLast = i === chunks.length - 1;
        var u = window.Speech.speak(c.en, {
          rate: rate,
          enqueue: i > 0,
          onstart: function () {
            if (myToken !== token) return;
            setIdx(hi);
            arm(hi, c.en, rate, myToken, isLast);
          },
          onend: function () {
            if (myToken !== token) return;
            if (isLast) finish();
            else arm(hi, c.en, rate, myToken, isLast); // 次の onstart 待ちを監視
          },
          onerror: function () {
            if (myToken !== token) return;
            finish();
          }
        });
        if (u) utts.push(u);
      });
      if (!utts.length) { finish(); return; }
      // 最初の onstart 自体が来ないケース（iOSの無音化）に備えて初回から監視する
      arm(indexOffset, chunks[0].en, rate, myToken, chunks.length === 1);
      ctx.render();
    }

    return { play: play, stop: finish, isPlaying: function () { return S.playing; } };
  };
})();
