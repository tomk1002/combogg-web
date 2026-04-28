# 06. 웹 배포 계획 (POC)

> 작성일: 2026-04-28  
> 대상: 팀원 B (웹사이트 + 백엔드)

---

## 확정 결정 사항

| 항목 | 결정 | 비고 |
|---|---|---|
| 도메인 | vercel.app URL 사용 | POC — 추후 별도 구매 |
| 언어 | TypeScript | |
| 프레임워크 | Next.js 14 (App Router) | |
| 스타일 | Tailwind CSS + tokens.css 디자인 토큰 | 폼 등 유틸은 shadcn/ui |
| DB | Supabase PostgreSQL | |
| ORM | Prisma | |
| 인증 | Auth.js v5 (NextAuth) | Google + Discord OAuth만, 이메일 없음 |
| 스토리지 | Supabase Storage | 파일당 50MB 제한 / POC 이후 R2 검토 |
| 게임 데이터 | Riot Data Dragon (정적) | Riot API 공식 심사는 MVP 이후 |
| 배포 | Vercel | Preview (PR별 자동) + Production |
| 레포 | 단독 웹 레포 (`combogg-web`) | |

---

## MVP 기능 범위

아래 모든 기능 포함.

| 기능 | 비고 |
|---|---|
| 홈 / 게임별 / 캐릭터별 페이지 | |
| 콤보 상세 (입력 시퀀스 시각화 포함) | Data Dragon 아이콘 |
| 업로드 (.tutfile 실제 파싱 + 영상 저장) | |
| 다운로드 (.tutfile 실제 파일 제공) | |
| 검색 / 필터 | |
| 좋아요 / 댓글 | |
| 사용자 프로필 | |
| 로그인 (Google + Discord) | |
| 다운로드 안내 페이지 | |

---

## 기술 스택

| 영역 | 선택 | 버전 |
|---|---|---|
| 프레임워크 | Next.js | 14.x (App Router) |
| 언어 | TypeScript | 5.x |
| 스타일 | Tailwind CSS | 3.x |
| UI 유틸 | shadcn/ui | 폼·다이얼로그·토스트 등 |
| 폰트 | Pretendard | `next/font/local` |
| DB | Supabase (PostgreSQL 15) | |
| ORM | Prisma | 5.x |
| 인증 | Auth.js | v5 (beta) |
| 스토리지 | Supabase Storage | |
| ZIP 파싱 | fflate | Edge Runtime 호환 |
| 스키마 검증 | Zod | |
| 배포 | Vercel | |

---

## 디렉터리 구조

```
combogg-web/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── games/
│   │   └── lol/
│   │       ├── page.tsx                    # /games/lol
│   │       └── champions/
│   │           └── [slug]/
│   │               └── page.tsx            # /games/lol/champions/riven
│   ├── combos/
│   │   └── [id]/
│   │       └── page.tsx                    # /combos/:id
│   ├── upload/
│   │   └── page.tsx
│   ├── users/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── download/
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── combos/
│   │   │   ├── route.ts                    # GET(목록) POST(생성)
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET PATCH DELETE
│   │   │       ├── like/route.ts
│   │   │       ├── download/route.ts
│   │   │       └── comments/
│   │   │           ├── route.ts
│   │   │           └── [commentId]/route.ts
│   │   ├── games/
│   │   │   ├── route.ts
│   │   │   └── [slug]/
│   │   │       ├── route.ts
│   │   │       └── characters/route.ts
│   │   ├── uploads/
│   │   │   └── presigned-url/route.ts
│   │   └── users/
│   │       ├── me/route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── combos/route.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── site-header.tsx
│   │   └── site-footer.tsx
│   ├── combo/
│   │   ├── combo-card.tsx
│   │   ├── combo-grid.tsx
│   │   └── input-sequence.tsx             # 입력 시퀀스 시각화
│   ├── games/
│   │   └── lol/
│   │       ├── lol-conditions.tsx         # 게임별 조건 패널
│   │       ├── lol-upload-form.tsx        # 게임별 업로드 폼
│   │       └── champ-chip.tsx
│   ├── ui/                                # shadcn/ui 기반
│   └── shared/
│       ├── keycap.tsx
│       ├── difficulty-pips.tsx
│       └── video-player.tsx
│
├── lib/
│   ├── auth.ts                            # Auth.js 설정
│   ├── db.ts                              # Prisma 클라이언트 싱글톤
│   ├── supabase.ts                        # Supabase 클라이언트 (서버/클라이언트)
│   ├── tutfile.ts                         # .tutfile 파싱 로직
│   ├── data-dragon.ts                     # Data Dragon 아이콘 URL 유틸
│   └── utils.ts
│
├── types/
│   ├── index.ts                           # 공통 타입
│   ├── tutfile.ts                         # .tutfile 포맷 타입
│   └── api.ts                             # API 요청/응답 타입
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                            # LoL 챔피언 시드 데이터
│
└── public/
    ├── fonts/                             # Pretendard TTF
    └── icons/                            # SVG 아이콘
```

---

## 환경 변수

`.env.local` (로컬) + Vercel 환경 변수에 동일하게 설정.

```env
# Supabase — DB
DATABASE_URL="postgresql://..."           # Prisma용 (Transaction Mode)
DIRECT_URL="postgresql://..."            # Prisma 마이그레이션용 (Direct)

# Supabase — Storage & Auth
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."       # 서버 전용, 절대 클라이언트 노출 금지

# Auth.js
AUTH_SECRET="..."                        # openssl rand -base64 32
AUTH_URL="https://combogg-web.vercel.app" # 배포 후 업데이트

# Google OAuth
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

# Discord OAuth
AUTH_DISCORD_ID="..."
AUTH_DISCORD_SECRET="..."
```

---

## 외부 서비스 설정 체크리스트

작업 시작 전 아래를 모두 완료해야 함.

- [ ] **GitHub**: 레포 생성 (`combogg-web`), main 브랜치 보호 설정
- [ ] **Vercel**: 프로젝트 생성, GitHub 레포 연결
- [ ] **Supabase**: 프로젝트 생성, DB URL 두 개 획득, Storage 버킷 3개 생성
- [ ] **Google Cloud Console**: OAuth 2.0 앱 생성
  - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
  - Authorized redirect URI: `https://combogg-web.vercel.app/api/auth/callback/google`
- [ ] **Discord Developer Portal**: 앱 생성
  - Redirect URI: `http://localhost:3000/api/auth/callback/discord`
  - Redirect URI: `https://combogg-web.vercel.app/api/auth/callback/discord`

**Supabase Storage 버킷**:

| 버킷 이름 | 공개 여부 | 용도 |
|---|---|---|
| `tutfiles` | 비공개 (signed URL) | .tutfile 원본 |
| `videos` | 공개 | mp4 스트리밍 |
| `thumbnails` | 공개 | 콤보 썸네일 |

---

## Phase별 작업 계획

### Phase 0: 프로젝트 초기화 (Day 1–2)

**목표**: 로컬 + Vercel에서 빈 Next.js 앱이 돌아가는 상태

1. `npx create-next-app@latest combogg-web --typescript --tailwind --app --eslint`
2. `tokens.css` 디자인 토큰 → `tailwind.config.ts` CSS 변수로 이식
3. Pretendard 폰트 → `next/font/local` 설정
4. Prisma 설치 + Supabase 연결 테스트
5. Auth.js v5 설치 + 기본 라우트 (`/api/auth/[...nextauth]`)
6. GitHub 레포 push
7. Vercel 프로젝트 생성 + GitHub 자동 배포 확인

**완료 기준**: `https://combogg-web.vercel.app` 접속 가능한 빈 페이지

---

### Phase 1: DB 스키마 + 시드 (Day 3–4)

**Prisma 스키마** (04_shared_spec.md 기반):

주요 모델: `User`, `Game`, `Character`, `Combo`, `Like`, `Comment`, `Download`

특이사항:
- `Combo.game_specific` → `Json` 타입 (게임별 조건)
- `Combo.input_summary` → `Json` 타입 (카드 표시용)
- `Combo.difficulty` → `enum Difficulty { easy medium hard }`
- `Combo.status` → `enum ComboStatus { draft published removed }`
- `User.oauth_provider` → `enum OAuthProvider { google discord }`

**시드 스크립트** (`prisma/seed.ts`):
- Data Dragon API에서 LoL 챔피언 목록 fetch
- `games` 테이블 LoL 레코드 삽입
- `characters` 테이블 전체 챔피언 삽입

**Supabase Storage**: 버킷 3개 생성 + RLS 정책 설정

---

### Phase 2: 인증 (Day 5)

**Auth.js v5 설정** (`lib/auth.ts`):
- `GoogleProvider`, `DiscordProvider`
- `PrismaAdapter` — 세션·계정을 DB에 저장
- `callbacks.signIn` — 첫 로그인 시 `User` 레코드 생성, OAuth 닉네임 자동 적용
- `callbacks.session` — 세션에 `user.id` 포함

**로그인 페이지** (`app/(auth)/login/page.tsx`):
- `components/login-page.jsx` → TypeScript 마이그레이션
- `signIn('google')` / `signIn('discord')` 버튼

---

### Phase 3: 컴포넌트 마이그레이션 (Day 6–10)

기존 Claude Design 컴포넌트를 Next.js + TypeScript로 전환.

| 원본 파일 | 목적지 | 전환 포인트 |
|---|---|---|
| `site-header.jsx` | `components/layout/site-header.tsx` | 세션 기반 로그인 상태 처리 |
| `combo-card.jsx` | `components/combo/combo-card.tsx` | 타입 정의, 링크 처리 |
| `keycap.jsx` | `components/shared/keycap.tsx` | |
| `home-page.jsx` | `app/page.tsx` | Server Component + DB 데이터 |
| `detail-page.jsx` | `app/combos/[id]/page.tsx` | 동적 라우트, 입력 시각화 연결 |
| `upload-page.jsx` | `app/upload/page.tsx` | 실제 업로드 로직 연결 |
| `login-page.jsx` | `app/(auth)/login/page.tsx` | Auth.js signIn 연결 |
| `profile-page.jsx` | `app/users/[id]/page.tsx` | 동적 라우트 |

**전환 원칙**:
- 데이터 fetch → Server Component (`async` 함수)
- 클릭·입력·상태 → `'use client'` Client Component
- 인라인 스타일 → Tailwind 클래스로 순차 교체 (컴포넌트별)
- mock data → Prisma 쿼리로 교체

---

### Phase 4: API 구현 (Day 10–15)

#### 콤보

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/combos` | 목록 (game, character, difficulty, tags, sort, page, limit) |
| GET | `/api/combos/:id` | 상세 + 조회수 +1 |
| POST | `/api/combos` | 메타데이터 등록 (파일 업로드 완료 후) |
| PATCH | `/api/combos/:id` | 수정 (본인만) |
| DELETE | `/api/combos/:id` | 삭제 (본인만) |
| POST | `/api/combos/:id/like` | 좋아요 토글 |
| POST | `/api/combos/:id/download` | 다운로드 카운트 + signed URL 반환 |
| GET | `/api/combos/:id/comments` | 댓글 목록 |
| POST | `/api/combos/:id/comments` | 댓글 작성 |
| DELETE | `/api/combos/:id/comments/:commentId` | 댓글 삭제 (본인만) |

#### 게임 메타데이터

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/games` | 게임 목록 |
| GET | `/api/games/:slug` | 특정 게임 정보 |
| GET | `/api/games/:slug/characters` | 챔피언 목록 (필터용) |

#### 업로드

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/uploads/presigned-url` | Supabase Storage presigned URL 발급 |

#### 사용자

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/users/:id` | 프로필 |
| GET | `/api/users/:id/combos` | 작성 콤보 목록 |
| PATCH | `/api/users/me` | 닉네임·아바타 수정 |

---

### Phase 5: .tutfile 파싱 + 시각화 (Day 15–18)

#### 업로드 흐름

Vercel 서버리스 함수의 body 크기 제한(4.5MB)을 우회하기 위해 클라이언트 직접 업로드 방식 사용.

```
[클라이언트]
  1. POST /api/uploads/presigned-url → { uploadUrl, path }
  2. PUT uploadUrl  ← .tutfile 직접 업로드 (Supabase Storage)
  3. POST /api/combos { path, title, ... }

[서버 /api/combos POST]
  4. Supabase Storage에서 .tutfile 다운로드
  5. fflate로 압축 해제
  6. manifest.json → Zod 검증 (게임별 game_specific 스키마)
  7. inputs.json, steps.json 파싱
  8. video.mp4 → videos/ 버킷에 업로드
  9. DB에 Combo 레코드 생성
  10. combo id 반환
```

#### `lib/tutfile.ts` 책임

```typescript
parseTutfile(buffer: ArrayBuffer): Promise<{
  manifest: Manifest;
  inputs: InputSequence;
  steps: Steps;
  videoBuffer: ArrayBuffer;
}>
```

- ZIP 해제: `fflate` (Node.js + Edge 모두 동작)
- 검증: Zod 스키마 (게임별 분기 — 현재 LoL만)
- 에러: 파일 손상 / 스키마 불일치 시 400 반환

#### 입력 시퀀스 시각화 (`components/combo/input-sequence.tsx`)

```
inputs.json → category 분기
  skill         → Data Dragon 스킬 아이콘 (ref = "RivenQ" 등)
  attack        → 평타 커스텀 아이콘
  attack_cancel → 평캔 커스텀 아이콘
  item          → Data Dragon 아이템 아이콘 (ref = "3142" 등)
  summoner_spell→ Data Dragon 소환사 주문 아이콘
```

아이콘 URL 조립: `lib/data-dragon.ts`

```typescript
getSkillIconUrl(ref: string, patch: string): string
getItemIconUrl(itemId: string, patch: string): string
getSummonerSpellIconUrl(ref: string, patch: string): string
```

#### 썸네일 처리

- Phase 5 MVP: 업로드 폼에서 사용자가 썸네일 이미지 별도 선택 (선택 사항)
- 미선택 시: 기본 챔피언 이미지를 썸네일로 사용
- 추후 자동화: 데스크톱 앱에서 .tutfile 내에 썸네일 포함하거나, 서버에서 영상 프레임 추출

---

### Phase 6: Vercel 배포 (Day 18–19)

1. GitHub `main` 브랜치 push
2. Vercel 환경 변수 10개 설정
3. `prisma migrate deploy` 실행 (Vercel 배포 훅 또는 수동)
4. `prisma db seed` 실행 (LoL 챔피언 데이터)
5. Production URL 접속 + 기능 전체 확인

---

## 미결 / 추후 논의 사항

| 항목 | 현황 | 우선순위 |
|---|---|---|
| 닉네임 중복 허용 여부 | 미결정 | MVP 전 결정 필요 |
| 썸네일 자동 생성 | MVP는 수동 / 추후 자동화 | 낮음 |
| Riot API 공식 심사 | MVP 이후 | 챔피언 자동 감지 필요 시 |
| 라이엇 소환사명 연동 | MVP 이후 | 낮음 |
| 스토리지 R2 마이그레이션 | POC 이후 | 사용량 보고 결정 |
| 이메일 로그인 | MVP 이후 필요 시 | 낮음 |
| 영상 트랜스코딩 | 미구현 | 낮음 |
| 다국어 | MVP 이후 | 낮음 |
