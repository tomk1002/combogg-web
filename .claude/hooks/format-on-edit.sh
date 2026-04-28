#!/usr/bin/env bash
# 파일 편집·생성 후 자동으로 prettier 적용
# 실패해도 작업을 막지 않음 (non-blocking)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# JS/TS/JSON/MD 파일만 대상
if echo "$FILE_PATH" | grep -qE "\.(ts|tsx|js|jsx|json|md|mdx|css|html)$"; then
  if [ -f "$FILE_PATH" ]; then
    pnpm prettier --write "$FILE_PATH" 2>/dev/null || true
  fi
fi

exit 0
