# -*- coding: utf-8 -*-
"""形容詞データ（Phase 1 コア厳選）。
意味グループは Dixon の意味型（DIMENSION/AGE/VALUE/COLOUR/PHYSICAL PROPERTY/
HUMAN PROPENSITY/SPEED/DIFFICULTY/SIMILARITY/QUANTIFICATION/POSITION）に接地。
「活用・派生」には比較級・最上級や関連名詞を記す。頻度ランクは概算。
"""

ROWS = [
    # ── 寸法・大きさ（DIMENSION）──────────────────────────
    ["大きい", "寸法・大きさ", "サイズ大", "big", "大きい、重要な", "bigger/biggest", "a big deal, big problem", "That's a big problem.", "それは大きな問題だ。", "20", "日常", "口語的。largeより主観的"],
    ["小さい", "寸法・大きさ", "サイズ小", "small", "小さい", "smaller/smallest", "a small problem, small talk", "It's a small world.", "世界は狭い。", "10", "日常", "small talk=世間話"],
    ["大きい（規模）", "寸法・大きさ", "規模大", "large", "大きい、広い", "larger/largest", "a large number, large amount", "A large number attended.", "大勢が参加した。", "12", "ビジネス", "客観的・数量に。bigより堅い"],
    ["長い", "寸法・大きさ", "長さ", "long", "長い", "longer/longest", "a long time, all day long", "It was a long day.", "長い一日だった。", "9", "日常", "as long as=〜する限り"],
    ["短い", "寸法・大きさ", "長さ", "short", "短い、背が低い", "shorter/shortest", "a short time, short of", "Keep it short.", "手短にね。", "50", "日常", "short of=〜が不足して"],
    ["（背が）高い", "寸法・大きさ", "高さ（人）", "tall", "背が高い", "taller/tallest", "a tall man, how tall", "He's really tall.", "彼はとても背が高い。", "90", "日常", "人・木にtall、山にhigh"],
    ["（位置が）高い", "寸法・大きさ", "高さ（位置）", "high", "高い、高度な", "higher/highest", "high quality, high price", "The price is too high.", "値段が高すぎる。", "6", "日常", "値段・程度が高い"],
    ["低い", "寸法・大きさ", "高さ（位置）", "low", "低い", "lower/lowest", "low price, low level", "Keep your voice low.", "声を低くして。", "24", "日常", ""],
    ["広い", "寸法・大きさ", "幅", "wide", "幅が広い", "wider/widest", "a wide range, worldwide", "It covers a wide range.", "幅広い範囲をカバーする。", "100+", "ビジネス", "a wide range of=幅広い"],

    # ── 年齢・新旧（AGE）───────────────────────────────────
    ["新しい", "年齢・新旧", "新規", "new", "新しい", "newer/newest", "a new job, brand new", "I got a new phone.", "新しいスマホを買った。", "3", "日常", ""],
    ["古い/年をとった", "年齢・新旧", "旧・高齢", "old", "古い、年をとった", "older/oldest", "how old, an old friend", "How old are you?", "何歳ですか？", "4", "日常", "how old=何歳"],
    ["若い", "年齢・新旧", "若年", "young", "若い", "younger/youngest", "young people, a young man", "She's still young.", "彼女はまだ若い。", "11", "日常", ""],
    ["最近の", "年齢・新旧", "近時", "recent", "最近の", "more recent/most recent", "in recent years, recently", "in recent years", "近年", "100+", "書き言葉", "副詞recently=最近"],
    ["現代の", "年齢・新旧", "現代", "modern", "現代の、最新の", "more modern/most modern", "modern life, modern art", "It's a modern design.", "現代的なデザインだ。", "100+", "書き言葉", ""],

    # ── 評価・良し悪し（VALUE）─────────────────────────────
    ["良い", "評価・良し悪し", "肯定評価", "good", "良い", "better/best", "a good idea, good at", "That's a good idea.", "それはいい考えだ。", "2", "日常", "比較級better/best（不規則）"],
    ["悪い", "評価・良し悪し", "否定評価", "bad", "悪い", "worse/worst", "not bad, too bad", "That's too bad.", "それは残念だね。", "16", "日常", "too bad=残念。not bad=悪くない"],
    ["すばらしい", "評価・良し悪し", "強い肯定", "great", "すばらしい、偉大な", "greater/greatest", "a great idea, sounds great", "That sounds great!", "それいいね！", "5", "日常", "sounds great=いいね"],
    ["すてきな/親切な", "評価・良し悪し", "好ましい", "nice", "すてきな、親切な", "nicer/nicest", "nice to meet you, a nice guy", "Nice to meet you.", "はじめまして。", "40", "日常", "人柄にも(HUMAN PROPENSITY寄り)"],
    ["重要な/大事な", "評価・良し悪し", "重要性", "important", "重要な", "more important/most important", "it's important to, an important point", "It's important to rest.", "休むことが大事だ。", "13", "ビジネス", "It's important to do"],
    ["正しい/大丈夫", "評価・良し悪し", "正当", "right", "正しい、適切な", "—", "that's right, all right", "You're right.", "君の言う通りだ。", "14", "日常", "That's right=その通り"],
    ["間違った", "評価・良し悪し", "誤り", "wrong", "間違った、都合の悪い", "—", "what's wrong, wrong number", "What's wrong?", "どうしたの？", "50", "日常", "What's wrong?=どうした？"],
    ["最高の", "評価・良し悪し", "最上級評価", "best", "最も良い", "good→best", "the best way, do one's best", "It's the best option.", "最善の選択だ。", "22", "日常", "goodの最上級"],
    ["より良い", "評価・良し悪し", "比較評価", "better", "より良い", "good→better", "get better, better than, had better", "You'd better rest.", "休んだ方がいい。", "18", "日常", "had better=〜した方がいい"],
    ["元気な/けっこうな", "評価・良し悪し", "良好", "fine", "元気な、けっこうな、細かい", "finer/finest", "I'm fine, that's fine", "I'm fine, thanks.", "元気だよ、ありがとう。", "60", "日常", "I'm fine=大丈夫"],
    ["本当の/実際の", "評価・良し悪し", "真正", "real", "本当の、実際の", "—", "in real life, a real problem", "Is this for real?", "これマジ？", "27", "日常", "for real=本当に"],
    ["本当の/真実の", "評価・良し悪し", "真実", "true", "本当の、真の", "truer/truest", "come true, is it true", "That's not true.", "それは違う。", "45", "日常", "come true=実現する"],
    ["主な", "評価・良し悪し", "主要", "main", "主な、主要な", "—", "the main reason, main point", "That's the main reason.", "それが主な理由だ。", "36", "ビジネス", "the main=一番の"],

    # ── 色（COLOUR）───────────────────────────────────────
    ["黒い", "色", "色", "black", "黒い", "—", "black coffee, in black", "I like black coffee.", "ブラックコーヒーが好き。", "30", "日常", ""],
    ["白い", "色", "色", "white", "白い", "—", "white wine, black and white", "She wore a white dress.", "彼女は白い服を着ていた。", "35", "日常", ""],
    ["赤い", "色", "色", "red", "赤い", "—", "red wine, in the red", "The light turned red.", "信号が赤になった。", "70", "日常", "in the red=赤字で"],
    ["青い", "色", "色", "blue", "青い、憂うつな", "—", "feel blue, out of the blue", "I feel a bit blue today.", "今日は少し憂うつだ。", "75", "日常", "feel blue=気が沈む"],
    ["緑の", "色", "色", "green", "緑の、環境に優しい", "greener/greenest", "green tea, go green", "Let's go green.", "エコにしよう。", "80", "日常", "green=環境配慮の意味も"],

    # ── 物理的性質（PHYSICAL PROPERTY）────────────────────
    ["熱い/暑い", "物理的性質", "温度高", "hot", "熱い、暑い、辛い", "hotter/hottest", "hot coffee, it's hot", "It's really hot today.", "今日は本当に暑い。", "65", "日常", "辛いの意味も"],
    ["冷たい/寒い", "物理的性質", "温度低", "cold", "冷たい、寒い", "colder/coldest", "a cold drink, catch a cold", "It's getting cold.", "寒くなってきた。", "55", "日常", "catch a cold=風邪をひく"],
    ["温かい/暖かい", "物理的性質", "温度中", "warm", "温かい、暖かい", "warmer/warmest", "a warm welcome, keep warm", "Keep warm out there.", "外では暖かくしてね。", "85", "日常", "a warm welcome=温かい歓迎"],
    ["固い/難しい", "物理的性質", "硬度", "hard", "固い、難しい、熱心な", "harder/hardest", "work hard, a hard question", "This question is hard.", "この問題は難しい。", "38", "日常", "副詞hard=一生懸命に"],
    ["柔らかい", "物理的性質", "硬度", "soft", "柔らかい、優しい", "softer/softest", "soft voice, a soft drink", "The bed is very soft.", "そのベッドはとても柔らかい。", "100+", "日常", "soft drink=清涼飲料"],
    ["重い", "物理的性質", "重量", "heavy", "重い、激しい", "heavier/heaviest", "heavy rain, a heavy bag", "It's raining heavily.", "雨が激しく降っている。", "100+", "日常", "heavy rain=大雨"],
    ["軽い/明るい", "物理的性質", "重量・光", "light", "軽い、明るい、薄い", "lighter/lightest", "a light meal, light blue", "Let's have a light meal.", "軽く食べよう。", "100+", "日常", "名詞light=光/灯り"],
    ["きれいな/清潔な", "物理的性質", "清潔", "clean", "清潔な", "cleaner/cleanest", "clean water, keep clean", "Keep your room clean.", "部屋をきれいにして。", "100+", "日常", ""],
    ["強い", "物理的性質", "強度", "strong", "強い、濃い", "stronger/strongest", "a strong point, strong coffee", "He has a strong will.", "彼は意志が強い。", "42", "日常", "strong point=長所"],
    ["暗い", "物理的性質", "光量", "dark", "暗い、濃い", "darker/darkest", "get dark, dark blue", "It's getting dark.", "暗くなってきた。", "70", "日常", ""],
    ["いっぱいの", "物理的性質", "充満", "full", "満ちた、いっぱいの", "fuller/fullest", "full of, I'm full", "I'm full, thanks.", "お腹いっぱい、ありがとう。", "48", "日常", "full of=〜でいっぱい"],

    # ── 人の性向・感情（HUMAN PROPENSITY）─────────────────
    ["うれしい/幸せな", "人の性向・感情", "喜び", "happy", "うれしい、幸せな", "happier/happiest", "happy about, be happy to", "I'm happy to help.", "喜んでお手伝いします。", "44", "日常", "be happy to=喜んで〜する"],
    ["悲しい", "人の性向・感情", "悲しみ", "sad", "悲しい", "sadder/saddest", "feel sad, a sad story", "I felt really sad.", "とても悲しかった。", "100+", "日常", ""],
    ["怒った", "人の性向・感情", "怒り", "angry", "怒った", "angrier/angriest", "get angry, angry at/with", "Don't be angry at me.", "怒らないで。", "100+", "日常", "angry with 人 / at 事"],
    ["親切な/優しい", "人の性向・感情", "性格（善）", "kind", "親切な、優しい", "kinder/kindest", "kind to, that's kind of you", "That's kind of you.", "ご親切にどうも。", "100+", "日常", "kind to=〜に親切"],
    ["怖がって/心配して", "人の性向・感情", "恐れ", "afraid", "怖がって、心配して", "—", "afraid of, I'm afraid (that)", "I'm afraid I can't.", "残念ですができません。", "72", "日常", "I'm afraid=残念ながら（丁寧な否定）"],
    ["残念で/すまなく思って", "人の性向・感情", "遺憾", "sorry", "すまなく思って、残念で", "sorrier/sorriest", "sorry for/about, I'm sorry", "I'm sorry for the delay.", "遅れてすみません。", "68", "日常", "謝罪・同情に"],
    ["確信して", "人の性向・感情", "確信", "sure", "確信して", "surer/surest", "be sure, make sure, I'm sure", "Are you sure?", "本当に？", "23", "日常", "make sure=確実にする"],
    ["準備ができて", "人の性向・感情", "準備", "ready", "準備ができて", "—", "be ready to, get ready", "Are you ready to go?", "行く準備できた？", "70", "日常", "get ready=準備する"],
    ["疲れた", "人の性向・感情", "疲労", "tired", "疲れた、飽きた", "more tired/most tired", "tired of, get tired", "I'm tired of waiting.", "待つのにうんざりだ。", "100+", "日常", "tired of=〜に飽きて"],
    ["忙しい", "人の性向・感情", "多忙", "busy", "忙しい", "busier/busiest", "busy with, a busy day", "I'm busy right now.", "今忙しいんだ。", "100+", "日常", "busy with=〜で忙しい"],
    ["自由な/暇な/無料の", "人の性向・感情", "自由", "free", "自由な、暇な、無料の", "freer/freest", "free time, for free, feel free", "Feel free to ask.", "遠慮なく聞いてね。", "34", "日常", "feel free to=遠慮なく〜する"],

    # ── 速さ（SPEED）──────────────────────────────────────
    ["速い", "速さ", "高速", "fast", "速い", "faster/fastest", "a fast car, fast food", "He's a fast runner.", "彼は走るのが速い。", "58", "日常", "副詞も同形fast"],
    ["すばやい", "速さ", "迅速", "quick", "すばやい、手早い", "quicker/quickest", "a quick question, be quick", "Can I ask a quick question?", "ちょっと質問いい？", "62", "日常", "quick question=手短な質問"],
    ["遅い", "速さ", "低速", "slow", "遅い、ゆっくりの", "slower/slowest", "slow down, a slow start", "Please slow down.", "ゆっくりお願い。", "78", "日常", "slow down=速度を落とす"],

    # ── 難易（DIFFICULTY）─────────────────────────────────
    ["簡単な/楽な", "難易", "容易", "easy", "簡単な、楽な", "easier/easiest", "easy to, take it easy", "It's easy to use.", "使いやすい。", "39", "日常", "Take it easy=気楽に/またね"],
    ["難しい", "難易", "困難", "difficult", "難しい、困難な", "more difficult/most difficult", "difficult to, a difficult time", "It's difficult to say.", "何とも言えない。", "52", "日常", "hardより堅い"],
    ["単純な/簡単な", "難易", "単純", "simple", "単純な、簡単な", "simpler/simplest", "a simple question, keep it simple", "Keep it simple.", "簡潔にね。", "63", "日常", "complexの反対"],

    # ── 類似・関係（SIMILARITY）───────────────────────────
    ["同じ", "類似・関係", "同一", "same", "同じ", "—", "the same as, at the same time", "We have the same idea.", "同じ考えだね。", "17", "日常", "the same as=〜と同じ"],
    ["違う/別の", "類似・関係", "相違", "different", "違う、異なる", "—", "different from, a different one", "It's different from mine.", "私のとは違う。", "15", "日常", "different from=〜と違う"],
    ["似ている", "類似・関係", "類似", "similar", "似ている", "—", "similar to, a similar case", "It's similar to yours.", "君のと似てる。", "100+", "ビジネス", "similar to=〜に似て"],

    # ── 数量（QUANTIFICATION）─────────────────────────────
    ["たくさんの（可算）", "数量", "多（可算）", "many", "多くの（可算）", "more/most", "many people, how many", "How many do you need?", "いくつ必要？", "26", "日常", "可算名詞に。muchと対比"],
    ["たくさんの（不可算）", "数量", "多（不可算）", "much", "多くの（不可算）", "more/most", "how much, too much, so much", "How much is it?", "いくらですか？", "28", "日常", "不可算名詞・疑問/否定に"],
    ["ほとんどない/少しの", "数量", "少（可算）", "few", "ほとんどない、（a few で）少しの", "fewer/fewest", "a few, few people, quite a few", "I have a few questions.", "いくつか質問がある。", "33", "日常", "a few=少しある/few=ほとんどない"],
    ["全体の", "数量", "全部", "whole", "全体の、丸ごとの", "—", "the whole day, on the whole", "I waited the whole time.", "ずっと待っていた。", "56", "日常", "on the whole=概して"],
    ["十分な", "数量", "充足", "enough", "十分な", "—", "enough time, good enough", "That's enough.", "もう十分だ。", "46", "日常", "形容詞の後ろに置く(good enough)"],

    # ── 位置・順序（POSITION/ORDER）───────────────────────
    ["最初の", "位置・順序", "順序（始）", "first", "最初の、第一の", "—", "at first, first of all, the first time", "First of all, thanks.", "まず、ありがとう。", "19", "日常", "first of all=まず第一に"],
    ["最後の/この前の", "位置・順序", "順序（終）", "last", "最後の、この前の", "—", "last week, at last, the last one", "It's the last one.", "これが最後の一つだ。", "21", "日常", "last=直前の（last night）"],
    ["次の", "位置・順序", "順序（次）", "next", "次の、隣の", "—", "next time, next to, the next day", "See you next time.", "また今度。", "25", "日常", "next to=〜の隣に"],
    ["最終の", "位置・順序", "順序（最終）", "final", "最終の、決定的な", "—", "the final answer, final decision", "That's my final answer.", "それが最終回答だ。", "100+", "ビジネス", "lastより「決定的」の含み"],
]
