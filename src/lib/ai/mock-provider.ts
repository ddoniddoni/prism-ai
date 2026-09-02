import type { DimensionKey } from "@/lib/analytics/dimension-catalog";
import type { MetricKey } from "@/lib/analytics/metric-catalog";
import type {
  AnalyticsFilter,
  AnalyticsPeriod,
  AnalyticsQuery,
  CompareMode,
} from "@/lib/analytics/query-schema";
import { normalizeAnalyticsFilters } from "@/lib/analytics/query-schema";
import type { Finding } from "@/lib/analytics/findings";

import type {
  AIProviderMetadata,
  AIProvider,
  DashboardComposerInput,
  PlannerInput,
} from "./provider";
import {
  analysisPlanSchema,
  type AnalysisContext,
  type AnalysisContextPatch,
  type AnalysisIntent,
  type AnalysisPlan,
} from "./schemas/analysis-plan";
import {
  dashboardSpecSchema,
  type DashboardSpec,
} from "./schemas/dashboard-spec";

type MockAnalysisDefinition = {
  intent: Exclude<AnalysisIntent, "unsupported">;
  goal: string;
  primaryMetric: MetricKey;
  period: AnalyticsPeriod;
  compareWith: CompareMode;
  filters: AnalyticsFilter[];
  focusDimension?: DimensionKey;
  title: string;
  subtitle: string;
  widgetTitles?: {
    primary?: string;
    trend?: string;
    focus?: string;
    stacked?: string;
    heatmap?: string;
  };
  calendarHeatmap?: boolean;
  stackedSeries?: readonly StackedSeriesDefinition[];
};

type StackedSeriesDefinition = {
  id: string;
  label: string;
  filter: AnalyticsFilter;
};

const deviceStackedSeries = [
  {
    id: "desktop",
    label: "Desktop",
    filter: { dimension: "device", operator: "eq", values: ["desktop"] },
  },
  {
    id: "mobile",
    label: "Mobile",
    filter: { dimension: "device", operator: "eq", values: ["mobile"] },
  },
  {
    id: "tablet",
    label: "Tablet",
    filter: { dimension: "device", operator: "eq", values: ["tablet"] },
  },
] as const satisfies readonly StackedSeriesDefinition[];

export class UnsupportedQuestionError extends Error {
  constructor() {
    super("지원되는 분석 질문으로 바꿔 주세요.");
    this.name = "UnsupportedQuestionError";
  }
}

function normalizeQuestion(question: string): string {
  return question.trim().replaceAll(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

function createQuery(
  id: string,
  metric: MetricKey,
  period: AnalyticsPeriod,
  compareWith: CompareMode,
  filters: AnalyticsFilter[],
  groupBy?: DimensionKey,
): AnalyticsQuery {
  return {
    id,
    metric,
    ...(groupBy ? { groupBy } : {}),
    period,
    compareWith,
    filters,
  };
}

function rootCauseDefinition(): MockAnalysisDefinition {
  return {
    intent: "rootCause",
    goal: "지난달 매출 변화와 주요 하락 기여 세그먼트를 확인합니다.",
    primaryMetric: "revenue",
    period: { preset: "lastMonth" },
    compareWith: "previousPeriod",
    filters: [],
    focusDimension: "device",
    title: "지난달 매출 변화의 신호",
    subtitle: "이전 기간과 비교해 전체 변화와 영향이 큰 세그먼트를 봅니다.",
  };
}

function resolveDefinition(question: string): MockAnalysisDefinition {
  if (question.includes("선택한") && question.includes("자세히")) {
    return rootCauseDefinition();
  }

  if (
    question.includes("매출") &&
    (question.includes("히트맵") ||
      question.includes("집중도") ||
      question.includes("달력"))
  ) {
    return {
      intent: "trend",
      goal: "지난달의 일별 매출 집중도를 캘린더 히트맵으로 확인합니다.",
      primaryMetric: "revenue",
      period: { preset: "lastMonth" },
      compareWith: "none",
      filters: [],
      focusDimension: "category",
      title: "지난달 매출 집중도",
      subtitle:
        "날짜별 매출 강도를 캘린더 형태로 보고 집중된 날을 빠르게 찾습니다.",
      widgetTitles: {
        primary: "지난달 총매출",
        trend: "기간별 전체 매출",
        focus: "카테고리별 매출",
        heatmap: "일자별 매출 집중도",
      },
      calendarHeatmap: true,
    };
  }

  if (
    (question.includes("디바이스") || question.includes("기기")) &&
    question.includes("매출") &&
    (question.includes("구성") ||
      question.includes("누적") ||
      question.includes("쌓") ||
      question.includes("비중"))
  ) {
    return {
      intent: "segmentAnalysis",
      goal: "지난달 매출의 일자별 디바이스 구성을 누적해 확인합니다.",
      primaryMetric: "revenue",
      period: { preset: "lastMonth" },
      compareWith: "none",
      filters: [],
      focusDimension: "device",
      title: "지난달 디바이스 매출 구성",
      subtitle:
        "일자별 매출을 디바이스 구성으로 나누어 흐름과 비중을 함께 봅니다.",
      widgetTitles: {
        primary: "지난달 총매출",
        trend: "기간별 전체 매출",
        focus: "디바이스별 총매출",
        stacked: "일자별 디바이스 매출 구성",
      },
      stackedSeries: deviceStackedSeries,
    };
  }

  if (
    (question.includes("서울") || question.includes("seoul")) &&
    (question.includes("제품") || question.includes("상품")) &&
    (question.includes("판매량") || question.includes("판매 수량"))
  ) {
    return {
      intent: "ranking",
      goal: "서울에서 발생한 주문의 상품별 판매 수량을 확인합니다.",
      primaryMetric: "unitsSold",
      period: { preset: "lastMonth" },
      compareWith: "none",
      filters: [{ dimension: "region", operator: "eq", values: ["Seoul"] }],
      focusDimension: "product",
      title: "서울 판매 상품 수량",
      subtitle:
        "서울에서 발생한 주문만 대상으로 상품별 판매 수량을 확인합니다.",
      widgetTitles: {
        primary: "서울 상품 판매량",
        trend: "기간별 서울 판매량",
        focus: "서울 상품별 판매량",
      },
    };
  }

  if (question.includes("환불") && question.includes("지역")) {
    return {
      intent: "ranking",
      goal: "환불률이 높은 지역을 순위로 확인합니다.",
      primaryMetric: "refundRate",
      period: { preset: "lastMonth" },
      compareWith: "none",
      filters: [],
      focusDimension: "region",
      title: "환불률이 높은 지역",
      subtitle: "선택 기간의 지역별 환불률을 비교합니다.",
    };
  }

  if (question.includes("광고") || question.includes("roas")) {
    return {
      intent: "comparison",
      goal: "광고비 대비 성과와 캠페인별 차이를 확인합니다.",
      primaryMetric: "roas",
      period: { preset: "lastMonth" },
      compareWith: "previousPeriod",
      filters: [],
      focusDimension: "campaign",
      title: "광고비 대비 성과",
      subtitle: "광고 효율과 캠페인별 변화를 이전 기간과 비교합니다.",
    };
  }

  if (
    question.includes("상품") &&
    (question.includes("하락") || question.includes("감소"))
  ) {
    return {
      intent: "ranking",
      goal: "매출 하락에 크게 기여한 상품을 확인합니다.",
      primaryMetric: "revenue",
      period: { preset: "lastMonth" },
      compareWith: "previousPeriod",
      filters: [],
      focusDimension: "product",
      title: "하락 기여 상품 분석",
      subtitle: "지난달과 이전 기간의 상품별 변화를 비교합니다.",
    };
  }

  if (question.includes("모바일")) {
    return {
      intent: "segmentAnalysis",
      goal: "모바일 세그먼트의 매출 변화와 카테고리별 차이를 확인합니다.",
      primaryMetric: "revenue",
      period: { preset: "lastMonth" },
      compareWith: "previousPeriod",
      filters: [{ dimension: "device", operator: "eq", values: ["mobile"] }],
      focusDimension: "category",
      title: "모바일 성과 분석",
      subtitle: "모바일 데이터만 사용해 이전 기간 대비 변화를 확인합니다.",
    };
  }

  if (question.includes("작년") && question.includes("비교")) {
    return {
      intent: "comparison",
      goal: "지난달 매출을 작년 같은 기간과 비교합니다.",
      primaryMetric: "revenue",
      period: { preset: "lastMonth" },
      compareWith: "previousYear",
      filters: [],
      focusDimension: "device",
      title: "작년 같은 기간과의 비교",
      subtitle: "지난달 매출과 세그먼트별 변화를 전년 동기와 비교합니다.",
    };
  }

  if (question.includes("이번 달") || question.includes("이번달")) {
    return {
      intent: "overview",
      goal: "이번 달 핵심 성과와 일별 흐름을 확인합니다.",
      primaryMetric: "revenue",
      period: { preset: "thisMonth" },
      compareWith: "previousPeriod",
      filters: [],
      focusDimension: "device",
      title: "이번 달 성과 스냅샷",
      subtitle: "현재 완료 데이터 기준 이번 달의 핵심 성과를 봅니다.",
    };
  }

  if (
    question.includes("지난달") &&
    question.includes("매출") &&
    (question.includes("감소") ||
      question.includes("하락") ||
      question.includes("왜"))
  ) {
    return rootCauseDefinition();
  }

  throw new UnsupportedQuestionError();
}

function createQueries(definition: MockAnalysisDefinition): AnalyticsQuery[] {
  const { compareWith, filters, period, primaryMetric } = definition;
  const queries = [
    createQuery("primary", primaryMetric, period, compareWith, filters),
    createQuery("trend", primaryMetric, period, compareWith, filters, "date"),
  ];

  if (definition.focusDimension) {
    queries.push(
      createQuery(
        "focus",
        primaryMetric,
        period,
        compareWith,
        filters,
        definition.focusDimension,
      ),
    );
  }

  if (definition.stackedSeries) {
    queries.push(
      ...definition.stackedSeries.map((series) =>
        createQuery(
          `stack-${series.id}`,
          primaryMetric,
          period,
          "none",
          normalizeAnalyticsFilters([...filters, series.filter]),
          "date",
        ),
      ),
    );
  }

  if (definition.intent === "rootCause" || definition.intent === "comparison") {
    queries.push(
      createQuery(
        "category",
        primaryMetric,
        period,
        compareWith,
        filters,
        "category",
      ),
    );
  }

  return queries;
}

function createInitialContextPatch(
  definition: MockAnalysisDefinition,
): AnalysisContextPatch {
  return {
    primaryMetric: definition.primaryMetric,
    period: definition.period,
    compareWith: definition.compareWith,
    filters: definition.filters,
    ...(definition.focusDimension
      ? { focusDimension: definition.focusDimension }
      : {}),
  };
}

function createFollowUpContextPatch(
  normalizedQuestion: string,
): AnalysisContextPatch {
  const patch: AnalysisContextPatch = {};

  if (normalizedQuestion.includes("모바일")) {
    patch.filters = [
      { dimension: "device", operator: "eq", values: ["mobile"] },
    ];
    patch.focusDimension = "category";
  }

  if (
    normalizedQuestion.includes("작년") &&
    normalizedQuestion.includes("비교")
  ) {
    patch.compareWith = "previousYear";
  }

  return patch;
}

function applyContextPatch(
  definition: MockAnalysisDefinition,
  currentContext: AnalysisContext | undefined,
  patch: AnalysisContextPatch,
): MockAnalysisDefinition {
  const filters = normalizeAnalyticsFilters(
    patch.filters ?? currentContext?.filters ?? definition.filters,
  );

  return {
    ...definition,
    primaryMetric:
      patch.primaryMetric ??
      currentContext?.primaryMetric ??
      definition.primaryMetric,
    period: patch.period ?? currentContext?.period ?? definition.period,
    compareWith:
      patch.compareWith ??
      currentContext?.compareWith ??
      definition.compareWith,
    filters,
    focusDimension:
      patch.focusDimension ??
      currentContext?.focusDimension ??
      definition.focusDimension,
    ...(filters.some((filter) => filter.dimension === "device")
      ? { stackedSeries: undefined }
      : {}),
  };
}

function getInsightTone(
  finding: Finding,
): "neutral" | "positive" | "warning" | "critical" {
  if (finding.severity === "critical") {
    return "critical";
  }

  if (finding.severity === "warning") {
    return "warning";
  }

  if (finding.severity === "positive") {
    return "positive";
  }

  return "neutral";
}

function createDashboardSpec(
  input: DashboardComposerInput,
  definition: MockAnalysisDefinition,
): DashboardSpec {
  const primaryDataset = input.datasets.find(
    (dataset) => dataset.queryId === "primary",
  );
  const trendDataset = input.datasets.find(
    (dataset) => dataset.queryId === "trend",
  );
  const focusDataset = input.datasets.find(
    (dataset) => dataset.queryId === "focus",
  );
  const categoryDataset = input.datasets.find(
    (dataset) => dataset.queryId === "category",
  );
  const stackedSeries = (definition.stackedSeries ?? []).flatMap((series) =>
    input.datasets.some((dataset) => dataset.queryId === `stack-${series.id}`)
      ? [
          {
            queryId: `stack-${series.id}`,
            label: series.label,
          },
        ]
      : [],
  );
  const leadFinding =
    input.findings.find(
      (finding) => finding.type === "driver" && finding.dimension !== "date",
    ) ??
    input.findings.find((finding) => finding.type === "trend") ??
    input.findings.find((finding) => finding.type === "ranking");
  const widgets: unknown[] = [];

  if (primaryDataset) {
    widgets.push({
      id: "primary-metric",
      type: "metric",
      title: definition.widgetTitles?.primary ?? "핵심 지표",
      description: "선택 기간의 결정론적 계산 결과입니다.",
      queryIds: [primaryDataset.queryId],
      findingIds: [],
      size: "small",
      config: {
        queryId: primaryDataset.queryId,
        metric: primaryDataset.metric,
      },
    });
  }

  if (trendDataset) {
    widgets.push({
      id: "performance-trend",
      type: "timeSeries",
      title: definition.widgetTitles?.trend ?? "기간별 흐름",
      queryIds: [trendDataset.queryId],
      findingIds: [],
      size: "large",
      config: { queryId: trendDataset.queryId, xKey: "label" },
    });
  }

  if (focusDataset) {
    widgets.push({
      id: "focus-segments",
      type: "categoryBar",
      title: definition.widgetTitles?.focus ?? "주요 세그먼트 비교",
      queryIds: [focusDataset.queryId],
      findingIds: [],
      size: "medium",
      config: { queryId: focusDataset.queryId, orientation: "horizontal" },
    });
  }

  if (stackedSeries.length >= 2) {
    widgets.push({
      id: "stacked-segment-trend",
      type: "stackedBar",
      title: definition.widgetTitles?.stacked ?? "기간별 세그먼트 구성",
      description:
        "같은 일자의 세그먼트 값을 누적해 전체와 구성을 함께 표시합니다.",
      queryIds: stackedSeries.map((series) => series.queryId),
      findingIds: [],
      size: "large",
      config: { series: stackedSeries, xKey: "label" },
    });
  }

  if (definition.calendarHeatmap && trendDataset) {
    widgets.push({
      id: "calendar-heatmap",
      type: "calendarHeatmap",
      title: definition.widgetTitles?.heatmap ?? "일자별 집중도",
      queryIds: [trendDataset.queryId],
      findingIds: [],
      size: "large",
      config: { queryId: trendDataset.queryId, xKey: "label" },
    });
  }

  if (categoryDataset) {
    widgets.push({
      id: "category-ranking",
      type: "rankingTable",
      title: "카테고리별 결과",
      queryIds: [categoryDataset.queryId],
      findingIds: [],
      size: "medium",
      config: { queryId: categoryDataset.queryId },
    });
  }

  if (leadFinding) {
    widgets.push({
      id: "computed-insight",
      type: "insight",
      title: "계산된 핵심 근거",
      queryIds: leadFinding.evidenceQueryIds,
      findingIds: [leadFinding.id],
      size: "medium",
      config: { findingId: leadFinding.id, tone: getInsightTone(leadFinding) },
    });
  }

  return dashboardSpecSchema.parse({
    id: input.dashboardId,
    title: definition.title,
    subtitle: definition.subtitle,
    summary:
      "모든 수치는 Local Synthetic Data를 결정론적으로 계산한 결과입니다.",
    context: input.context,
    widgets,
  });
}

export class MockAIProvider implements AIProvider {
  readonly metadata: AIProviderMetadata;

  constructor(options: { fallbackUsed?: boolean } = {}) {
    this.metadata = {
      provider: "mock",
      model: null,
      mockMode: true,
      fallbackUsed: options.fallbackUsed ?? false,
    };
  }

  async createPlan(input: PlannerInput): Promise<AnalysisPlan> {
    const normalizedQuestion = normalizeQuestion(input.question);
    const definition = resolveDefinition(normalizedQuestion);
    const contextPatch = input.currentContext
      ? createFollowUpContextPatch(normalizedQuestion)
      : createInitialContextPatch(definition);
    const effectiveDefinition = applyContextPatch(
      definition,
      input.currentContext,
      contextPatch,
    );

    return analysisPlanSchema.parse({
      intent: definition.intent,
      normalizedQuestion,
      contextPatch,
      queries: createQueries(effectiveDefinition),
      analysisGoal: definition.goal,
    });
  }

  async createDashboard(input: DashboardComposerInput): Promise<DashboardSpec> {
    const definition = applyContextPatch(
      resolveDefinition(input.plan.normalizedQuestion),
      input.context,
      {},
    );

    return createDashboardSpec(input, definition);
  }
}
