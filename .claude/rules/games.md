---
paths:
  - components/games/**
  - lib/games/**
  - app/games/**
---

# 게임별 코드 규칙

이 규칙은 `components/games/`, `lib/games/`, `app/games/` 하위 파일 작업 시 자동 로드됩니다.

## 핵심 원칙

**"코어 코드는 게임 무관, 게임별 차이는 격리"**

새 게임 추가가 코어 코드를 거의 건드리지 않도록 격리되어야 합니다.

## 디렉터리 규칙

```
lib/games/{slug}/
├─ categories.ts    # input category 정의
├─ schema.ts        # game_specific Zod 스키마
└─ metadata.ts      # 외부 데이터 페처 (Riot Data Dragon 등)

components/games/{slug}/
├─ Conditions.tsx   # 콤보 상세의 조건 패널
├─ UploadForm.tsx   # 업로드 폼의 게임별 추가 필드
├─ InputIcon.tsx    # 게임별 입력 아이콘 렌더링
└─ ...

app/games/{slug}/
├─ page.tsx
└─ characters/[slug]/page.tsx
```

## 절대 하지 말 것

- ❌ 공통 컴포넌트(`components/` 직하위)에 `if (game === 'lol')` 분기 넣기
- ❌ 코어 라이브러리에 게임별 로직 하드코딩
- ❌ 한 게임의 컴포넌트가 다른 게임의 lib 직접 import

## 게임별 디스패처 패턴

게임 분기는 한 곳(레지스트리)에서만:

```ts
// lib/games/registry.ts
export const gameSchemas = {
  lol: lolSchema,
  'elden-ring': eldenRingSchema,
} as const

export const gameComponents = {
  lol: { Conditions: LolConditions, UploadForm: LolUploadForm },
  'elden-ring': { Conditions: EldenRingConditions, UploadForm: EldenRingUploadForm },
} as const
```

UI에서는 슬러그로 컴포넌트 조회:

```tsx
const { Conditions } = gameComponents[combo.game.slug]
return <Conditions data={combo.game_specific} />
```

## 새 게임 추가

`add-game` skill을 사용하세요. 체크리스트는 `docs/04_shared_spec.md` 4.5절.

## 입력 카테고리

- 각 게임의 `categories.ts`에서만 정의
- 코어에서는 카테고리 이름을 하드코딩하지 말 것
- 새 카테고리 추가 시 .tutfile 명세 업데이트 필요 여부 확인

## 외부 데이터

- LoL: Riot Data Dragon API
- 다른 게임: 공식 데이터 소스 우선, 없으면 커뮤니티 위키 (라이센스 확인)
- 패치 버전 변경 감지 로직 포함

## 캐릭터 데이터

- DB의 `characters` 테이블에 사전 시드
- 신규 캐릭터 출시 시 시드 스크립트 갱신
- 캐릭터 아이콘은 외부 URL 직접 참조 (자체 호스팅 X)
