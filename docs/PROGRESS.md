# Prism AI 개발 진행 상황

## 현재 Phase

Phase 5: Gemini Provider

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
- `AIProvider` Interface와 7개 지원 질문을 처리하는 `MockAIProvider`를 추가했다. Mock은 Query와 Widget 구조만 선택하며 Business Value를 만들지 않는다.
- Analysis Plan, Analysis Context, DashboardSpec, API Request/Response의 Zod Schema를 추가했다.
- 존재하지 않는 Dataset/Finding 참조 Widget을 제거하고, 모두 제거되면 결정론적 Fallback Dashboard를 만드는 Semantic Sanitizer를 추가했다.
- `AnalyzeQuestionService`가 Planner, Local Repository, Finding, Composer를 조율하고 `POST /api/analyze`가 안전한 HTTP Boundary를 제공하도록 구현했다.
- Dashboard Route가 Client에서 검증된 API Response를 요청하고, Component Registry가 Metric, SVG Time Series, Segment Bar, Table, Insight Widget을 렌더링하도록 연결했다.
- API, Service, Mock Provider, Schema, Sanitizer Test와 새 Dynamic Dashboard E2E 기대값을 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- `currentContext`를 Analyze API 입력으로 다시 Zod 검증하고, Provider가 낸 `contextPatch`의 명시된 필드만 병합하도록 구현했다.
- Follow-up에서 `filters` Patch는 교체하며 빈 배열은 제거로 처리하고, Patch에 없는 기간·지표·비교 조건·필터는 현재 Context를 유지한다.
- Mock Provider가 `모바일만 자세히 분석해줘`와 `작년 같은 기간과 비교해줘`를 순차 Context Patch로 처리하도록 구현했다.
- Dashboard에 Follow-up Prompt를 추가했고, 요청 중이나 Recoverable Error 중에도 직전의 검증된 Dashboard를 유지한다.
- 검증된 전체 Analysis Response를 브라우저 Local Storage v1에 최근 20개까지 저장하고, Zod 검증을 통과한 기록만 History에서 다시 연다.
- Local Storage는 `useSyncExternalStore` 경계로 구독해 Server Shell을 유지하면서 브라우저 저장소 변경을 반영한다.
- Context 병합·Filter 교체/제거, Mock Follow-up, Service 순차 Follow-up, Local History 검증/20개 제한, Follow-up과 History 재열기 E2E 시나리오를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- 공식 `@google/genai` SDK 2.19.0을 추가하고 `GeminiAIProvider`를 Server-only Module로 구현했다.
- Gemini Plan과 Dashboard Composition 요청에 JSON Schema를 제공하고, 응답 JSON을 Zod로 다시 검증한다. Schema 또는 Semantic 검증 실패 시 교정 요청은 최대 1회다.
- Gemini Composer는 Dashboard ID와 검증된 Context를 생성하지 않는다. 서버가 값을 주입하며, 숫자를 포함한 모델 표시 문구는 거부하고 Mock Composer로 복구한다.
- Analysis별 호출 Budget을 공유하고 기본 한도를 4회로 설정했다. 정상 Plan·Composer 2회와 각 단계의 교정 Retry 1회를 포함하는 상한이다.
- `AI_PROVIDER=gemini`이지만 설정이 불완전하거나 Live 호출이 실패하면 Mock Provider로 안전하게 Fallback하고 Response Metadata에 상태를 남긴다.
- Gemini Provider, Fallback, Provider Factory, 환경 선택에 대한 주입형 Unit Test를 추가했다. 실제 Gemini Key나 네트워크 호출은 사용하지 않는다. 테스트 실행은 사용자 요청에 따라 보류한다.

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
| 2026-08-31 | Phase 3 Chart는 새 Production Dependency 대신 검증된 Dataset을 그리는 경량 SVG와 접근 가능한 Table 대체 보기를 사용 | 현재 Widget 범위에서 Client Bundle과 의존성을 늘리지 않고도 Chart 근거를 제공하기 위함 |
| 2026-08-31 | Dashboard Client는 API Response도 Zod로 다시 검증 | Network Boundary 이후의 잘못된 Payload가 UI Renderer까지 도달하지 않게 하기 위함 |
| 2026-08-31 | Follow-up은 현재 검증 Context와 명시적 Patch만 사용 | 언급하지 않은 분석 조건을 유지하고 LLM이 임의로 상태를 재설정하지 못하게 하기 위함 |
| 2026-08-31 | `filters` Patch는 교체, 빈 배열은 제거로 해석 | 같은 Dimension의 상충 Filter가 AND 조건으로 결합되는 것을 막고 명시적 변경을 정확히 반영하기 위함 |
| 2026-08-31 | Local History는 Zod-검증된 전체 Analysis Response를 Storage v1에 최대 20개 저장 | 재열기에서 API나 LLM을 다시 호출하지 않고 당시의 검증된 결과만 표시하기 위함 |
| 2026-08-31 | Browser Storage는 `useSyncExternalStore`로 읽기 | Server Render와 Hydration을 보존하고 Effect 안의 동기 State 복사를 피하기 위함 |
| 2026-08-31 | Gemini는 공식 `@google/genai` SDK와 Server-only Factory로 연결 | `GEMINI_API_KEY`가 Client Bundle이나 Component로 전달되지 않게 하기 위함 |
| 2026-08-31 | Gemini Structured Output은 JSON Schema 요청 후 Zod와 Semantic 규칙으로 재검증 | SDK가 형식을 보조하더라도 Application Schema와 숫자 표시 금지 규칙을 최종 신뢰 경계로 유지하기 위함 |
| 2026-08-31 | Live 요청 Budget은 기본 4회 | Plan·Composer의 정상 2회와 각 1회 교정 요청을 허용하면서 무한 Retry를 막기 위함 |
| 2026-08-31 | Gemini 실패 시 Mock Provider로 Fallback | Key가 없거나 Live Provider가 실패해도 Local Demo와 기존 Dashboard 복구 흐름을 유지하기 위함 |

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
- `npm run lint`: 통과 (Phase 5)
- `npm run typecheck`: 통과 (Phase 5)
- `npm run build`: 통과 (Phase 5, Next.js Webpack production build)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 3)
- `npm run typecheck`: 통과 (Phase 3)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 4)
- `npm run typecheck`: 통과 (Phase 4)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

## 알려진 제한 사항

- Live Gemini 호출은 사용자 Key와 실제 API Quota가 있어야 검증할 수 있다. SDK Abort Signal은 클라이언트 대기를 중단하지만 Google 서비스 측 작업이나 사용량 청구를 보장해 취소하지는 않는다.
- Cache, Rate Limit, Request Deduplication, Partial Query 복구 정책은 이후 Phase에서 확장한다.
- Gemini와 Supabase는 `.env.example`에 설정 항목만 두었으며 아직 연동하지 않았다.
- `.env.local`은 생성하지 않았고, 기본 Mock Mode는 환경 변수 없이 동작한다.

## 다음 권장 작업

`docs/IMPLEMENTATION_PLAN.md`의 Phase 6을 진행해 Supabase Repository, Cache, Rate Limit, Request Deduplication과 운영 복구를 구현한다.
