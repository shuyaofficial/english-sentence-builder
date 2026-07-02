# -*- coding: utf-8 -*-
"""名詞データ（Phase 1 コア厳選）。
列は動詞と共通。「活用・派生」には不規則複数や関連語を記す。
頻度ランクは COCA 名詞頻度に基づく概算。
"""

ROWS = [
    # ── 時間 ────────────────────────────────────────────────
    ["時間/〜回/時代", "時間", "時間全般", "time", "時間、回、時代", "times(複)", "on time, in time, have time, spend time", "Do you have time?", "時間ある？", "1", "日常", "最頻出名詞。可算(回)/不可算(時間)"],
    ["年/歳", "時間", "年", "year", "年、〜歳", "years(複)", "this year, last year, for years", "See you next year.", "また来年。", "2", "日常", "years old=〜歳"],
    ["日/一日", "時間", "日", "day", "日、一日", "days(複)", "these days, one day, all day", "Have a nice day.", "よい一日を。", "5", "日常", "these days=最近"],
    ["週", "時間", "週", "week", "週", "weeks(複)", "this week, on weekends, a week", "See you next week.", "また来週。", "23", "日常", ""],
    ["夜", "時間", "夜", "night", "夜", "nights(複)", "at night, last night, tonight", "Good night!", "おやすみ！", "31", "日常", "at night=夜に"],
    ["月/ひと月", "時間", "月", "month", "月", "months(複)", "this month, every month", "I'll be back in a month.", "1か月後に戻る。", "41", "日常", ""],
    ["時間（単位）", "時間", "時間単位", "hour", "時間（60分）", "hours(複)", "an hour, for hours, rush hour", "It's an hour away.", "1時間の距離だ。", "59", "日常", "冠詞はan（発音が母音）"],
    ["分", "時間", "分", "minute", "分、ちょっと", "minutes(複)", "a minute, in a minute, wait a minute", "Wait a minute.", "ちょっと待って。", "71", "日常", "a minute=少しの間"],
    ["瞬間/今", "時間", "瞬間", "moment", "瞬間、今", "moments(複)", "at the moment, for a moment", "One moment, please.", "少々お待ちを。", "96", "日常", "at the moment=今のところ"],
    ["朝", "時間", "朝", "morning", "朝、午前", "mornings(複)", "in the morning, this morning", "Good morning!", "おはよう！", "91", "日常", "in the morning"],

    # ── 人・関係 ────────────────────────────────────────────
    ["人々", "人・関係", "人々", "people", "人々", "person→people", "many people, young people", "A lot of people came.", "大勢来た。", "3", "日常", "personの複数扱い"],
    ["男性/人", "人・関係", "男性", "man", "男の人、人間", "men(複)", "a young man, old man", "He's a nice man.", "彼はいい人だ。", "6", "日常", "複数men"],
    ["女性", "人・関係", "女性", "woman", "女の人", "women(複)", "a young woman", "She's a strong woman.", "彼女は強い女性だ。", "8", "日常", "複数women[wɪmɪn]"],
    ["子ども", "人・関係", "子ども", "child", "子ども", "children(複)", "a small child, have children", "They have two children.", "彼らには子が2人いる。", "10", "日常", "複数children"],
    ["家族", "人・関係", "家族", "family", "家族", "families(複)", "my family, family member", "How's your family?", "ご家族は元気？", "14", "日常", "集合名詞"],
    ["友だち", "人・関係", "友人", "friend", "友だち", "friends(複)", "a close friend, best friend, make friends", "He's a good friend.", "彼はいい友だちだ。", "56", "日常", "make friends=友達になる"],
    ["母/お母さん", "人・関係", "母", "mother", "母", "mothers(複)", "my mother, mother tongue", "My mother is a nurse.", "母は看護師だ。", "36", "日常", "口語はmom"],
    ["父/お父さん", "人・関係", "父", "father", "父", "fathers(複)", "my father", "My father works abroad.", "父は海外で働く。", "57", "日常", "口語はdad"],
    ["親", "人・関係", "親", "parent", "親", "parents(複)", "my parents, single parent", "My parents live nearby.", "両親は近くに住む。", "77", "日常", "通常parents（両親）"],
    ["子ども（口語）", "人・関係", "子ども", "kid", "子ども", "kids(複)", "little kid, my kids", "The kids are asleep.", "子どもたちは寝てる。", "73", "口語", "childのくだけた語"],
    ["男（口語）/やつ", "人・関係", "男性", "guy", "男の人、やつ", "guys(複)", "a nice guy, you guys", "He's a cool guy.", "彼はいいやつだ。", "95", "口語", "you guys=みんな"],
    ["先生", "人・関係", "教師", "teacher", "先生、教師", "teachers(複)", "English teacher, a good teacher", "She's my English teacher.", "彼女は英語の先生だ。", "98", "日常", ""],
    ["人（一人）", "人・関係", "個人", "person", "人、人物", "people(複)", "a nice person, in person", "He's a kind person.", "彼は親切な人だ。", "84", "日常", "in person=直接会って"],
    ["学生", "人・関係", "学生", "student", "学生、生徒", "students(複)", "a college student", "I'm a student.", "私は学生です。", "15", "日常", ""],

    # ── 場所・空間 ──────────────────────────────────────────
    ["世界", "場所・空間", "世界", "world", "世界", "worlds(複)", "around the world, the whole world", "It's a small world.", "世界は狭いね。", "11", "日常", ""],
    ["国", "場所・空間", "国", "country", "国、田舎", "countries(複)", "my country, in the country", "Which country are you from?", "出身国はどこ？", "17", "日常", "the country=田舎"],
    ["場所", "場所・空間", "場所", "place", "場所、位置", "places(複)", "a nice place, take place, in place", "This is a great place.", "ここはいい場所だ。", "21", "日常", "take place=開催される"],
    ["家/自宅", "場所・空間", "家庭", "home", "家、自宅", "homes(複)", "at home, go home, stay home", "I'm going home.", "家に帰る。", "33", "日常", "go home（toなし）"],
    ["部屋", "場所・空間", "部屋", "room", "部屋、余地", "rooms(複)", "living room, make room", "My room is small.", "私の部屋は狭い。", "35", "日常", "room=余地（不可算）"],
    ["地域/分野", "場所・空間", "領域", "area", "地域、分野", "areas(複)", "in this area, gray area", "It's a quiet area.", "静かな地域だ。", "37", "日常", "分野の意味も"],
    ["都市/街", "場所・空間", "都市", "city", "都市、市", "cities(複)", "big city, in the city", "Tokyo is a huge city.", "東京は巨大都市だ。", "66", "日常", ""],
    ["家（建物）", "場所・空間", "家屋", "house", "家、建物", "houses(複)", "a big house, at my house", "Come to my house.", "うちに来て。", "54", "日常", "home(家庭)との違いに注意"],
    ["オフィス/職場", "場所・空間", "職場", "office", "会社、事務所", "offices(複)", "at the office, head office", "I'm at the office.", "今職場にいる。", "81", "ビジネス", ""],
    ["ドア/戸", "場所・空間", "出入口", "door", "ドア、扉", "doors(複)", "open the door, next door", "Close the door, please.", "ドアを閉めて。", "82", "日常", "next door=隣の"],
    ["学校", "場所・空間", "教育機関", "school", "学校", "schools(複)", "go to school, high school", "I walk to school.", "学校まで歩く。", "12", "日常", "go to school=通学する"],
    ["側/面/味方", "場所・空間", "側面", "side", "側、面、味方", "sides(複)", "on the other side, side by side", "Look on the bright side.", "前向きに考えよう。", "51", "日常", "on my side=味方"],

    # ── 抽象・プレースホルダー ─────────────────────────────
    ["方法/やり方/道", "抽象・プレースホルダー", "方法", "way", "方法、道、点", "ways(複)", "in a way, by the way, no way", "There must be a way.", "何か方法があるはず。", "4", "日常", "by the way=ところで"],
    ["物/こと", "抽象・プレースホルダー", "物事", "thing", "物、こと", "things(複)", "the thing is, one thing", "The thing is, I'm busy.", "実は忙しくて。", "7", "日常", "the thing is=実はね"],
    ["部分/一部", "抽象・プレースホルダー", "部分", "part", "部分、役割", "parts(複)", "a part of, take part in", "That's the hard part.", "そこが難しい所だ。", "20", "日常", "take part in=参加する"],
    ["場合/事例", "抽象・プレースホルダー", "事例", "case", "場合、事例", "cases(複)", "in case, in that case, a case of", "In that case, let's wait.", "それなら待とう。", "22", "日常", "in case=念のため"],
    ["点/要点", "抽象・プレースホルダー", "論点", "point", "点、要点、目的", "points(複)", "the point is, good point, no point", "What's your point?", "要点は何？", "32", "日常", "no point in doing=無意味"],
    ["事実", "抽象・プレースホルダー", "事実", "fact", "事実", "facts(複)", "in fact, the fact that", "In fact, I agree.", "実は賛成だ。", "40", "日常", "in fact=実は"],
    ["種類", "抽象・プレースホルダー", "種類", "kind", "種類、親切", "kinds(複)", "a kind of, kind of, what kind of", "What kind of music?", "どんな音楽？", "52", "日常", "kind of=なんとなく"],
    ["理由/わけ", "抽象・プレースホルダー", "理由", "reason", "理由", "reasons(複)", "the reason why, for some reason", "There's no reason to worry.", "心配する理由はない。", "92", "日常", "reason why=〜する理由"],
    ["考え/アイデア", "抽象・プレースホルダー", "着想", "idea", "考え、アイデア", "ideas(複)", "a good idea, no idea, the idea of", "I have no idea.", "全然わからない。", "72", "日常", "no idea=見当もつかない"],

    # ── 仕事・ビジネス ──────────────────────────────────────
    ["仕事/作業", "仕事・ビジネス", "労働", "work", "仕事、作業", "不可算", "at work, go to work, work on", "I have a lot of work.", "仕事がたくさんある。", "28", "ビジネス", "不可算。1つの職はa job"],
    ["会社", "仕事・ビジネス", "企業", "company", "会社、仲間", "companies(複)", "a big company, keep company", "I work for a tech company.", "IT企業で働いている。", "24", "ビジネス", ""],
    ["ビジネス/商売", "仕事・ビジネス", "事業", "business", "商売、事業、用件", "businesses(複)", "do business, on business, small business", "I'm here on business.", "出張で来ています。", "49", "ビジネス", "on business=仕事で"],
    ["お金", "仕事・ビジネス", "金銭", "money", "お金", "不可算", "make money, spend money, save money", "I need to save money.", "お金を貯めなきゃ。", "38", "日常", "不可算。数えない"],
    ["仕事/職", "仕事・ビジネス", "職", "job", "職、仕事（1件）", "jobs(複)", "a good job, get a job, lose a job", "I got a new job.", "新しい仕事に就いた。", "47", "日常", "可算。workと対比"],
    ["サービス/対応", "仕事・ビジネス", "サービス", "service", "サービス、対応", "services(複)", "good service, customer service", "The service was great.", "接客が良かった。", "55", "ビジネス", ""],
    ["プログラム/番組/計画", "仕事・ビジネス", "計画", "program", "計画、番組、プログラム", "programs(複)", "a TV program, training program", "It's a good program.", "いい番組だ。", "26", "ビジネス", "英programme(英式)"],
    ["チーム", "仕事・ビジネス", "組織単位", "team", "チーム、班", "teams(複)", "a team of, team up, work as a team", "We're on the same team.", "同じチームだ。", "70", "ビジネス", "team up=協力する"],
    ["市場/相場", "仕事・ビジネス", "市場", "market", "市場、市況", "markets(複)", "on the market, stock market", "It's the biggest market.", "最大の市場だ。", "100+", "ビジネス", "on the market=売りに出て"],

    # ── 社会・組織 ──────────────────────────────────────────
    ["国家/州/状態", "社会・組織", "国家・状態", "state", "州、国家、状態", "states(複)", "the United States, state of mind", "It's in a bad state.", "ひどい状態だ。", "13", "書き言葉", "state=状態の意味も"],
    ["政府", "社会・組織", "政府", "government", "政府、行政", "governments(複)", "the government, local government", "The government decided.", "政府が決定した。", "29", "書き言葉", ""],
    ["グループ/集団", "社会・組織", "集団", "group", "集団、グループ", "groups(複)", "a group of, in groups", "We work in small groups.", "少人数で作業する。", "16", "日常", "a group of=〜の一団"],
    ["地域社会/コミュニティ", "社会・組織", "共同体", "community", "地域社会、共同体", "communities(複)", "local community, online community", "It's a close community.", "結束の固い地域だ。", "67", "書き言葉", ""],
    ["法律/法則", "社会・組織", "法", "law", "法律、法則", "laws(複)", "break the law, by law", "It's against the law.", "それは違法だ。", "64", "書き言葉", "against the law=違法"],
    ["パーティー/政党", "社会・組織", "催し・党", "party", "パーティー、政党", "parties(複)", "a birthday party, throw a party", "Let's have a party.", "パーティーしよう。", "88", "日常", "party=政党の意味も"],
    ["歴史", "社会・組織", "歴史", "history", "歴史、経歴", "histories(複)", "in history, history of", "I love studying history.", "歴史を学ぶのが好き。", "87", "日常", ""],
    ["教育", "社会・組織", "教育", "education", "教育", "不可算", "higher education, get an education", "Education is important.", "教育は大切だ。", "100", "書き言葉", "基本不可算"],
    ["制度/システム", "社会・組織", "体系", "system", "制度、体系、系統", "systems(複)", "the system, a good system", "The system works well.", "その仕組みはうまく機能する。", "25", "ビジネス", ""],

    # ── 情報・言語 ──────────────────────────────────────────
    ["質問/問題", "情報・言語", "問い", "question", "質問、問題", "questions(複)", "ask a question, out of the question", "Can I ask a question?", "質問してもいい？", "27", "日常", "out of the question=論外"],
    ["数/番号", "情報・言語", "数字", "number", "数、番号", "numbers(複)", "a number of, phone number", "What's your number?", "番号は何番？", "30", "日常", "a number of=いくつかの"],
    ["話/物語", "情報・言語", "物語", "story", "話、物語", "stories(複)", "a true story, tell a story", "It's a long story.", "話せば長い。", "39", "日常", "long story=込み入った話"],
    ["本", "情報・言語", "書物", "book", "本、帳簿", "books(複)", "read a book, comic book, book a room", "I'm reading a good book.", "いい本を読んでいる。", "45", "日常", "動詞book=予約する"],
    ["単語/言葉", "情報・言語", "語", "word", "単語、言葉", "words(複)", "in other words, keep one's word", "In other words, no.", "つまり、ノーだ。", "48", "日常", "in other words=言い換えれば"],
    ["名前", "情報・言語", "名称", "name", "名前", "names(複)", "first name, last name, by name", "What's your name?", "お名前は？", "68", "日常", ""],
    ["情報", "情報・言語", "情報", "information", "情報", "不可算", "a piece of information, for your information", "I need more information.", "もっと情報が必要だ。", "75", "ビジネス", "不可算。an informationは誤り"],
    ["線/列/セリフ", "情報・言語", "線", "line", "線、列、セリフ", "lines(複)", "in line, a line of, drop a line", "Please wait in line.", "列に並んでお待ちを。", "61", "日常", "in line=列に並んで"],
    ["研究/調査", "情報・言語", "研究", "research", "研究、調査", "不可算", "do research, research on", "I'm doing research.", "研究をしている。", "93", "書き言葉", "不可算"],

    # ── 身体・健康 ──────────────────────────────────────────
    ["手", "身体・健康", "手", "hand", "手、援助", "hands(複)", "on the other hand, give a hand", "Give me a hand?", "手を貸して？", "19", "日常", "on the other hand=一方で"],
    ["目", "身体・健康", "目", "eye", "目、視力", "eyes(複)", "keep an eye on, blue eyes", "Keep an eye on my bag.", "かばんを見てて。", "46", "日常", "keep an eye on=見張る"],
    ["頭", "身体・健康", "頭", "head", "頭、長", "heads(複)", "head of, use your head, ahead", "Use your head.", "頭を使って。", "53", "日常", "head=長・トップの意味も"],
    ["体", "身体・健康", "身体", "body", "体、団体", "bodies(複)", "the human body, a body of", "My whole body aches.", "体中が痛い。", "74", "日常", ""],
    ["顔", "身体・健康", "顔", "face", "顔、表情", "faces(複)", "face to face, make a face", "She has a kind face.", "彼女は優しい顔だ。", "78", "日常", "face to face=対面で"],
    ["健康", "身体・健康", "健康", "health", "健康", "不可算", "good health, health care", "Health comes first.", "健康が一番。", "83", "日常", "不可算"],
    ["命/人生/生活", "身体・健康", "生命", "life", "命、人生、生活", "lives(複)", "in my life, real life, way of life", "That's life.", "それが人生さ。", "9", "日常", "複数lives[laɪvz]"],
    ["水", "身体・健康", "水", "water", "水", "不可算", "a glass of water, fresh water", "Can I get some water?", "お水もらえますか？", "34", "日常", "不可算"],
    ["空気/雰囲気", "身体・健康", "空気", "air", "空気、雰囲気", "不可算", "fresh air, in the air, by air", "Let's get some fresh air.", "外の空気を吸おう。", "97", "日常", "by air=飛行機で"],

    # ── 出来事・活動 ────────────────────────────────────────
    ["問題/困りごと", "出来事・活動", "問題", "problem", "問題、困りごと", "problems(複)", "have a problem, no problem, solve", "No problem.", "問題ないよ。", "18", "日常", "No problem=どういたしまして"],
    ["問題/課題/発行", "出来事・活動", "論点・課題", "issue", "問題、課題", "issues(複)", "a big issue, deal with an issue", "That's a serious issue.", "それは深刻な問題だ。", "50", "ビジネス", "problemより中立的"],
    ["ゲーム/試合", "出来事・活動", "競技", "game", "ゲーム、試合", "games(複)", "play a game, win a game", "Let's play a game.", "ゲームしよう。", "60", "日常", ""],
    ["変化", "出来事・活動", "変化", "change", "変化、変更、つり銭", "changes(複)", "a big change, for a change, small change", "It's a big change.", "大きな変化だ。", "90", "日常", "change=つり銭の意味も"],
    ["結果", "出来事・活動", "結果", "result", "結果", "results(複)", "as a result, the result of", "As a result, we won.", "結果、勝った。", "89", "ビジネス", "as a result=その結果"],
    ["終わり", "出来事・活動", "終結", "end", "終わり、端", "ends(複)", "in the end, at the end of", "In the end, it worked.", "結局うまくいった。", "62", "日常", "in the end=最終的に"],
    ["研究/勉強", "出来事・活動", "学習活動", "study", "勉強、研究", "studies(複)", "a study on, case study", "It's a useful study.", "有益な研究だ。", "44", "書き言葉", "case study=事例研究"],

    # ── 概念・知識 ──────────────────────────────────────────
    ["レベル/水準", "概念・知識", "水準", "level", "レベル、水準", "levels(複)", "at a high level, sea level", "It's at a high level.", "高い水準だ。", "80", "ビジネス", ""],
    ["力/権力/電力", "概念・知識", "力", "power", "力、権力、電力", "powers(複)", "have the power, power outage", "Knowledge is power.", "知は力なり。", "58", "書き言葉", "power outage=停電"],
    ["権利/正しいこと/右", "概念・知識", "権利", "right", "権利、右、正しさ", "rights(複)", "human rights, on the right, be right", "You have the right to ask.", "尋ねる権利がある。", "43", "日常", "形容詞right=正しい/右の"],
    ["たくさん", "概念・知識", "多量", "lot", "たくさん", "lots(複)", "a lot of, lots of, a lot", "Thanks a lot!", "本当にありがとう！", "42", "口語", "a lot of=たくさんの"],
    ["背中/後ろ/戻り", "概念・知識", "後方", "back", "背中、後ろ", "backs(複)", "come back, at the back, back up", "I'll be right back.", "すぐ戻る。", "76", "日常", "副詞back=戻って"],
]
