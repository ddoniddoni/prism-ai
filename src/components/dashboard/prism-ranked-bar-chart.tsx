"use client";

import { ResponsiveBar, type BarTooltipProps } from "@nivo/bar";
import { useId, useMemo } from "react";

import type { DataPoint } from "@/lib/analytics/query-engine";
import type { MetricKey } from "@/lib/analytics/metric-catalog";
import type { DashboardWidgetPresentation } from "@/stores/dashboard-layout";

import {
  formatChangeWithDirection,
  formatMetricAxisValue,
  formatMetricValue,
} from "./formatters";
import {
  createPrismRankedBarData,
  getPrismRankedBarChartHeight,
  type PrismRankedBarDatum,
} from "./prism-ranked-bar-chart-data";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type PrismRankedBarChartProps = {
  metric: MetricKey;
  points: readonly DataPoint[];
  presentation?: DashboardWidgetPresentation;
  title: string;
};

function getPresentationChartHeight(
  itemCount: number,
  presentation: DashboardWidgetPresentation,
): number {
  const standardHeight = getPrismRankedBarChartHeight(itemCount);

  if (presentation === "compact") {
    return Math.max(152, standardHeight - 24);
  }

  return presentation === "feature"
    ? Math.min(312, standardHeight + 32)
    : standardHeight;
}

const nivoTheme = {
  axis: {
    domain: { line: { stroke: "#dfe2e9", strokeWidth: 1 } },
    ticks: {
      line: { stroke: "transparent" },
      text: { fill: "#565c6c", fontSize: 11 },
    },
  },
  grid: { line: { stroke: "#eef0f4", strokeDasharray: "2 4" } },
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

function createPrismRankedBarTooltip(metric: MetricKey) {
  return function PrismRankedBarTooltip(
    datum: BarTooltipProps<PrismRankedBarDatum>,
  ) {
    return (
      <div className="min-w-40 rounded-xl border border-[#353a45] bg-[#191c1e] px-3 py-2.5 text-[11px] text-white shadow-[0_18px_36px_rgba(25,28,30,0.25)]">
        <span className="flex items-center gap-1.5 font-medium text-[#e2e4ff]">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: datum.color }}
          />
          {datum.data.label}
        </span>
        <div className="mt-2 flex items-baseline justify-between gap-5">
          <strong className="font-mono text-white">
            {formatMetricValue(metric, datum.value)}
          </strong>
          <span className="text-[#c9cbd4]">#{datum.data.rank}</span>
        </div>
        {datum.data.hasChange === 1 ? (
          <p className="mt-1.5 text-[#c9cbd4]">
            {formatChangeWithDirection(datum.data.change)} 비교 변화
          </p>
        ) : null}
      </div>
    );
  };
}

export function PrismRankedBarChart({
  metric,
  points,
  presentation = "standard",
  title,
}: PrismRankedBarChartProps) {
  const chartId = useId().replace(/:/g, "");
  const prefersReducedMotion = usePrefersReducedMotion();
  const data = useMemo(() => createPrismRankedBarData(points), [points]);
  const tooltip = useMemo(() => createPrismRankedBarTooltip(metric), [metric]);
  const chartHeight = getPresentationChartHeight(data.length, presentation);
  const summaryId = `prism-ranked-bar-chart-summary-${chartId}`;
  const chartSummary =
    data.length > 0
      ? `${title} 순위 차트. ${data
          .map(
            (datum) =>
              `${datum.rank}위 ${datum.label} ${formatMetricValue(metric, datum.value)}`,
          )
          .join(", ")}.`
      : `${title} 차트에 표시할 데이터가 없습니다.`;

  if (data.length === 0) {
    return (
      <div
        aria-label={chartSummary}
        className="grid h-44 place-items-center rounded-xl border border-dashed border-[#d8dbe1] bg-[#fbfcfd] text-sm text-[#777587]"
        role="img"
      >
        표시할 세그먼트 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div
      aria-describedby={summaryId}
      aria-label={`${title} 가로 랭킹 차트`}
      className="relative w-full min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-4"
      role="img"
      tabIndex={0}
    >
      <div className="mb-1.5 flex items-center justify-between px-1 text-[10px]">
        <span className="font-semibold tracking-[0.09em] text-[#777587] uppercase">
          높은 순
        </span>
        <span className="font-mono text-[#777587]">{data.length} segments</span>
      </div>
      <div style={{ height: chartHeight }}>
        <ResponsiveBar
          animate={!prefersReducedMotion}
          ariaDescribedBy={summaryId}
          ariaLabel={`${title} 가로 랭킹 차트`}
          axisBottom={{
            format: (value) => formatMetricAxisValue(metric, Number(value)),
            tickPadding: 8,
            tickSize: 0,
            tickValues: 4,
          }}
          axisLeft={{ tickPadding: 11, tickSize: 0 }}
          axisRight={null}
          axisTop={null}
          barAriaLabel={(datum) =>
            `${datum.indexValue}: ${formatMetricValue(metric, datum.value)}`
          }
          borderColor={{ from: "color", modifiers: [["darker", 0.18]] }}
          borderRadius={7}
          borderWidth={1}
          colors={(datum) => datum.data.color}
          data={data}
          enableGridX
          enableGridY={false}
          enableLabel
          indexBy="label"
          innerPadding={2}
          isFocusable
          label={(datum) => formatMetricAxisValue(metric, datum.value)}
          labelOffset={9}
          labelPosition="end"
          labelSkipHeight={0}
          labelSkipWidth={0}
          labelTextColor="#343844"
          layout="horizontal"
          margin={{ bottom: 30, left: 88, right: 80, top: 2 }}
          motionConfig="gentle"
          padding={0.38}
          role="img"
          theme={nivoTheme}
          tooltip={tooltip}
          valueScale={{ type: "linear" }}
        />
      </div>
      <p className="sr-only" id={summaryId}>
        {chartSummary}
      </p>
    </div>
  );
}
