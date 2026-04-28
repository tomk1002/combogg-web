# 04. 공유 명세 (양쪽 합의 영역)

이 문서의 항목은 **앱·웹 양쪽이 모두 의존**하는 영역입니다. Sprint 0에서 합의 후 변경 시 양쪽 모두 영향이 있으므로 신중하게 다룹니다.

> **확장성 원칙**: 현재 MVP는 LoL만 지원하지만, 데이터 구조·포맷·API는 모두 다른 게임 추가가 가능하도록 설계합니다. 게임마다 입력 종류·콤보 조건·캐릭터 메타데이터가 완전히 다르므로 **공통 코어 + 게임별 확장** 패턴을 사용합니다.

---

## 4.1 .tutfile 포맷

zip 아카이브로 다음 파일을 포함합니다.

```
.tutfile (zip)
├─ manifest.json
├─ inputs.json
├─ steps.json
└─ video.mp4
```

### manifest.json

공통 필드 + 게임별 확장 필드(`game_specific`)로 구성. 게임이 추가되면 `game_specific` 스키마만 추가하면 됨.

```json
{
  "version": "1.0",
  "id": "uuid",
  "title": "Riven Q-AA-Q-AA 풀콤보",
  "game": "lol",
  "character": "riven",
  "difficulty": "hard",
  "tags": ["풀콤보", "라인전"],
  "duration_ms": 4500,
  "patch_version": "14.20",
  "author": "user_xxx",
  "created_at": "2026-04-28T12:00:00Z",
  "key_bindings": {
    "Q": "Q", "W": "W", "E": "E", "R": "R",
    "D": "D", "F": "F"
  },
  "game_specific": {
    "required_level": 6,
    "ability_haste_min": 20,
    "attack_speed_min": 1.5,
    "required_items": ["3142", "3814"],
    "summoner_spells": ["SummonerFlash", "SummonerDot"]
  }
}
```

**game_specific 스키마 (LoL 예시)**

| 필드 | 타입 | 설명 |
|---|---|---|
| required_level | int | 필요 챔프 레벨 (1~18) |
| ability_haste_min | int | 최소 스킬 가속 |
| attack_speed_min | float | 최소 공격 속도 |
| required_items | string[] | Riot 아이템 ID 목록 |
| summoner_spells | string[] | Riot 소환사 주문 ID 목록 |
| runes | object | (선택) 룬 정보 |

다른 게임 추가 시 `game_specific` 스키마를 게임별로 따로 정의 (예: Elden Ring은 weapon, ash_of_war, stats 등).

### inputs.json

콤보의 입력 시퀀스. **게임마다 입력 종류가 다르므로 `category`로 구분**하고, 표시할 아이콘은 `ref`(게임 데이터 ID)로 참조.

```json
{
  "inputs": [
    { "t": 0,    "category": "skill",          "ref": "RivenQ" },
    { "t": 350,  "category": "attack" },
    { "t": 700,  "category": "skill",          "ref": "RivenQ" },
    { "t": 900,  "category": "attack_cancel" },
    { "t": 1200, "category": "item",           "slot": 1, "ref": "3142" },
    { "t": 1500, "category": "summoner_spell", "slot": "D", "ref": "SummonerFlash" },
    { "t": 2000, "category": "skill",          "ref": "RivenR" }
  ]
}
```

**category 종류 (LoL)**

| category | 설명 | 추가 필드 |
|---|---|---|
| skill | 챔프 스킬 (Q/W/E/R) | `ref` (스킬 ID) |
| attack | 평타 | 없음 |
| attack_cancel | 평캔 | 없음 |
| item | 아이템 사용 | `slot` (1~6), `ref` (아이템 ID) |
| summoner_spell | 소환사 주문 | `slot` (D/F), `ref` (주문 ID) |
| move | 이동 | (선택) 좌표 |
| recall | 귀환 | 없음 |
| ward | 와드 설치 | `ref` (와드 종류) |

**category는 게임별로 확장**. 다른 게임 추가 시 해당 게임의 category 목록을 별도로 정의.

`ref` 값은 Riot Data Dragon ID와 일치시켜 표시 시점에 아이콘 URL 조립:
- 챔프 스킬: `https://ddragon.leagueoflegends.com/cdn/14.20.1/img/spell/RivenQ.png`
- 아이템: `https://ddragon.leagueoflegends.com/cdn/14.20.1/img/item/3142.png`
- 소환사 주문: `https://ddragon.leagueoflegends.com/cdn/14.20.1/img/spell/SummonerFlash.png`

### steps.json

콤보를 구간으로 나눈 정보. 각 구간에 팁·주석.

```json
{
  "steps": [
    { "start": 0, "end": 1500, "title": "1단", "tip": "Q는 1초 내 재발동" },
    { "start": 1500, "end": 4500, "title": "2단", "tip": "평캔 타이밍 주의" }
  ]
}
```

---

## 4.2 데이터베이스 설계

### ER 개요

```
User ──< Combo >── Game
         │              │
         │              └── Character
         ├──< Like
         ├──< Comment
         └──< Download
```

### 테이블 정의

#### users

| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| nickname | VARCHAR | |
| avatar_url | TEXT | |
| oauth_provider | VARCHAR | google / discord / email |
| oauth_id | VARCHAR | |
| created_at | TIMESTAMP | |

#### games

| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| slug | VARCHAR UNIQUE | lol |
| name | VARCHAR | League of Legends |
| icon_url | TEXT | |
| current_patch | VARCHAR | |
| input_categories | JSONB | 게임에서 사용 가능한 input category 목록 |

#### characters

| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| game_id | UUID FK | |
| slug | VARCHAR | riven |
| name | VARCHAR | 리븐 |
| icon_url | TEXT | Riot Data Dragon URL |

#### combos

| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| title | VARCHAR | |
| description | TEXT | 작성자 자유 설명 |
| author_id | UUID FK → users | |
| game_id | UUID FK → games | |
| character_id | UUID FK → characters | |
| difficulty | ENUM | easy / medium / hard |
| tags | TEXT[] | |
| duration_ms | INT | 콤보 총 시간 |
| input_count | INT | 입력 개수 |
| input_summary | JSONB | 카드 표시용 입력 요약 |
| **game_specific** | **JSONB** | **게임별 메타데이터·조건 (LoL: 레벨, 아이템, 소환사 주문 등)** |
| thumbnail_url | TEXT | |
| video_url | TEXT | mp4 |
| tutfile_url | TEXT | .tutfile 다운로드 |
| patch_version | VARCHAR | |
| view_count | INT | |
| download_count | INT | |
| like_count | INT | |
| status | ENUM | draft / published / removed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**game_specific 활용**

게임별 콤보 조건·메타데이터를 JSONB로 저장. 게임 추가 시 테이블 스키마 변경 없이 확장.

LoL 예시:
```json
{
  "required_level": 6,
  "ability_haste_min": 20,
  "attack_speed_min": 1.5,
  "required_items": ["3142", "3814"],
  "summoner_spells": ["SummonerFlash", "SummonerDot"]
}
```

게임별 검증 로직은 코드에서 처리 (각 게임마다 Zod·Yup 스키마 정의).

#### likes

| 필드 | 타입 |
|---|---|
| id | UUID PK |
| user_id | UUID FK |
| combo_id | UUID FK |
| created_at | TIMESTAMP |
| UNIQUE(user_id, combo_id) | |

#### comments

| 필드 | 타입 |
|---|---|
| id | UUID PK |
| combo_id | UUID FK |
| user_id | UUID FK |
| content | TEXT |
| created_at | TIMESTAMP |

#### downloads

| 필드 | 타입 |
|---|---|
| id | UUID PK |
| user_id | UUID FK (NULL 가능) |
| combo_id | UUID FK |
| downloaded_at | TIMESTAMP |

### 인덱스

- `combos`: (game_id, character_id), (status, created_at DESC), (status, like_count DESC)
- `combos.game_specific` JSONB 필드는 게임별로 자주 검색되는 키에 GIN 인덱스 추가
- `likes`: (user_id, combo_id)
- `comments`: (combo_id, created_at DESC)

---

## 4.3 API 명세

### 인증 방식

- 웹: NextAuth 세션 쿠키
- 앱: JWT 토큰 (OAuth 후 발급, 로컬 저장)
- OAuth 제공자: Google, Discord, Email

### 엔드포인트 — 인증

| Method | Path | 설명 | 사용처 |
|---|---|---|---|
| POST | /api/auth/login | 이메일 로그인 | 웹 |
| POST | /api/auth/oauth/:provider | OAuth 시작 | 웹 |
| POST | /api/auth/logout | 로그아웃 | 웹·앱 |
| GET | /api/auth/me | 현재 사용자 | 웹·앱 |
| POST | /api/auth/desktop-token | 앱용 토큰 발급 | 앱 |

### 엔드포인트 — 콤보

| Method | Path | 설명 | 사용처 |
|---|---|---|---|
| GET | /api/combos | 콤보 목록 (필터·페이징) | 웹 |
| GET | /api/combos/:id | 콤보 상세 | 웹·앱 |
| POST | /api/combos | 콤보 업로드 | 웹·앱 |
| PATCH | /api/combos/:id | 콤보 수정 | 웹 |
| DELETE | /api/combos/:id | 콤보 삭제 | 웹 |
| POST | /api/combos/:id/like | 좋아요 토글 | 웹 |
| POST | /api/combos/:id/download | 다운로드 카운트 + URL 발급 | 웹·앱 |

#### GET /api/combos 쿼리 파라미터

- `game` (slug): lol
- `character` (slug): riven
- `difficulty`: easy / medium / hard
- `tags`: 콤마구분
- `sort`: popular / latest / downloads
- `page`, `limit`
- 게임별 추가 파라미터 (예: LoL: `min_level`, `item`)

#### GET /api/combos/:id 응답 예시

```json
{
  "id": "uuid",
  "title": "Riven 풀콤보",
  "description": "라인전 풀콤보. 6레벨 이후 사용 가능.",
  "author": { "id": "...", "nickname": "...", "avatar_url": "..." },
  "game": { "slug": "lol", "name": "LoL" },
  "character": { "slug": "riven", "name": "리븐", "icon_url": "..." },
  "difficulty": "hard",
  "tags": ["풀콤보"],
  "duration_ms": 4500,
  "input_summary": [
    { "category": "skill", "ref": "RivenQ" },
    { "category": "attack" },
    { "category": "skill", "ref": "RivenR" }
  ],
  "game_specific": {
    "required_level": 6,
    "ability_haste_min": 20,
    "attack_speed_min": 1.5,
    "required_items": ["3142", "3814"],
    "summoner_spells": ["SummonerFlash", "SummonerDot"]
  },
  "thumbnail_url": "...",
  "video_url": "...",
  "tutfile_url": "...",
  "patch_version": "14.20",
  "stats": { "views": 1234, "downloads": 567, "likes": 89 },
  "is_liked": false,
  "created_at": "..."
}
```

### 엔드포인트 — 업로드

| Method | Path | 설명 |
|---|---|---|
| POST | /api/uploads/presigned-url | 파일 업로드용 presigned URL 발급 |

**흐름**: 클라이언트가 presigned URL 요청 → 클라우드 스토리지에 직접 업로드 → POST /api/combos에 URL 전달

### 엔드포인트 — 메타데이터 (게임별)

| Method | Path | 설명 |
|---|---|---|
| GET | /api/games | 게임 목록 |
| GET | /api/games/:slug | 특정 게임 정보 (input_categories 포함) |
| GET | /api/games/:slug/characters | 게임의 캐릭터 목록 |
| GET | /api/games/:slug/items | (LoL) 아이템 목록 |
| GET | /api/games/:slug/summoner-spells | (LoL) 소환사 주문 목록 |

게임별 메타데이터 엔드포인트는 게임마다 다르게 추가. 예) Elden Ring은 `/api/games/elden-ring/weapons`, `/api/games/elden-ring/ashes`.

### 엔드포인트 — 사용자

| Method | Path | 설명 |
|---|---|---|
| GET | /api/users/:id | 사용자 프로필 |
| GET | /api/users/:id/combos | 사용자 작성 콤보 |
| PATCH | /api/users/me | 본인 프로필 수정 |

### 엔드포인트 — 댓글

| Method | Path | 설명 |
|---|---|---|
| GET | /api/combos/:id/comments | 댓글 목록 |
| POST | /api/combos/:id/comments | 댓글 작성 |
| DELETE | /api/comments/:id | 댓글 삭제 |

---

## 4.4 앱 ↔ 웹 연동 시나리오

### 시나리오 1: 웹에서 콤보 다운로드 → 앱 실행

1. 웹에서 다운로드 클릭
2. 커스텀 URL 스킴 트리거: `combo://download?id=xxx&token=yyy`
3. 데스크톱 앱이 URL 받아 API 호출 (`GET /api/combos/:id`)
4. .tutfile 다운로드 후 라이브러리에 추가

### 시나리오 2: 앱에서 녹화·편집 → 웹 업로드

1. 앱에서 편집 완료 후 "공유" 클릭
2. 로그인 안 된 경우: 브라우저 열어 OAuth 진행
3. 토큰 받아 앱에 저장
4. presigned URL 받아 영상·tutfile 업로드
5. POST /api/combos로 메타데이터 전송 (game_specific 포함)

---

## 4.5 게임 추가 시 체크리스트

새 게임을 지원하려면 다음 작업이 필요합니다.

| 영역 | 작업 |
|---|---|
| DB | `games` 테이블에 레코드 추가, `characters` 테이블에 캐릭터 데이터 적재 |
| 포맷 | `game_specific` 스키마 정의 (해당 게임의 콤보 조건 필드) |
| 포맷 | `inputs.json`의 `category` 목록 정의 (해당 게임의 입력 종류) |
| API | 게임별 메타데이터 엔드포인트 추가 (아이템·무기·기타) |
| 웹 | `/games/{slug}` 라우트 + 게임별 컴포넌트 (`<XxxConditions />`, `<XxxUploadForm />`) |
| 앱 | 해당 게임 감지 로직 (Overwolf 또는 다른 SDK) + 게임별 입력 캡처 |
| 데이터 | 게임 아이콘·캐릭터 이미지 등 정적 자산 |

이 체크리스트를 따라 게임을 추가하면 코어 코드는 거의 안 건드려도 됩니다.
