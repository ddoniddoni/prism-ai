# Prism AI Architecture

## 1. Architecture 목표

Architecture는 다음 책임을 분리한다.

1. 사용자의 질문에서 지원 가능한 분석 의도를 해석한다.
2. 실제 데이터를 조회하고 결정론적으로 계산한다.
3. 허용된 Widget 중 적절한 Dashboard 구성을 선택한다.
4. 검증된 Schema를 일반 React Component로 렌더링한다.

LLM은 Orchestration Layer이며 Database, Calculator, Code Generator가 아니다.

## 2. 요청 흐름

```text
Browser
  -> POST /api/analyze
  -> AnalyzeRequestCoordinator (Cache / Dedup / Rate Limit)
  -> AnalyzeQuestionService
      -> AIProvider.createPlan()
      -> AnalysisPlan 검증
      -> AnalysisContext Patch 병합
      -> AnalyticsRepository.execute()
      -> 결정론적 통계와 Finding 생성
      -> AIProvider.createDashboard()
      -> DashboardSpec 검증과 정리
  -> AnalyzeResponse
  -> TanStack Query Cache
  -> DashboardRenderer
  -> ComponentRegistry
```

실패 처리:

- Planner가 실패하면 가능한 경우 Rule 기반 기본 Plan을 사용한다.
- Query 하나가 실패해도 성공한 Dataset은 유지한다.
- Composer가 실패하면 결정론적 Fallback Dashboard를 만든다.
- 잘못된 Query 또는 Finding 참조가 있는 Widget은 제거한다.
- 후속 질문이 실패해도 기존 Dashboard를 유지한다.

## 3. 기술 구성

Core Stack:

- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Editor 전용 Zustand
- Zod
- Nivo (`@nivo/line`, `@nivo/pie`, `@nivo/bar`)와 자체 Calendar Heatmap
- `react-grid-layout`
- Vitest와 React Testing Library
- Playwright

Adapter:

- `LocalAnalyticsRepository`
- `SupabaseAnalyticsRepository`
- `MockAIProvider`
- `GeminiAIProvider`

첫 번째 동작 버전은 Local Repository와 Mock Provider만으로 완성한다.

## 4. 모듈 경계

### `src/app`

Route, Layout, Page 조합, Metadata, HTTP Boundary를 담당한다.

Route Handler가 담당할 일:

- Request 입력 검증
- Application Service 또는 Orchestrator 호출
- Domain Error를 HTTP Response로 변환
- Typed Response 반환

Route Handler에 Metric 계산식, Prompt 작성, Repository 조회 상세, Dashboard Sanitizing을 넣지 않는다.

### `src/components`

Dashboard의 표현 책임은 다음 파일로 나눈다.

| 파일 | 책임 |
| --- | --- |
| `analysis-dashboard.tsx` | API Mutation, 이전 성공 응답 유지, 후속 질문·조건 변경·History 연결 |
| `dashboard-header.tsx`, `dashboard-period-control.tsx` | 분석 제목, 기간 선택·직접 날짜 입력, Filter Chip, 비교 기준 Control |
| `analysis-result-tools.tsx`, `analysis-export-data.ts` | 조회 상태·기간·경고 표시와 검증 Dataset의 CSV 내보내기 |
| `dashboard-renderer.tsx` | 읽기용 Dashboard 조합과 초기 CSS Grid |
| `dashboard-widget-registry.tsx` | Schema의 모든 Widget Type 등록과 memo 경계 |
| `dashboard-widget-frame.tsx` | 공통 Card, 검증 Dataset 기준 표시 문구와 Heading |
| `widgets/*-widget.tsx` | 종류별 Dataset/Finding 연결과 차트 지연 로딩 |
| `dashboard-editor.tsx` | 편집 Grid, 저장 상태 조정, 선택 상태 |
| `dashboard-editor-controls.tsx` | 편집 Toolbar와 Widget Control |
| `widget-card-height-observer.tsx` | 콘텐츠 높이 측정과 ResizeObserver 정리 |
| `prism-*-chart.tsx`, `prism-calendar-heatmap.tsx` | 실제 차트와 키보드·선택 상호작용 |

새 Widget은 Schema·Sanitizer·Registry·Layout 지원을 함께 추가한다.
Registry는 모든 등록 Type을 TypeScript `satisfies`로 확인한다. 위젯 간 공통
Card만 공유하며 차트별 표현과 선택 처리는 해당 Widget이 소유한다.
`next/dynamic`은 각 Chart Widget Module 최상위에 두어 지연 로딩을 유지한다.


재사용 가능한 표현과 사용자 상호작용을 담당한다.

Component는 Typed Props를 받는다. Gemini 호출, Supabase Query, Business Metric 계산, AI JSON Parsing을 하지 않는다.

권장 그룹:

- `components/ui`
- `components/prompt`
- `components/dashboard`
- `components/history`

### `src/lib/analytics`

결정론적 Domain Logic을 담당한다.

- Metric과 Dimension Catalog
- Query DSL Schema
- 기간 정규화
- Filter와 Grouping
- 비교 Dataset
- 증감률
- 기여도
- 순위와 이상치
- Finding 생성

React, Next.js, Gemini, Supabase 없이 테스트할 수 있어야 한다.

### `src/lib/ai`

다음을 담당한다.

- `AIProvider` Interface
- Provider Factory
- Mock와 Gemini Adapter
- Prompt Template
- JSON Schema
- Zod Validation
- Retry와 Timeout 정책
- Result Sanitizing
- Fallback 선택

이 Layer는 Plan과 Dashboard 구성을 요청할 수 있지만 Query를 직접 실행하지 않는다.

### `src/lib/data`

Analytics Repository Interface와 Data Source Adapter를 담당한다.

Analytics Engine은 Repository를 통해 정규화된 Row 또는 Dataset을 받는다. UI와 AI Module은 데이터가 JSON인지 Supabase인지 알지 못한다.

### `src/stores`

Client 전용 Editor 상태와 순수 Layout 규칙을 담당한다.

- Widget Layout
- Layout·숨김 Widget·호환 표시 Type Override
- Undo와 Redo Stack
- 저장되지 않은 편집

API Response 전체를 Zustand에 중복 저장하지 않는다. 차트 선택은 Editor의
일시적인 React 상태이며 Store에 저장하지 않는다. `dashboard-layout.ts`는
위젯 종류·데이터 밀도·브레이크포인트에 따른 순수 배치 규칙을 소유한다.
저장된 Custom Layout은 자동 배치로 덮어쓰지 않는다.

## 5. 권장 Repository 구조

```text
prism-ai/
├─ AGENTS.md
├─ README.md
├─ docs/
│  ├─ PROJECT_SPEC.md
│  ├─ ARCHITECTURE.md
│  ├─ ANALYTICS_AI_SPEC.md
│  ├─ IMPLEMENTATION_PLAN.md
│  ├─ QUALITY_GUIDE.md
│  └─ PROGRESS.md
├─ scripts/
│  ├─ generate-seed.ts
│  └─ seed-supabase.ts
├─ supabase/
│  └─ migrations/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ dashboard/[id]/page.tsx
│  │  ├─ history/page.tsx
│  │  └─ api/
│  │     └─ analyze/route.ts
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ prompt/
│  │  ├─ dashboard/
│  │  └─ history/
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ provider.ts
│  │  │  ├─ create-provider.ts
│  │  │  ├─ gemini-provider.ts
│  │  │  ├─ mock-provider.ts
│  │  │  ├─ dashboard-sanitizer.ts
│  │  │  ├─ prompts/
│  │  │  └─ schemas/
│  │  ├─ analytics/
│  │  │  ├─ metric-catalog.ts
│  │  │  ├─ dimension-catalog.ts
│  │  │  ├─ query-schema.ts
│  │  │  ├─ query-engine.ts
│  │  │  ├─ statistics.ts
│  │  │  └─ findings.ts
│  │  ├─ data/
│  │  │  ├─ repository.ts
│  │  │  ├─ local-repository.ts
│  │  │  └─ supabase-repository.ts
│  │  ├─ analysis/
│  │  │  ├─ analyze-question-service.ts
│  │  │  └─ analyze-request-coordinator.ts
│  │  ├─ cache/
│  │  │  └─ analysis-cache.ts
│  │  ├─ operations/
│  │  │  └─ supabase-analysis-operations.ts
│  │  ├─ rate-limit/
│  │  │  └─ daily-rate-limiter.ts
│  │  ├─ request-dedup/
│  │  │  └─ request-deduplicator.ts
│  │  └─ env.ts
│  ├─ data/
│  │  └─ analytics-daily.json
│  ├─ providers/
│  │  └─ query-provider.tsx
│  ├─ stores/
│  │  └─ dashboard-editor-store.ts
│  └─ test/
└─ tests/
   └─ e2e/
```

현재 Phase에 필요한 Directory만 생성한다. 미래 기능을 위한 빈 Architecture를 한 번에 만들지 않는다.

## 6. Application Service

전체 Pipeline을 `route.ts`에 넣지 않고 Orchestration Service를 둔다.

```ts
interface AnalyzeQuestionService {
  execute(input: AnalyzeQuestionInput): Promise<AnalyzeQuestionResult>;
}
```

Service는 Provider와 Repository를 조율하고, 계산식과 검증은 Domain Module에 위임한다.

## 7. Provider Interface

```ts
interface AIProvider {
  createPlan(input: PlannerInput): Promise<AnalysisPlan>;
  createDashboard(input: DashboardComposerInput): Promise<DashboardSpec>;
}

interface AnalyticsRepository {
  execute(query: AnalyticsQuery): Promise<AnalyticsDataset>;
  getDataRange(): Promise<{ minDate: string; maxDate: string }>;
  getDatasetVersion(): Promise<string>;
}
```

Provider 선택은 Server에서 한다.

```text
AI_PROVIDER=mock | gemini
DATA_SOURCE=local | supabase
```

Live Provider가 없거나 설정되지 않아도 Development와 공개 Demo가 Mock Mode로 동작해야 한다.

## 8. API Boundary

### `POST /api/analyze`

Request:

```ts
type AnalyzeRequest = {
  question: string;
  requestId: string;
  sessionId?: string;
  dashboardId?: string;
  currentContext?: AnalysisContext;
  drilldownFilter?: DrilldownFilter;
  contextOverride?: ContextOverride;
};
```

Response:

```ts
type AnalyzeResponse = {
  analysisId: string;
  sessionId: string;
  context: AnalysisContext;
  plan: AnalysisPlan;
  datasets: AnalyticsDataset[];
  findings: Finding[];
  dashboard: DashboardSpec;
  assistantMessage: string;
  meta: {
    provider: "mock" | "gemini";
    model: string | null;
    mockMode: boolean;
    cacheHit: boolean;
    fallbackUsed: boolean;
    partial: boolean;
    durationMs: number;
  };
};
```

입력 규칙:

- Question 2자 이상 300자 이하
- Request Body Zod 검증
- 현재 Context와 함께 단일 `eq` Drilldown Filter 또는 Filter·비교·기간 Override 허용
- 직접 조건 조작은 원래 Context에서 변경 필드만 적용하고 모든 Query의 기간·비교·Filter를 최종 Context로 강제한다. 원래 질문에서 다시 추론한 조건은 직접 선택을 덮어쓰지 않는다.
- Drilldown과 Context Override를 같은 요청에 보내면 거부
- 동일 Cache Key의 동시 요청은 한 번 실행하고 응답 ID는 요청별로 다시 부여
- Gemini 호출별 Timeout 적용. Browser 취소 Signal의 전체 Pipeline 전달은 미구현

Error Code:

- `INVALID_INPUT`
- `UNSUPPORTED_QUESTION`
- `RATE_LIMITED`
- `DATA_UNAVAILABLE`
- `AI_UNAVAILABLE`
- `REQUEST_CANCELLED`
- `INTERNAL_ERROR`

## 9. 상태 소유권

### Server State

TanStack Query가 다음을 관리한다.

- 분석 제출 결과
- Retry 상태
- 이후 API 기반 History
- Cache 상태

### URL State

Route가 Dashboard ID를 소유한다. MVP의 검증된 `AnalysisContext`는 Analysis Result 안에 둔다.

### Local Persistence

History는 검증된 전체 `AnalyzeResponse`와 질문·저장 시각을 Local Storage에
저장한다. 읽을 때 Zod로 다시 검증하고 최근 20개로 제한한다. 같은 `sessionId`의
기록을 분석 버전으로 묶으며, 저장 기록을 열 때는 API를 다시 호출하지 않는다.
기록이 없어진 링크를 열면 질문을 사용해 재분석하는 복구 경로가 있다.

### Editor State

Zustand는 Drag, Resize, Delete, 표시 Type 변경, Undo, Redo를 관리한다.
Server Response는 기준 문서이고 Store는 사용자 편집만 보관한다. 저장은
브라우저별 최근 Dashboard 20개, Undo Stack은 30개로 제한한다.
후속 응답은 Widget ID와 호환 Family를 기준으로 편집값을 조정한다.

## 10. Server와 Client Component 정책

Page Shell, 정적 설명, Server에서 읽을 수 있는 초기 데이터는 Server Component를 사용한다.

다음은 Client Component가 될 수 있다.

- Prompt 제출
- TanStack Query Hook
- Library 특성상 필요한 Interactive Chart
- Dashboard Editor
- Local Storage History
- Browser 전용 Accessibility 동작

Client Boundary는 가능한 아래쪽에 둔다.

## 11. Cache와 비용 제어

현재 Cache Key는 `createAnalysisCacheKey()`가 다음 값을 안정적으로 직렬화한다.

```text
analysisCacheSemanticsVersion
+ AI Provider / Live 활성화 / Data Source
+ 입력 검증에서 trim된 질문
+ 현재 AnalysisContext
+ Drilldown Filter 또는 Context Override
```

현재 Key에는 실제 Dataset Version과 Gemini Model ID가 들어가지 않는다.
동일 Process에서 데이터·모델을 바꾸는 운영에서는 TTL 만료 또는 Process
재시작이 필요하다. 의미 규칙 변경 시 `analysisCacheSemanticsVersion`을 갱신한다.
자연어 동의어까지 동일 Key로 정규화하지는 않는다.

검증된 전체 응답을 LRU·TTL 메모리 Cache에 보관하며 Cache Hit는 일일 한도를
소비하지 않는다. 동일 Key의 동시 요청은 Request Deduplicator에서 합쳐진다.
Cache Miss의 새 분석은 UTC 일 기준 Client Limit을 소비한다. Mock도 이 제한을
적용받는다. 새 응답은 각 요청의 Analysis·Session·Dashboard ID로 다시 묶는다.

Cache·Rate Limit·Dedup은 단일 Server Instance 범위다. 운영 Event 저장 실패는
분석 응답을 차단하지 않는다. 다중 Instance의 공유 저장소와 배포 환경에서의
Background Event 완료 보장은 별도 운영 과제다.

## 12. Logging

운영 Metadata만 기록한다.

- Request ID
- Pipeline Stage
- Duration
- Cache Hit
- Provider와 Model ID
- Fallback 또는 Partial 여부
- 정규화된 Error Category

Secret Key, 전체 Prompt, Raw Dataset을 Log에 남기지 않는다.

## 13. 구현 상태와 목표의 구분

현재 진행 UI는 정적인 작업 단계 안내와 Loading 상태다. 실제 Planner·Query·Composer
진행 이벤트를 Stream하지 않는다. Gemini 호출 Timeout은 구현됐지만 사용자 취소
버튼과 Browser → Route → Provider 전체 취소 전파는 후속 과제다.
`PROJECT_SPEC.md`와 `QUALITY_GUIDE.md`의 Cancelled 상태는 목표 요구사항이며,
검증 완료로 간주하지 않는다. 현재 실행한 검증은 `PROGRESS.md`를 따른다.
