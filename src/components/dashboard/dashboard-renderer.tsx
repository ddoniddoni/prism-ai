"use client";

import { SlidersHorizontal, X } from "lucide-react";
import dynamic from "next/dynamic";
import { memo, type ReactNode, useMemo, useState } from "react";

import { dimensionCatalog } from "@/lib/analytics/dimension-catalog";
import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";
import { metricCatalog } from "@/lib/analytics/metric-catalog";
import {
  compareModes,
  type AnalyticsFilter,
  type CompareMode,
} from "@/lib/analytics/query-schema";
import type {
  DashboardSpec,
  DashboardWidget,
} from "@/lib/ai/schemas/dashboard-spec";
import {
  createDashboardLayoutPlan,
  dashboardLayoutConstraints,
  type DashboardLayoutDataDensity,
  type DashboardLayoutBreakpoint,
  type DashboardLayoutPlan,
  type DashboardWidgetPresentation,
} from "@/stores/dashboard-layout";

import {
  formatChangeWithDirection,
  formatDimensionValue,
  formatMetricValue,
  getComparisonLabel,
  getPeriodLabel,
  localizeAnalyticsText,
} from "./formatters";
import { DashboardDrilldown } from "./dashboard-drilldown";
import {
  getDashboardContextFilterLabel,
  removeDashboardContextFilter,
} from "./dashboard-context-controls-data";
import {
  getDashboardWidgetDrilldown,
  type DashboardDrilldownSelection,
} from "./dashboard-drilldown-data";

const PrismTrendChart = dynamic(
  () => import("./prism-trend-chart").then((module) => module.PrismTrendChart),
  {
    loading: () => (
      <div
        aria-label="추이 차트를 불러오는 중"
        className="prism-skeleton h-52 rounded-xl sm:h-60"
      />
    ),
    ssr: false,
  },
);

const PrismDonutChart = dynamic(
  () => import("./prism-donut-chart").then((module) => module.PrismDonutChart),
  {
    loading: () => (
      <div
        aria-label="구성비 차트를 불러오는 중"
        className="prism-skeleton h-48 rounded-xl"
      />
    ),
    ssr: false,
  },
);

const PrismRankedBarChart = dynamic(
  () =>
    import("./prism-ranked-bar-chart").then(
      (module) => module.PrismRankedBarChart,
    ),
  {
    loading: () => (
      <div
        aria-label="랭킹 차트를 불러오는 중"
        className="prism-skeleton h-44 rounded-xl"
      />
    ),
    ssr: false,
  },
);

const PrismStackedBarChart = dynamic(
  () =>
    import("./prism-stacked-bar-chart").then(
      (module) => module.PrismStackedBarChart,
    ),
  {
    loading: () => (
      <div
        aria-label="누적 막대 차트를 불러오는 중"
        className="prism-skeleton h-48 rounded-xl sm:h-52"
      />
    ),
    ssr: false,
  },
);

const PrismCalendarHeatmap = dynamic(
  () =>
    import("./prism-calendar-heatmap").then(
      (module) => module.PrismCalendarHeatmap,
    ),
  {
    loading: () => (
      <div
        aria-label="캘린더 히트맵을 불러오는 중"
        className="prism-skeleton h-40 rounded-xl"
      />
    ),
    ssr: false,
  },
);

type DashboardRendererProps = {
  dashboard: DashboardSpec;
  datasets: readonly AnalyticsDataset[];
  findings: readonly Finding[];
};

type DashboardWidgetProps = {
  activeDrilldown?: DashboardDrilldownSelection | null;
  widget: DashboardWidget;
  datasetsById: ReadonlyMap<string, AnalyticsDataset>;
  findingsById: ReadonlyMap<string, Finding>;
  cardClassName?: string;
  controls?: ReactNode;
  drilldownAnalysisDisabled?: boolean;
  onDrilldownChange?: (selection: DashboardDrilldownSelection | null) => void;
  onDrilldownAnalysis?: (filter: AnalyticsFilter) => void;
  presentation?: DashboardWidgetPresentation;
};

const gridSpanClassNames: Record<
  Exclude<DashboardLayoutBreakpoint, "sm">,
  Record<number, string>
> = {
  lg: {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    10: "lg:col-span-10",
    11: "lg:col-span-11",
    12: "lg:col-span-12",
  },
  md: {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
  },
};

function getWidgetGridClassName(
  widget: DashboardWidget,
  mdLayoutPlan: DashboardLayoutPlan,
  lgLayoutPlan: DashboardLayoutPlan,
): string {
  const mdSpan = mdLayoutPlan.get(widget.id)?.w ?? 1;
  const lgSpan = lgLayoutPlan.get(widget.id)?.w ?? 1;

  return `${gridSpanClassNames.md[mdSpan]} ${gridSpanClassNames.lg[lgSpan]}`;
}

function getDashboardGridWidgetOrder(
  widgets: readonly DashboardWidget[],
  layoutPlan: DashboardLayoutPlan,
): readonly DashboardWidget[] {
  return widgets
    .map((widget, index) => ({
      index,
      layout: layoutPlan.get(widget.id),
      widget,
    }))
    .toSorted(
      (left, right) =>
        (left.layout?.y ?? 0) - (right.layout?.y ?? 0) ||
        (left.layout?.x ?? 0) - (right.layout?.x ?? 0) ||
        left.index - right.index,
    )
    .map((item) => item.widget);
}

type DashboardWidgetDisplayCopy = {
  description: string;
  label: string;
  title: string;
};

function getDashboardWidgetDisplayCopy(
  widget: DashboardWidget,
  dataset?: AnalyticsDataset,
): DashboardWidgetDisplayCopy {
  const metric =
    metricCatalog[
      dataset?.metric ??
        (widget.type === "metric" ? widget.config.metric : "revenue")
    ].label;
  const dimension = dataset?.groupBy
    ? dimensionCatalog[dataset.groupBy].label
    : "항목";

  switch (widget.type) {
    case "metric":
      return {
        description: `선택 기간의 ${metric} 집계 결과`,
        label: "핵심 지표",
        title: `핵심 ${metric}`,
      };
    case "timeSeries":
      return {
        description: `기간별 ${metric} 변화를 확인합니다.`,
        label: "기간 추이",
        title: `기간별 ${metric} 추이`,
      };
    case "categoryBar":
      return {
        description: `${dimension} 기준으로 정렬한 ${metric}입니다.`,
        label: "비교 차트",
        title: `${dimension}별 ${metric}`,
      };
    case "stackedBar":
      return {
        description: `기간별 ${metric} 구성을 비교합니다.`,
        label: "구성 추이",
        title: `기간별 ${metric} 구성`,
      };
    case "calendarHeatmap":
      return {
        description: `일자별 ${metric} 집중도를 확인합니다.`,
        label: "일별 집중도",
        title: `일자별 ${metric} 집중도`,
      };
    case "donut":
      return {
        description: `${dimension}별 ${metric} 비중입니다.`,
        label: "구성비",
        title: `${dimension}별 ${metric} 구성`,
      };
    case "rankingTable":
      return {
        description: `검증 데이터 기준 ${dimension}별 순위입니다.`,
        label: "순위표",
        title: `${dimension} 순위`,
      };
    case "dataTable":
      return {
        description: `검증된 ${dimension}별 ${metric} 원본 값입니다.`,
        label: "데이터 표",
        title: `${dimension}별 ${metric} 데이터`,
      };
    case "insight":
      return {
        description: "계산된 결과와 검증 근거를 요약합니다.",
        label: "분석 인사이트",
        title: "핵심 분석",
      };
  }
}

function WidgetFrame({
  children,
  className,
  controls,
  dataset,
  descriptionClassName,
  density = "default",
  presentation = "standard",
  widget,
}: {
  children: ReactNode;
  className?: string;
  controls?: ReactNode;
  dataset?: AnalyticsDataset;
  descriptionClassName?: string;
  density?: "compact" | "default" | "feature";
  presentation?: DashboardWidgetPresentation;
  widget: DashboardWidget;
}) {
  const displayCopy = getDashboardWidgetDisplayCopy(widget, dataset);
  const resolvedDensity =
    density === "compact" || presentation === "compact"
      ? "compact"
      : density === "feature" || presentation === "feature"
        ? "feature"
        : "default";

  return (
    <section
      aria-labelledby={`${widget.id}-title`}
      className={`w-full self-start rounded-xl border border-[#e1e2e4] bg-white ${resolvedDensity === "compact" ? "p-3" : resolvedDensity === "feature" ? "p-4 sm:p-5" : "p-4"} ${className ?? ""}`}
      id={widget.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold tracking-[0.11em] text-[#777587] uppercase">
            {displayCopy.label}
          </p>
          <h2
            className="mt-1 text-[15px] font-semibold tracking-[-0.02em] break-words text-[#191c1e]"
            id={`${widget.id}-title`}
          >
            {displayCopy.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#dde2e8] bg-[#f8f9fb] px-1.5 py-0.5 text-[9px] text-[#777587]">
            {widget.queryIds.length}개 데이터 근거
          </span>
          {controls}
        </div>
      </div>
      {displayCopy.description ? (
        <p
          className={`mt-1.5 text-[12px] leading-5 break-words text-[#595e6b] ${descriptionClassName ?? ""}`}
        >
          {displayCopy.description}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MetricWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "metric") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const change = dataset?.points[0]?.percentChange ?? null;

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      density="compact"
      descriptionClassName="sr-only"
      presentation={presentation}
      widget={widget}
    >
      <p className="text-[28px] leading-none font-semibold tracking-[-0.045em] text-[#191c1e] sm:text-3xl">
        {formatMetricValue(widget.config.metric, dataset?.currentTotal)}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eef0f2] pt-2.5">
        <span className="text-[11px] text-[#595e6b]">
          {dataset?.comparisonRange ? "비교 기간 대비" : "비교 없음"}
        </span>
        <span
          className={`text-[12px] font-semibold ${change !== null && change < 0 ? "text-[#ba1a1a]" : "text-[#17835c]"}`}
        >
          {formatChangeWithDirection(change)}
        </span>
      </div>
    </WidgetFrame>
  );
}

function getActiveDrilldown(
  activeDrilldown: DashboardDrilldownSelection | null | undefined,
  widgetId: string,
  queryId: string,
): DashboardDrilldownSelection | undefined {
  return activeDrilldown?.widgetId === widgetId &&
    activeDrilldown.queryId === queryId
    ? activeDrilldown
    : undefined;
}

function createDrilldownSelection(
  widgetId: string,
  queryId: string,
  label: string,
): DashboardDrilldownSelection {
  return { label, queryId, widgetId };
}

function TimeSeriesWidget({
  activeDrilldown,
  widget,
  datasetsById,
  cardClassName,
  controls,
  drilldownAnalysisDisabled,
  findingsById,
  onDrilldownChange,
  onDrilldownAnalysis,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "timeSeries") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const selectedDrilldown = getActiveDrilldown(
    activeDrilldown,
    widget.id,
    widget.config.queryId,
  );

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      presentation={presentation}
      widget={widget}
    >
      <PrismTrendChart
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        presentation={presentation}
        title={getDashboardWidgetDisplayCopy(widget, dataset).title}
        onSelectPoint={(label) =>
          onDrilldownChange?.(
            createDrilldownSelection(widget.id, widget.config.queryId, label),
          )
        }
      />
      {dataset && selectedDrilldown ? (
        <DashboardDrilldown
          dataset={dataset}
          disabled={drilldownAnalysisDisabled}
          findings={[...findingsById.values()]}
          onAnalyzeSelection={onDrilldownAnalysis}
          onDismiss={() => onDrilldownChange?.(null)}
          selection={selectedDrilldown}
        />
      ) : null}
      <details className="mt-2 text-[11px] text-[#595e6b]">
        <summary className="cursor-pointer font-medium text-[#4f46e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]">
          차트 데이터 표 보기
        </summary>
        <div className="mt-2 max-h-44 overflow-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              {getDashboardWidgetDisplayCopy(widget, dataset).title} 원본 데이터
            </caption>
            <thead className="text-[#777587]">
              <tr>
                <th className="pb-2 font-medium">날짜</th>
                <th className="pb-2 text-right font-medium">값</th>
              </tr>
            </thead>
            <tbody>
              {(dataset?.points ?? []).map((point) => (
                <tr className="border-t border-[#eef0f2]" key={point.label}>
                  <td className="py-2">{point.label}</td>
                  <td className="py-2 text-right font-mono">
                    {formatMetricValue(
                      dataset?.metric ?? "revenue",
                      point.value,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </WidgetFrame>
  );
}

function CategoryBarWidget({
  activeDrilldown,
  widget,
  datasetsById,
  cardClassName,
  controls,
  drilldownAnalysisDisabled,
  findingsById,
  onDrilldownChange,
  onDrilldownAnalysis,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "categoryBar") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const selectedDrilldown = getActiveDrilldown(
    activeDrilldown,
    widget.id,
    widget.config.queryId,
  );

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      descriptionClassName="sr-only"
      presentation={presentation}
      widget={widget}
    >
      <PrismRankedBarChart
        dimension={dataset?.groupBy}
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        presentation={presentation}
        title={getDashboardWidgetDisplayCopy(widget, dataset).title}
        onSelectPoint={(label) =>
          onDrilldownChange?.(
            createDrilldownSelection(widget.id, widget.config.queryId, label),
          )
        }
      />
      {dataset && selectedDrilldown ? (
        <DashboardDrilldown
          dataset={dataset}
          disabled={drilldownAnalysisDisabled}
          findings={[...findingsById.values()]}
          onAnalyzeSelection={onDrilldownAnalysis}
          onDismiss={() => onDrilldownChange?.(null)}
          selection={selectedDrilldown}
        />
      ) : null}
    </WidgetFrame>
  );
}

function DonutWidget({
  activeDrilldown,
  widget,
  datasetsById,
  cardClassName,
  controls,
  drilldownAnalysisDisabled,
  findingsById,
  onDrilldownChange,
  onDrilldownAnalysis,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "donut") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const selectedDrilldown = getActiveDrilldown(
    activeDrilldown,
    widget.id,
    widget.config.queryId,
  );

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      presentation={presentation}
      widget={widget}
    >
      <PrismDonutChart
        dimension={dataset?.groupBy}
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        presentation={presentation}
        title={getDashboardWidgetDisplayCopy(widget, dataset).title}
        onSelectPoint={(label) =>
          onDrilldownChange?.(
            createDrilldownSelection(widget.id, widget.config.queryId, label),
          )
        }
      />
      {dataset && selectedDrilldown ? (
        <DashboardDrilldown
          dataset={dataset}
          disabled={drilldownAnalysisDisabled}
          findings={[...findingsById.values()]}
          onAnalyzeSelection={onDrilldownAnalysis}
          onDismiss={() => onDrilldownChange?.(null)}
          selection={selectedDrilldown}
        />
      ) : null}
    </WidgetFrame>
  );
}

function StackedBarWidget({
  activeDrilldown,
  widget,
  datasetsById,
  cardClassName,
  controls,
  drilldownAnalysisDisabled,
  findingsById,
  onDrilldownChange,
  onDrilldownAnalysis,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "stackedBar") {
    return null;
  }

  const series = widget.config.series.flatMap((item) => {
    const dataset = datasetsById.get(item.queryId);

    return dataset
      ? [
          {
            id: item.queryId,
            label: formatDimensionValue("device", item.label),
            points: dataset.points,
          },
        ]
      : [];
  });
  const primaryDataset = datasetsById.get(
    widget.config.series[0]?.queryId ?? "",
  );
  const metric =
    datasetsById.get(widget.config.series[0]?.queryId ?? "")?.metric ??
    "revenue";
  const selectedDataset = activeDrilldown
    ? datasetsById.get(activeDrilldown.queryId)
    : undefined;
  const selectedDrilldown =
    activeDrilldown?.widgetId === widget.id && selectedDataset
      ? activeDrilldown
      : undefined;

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={primaryDataset}
      descriptionClassName="sr-only"
      presentation={presentation}
      widget={widget}
    >
      <PrismStackedBarChart
        metric={metric}
        presentation={presentation}
        series={series}
        title={getDashboardWidgetDisplayCopy(widget, primaryDataset).title}
        onSelectPoint={(queryId, label) =>
          onDrilldownChange?.(
            createDrilldownSelection(widget.id, queryId, label),
          )
        }
      />
      {selectedDataset && selectedDrilldown ? (
        <DashboardDrilldown
          dataset={selectedDataset}
          disabled={drilldownAnalysisDisabled}
          findings={[...findingsById.values()]}
          onAnalyzeSelection={onDrilldownAnalysis}
          onDismiss={() => onDrilldownChange?.(null)}
          selection={selectedDrilldown}
        />
      ) : null}
    </WidgetFrame>
  );
}

function CalendarHeatmapWidget({
  activeDrilldown,
  widget,
  datasetsById,
  cardClassName,
  controls,
  drilldownAnalysisDisabled,
  findingsById,
  onDrilldownChange,
  onDrilldownAnalysis,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "calendarHeatmap") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const selectedDrilldown = getActiveDrilldown(
    activeDrilldown,
    widget.id,
    widget.config.queryId,
  );

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      density={presentation === "feature" ? "feature" : "compact"}
      presentation={presentation}
      widget={widget}
    >
      <PrismCalendarHeatmap
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        presentation={presentation}
        selectedDate={selectedDrilldown?.label}
        title={getDashboardWidgetDisplayCopy(widget, dataset).title}
        onSelectPoint={(label) =>
          onDrilldownChange?.(
            createDrilldownSelection(widget.id, widget.config.queryId, label),
          )
        }
      />
      {dataset && selectedDrilldown ? (
        <DashboardDrilldown
          dataset={dataset}
          disabled={drilldownAnalysisDisabled}
          findings={[...findingsById.values()]}
          onAnalyzeSelection={onDrilldownAnalysis}
          onDismiss={() => onDrilldownChange?.(null)}
          selection={selectedDrilldown}
        />
      ) : null}
    </WidgetFrame>
  );
}

function TableWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "rankingTable" && widget.type !== "dataTable") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const hasComparison = Boolean(dataset?.comparisonRange);
  const displayCopy = getDashboardWidgetDisplayCopy(widget, dataset);

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      dataset={dataset}
      presentation={presentation}
      widget={widget}
    >
      <div className="min-w-0">
        <table className="w-full table-fixed text-left text-[11px] sm:text-[12px]">
          <caption className="sr-only">{displayCopy.title} 데이터 표</caption>
          <colgroup>
            {widget.type === "rankingTable" ? <col className="w-9" /> : null}
            <col />
            <col className="w-[34%]" />
            {hasComparison ? <col className="w-[24%]" /> : null}
          </colgroup>
          <thead className="border-b border-[#dde2e8] text-[9px] tracking-[0.1em] text-[#777587] uppercase">
            <tr>
              {widget.type === "rankingTable" ? (
                <th className="pb-2.5 font-medium">순위</th>
              ) : null}
              <th className="pb-2.5 font-medium">항목</th>
              <th className="pb-2.5 text-right font-medium">현재</th>
              {hasComparison ? (
                <th className="pb-2.5 text-right font-medium">변화</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {(dataset?.points ?? []).map((point, index) => (
              <tr className="border-b border-[#eef0f2]" key={point.label}>
                {widget.type === "rankingTable" ? (
                  <td className="py-2.5 font-mono text-[#777587]">
                    {index + 1}
                  </td>
                ) : null}
                <td className="min-w-0 py-2.5 font-medium text-[#191c1e]">
                  <span
                    className="block truncate"
                    title={formatDimensionValue(dataset?.groupBy, point.label)}
                  >
                    {formatDimensionValue(dataset?.groupBy, point.label)}
                  </span>
                </td>
                <td className="py-2.5 text-right text-[#424753]">
                  {formatMetricValue(dataset?.metric ?? "revenue", point.value)}
                </td>
                {hasComparison ? (
                  <td className="py-2.5 text-right text-[#595e6b]">
                    {formatChangeWithDirection(point.percentChange)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
}

function InsightWidget({
  widget,
  findingsById,
  cardClassName,
  controls,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "insight") {
    return null;
  }

  const finding = findingsById.get(widget.config.findingId);
  const toneClass: Record<typeof widget.config.tone, string> = {
    neutral: "border-[#c3c0ff] bg-[#eef2ff]",
    positive: "border-[#a8dcc5] bg-[#effaf5]",
    warning: "border-[#ebcf9d] bg-[#fff9ec]",
    critical: "border-[#f0b8b4] bg-[#fff4f2]",
  };

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      presentation={presentation}
      widget={widget}
    >
      <div className={`rounded-lg border p-4 ${toneClass[widget.config.tone]}`}>
        <p className="text-[13px] leading-6 text-[#191c1e]">
          {finding
            ? localizeAnalyticsText(finding.fallbackText)
            : "검증된 분석 근거를 찾지 못했습니다."}
        </p>
        <p className="mt-3 text-[9px] tracking-[0.09em] text-[#777587] uppercase">
          검증 근거 · {finding?.evidenceQueryIds.length ?? 0}개 데이터
        </p>
      </div>
    </WidgetFrame>
  );
}

const componentRegistry = {
  metric: MetricWidget,
  timeSeries: TimeSeriesWidget,
  categoryBar: CategoryBarWidget,
  stackedBar: StackedBarWidget,
  calendarHeatmap: CalendarHeatmapWidget,
  donut: DonutWidget,
  rankingTable: TableWidget,
  dataTable: TableWidget,
  insight: InsightWidget,
} satisfies Record<
  DashboardWidget["type"],
  (props: DashboardWidgetProps) => ReactNode
>;

export const DashboardWidgetCard = memo(function DashboardWidgetCard(
  props: DashboardWidgetProps,
) {
  const Widget = componentRegistry[props.widget.type];

  return <Widget {...props} />;
});

function getDashboardHeaderCopy(dashboard: DashboardSpec): {
  subtitle: string;
  summary: string;
  title: string;
} {
  const primaryMetric = metricCatalog[dashboard.context.primaryMetric].label;
  const [singleFilter] = dashboard.context.filters;
  const scope =
    dashboard.context.filters.length === 1 && singleFilter?.values.length === 1
      ? formatDimensionValue(singleFilter.dimension, singleFilter.values[0])
      : undefined;
  const period = getPeriodLabel(dashboard.context.period);

  return {
    subtitle: scope
      ? `${period} ${scope} 범위의 검증 데이터를 기준으로 분석했습니다.`
      : `${period} 전체 데이터를 기준으로 분석했습니다.`,
    summary: "표시된 수치는 결정론적 분석 엔진이 계산한 결과입니다.",
    title: `${scope ? `${scope} ` : ""}${primaryMetric} 분석 결과`,
  };
}

export function DashboardHeader({
  dashboard,
  comparisonControlsDisabled = false,
  filterControlsDisabled = false,
  onComparisonChange,
  onFiltersChange,
}: {
  dashboard: DashboardSpec;
  comparisonControlsDisabled?: boolean;
  filterControlsDisabled?: boolean;
  onComparisonChange?: (compareWith: CompareMode) => void;
  onFiltersChange?: (filters: readonly AnalyticsFilter[]) => void;
}) {
  const canChangeComparison = Boolean(onComparisonChange);
  const canChangeFilters = Boolean(onFiltersChange);
  const headerCopy = getDashboardHeaderCopy(dashboard);

  return (
    <div className="py-2 sm:py-3">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-[#4f46e5] uppercase">
        검증된 데이터 기반
      </p>
      <h1
        className="mt-2 max-w-4xl text-[28px] leading-tight font-semibold tracking-[-0.04em] text-[#191c1e] sm:text-[34px]"
        id="analysis-dashboard-title"
      >
        {headerCopy.title}
      </h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#595e6b]">
        {headerCopy.subtitle}
      </p>
      <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#777587]">
        {headerCopy.summary}
      </p>
      <div className="mt-4 rounded-lg border border-[#dde2e8] bg-[#f8f9fb] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-[#595e6b] uppercase">
            <SlidersHorizontal aria-hidden="true" className="size-3" />
            분석 조건
          </p>
          {dashboard.context.filters.length > 0 && canChangeFilters ? (
            <button
              className="min-h-8 rounded-md px-2 text-[10px] font-semibold text-[#4f46e5] transition-colors hover:bg-[#eef2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-not-allowed disabled:text-[#9296a0]"
              disabled={filterControlsDisabled}
              onClick={() => onFiltersChange?.([])}
              type="button"
            >
              전체 해제
            </button>
          ) : null}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-[#595e6b]">
          <span className="rounded-md border border-[#dde2e8] bg-white px-2.5 py-1.5">
            {getPeriodLabel(dashboard.context.period)}
          </span>
          {canChangeComparison ? (
            <label className="rounded-md border border-[#c3c0ff] bg-white text-[#3525cd] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4f46e5]">
              <span className="sr-only">비교 기준</span>
              <select
                aria-label="비교 기준"
                className="min-h-8 cursor-pointer bg-transparent py-1.5 pr-2 pl-2.5 font-medium outline-none disabled:cursor-not-allowed disabled:text-[#9296a0]"
                disabled={comparisonControlsDisabled}
                onChange={(event) => {
                  const nextCompareWith = compareModes.find(
                    (compareWith) => compareWith === event.target.value,
                  );

                  if (nextCompareWith) {
                    onComparisonChange?.(nextCompareWith);
                  }
                }}
                value={dashboard.context.compareWith}
              >
                {compareModes.map((compareWith) => (
                  <option key={compareWith} value={compareWith}>
                    {getComparisonLabel(compareWith)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="rounded-md border border-[#dde2e8] bg-white px-2.5 py-1.5">
              {getComparisonLabel(dashboard.context.compareWith)}
            </span>
          )}
          {dashboard.context.filters.length === 0 ? (
            <span className="rounded-md border border-dashed border-[#c9ccd2] bg-white px-2.5 py-1.5 text-[#777587]">
              전체 데이터
            </span>
          ) : (
            dashboard.context.filters.map((filter) => {
              const label = getDashboardContextFilterLabel(filter);

              return (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-[#c3c0ff] bg-[#eef2ff] py-1 pl-2.5 text-[#3525cd]"
                  key={`${filter.dimension}-${filter.operator}-${filter.values.join("-")}`}
                >
                  {label}
                  {canChangeFilters ? (
                    <button
                      aria-label={`${label} 조건 제거`}
                      className="grid size-7 place-items-center rounded-r-md text-[#4f46e5] transition-colors hover:bg-[#dedcff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-not-allowed disabled:text-[#9296a0]"
                      disabled={filterControlsDisabled}
                      onClick={() =>
                        onFiltersChange?.(
                          removeDashboardContextFilter(
                            dashboard.context.filters,
                            filter,
                          ),
                        )
                      }
                      type="button"
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  ) : null}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardWidgetGrid({
  activeDrilldown,
  drilldownAnalysisDisabled,
  widgets,
  datasets,
  findings,
  onDrilldownChange,
  onDrilldownAnalysis,
}: Pick<DashboardRendererProps, "datasets" | "findings"> & {
  activeDrilldown?: DashboardDrilldownSelection | null;
  drilldownAnalysisDisabled?: boolean;
  onDrilldownChange?: (selection: DashboardDrilldownSelection | null) => void;
  onDrilldownAnalysis?: (filter: AnalyticsFilter) => void;
  widgets: readonly DashboardWidget[];
}) {
  const datasetsById = useMemo(
    () => new Map(datasets.map((dataset) => [dataset.queryId, dataset])),
    [datasets],
  );
  const findingsById = useMemo(
    () => new Map(findings.map((finding) => [finding.id, finding])),
    [findings],
  );
  const layoutDataDensity = useMemo<DashboardLayoutDataDensity>(
    () =>
      Object.fromEntries(
        datasets.map((dataset) => [dataset.queryId, dataset.points.length]),
      ),
    [datasets],
  );
  const mdLayoutPlan = useMemo(
    () => createDashboardLayoutPlan(widgets, "md", layoutDataDensity),
    [layoutDataDensity, widgets],
  );
  const lgLayoutPlan = useMemo(
    () => createDashboardLayoutPlan(widgets, "lg", layoutDataDensity),
    [layoutDataDensity, widgets],
  );
  const orderedWidgets = useMemo(
    () => getDashboardGridWidgetOrder(widgets, lgLayoutPlan),
    [lgLayoutPlan, widgets],
  );

  return (
    <div
      className="mt-5 grid md:grid-cols-6 lg:grid-cols-12"
      style={{ gap: dashboardLayoutConstraints.lg.gutterPx }}
    >
      {orderedWidgets.map((widget) => (
        <div
          className={getWidgetGridClassName(widget, mdLayoutPlan, lgLayoutPlan)}
          key={widget.id}
        >
          <DashboardWidgetCard
            activeDrilldown={getDashboardWidgetDrilldown(
              activeDrilldown,
              widget.id,
            )}
            datasetsById={datasetsById}
            drilldownAnalysisDisabled={drilldownAnalysisDisabled}
            findingsById={findingsById}
            onDrilldownChange={onDrilldownChange}
            onDrilldownAnalysis={onDrilldownAnalysis}
            presentation={lgLayoutPlan.get(widget.id)?.presentation}
            widget={widget}
          />
        </div>
      ))}
    </div>
  );
}

export function DashboardRenderer({
  dashboard,
  datasets,
  findings,
}: DashboardRendererProps) {
  const [activeDrilldown, setActiveDrilldown] =
    useState<DashboardDrilldownSelection | null>(null);

  return (
    <section aria-labelledby="analysis-dashboard-title" className="mt-7">
      <DashboardHeader dashboard={dashboard} />
      <DashboardWidgetGrid
        activeDrilldown={activeDrilldown}
        datasets={datasets}
        findings={findings}
        onDrilldownChange={setActiveDrilldown}
        widgets={dashboard.widgets}
      />
    </section>
  );
}
