# -*- coding: utf-8 -*-
"""data/*.csv から Web アプリ用データ web/sentence_builder_data.js を生成する。

出力は `window.WORD_DATA = {...}` を代入する JS ファイル。
理由: file:// で開くと fetch() のJSON読込がCORSで不可なため、<script src> で
読み込めるグローバル代入にする（オフラインでそのまま動く）。

文型(pattern)・活用(3単現ほか)・冠詞・主語の人称を、既存CSVから導出する。

実行:  python3 build/build_web.py
"""
import csv
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
DATA_DIR = os.path.join(ROOT, "data")
OUT_PATH = os.path.join(ROOT, "web", "sentence_builder_data.js")

# ── 文型(5文型)オーバーライド：既定は SVO。見出し語で上書き ────────────
PATTERN_PRIMARY = {
    # SVC（＋補語＝形容詞/名詞）
    "be": "SVC", "become": "SVC", "seem": "SVC", "appear": "SVC",
    "sound": "SVC", "look": "SVC", "feel": "SVC", "get": "SVC", "remain": "SVC",
    # SV（自動詞：目的語なし。次は任意で副詞・場所・時）
    "go": "SV", "come": "SV", "move": "SV", "run": "SV", "walk": "SV",
    "arrive": "SV", "return": "SV", "rise": "SV", "fall": "SV", "happen": "SV",
    "live": "SV", "die": "SV", "stay": "SV", "work": "SV", "begin": "SV",
    "start": "SV", "end": "SV", "grow": "SV", "increase": "SV", "improve": "SV",
    "break": "SV", "talk": "SV", "listen": "SV", "worry": "SV", "care": "SV",
    # SVOO（＋人＋物）
    "give": "SVOO", "tell": "SVOO", "send": "SVOO", "buy": "SVOO",
    "teach": "SVOO", "ask": "SVOO", "offer": "SVOO",
}
# 別用法（UIで次スロットを切り替えられる分岐候補）
PATTERN_ALLOWED = {
    "make": ["SVOC"], "find": ["SVOC"], "keep": ["SVOC"], "call": ["SVOC"],
    "get": ["SVO", "SVOO"], "be": ["SV"], "feel": ["SVO"], "look": ["SV"],
    "turn": ["SVC", "SVO"], "break": ["SVO"], "run": ["SVO"], "move": ["SVO"],
    "grow": ["SVC"], "change": ["SV"], "start": ["SVO"], "begin": ["SVO"],
    "end": ["SVO"], "improve": ["SVO"], "increase": ["SVO"], "stay": ["SVC"],
    "remain": ["SV"], "speak": ["SVO"], "play": ["SV"], "study": ["SV"],
}

IRREGULAR_3SG = {"be": "is", "have": "has", "do": "does", "go": "goes"}

# 不可算・複数のみ（冠詞リマインダー用の小辞書）
UNCOUNTABLE = {"information", "money", "work", "health", "advice", "news", "water"}
PLURAL_ONLY = {"people"}


def third_person_singular(base: str) -> str:
    """動詞の原形から3人称単数現在形を規則生成する。"""
    if base in IRREGULAR_3SG:
        return IRREGULAR_3SG[base]
    if re.search(r"(s|ss|sh|ch|x|z|o)$", base):
        return base + "es"
    if re.search(r"[^aeiou]y$", base):
        return base[:-1] + "ies"
    return base + "s"


def parse_forms(base: str, infl: str) -> dict:
    """活用・派生列 'past/pp/ing' を分解。be は特別扱い。欠損は規則で補完。"""
    if base == "be":
        return {"base": "be", "thirdsg": "is", "past": "was/were",
                "pp": "been", "ing": "being"}
    parts = [p.strip() for p in infl.split("/") if p.strip()]
    past = parts[0] if len(parts) >= 1 else base + "ed"
    pp = parts[1] if len(parts) >= 2 else past
    ing = parts[2] if len(parts) >= 3 else (
        base[:-1] + "ing" if base.endswith("e") and not base.endswith("ee") else base + "ing")
    return {"base": base, "thirdsg": third_person_singular(base),
            "past": past, "pp": pp, "ing": ing}


def article_for(lemma: str, plural: str) -> str:
    """冠詞リマインダー: a | an | the | uncount | plural を推定。"""
    low = lemma.lower()
    if low in PLURAL_ONLY:
        return "plural"
    if low in UNCOUNTABLE:
        return "uncount"
    return "an" if re.match(r"^[aeiou]", low) else "a"


def read_csv(name: str):
    with open(os.path.join(DATA_DIR, f"{name}.csv"), encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    return rows[0], rows[1:]


def ordered_groups(rows, idx: int):
    """出現順を保ったユニークなグループ名の並び。"""
    seen, out = set(), []
    for r in rows:
        g = r[idx]
        if g not in seen:
            seen.add(g)
            out.append(g)
    return out


# ── 主語（代名詞・指示詞）＋ 人称。3単現チェックの要 ─────────────────
PRONOUN_SUBJECTS = [
    {"en": "I", "jp": "私は", "person": "1sg"},
    {"en": "You", "jp": "あなたは", "person": "2"},
    {"en": "He", "jp": "彼は", "person": "3sg"},
    {"en": "She", "jp": "彼女は", "person": "3sg"},
    {"en": "It", "jp": "それは", "person": "3sg"},
    {"en": "We", "jp": "私たちは", "person": "1pl"},
    {"en": "They", "jp": "彼らは", "person": "3pl"},
    {"en": "This", "jp": "これは", "person": "3sg"},
    {"en": "That", "jp": "あれは", "person": "3sg"},
    {"en": "These", "jp": "これらは", "person": "3pl"},
    {"en": "Those", "jp": "あれらは", "person": "3pl"},
]


def build():
    # 動詞
    _, vrows = read_csv("動詞")
    verbs = []
    for r in vrows:
        say_jp, group, sub, en, gloss, infl, colloc, ex_en, ex_jp, freq, reg, note = r
        pattern = PATTERN_PRIMARY.get(en, "SVO")
        verbs.append({
            "en": en, "jp": say_jp, "group": group, "sub": sub, "gloss": gloss,
            "forms": parse_forms(en, infl), "pattern": pattern,
            "patternsAllowed": [pattern] + PATTERN_ALLOWED.get(en, []),
            "colloc": colloc, "ex_en": ex_en, "ex_jp": ex_jp,
            "freq": freq, "reg": reg, "note": note,
        })

    # 名詞
    _, nrows = read_csv("名詞")
    nouns = []
    subject_nouns = []
    for r in nrows:
        say_jp, group, sub, en, gloss, plural, colloc, ex_en, ex_jp, freq, reg, note = r
        plural = re.sub(r"[（(].*", "", plural).strip()  # "times(複)" → "times"
        art = article_for(en, plural)
        item = {"en": en, "jp": say_jp, "group": group, "sub": sub, "gloss": gloss,
                "plural": plural, "article": art, "colloc": colloc,
                "ex_en": ex_en, "ex_jp": ex_jp, "freq": freq, "reg": reg, "note": note}
        nouns.append(item)
        if group == "人・関係":  # 主語候補にも回す
            subject_nouns.append({
                "en": en, "jp": gloss, "article": art,
                "person": "3pl" if art == "plural" else "3sg"})

    # 形容詞
    _, arows = read_csv("形容詞")
    adjectives = []
    for r in arows:
        say_jp, group, sub, en, gloss, infl, colloc, ex_en, ex_jp, freq, reg, note = r
        comp_sup = [p.strip() for p in infl.split("/")]
        adjectives.append({
            "en": en, "jp": say_jp, "group": group, "sub": sub, "gloss": gloss,
            "comp": comp_sup[0] if comp_sup else "", "sup": comp_sup[1] if len(comp_sup) > 1 else "",
            "colloc": colloc, "ex_en": ex_en, "ex_jp": ex_jp, "note": note})

    # 副詞
    _, advrows = read_csv("副詞")
    adverbs = []
    for r in advrows:
        say_jp, group, sub, en, gloss, infl, colloc, ex_en, ex_jp, freq, reg, note = r
        adverbs.append({
            "en": en, "jp": say_jp, "group": group, "sub": sub, "gloss": gloss,
            "colloc": colloc, "ex_en": ex_en, "ex_jp": ex_jp, "note": note})

    # 機能別フレーズ
    _, frows = read_csv("機能別フレーズ")
    functions = []
    for r in frows:
        func, pol, trig, expr, mean_jp, ex_en, ex_jp, note = r
        functions.append({
            "func": func, "politeness": pol, "trigger_jp": trig,
            "template": expr, "meaning_jp": mean_jp,
            "ex_en": ex_en, "ex_jp": ex_jp, "note": note})

    # 必須フレーズ（チャンク学習：丸暗記30＋〇〇入れ替え）
    _, prows = read_csv("必須フレーズ")
    phrases = []
    for r in prows:
        num, cat, trig, en, blank, cands, note = r
        choices = [c.strip() for c in cands.split("、") if c.strip()] if cands else []
        phrases.append({
            "id": int(num), "cat": cat, "jp": trig, "en": en,
            "blank": blank, "choices": choices, "note": note})

    data = {
        "subjects": PRONOUN_SUBJECTS,
        "subjectNouns": subject_nouns,
        "verbs": verbs,
        "nouns": nouns,
        "adjectives": adjectives,
        "adverbs": adverbs,
        "functions": functions,
        "phrases": phrases,
        "groups": {
            "verbs": ordered_groups(vrows, 1),
            "nouns": ordered_groups(nrows, 1),
            "adjectives": ordered_groups(arows, 1),
            "adverbs": ordered_groups(advrows, 1),
            "functions": ordered_groups(frows, 0),
            "phrases": ordered_groups(prows, 1),
        },
    }

    # ── 検証アサート ────────────────────────────────────────────
    assert len(verbs) == 121, f"verbs={len(verbs)}"
    for v in verbs:
        assert v["pattern"] in ("SV", "SVC", "SVO", "SVOO", "SVOC"), v
        assert v["forms"]["thirdsg"], v
        assert v["forms"]["ing"], v
    assert len(phrases) == 30, f"phrases={len(phrases)}"
    assert len({p["id"] for p in phrases}) == 30, "必須フレーズ: 番号が重複"
    for p in phrases:
        assert p["blank"] in ("none", "language", "chunk", "noun", "thing", "place"), p
        has_blank = p["blank"] != "none"
        assert ("〇〇" in p["en"]) == has_blank, f"空所型と〇〇が不整合: {p}"
        assert (len(p["choices"]) > 0) == has_blank, f"空所型と候補が不整合: {p}"

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, indent=1)
    header = ("// 自動生成: build/build_web.py が data/*.csv から生成。直接編集しないこと。\n"
              "// 語彙を増やすには data/*.csv を編集して再実行する。\n")
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("window.WORD_DATA = ")
        f.write(payload)
        f.write(";\n")

    print(f"✓ 生成: {OUT_PATH}")
    print(f"    subjects={len(data['subjects'])}(+人名詞{len(subject_nouns)}) "
          f"verbs={len(verbs)} nouns={len(nouns)} adj={len(adjectives)} "
          f"adv={len(adverbs)} functions={len(functions)} phrases={len(phrases)}")
    # 文型分布
    from collections import Counter
    dist = Counter(v["pattern"] for v in verbs)
    print("    文型分布:", dict(dist))


if __name__ == "__main__":
    build()
