import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";

import {
  dashboardSpecSchema,
  dashboardWidgetSchema,
  type DashboardSpec,
  type DashboardWidget,
} from "./schemas/dashboard-spec";

type DashboardSanitizerInput = {
  dashboard: DashboardSpec;
  datasets: readonly AnalyticsDataset[];
  findings: readonly Finding[];
};

export type DashboardSanitizerResult = {
  dashboard: DashboardSpec;
  fallbackUsed: boolean;
  removedWidgetCount: number;
};

function sanitizeWidget(
  widget: DashboardWidget,
  queryIds: ReadonlySet<string>,
  findingIds: ReadonlySet<string>,
): DashboardWidget | undefined {
  const validQueryIds = widget.queryIds.filter((id) => queryIds.has(id));
  const validFindingIds = widget.findingIds.filter((id) => findingIds.has(id));

  if (widget.type === "insight") {
    if (!findingIds.has(widget.config.findingId)) {
      return undefined;
    }

    return dashboardWidgetSchema.parse({
      ...widget,
      queryIds: validQueryIds,
      findingIds: validFindingIds,
    });
  }

  if (!queryIds.has(widget.config.queryId)) {
    return undefined;
  }

  return dashboardWidgetSchema.parse({
    ...widget,
    queryIds: validQueryIds,
    findingIds: validFindingIds,
  });
}

function createFallbackDashboard(
  dashboard: DashboardSpec,
  datasets: readonly AnalyticsDataset[],
  findings: readonly Finding[],
): DashboardSpec {
  const primaryDataset =
    datasets.find((dataset) => !dataset.groupBy) ?? datasets[0];

  if (!primaryDataset) {
    throw new Error("A dashboard fallback requires at least one dataset.");
  }

  const widgets: unknown[] = [
    {
      id: "fallback-primary-metric",
      type: "metric",
      title: "검증된 핵심 지표",
      queryIds: [primaryDataset.queryId],
      findingIds: [],
      size: "medium",
      config: {
        queryId: primaryDataset.queryId,
        metric: primaryDataset.metric,
      },
    },
  ];
  const trendDataset = datasets.find((dataset) => dataset.groupBy === "date");
  const driverFinding = findings.find((finding) => finding.type === "driver");

  if (trendDataset) {
    widgets.push({
      id: "fallback-trend",
      type: "timeSeries",
      title: "기간별 변화",
      queryIds: [trendDataset.queryId],
      findingIds: [],
      size: "large",
      config: { queryId: trendDataset.queryId, xKey: "label" },
    });
  }

  if (driverFinding) {
    widgets.push({
      id: "fallback-insight",
      type: "insight",
      title: "계산된 핵심 근거",
      queryIds: driverFinding.evidenceQueryIds,
      findingIds: [driverFinding.id],
      size: "medium",
      config: { findingId: driverFinding.id, tone: "warning" },
    });
  }

  return dashboardSpecSchema.parse({
    ...dashboard,
    title: "검증된 분석 결과",
    subtitle: "유효한 데이터와 Finding 참조로 다시 구성했습니다.",
    summary: "표시된 수치는 결정론적 Analytics Engine의 결과입니다.",
    widgets,
  });
}

export function sanitizeDashboardSpec({
  dashboard,
  datasets,
  findings,
}: DashboardSanitizerInput): DashboardSanitizerResult {
  const queryIds = new Set(datasets.map((dataset) => dataset.queryId));
  const findingIds = new Set(findings.map((finding) => finding.id));
  const sanitizedWidgets = dashboard.widgets.flatMap((widget) => {
    const sanitizedWidget = sanitizeWidget(widget, queryIds, findingIds);

    return sanitizedWidget ? [sanitizedWidget] : [];
  });

  if (sanitizedWidgets.length === 0) {
    return {
      dashboard: createFallbackDashboard(dashboard, datasets, findings),
      fallbackUsed: true,
      removedWidgetCount: dashboard.widgets.length,
    };
  }

  return {
    dashboard: dashboardSpecSchema.parse({
      ...dashboard,
      widgets: sanitizedWidgets,
    }),
    fallbackUsed: false,
    removedWidgetCount: dashboard.widgets.length - sanitizedWidgets.length,
  };
}
