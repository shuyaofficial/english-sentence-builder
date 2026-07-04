/* speech.js — 読み上げユーティリティ（Web Speech API の薄いラッパー）
 * 依存なし。window.Speech に公開。app.js / phrases.js から使う。
 * en-US のローカル音声を優先して選ぶ（既定音声が日本語環境だと英文が不自然になるため）。 */
(function () {
  "use strict";
  var chosen = null;

  function rank(v) {
    if (!/^en([-_]|$)/i.test(v.lang)) return -1;
    var r = 1;
    if (/^en[-_]US/i.test(v.lang)) r += 4;
    else if (/^en[-_]GB/i.test(v.lang)) r += 3;
    if (v.localService) r += 2; // オフラインで即応答する音声を優先
    if (/Samantha|Alex|Karen|Daniel|Moira/i.test(v.name)) r += 1; // macOSの自然系
    return r;
  }

  function refresh() {
    try {
      var vs = speechSynthesis.getVoices() || [];
      var best = null, bestR = 0;
      vs.forEach(function (v) { var r = rank(v); if (r > bestR) { bestR = r; best = v; } });
      if (best) chosen = best;
    } catch (e) { }
  }

  /* opt.enqueue: true なら再生中をキャンセルせずネイティブキューに積む（逐次再生用）。
   * opt.onstart/onend/onerror: utteranceイベントの横流し。
   * 戻り値の utterance は呼び出し側で参照保持できる（ChromeはGCされると onend が来ない）。 */
  function speak(text, opt) {
    if (!text || !window.speechSynthesis) return null;
    opt = opt || {};
    try {
      if (!opt.enqueue) speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = opt.rate || 0.95;
      if (!chosen) refresh();
      if (chosen) u.voice = chosen;
      if (opt.onstart) u.onstart = opt.onstart;
      if (opt.onend) u.onend = opt.onend;
      if (opt.onerror) u.onerror = opt.onerror;
      speechSynthesis.speak(u);
      return u;
    } catch (e) { return null; }
  }

  function cancel() {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
  }

  if (window.speechSynthesis) {
    refresh(); // 一部ブラウザは非同期ロードのため onvoiceschanged でも拾う
    if ("onvoiceschanged" in speechSynthesis) speechSynthesis.onvoiceschanged = refresh;
  }

  window.Speech = { speak: speak, cancel: cancel, available: !!window.speechSynthesis };
})();
