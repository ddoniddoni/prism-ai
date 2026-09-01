# Analytics와 AI 명세

## 1. 핵심 원칙

AI가 담당하는 판단은 두 가지로 제한한다.

1. 지원 가능한 자연어 질문을 제한된 Analysis Plan으로 변환한다.
2. 결정론적 Finding이 생성된 뒤 허용된 Widget 중 적절한 Dashboard 구성을 선택한다.

화면에 표시되는 모든 Business Number는 Analytics Engine이 계산한다. Model은 Metric, Formula, Value, Cause, Query ID, Finding ID, Component Type을 임의로 만들 수 없다.

## 2. Metric Catalog

```ts
export const metricKeys = [
  "revenue",
  "orders",
  "unitsSold",
  "averageOrderValue",
  "customers",
  "sessions",
  "conversionRate",
  "adSpend",
  "roas",
  "refundRate",
] as const;

export type MetricKey = (typeof metricKeys)[number];
```

정의:

- `revenue`: 선택 기간의 유효 주문 순매출
- `orders`: 유효 주문 수
- `unitsSold`: 판매 수량 합계
- `averageOrderValue`: `revenue / orders`
- `customers`: 고유 구매 고객 수
- `sessions`: Session 합계
- `conversionRate`: `orders / sessions * 100`
- `adSpend`: 광고비
- `roas`: 광고 귀속 매출을 광고비로 나눈 값
- `refundRate`: 환불 주문을 유효 주문으로 나눈 뒤 100을 곱한 값

0으로 나누는 경우 `Infinity`, 0, 임의 값이 아니라 `null`을 반환한다.

각 Metric Entry에는 다음이 있어야 한다.

- Key
- 표시명
- 설명
- Format
- Aggregation 전략
- 비교 가능 여부
- 사용 가능한 Dimension

## 3. Dimension Catalog

```ts
export const dimensionKeys = [
  "date",
  "device",
  "category",
  "product",
  "trafficSource",
  "region",
  "customerSegment",
  "campaign",
] as const;

export type DimensionKey = (typeof dimensionKeys)[number];
```

Catalog에 없는 값은 Query, Filter, Result Series, Dashboard Widget에서 사용할 수 없다.

## 4. 기간과 비교

```ts
type PeriodPreset =
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth"
  | "last90Days"
  | "thisQuarter"
  | "lastQuarter"
  | "thisYear"
  | "lastYear"
  | "custom";

type CompareMode =
  | "none"
  | "previousPeriod"
  | "previousMonth"
  | "previousYear";
```

규칙:

- 기간 계산은 결정론적 코드가 담당한다.
- Local과 Mock Mode에서는 Dataset의 마지막 완료 날짜를 분석 기준일로 사용한다.
- `custom`은 유효한 `startDate`, `endDate`가 필요하다.
- 종료일이 시작일보다 빠르면 거부한다.
- Dataset 범위 밖 날짜만 포함한 요청은 거부한다.
- 후속 질문에서 사용자가 기간을 명시하지 않으면 기존 기간을 유지한다.

## 5. Query DSL

Planner는 다음 Allowlist 구조만 반환한다. SQL을 반환하지 않는다.

```ts
type AnalyticsFilter = {
  dimension:
    | "device"
    | "category"
    | "product"
    | "trafficSource"
    | "region"
    | "customerSegment"
    | "campaign";
  operator: "eq" | "in" | "notIn";
  values: string[];
};

type AnalyticsQuery = {
  id: string;
  metric: MetricKey;
  groupBy?: DimensionKey;
  period: {
    preset: PeriodPreset;
    startDate?: string;
    endDate?: string;
  };
  compareWith: CompareMode;
  filters: AnalyticsFilter[];
  sort?: {
    direction: "asc" | "desc";
    by: "value" | "label";
  };
  limit?: number;
};
```

검증 제한:

- 분석당 Query 최대 8개
- Limit 1 이상 50 이하
- Filter 하나당 Value 최대 20개
- 등록되지 않은 Metric, Dimension, Operator, Period, Compare Mode 거부
- `date`에 임의 Filter 적용 금지
- Canonical Normalize 후 중복 Query 제거
- Plan 안에서 Query ID 중복 금지
- 모든 Query가 Analysis Goal과 연결되어야 함

## 6. Context와 Analysis Plan

```ts
type AnalysisContext = {
  primaryMetric: MetricKey;
  period: AnalyticsQuery["period"];
  compareWith: CompareMode;
  filters: AnalyticsFilter[];
  focusDimension?: DimensionKey;
};

type AnalysisIntent =
  | "overview"
  | "trend"
  | "comparison"
  | "rootCause"
  | "ranking"
  | "segmentAnalysis"
  | "unsupported";

type AnalysisPlan = {
  intent: AnalysisIntent;
  normalizedQuestion: string;
  contextPatch: Partial<AnalysisContext>;
  queries: AnalyticsQuery[];
  analysisGoal: string;
};
```

후속 질문 병합 순서:

1. 현재 검증된 Context에서 시작한다.
2. `contextPatch`에 명시된 값만 변경한다.
3. Filter를 정규화하고 중복을 제거한다.
4. 병합된 Context를 다시 검증한다.
5. Plan이 유효하지만 Query가 부족하면 Intent와 Context를 기준으로 Safe Default Query를 보충한다.

예시:

```text
현재 Context:
period=lastMonth, primaryMetric=revenue, filters=[]

후속 질문:
모바일만 자세히 분석해줘.

Patch:
filters=[device eq mobile]
```

```text
현재 Context:
period=lastMonth, primaryMetric=revenue, filters=[device eq mobile]

후속 질문:
작년 같은 기간과 비교해줘.

Patch:
compareWith=previousYear
```

## 7. Local Analytics Row

첫 Dataset은 Local 실행이 쉬운 Daily Denormalized Row를 사용할 수 있다.

```ts
type AnalyticsDailyRow = {
  date: string;
  device: "desktop" | "mobile" | "tablet";
  category: string;
  product: string;
  trafficSource: string;
  region: string;
  customerSegment: string;
  campaign: string | null;
  revenue: number;
  orders: number;
  unitsSold: number;
  customers: number;
  sessions: number;
  adSpend: number;
  attributedRevenue: number;
  refunds: number;
};
```

Synthetic Data 요구사항:

- 고정 Seed를 사용하는 완료된 24개월 데이터
- 최근 비교 기간의 Mobile Fashion 매출 하락
- Stock Shortage가 있는 대표 상품
- 광고비 증가와 ROAS 하락
- 주간과 연간 Seasonality
- Refund Rate가 높은 Region
- 메인 하락 시나리오에서 안정적이거나 소폭 증가한 Desktop

Dashboard Component에 숫자를 직접 넣지 않고 재사용 가능한 Parameter로 Dataset을 생성한다.

## 8. Dataset Result

```ts
type DataPoint = {
  label: string;
  value: number | null;
  previousValue?: number | null;
  absoluteChange?: number | null;
  percentChange?: number | null;
};

type AnalyticsDataset = {
  queryId: string;
  metric: MetricKey;
  groupBy?: DimensionKey;
  currentTotal: number | null;
  previousTotal?: number | null;
  points: DataPoint[];
  dataRange: { startDate: string; endDate: string };
  comparisonRange?: { startDate: string; endDate: string };
  empty: boolean;
  warnings: string[];
};
```

`AnalyticsDataset` 안에 LLM 설명 Text를 넣지 않는다.

## 9. 결정론적 분석

필수 Pure Function:

```ts
calculatePercentChange()
calculateAbsoluteChange()
calculateContribution()
calculateRanking()
findTopDrivers()
detectAnomalies()
buildFindings()
```

기여도 계산:

```text
totalDelta = currentTotal - previousTotal
segmentDelta = currentSegment - previousSegment
contributionPercent = segmentDelta / totalDelta * 100
```

전체 변화가 사실상 0이면 Contribution을 계산하지 않는다. 구현에서 사용하는 Epsilon을 문서화하고 테스트한다.

MVP 이상치 탐지는 결정론적 Rolling Z-score 또는 IQR 규칙을 사용할 수 있다. Algorithm, Threshold, 최소 Sample 수를 문서화하고 Unit Test를 작성한다.

## 10. Finding Model

```ts
type Finding = {
  id: string;
  type: "trend" | "driver" | "anomaly" | "ranking" | "dataQuality";
  severity: "info" | "positive" | "warning" | "critical";
  metric: MetricKey;
  dimension?: DimensionKey;
  segment?: string;
  currentValue?: number | null;
  previousValue?: number | null;
  absoluteChange?: number | null;
  percentChange?: number | null;
  contributionPercent?: number | null;
  evidenceQueryIds: string[];
  fallbackText: string;
};
```

규칙:

- Insight의 모든 숫자 주장은 Finding 또는 Dataset과 연결된다.
- Finding은 존재하는 Query ID만 참조한다.
- 데이터가 부족하면 단정 대신 `dataQuality` Finding을 만든다.
- 검증되지 않은 인과관계 대신 `가장 큰 하락 기여`, `함께 관찰됨`, `영향이 큰 Segment` 표현을 우선한다.
- `fallbackText`만으로도 Live AI 없이 Finding을 설명할 수 있어야 한다.

## 11. AI Provider 책임

```ts
interface AIProvider {
  createPlan(input: PlannerInput): Promise<AnalysisPlan>;
  createDashboard(input: DashboardComposerInput): Promise<DashboardSpec>;
}
```

하나의 Provider에서 서로 다른 Prompt 두 개를 사용한다. MVP에서는 별도 Analyst Model Call을 추가하지 않는다. 숫자 분석은 Deterministic Finding이 담당한다.

### Planner Input

다음만 전달한다.

- 사용자 질문
- 현재 Context
- Metric Catalog
- Dimension Catalog
- Period와 Compare Allowlist
- 지원 Intent
- Hard Limit

Planner는 실제 Business Data Value를 받거나 추측하지 않는다.

### Planner Output 규칙

- Structured JSON만 반환
- Allowlist 값만 사용
- 필요한 최소 Query Set 구성
- 사용자가 변경한 Context Field만 Patch에 포함
- SQL과 실행 코드 금지
- 지원 범위 밖 질문은 `unsupported`
- 분석 결과를 미리 단정하지 않음

### Composer Input

다음만 전달한다.

- 정규화된 질문
- 검증된 Context
- 검증된 Dataset 또는 압축된 요약
- 결정론적 Finding
- Widget Catalog와 Layout Limit

Aggregate Data를 우선하고 Customer 단위 Raw Row를 보내지 않는다.

### Composer Output 규칙

- 전달받은 Query ID와 Finding ID만 사용
- Allowlist Widget만 사용
- Schema 안에 실제 Metric Value를 복사하거나 새로 만들지 않음
- 새로운 Metric, Formula, Dimension, Cause 추가 금지
- Widget 최대 8개
- Title, Subtitle, 짧은 Summary, Widget Plan 반환
- Finding이 데이터 부족을 나타내면 불확실성을 표현

## 12. Structured Output과 검증

Gemini Adapter는 `@google/genai`를 사용한다. 설치된 SDK가 지원하는 JSON Schema 기반 Structured Output을 설정한 뒤 JSON Parse와 Zod 검증을 수행한다.

필수 Pipeline:

```text
Model Response
-> JSON Text 추출
-> JSON.parse
-> Zod Parse
-> Semantic Validation
-> Sanitizing
-> Application 사용
```

Semantic Validation:

- Query ID 고유성
- 참조 Query ID 존재 여부
- 참조 Finding ID 존재 여부
- Widget 수 제한
- Widget Type과 Config 일치
- 유효한 Metric과 Dimension 조합
- Schema가 금지한 추가 Property 제거 또는 거부

잘못된 Structured Output은 교정 Retry 1회만 허용한다. 다시 실패하면 Deterministic Fallback을 사용한다. SDK Type 불일치를 `any`로 우회하지 말고 설치된 Package Type을 확인해 구현한다.

## 13. Widget Catalog

```ts
export const widgetTypes = [
  "metric",
  "timeSeries",
  "categoryBar",
  "stackedBar",
  "donut",
  "rankingTable",
  "dataTable",
  "insight",
] as const;
```

시각화 우선 규칙:

- 핵심 숫자 하나: `metric`
- 시간 흐름: `timeSeries`
- Category 비교: `categoryBar`
- 같은 시점의 검증된 세그먼트 시계열 구성: `stackedBar`
- 적은 수의 Category 비중: `donut`
- 순위와 상위 또는 하위 항목: `rankingTable`
- 상세 Row나 여러 Column: `dataTable`
- Finding 근거와 연결된 설명: `insight`

음수 값이나 Category가 많은 데이터에는 Donut을 사용하지 않는다.

## 14. Dashboard Schema

```ts
type DashboardSpec = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  context: AnalysisContext;
  widgets: DashboardWidget[];
};

type BaseWidget = {
  id: string;
  title: string;
  description?: string;
  queryIds: string[];
  findingIds: string[];
  size: "small" | "medium" | "large" | "full";
};
```

Type별 Config:

- `metric`: Metric Key, Query ID, Format
- `timeSeries`: Query ID, X Key, Series Config
- `categoryBar`: Query ID, Orientation, Sort
- `stackedBar`: 동일 X Key를 공유하는 2개 이상 Query ID와 검증된 Series Label
- `donut`: Query ID, Label과 Value Field
- `rankingTable`: Query ID, 허용 Column
- `dataTable`: Query ID, 허용 Column
- `insight`: Finding ID와 Tone

안전 규칙:

- Widget 1개 이상 8개 이하
- 지원되는 경우 `additionalProperties: false`
- 실제 Value는 Dataset과 Finding에 두고 Schema에 복사하지 않음
- Rendering 전 잘못된 참조 제거
- `UnsupportedWidget`은 Development Safeguard로만 사용
- 모든 생성 Widget이 제거되면 Deterministic Fallback Dashboard 생성

## 15. Component Registry

```ts
const componentRegistry = {
  metric: MetricCard,
  timeSeries: TimeSeriesChart,
  categoryBar: CategoryBarChart,
  stackedBar: StackedBarChart,
  donut: DonutChart,
  rankingTable: RankingTable,
  dataTable: DataTable,
  insight: InsightCard,
} satisfies Record<WidgetType, DashboardWidgetComponent>;
```

Renderer는 `queryIds`, `findingIds`로 데이터를 찾는다. Model이 만든 Component Source나 HTML을 받지 않는다.

## 16. Mock Provider

Mock Provider는 최소 다음 질문을 지원한다.

- 지난달 매출이 왜 감소했어?
- 이번 달 성과를 보여줘.
- 모바일만 자세히 분석해줘.
- 작년 같은 기간과 비교해줘.
- 가장 많이 하락한 상품은 뭐야?
- 광고비 대비 성과를 보여줘.
- 지난달 매출의 디바이스별 구성을 보여줘.
- 환불률이 높은 지역을 알려줘.

Mock Output도 Live Output과 동일한 Zod Schema와 Semantic Validation을 통과해야 한다.

Mock Provider에 표시 숫자를 Hardcode하지 않는다. Mock은 Plan과 Dashboard 구조만 선택하고 실제 값은 Data Engine이 제공한다.

## 17. Fallback 정책

### Planner 실패

지원 대표 질문은 결정론적 Intent Recognizer로 Safe Default Plan을 만든다. 그 외에는 기존 Dashboard를 유지한 채 `UNSUPPORTED_QUESTION` 또는 `AI_UNAVAILABLE`을 반환한다.

### Query 실패

성공한 Dataset을 유지하고 Response를 Partial로 표시한다. 실패한 Query가 필요한 Widget만 제외한다.

### Composer 실패

사용 가능한 결과에서 다음 기본 Dashboard를 만든다.

1. Primary Metric
2. 가능한 경우 Time Series
3. 가장 강한 Driver 또는 Ranking
4. `fallbackText` 기반 Insight

### Empty Data

현재 Context를 보여주고 선택 범위 또는 Filter에 데이터가 없다고 설명한다. 원인을 단정하지 않는다.

## 18. 비용 제한

- 기본 Provider는 Mock
- 완료된 Analysis당 Live Model Call 최대 2회
- 교정 Retry 정책은 전체 Call Budget 안에서 명확하게 구현
- Raw Row보다 Aggregate Dataset과 Finding 전송
- 검증된 대표 질문 결과 Cache
- 공개 Live Request 제한
- Timeout과 Cancel 지원
- Quota가 없어도 Mock Demo 유지
