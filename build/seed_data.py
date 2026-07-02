# -*- coding: utf-8 -*-
"""Phase 1 の初期データを data/*.csv に書き出す（初回生成用）。

CSV が「唯一の編集元（source of truth）」。以後の語彙追加・修正は
data/*.csv を直接編集し、build_xlsx.py を再実行すれば .xlsx に反映される。
このスクリプトは初期投入をやり直したいときにのみ使う（既存CSVを上書き）。

実行:  python3 build/seed_data.py
"""
import csv
import os

import data_verbs
import data_nouns
import data_adjectives
import data_adverbs
import data_function
import data_phrases

# 内容語・機能語 共通ヘッダー（12列）
CONTENT_HEADERS = [
    "言いたいこと", "意味グループ", "サブグループ", "見出し語", "コア語義",
    "活用・派生", "コロケーション・句動詞", "例文(EN)", "例文(JP)",
    "頻度ランク", "レジスター", "メモ",
]

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.normpath(os.path.join(HERE, "..", "data"))

# (ファイル名, ヘッダー, 行) の対応
DATASETS = [
    ("動詞.csv", CONTENT_HEADERS, data_verbs.ROWS),
    ("名詞.csv", CONTENT_HEADERS, data_nouns.ROWS),
    ("形容詞.csv", CONTENT_HEADERS, data_adjectives.ROWS),
    ("副詞.csv", CONTENT_HEADERS, data_adverbs.ROWS),
    ("機能語.csv", CONTENT_HEADERS, data_function.ROWS),
    ("機能別フレーズ.csv", data_phrases.HEADERS, data_phrases.ROWS),
]


def write_csv(path, headers, rows):
    """行数・列数の整合を検証してから UTF-8(BOM付) で書き出す。"""
    for i, row in enumerate(rows):
        if len(row) != len(headers):
            raise ValueError(
                f"{os.path.basename(path)}: 行{i+1}の列数が{len(row)}"
                f"（期待{len(headers)}）: {row[:3]}…"
            )
    # utf-8-sig にすると Excel(日本語環境)が文字化けせず開ける
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    total = 0
    for filename, headers, rows in DATASETS:
        path = os.path.join(DATA_DIR, filename)
        write_csv(path, headers, rows)
        total += len(rows)
        print(f"  ✓ {filename:20s} {len(rows):3d} 行")
    print(f"合計 {total} 行を {DATA_DIR} に書き出しました。")


if __name__ == "__main__":
    main()
