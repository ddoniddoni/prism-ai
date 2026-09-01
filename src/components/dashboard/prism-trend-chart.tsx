"use client";

import { ResponsiveLine, type SliceTooltipProps } from "@nivo/line";
import { useId, useMemo } from "react";

import type { DataPoint } from "@/lib/analytics/query-engine";
import type { MetricKey } from "@/lib/analytics/metric-catalog";

import { formatMetricAxisValue, formatMetricValue } from "./formatters";
import {
  createPrismTrendChartSeries,
  getPrismTrendTickValues,
  type PrismTrendChartSeries,
} from "./prism-trend-chart-data";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type PrismTrendChartProps = {
  metric: MetricKey;
  points: readonly DataPoint[];
  title: string;
};

const nivoTheme = {
  axis: {
    domain: { line: { stroke: "#d8dbe3", strokeWidth: 1 } },
    ticks: {
      line: { stroke: "#d8dbe3", strokeWidth: 1 },
      text: { fill: "#777587", fontSize: 10 },
    },
  },
  crosshair: {
    line: {
      stroke: "#818cf8",
      strokeDasharray: "4 5",
      strokeOpacity: 0.9,
      strokeWidth: 1,
    },
  },
  grid: { line: { stroke: "#e7e9f0", strokeDasharray: "3 5" } },
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

function formatAxisLabel(label: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);

  return match ? `${Number(match[2])}.${Number(match[3])}` : label;
}

function formatChartValue(
  metric: MetricKey,
  value: number | string | null,
): string {
  if (value === null) {
    return "—";
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue)
    ? formatMetricValue(metric, numericValue)
    : String(value);
}

function PrismTrendSliceTooltip({
  metric,
  slice,
}: SliceTooltipProps<PrismTrendChartSeries> & { metric: MetricKey }) {
  const dateLabel = String(slice.points[0]?.data.x ?? slice.id);

  return (
    <div className="min-w-40 rounded-xl border border-[#353a45] bg-[#191c1e] px-3 py-2.5 text-[11px] text-white shadow-[0_18px_36px_rgba(25,28,30,0.25)]">
      <p className="font-medium tracking-[0.02em] text-[#c7c9ff]">
        {formatAxisLabel(dateLabel)}
      </p>
      <div className="mt-2 space-y-1.5">
        {slice.points.map((point) => (
          <div
            className="flex items-center justify-between gap-5"
            key={`${point.seriesId}-${point.id}`}
          >
            <span className="flex items-center gap-1.5 text-[#c9cbd4]">
              <span
                aria-hidden="true"
                className="h-0.5 w-3 rounded-full"
                style={{ backgroundColor: point.seriesColor }}
              />
              {point.seriesId}
            </span>
            <strong className="font-mono text-white">
              {formatMetricValue(
                metric,
                typeof point.data.y === "number" ? point.data.y : null,
              )}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function createPrismTrendSliceTooltip(metric: MetricKey) {
  return function PrismTrendSliceTooltipComponent(
    props: SliceTooltipProps<PrismTrendChartSeries>,
  ) {
    return <PrismTrendSliceTooltip metric={metric} {...props} />;
  };
}

export function PrismTrendChart({
  metric,
  points,
  title,
}: PrismTrendChartProps) {
  const chartId = useId().replace(/:/g, "");
  const prefersReducedMotion = usePrefersReducedMotion();
  const data = useMemo(() => createPrismTrendChartSeries(points), [points]);
  const tickValues = useMemo(() => getPrismTrendTickValues(points), [points]);
  const sliceTooltip = useMemo(
    () => createPrismTrendSliceTooltip(metric),
    [metric],
  );
  const validPoints = points.filter((point) => point.value !== null);
  const firstPoint = validPoints.at(0);
  const latestPoint = validPoints.at(-1);
  const summaryId = `prism-trend-chart-summary-${chartId}`;
  const chartSummary =
    firstPoint && latestPoint
      ? `${title}: ${formatAxisLabel(firstPoint.label)} ${formatMetricValue(metric, firstPoint.value)}에서 ${formatAxisLabel(latestPoint.label)} ${formatMetricValue(metric, latestPoint.value)}까지의 추이입니다.`
      : `${title} 차트에 표시할 데이터가 없습니다.`;

  if (validPoints.length === 0) {
    return (
      <div
        aria-label={chartSummary}
        className="grid h-44 place-items-center rounded-xl border border-dashed border-[#d8dbe1] bg-[#fbfcfd] text-sm text-[#777587] sm:h-52 lg:h-64"
        role="img"
      >
        표시할 추이 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[#e1e4ec] bg-[radial-gradient(circle_at_84%_3%,rgba(99,102,241,0.15),transparent_38%),linear-gradient(180deg,#fdfdff_0%,#f7f8fd_100%)] px-1 pt-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-2.5 pb-0.5 text-[10px]">
        <div className="flex items-center gap-3 text-[#595e6b]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#312e81]">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full bg-[#4f46e5]"
            />
            현재 기간
          </span>
          {data.length > 1 ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-px w-3 border-t border-dashed border-[#969cad]"
              />
              비교 기간
            </span>
          ) : null}
        </div>
        <span className="font-mono font-semibold text-[#424753]">
          {formatMetricValue(metric, latestPoint?.value ?? null)}
        </span>
      </div>

      <div className="h-48 sm:h-56 lg:h-64">
        <ResponsiveLine
          animate={!prefersReducedMotion}
          areaOpacity={0.13}
          ariaDescribedBy={summaryId}
          ariaLabel={`${title} 추이 차트`}
          axisBottom={{
            format: (value) => formatAxisLabel(String(value)),
            tickPadding: 10,
            tickSize: 0,
            tickValues,
          }}
          axisLeft={{
            format: (value) => formatMetricAxisValue(metric, value),
            tickPadding: 11,
            tickSize: 0,
            tickValues: 4,
          }}
          axisRight={null}
          axisTop={null}
          colors={["#4f46e5", "#9ba1b2"]}
          crosshairType="x"
          curve="catmullRom"
          data={data}
          defs={[
            {
              colors: [
                { color: "#4f46e5", offset: 0, opacity: 0.45 },
                { color: "#4f46e5", offset: 100, opacity: 0 },
              ],
              id: "prism-current-period-gradient",
              type: "linearGradient",
            },
          ]}
          enableArea
          enableCrosshair
          enableGridX={false}
          enableGridY
          enablePoints={false}
          enableSlices="x"
          fill={[
            {
              id: "prism-current-period-gradient",
              match: { id: "현재 기간" },
            },
          ]}
          lineWidth={3}
          margin={{ bottom: 36, left: 66, right: 16, top: 10 }}
          motionConfig="gentle"
          role="img"
          sliceTooltip={sliceTooltip}
          theme={nivoTheme}
          useMesh
          xScale={{ type: "point" }}
          yFormat={(value) => formatChartValue(metric, value)}
          yScale={{ max: "auto", min: "auto", stacked: false, type: "linear" }}
        />
      </div>

      <p className="sr-only" id={summaryId}>
        {chartSummary}
      </p>
    </div>
  );
}
