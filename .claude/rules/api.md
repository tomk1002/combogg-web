---
paths:
  - app/api/**
---

# API 라우트 규칙

이 규칙은 `app/api/` 하위 파일 작업 시 자동 로드됩니다.

## 명세 일치

- 모든 엔드포인트는 `docs/04_shared_spec.md` 4.3절과 정확히 일치해야 함
- 명세에 없는 엔드포인트 추가 시: 먼저 사용자에게 명세 업데이트가 필요한지 확인
- 응답 스키마는 명세의 예시와 동일한 키 구조 유지

## 인증

- 인증 필요 엔드포인트: `lib/auth/requireAuth()` 사용
- 옵션 인증 (로그인 시 추가 정보): `lib/auth/getSession()` 사용
- 데스크톱 앱 호출 가능 엔드포인트는 JWT 토큰도 허용
  - 헤더 `Authorization: Bearer <jwt>` 처리
- 절대 직접 cookie 파싱하지 말 것

## 응답 형식

- 성공: `lib/api/response.ts`의 `ok(data, status?)` 헬퍼
- 실패: `badRequest(msg)`, `unauthorized()`, `notFound()`, `serverError(err)` 등
- 응답 본문은 항상 JSON
- 에러 메시지는 사용자에게 보일 수 있게 한국어 OK (단, 민감 정보 노출 금지)

## 입력 검증

- 모든 요청 body·query는 Zod 스키마로 파싱
- 검증 실패 → 400 응답
- 게임별 데이터(game_specific)는 `lib/games/registry.ts`의 디스패처 사용

## 에러 처리

- 예상 에러는 명시적으로 처리
- 예상 못 한 에러는 `serverError(err)`로 → 자동으로 로깅 + 500 응답
- 절대 raw error를 클라이언트에 노출하지 말 것

## 데이터베이스

- Prisma 클라이언트는 `lib/db.ts`에서 import
- 트랜잭션은 `prisma.$transaction([...])` 또는 콜백 형식
- N+1 주의 — `include` 또는 `select`로 필요한 관계 미리 로드

## 보안

- SQL 인젝션 — Prisma raw 쿼리 사용 시 매개변수 바인딩 필수
- IDOR — 사용자가 자신의 리소스만 수정·삭제하도록 author_id 체크
- 파일 업로드 URL 발급 시 사용자별 prefix 사용

## 캐싱

- 조회 엔드포인트에 적절한 cache 헤더
- Next.js `revalidate` 활용
- 사용자별 데이터(좋아요 여부 등)는 캐시하지 말 것
