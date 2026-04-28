---
description: 현재 브랜치를 원격에 푸시하고 PR 생성
---

# /pr

## 1. 사전 점검

- 현재 브랜치 확인 (`git branch --show-current`)
- main 브랜치면 중단하고 새 브랜치 만들도록 안내
- 미커밋 변경 있으면 `/commit` 먼저 안내

## 2. 통합 검증

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

하나라도 실패 시 PR 생성 중단, 실패 내용 보고.

## 3. 원격 푸시

```bash
git push -u origin <current-branch>
```

## 4. PR 생성

```
## 변경 내용
<커밋 목록 요약>

## 체크리스트
- [x] typecheck 통과
- [x] lint 통과
- [x] test 통과
```

## 5. 주의

- main으로의 PR인지 확인
- draft 필요 시 사용자에게 물어보고 `--draft` 추가
