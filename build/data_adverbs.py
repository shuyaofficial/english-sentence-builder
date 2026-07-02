# -*- coding: utf-8 -*-
"""副詞データ（Phase 1 コア厳選）。
意味グループは参考情報(COCA)の分類（否定・焦点/程度・強調/頻度/時/場所・方向/
様態/談話標識・接続/確信・態度）に接地。頻度ランクは概算。
"""

ROWS = [
    # ── 否定・焦点 ──────────────────────────────────────────
    ["〜ではない（否定）", "否定・焦点", "否定", "not", "〜でない", "—", "not at all, not really, not yet", "I'm not sure.", "よくわからない。", "1", "日常", "最頻出副詞。be/助動詞の後"],
    ["〜だけ/ただ〜", "否定・焦点", "限定", "only", "〜だけ、ただ〜", "—", "only if, the only, not only", "It's only a joke.", "ただの冗談だよ。", "20", "日常", "not only A but also B"],
    ["〜さえ/〜すら", "否定・焦点", "意外", "even", "〜でさえ、いっそう", "—", "even if, even though, even more", "Even I can do it.", "私でさえできる。", "18", "日常", "even if=たとえ〜でも"],
    ["〜もまた", "否定・焦点", "追加", "also", "〜もまた", "—", "not only… but also", "I also want to come.", "私も行きたい。", "8", "日常", "文中に置く。tooは文末"],
    ["〜も（同様に）", "否定・焦点", "追加", "too", "〜も、〜すぎる", "—", "me too, too much, too many", "Me too!", "私も！", "6", "日常", "文末。程度(〜すぎる)にも"],
    ["ちょうど/ただ〜だけ", "否定・焦点", "限定・強調", "just", "ちょうど、ただ〜だけ、たった今", "—", "just now, just a little, just kidding", "I just got here.", "今着いたところ。", "10", "日常", "just now=たった今"],

    # ── 程度・強調 ──────────────────────────────────────────
    ["とても", "程度・強調", "強い程度", "very", "とても、非常に", "—", "very much, very well", "Thank you very much.", "どうもありがとう。", "3", "日常", "形容詞・副詞を強める"],
    ["とても/そんなに", "程度・強調", "強い程度", "so", "とても、そんなに", "—", "so much, so far, so that", "I'm so tired.", "すごく疲れた。", "5", "日常", "so that=〜するように"],
    ["本当に", "程度・強調", "強調", "really", "本当に、実に", "—", "really good, not really", "It's really good.", "本当においしい。", "12", "日常", "not really=そうでもない"],
    ["かなり/まあまあ", "程度・強調", "中程度", "quite", "かなり、まったく", "—", "quite a lot, quite good", "It's quite good.", "なかなかいいね。", "40", "日常", "英ではやや控えめ、米では強め"],
    ["ほとんど", "程度・強調", "接近", "almost", "ほとんど、もう少しで", "—", "almost always, almost done", "I'm almost done.", "もうすぐ終わる。", "35", "日常", "nearlyとほぼ同義"],
    ["かなり/けっこう", "程度・強調", "中程度", "pretty", "かなり、けっこう", "—", "pretty good, pretty much", "It's pretty easy.", "けっこう簡単だよ。", "45", "口語", "口語。pretty much=ほぼ"],
    ["まったく/完全に", "程度・強調", "完全", "completely", "完全に、まったく", "—", "completely different, completely wrong", "I completely agree.", "完全に同意する。", "100+", "日常", "totallyと近い"],
    ["ほとんど〜ない", "程度・強調", "否定的程度", "hardly", "ほとんど〜ない", "—", "hardly ever, hardly any", "I can hardly hear you.", "ほとんど聞こえない。", "100+", "日常", "準否定。hardとは別語"],

    # ── 頻度 ────────────────────────────────────────────────
    ["いつも", "頻度", "頻度（高）", "always", "いつも、常に", "—", "almost always, always do", "I always drink coffee.", "いつもコーヒーを飲む。", "30", "日常", "一般動詞の前"],
    ["たいてい/普通は", "頻度", "頻度（高）", "usually", "たいてい、普通は", "—", "usually do, as usual", "I usually walk to work.", "普段は歩いて通勤する。", "50", "日常", "as usual=いつも通り"],
    ["よく/しばしば", "頻度", "頻度（中）", "often", "よく、しばしば", "—", "how often, quite often", "How often do you exercise?", "どのくらい運動する？", "42", "日常", "how often=どのくらいの頻度"],
    ["ときどき", "頻度", "頻度（中）", "sometimes", "ときどき", "—", "sometimes I…", "Sometimes I forget.", "ときどき忘れる。", "48", "日常", ""],
    ["めったに〜ない", "頻度", "頻度（低）", "rarely", "めったに〜ない", "—", "rarely see, very rarely", "I rarely eat out.", "めったに外食しない。", "100+", "書き言葉", "準否定。seldomと近い"],
    ["決して〜ない", "頻度", "頻度（ゼロ）", "never", "決して〜ない", "—", "never mind, never again", "I never give up.", "決して諦めない。", "38", "日常", "Never mind=気にしないで"],
    ["再び/もう一度", "頻度", "反復", "again", "再び、もう一度", "—", "once again, again and again", "Say it again, please.", "もう一度言って。", "37", "日常", "once again=もう一度"],

    # ── 時 ──────────────────────────────────────────────────
    ["今", "時", "現在", "now", "今、では", "—", "right now, by now, for now", "I'm busy right now.", "今忙しい。", "15", "日常", "right now=たった今"],
    ["そのとき/それから", "時", "過去・順序", "then", "そのとき、それから", "—", "back then, and then", "See you then.", "じゃあそのときに。", "22", "日常", "and then=それから"],
    ["今日", "時", "現在", "today", "今日", "—", "today's, as of today", "What's the plan today?", "今日の予定は？", "60", "日常", ""],
    ["すぐに/まもなく", "時", "近未来", "soon", "すぐに、まもなく", "—", "as soon as, see you soon", "See you soon!", "またすぐに！", "58", "日常", "as soon as=〜するとすぐ"],
    ["すでに/もう", "時", "完了", "already", "すでに、もう", "—", "already done", "I've already eaten.", "もう食べたよ。", "55", "日常", "肯定文の完了に"],
    ["まだ/それでも", "時", "継続", "still", "まだ、それでも", "—", "still working, still there", "Are you still there?", "まだいる？", "44", "日常", "継続を表す"],
    ["まだ（〜ない）/もう", "時", "未完了", "yet", "まだ（〜ない）、もう〜したか", "—", "not yet, have you… yet", "Not yet.", "まだだよ。", "70", "日常", "否定・疑問で。文末"],
    ["ついに/最後に", "時", "結末", "finally", "ついに、ようやく", "—", "finally done", "We finally arrived.", "ようやく着いた。", "100+", "日常", ""],
    ["最近", "時", "近過去", "recently", "最近", "—", "until recently", "I saw her recently.", "最近彼女に会った。", "100+", "日常", "完了・過去形と"],
    ["〜前に", "時", "過去距離", "ago", "（今から）〜前に", "—", "a long time ago, days ago", "I met him two years ago.", "2年前に彼に会った。", "80", "日常", "過去形と。数量+ago"],
    ["あとで", "時", "未来", "later", "あとで、のちほど", "late→later", "see you later, sooner or later", "See you later!", "またあとで！", "65", "日常", "See you later=またね"],

    # ── 場所・方向 ──────────────────────────────────────────
    ["ここに/こちらへ", "場所・方向", "近接", "here", "ここに、ここで", "—", "come here, over here, here you are", "Come over here.", "こっちに来て。", "28", "日常", "Here you are=はいどうぞ"],
    ["そこに/あちらへ", "場所・方向", "遠方", "there", "そこに、あそこに", "—", "over there, there is/are", "It's over there.", "あそこにあるよ。", "25", "日常", "there is/are=〜がある"],
    ["戻って/後ろへ", "場所・方向", "後方", "back", "戻って、後ろへ", "—", "come back, go back, back and forth", "I'll be back soon.", "すぐ戻る。", "32", "日常", "come back=戻る"],
    ["離れて/去って", "場所・方向", "離反", "away", "離れて、あちらへ", "—", "go away, right away, far away", "Go away!", "あっち行って！", "68", "日常", "right away=すぐに"],
    ["家へ/家に", "場所・方向", "帰宅", "home", "家へ、家で", "—", "go home, at home, stay home", "I want to go home.", "家に帰りたい。", "34", "日常", "go home（toなし）"],
    ["外へ/外に", "場所・方向", "外方向", "out", "外へ、外に", "—", "go out, find out, out there", "Let's go out tonight.", "今夜出かけよう。", "17", "日常", "多くの句動詞を作る"],

    # ── 様態 ────────────────────────────────────────────────
    ["うまく/上手に", "様態", "巧拙", "well", "うまく、上手に、よく", "better/best", "as well, do well, get well", "You did well.", "よくやったね。", "26", "日常", "as well=〜も。get well=回復して"],
    ["一生懸命に", "様態", "努力", "hard", "熱心に、激しく", "harder/hardest", "work hard, try hard, rain hard", "She works hard.", "彼女は一生懸命働く。", "52", "日常", "hardly(ほとんど〜ない)と別"],
    ["注意深く/慎重に", "様態", "注意", "carefully", "注意深く", "—", "listen carefully, drive carefully", "Drive carefully.", "気をつけて運転して。", "100+", "日常", "careful+ly"],
    ["すばやく/急いで", "様態", "速度", "quickly", "すばやく、急いで", "more quickly", "quickly done, move quickly", "Please reply quickly.", "早めに返信して。", "62", "日常", ""],
    ["ゆっくりと", "様態", "速度", "slowly", "ゆっくりと", "more slowly", "speak slowly, slowly but surely", "Could you speak slowly?", "ゆっくり話してくれる？", "100+", "日常", ""],
    ["一緒に", "様態", "共同", "together", "一緒に", "—", "work together, get together, together with", "Let's work together.", "一緒にやろう。", "43", "日常", "get together=集まる"],

    # ── 談話標識・接続 ──────────────────────────────────────
    ["しかしながら", "談話標識・接続", "逆接", "however", "しかしながら", "—", "however, …", "However, it's risky.", "しかし、それは危険だ。", "5", "書き言葉", "文頭でカンマ。butより堅い"],
    ["それゆえ/したがって", "談話標識・接続", "帰結", "therefore", "したがって、それゆえ", "—", "therefore, …", "Therefore, we agreed.", "したがって合意した。", "100+", "書き言葉", "論理的帰結。堅い"],
    ["実は/実際は", "談話標識・接続", "修正・補足", "actually", "実は、実際は", "—", "actually, well actually", "Actually, I'm not sure.", "実は、よくわからない。", "31", "日常", "訂正・意外な事実の導入"],
    ["もちろん", "談話標識・接続", "同意強調", "of course", "もちろん", "—", "of course not, but of course", "Of course!", "もちろん！", "36", "日常", "強い同意・当然"],
    ["でも/〜だけどね", "談話標識・接続", "逆接（口語）", "though", "でも、〜だけど", "—", "even though, as though", "It's cold. I like it, though.", "寒いね。でも好きだけど。", "39", "口語", "文末though=でもね"],
    ["とにかく/それはさておき", "談話標識・接続", "話題転換", "anyway", "とにかく、いずれにせよ", "—", "anyway, anyhow", "Anyway, let's move on.", "とにかく、次に進もう。", "70", "口語", "話題を切り替える"],
    ["その代わりに", "談話標識・接続", "代替", "instead", "その代わりに", "—", "instead of, do it instead", "Let's meet online instead.", "代わりにオンラインで会おう。", "72", "日常", "instead of=〜の代わりに"],

    # ── 確信・態度 ──────────────────────────────────────────
    ["たぶん/〜かも", "確信・態度", "確信（中）", "maybe", "たぶん、〜かもしれない", "—", "maybe not, maybe later", "Maybe next time.", "また今度かな。", "33", "日常", "文頭が多い。口語的"],
    ["おそらく", "確信・態度", "確信（高め）", "probably", "おそらく、たぶん", "—", "probably not, most probably", "He's probably right.", "彼はたぶん正しい。", "41", "日常", "maybeより確度が高い"],
    ["きっと/確かに", "確信・態度", "確信（高）", "certainly", "確かに、きっと", "—", "almost certainly, certainly not", "I'll certainly help.", "必ずお手伝いします。", "100+", "ビジネス", "丁寧な承諾にも"],
    ["絶対に/間違いなく", "確信・態度", "確信（最高）", "definitely", "間違いなく、絶対に", "—", "definitely not, most definitely", "Definitely!", "間違いなく！", "100+", "口語", "強い同意・断定"],
    ["明らかに", "確信・態度", "自明", "obviously", "明らかに", "—", "obviously not", "Obviously, it works.", "明らかにうまくいく。", "100+", "日常", "clearlyと近い"],
]
