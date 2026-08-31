# Prism AI 개발 진행 상황

## 현재 Phase

Phase 2: Analytics Engine

## 상태

구현 완료 · 테스트 실행 보류

## 완료

- Phase 0 Bootstrap을 완료했다.
- 2024-09-01부터 2026-08-30까지 10,935개의 고정 시드 일별 합성 E-commerce 데이터를 생성했다.
- 최근 비교 기간의 Mobile Fashion 하락, Everyday Sneakers 재고 부족, 광고비 증가와 ROAS 하락, Jeju의 높은 환불률을 생성 데이터에 반영했다.
- 생성 데이터와 동일한 Zod Schema를 사용하는 `LocalAnalyticsRepository`를 추가했다.
- Home에 Prompt Input, 6개 추천 질문, 분석 상태, Local Data 기간을 구현했다.
- `/dashboard/[id]`와 `/history`의 접근 가능한 Product Shell을 추가했다.
- 추천 질문 제출이 Mock Dashboard Route로 이동하도록 구현했다.
- 시드 생성기와 Repository, 고정 시드 시나리오에 대한 Unit Test 및 Product Shell E2E를 추가했다.
- Playwright 테스트 산출물과 로컬 브라우저 점검 폴더를 Git에서 제외했다.
- Metric과 Dimension Allowlist Catalog를 추가했다.
- Query DSL과 Zod Schema를 추가해 등록되지 않은 Metric, Dimension, 비교 조건, Filter, Limit을 거부하도록 했다.
- Dataset 마지막 완료일을 기준으로 Preset, Custom, 이전 기간·월·연도 비교 기간을 결정론적으로 계산한다.
- Filter, Grouping, Sort, Limit, 비교 Dataset과 0 나누기 시 `null`을 반환하는 Metric 계산을 구현했다.
- 증감률, 기여도, 순위, 7개 선행 관측치 기준 Rolling Z-score 이상치 탐지와 Evidence 기반 Finding 생성을 구현했다.
- `LocalAnalyticsRepository.execute()`가 순수 Analytics Engine으로 Local Dataset Query를 실행하도록 연결했다.
- Query DSL, 기간, 통계, Query Engine, Finding에 대한 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.

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
| 2026-08-31 | Local Dataset은 729일, 10,935개의 일별 Denormalized Row로 생성 | 고정된 대표 분석 시나리오를 UI 하드코드 없이 재현하기 위함 |
| 2026-08-31 | Production Build는 Webpack을 사용 | 현재 Next.js 16.3.3 Turbopack Build가 실행 환경에서 포트 바인딩 오류로 중단되어, 공식 지원되는 Webpack 빌더로 안정적인 검증 경로를 유지하기 위함 |
| 2026-08-31 | 고객 수는 Local Daily Aggregate의 `customers` 합계로 계산 | 현재 Synthetic Dataset에 Customer ID가 없어 기간 전체 Unique Customer 재계산은 불가능하며, 의미를 과장하지 않기 위함 |
| 2026-08-31 | 이상치 탐지는 7개 선행 관측치와 \|z\| ≥ 2.5의 Rolling Z-score를 사용 | 고정 Seed Data에서 외부 모델 없이 재현 가능한 기준을 제공하기 위함 |

## 검증 결과

- `npm run seed:generate`: 통과
- `npm run lint`: 통과 (`npm run check`에서 실행)
- `npm run typecheck`: 통과 (`npm run check`에서 실행)
- `npm run test`: 통과 (3 files, 6 tests)
- `npm run build`: 통과 (Next.js Webpack production build)
- `npm run check`: 통과
- `npm run format:check`: 통과
- `npm run test:e2e`: 통과 (Chromium 2 tests)
- `npx react-doctor@latest --verbose --scope changed`: 통과 (100/100, no issues)
- `npm run lint`: 통과 (Phase 2)
- `npm run typecheck`: 통과 (Phase 2)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

## 알려진 제한 사항

- Dashboard와 History는 Product Shell이며 Analytics Engine 결과 렌더링과 Local Storage 저장은 다음 Phase에서 구현한다.
- MockAIProvider, `POST /api/analyze`, Dynamic Dashboard Registry는 아직 구현하지 않았다.
- Gemini와 Supabase는 `.env.example`에 설정 항목만 두었으며 아직 연동하지 않았다.
- `.env.local`은 생성하지 않았고, 기본 Mock Mode는 환경 변수 없이 동작한다.

## 다음 권장 작업

`docs/IMPLEMENTATION_PLAN.md`의 Phase 3를 진행해 MockAIProvider, 안전한 Analysis Plan·Dashboard Schema, API Orchestrator와 Dynamic Dashboard Renderer를 구현한다.
