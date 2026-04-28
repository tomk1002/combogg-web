---
paths:
  - app/**
  - components/**
---

# 프론트엔드 작업 규칙

이 규칙은 `app/`, `components/` 하위 파일 작업 시 자동 로드됩니다.

## 컴포넌트 분리 원칙

- **공통 컴포넌트**는 `components/` 직하위에
- **게임별 컴포넌트**는 `components/games/{slug}/`에만
  - 절대 공통 컴포넌트에 게임별 분기 로직 넣지 말 것
  - 새 게임 추가는 `add-game` skill 따를 것
- shadcn/ui 컴포넌트는 `components/ui/`에 (수정 시 주의)

## 라우트 구조

- App Router 사용 — `pages/` 디렉터리 만들지 말 것
- 게임별 페이지는 `app/games/[slug]/`로 통일
- 동적 라우트 매개변수는 한 단어 (`[id]`, `[slug]`)

## 스타일

- Tailwind 유틸리티 우선
- 인라인 스타일·`style={{}}` 금지 (정말 필요한 경우 주석으로 사유)
- 반복되는 클래스 조합은 `cn()` 헬퍼 또는 컴포넌트로 추출

## 클라이언트/서버 컴포넌트

- 기본은 서버 컴포넌트
- `"use client"`는 인터랙션·hook 사용이 명백할 때만
- 데이터 페칭은 서버 컴포넌트에서 (가능한 한)

## 타입

- props는 항상 명시적 인터페이스 또는 type
- `any` 금지 — 정말 필요하면 `unknown` 후 타입 가드
- API 응답 타입은 `lib/api/types.ts`에서 import (직접 정의 X)

## 이미지

- `next/image` 사용 (img 태그 금지, 정적 SVG는 예외)
- Riot Data Dragon 이미지는 `lib/games/lol/ddragon.ts`의 헬퍼로

## 접근성

- 클릭 가능한 요소는 button 또는 a (div + onClick 금지)
- 폼 input에 라벨 연결
- 키보드 네비게이션 가능하게
