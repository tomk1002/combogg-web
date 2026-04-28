#!/usr/bin/env bash
# Claude가 실행하려는 bash 명령을 검사
# main/master 브랜치에 직접 푸시하려 하면 차단

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# git push origin main / master 차단
if echo "$COMMAND" | grep -qE "git push.*\b(main|master)\b"; then
  echo '{"decision":"block","reason":"main/master 브랜치 직접 푸시 금지. /pr 명령으로 PR을 생성하세요."}'
  exit 0
fi

# git push --force 차단
if echo "$COMMAND" | grep -qE "git push.*--force"; then
  echo '{"decision":"block","reason":"force push 금지."}'
  exit 0
fi

# 통과
echo '{"decision":"approve"}'
