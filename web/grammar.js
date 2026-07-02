/* grammar.js — 純粋な文法ロジック（活用・冠詞・文型スロット・文法スポット）
 * 依存なし。window.Grammar に公開。app.js から使う。 */
(function () {
  "use strict";

  var MODALS = {
    can:   ["can", "can't"],
    could: ["could", "couldn't"],
    will:  ["will", "won't"],
    would: ["would", "wouldn't"],
    should:["should", "shouldn't"]
  };

  // 動詞の表層形を返す（主語人称・時制・法助動詞・否定を反映）
  function verbSurface(verb, opt) {
    opt = opt || {};
    var person = opt.person || "1sg";
    var tense = opt.tense || "present";
    var modal = opt.modal || "none";
    var negative = !!opt.negative;
    var f = verb.forms;
    var is3sg = person === "3sg";

    // be 動詞は特別
    if (verb.en === "be") {
      if (modal !== "none") return modalWord(modal, negative) + " be";
      if (tense === "past") {
        var wb = (person === "1sg" || person === "3sg") ? "was" : "were";
        return negative ? wb + " not" : wb;
      }
      var be = person === "1sg" ? "am" : (is3sg ? "is" : "are");
      return negative ? be + " not" : be;
    }

    if (modal !== "none") {
      return modalWord(modal, negative) + " " + f.base;
    }
    if (tense === "past") {
      return negative ? "didn't " + f.base : f.past;
    }
    // present
    if (negative) return (is3sg ? "doesn't " : "don't ") + f.base;
    return is3sg ? f.thirdsg : f.base;
  }

  function modalWord(modal, negative) {
    var m = MODALS[modal];
    if (!m) return "";
    return negative ? m[1] : m[0];
  }

  // 目的語・補語に使う名詞句（冠詞リマインダーを反映）
  function nounPhrase(noun) {
    var a = noun.article;
    if (a === "uncount" || a === "plural") return noun.en;
    return a + " " + noun.en; // a book / an egg
  }

  // 文型 → 動詞のあとに必要なコアスロット列
  function slotsForPattern(pattern) {
    switch (pattern) {
      case "SV":   return [];
      case "SVC":  return [{ type: "complement" }];
      case "SVOO": return [{ type: "objectPerson" }, { type: "objectThing" }];
      case "SVOC": return [{ type: "object" }, { type: "complement" }];
      case "SVO":
      default:     return [{ type: "object" }];
    }
  }

  var SLOT_LABEL = {
    subject: "だれが", verb: "どうする",
    object: "なにを", objectPerson: "だれに", objectThing: "なにを",
    complement: "どんな/なに", extra: "味付け"
  };

  var PATTERN_JP = {
    SV: "自動詞（目的語なし）", SVC: "S＋動詞＋補語（〜だ/〜になる）",
    SVO: "S＋動詞＋目的語（〜を）", SVOO: "S＋動詞＋人＋物（〜に〜を）",
    SVOC: "S＋動詞＋目的語＋補語（〜を〜に）"
  };

  // 文法スポット（新英語組み立てTOWN的な気づき）。state断片から通知配列を返す
  function grammarHints(ctx) {
    var hints = [];
    var subj = ctx.subject, verb = ctx.verb;
    // 語順の基本
    if (!subj) {
      hints.push({ level: "info", b: "語順", msg: "英語は だれが → どうする → なにを の順。日本語（〜を〜する）と逆！まず主語から。" });
      return hints;
    }
    if (subj && verb && ctx.tense === "present" && ctx.modal === "none" && !ctx.negative) {
      if (subj.person === "3sg") {
        hints.push({ level: "info", b: "3単現の -s", msg: "主語が he/she/it などなので動詞に -s → " + verb.forms.thirdsg + "（" + verb.forms.base + " ではない）" });
      }
    }
    if (verb && ctx.negative) {
      var neg = ctx.tense === "past" ? "didn't + 原形" : (subj.person === "3sg" ? "doesn't + 原形" : "don't + 原形");
      if (verb.en !== "be" && ctx.modal === "none") {
        hints.push({ level: "info", b: "否定", msg: neg + "（動詞は原形に戻る）" });
      }
    }
    if (verb) {
      hints.push({ level: "info", b: "文型", msg: (ctx.pattern || verb.pattern) + "：" + (PATTERN_JP[ctx.pattern || verb.pattern] || "") });
    }
    // 冠詞リマインダー（数えられる単数名詞をコアに置いたとき）
    (ctx.coreNouns || []).forEach(function (n) {
      if (n.article === "a" || n.article === "an") {
        hints.push({ level: "info", b: "冠詞", msg: "『" + n.en + "』は数えられる名詞 → " + n.article + " " + n.en + "（複数なら " + (n.plural || n.en + "s") + "）" });
      } else if (n.article === "uncount") {
        hints.push({ level: "info", b: "冠詞", msg: "『" + n.en + "』は数えられない名詞 → a/an は付けない" });
      }
    });
    return hints;
  }

  // 逆クイズ用の正規化（大小・記号・空白を無視して比較）
  function normalize(s) {
    return (s || "").toLowerCase()
      .replace(/[.,!?;:'"’]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  window.Grammar = {
    verbSurface: verbSurface,
    nounPhrase: nounPhrase,
    slotsForPattern: slotsForPattern,
    grammarHints: grammarHints,
    normalize: normalize,
    SLOT_LABEL: SLOT_LABEL,
    PATTERN_JP: PATTERN_JP
  };
})();
