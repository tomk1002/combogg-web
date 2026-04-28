---
description: 현재 변경사항을 검증한 뒤 의미 단위로 커밋
---

# /commit

## 1. 사전 검증

- `git status`로 변경 파일 확인
- `pnpm typecheck` 실행
- 검증 실패 시: 사용자에게 보고하고 멈춤 (커밋하지 말 것)

## 2. 변경사항 분석

`git diff`로 변경 내용을 확인하고 다음을 판단:

- 단일 논리 단위인가? 여러 단위면 분리 커밋 권장
- 어떤 영역(API, UI, DB, docs 등)인가?

## 3. 커밋 메시지 생성

Conventional Commits 형식, 한국어 OK:

```
<type>(<scope>): <한 줄 요약>

<선택: 본문 — 왜 변경했는지>
```

타입: `feat` / `fix` / `refactor` / `chore` / `docs` / `test` / `style`  
스코프 예시: `api`, `web`, `db`, `auth`, `lol`, `docs`

## 4. 사용자 확인

커밋 메시지를 보여주고 승인 받기. 승인 시 `git add` + `git commit`.

## 5. 주의

- 절대 `git push` 하지 말 것 — push는 `/pr` 에서만
- `Co-authored-by:` 푸터 추가하지 말 것
- 한 번에 여러 커밋 만들지 말 것
