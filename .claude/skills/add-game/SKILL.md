---
name: add-game
description: 새 게임을 플랫폼에 추가하는 멀티스텝 워크플로우. games 테이블 추가, 캐릭터 데이터 적재, game_specific 스키마 정의, 게임별 컴포넌트 생성을 자동화. 사용자가 "Elden Ring 추가해줘" 같이 새 게임 도입을 요청할 때 사용.
---

# 새 게임 추가 워크플로우

자세한 원칙: `docs/04_shared_spec.md` 4.5절.

## 사전 확인

사용자에게 확인:

- 게임 slug (예: `elden-ring`)
- 게임 정식 명칭
- 콤보·가이드 종류
- 입력 카테고리 목록
- 콤보 조건 필드 (game_specific 스키마)

## Step 1. DB

```ts
// prisma/seed.ts
await prisma.game.create({
  data: {
    slug: 'elden-ring',
    name: 'Elden Ring',
    iconUrl: '...',
    inputCategories: ['attack', 'heavy_attack', 'roll', 'weapon_art', 'item']
  }
})
```

캐릭터/무기 시드: 해당 게임 공식 데이터 소스에서 가져올 것.

## Step 2. lib/games/{slug}/

### categories.ts

```ts
export const INPUT_CATEGORIES = {
  attack: { label: '공격', iconType: 'static' },
  weapon_art: { label: '전회', iconType: 'dynamic', refSource: 'eldenring-data' },
} as const
```

### schema.ts (game_specific Zod 스키마)

```ts
import { z } from 'zod'

export const gameSpecificSchema = z.object({
  weapon: z.string(),
  stats_min: z.object({ str: z.number().optional() }).optional(),
  ash_of_war: z.string().optional(),
})

export type GameSpecific = z.infer<typeof gameSpecificSchema>
```

### metadata.ts

해당 게임 외부 데이터 페처.

## Step 3. components/games/{slug}/

### Conditions.tsx

```tsx
export function Conditions({ data }: { data: GameSpecific }) {
  return <div>{/* 콤보 상세 조건 섹션 */}</div>
}
```

### UploadForm.tsx

```tsx
export function UploadForm({ onChange }: { onChange: (data: GameSpecific) => void }) {
  // 게임별 업로드 폼 필드
}
```

## Step 4. app/games/{slug}/

```
app/games/elden-ring/
├─ page.tsx
└─ characters/[slug]/page.tsx
```

기존 `app/games/lol/` 구조 참고.

## Step 5. 디스패처 업데이트

```tsx
// app/combos/[id]/page.tsx
function GameConditions({ game, data }) {
  switch (game) {
    case 'lol': return <LolConditions data={data} />
    case 'elden-ring': return <EldenRingConditions data={data} />
  }
}
```

업로드 폼도 동일하게 분기.

## Step 6. 게임 registry 등록

```ts
// lib/games/registry.ts
import { gameSpecificSchema as eldenRingSchema } from './elden-ring/schema'

export const gameSchemas = {
  lol: lolSchema,
  'elden-ring': eldenRingSchema,
}
```

## Step 7. 검증

- `pnpm typecheck`
- 새 게임으로 콤보 업로드 → 상세 페이지 렌더링 확인
- `/games/{slug}` 라우트 접근 확인

## Step 8. 문서 업데이트

- `docs/04_shared_spec.md` 지원 게임 목록 추가
- `docs/05_roadmap.md` 확장 완료 섹션 기록

## 마무리

```
/check
/commit
/pr
```
