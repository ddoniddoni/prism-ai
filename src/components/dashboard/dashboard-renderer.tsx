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
    small: "lg:col-span-4",
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
      className={`border border-slate-900/10 bg-white p-5 shadow-[0_18px_45px_-38px_rgba(21,26,45,0.72)] sm:p-6 ${getWidgetWidth(widget.size)}`}
      id={widget.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#6657dd] uppercase">
            {widget.type}
          </p>
          <h2
            className="mt-2 text-lg font-semibold tracking-[-0.035em] text-[#151a2d]"
            id={`${widget.id}-title`}
          >
            {widget.title}
          </h2>
        </div>
        <span className="border border-slate-900/10 px-2 py-1 font-mono text-[10px] text-slate-500">
          {widget.queryIds.length} data ref
        </span>
      </div>
      {widget.description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {widget.description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
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
      <p className="font-mono text-3xl font-semibold tracking-[-0.07em] text-[#151a2d] sm:text-4xl">
        {formatMetricValue(widget.config.metric, dataset?.currentTotal)}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-900/8 pt-4">
        <span className="text-sm text-slate-600">
          {dataset?.comparisonRange ? "비교 기간 대비" : "비교 없음"}
        </span>
        <span
          className={`font-mono text-sm font-semibold ${change !== null && change < 0 ? "text-rose-700" : "text-emerald-700"}`}
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
      <div className="rounded-sm bg-[#151a2d] px-3 py-3">
        <svg
          aria-label={`${widget.title} 선 그래프`}
          className="h-40 w-full"
          role="img"
          viewBox="0 0 100 40"
        >
          <path
            d="M0 36 H100"
            fill="none"
            stroke="rgb(255 255 255 / 0.18)"
            strokeWidth="0.35"
          />
          <polyline
            fill="none"
            points={linePoints}
            stroke="#67d8c8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.2"
          />
        </svg>
      </div>
      <details className="mt-4 border-t border-slate-900/8 pt-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-[#5144bb]">
          차트 데이터 표 보기
        </summary>
        <div className="mt-3 max-h-48 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2 font-medium">날짜</th>
                <th className="pb-2 text-right font-medium">값</th>
              </tr>
            </thead>
            <tbody>
              {(dataset?.points ?? []).map((point) => (
                <tr className="border-t border-slate-900/6" key={point.label}>
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
      <ul className="space-y-4">
        {(dataset?.points ?? []).map((point) => {
          const width = (
            (Math.abs(point.value ?? 0) / highestValue) *
            100
          ).toFixed(1);

          return (
            <li key={point.label}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-medium text-[#151a2d]">
                  {point.label}
                </span>
                <span className="font-mono text-slate-600">
                  {formatMetricValue(dataset?.metric ?? "revenue", point.value)}
                </span>
              </div>
              <div className="mt-2 h-2 bg-[#eef0f6]">
                <div
                  className="prism-spectrum h-full"
                  style={{ width: `${width}%` }}
                />
              </div>
              {point.percentChange !== undefined ? (
                <p className="mt-1 font-mono text-[11px] text-slate-500">
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
        <table className="w-full min-w-96 text-left text-sm">
          <thead className="border-b border-slate-900/10 font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
            <tr>
              <th className="pb-3 font-medium">세그먼트</th>
              <th className="pb-3 text-right font-medium">현재</th>
              <th className="pb-3 text-right font-medium">변화</th>
            </tr>
          </thead>
          <tbody>
            {(dataset?.points ?? []).map((point) => (
              <tr className="border-b border-slate-900/6" key={point.label}>
                <td className="py-3 font-medium text-[#151a2d]">
                  {point.label}
                </td>
                <td className="py-3 text-right font-mono text-slate-700">
                  {formatMetricValue(dataset?.metric ?? "revenue", point.value)}
                </td>
                <td className="py-3 text-right font-mono text-slate-600">
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
    neutral: "border-[#6657dd]/30 bg-[#f0efff]",
    positive: "border-emerald-300 bg-emerald-50",
    warning: "border-amber-300 bg-amber-50",
    critical: "border-rose-300 bg-rose-50",
  };

  return (
    <WidgetFrame widget={widget}>
      <div className={`border-l-2 p-4 ${toneClass[widget.config.tone]}`}>
        <p className="text-base leading-7 text-[#151a2d]">
          {finding?.fallbackText ?? "검증된 Finding을 찾지 못했습니다."}
        </p>
        <p className="mt-3 font-mono text-[10px] tracking-[0.1em] text-slate-500 uppercase">
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
    <section aria-labelledby="analysis-dashboard-title" className="mt-10">
      <div className="border-y border-slate-900/10 py-6 sm:py-8">
        <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#6657dd] uppercase">
          Generated from verified refs
        </p>
        <h1
          className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.055em] text-[#151a2d] sm:text-5xl"
          id="analysis-dashboard-title"
        >
          {dashboard.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {dashboard.subtitle}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
          {dashboard.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 font-mono text-[11px] text-slate-600">
          <span className="border border-slate-900/10 bg-white px-2.5 py-1.5">
            {dashboard.context.period.preset}
          </span>
          <span className="border border-slate-900/10 bg-white px-2.5 py-1.5">
            {getComparisonLabel(dashboard.context.compareWith)}
          </span>
          {dashboard.context.filters.map((filter) => (
            <span
              className="border border-[#67d8c8]/50 bg-[#effdfb] px-2.5 py-1.5"
              key={`${filter.dimension}-${filter.operator}-${filter.values.join("-")}`}
            >
              {filter.dimension}: {filter.values.join(", ")}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
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
