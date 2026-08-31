# Prism AI 개발 진행 상황

## 현재 Phase

Phase 0: Bootstrap

## 상태

완료

## 완료

- npm 기반 Next.js App Router 프로젝트를 구성했다.
- TypeScript strict, Tailwind CSS, shadcn/ui 기본 설정을 적용했다.
- TanStack Query Provider와 Zod 기반 환경 변수 검증을 추가했다.
- Vitest, React Testing Library, Playwright 설정과 Bootstrap Home E2E를 추가했다.
- `.env.example`, `.nvmrc`, Prettier 설정과 필수 npm script를 추가했다.
- `AGENTS.md`와 제공된 `docs/` 문서를 프로젝트에 배치했다.
- 최소 Home Page가 렌더링되도록 구성했다.

## 진행 중

- 없음

## 결정 사항

| 날짜 | 결정 | 이유 |
|---|---|---|
| 2026-08-31 | npm만 사용 | Project Owner의 선택과 단일 Lockfile 유지 |
| 2026-08-31 | Local Data와 MockAIProvider를 기본값으로 사용 | API 비용과 Secret 없이 Portfolio Demo 전체가 동작해야 함 |
| 2026-08-31 | AI 책임을 Planner와 Dashboard Composer 두 개로 제한 | 숫자 분석은 결정론적 코드가 담당하고 Model Call 비용을 줄이기 위함 |
| 2026-08-31 | AGENTS.md를 짧게 유지 | 자동 적용 규칙과 작업별 상세 문서를 분리하기 위함 |
| 2026-08-31 | Next.js 16.3.3과 Node.js v26.4.0으로 Bootstrap | 현재 개발 환경에서 설치·검증한 조합을 명시하기 위함 |
| 2026-08-31 | Phase 0에서 Query Provider와 환경 변수 Schema를 먼저 구성 | 이후 Server State와 Provider 설정의 소유 경계를 미리 고정하기 위함 |

## 검증 결과

- `npm run lint`: 통과 (`npm run check`에서 실행)
- `npm run typecheck`: 통과 (`npm run check`에서 실행)
- `npm run test`: 통과 (2 tests)
- `npm run build`: 통과 (Next.js production build)
- `npm run check`: 통과
- `npm run format:check`: 통과
- `npm run test:e2e`: 통과 (Chromium 1 test)

## 알려진 제한 사항

- Local Synthetic Data, Analytics Engine, Mock Analysis Pipeline, Dashboard Route, History는 아직 구현하지 않았다.
- Gemini와 Supabase는 `.env.example`에 설정 항목만 두었으며 아직 연동하지 않았다.
- `.env.local`은 생성하지 않았고, 기본 Mock Mode는 환경 변수 없이 동작한다.

## 다음 권장 작업

`docs/IMPLEMENTATION_PLAN.md`의 Phase 1을 진행해 Fixed Seed Local Data, LocalAnalyticsRepository, Prompt Input, Dashboard와 History Route Shell을 구현한다.
