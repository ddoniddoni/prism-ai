"use client";

import type { ReactNode } from "react";

import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";
import type {
  DashboardSpec,
  DashboardWidget,
} from "@/lib/ai/schemas/dashboard-spec";

import {
  formatChange,
  formatMetricValue,
  getComparisonLabel,
} from "./formatters";

type DashboardRendererProps = {
  dashboard: DashboardSpec;
  datasets: readonly AnalyticsDataset[];
  findings: readonly Finding[];
};

type DashboardWidgetProps = {
  widget: DashboardWidget;
  datasetsById: ReadonlyMap<string, AnalyticsDataset>;
  findingsById: ReadonlyMap<string, Finding>;
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
  widget,
}: {
  children: ReactNode;
  widget: DashboardWidget;
}) {
  return (
    <section
      aria-labelledby={`${widget.id}-title`}
      className={`rounded-xl border border-[#e1e2e4] bg-white p-5 ${getWidgetWidth(widget.size)}`}
      id={widget.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.11em] text-[#777587] uppercase">
            {widget.type}
          </p>
          <h2
            className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-[#191c1e]"
            id={`${widget.id}-title`}
          >
            {widget.title}
          </h2>
        </div>
        <span className="rounded border border-[#dde2e8] bg-[#f8f9fb] px-2 py-1 text-[9px] text-[#777587]">
          {widget.queryIds.length} data ref
        </span>
      </div>
      {widget.description ? (
        <p className="mt-2 text-[12px] leading-5 text-[#595e6b]">
          {widget.description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MetricWidget({ widget, datasetsById }: DashboardWidgetProps) {
  if (widget.type !== "metric") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const change = dataset?.points[0]?.percentChange ?? null;

  return (
    <WidgetFrame widget={widget}>
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
          {formatChange(change)}
        </span>
      </div>
    </WidgetFrame>
  );
}

function TimeSeriesWidget({ widget, datasetsById }: DashboardWidgetProps) {
  if (widget.type !== "timeSeries") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const values = dataset?.points.filter((point) => point.value !== null) ?? [];
  const numbers = values.map((point) => point.value ?? 0);
  const minimum = numbers.length > 0 ? Math.min(...numbers) : 0;
  const maximum = numbers.length > 0 ? Math.max(...numbers) : 1;
  const range = maximum - minimum || 1;
  const linePoints = values
    .map((point, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 36 - (((point.value ?? minimum) - minimum) / range) * 30;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <WidgetFrame widget={widget}>
      <div className="rounded-lg border border-[#eef0f2] bg-[#fbfcfd] px-3 py-3">
        <svg
          aria-label={`${widget.title} 선 그래프`}
          className="h-40 w-full"
          role="img"
          viewBox="0 0 100 40"
        >
          <path
            d="M0 6 H100 M0 16 H100 M0 26 H100 M0 36 H100"
            fill="none"
            stroke="#e7e8ea"
            strokeWidth="0.35"
          />
          <polyline
            fill="none"
            points={linePoints}
            stroke="#4f46e5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
        </svg>
      </div>
      <details className="mt-4 border-t border-[#eef0f2] pt-3 text-[12px] text-[#595e6b]">
        <summary className="cursor-pointer font-medium text-[#4f46e5]">
          차트 데이터 표 보기
        </summary>
        <div className="mt-3 max-h-48 overflow-auto">
          <table className="w-full text-left text-xs">
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

function CategoryBarWidget({ widget, datasetsById }: DashboardWidgetProps) {
  if (widget.type !== "categoryBar" && widget.type !== "donut") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);
  const highestValue = Math.max(
    1,
    ...(dataset?.points.map((point) => Math.abs(point.value ?? 0)) ?? []),
  );

  return (
    <WidgetFrame widget={widget}>
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
                  {formatChange(point.percentChange)} 비교 변화
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </WidgetFrame>
  );
}

function TableWidget({ widget, datasetsById }: DashboardWidgetProps) {
  if (widget.type !== "rankingTable" && widget.type !== "dataTable") {
    return null;
  }

  const dataset = datasetsById.get(widget.config.queryId);

  return (
    <WidgetFrame widget={widget}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-96 text-left text-[12px]">
          <thead className="border-b border-[#dde2e8] text-[9px] tracking-[0.1em] text-[#777587] uppercase">
            <tr>
              <th className="pb-3 font-medium">세그먼트</th>
              <th className="pb-3 text-right font-medium">현재</th>
              <th className="pb-3 text-right font-medium">변화</th>
            </tr>
          </thead>
          <tbody>
            {(dataset?.points ?? []).map((point) => (
              <tr className="border-b border-[#eef0f2]" key={point.label}>
                <td className="py-3 font-medium text-[#191c1e]">
                  {point.label}
                </td>
                <td className="py-3 text-right text-[#424753]">
                  {formatMetricValue(dataset?.metric ?? "revenue", point.value)}
                </td>
                <td className="py-3 text-right text-[#595e6b]">
                  {formatChange(point.percentChange)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetFrame>
  );
}

function InsightWidget({ widget, findingsById }: DashboardWidgetProps) {
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
    <WidgetFrame widget={widget}>
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
  donut: CategoryBarWidget,
  rankingTable: TableWidget,
  dataTable: TableWidget,
  insight: InsightWidget,
} satisfies Record<
  DashboardWidget["type"],
  (props: DashboardWidgetProps) => ReactNode
>;

export function DashboardRenderer({
  dashboard,
  datasets,
  findings,
}: DashboardRendererProps) {
  const datasetsById = new Map(
    datasets.map((dataset) => [dataset.queryId, dataset]),
  );
  const findingsById = new Map(
    findings.map((finding) => [finding.id, finding]),
  );

  return (
    <section aria-labelledby="analysis-dashboard-title" className="mt-7">
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

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        {dashboard.widgets.map((widget) => {
          const Widget = componentRegistry[widget.type];

          return (
            <Widget
              datasetsById={datasetsById}
              findingsById={findingsById}
              key={widget.id}
              widget={widget}
            />
          );
        })}
      </div>
    </section>
  );
}
