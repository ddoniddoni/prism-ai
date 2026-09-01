# Prism AI 개발 진행 상황

## 현재 Phase

Phase 8: Portfolio 완성

## 상태

Phase 8 접근성·반응형 1차 보완, Nivo Chart 3종과 번들 성능 측정 완료 · README·Architecture Diagram·Demo 자료 진행 전 · 테스트 실행 보류

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
- 공식 Supabase SDK와 CLI를 lockfile에 고정하고, CLI로 Phase 6 migration을 생성했다.
- `analytics_daily`, Dataset Metadata, 선택적 Persisted History, 운영 Event Table을 만드는 Supabase Migration을 추가했다. 네 Table 모두 RLS를 활성화하고 `anon`·`authenticated` 권한을 제거했다.
- `SupabaseAnalyticsRepository`가 Local Repository와 동일한 Contract로 서버 전용 Secret Client에서 Row를 읽고, Snake Case DB Row를 검증된 Analytics Row로 변환한 뒤 같은 결정론적 Engine을 사용하도록 구현했다.
- Supabase 설정이 불완전하면 `DATA_SOURCE=supabase`여도 Local Repository로 안전하게 복구한다. `npm run seed:supabase`는 Local Synthetic Data와 Dataset Version을 서버 Secret으로만 적재한다.
- 의미상 같은 질문과 Context에 대해 LRU·TTL 메모리 Cache를 적용하고, Cached Response는 현재 Request·Session·Dashboard ID로 다시 묶어 식별자를 재사용하지 않는다.
- Concurrent 동일 분석은 한 번만 실행하도록 Request Deduplication을 추가했다. Cache 확인은 Rate Limit보다 먼저 수행하며, 새 분석만 UTC 일 단위 Client Limit을 소비한다.
- Gemini Live Kill Switch(`AI_LIVE_ENABLED=false`)가 즉시 Mock Provider로 복구하도록 추가했다.
- 질문·IP·Secret을 로그나 Supabase Event에 저장하지 않고, 해시된 분석 Key와 Provider·Cache·Partial·Fallback·Duration Metadata만 기록한다. Persisted History는 명시적 Opt-in일 때만 저장한다.
- Supabase Row 정규화, Cache 재결합·만료, Rate Limit, Request Deduplication, Coordinator Cache 우선순위, Kill Switch와 환경 선택에 대한 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- Google Stitch의 `Prism AI Executive Analytics` Home, Executive Dashboard, Analysis History, Processing Analysis 화면을 현재 기능에 매핑했다.
- 232px Dark Rail, 60px Top Bar, 최대 1440px 분석 Canvas, Inter Typography, Indigo Primary, Cool Gray Surface와 8~10px Radius를 공통 Workspace Shell과 Design Token에 적용했다.
- Home Prompt와 Local Dataset 상태를 Stitch의 Command Workspace 밀도로 재구성하고, 실제 Local History 최근 3개를 Home Activity에 연결했다.
- Dashboard Loading을 3단계 진행 상태와 KPI·Chart Skeleton으로 교체하고, 검증된 Dashboard Widget을 White Card, Indigo Time Series, Compact Table 문법으로 통일했다.
- Analysis History를 실제 제목·질문 검색과 Live/Mock Filter가 동작하는 고밀도 Table로 바꾸고, 기존 재열기와 삭제 동작을 유지했다.
- Mobile에서는 Dark Rail 대신 Compact Header와 Home·History·New Analysis 경로를 제공하며, Skeleton Animation은 `prefers-reduced-motion`에서 중지한다.
- Product Shell E2E 기대값을 새 Heading, Dataset Label, History Table 재열기 경로에 맞춰 갱신했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- `react-grid-layout` 2.2.4와 Zustand 5.0.15를 추가하고, 무거운 Dashboard Editor를 분석 완료 뒤 동적으로 로드하도록 분리했다.
- Dashboard에 편집 모드, Drag·Resize, 위젯별 앞/뒤 이동, 삭제, Undo·Redo, 초기화를 추가했다. 모바일 Layout은 1열이며 Drag를 쓰지 않아도 순서를 바꿀 수 있다.
- 호환 Widget Family 안에서 Category Bar와 Donut, Ranking Table과 Data Table을 전환하며 실제 시각 표현과 Table Column이 함께 바뀌도록 구현했다.
- Editor Store는 Layout·숨김 Widget ID·표시 Type Override만 Versioned Local Storage에 저장한다. Hydration Payload는 Zod로 검증하고 최근 Dashboard 20개, Undo History 30개로 제한했다.
- 후속 분석은 같은 Widget ID의 사용자 편집을 보존하고, 새 Widget은 아래에 추가하며, 서버에서 제거되거나 Family가 바뀐 Widget의 오래된 편집은 버리는 명시적 Reconcile Policy를 사용한다.
- 분석 API 응답과 요청 상태는 TanStack Query가 소유하고, Zustand는 사용자 편집 상태만 소유하도록 Client State 경계를 정리했다.
- 편집 상태 Model Unit Test와 편집·복구·새로고침 보존 E2E 시나리오를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- 모든 Workspace 화면에 본문 건너뛰기 Link, 일관된 `:focus-visible`, Heading Anchor Scroll Margin, Mobile Touch Target, Reduced Motion Fallback을 적용했다.
- Home·Follow-up Form에 `name`·`autocomplete`·Enter Key Hint를 추가하고, 유효성 오류가 발생하면 해당 입력칸에 다시 Focus하도록 보완했다.
- 차트에 Screen Reader용 계산 요약과 Table Caption을 추가하고, 증감률은 색상뿐 아니라 상승·하락·변화 없음 텍스트를 함께 표시한다.
- Dashboard Editor 조작과 History 검색 결과를 Live Region으로 알리고, History 삭제는 8초 실행 취소 창을 제공하도록 바꿨다.
- 접근성 보완에 대한 Formatter·History Storage Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- MIT 라이선스인 `@nivo/line`으로 `PrismTrendChart`를 구성했다. Chart Bundle은 Dashboard에서만 동적으로 로드한다.
- Trend Chart는 Gradient Area, Spring Transition, Comparison Line, Tooltip, Crosshair와 Reduced Motion Fallback을 제공하며 원본 데이터 표는 유지한다.
- PrismTrendChart의 Nivo Series·X Axis Tick 변환 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- Trend Chart의 Y Axis는 지표에 따라 K·M·B 축약 표기를 사용하고, Tooltip은 날짜와 현재·비교 기간의 실제 값을 표시한다. 밀집된 데이터 Point는 숨기고 Crosshair로만 강조한다.
- MIT 라이선스의 `@nivo/pie`로 `PrismDonutChart`를 구성해 기존 CSS Conic Gradient를 대체했다. 이 Bundle도 Dashboard에서만 동적으로 로드한다.
- Donut Chart는 분리된 Rounded Arc, Reduced Motion Fallback, 중앙 합계, 범례의 실제 값·구성비, Hover Tooltip과 Screen Reader용 계산 요약을 제공한다. Null·0 값은 그릴 수 있는 Segment에서 제외한다.
- Donut Chart의 넓은 Desktop Card에서도 도넛·세그먼트 정보가 벌어지지 않도록 최대 폭을 제한했다. 바깥 WidgetFrame을 유일한 카드로 유지하고, 내부 배경 Card와 세그먼트별 Card 테두리는 제거해 Dashboard 밀도를 높였다. 범례는 이름·실제 금액·비중·가느다란 비중 Bar를 구분선 기반 행으로 묶고, 중앙 합계는 지표명을 포함한 축약 표기로 빠르게 읽을 수 있게 했다.
- Dashboard Editor는 기존 표시 타입 기준의 고정 Height와 `overflow-auto` 때문에 확장된 Donut 범례에 내부 Scroll이 생겼다. 타입 Override를 적용한 실제 Widget으로 Layout을 정규화하고, 컴팩트한 Donut의 기본·최소 Height는 8행으로 고정해 내부 Scroll 없이 카드 점유를 줄였다.
- Dashboard Grid의 기본 Stretch가 같은 Row의 큰 Chart 높이만큼 Donut Card까지 늘리고, 이전 Scroll Fix의 전역 `overflow-visible`이 다른 Chart를 Card 밖으로 넘치게 한 회귀를 수정했다. WidgetFrame은 `self-start`로 콘텐츠 높이를 유지하며, Editor에서만 Donut은 자연 높이·다른 Widget은 기존 고정 높이와 Overflow 규칙을 사용한다.
- PrismDonutChart의 Nivo Datum 변환과 합계·구성비 계산 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- MIT 라이선스의 `@nivo/bar`로 기존 CSS Category Bar를 `PrismRankedBarChart`로 대체했다. 이 Bundle도 Dashboard에서만 동적으로 로드한다.
- Ranked Bar Chart는 값 기준 내림차순, 1위 Indigo 강조, 끝값의 K·M·B 축약 표기, Hover Tooltip, Keyboard Focus와 Screen Reader 순위 요약을 제공한다. 비교 데이터가 있으면 Tooltip에 상승·하락 문구를 함께 표시한다.
- PrismRankedBarChart의 정렬·강조색·높이 계산 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- `npm run analyze:bundle`과 Manifest 기반 측정기를 추가했다. Dashboard 초기 Client Asset과 지연 로드되는 Editor·Nivo Chart Bundle을 raw/gzip 크기로 재현 가능하게 기록했다.
- `docs/PERFORMANCE.md`에 현재 production build의 실제 정적 Bundle 크기와, Chart별 크기는 공통 Chunk 때문에 합산하지 않는다는 해석 범위를 기록했다.
- Dashboard Editor의 모든 Widget Card는 바깥 `overflow-auto`를 제거하고 `ResizeObserver`로 콘텐츠 높이에 맞춰 Grid 행을 자동 확장한다. Card 내부 Scroll이나 아래 Widget과의 겹침이 생기지 않으며, 원본 Data Table과 일반 Table의 필요한 내부 Scroll은 유지한다.
- Dashboard는 실제 Widget 조합을 기준으로 단일 KPI+추이 4:8을 먼저 배치하고, 보조 분석을 KPI·추이 아래의 4:8 Lane에 차례로 쌓아 빈 영역을 줄인다. 단독 Insight는 전체 폭이며, 태블릿은 6열·모바일은 1열로 전환되고 Nivo Chart도 각 Card 폭과 높이에 맞춰 다시 그려진다.
- Evidence Mosaic의 span 계산 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- 기존에 저장된 Layout은 `auto`로 마이그레이션해 새 Mosaic 규칙으로 즉시 재배치한다. 이후 실제 Drag·Resize·표시 타입·숨김 편집 뒤에만 `custom` Layout으로 보존하며, 시스템이 측정해 확장한 Card 높이는 재배치 뒤에도 유지한다.
- Mock Planner에 `서울에서 산 제품들 판매량만 보여줘` 예시를 추가했다. 한국어 지역명 `서울`을 Dataset의 허용 값 `Seoul`로 매핑하고, `unitsSold`를 상품별로 집계하는 검증된 Query DSL만 생성한다.
- MIT 라이선스의 `@nivo/bar`로 `PrismStackedBarChart`를 추가했다. 이 Chart도 Dashboard에서만 동적으로 로드하며, 동일 기간의 Desktop·Mobile·Tablet 일자별 Query를 실제로 누적해 표시한다.
- `stackedBar`를 Dashboard Schema·Sanitizer·Component Registry·Evidence Mosaic에 등록했다. 2개 미만의 유효한 Series 참조는 제거하며, 표시값은 각 Query가 결정론적으로 계산한 DataPoint만 사용한다.
- Mock Planner가 `지난달 매출의 디바이스별 구성을 보여줘`를 3개의 독립된 디바이스 `date` Query로 변환하고, Home 추천 질문에서 바로 실행할 수 있게 했다.
- `PrismStackedBarChart`는 상단 여유가 부족한 막대의 Tooltip을 `bottom` Anchor로, 나머지는 `top` Anchor로 렌더링한다. Nivo 기본 Bar Tooltip이 항상 `top` Anchor를 선택해 `overflow-hidden` Chart Panel 상단에서 잘리던 문제를 전용 Bar Renderer로 해결했고, 키보드 Focus에도 같은 배치 규칙을 적용했다.
- 전용 Bar Renderer가 Nivo의 내부 Bar 객체를 Tooltip JSX에 전달할 때 React 전용 `key`를 제외했다. 개발 콘솔의 Key Spread 경고 없이 동일한 Tooltip 정보를 표시한다.
- 시간대가 없는 일별 Dataset의 의미를 보존하기 위해 `PrismCalendarHeatmap`을 추가했다. 매출 시계열을 주차 × 요일 셀로 변환하고, 결정론적 DataPoint 값에 비례한 Indigo 색 농도로 집중일을 표시한다.
- Calendar Heatmap은 Hover·Click·Keyboard Focus에서 선택 날짜와 실제 계산값을 안전한 고정 Detail Panel에 표시한다. 상단·하단 Tooltip이 Card 경계에서 잘리는 문제 없이 Screen Reader에도 선택 날짜를 알린다.
- `calendarHeatmap`을 Dashboard Schema·Component Registry·Evidence Mosaic에 등록했고, `지난달 매출 집중도를 달력 히트맵으로 보여줘` 예시가 기존 일별 매출 Query를 재사용하도록 Mock Planner에 추가했다.
- Calendar Heatmap은 큰 유동 셀 대신 28px/36px 고정 날짜 셀로 압축했다. 각 셀은 일자를 표시하고, 선택일자 Badge·주말 보조 톤·Active Ring으로 넓은 Dashboard Card 안에서도 작은 분석 캘린더를 의도적으로 읽을 수 있게 했다.
- Calendar Heatmap은 4-column 컴팩트 보조 위젯으로 배치한다. 중첩된 바깥 패널과 장황한 설명을 없애고, 20px/24px 날짜 셀과 7-row Editor 높이로 줄여 캘린더 자체에 맞는 밀도를 유지한다. Auto Layout은 실제 렌더된 콘텐츠 높이를 다시 측정해, 기존에 저장된 큰 카드 높이도 축소한다.
- 모든 Widget Card의 기본 패딩과 헤더 간격을 줄이고, 실제 분석 밀도에 맞춰 Chart Canvas와 Editor 기본 행 높이를 낮췄다. 추이·누적 막대·도넛·랭킹은 축·Tooltip·키보드 접근성을 유지하는 범위에서 작은 카드 비율로 재구성하며, 데이터 표와 사용자가 직접 조정한 카드의 높이는 강제 축소하지 않는다.
- `KPI + Time Series + Calendar Heatmap + Comparison` 결과는 일반적인 좌측 세로 스택 대신 `KPI·캘린더`의 compact rail과 `추이·비교`의 wide canvas로 자동 배치한다. 초기 CSS Grid와 편집 가능 Grid가 같은 시각 순서를 사용해 로딩 직후에도 큰 빈 영역 없이 읽힌다.

## 진행 중

- Phase 8의 Accessibility·Responsive 1차 보완, Nivo 기반 `PrismTrendChart`·`PrismDonutChart`·`PrismRankedBarChart`, 재현 가능한 정적 Bundle 측정을 마쳤다. 다음 README, Architecture Diagram, Screenshot, Demo Scenario와 배포 준비가 남아 있다.

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
| 2026-08-31 | Supabase는 서버 Secret Client와 RLS·권한 회수로만 접근 | 공개 Demo가 Data API를 통해 Raw Analytics·History·Operation Event에 접근하지 못하게 하기 위함 |
| 2026-08-31 | 분석 Cache는 요청 식별자를 제외한 질문·Context·실행 Scope를 Key로 사용 | 같은 분석 작업을 재사용하면서도 Response의 Analysis·Session·Dashboard ID는 현재 요청에 귀속하기 위함 |
| 2026-08-31 | Rate Limit은 Cache Miss에만 UTC 일 단위로 적용 | Cached Demo가 Limit이나 Provider 장애로 막히지 않게 하고, 새 분석의 비용만 제한하기 위함 |
| 2026-08-31 | 운영 기록은 Raw Question 대신 SHA-256 분석 Key만 사용 | Prompt나 식별 정보를 보관하지 않고 복구 상태를 관측하기 위함 |
| 2026-08-31 | Stitch `Prism AI Executive Analytics`를 UI Source of Truth로 사용 | 현재 제품 기능은 유지하면서 Home·Dashboard·History·Processing 전반의 시각 언어와 화면 밀도를 일관되게 맞추기 위함 |
| 2026-08-31 | Stitch에 없는 기능은 동일 Token과 Component Grammar로 확장 | Local Dataset 상태, Follow-up, Recoverable Error, History 삭제처럼 현재 제품에만 있는 기능도 별도 스타일로 분리되지 않게 하기 위함 |
| 2026-09-01 | Server Analysis State는 TanStack Query, 사용자 Dashboard 편집은 Zustand가 소유 | API 응답과 Local UI Override를 분리해 후속 분석 실패 중에도 성공 Dashboard와 사용자 Layout을 독립적으로 보존하기 위함 |
| 2026-09-01 | Editor Persistence는 Widget ID 기반 최소 Override와 명시적 Reconcile Policy를 사용 | AI가 후속 Widget을 다시 구성해도 같은 Widget의 편집은 유지하고 오래되거나 호환되지 않는 편집만 안전하게 제거하기 위함 |
| 2026-09-01 | Dashboard Grid는 `react-grid-layout` 2.2.4를 동적 로드 | Drag·Resize와 반응형 Layout을 직접 재구현하지 않고 Editor Bundle을 분석 완료 전 경로에서 분리하기 위함 |
| 2026-09-01 | 삭제 작업은 가능한 경우 즉시 영구 제거 대신 Undo Window를 제공 | Local History와 Dashboard Widget 삭제가 실수로 발생해도 사용자가 같은 흐름 안에서 복구할 수 있게 하기 위함 |
| 2026-09-01 | 차트의 시각 상태는 텍스트 요약·표·상승/하락 문구로 중복 전달 | 색상, SVG만 읽을 수 없는 환경에서도 결정론적 Dataset 근거와 변화 방향을 이해할 수 있게 하기 위함 |
| 2026-09-01 | Trend Chart는 MIT 라이선스의 Nivo를 동적 로드 | D3·react-spring 기반의 높은 시각 완성도와 Tooltip·접근성 기능을 사용하면서 초기 Dashboard Bundle을 키우지 않기 위함 |
| 2026-09-01 | Donut Chart도 Nivo Pie를 동적 로드 | 기존 Conic Gradient보다 Arc 간격·Hover·Motion을 정교하게 제어하면서 Trend Chart와 같은 검증된 시각화 경로를 유지하기 위함 |
| 2026-09-01 | Category Bar는 Nivo Bar를 동적 로드 | 같은 검증된 Chart Stack에서 순위·Tooltip·Keyboard 접근을 제공하고, 기존 CSS Progress Bar보다 정교한 순위 표현을 만들기 위함 |
| 2026-09-01 | 성능은 Build Manifest의 raw·gzip Asset 크기로 반복 측정 | 브라우저 체감 성능을 추정하지 않고 초기 Dashboard와 지연 로드 Bundle 경계를 재현 가능한 수치로 기록하기 위함 |
| 2026-09-01 | 모든 Widget Card는 콘텐츠 높이에 맞춰 Editor Grid 행을 자동 확장 | 바깥 Card Scroll을 제거하면서 고정 Grid 안의 콘텐츠 겹침을 막고, Table 전용 내부 Scroll은 유지하기 위함 |
| 2026-09-01 | Dashboard는 질문 결과에 맞춰 Evidence Mosaic Layout을 사용 | 정해진 순서의 빈 Grid Cell 대신 KPI·추이·보조 분석·근거의 정보 우선순위에 따라 Canvas를 채우고, 1024px 이상 콘텐츠 영역에서는 Desktop Mosaic을 적용하기 위함 |
| 2026-09-02 | 누적 막대는 Series별 검증된 Query를 쌓아서 렌더링 | 현재 Query DSL의 단일 Grouping 제약을 우회해 임의 비즈니스 값이나 잘못된 비교값을 합산하지 않고, 같은 날짜·지표의 결정론적 세그먼트 합계를 표현하기 위함 |
| 2026-09-02 | 시간대 대신 주차 × 요일 캘린더 히트맵을 사용 | 현재 Dataset은 일별 Aggregate이므로 존재하지 않는 시간대 정보를 추정하지 않고, 실제 날짜 기반의 매출 집중도를 표현하기 위함 |

## 검증 결과

- `npm run lint`: 통과 (Phase 8 PrismCalendarHeatmap)
- `npm run typecheck`: 통과 (Phase 8 PrismCalendarHeatmap)
- `npm run build`: 통과 (Phase 8 PrismCalendarHeatmap, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Phase 8 PrismCalendarHeatmap)
- `npm run lint`: 통과 (Calendar Heatmap Compact Card Layout)
- `npm run typecheck`: 통과 (Calendar Heatmap Compact Card Layout)
- `npm run build`: 통과 (Calendar Heatmap Compact Card Layout, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Calendar Heatmap Compact Card Layout)
- `npm run lint`: 통과 (Dashboard Compact Card Density)
- `npm run typecheck`: 통과 (Dashboard Compact Card Density)
- `npm run build`: 통과 (Dashboard Compact Card Density, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Dashboard Compact Card Density)
- `npm run format:check`: 기존 `src/lib/data/supabase-repository.test.ts` 형식 경고로 미통과 (이번 변경 범위 밖, 파일 미수정)
- `npm run lint`: 통과 (Dashboard Smart Mosaic Layout)
- `npm run typecheck`: 통과 (Dashboard Smart Mosaic Layout)
- `npm run build`: 통과 (Dashboard Smart Mosaic Layout, Next.js Webpack production build)
- `npm run lint`: 통과 (PrismCalendarHeatmap Compact Date Cells)
- `npm run typecheck`: 통과 (PrismCalendarHeatmap Compact Date Cells)
- `npm run build`: 통과 (PrismCalendarHeatmap Compact Date Cells, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (PrismCalendarHeatmap Compact Date Cells)
- 로컬 브라우저 시각 점검: 미실행 (현재 세션에 연결 가능한 Browser 없음)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Phase 8 PrismStackedBarChart)
- `npm run typecheck`: 통과 (Phase 8 PrismStackedBarChart)
- `npm run build`: 통과 (Phase 8 PrismStackedBarChart, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Phase 8 PrismStackedBarChart)
- `npm run lint`: 통과 (PrismStackedBarChart Tooltip Anchor)
- `npm run typecheck`: 통과 (PrismStackedBarChart Tooltip Anchor)
- `npm run build`: 통과 (PrismStackedBarChart Tooltip Anchor, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (PrismStackedBarChart Tooltip Anchor)
- `npm run lint`: 통과 (PrismStackedBarChart Tooltip Key Spread)
- `npm run typecheck`: 통과 (PrismStackedBarChart Tooltip Key Spread)
- `npm run build`: 통과 (PrismStackedBarChart Tooltip Key Spread, Next.js Webpack production build)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Phase 8 Evidence Mosaic Layout)
- `npm run typecheck`: 통과 (Phase 8 Evidence Mosaic Layout)
- `npm run build`: 통과 (Phase 8 Evidence Mosaic Layout, Next.js Webpack production build)
- 로컬 브라우저 1440px Viewport (콘텐츠 영역 1144px): KPI 368px + 추이 756px의 4:8 Desktop Mosaic 적용 확인. 같은 개발 세션에서 분석 화면을 반복 새로고침한 뒤 Mock `/api/analyze` 요청 제한(429)이 발생해, 최종 계단형 배치의 추가 시각 재실행은 보류했다.
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Phase 8 Widget Card Scroll Removal)
- `npm run typecheck`: 통과 (Phase 8 Widget Card Scroll Removal)
- `npm run build`: 통과 (Phase 8 Widget Card Scroll Removal, Next.js Webpack production build)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run build`: 통과 (Phase 8 Bundle Measurement, Next.js Webpack production build)
- `npm run analyze:bundle`: 통과 (Dashboard 초기 748.7 KiB raw / 223.6 KiB gzip, 상세 결과는 `docs/PERFORMANCE.md`)
- `npm run lint`: 통과 (Phase 8 Bundle Measurement)
- `npm run typecheck`: 통과 (Phase 8 Bundle Measurement)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

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
- `npm run lint`: 통과 (Phase 7 Dashboard Editing)
- `npm run typecheck`: 통과 (Phase 7 Dashboard Editing)
- `npm run build`: 통과 (Phase 7 Dashboard Editing, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 7 Dashboard Editing)
- `npm run format:check`: 미통과 (이번 변경과 무관한 기존 `src/lib/data/supabase-repository.test.ts` 포맷 불일치 1건)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 Accessibility·Responsive)
- `npm run typecheck`: 통과 (Phase 8 Accessibility·Responsive)
- `npm run build`: 통과 (Phase 8 Accessibility·Responsive, Next.js Webpack production build)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 PrismTrendChart)
- `npm run typecheck`: 통과 (Phase 8 PrismTrendChart)
- `npm run build`: 통과 (Phase 8 PrismTrendChart, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 PrismTrendChart)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 Nivo Trend Chart)
- `npm run typecheck`: 통과 (Phase 8 Nivo Trend Chart)
- `npm run build`: 통과 (Phase 8 Nivo Trend Chart, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 Nivo Trend Chart)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 Nivo Trend Chart Polish)
- `npm run typecheck`: 통과 (Phase 8 Nivo Trend Chart Polish)
- `npm run build`: 통과 (Phase 8 Nivo Trend Chart Polish, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 Nivo Trend Chart Polish)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 7 Stitch UI)
- `npm run typecheck`: 통과 (Phase 7 Stitch UI)
- `npm run build`: 통과 (Phase 7 Stitch UI, Next.js Webpack production build)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 6)
- `npm run typecheck`: 통과 (Phase 6)
- `npm run build`: 통과 (Phase 6, Next.js Webpack production build)
- `npm audit signatures`: 통과 (757 registry signatures, 192 attestations verified)
- `npm exec supabase -- migration list --local`: 미통과 (Local Supabase Docker/Postgres가 기동되지 않아 `127.0.0.1:54322` 연결 거부)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
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
- `npm run lint`: 통과 (Phase 8 PrismDonutChart)
- `npm run typecheck`: 통과 (Phase 8 PrismDonutChart)
- `npm run build`: 통과 (Phase 8 PrismDonutChart, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 PrismDonutChart)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 PrismDonutChart Layout Polish)
- `npm run typecheck`: 통과 (Phase 8 PrismDonutChart Layout Polish)
- `npm run build`: 통과 (Phase 8 PrismDonutChart Layout Polish, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 PrismDonutChart Layout Polish)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 PrismDonutChart Scroll Fix)
- `npm run typecheck`: 통과 (Phase 8 PrismDonutChart Scroll Fix)
- `npm run build`: 통과 (Phase 8 PrismDonutChart Scroll Fix, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 PrismDonutChart Scroll Fix)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 PrismDonutChart Compact Layout)
- `npm run typecheck`: 통과 (Phase 8 PrismDonutChart Compact Layout)
- `npm run build`: 통과 (Phase 8 PrismDonutChart Compact Layout, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 PrismDonutChart Compact Layout)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 Dashboard Card Sizing Fix)
- `npm run typecheck`: 통과 (Phase 8 Dashboard Card Sizing Fix)
- `npm run build`: 통과 (Phase 8 Dashboard Card Sizing Fix, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 Dashboard Card Sizing Fix)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)
- `npm run lint`: 통과 (Phase 8 PrismRankedBarChart)
- `npm run typecheck`: 통과 (Phase 8 PrismRankedBarChart)
- `npm run build`: 통과 (Phase 8 PrismRankedBarChart, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`: 통과 (Phase 8 PrismRankedBarChart)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

## 알려진 제한 사항

- Live Gemini 호출은 사용자 Key와 실제 API Quota가 있어야 검증할 수 있다. SDK Abort Signal은 클라이언트 대기를 중단하지만 Google 서비스 측 작업이나 사용량 청구를 보장해 취소하지는 않는다.
- In-memory Cache와 Rate Limit·Request Deduplication은 단일 Server Instance 범위다. 여러 Instance에서 공유하려면 Redis 또는 Platform Durable Cache가 필요하다.
- Supabase Project·Key가 아직 제공되지 않아 Migration 적용, `seed:supabase`, 실제 Row Query, RLS Advisor와 Database Test는 실행하지 않았다.
- `.env.local`은 생성하지 않았고, 기본 Mock Mode는 환경 변수 없이 동작한다.
- Stitch UI와 Dashboard Editing의 Runtime Browser·E2E 시각 검증은 사용자 요청에 따라 실행하지 않았다.
- 정적 Bundle 크기만 기록했다. 배포 환경의 실제 Web Vitals와 Network Waterfall은 아직 측정하지 않았다.
- Dashboard 편집값은 계정 동기화가 아닌 브라우저별 Local Storage에만 저장된다.
- Repository 전체 `format:check`는 기존 `src/lib/data/supabase-repository.test.ts` 포맷 불일치 1건 때문에 실패한다. Phase 7 변경 파일은 별도 검사에서 모두 통과했다.

## 다음 권장 작업

README에서 Frontend·AI·성능 설계 결정을 정리한 뒤 Architecture Diagram과 Portfolio Demo 자료를 완성한다.
