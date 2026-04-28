---
paths:
  - prisma/**
  - lib/db.ts
  - lib/db/**
---

# 데이터베이스 규칙

이 규칙은 `prisma/`, `lib/db*` 작업 시 자동 로드됩니다.

## 스키마 변경

- 스키마는 `docs/04_shared_spec.md` 4.2절을 기준으로 함
- 명세에 없는 테이블·필드 추가 시: 사용자에게 명세 업데이트 확인
- 필드 삭제·이름 변경은 신중하게 — 데이터 손실 가능

## 마이그레이션

- 개발: `pnpm db:migrate dev` (이름 명시: `pnpm db:migrate dev --name add_game_specific`)
- 프로덕션: `pnpm db:migrate deploy` (수동 검토 후)
- 마이그레이션 파일은 절대 수정·삭제하지 말 것 (이미 적용된 경우)
- 큰 변경(필드 삭제, 타입 변경)은 두 단계로:
  1. 새 필드 추가 + 데이터 복사
  2. 다음 PR에서 옛 필드 삭제

## 시드 데이터

- `prisma/seed.ts`에서 게임·캐릭터 등 정적 메타데이터 적재
- 사용자 데이터는 시드하지 말 것
- 시드는 멱등하게 (`upsert` 사용, `create` 금지)

## 타입

- Prisma 자동 생성 타입을 직접 import (`import { Combo } from '@prisma/client'`)
- 응답 DTO는 별도 정의 (`lib/api/types.ts`) — Prisma 타입을 그대로 노출하지 말 것
- 민감 필드(email, oauth_id 등)는 응답에서 항상 제외

## JSONB 필드

- `combos.game_specific`, `games.input_categories` 등 JSONB는 Zod 스키마로 검증
- 게임별 스키마는 `lib/games/{slug}/schema.ts`
- DB에 저장 전 반드시 검증, 읽을 때도 파싱 후 사용

## 쿼리 성능

- 인덱스는 `docs/04_shared_spec.md` 4.2절 명세 따를 것
- 새 자주 쓰는 필터 조건 발견 시 인덱스 추가 검토

## 트랜잭션

- 여러 테이블 동시 변경은 트랜잭션으로
- 외부 API 호출(스토리지 업로드 등)은 트랜잭션 밖에서
