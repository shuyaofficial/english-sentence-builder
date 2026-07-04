#!/usr/bin/env bash
# chunk-translate.sh — チャンクリーディング用の翻訳JSONを claude CLI で生成する。
# Claude のサブスクリプション内で動く（APIキー不要）。結果はクリップボードへコピー
# されるので、アプリの「② 貼り付け」にそのまま貼るだけ。Mac→iPhone は
# ユニバーサルクリップボードでスマホ側にも貼り付けできる。
#
# 使い方:
#   tools/chunk-translate.sh "明日の朝までにこの障害の原因を調べておきます"
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
JP="${1:-}"

if [ -z "$JP" ]; then
  echo '使い方: tools/chunk-translate.sh "日本語の文"' >&2
  exit 1
fi
if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI が見つかりません（https://claude.com/claude-code）" >&2
  exit 1
fi

PROMPT="$(node "$DIR/chunk-prompt.js" "$JP")"

echo "⏳ claude に翻訳を依頼中…" >&2
OUT="$(claude -p "$PROMPT")"

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$OUT" | pbcopy
  echo "✓ 翻訳JSONをクリップボードにコピーしました。アプリの「② 貼り付け」に貼ってください。" >&2
  echo "  （iPhoneで使う場合もユニバーサルクリップボードでそのまま貼り付け可）" >&2
else
  printf '%s\n' "$OUT"
fi
