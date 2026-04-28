# Agents 디렉터리

서브에이전트 정의 파일 보관 장소. **MVP 단계에서는 비어 있음.**

프로젝트가 커지면 추가 예시:

- `db-migrator.md` — Prisma 마이그레이션 전용
- `api-reviewer.md` — API 엔드포인트 명세 일치 확인

파일 형식:

```yaml
---
name: db-migrator
description: Prisma 마이그레이션을 처리하고 검증
tools: Bash(pnpm db:*), Read, Edit
model: sonnet
permissionMode: acceptEdits
---
```
