# Combo Share — Web

LoL 콤보 공유 플랫폼의 웹사이트 + 백엔드 API. 데스크톱 앱(별도 레포)과 짝을 이룬다.

## 레포 구조

- `app/` — Next.js App Router 페이지
- `app/games/[slug]/` — 게임별 페이지 (현재 LoL만)
- `app/api/` — API 라우트
- `components/` — 공통 컴포넌트
- `components/games/{slug}/` — 게임별 컴포넌트 (Conditions, UploadForm 등)
- `lib/` — 유틸·DB·외부 API 클라이언트
- `lib/games/{slug}/` — 게임별 로직 (categories, schema, metadata)
- `prisma/` — DB 스키마
- `design/` — Claude Design 산출물 (참고용, 빌드 대상 아님)
- `docs/` — 기획·명세 문서

## 기술 스택

- Next.js 14 (App Router) / TypeScript
- Postgres (Supabase) / Prisma
- Tailwind + shadcn/ui
- Auth.js v5 (Google·Discord OAuth만 — 이메일 로그인 없음)
- Supabase Storage (파일 스토리지 — POC, 파일당 50MB 제한)
- 패키지 매니저: **pnpm**
- ZIP 파싱: **fflate** (Edge Runtime 호환)

## 명령어

- `pnpm dev` — 개발 서버
- `pnpm test path/to/file` — 단일 테스트 (전체보다 단일 우선)
- `pnpm typecheck`
- `pnpm lint`
- `pnpm db:migrate`
- `pnpm db:seed`

## 주요 제약

- 닉네임 unique 강제 (DB unique constraint + 가입 시 중복 체크)
- main 브랜치 직접 푸시 금지 (hook으로 강제됨)
- 게임별 컴포넌트는 `components/games/{slug}/`에만 — 공통 컴포넌트 오염 금지
- 새 API 엔드포인트는 `docs/04_shared_spec.md` 명세 따를 것

## 워크플로우

- 코드 변경 후 → `/check`
- 기능 단위 완료 → `/commit`
- PR 올릴 때 → `/pr` (직접 push 금지)

## 컨텍스트

- 프로젝트 개요: @docs/01_overview.md
- 웹 명세: @docs/03_web.md
- 공유 스펙 (.tutfile / DB / API): @docs/04_shared_spec.md
- 배포 계획: @docs/06_deploy_plan.md
