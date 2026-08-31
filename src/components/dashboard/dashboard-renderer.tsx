"use client";

import dynamic from "next/dynamic";
import { memo, type ReactNode } from "react";

import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";
import type {
  DashboardSpec,
  DashboardWidget,
} from "@/lib/ai/schemas/dashboard-spec";

import {
  formatChangeWithDirection,
  formatMetricValue,
  getComparisonLabel,
} from "./formatters";

const PrismTrendChart = dynamic(
  () => import("./prism-trend-chart").then((module) => module.PrismTrendChart),
  {
    loading: () => (
      <div
        aria-label="추이 차트를 불러오는 중"
        className="prism-skeleton h-72 rounded-xl sm:h-80"
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
        className="prism-skeleton h-60 rounded-xl"
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
  widget: DashboardWidget;
  datasetsById: ReadonlyMap<string, AnalyticsDataset>;
  findingsById: ReadonlyMap<string, Finding>;
  cardClassName?: string;
  controls?: ReactNode;
};

function getWidgetWidth(size: DashboardWidget["size"]): string {
  const widths: Record<DashboardWidget["size"], string> = {
    small: "lg:col-span-3",
    medium: "lg:col-span-6",
    large: "lg:col-span-8",
    full: "lg:col-span-12",
  };

  return widths[size];
}

function WidgetFrame({
  children,
  className,
  controls,
  widget,
}: {
  children: ReactNode;
  className?: string;
  controls?: ReactNode;
  widget: DashboardWidget;
}) {
  return (
    <section
      aria-labelledby={`${widget.id}-title`}
      className={`self-start rounded-xl border border-[#e1e2e4] bg-white p-5 ${getWidgetWidth(widget.size)} ${className ?? ""}`}
      id={widget.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold tracking-[0.11em] text-[#777587] uppercase">
            {widget.type}
          </p>
          <h2
            className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] break-words text-[#191c1e]"
            id={`${widget.id}-title`}
          >
            {widget.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#dde2e8] bg-[#f8f9fb] px-2 py-1 text-[9px] text-[#777587]">
            {widget.queryIds.length} data ref
          </span>
          {controls}
        </div>
      </div>
      {widget.description ? (
        <p className="mt-2 text-[12px] leading-5 break-words text-[#595e6b]">
          {widget.description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
}: DashboardWidgetProps) {
  if (widget.type !== "metric") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const change = dataset?.points[0]?.percentChange ?? null;

  return (
    <WidgetFrame className={cardClassName} controls={controls} widget={widget}>
      <p className="text-3xl font-semibold tracking-[-0.045em] text-[#191c1e] sm:text-[34px]">
        {formatMetricValue(widget.config.metric, dataset?.currentTotal)}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#eef0f2] pt-3">
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

function TimeSeriesWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
}: DashboardWidgetProps) {
  if (widget.type !== "timeSeries") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);

  return (
    <WidgetFrame className={cardClassName} controls={controls} widget={widget}>
      <PrismTrendChart
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        title={widget.title}
      />
      <details className="mt-4 border-t border-[#eef0f2] pt-3 text-[12px] text-[#595e6b]">
        <summary className="cursor-pointer font-medium text-[#4f46e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]">
          차트 데이터 표 보기
        </summary>
        <div className="mt-3 max-h-48 overflow-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{widget.title} 원본 데이터</caption>
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
  widget,
  datasetsById,
  cardClassName,
  controls,
}: DashboardWidgetProps) {
  if (widget.type !== "categoryBar") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const highestValue = Math.max(
    1,
    ...(dataset?.points.map((point) => Math.abs(point.value ?? 0)) ?? []),
  );

  return (
    <WidgetFrame className={cardClassName} controls={controls} widget={widget}>
      <ul className="space-y-3.5">
        {(dataset?.points ?? []).map((point) => {
          const width = (
            (Math.abs(point.value ?? 0) / highestValue) *
            100
          ).toFixed(1);

          return (
            <li key={point.label}>
              <div className="flex items-baseline justify-between gap-4 text-[12px]">
                <span className="font-medium text-[#191c1e]">
                  {point.label}
                </span>
                <span className="text-[#595e6b]">
                  {formatMetricValue(dataset?.metric ?? "revenue", point.value)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef0f2]">
                <div
                  className="h-full rounded-full bg-[#4f46e5]"
                  style={{ width: `${width}%` }}
                />
              </div>
              {point.percentChange !== undefined ? (
                <p className="mt-1 text-[10px] text-[#777587]">
                  {formatChangeWithDirection(point.percentChange)} 비교 변화
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </WidgetFrame>
  );
}

function DonutWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
}: DashboardWidgetProps) {
  if (widget.type !== "donut") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);

  return (
    <WidgetFrame className={cardClassName} controls={controls} widget={widget}>
      <PrismDonutChart
        metric={dataset?.metric ?? "revenue"}
        points={dataset?.points ?? []}
        title={widget.title}
      />
    </WidgetFrame>
  );
}

function TableWidget({
  widget,
  datasetsById,
  cardClassName,
  controls,
}: DashboardWidgetProps) {
  if (widget.type !== "rankingTable" && widget.type !== "dataTable") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);

  return (
    <WidgetFrame className={cardClassName} controls={controls} widget={widget}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-96 text-left text-[12px]">
          <caption className="sr-only">{widget.title} 데이터 표</caption>
          <thead className="border-b border-[#dde2e8] text-[9px] tracking-[0.1em] text-[#777587] uppercase">
            <tr>
              {widget.type === "rankingTable" ? (
                <th className="w-12 pb-3 font-medium">순위</th>
              ) : null}
              <th className="pb-3 font-medium">세그먼트</th>
              <th className="pb-3 text-right font-medium">현재</th>
              <th className="pb-3 text-right font-medium">변화</th>
            </tr>
          </thead>
          <tbody>
            {(dataset?.points ?? []).map((point, index) => (
              <tr className="border-b border-[#eef0f2]" key={point.label}>
                {widget.type === "rankingTable" ? (
                  <td className="py-3 font-mono text-[#777587]">{index + 1}</td>
                ) : null}
                <td className="py-3 font-medium text-[#191c1e]">
                  {point.label}
                </td>
                <td className="py-3 text-right text-[#424753]">
                  {formatMetricValue(dataset?.metric ?? "revenue", point.value)}
                </td>
                <td className="py-3 text-right text-[#595e6b]">
                  {formatChangeWithDirection(point.percentChange)}
                </td>
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
    <WidgetFrame className={cardClassName} controls={controls} widget={widget}>
      <div className={`rounded-lg border p-4 ${toneClass[widget.config.tone]}`}>
        <p className="text-[13px] leading-6 text-[#191c1e]">
          {finding?.fallbackText ?? "검증된 Finding을 찾지 못했습니다."}
        </p>
        <p className="mt-3 text-[9px] tracking-[0.09em] text-[#777587] uppercase">
          Evidence · {finding?.evidenceQueryIds.join(", ") ?? "unavailable"}
        </p>
      </div>
    </WidgetFrame>
  );
}

const componentRegistry = {
  metric: MetricWidget,
  timeSeries: TimeSeriesWidget,
  categoryBar: CategoryBarWidget,
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

export function DashboardHeader({ dashboard }: { dashboard: DashboardSpec }) {
  return (
    <div className="py-2 sm:py-3">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-[#4f46e5] uppercase">
        Generated from verified refs
      </p>
      <h1
        className="mt-2 max-w-4xl text-[28px] leading-tight font-semibold tracking-[-0.04em] text-[#191c1e] sm:text-[34px]"
        id="analysis-dashboard-title"
      >
        {dashboard.title}
      </h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#595e6b]">
        {dashboard.subtitle}
      </p>
      <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#777587]">
        {dashboard.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#595e6b]">
        <span className="rounded border border-[#dde2e8] bg-white px-2.5 py-1.5">
          {dashboard.context.period.preset}
        </span>
        <span className="rounded border border-[#dde2e8] bg-white px-2.5 py-1.5">
          {getComparisonLabel(dashboard.context.compareWith)}
        </span>
        {dashboard.context.filters.map((filter) => (
          <span
            className="rounded border border-[#c3c0ff] bg-[#eef2ff] px-2.5 py-1.5 text-[#3525cd]"
            key={`${filter.dimension}-${filter.operator}-${filter.values.join("-")}`}
          >
            {filter.dimension}: {filter.values.join(", ")}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DashboardWidgetGrid({
  widgets,
  datasets,
  findings,
}: Pick<DashboardRendererProps, "datasets" | "findings"> & {
  widgets: readonly DashboardWidget[];
}) {
  const datasetsById = new Map(
    datasets.map((dataset) => [dataset.queryId, dataset]),
  );
  const findingsById = new Map(
    findings.map((finding) => [finding.id, finding]),
  );

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-12">
      {widgets.map((widget) => (
        <DashboardWidgetCard
          datasetsById={datasetsById}
          findingsById={findingsById}
          key={widget.id}
          widget={widget}
        />
      ))}
    </div>
  );
}

export function DashboardRenderer({
  dashboard,
  datasets,
  findings,
}: DashboardRendererProps) {
  return (
    <section aria-labelledby="analysis-dashboard-title" className="mt-7">
      <DashboardHeader dashboard={dashboard} />
      <DashboardWidgetGrid
        datasets={datasets}
        findings={findings}
        widgets={dashboard.widgets}
      />
    </section>
  );
}
