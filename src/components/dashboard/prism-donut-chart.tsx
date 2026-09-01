"use client";

import { ResponsivePie, type PieTooltipProps } from "@nivo/pie";
import { useId, useMemo } from "react";

import type { DataPoint } from "@/lib/analytics/query-engine";
import { metricCatalog, type MetricKey } from "@/lib/analytics/metric-catalog";

import { formatMetricAxisValue, formatMetricValue } from "./formatters";
import {
  createPrismDonutData,
  getPrismDonutPercentage,
  getPrismDonutTotal,
  type PrismDonutDatum,
} from "./prism-donut-chart-data";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type PrismDonutChartProps = {
  metric: MetricKey;
  points: readonly DataPoint[];
  title: string;
};

const nivoTheme = {
  tooltip: {
    container: {
      background: "#191c1e",
      border: "1px solid #353a45",
      borderRadius: "10px",
      boxShadow: "0 16px 36px rgb(25 28 30 / 0.22)",
      color: "#ffffff",
      fontSize: "11px",
      padding: "9px 11px",
    },
  },
} as const;

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function createPrismDonutTooltip(metric: MetricKey, total: number) {
  return function PrismDonutTooltip({
    datum,
  }: PieTooltipProps<PrismDonutDatum>) {
    const percentage = getPrismDonutPercentage(datum.value, total);

    return (
      <div className="min-w-36 rounded-xl border border-[#353a45] bg-[#191c1e] px-3 py-2.5 text-[11px] text-white shadow-[0_18px_36px_rgba(25,28,30,0.25)]">
        <span className="flex items-center gap-1.5 font-medium text-[#e2e4ff]">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: datum.color }}
          />
          {datum.label}
        </span>
        <div className="mt-2 flex items-baseline justify-between gap-5">
          <strong className="font-mono text-white">
            {formatMetricValue(metric, datum.value)}
          </strong>
          <span className="text-[#c9cbd4]">{formatPercentage(percentage)}</span>
        </div>
      </div>
    );
  };
}

export function PrismDonutChart({
  metric,
  points,
  title,
}: PrismDonutChartProps) {
  const chartId = useId().replace(/:/g, "");
  const prefersReducedMotion = usePrefersReducedMotion();
  const data = useMemo(() => createPrismDonutData(points), [points]);
  const total = useMemo(() => getPrismDonutTotal(data), [data]);
  const tooltip = useMemo(
    () => createPrismDonutTooltip(metric, total),
    [metric, total],
  );
  const metricLabel = metricCatalog[metric].label;
  const summaryId = `prism-donut-chart-summary-${chartId}`;
  const chartSummary =
    data.length > 0
      ? `${title} 도넛 그래프. 총 ${formatMetricValue(metric, total)}. ${data
          .map(
            (datum) =>
              `${datum.label} ${formatPercentage(getPrismDonutPercentage(datum.value, total))}`,
          )
          .join(", ")}.`
      : `${title} 차트에 표시할 데이터가 없습니다.`;

  if (data.length === 0) {
    return (
      <div
        aria-label={chartSummary}
        className="grid h-44 place-items-center rounded-xl border border-dashed border-[#d8dbe1] bg-[#fbfcfd] text-sm text-[#777587] sm:h-48"
        role="img"
      >
        표시할 구성비 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl items-center gap-4 sm:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] sm:gap-5">
      <div
        aria-describedby={summaryId}
        aria-label={`${title} 도넛 차트`}
        className="relative mx-auto h-44 w-full max-w-44 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-4 sm:h-48 sm:max-w-48"
        role="img"
        tabIndex={0}
      >
        <ResponsivePie
          activeOuterRadiusOffset={7}
          animate={!prefersReducedMotion}
          borderColor={{ from: "color", modifiers: [["darker", 0.14]] }}
          borderWidth={1}
          colors={(datum) => datum.data.color}
          cornerRadius={5}
          data={data}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          innerRadius={0.72}
          isInteractive
          margin={{ bottom: 7, left: 7, right: 7, top: 7 }}
          motionConfig="gentle"
          padAngle={1.5}
          role="presentation"
          sortByValue={false}
          theme={nivoTheme}
          tooltip={tooltip}
        />
        <div className="pointer-events-none absolute inset-[27%] grid place-items-center rounded-full bg-white px-2 text-center">
          <span className="text-[10px] font-semibold tracking-[0.08em] text-[#777587]">
            총 {metricLabel}
          </span>
          <strong className="mt-0.5 block font-mono text-[18px] leading-none tracking-[-0.06em] text-[#191c1e]">
            {formatMetricAxisValue(metric, total)}
          </strong>
          <span className="sr-only">{formatMetricValue(metric, total)}</span>
        </div>
      </div>

      <ul
        aria-label={`${title} 범례`}
        className="w-full divide-y divide-[#e9ebf0] border-y border-[#e9ebf0]"
      >
        {data.map((datum) => {
          const percentage = getPrismDonutPercentage(datum.value, total);

          return (
            <li className="py-2" key={datum.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#343844]">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full shadow-[0_1px_3px_rgba(25,28,30,0.18)]"
                    style={{ backgroundColor: datum.color }}
                  />
                  <span className="truncate">{datum.label}</span>
                </span>
                <span className="shrink-0 text-right">
                  <strong className="block font-mono text-[13px] font-semibold tracking-[-0.035em] text-[#272b35]">
                    {formatMetricValue(metric, datum.value)}
                  </strong>
                  <span className="text-[10px] font-medium text-[#777587]">
                    {formatPercentage(percentage)}
                  </span>
                </span>
              </div>
              <div
                aria-hidden="true"
                className="mt-1.5 h-px overflow-hidden bg-[#e9ebf0]"
              >
                <div
                  className="h-full"
                  style={{
                    backgroundColor: datum.color,
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="sr-only" id={summaryId}>
        {chartSummary}
      </p>
    </div>
  );
}
