"use client";

import { useId, useMemo, useState } from "react";

import type { DataPoint } from "@/lib/analytics/query-engine";
import type { MetricKey } from "@/lib/analytics/metric-catalog";

import { formatMetricValue } from "./formatters";
import {
  createPrismCalendarHeatmapData,
  prismCalendarHeatmapColors,
  type PrismCalendarHeatmapCell,
} from "./prism-calendar-heatmap-data";

type PrismCalendarHeatmapProps = {
  metric: MetricKey;
  points: readonly DataPoint[];
  title: string;
};

const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"] as const;

function formatCalendarDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  const weekday = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  const weekdayIndex = (weekday.getUTCDay() + 6) % 7;

  return `${Number(match[2])}월 ${Number(match[3])}일 (${weekdayLabels[weekdayIndex]})`;
}

function HeatmapDetail({
  cell,
  metric,
}: {
  cell: PrismCalendarHeatmapCell | undefined;
  metric: MetricKey;
}) {
  if (!cell) {
    return <span>표시할 날짜 데이터가 없습니다.</span>;
  }

  return (
    <>
      <span className="font-medium text-[#343844]">
        {formatCalendarDate(cell.date)}
      </span>
      <strong className="font-mono text-[#191c1e]">
        {formatMetricValue(metric, cell.value)}
      </strong>
    </>
  );
}

export function PrismCalendarHeatmap({
  metric,
  points,
  title,
}: PrismCalendarHeatmapProps) {
  const chartId = useId().replace(/:/g, "");
  const [activeDate, setActiveDate] = useState<string | undefined>();
  const data = useMemo(() => createPrismCalendarHeatmapData(points), [points]);
  const activeCell = useMemo(
    () =>
      data.cells.find((cell) => cell.date === activeDate && cell.hasData) ??
      data.peakCell,
    [activeDate, data.cells, data.peakCell],
  );
  const summaryId = `prism-calendar-heatmap-summary-${chartId}`;
  const chartSummary = data.peakCell
    ? `${title} 캘린더 히트맵. 가장 높은 일자는 ${formatCalendarDate(data.peakCell.date)} ${formatMetricValue(metric, data.peakCell.value)}입니다.`
    : `${title} 차트에 표시할 날짜 데이터가 없습니다.`;

  if (data.cells.length === 0) {
    return (
      <div
        aria-label={chartSummary}
        className="grid h-40 place-items-center rounded-lg border border-dashed border-[#d8dbe1] bg-[#fbfcfd] text-sm text-[#777587]"
        role="img"
      >
        표시할 일별 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div
      aria-describedby={summaryId}
      aria-label={`${title} 캘린더 히트맵`}
      className="mx-auto max-w-[19rem]"
      role="group"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <div
          aria-live="polite"
          className="flex min-w-0 items-center gap-1.5 text-[#595e6b]"
        >
          <span className="rounded bg-[#eef0ff] px-1 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-[#4943c7] uppercase">
            선택
          </span>
          <HeatmapDetail cell={activeCell} metric={metric} />
        </div>
        <div
          aria-label="낮음에서 높음까지의 색 농도"
          className="flex items-center gap-1"
        >
          <span className="text-[#777587]">낮음</span>
          {prismCalendarHeatmapColors.slice(1).map((color) => (
            <span
              aria-hidden="true"
              className="size-2 rounded-[3px] border border-white/80 shadow-[0_1px_2px_rgba(25,28,30,0.12)]"
              key={color}
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[#777587]">높음</span>
        </div>
      </div>

      <div className="mt-2.5 rounded-lg border border-[#e7e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_100%)] p-2 shadow-[0_6px_18px_rgba(41,44,68,0.035)]">
        <div className="grid w-fit grid-cols-7 gap-1 sm:gap-1.5">
          {weekdayLabels.map((label, index) => (
            <span
              className={`pb-0.5 text-center text-[8px] font-semibold tracking-[0.08em] ${index > 4 ? "text-[#8785a0]" : "text-[#777587]"}`}
              key={label}
            >
              {label}
            </span>
          ))}
          {data.cells.map((cell) => {
            const isActive = activeCell?.date === cell.date;
            const isIntense = cell.intensity >= 3;

            return cell.hasData ? (
              <button
                aria-label={`${formatCalendarDate(cell.date)} ${formatMetricValue(metric, cell.value)}`}
                aria-pressed={isActive}
                className={`relative grid size-5 place-items-center rounded-[5px] border border-white/75 text-[8px] font-semibold tabular-nums shadow-[0_1px_2px_rgba(25,28,30,0.1)] transition duration-150 hover:z-10 hover:-translate-y-0.5 hover:scale-110 focus-visible:z-10 focus-visible:-translate-y-0.5 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312e81] motion-reduce:transition-none sm:size-6 sm:text-[9px] ${isIntense ? "text-white" : "text-[#565867]"} ${isActive ? "ring-2 ring-[#312e81] ring-offset-2" : ""}`}
                key={cell.date}
                onClick={() => setActiveDate(cell.date)}
                onFocus={() => setActiveDate(cell.date)}
                onMouseEnter={() => setActiveDate(cell.date)}
                style={{
                  backgroundColor: prismCalendarHeatmapColors[cell.intensity],
                }}
                title={`${formatCalendarDate(cell.date)} · ${formatMetricValue(metric, cell.value)}`}
                type="button"
              >
                {Number(cell.date.slice(-2))}
              </button>
            ) : (
              <span
                aria-hidden="true"
                className="size-5 rounded-[5px] bg-transparent sm:size-6"
                key={cell.date}
              />
            );
          })}
        </div>
      </div>

      <p className="sr-only" id={summaryId}>
        {chartSummary}
      </p>
    </div>
  );
}
