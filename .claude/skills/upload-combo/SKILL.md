---
name: upload-combo
description: 콤보 업로드 흐름의 백엔드 처리. .tutfile 검증, 메타데이터 추출, Supabase Storage 업로드, DB 레코드 생성. 사용자가 "업로드 API 만들어줘" "콤보 업로드 처리 구현해줘" 같은 요청을 할 때 사용.
---

# 콤보 업로드 처리 워크플로우

## 전체 흐름

```
클라이언트
  1) POST /api/uploads/presigned-url  →  { uploadUrl, key }
  2) PUT uploadUrl  ←  .tutfile 직접 업로드 (Supabase Storage)
  3) POST /api/combos { tutfileKey, videoKey, title, ... }
       └─ 서버: .tutfile 검증 → video 분리 저장 → DB 저장
```

Vercel 함수 body 제한(4.5MB) 우회를 위해 클라이언트 직접 업로드 방식 사용.

## Step 1. presigned URL 발급

`app/api/uploads/presigned-url/route.ts`:

```ts
export async function POST(req: Request) {
  const session = await requireAuth()
  const { fileName, fileType } = await req.json()

  if (!['application/zip', 'video/mp4'].includes(fileType)) {
    return badRequest('지원하지 않는 파일 형식')
  }

  const key = `uploads/${session.userId}/${randomUUID()}/${fileName}`
  const { data, error } = await supabaseAdmin.storage
    .from('tutfiles')
    .createSignedUploadUrl(key)

  if (error) return serverError(error)
  return ok({ url: data.signedUrl, key })
}
```

## Step 2. .tutfile 검증

`lib/tutfile/validate.ts` — fflate 사용 (Edge Runtime 호환):

```ts
import { unzipSync, strFromU8 } from 'fflate'
import { manifestSchema, inputsSchema, stepsSchema } from './schema'

export function parseTutfile(buffer: ArrayBuffer) {
  const unzipped = unzipSync(new Uint8Array(buffer))

  const required = ['manifest.json', 'inputs.json', 'steps.json', 'video.mp4']
  for (const f of required) {
    if (!unzipped[f]) throw new Error(`누락된 파일: ${f}`)
  }

  const manifest = manifestSchema.parse(JSON.parse(strFromU8(unzipped['manifest.json'])))
  const inputs = inputsSchema.parse(JSON.parse(strFromU8(unzipped['inputs.json'])))
  const steps = stepsSchema.parse(JSON.parse(strFromU8(unzipped['steps.json'])))
  const videoBuffer = unzipped['video.mp4'].buffer

  return { manifest, inputs, steps, videoBuffer }
}
```

## Step 3. game_specific 게임별 검증

```ts
// lib/games/registry.ts
import { lolGameSpecificSchema } from './lol/schema'

export const gameSchemas: Record<string, ZodSchema> = {
  lol: lolGameSpecificSchema,
}

export function validateGameSpecific(gameSlug: string, data: unknown) {
  const schema = gameSchemas[gameSlug]
  if (!schema) throw new Error(`지원하지 않는 게임: ${gameSlug}`)
  return schema.parse(data)
}
```

## Step 4. POST /api/combos

`app/api/combos/route.ts`:

```ts
export async function POST(req: Request) {
  const session = await requireAuth()
  const input = createComboSchema.parse(await req.json())

  // Supabase Storage에서 .tutfile 다운로드
  const { data: fileData } = await supabaseAdmin.storage
    .from('tutfiles')
    .download(input.tutfileKey)
  const buffer = await fileData!.arrayBuffer()

  // 파싱 + 검증
  const { manifest, inputs, steps, videoBuffer } = parseTutfile(buffer)
  const gameSpecific = validateGameSpecific(manifest.game, manifest.game_specific)

  // video.mp4 → videos 버킷 업로드
  const videoKey = `videos/${randomUUID()}.mp4`
  await supabaseAdmin.storage.from('videos').upload(videoKey, videoBuffer)
  const videoUrl = supabaseAdmin.storage.from('videos').getPublicUrl(videoKey).data.publicUrl

  // 입력 요약 (카드 표시용, 최대 5개)
  const inputSummary = inputs.inputs.slice(0, 5).map(i => ({
    category: i.category, ref: i.ref,
  }))

  const combo = await prisma.combo.create({
    data: {
      title: input.title,
      description: input.description,
      authorId: session.userId,
      gameId: /* game lookup */,
      characterId: /* character lookup */,
      difficulty: manifest.difficulty,
      tags: manifest.tags,
      durationMs: manifest.duration_ms,
      inputCount: inputs.inputs.length,
      inputSummary,
      gameSpecific,
      thumbnailUrl: input.thumbnailUrl ?? null,
      videoUrl,
      tutfileUrl: supabaseAdmin.storage.from('tutfiles').getPublicUrl(input.tutfileKey).data.publicUrl,
      patchVersion: manifest.patch_version,
      status: 'published',
    }
  })

  return ok({ id: combo.id })
}
```

## Step 5. 에러 처리

| 케이스 | 응답 |
|---|---|
| .tutfile 형식 오류 | 400 |
| 지원하지 않는 게임 | 400 |
| game_specific 검증 실패 | 400 |
| 캐릭터 없음 | 400 |
| 인증 없음 | 401 |
| 파일 크기 초과 | 413 |
| 그 외 | 500 + 로그 |

## Step 6. 테스트 케이스

```ts
describe('POST /api/combos', () => {
  it('유효한 .tutfile 업로드 성공')
  it('잘못된 .tutfile 거부')
  it('미지원 게임 거부')
  it('game_specific 검증 실패 거부')
  it('인증 없이 거부')
})
```

## 마무리

```
/check
/commit
```
