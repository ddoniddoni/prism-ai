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
  -> Analysis Orchestrator
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
- Recharts
- date-fns
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

재사용 가능한 표현과 사용자 상호작용을 담당한다.

Component는 Typed Props를 받는다. Gemini 호출, Supabase Query, Business Metric 계산, AI JSON Parsing을 하지 않는다.

권장 그룹:

- `components/ui`
- `components/prompt`
- `components/dashboard`
- `components/history`
- `components/status`

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

Editor Phase 이후의 Client 전용 상태를 담당한다.

- Widget Layout
- Selection
- Undo와 Redo Stack
- 저장되지 않은 편집

API Response 전체를 Zustand에 중복 저장하지 않는다.

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
│  │     ├─ analyze/route.ts
│  │     └─ health/route.ts
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ prompt/
│  │  ├─ dashboard/
│  │  ├─ history/
│  │  └─ status/
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ provider.ts
│  │  │  ├─ create-provider.ts
│  │  │  ├─ gemini-provider.ts
│  │  │  ├─ mock-provider.ts
│  │  │  ├─ prompts/
│  │  │  └─ schemas/
│  │  ├─ analytics/
│  │  │  ├─ metric-catalog.ts
│  │  │  ├─ dimension-catalog.ts
│  │  │  ├─ query-schema.ts
│  │  │  ├─ query-engine.ts
│  │  │  ├─ statistics.ts
│  │  │  ├─ findings.ts
│  │  │  └─ dashboard-sanitizer.ts
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
- 가능한 범위에서 Request ID 중복 처리
- 긴 작업에 Abort Signal 전달

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

MVP History는 Analysis Summary와 DashboardSpec을 Local Storage에 저장한다. 읽을 때 다시 검증하고 최근 20개로 제한한다.

### Editor State

Drag, Resize, Delete, Undo, Redo를 구현할 때 Zustand를 추가한다. Server Response는 기준 문서이고 Store는 사용자 편집만 보관한다.

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

이후 Phase에서 검증된 전체 Analysis Response를 다음 조합으로 Cache할 수 있다.

```text
정규화된 질문
+ Canonical Context
+ Dataset Version
+ Prompt Version
+ Provider Model ID
```

Secret이나 검증 전 Model Output은 Cache하지 않는다.

공개 Demo에서는 추천 질문 Cache와 Mock Fallback을 우선해 Quota 소진 시에도 Portfolio가 동작하도록 한다.

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
