"use client";

import {
  ResponsiveBar,
  type BarItemProps,
  type BarTooltipProps,
} from "@nivo/bar";
import { animated, to } from "@react-spring/web";
import { useCallback, useId, useMemo } from "react";
import { useTooltip } from "@nivo/tooltip";

import type { MetricKey } from "@/lib/analytics/metric-catalog";
import type { DashboardWidgetPresentation } from "@/stores/dashboard-layout";

import { formatMetricAxisValue, formatMetricValue } from "./formatters";
import {
  createPrismStackedBarData,
  getPrismStackedBarTickValues,
  getPrismStackedBarTotal,
  getPrismStackedBarTooltipAnchor,
  prismStackedBarColors,
  type PrismStackedBarDatum,
  type PrismStackedBarSeries,
} from "./prism-stacked-bar-chart-data";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type PrismStackedBarChartProps = {
  metric: MetricKey;
  onSelectPoint?: (queryId: string, label: string) => void;
  presentation?: DashboardWidgetPresentation;
  series: readonly PrismStackedBarSeries[];
  title: string;
};

const chartHeightClassNames: Record<DashboardWidgetPresentation, string> = {
  compact: "h-44 sm:h-48 lg:h-52",
  standard: "h-48 sm:h-52 lg:h-56",
  feature: "h-52 sm:h-56 lg:h-60",
};

const nivoTheme = {
  axis: {
    domain: { line: { stroke: "#d8dbe3", strokeWidth: 1 } },
    ticks: {
      line: { stroke: "transparent" },
      text: { fill: "#777587", fontSize: 10 },
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

function createPrismStackedBarTooltip(
  metric: MetricKey,
  labelsById: ReadonlyMap<string, string>,
) {
  return function PrismStackedBarTooltip(
    datum: BarTooltipProps<PrismStackedBarDatum>,
  ) {
    const seriesLabel = labelsById.get(String(datum.id)) ?? String(datum.id);

    return (
      <div className="min-w-40 rounded-xl border border-[#353a45] bg-[#191c1e] px-3 py-2.5 text-[11px] text-white shadow-[0_18px_36px_rgba(25,28,30,0.25)]">
        <p className="font-medium tracking-[0.02em] text-[#c7c9ff]">
          {formatAxisLabel(String(datum.indexValue))}
        </p>
        <div className="mt-2 flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-[#c9cbd4]">
            <span
              aria-hidden="true"
              className="size-2 rounded-sm"
              style={{ backgroundColor: datum.color }}
            />
            {seriesLabel}
          </span>
          <strong className="font-mono text-white">
            {formatMetricValue(metric, datum.value)}
          </strong>
        </div>
      </div>
    );
  };
}

function PrismStackedBarItem({
  ariaDescribedBy,
  ariaDisabled,
  ariaHidden,
  ariaLabel,
  ariaLabelledBy,
  bar,
  borderRadius,
  borderWidth,
  isFocusable,
  isInteractive,
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
  tooltip: Tooltip,
}: BarItemProps<PrismStackedBarDatum>) {
  const { hideTooltip, showTooltipAt, showTooltipFromEvent } = useTooltip();
  const tooltipAnchor = getPrismStackedBarTooltipAnchor(bar.y, bar.height);
  const { key: tooltipReactKey, ...tooltipBar } = bar;

  void tooltipReactKey;

  const tooltipContent = useMemo(
    () => <Tooltip {...tooltipBar} {...bar.data} />,
    [Tooltip, bar.data, tooltipBar],
  );
  const showTooltip = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      showTooltipFromEvent(tooltipContent, event, tooltipAnchor);
    },
    [showTooltipFromEvent, tooltipAnchor, tooltipContent],
  );
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      onMouseEnter?.(bar.data, event);
      showTooltip(event);
    },
    [bar.data, onMouseEnter, showTooltip],
  );
  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      onMouseLeave?.(bar.data, event);
      hideTooltip();
    },
    [bar.data, hideTooltip, onMouseLeave],
  );
  const handleFocus = useCallback(() => {
    const position: [number, number] = [
      bar.absX + bar.width / 2,
      tooltipAnchor === "bottom" ? bar.absY + bar.height : bar.absY,
    ];

    showTooltipAt(tooltipContent, position, tooltipAnchor);
  }, [bar, showTooltipAt, tooltipAnchor, tooltipContent]);

  return (
    <animated.rect
      aria-describedby={ariaDescribedBy?.(bar.data)}
      aria-disabled={ariaDisabled?.(bar.data)}
      aria-hidden={ariaHidden?.(bar.data)}
      aria-label={ariaLabel?.(bar.data)}
      aria-labelledby={ariaLabelledBy?.(bar.data)}
      fill={style.color}
      focusable={isFocusable}
      height={to(style.height, (height) => Math.max(height, 0))}
      onBlur={hideTooltip}
      onClick={(event) => onClick?.({ ...bar.data, color: bar.color }, event)}
      onFocus={isInteractive && isFocusable ? handleFocus : undefined}
      onMouseEnter={isInteractive ? handleMouseEnter : undefined}
      onMouseLeave={isInteractive ? handleMouseLeave : undefined}
      onMouseMove={isInteractive ? showTooltip : undefined}
      rx={borderRadius}
      ry={borderRadius}
      stroke={style.borderColor}
      strokeWidth={borderWidth}
      tabIndex={isFocusable ? 0 : undefined}
      transform={style.transform}
      width={to(style.width, (width) => Math.max(width, 0))}
    />
  );
}

export function PrismStackedBarChart({
  metric,
  onSelectPoint,
  presentation = "standard",
  series,
  title,
}: PrismStackedBarChartProps) {
  const chartId = useId().replace(/:/g, "");
  const prefersReducedMotion = usePrefersReducedMotion();
  const data = useMemo(() => createPrismStackedBarData(series), [series]);
  const tickValues = useMemo(() => getPrismStackedBarTickValues(data), [data]);
  const labelsById = useMemo(
    () => new Map(series.map((item) => [item.id, item.label])),
    [series],
  );
  const tooltip = useMemo(
    () => createPrismStackedBarTooltip(metric, labelsById),
    [labelsById, metric],
  );
  const latestDatum = data.at(-1);
  const latestTotal = latestDatum
    ? getPrismStackedBarTotal(latestDatum, series)
    : null;
  const summaryId = `prism-stacked-bar-chart-summary-${chartId}`;
  const chartSummary = latestDatum
    ? `${title} 누적 막대 차트. ${formatAxisLabel(latestDatum.label)} 기준 총 ${formatMetricValue(metric, latestTotal)}. ${series
        .map((item) => {
          const value = latestDatum[item.id];

          return `${item.label} ${formatMetricValue(metric, typeof value === "number" ? value : null)}`;
        })
        .join(", ")}.`
    : `${title} 차트에 표시할 데이터가 없습니다.`;
  const chartHeightClassName = chartHeightClassNames[presentation];
  const handleBarClick = useCallback(
    (datum: { id: string | number; indexValue: string | number }) => {
      onSelectPoint?.(String(datum.id), String(datum.indexValue));
    },
    [onSelectPoint],
  );

  if (data.length === 0 || series.length < 2) {
    return (
      <div
        aria-label={chartSummary}
        className={`grid ${chartHeightClassName} place-items-center rounded-xl border border-dashed border-[#d8dbe1] bg-[#fbfcfd] text-sm text-[#777587]`}
        role="img"
      >
        표시할 구성 시계열 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[#e1e4ec] bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.14),transparent_36%),linear-gradient(180deg,#fdfdff_0%,#f7f8fd_100%)] px-1 pt-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-2.5 pb-0.5 text-[10px]">
        <ul
          aria-label={`${title} 계열`}
          className="flex flex-wrap gap-x-3 gap-y-1.5"
        >
          {series.map((item, index) => (
            <li
              className="inline-flex items-center gap-1.5 font-medium text-[#595e6b]"
              key={item.id}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-sm shadow-[0_1px_2px_rgba(25,28,30,0.2)]"
                style={{
                  backgroundColor:
                    prismStackedBarColors[index % prismStackedBarColors.length],
                }}
              />
              {item.label}
            </li>
          ))}
        </ul>
        <span className="font-mono font-semibold text-[#424753]">
          {formatMetricValue(metric, latestTotal)}
        </span>
      </div>

      <div
        aria-describedby={summaryId}
        aria-label={`${title} 누적 막대 차트`}
        className={`${chartHeightClassName} w-full outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-4`}
        role="img"
        tabIndex={0}
      >
        <ResponsiveBar
          animate={!prefersReducedMotion}
          ariaDescribedBy={summaryId}
          ariaLabel={`${title} 누적 막대 차트`}
          axisBottom={{
            format: (value) => formatAxisLabel(String(value)),
            tickPadding: 9,
            tickSize: 0,
            tickValues,
          }}
          axisLeft={{
            format: (value) => formatMetricAxisValue(metric, Number(value)),
            tickPadding: 10,
            tickSize: 0,
            tickValues: 4,
          }}
          axisRight={null}
          axisTop={null}
          barAriaLabel={(datum) => {
            const seriesLabel =
              labelsById.get(String(datum.id)) ?? String(datum.id);

            return `${datum.indexValue} ${seriesLabel}: ${formatMetricValue(metric, datum.value)}`;
          }}
          borderColor={{ from: "color", modifiers: [["darker", 0.16]] }}
          barComponent={PrismStackedBarItem}
          borderRadius={4}
          borderWidth={1}
          colors={series.map(
            (_, index) =>
              prismStackedBarColors[index % prismStackedBarColors.length],
          )}
          data={data}
          enableGridX={false}
          enableGridY
          enableLabel={false}
          groupMode="stacked"
          indexBy="label"
          innerPadding={2}
          isFocusable
          keys={series.map((item) => item.id)}
          margin={{ bottom: 34, left: 64, right: 14, top: 10 }}
          motionConfig="gentle"
          onClick={handleBarClick}
          padding={0.32}
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
