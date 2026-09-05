# Prism AI 구현 계획

## 1. 개발 전략

Vertical Slice 방식으로 개발한다. 첫 목표는 화려한 Live AI가 아니라 Local Synthetic Data와 `MockAIProvider`로 전체 Pipeline이 검증되는 버전이다.

위험을 줄이는 순서:

```text
Project Bootstrap
-> Local Data
-> Deterministic Query Engine
-> Finding
-> Mock Planning
-> Dynamic Dashboard Registry
-> Follow-up Context
-> Live Gemini Adapter
-> 비용 제어
-> Editor와 Portfolio 완성
```

Mock Vertical Slice가 동작하기 전에 Supabase, Drag and Drop, Live AI부터 만들지 않는다.

## 2. npm Bootstrap

빈 상위 Directory에서 시작하는 경우:

```bash
npx create-next-app@latest prism-ai \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd prism-ai
```

현재 개발 환경에서 지원되는 Node LTS를 사용한다. Project 생성 후 실제 Node Version을 `.nvmrc`와 README에 기록한다.

## 3. Dependency

기존 Checkout은 `npm ci`로 `package-lock.json`을 복원한다. 아래 목록은
현재 선택한 Runtime을 설명하는 Bootstrap 참고이며 기존 프로젝트에 재설치하지 않는다.
초기 후보였던 Recharts, date-fns, nanoid, Faker는 현재 사용하지 않는다.
차트는 Nivo와 자체 Calendar Heatmap, ID는 플랫폼 API, 데이터는 고정 시드 생성기를 사용한다.

Core Runtime:

```bash
npm install \
  @tanstack/react-query \
  zod \
  zustand \
  @nivo/line \
  @nivo/pie \
  @nivo/bar \
  react-grid-layout \
  clsx \
  tailwind-merge \
  class-variance-authority \
  lucide-react
```

AI Integration Phase:

```bash
npm install @google/genai
```

Supabase Phase:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Development와 Test:

```bash
npm install -D \
  vitest \
  @vitejs/plugin-react \
  jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  prettier \
  prettier-plugin-tailwindcss \
  tsx
```

기본 Application이 실행된 뒤 shadcn/ui를 초기화한다.

```bash
npx shadcn@latest init
```

현재 Phase에서 쓰는 Component만 추가한다. 초기 후보:

```bash
npx shadcn@latest add button card input textarea badge skeleton alert
```

Editor Phase에서만 설치한다.

```bash
npm install react-grid-layout
npm install -D @types/react-grid-layout
```

Playwright Browser:

```bash
npx playwright install
```

## 4. 필수 package script

목표 `package.json` script:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "seed:generate": "tsx scripts/generate-seed.ts",
    "seed:supabase": "tsx scripts/seed-supabase.ts",
    "check": "npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

생성된 Next.js Version이 다른 유효한 Lint Command를 제공하면 설치된 Version에 맞게 Script를 조정한다. Lint 자체를 생략하지 않는다.

## 5. 환경 변수

Bootstrap에서 `.env.example`을 만든다.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATA_SOURCE=local
AI_PROVIDER=mock

GEMINI_API_KEY=
GEMINI_MODEL=
AI_REQUEST_TIMEOUT_MS=12000
AI_MAX_CALLS_PER_ANALYSIS=2
DEMO_DAILY_LIMIT=10

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

규칙:

- `.env.local`은 Git에서 제외한다.
- `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`는 Server 전용이다.
- 기본값은 Mock Mode다.
- Live Mode는 Key와 명시적인 Model 설정이 모두 있어야 한다.
- Model 지원 여부와 가격은 Runtime 설정 문제이며 Repository에 고정된 전제로 두지 않는다.
- `src/lib/env.ts`에서 환경 변수를 검증한다.

## 6. Phase 0: Bootstrap

구현 항목:

- npm 기반 Next.js App Router
- TypeScript strict
- Tailwind와 shadcn/ui 기본 설정
- TanStack Query Provider
- Vitest와 Playwright 설정
- package script
- `.env.example`
- `.nvmrc`
- Project 문서 배치
- `docs/PROGRESS.md` 초기화

완료 조건:

- 외부 API Key가 필요하지 않음
- `npm run check` 통과
- 최소 Home Page 렌더링

Codex Prompt 예시:

```text
AGENTS.md, docs/IMPLEMENTATION_PLAN.md, docs/PROGRESS.md를 읽고 Phase 0만 구현해.
패키지 매니저는 npm만 사용하고 Gemini와 Supabase 구현은 아직 추가하지 마.
npm run check를 통과시킨 뒤 docs/PROGRESS.md에 실제 검증 결과를 기록해.
```

## 7. Phase 1: Product Shell과 Local Data

구현 항목:

- Home Page
- Dashboard Route Shell
- History Route Shell
- Prompt Input과 추천 질문
- Analysis Status Component
- Fixed Seed Synthetic Data Generator
- 생성된 Local Data File
- `LocalAnalyticsRepository`
- 사용 가능한 데이터 기간 표시

완료 조건:

- 지원 Sample Question 제출 시 Mock Dashboard Route로 이동
- Local Data 생성 결과가 매번 동일
- Gemini와 Supabase가 없어도 동작

## 8. Phase 2: Analytics Engine

구현 항목:

- Metric Catalog
- Dimension Catalog
- Query DSL과 Zod Schema
- Period Resolution
- Filter, Grouping, Sort, Limit
- Compare Period 실행
- Deterministic Statistics
- Finding 생성
- Unit Test

완료 조건:

- 대표 합성 데이터에서 Mobile과 Fashion이 주요 하락 기여 Segment로 계산됨
- Formula와 Edge Case Test 존재
- Analytics Code에 React와 AI Dependency 없음

Codex Prompt 예시:

```text
AGENTS.md, docs/ANALYTICS_AI_SPEC.md, docs/PROGRESS.md를 읽고 Phase 2를 구현해.
테스트를 먼저 작성하고 모든 계산은 결정론적으로 만들어.
최근 Mobile Fashion 하락은 UI Hardcode가 아니라 생성 데이터 계산 결과로 나와야 해.
npm run check를 실행하고 docs/PROGRESS.md를 갱신해.
```

## 9. Phase 3: Mock AI와 Dynamic Dashboard

구현 항목:

- `AIProvider` Interface
- `MockAIProvider`
- AnalysisPlan Schema
- DashboardSpec Schema
- Semantic Validator와 Sanitizer
- Component Registry
- Dashboard Renderer
- Analysis Orchestration Service
- `POST /api/analyze`
- 첫 E2E Scenario

완료 조건:

- 지원 질문에 따라 다른 Plan과 Dashboard Layout 생성
- 모든 Value가 Dataset과 Finding에서 연결됨
- Mock Output이 Live와 동일한 Validation 통과
- Model Key가 필요하지 않음

## 10. Phase 4: Follow-up Context와 History

구현 항목:

- Session과 Context 처리
- 명시적인 Context Patch
- Dashboard Follow-up Prompt
- Loading과 Error 중 기존 Dashboard 유지
- 최근 20개 Local Storage History
- 저장 Payload 검증
- 필요 시 Dashboard Version과 Restore

완료 조건:

- `모바일만 자세히 분석해줘`가 기존 기간과 Metric을 유지
- `작년 같은 기간과 비교해줘`가 Mobile Filter를 유지
- 저장된 Analysis를 다시 열 수 있음

## 11. Phase 5: Gemini Provider

구현 항목:

- `GeminiAIProvider`
- 공식 `@google/genai`
- Structured JSON Output
- JSON Schema와 Zod 검증
- Semantic Validation
- Timeout과 Cancel
- 교정 Retry 1회 정책
- Deterministic Fallback
- Mocked Integration Test

완료 조건:

- 유효한 환경 변수가 있을 때 `AI_PROVIDER=gemini` 동작
- 설정이 없거나 실패하면 안전하게 Fallback
- 자동 테스트가 Live Key를 사용하지 않음
- Live Call이 설정한 Budget 안에 있음

Codex Prompt 예시:

```text
AGENTS.md, docs/ARCHITECTURE.md, docs/ANALYTICS_AI_SPEC.md,
docs/QUALITY_GUIDE.md, docs/PROGRESS.md를 읽어.
Gemini Provider와 관련 테스트만 구현해.
npm으로 @google/genai를 사용하고 설치된 SDK Type을 먼저 확인해.
Structured JSON Output과 Zod 검증을 적용하고 AI가 만든 SQL이나 코드를 실행하지 마.
테스트에서는 Gemini를 실제 호출하지 마.
```

## 12. Phase 6: Supabase와 운영 복구

구현 항목:

- Supabase Migration
- `SupabaseAnalyticsRepository`
- 선택적 Persisted History
- Cache
- 공개 Demo Rate Limit
- Request Deduplication
- Partial Query Result
- Provider Kill Switch
- 운영 Metadata Logging

완료 조건:

- Local과 Supabase Repository가 동일 Contract를 만족
- Rate Limit이나 Provider 장애가 Cached Demo와 Mock Demo를 막지 않음
- Secret이 Server에만 존재

## 13. Phase 7: Dashboard Editing

구현 항목:

- Drag와 Resize
- 호환 Widget Family 안에서 Chart Type 변경
- Delete
- Undo와 Redo
- Local Layout 저장
- Widget별 편집 Control

완료 조건:

- 일반 Interaction 중 사용자 편집이 유지됨
- 후속 분석이 사용자 Layout을 임의 삭제하지 않고 명시적 Merge Policy를 따름
- Editor State는 Zustand, Server State는 TanStack Query가 소유

Portfolio 일정이 촉박하면 이 Phase는 생략할 수 있다.

## 14. Phase 8: Portfolio 완성

구현 항목:

- Responsive Layout
- Accessibility Audit
- Chart Table Alternative
- Performance 측정
- README
- Architecture Diagram
- Screenshot
- 짧은 Demo Video Scenario
- 배포된 Mock Fallback
- 대표 Scenario E2E

완료 조건:

- `npm run check` 통과
- `npm run test:e2e` 통과
- Live API Quota 없이 대표 Demo 가능
- README에서 Frontend와 AI 설계 결정을 설명

## 15. Progress 기록 규칙

각 Phase가 끝날 때 `docs/PROGRESS.md`에 다음을 기록한다.

- 현재 Phase
- 완료 항목
- 바뀐 Architecture Decision
- 실제 실행 명령과 결과
- 실패 또는 실행하지 못한 검증
- 다음 작은 작업

미래 작업을 완료로 표시하지 않고, 실행하지 않은 검증을 추정하지 않는다.

## 16. Integration 전 다시 확인할 공식 문서

SDK와 CLI는 바뀔 수 있으므로 해당 Phase 구현 직전에 최신 사용법을 확인한다.

- Codex Project Guidance: `https://developers.openai.com/codex/agent-configuration/agents-md`
- Next.js Installation: `https://nextjs.org/docs/app/getting-started/installation`
- create-next-app CLI: `https://nextjs.org/docs/app/api-reference/cli/create-next-app`
- Gemini Structured Output: `https://ai.google.dev/gemini-api/docs/structured-output`
