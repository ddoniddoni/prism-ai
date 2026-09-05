# Prism AI 개발 진행 상황

## 현재 Phase

Phase 8: Portfolio 완성

## 상태

Phase 8 공통 탐색·홈 이동·질문 입력 개선, Dashboard 모듈 분리와 문서 현행화 완료 · 테스트·브라우저 검증 보류

## 완료

- 2026-09-06 화면 한글화: Home·합성 데이터 안내·History 표·분석 오류·버전 기록·입력 키 안내·페이지 Metadata의 영문 문구를 한글로 통일했다. 제품명 Prism AI와 내부 Schema Key는 유지하고 사용자가 직접 입력한 질문은 변환하지 않는다.
- History의 원본 기간·Filter Value를 기존 한글 Formatter로 표시하고, Live/Mock Badge와 Gemini 표시를 한글화했다. ROAS 표시명은 광고 수익률, VIP 고객은 우수 고객으로 바꿨다.
- 저장된 시스템 문구의 Query·Finding 등은 표시 시 한글화한다. 기존 AI 생성 영어 제목은 알려진 번역을 적용하고 남는 영어가 있으면 검증된 지표/위젯 기반 한글 제목으로 표시한다. 기록 검색·삭제·복원 안내도 표시 제목을 사용한다.
- Composer Prompt에 사용자 표시 문구는 한국어, Schema Key·참조 ID·원본 차원값은 유지하도록 명시했다. 한글 표시용 회귀 Unit Test를 추가하고 Home E2E의 제목·상태 기대값을 갱신했으나 실행하지 않았다.

- 2026-09-06 Select 표현 정리: `NativeSelect` 공통 표현을 추가해 History 모드, Dashboard 비교 기준, Widget 표시 형식의 화살표·좌우 여백·모서리·Focus·Disabled 상태를 통일했다. 네이티브 select의 키보드·모바일 선택 동작은 유지한다.
- History 검색과 모드 필터를 같은 높이의 Label 위/Input 아래 Grid로 정렬하고 `Mode / All`을 `분석 모드 / 전체`로 표시한다. 모바일은 한 열, 넓은 화면은 검색 영역과 160px 필터로 배치한다. Editor 선택 상자는 옆 조작 버튼과 같은 44px 높이로 맞추고 비교 조건은 36px로 정렬했다.

- 2026-09-06 Navigation·질문 입력 정리: Desktop 로고를 홈 Link로 연결하고 Mobile과 같은 접근 가능한 이름을 사용했다. 미구현 Library·Settings·보기 탭·알림·도움말과 가짜 검색 단축키를 제거했다. 고정 Mock mode·계정처럼 보이던 Footer는 실제 브라우저 저장 안내로 바꿨다.
- WorkspaceShell의 중복 Active Navigation/Tab을 단일 page로 정리했다. 실제 홈·분석 기록 탐색과 현재 위치를 표시하고 Dashboard에서 홈을 현재 Page로 잘못 강조하지 않는다.
- 새 분석 Link는 질문 입력칸, 검색 Link는 실제 History 검색란으로 연결한다. 검색란은 Hydration 전에도 유지한다. Skip Link는 포커스 가능한 실제 main을 가리키며 고정 Header에 가려지지 않게 Anchor 여백을 추가했다. 기록에서 연 Dashboard는 History로 돌아가는 Link를 제공한다.
- Prompt 제출마다 고유 Dashboard ID를 만들어 기존 `mock-preview` 공유 ID로 사용자 편집이 다른 분석에 적용될 수 있던 경로를 제거했다. 기존 기록 URL은 계속 열 수 있으며 후속 질문의 Dashboard ID 유지 정책은 바꾸지 않았다.
- 추천 질문 선택 후 입력 Focus, Enter 제출·Shift+Enter 줄바꿈, IME Enter 보호, Route 전환 중 입력·추천 질문 비활성화를 추가했다.
- Prompt Focus·분석 ID 분리·IME Unit Test와 Desktop/Mobile 로고·History·새 분석·검색·Skip Link E2E를 작성하고 기존 Home E2E의 새 ID 기대값을 갱신했다. 사용자 요청에 따라 실행하지 않았다.

- 2026-09-06: Dashboard Renderer의 Header·공통 Frame·Registry·위젯별 Dataset 연결을 별도 Module로 분리했다. 기존 Chart 동적 로딩, Widget memo, 선택 Callback과 표시 JSX는 유지하고 Renderer는 Grid 조합을 담당한다.
- Editor의 Toolbar·Widget Control과 콘텐츠 높이 Observer를 분리했다. Store와 순수 자동 Layout 규칙, Custom Layout 보존 정책은 유지한다.
- README를 Phase 8 기능·현재 스택·설계 경계 기준으로 갱신하고 Architecture Diagram과 `docs/DEMO.md`를 추가했다. Architecture·제품 명세·의존성 계획도 실제 Nivo·Editor·9개 추천 질문과 일치시켰다.
- Architecture의 Cache Key와 취소 설명을 구현에 맞췄다. Dataset Version·Model ID는 현재 Cache Key에 없으며 사용자 취소의 전체 Pipeline 전파와 실시간 진행 Stream은 미구현으로 명시했다.
- 번들 측정기가 동적 Import 대상 Module 이름을 찾도록 변경하고 누적 막대·캘린더 및 초기 자산+Editor+다섯 Chart의 중복 제거 합계를 추가했다. 새 빌드의 수치와 측정 제한은 `docs/PERFORMANCE.md`에 기록했다.
- 기존 E2E의 오래된 Heading·Provider·Filter·Chart 문구를 현재 한글 UI에 맞췄고 History 재열기 시 새 Analyze 요청이 없는 기대값을 추가했다. E2E는 3100 포트의 별도 Production Server에서 Mock·Local·Live 비활성화를 강제하며 기존 개발 서버를 재사용하지 않는다. E2E 실행 전에 build가 필요하다. 테스트는 실행하지 않았다.

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
- Gemini Plan과 Dashboard Composition에는 Gemini Generate Content가 지원하는 최소 구조 JSON Schema만 전달하고, 응답 JSON은 원본 Zod Schema와 Semantic 규칙으로 다시 검증한다. Schema 또는 Semantic 검증 실패 시 교정 요청은 최대 1회다.
- Gemini Composer는 Dashboard ID와 검증된 Context를 생성하지 않는다. 서버가 값을 주입하며, 기간을 설명하는 숫자는 허용하되 매출·수량·비율 같은 Business Number를 포함한 모델 표시 문구는 거부하고 결정론적 Dashboard Fallback으로 복구한다.
- Analysis별 호출 Budget을 공유하고 기본 한도를 4회로 설정했다. 정상 Plan·Composer 2회와 각 단계의 교정 Retry 1회를 포함하는 상한이다.
- `AI_PROVIDER=gemini`이지만 설정이 불완전하거나 Live 호출이 실패하면 Mock Provider로 안전하게 Fallback하고 Response Metadata에 상태를 남긴다.
- 지역명이 명시된 질문은 Planner가 실제 Dataset Value를 받지 않더라도 등록된 별칭 Resolver가 `경기도 → Gyeonggi` 같은 canonical Filter를 Query와 Context에 결정론적으로 적용한다.
- `상품`과 `판매 수량` 또는 `판매량`이 함께 있는 질문은 총계·일별 추이·상품별 상위 순위의 세 검증 Query로 결정론적으로 확장한다. Composer가 실패해도 이 세 Dataset을 모두 보존해 Dashboard Fallback으로 표시한다.
- Gemini Provider, Fallback, Provider Factory, 환경 선택에 대한 주입형 Unit Test를 추가했다. 실제 Gemini Key나 네트워크 호출은 사용하지 않는다. 테스트 실행은 사용자 요청에 따라 보류한다.
- 공식 Supabase SDK와 CLI를 lockfile에 고정하고, CLI로 Phase 6 migration을 생성했다.
- `analytics_daily`, Dataset Metadata, 선택적 Persisted History, 운영 Event Table을 만드는 Supabase Migration을 추가했다. 네 Table 모두 RLS를 활성화하고 `anon`·`authenticated` 권한을 제거했다.
- `SupabaseAnalyticsRepository`가 Local Repository와 동일한 Contract로 서버 전용 Secret Client에서 Row를 읽고, Snake Case DB Row를 검증된 Analytics Row로 변환한 뒤 같은 결정론적 Engine을 사용하도록 구현했다.
- Supabase 설정이 불완전하면 `DATA_SOURCE=supabase`여도 Local Repository로 안전하게 복구한다. `npm run seed:supabase`는 Local Synthetic Data와 Dataset Version을 서버 Secret으로만 적재한다.
- 의미상 같은 질문과 Context에 대해 LRU·TTL 메모리 Cache를 적용하고, Cached Response는 현재 Request·Session·Dashboard ID로 다시 묶어 식별자를 재사용하지 않는다.
- Query와 Dashboard 해석 규칙이 바뀌면 `analysisCacheSemanticsVersion`도 갱신해, 개발 중이나 장기 실행 Server에서 이전 의미의 Cache를 재사용하지 않는다.
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
- `KPI + Time Series + Calendar Heatmap + Comparison` 결과에서 날짜가 21개 이상이고 비교 차트가 짧으면, 캘린더를 `추이` 아래의 8-column Feature Canvas로 승격하고 비교 차트는 KPI 아래 Compact Rail로 둔다. 짧은 날짜 범위는 기존 `KPI·캘린더` Compact Rail을 유지한다. 초기 CSS Grid와 편집 가능 Grid는 같은 계획 순서를 사용한다.
- Adaptive Dashboard Layout Planner는 검증된 위젯 종류, 실제 Query DataPoint 수, 브레이크포인트만으로 `compact`·`standard`·`feature` 표현과 Grid 사각형을 결정한다. 단독 캘린더는 전체 폭의 Feature Monthboard로, KPI와 캘린더만 있으면 4:8 인접 분석으로 확장하며, KPI·추이·보조 분석이 함께 있으면 기존 Evidence Mosaic을 유지한다.
- Trend·Ranked Bar·Stacked Bar·Donut·Calendar Heatmap·Table Frame이 공통 Presentation을 받아 Canvas·여백·날짜 셀 밀도를 함께 조절한다. 저장된 사용자의 Custom Layout은 자동 재배치하지 않고, Auto Layout만 실제 콘텐츠 높이를 다음 배치에 반영한다.
- Dashboard Layout Constraint는 Desktop 12열·20px Gutter·최대 18% 빈 Canvas, Tablet 6열·20px Gutter·최대 20% 빈 Canvas를 단일 Contract로 둔다. 월간 캘린더 Feature 후보는 이 빈 공간 예산을 통과할 때만 선택한다.
- Calendar Heatmap의 Feature Canvas에는 가장 높은 일자·기간 합계·일평균·강한 요일·분석 일수를 계산해 표시하는 `Month signals` 패널을 추가했다. 모든 값은 검증된 일별 DataPoint에서 결정론적으로 계산하며, Feature Card의 남는 폭을 분석 근거로 채운다.
- Trend·Ranked Bar·Donut·Stacked Bar·Calendar Heatmap의 데이터 포인트를 선택하면 같은 Widget 안에 `Selected evidence` Drilldown을 연다. 현재 값, 그룹 평균, 순위, 비교 변화 또는 합계형 지표의 기간 내 비중, 관련 Finding과 Query Ref를 검증된 Dataset에서만 다시 계산해 표시한다.
- Drilldown 상태는 `widgetId`·`queryId`·`label`만 가진 일시적 Client UI 상태다. 선택값으로 SQL·Query DSL·AI 출력을 만들지 않으며, 후속 분석 응답이 도착하면 Editor를 새 Analysis ID로 다시 마운트해 이전 선택을 보존하지 않는다.
- Drilldown 선택은 선택된 Widget에만 전달하고, Grid가 만드는 Dataset·Finding Map과 자동 Layout Plan은 입력이 바뀔 때만 다시 계산한다. Calendar는 이 선택 날짜를 명시적 prop으로 받아 선택 Ring·Detail을 부모 Drilldown과 같은 값으로 유지한다. Calendar 상세 영역의 높이 변화는 `react-grid-layout`의 `layouts` prop으로 반영하고, React `key`로 Grid 전체를 재마운트하지 않는다. 따라서 Calendar 날짜 선택처럼 국소적인 상호작용이 다른 Nivo Chart의 불필요한 재마운트·재애니메이션을 유발하지 않는다.
- Drilldown 계산(순위·평균·비중·비교값) Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- Drilldown 선택 범위를 Widget 단위로 확인하는 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- 카테고리·디바이스·지역처럼 허용된 차원 값의 `Selected evidence`에는 명시적인 `상세 분석` 액션을 추가했다. 날짜는 Filterable Dimension이 아니므로 근거 조회만 가능하다.
- 상세 분석 요청은 현재 Analysis Context와 단일 `eq` 선택 Filter를 Zod로 검증한다. 서버는 Planner에 좁혀진 Context를 전달하고, 최종 Context Filter를 모든 Query DSL에 다시 강제한 뒤 Repository를 실행한다.
- 선택 Filter를 Cache Key에 포함해, 같은 질문이라도 서로 다른 차트 선택 결과가 Cache를 공유하지 않게 했다. 선택 Filter·Query 강제·Cache 분리에 대한 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- Dashboard Header의 분석 조건을 기간·비교·사람이 읽는 Filter Chip으로 정리했다. Filter Chip의 제거 버튼과 `전체 해제`는 분석 중 비활성화되며, 조건이 없으면 `전체 데이터` 상태를 명시한다.
- 비교 기준은 Header의 작은 Select Control에서 `비교 없음`·이전 기간·이전 달·전년 동기 중 하나로 바로 바꿀 수 있다. 이 선택도 분석 중에는 비활성화된다.
- 조건 변경 요청은 현재 Context와 검증된 Filter 또는 비교 기준만 받는 전용 Schema를 사용한다. 서버가 변경된 Context를 Planner에 전달하고, Filter 변경은 최종 Filter를 모든 Query DSL에 다시 강제하며 비교 변경은 모든 Query의 비교 모드를 고정한다. 차트 선택 상세 분석과 같은 요청에서 섞이면 거부한다.
- 조건 변경은 새 Cache Key로 분리한다. 조건 표시·제거·비교 선택, Schema 경계, Context Filter·비교 기준 재적용을 검증하는 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- 같은 `sessionId`를 가진 Local Analysis History를 시간순 버전으로 묶는 `Analysis trail`을 추가했다. 버전마다 질문·기간·주 지표·비교·첫 Filter와 이전 버전에서 바뀐 조건을 보여주며, 사용자는 저장된 검증 응답을 다시 열어 당시 Dashboard를 복원할 수 있다. 버전 열기는 새 분석이나 AI 호출을 만들지 않는다.
- 세션 범위·시간순 정렬·조건 변경 Label을 검증하는 Unit Test를 추가했다. 테스트 실행은 사용자 요청에 따라 보류한다.
- 상품 순위 결과(`핵심 지표 + 가로 막대 + 순위표 + 인사이트`)에는 4:8 두 레인 Evidence Layout을 적용했다. KPI·순위표는 왼쪽 레인에, 비교 차트·근거는 오른쪽 레인에 맞물려 배치되며, 비교 없는 순위표는 불필요한 변화 열과 내부 가로 스크롤을 제거한다.
- 화면 전용 한글 표시 변환을 추가해 원본 Query Filter 값은 보존하면서 지역·상품·카테고리·디바이스·캠페인·유입 소스, 기간 Preset, 데이터 근거, Dashboard Copy, 축의 만·억 단위를 한글로 표시한다.
- Ranked Bar의 왼쪽 여백을 고정 88px 대신 실제 표시 Label 길이에서 결정하고, 표시용 Label과 Drilldown용 원본 Label을 분리했다. 긴 상품명이 SVG 바깥으로 잘리지 않으면서도 클릭 후 검증된 원본 Filter가 유지된다.

## 진행 중

- README·Architecture Diagram·Demo 가이드와 현재 정적 Bundle 기록을 갱신했다. 실제 Desktop·Mobile 시나리오, Screenshot·Demo 영상과 배포 환경 성능 확인이 남아 있다. 테스트는 사용자 요청에 따라 보류한다.

## 결정 사항

| 날짜 | 결정 | 이유 |
|---|---|---|
| 2026-09-06 | Dashboard 표현을 Header·Frame·Registry·개별 Widget으로 분리하고 Editor Control·높이 관찰을 추출 | 새 위젯과 편집 기능이 하나의 Renderer에 누적되지 않게 하면서 기존 지연 로딩·상태 소유권을 유지하기 위함 |
| 2026-09-06 | E2E는 별도 Production Server에서 Mock·Local 설정을 강제 | 개발 서버의 Live Provider 설정을 재사용하지 않고 재현 가능한 검증 환경을 만들기 위함 |
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
| 2026-09-05 | Gemini 전송용 Schema는 필드 구조·필수값·enum만 유지 | Generate Content가 거절하는 Zod의 길이·정규식·strict 제약은 전송하지 않고, 수신 응답은 원본 Zod로 최종 검증하기 위함 |
| 2026-09-05 | 질문 속 지역명은 결정론적 별칭 Resolver로 canonical Dataset Value에 매핑 | Planner에 실제 Business Data Value를 전달하지 않으면서도 한국어 지역 질문이 유효한 Query Filter로 실행되게 하기 위함 |
| 2026-09-05 | Composer 표시 문구의 숫자 검증은 기간 단위만 예외 처리 | `최근 30일` 같은 Context 설명은 허용하면서도 모델이 만든 매출·수량·비율을 Renderer로 보내지 않기 위함 |
| 2026-09-05 | 지역 상품 수량은 총계·추이·상품 순위로 확장하고 Fallback도 모든 검증 Dataset을 표시 | 단일 집계로 시각 정보가 사라지거나 Composer가 복구될 때 한 장의 KPI Card만 남는 것을 막기 위함 |
| 2026-08-31 | Supabase는 서버 Secret Client와 RLS·권한 회수로만 접근 | 공개 Demo가 Data API를 통해 Raw Analytics·History·Operation Event에 접근하지 못하게 하기 위함 |
| 2026-08-31 | 분석 Cache는 요청 식별자를 제외한 질문·Context·실행 Scope를 Key로 사용 | 같은 분석 작업을 재사용하면서도 Response의 Analysis·Session·Dashboard ID는 현재 요청에 귀속하기 위함 |
| 2026-09-05 | Cache Key에 분석 의미 버전을 포함 | Query 확장·Dashboard Fallback 같은 Server 해석 변경 뒤에도 이전 Dashboard Payload가 Cache Hit으로 다시 표시되지 않게 하기 위함 |
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
| 2026-09-02 | Adaptive Layout은 Widget Semantic·DataPoint Density·Viewport만 사용 | LLM이나 임의의 표시값 없이 같은 검증 결과에는 같은 배치를 보장하면서, 단독·여유 Canvas에서는 차트가 충분한 표현 크기를 쓰게 하기 위함 |
| 2026-09-02 | 월간 캘린더(21일 이상)는 짧은 비교 차트보다 우선적으로 8-column Canvas를 사용 | 31개 날짜 셀의 정보 밀도를 4-column 보조 레일에 가두지 않고, 빈 Card 내부 여백 대신 읽기 쉬운 날짜 셀과 Detail을 제공하기 위함 |
| 2026-09-02 | 자동 배치는 빈 Canvas 예산을 초과하는 Feature 후보를 거부 | Dashboard를 억지로 꽉 채우거나 반대로 큰 빈 영역을 방치하지 않고, 정보 밀도가 충분한 후보만 넓은 Canvas로 승격하기 위함 |
| 2026-09-02 | Feature Calendar는 결정론적 Month signals를 동반 | 넓어진 카드의 빈 폭을 장식으로 채우지 않고, 실제 일별 Dataset에서 재현 가능한 추가 분석을 제공하기 위함 |
| 2026-09-03 | Chart Drilldown은 검증된 Dataset을 재해석하는 UI 상태로 제한 | 차트 클릭만으로 허용되지 않은 DB Filter·SQL·LLM 수치를 만들지 않고도, 사용자가 선택값의 근거를 즉시 확인하게 하기 위함 |
| 2026-09-03 | Drilldown 선택 참조는 선택된 Widget에만 전달하고 Grid 파생값을 메모화하며, `layouts` 변경에 React `key`를 쓰지 않음 | 한 카드의 선택·높이 상태가 관계없는 Nivo Chart의 재마운트·모션을 다시 시작시키지 않게 하기 위함 |
| 2026-09-03 | 선택값 후속 분석은 현재 Context의 단일 허용 `eq` Filter를 서버에서 모든 Query DSL에 강제 | UI나 모델이 분석 범위를 임의로 넓히지 못하게 하면서도, 사용자가 검증된 Chart 값에서 바로 좁은 분석으로 이어지게 하기 위함 |
| 2026-09-03 | Dashboard Filter·비교 기준 변경은 전용 Context Override로 서버에서 재적용 | 조건 제거·전체 해제·비교 선택이 자연어 해석이나 Client-only State에 의존하지 않고, 다음 Query 범위를 결정론적으로 바꾸게 하기 위함 |
| 2026-09-03 | Dashboard Version History는 같은 `sessionId`의 Local History Response만 다시 연다 | 버전 복원이 API·AI 호출이나 Client가 만든 숫자에 의존하지 않고, 당시 검증된 결과를 정확히 재현하게 하기 위함 |
| 2026-09-05 | 화면 표시값은 Presentation Localizer에서만 한글화 | Repository·Query DSL의 Canonical Value를 바꾸지 않아 Drilldown·Filter·결정론적 계산의 검증 경계를 유지하기 위함 |

## 검증 결과

### 2026-09-06: 화면 한글화

- `npm run lint`, `npm run typecheck`: 통과.
- `AI_PROVIDER=mock AI_LIVE_ENABLED=false DATA_SOURCE=local PERSIST_ANALYSIS_HISTORY=false npm run build`: 통과.
- `git diff --check`: 통과. JSX 고정 텍스트의 영문 잔여 검사에서 제품명 Prism AI만 남음을 확인했다. 사용자 입력은 원문을 보존한다.
- 테스트·E2E·`npm run check`·react-doctor·Live Gemini 호출은 미실행. Browser 시각 검증도 실행하지 않았다.

### 2026-09-06: Select 표현 정리

- `npm run lint`, `npm run typecheck`: 통과.
- `AI_PROVIDER=mock AI_LIVE_ENABLED=false DATA_SOURCE=local PERSIST_ANALYSIS_HISTORY=false npm run build`: 통과.
- 변경한 네 TSX 파일 대상 `prettier --check`, `git diff --check`: 통과.
- 컴퓨터 사용 도구가 접근성·화면 기록 권한 대기를 반환해 Browser 시각 확인은 완료하지 못했다. 첨부 이미지와 소스 기준으로 수정했으며 화면 확인 완료로 간주하지 않는다.
- 테스트·E2E·`npm run check`·react-doctor: 사용자 요청에 따라 미실행. 동작을 유지하는 스타일 변경이므로 별도 Unit Test는 추가하지 않았다.

### 2026-09-06: Navigation·질문 입력 정리

- `npm run lint`: 통과.
- `npm run typecheck`: 통과.
- `AI_PROVIDER=mock AI_LIVE_ENABLED=false DATA_SOURCE=local PERSIST_ANALYSIS_HISTORY=false npm run build`: 통과 (Next.js Webpack production build).
- `git diff --check`: 통과.
- `npm run test`, `npm run test:e2e`, `npm run check`, react-doctor: 미실행 (사용자 요청). Browser·키보드·IME 실제 동작 검증도 미실행이며 추가한 테스트를 통과했다고 간주하지 않는다.
- 검토 범위: 공통 Shell, Home Prompt, History 검색·재열기, Dashboard 복귀 경로와 기존 UI Action의 Handler 연결. 미구현 전역 기능을 새로 만드는 대신 실제 동작 경로만 노출하기로 결정했다.

### 2026-09-06: Dashboard 책임 분리와 문서 현행화

- `npm run lint`: 통과.
- `npm run typecheck`: 통과.
- `AI_PROVIDER=mock AI_LIVE_ENABLED=false DATA_SOURCE=local PERSIST_ANALYSIS_HISTORY=false npm run build`: 통과 (Next.js 16.3.3 Webpack production build).
- 변경한 TypeScript·TSX·README 대상 `prettier --check`: 통과. `git diff --check`: 통과. 전체 Repository의 `format:check`는 실행하지 않았다.
- `npm run analyze:bundle`: 최초 실행은 tsx의 IPC 소켓 생성이 Sandbox에서 `EPERM`으로 차단됐다. 동일 읽기 전용 명령을 승인된 Sandbox 밖에서 재실행해 통과했다. 초기 229.9 KiB gzip, Editor와 다섯 Chart까지 중복 제거 합계 400.6 KiB gzip.
- `npm run test`, `npm run test:e2e`, `npm run check`, react-doctor: 미실행 (이번 세션의 사용자 요청). E2E 기대값·실행 환경을 갱신했지만 동작 통과로 간주하지 않는다.
- Browser 시나리오·Web Vitals·Live API·실제 DB 검증: 미실행. 이번 확인은 소스 검토, lint·타입 검사·빌드·정적 번들 측정 범위다.

### 이전 작업의 검증 기록

- `npm run lint`: 통과 (Dashboard Version History)
- `npm run typecheck`: 통과 (Dashboard Version History)
- `npm run build`: 통과 (Dashboard Version History, Next.js Webpack production build)
- 세션 Version History Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test`, `npm run test:e2e`, `npm run check`, `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Drilldown Render Isolation·Calendar Selection)
- `npm run typecheck`: 통과 (Drilldown Render Isolation·Calendar Selection)
- `npm run build`: 통과 (Drilldown Render Isolation·Calendar Selection, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Drilldown Render Isolation·Calendar Selection)
- Drilldown Widget 범위 Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test`, `npm run test:e2e`, `npm run check`, `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Dashboard Context Controls)
- `npm run typecheck`: 통과 (Dashboard Context Controls)
- `npm run build`: 통과 (Dashboard Context Controls, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Dashboard Context Controls)
- Context Override·Filter 제거·비교 기준·Cache 분리 Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test`, `npm run test:e2e`, `npm run check`, `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Selection Follow-up Analysis)
- `npm run typecheck`: 통과 (Selection Follow-up Analysis)
- `npm run build`: 통과 (Selection Follow-up Analysis, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Selection Follow-up Analysis)
- 선택 Filter·Query 강제·Cache 분리 Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test`, `npm run test:e2e`, `npm run check`, `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

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
- `npm run lint`: 통과 (Adaptive Dashboard Layout)
- `npm run typecheck`: 통과 (Adaptive Dashboard Layout)
- `npm run build`: 통과 (Adaptive Dashboard Layout, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Adaptive Dashboard Layout)
- Adaptive Layout Planner Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run lint`: 통과 (Calendar Feature Canvas Priority)
- `npm run typecheck`: 통과 (Calendar Feature Canvas Priority)
- `npm run build`: 통과 (Calendar Feature Canvas Priority, Next.js Webpack production build)
- 캘린더 Feature Canvas 회귀 기대값 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run lint`: 통과 (Dashboard Empty Space Budget)
- `npm run typecheck`: 통과 (Dashboard Empty Space Budget)
- `npm run build`: 통과 (Dashboard Empty Space Budget, Next.js Webpack production build)
- Constraint·Calendar Month signals Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run lint`: 통과 (Chart Drilldown Analysis)
- `npm run typecheck`: 통과 (Chart Drilldown Analysis)
- `npm run build`: 통과 (Chart Drilldown Analysis, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Chart Drilldown Analysis)
- Dashboard Drilldown Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
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

- `npm run lint`: 통과 (Gemini Structured Output Fix)
- `npm run typecheck`: 통과 (Gemini Structured Output Fix)
- `npm run build`: 통과 (Gemini Structured Output Fix, Next.js Webpack production build)
- Live Gemini Planner 확인: 통과 (`gemini-3.5-flash`, `경기도 판매 상품 수량` → `unitsSold` Query와 `region = Gyeonggi` canonical Filter)
- Live Gemini Composer 확인: 통과 (Gyeonggi 결정론적 Dataset을 기준으로 검증된 3개 Widget 구성)
- `npm run test`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test:e2e`: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run check`: 미실행 (`npm run test`를 포함하므로 사용자 요청에 따라 보류)
- `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Gemini Product-Units Dashboard Recovery)
- `npm run typecheck`: 통과 (Gemini Product-Units Dashboard Recovery)
- `npm run build`: 통과 (Gemini Product-Units Dashboard Recovery, Next.js Webpack production build)
- Live Gemini API 재현: `경기도 판매 수량`은 단일 집계 Query·정상 Metric Dashboard를 반환했다. `경기도 판매 상품 수량`은 Composer가 모델 문구에 Business Number를 넣는 경우 안전 Fallback으로 전환되는 것을 확인했다.
- 로컬 Analyze API 재확인: 기존 질문인 `경기도 판매 상품 수량`이 총계·일별 추이·상품별 비교·계산된 근거의 네 Widget을 반환했다. Gemini 요청 제한으로 Mock Composer로 복구된 경우에도 동일한 검증 Dataset 구성을 유지한다.
- Gemini Structured Output·Question Resolver·Dashboard Fallback·Gyeonggi Mock Unit Test 추가: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test`, `npm run test:e2e`, `npm run check`, `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

- `npm run lint`: 통과 (Dashboard Evidence Layout·Korean Presentation)
- `npm run typecheck`: 통과 (Dashboard Evidence Layout·Korean Presentation)
- `npm run build`: 통과 (Dashboard Evidence Layout·Korean Presentation, Next.js Webpack production build)
- 변경 파일 대상 `prettier --check`와 `git diff --check`: 통과 (Dashboard Evidence Layout·Korean Presentation)
- Layout·Label Localizer·Bar Margin Unit Test 추가 및 수정: 미실행 (사용자 요청: 테스트는 명시적으로 요청할 때만 실행)
- `npm run test`, `npm run test:e2e`, `npm run check`, `npx react-doctor@latest --verbose --scope changed`: 미실행 (사용자 요청에 따라 보류)

## 알려진 제한 사항

- 2026-09-06 기준 Browser → Route → Provider 사용자 취소 전파와 서버 단계별 진행 Stream은 미구현이다. Gemini 요청별 Timeout만 구현돼 있다.
- 현재 Cache Key는 실제 Dataset Version과 Gemini Model ID를 포함하지 않는다. 동일 Process에서 데이터·모델을 변경하면 TTL 만료 또는 재시작이 필요하다.

- Gemini Generate Content의 구조화 출력은 JSON Schema 일부만 허용한다. Gemini 전송용 Schema는 필드 구조·필수값·enum만 유지해 변환하고, 원본 Zod Schema가 응답을 최종 검증한다. SDK Abort Signal은 클라이언트 대기를 중단하지만 Google 서비스 측 작업이나 사용량 청구를 보장해 취소하지는 않는다.
- In-memory Cache와 Rate Limit·Request Deduplication은 단일 Server Instance 범위다. 여러 Instance에서 공유하려면 Redis 또는 Platform Durable Cache가 필요하다.
- Supabase Project·Key가 아직 제공되지 않아 Migration 적용, `seed:supabase`, 실제 Row Query, RLS Advisor와 Database Test는 실행하지 않았다.
- `.env.local`은 생성하지 않았고, 기본 Mock Mode는 환경 변수 없이 동작한다.
- Stitch UI와 Dashboard Editing의 Runtime Browser·E2E 시각 검증은 사용자 요청에 따라 실행하지 않았다.
- 정적 Bundle 크기만 기록했다. 배포 환경의 실제 Web Vitals와 Network Waterfall은 아직 측정하지 않았다.
- Dashboard 편집값은 계정 동기화가 아닌 브라우저별 Local Storage에만 저장된다.
- Repository 전체 `format:check`는 기존 `src/lib/data/supabase-repository.test.ts` 포맷 불일치 1건 때문에 실패한다. Phase 7 변경 파일은 별도 검사에서 모두 통과했다.

## 다음 권장 작업

테스트 실행이 허용되면 `npm run check` 후 `npm run test:e2e`로 현재 회귀 상태를 확인한다. `docs/DEMO.md`의 Desktop·Mobile 대표 시나리오를 확인하고 실제 Screenshot·Demo 영상과 배포 환경 Web Vitals를 기록한다.
