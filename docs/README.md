# Interactive Gameplay Guide Overlay

게임 내 캐릭터·무기별 콤보를 등록·연습·공유하는 인터랙티브 오버레이 + 웹 플랫폼.

## 문서 구성

| 파일 | 내용 | 주 독자 |
|---|---|---|
| [01_overview.md](./01_overview.md) | 프로젝트 개요·MVP 범위·시스템 구성 | 전원 |
| [02_desktop_app.md](./02_desktop_app.md) | 데스크톱 앱(Overlay) 기능·기술 명세 | 팀원 A |
| [03_web.md](./03_web.md) | 웹사이트 기능·페이지·컴포넌트 | 팀원 B |
| [04_shared_spec.md](./04_shared_spec.md) | .tutfile 포맷·DB 설계·API 명세 (양쪽 합의 영역) | 전원 |
| [05_roadmap.md](./05_roadmap.md) | 작업 분배·스프린트 일정·향후 확장 | 전원 |

## 읽는 순서

1. **모두**: `01_overview.md` 먼저
2. **팀원 A (앱)**: `02_desktop_app.md` → `04_shared_spec.md`
3. **팀원 B (웹)**: `03_web.md` → `04_shared_spec.md`
4. **킥오프 회의**: `05_roadmap.md` 보면서 일정·분배 확정

## 가장 먼저 합의할 것

`04_shared_spec.md`의 다음 항목은 양쪽이 **Sprint 0에서 반드시 합의**해야 합니다.

- .tutfile 포맷 v1
- OpenAPI 스펙 v1
- OAuth 토큰 흐름
- 커스텀 URL 스킴 (`combo://`)
