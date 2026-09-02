"use client";

import { useId, useMemo, useState } from "react";

import type { DataPoint } from "@/lib/analytics/query-engine";
import type { MetricKey } from "@/lib/analytics/metric-catalog";
import type { DashboardWidgetPresentation } from "@/stores/dashboard-layout";

import { formatMetricValue } from "./formatters";
import {
  createPrismCalendarHeatmapData,
  createPrismCalendarHeatmapSummary,
  prismCalendarHeatmapColors,
  type PrismCalendarHeatmapCell,
  type PrismCalendarHeatmapSummary,
} from "./prism-calendar-heatmap-data";

type PrismCalendarHeatmapProps = {
  metric: MetricKey;
  onSelectPoint?: (label: string) => void;
  points: readonly DataPoint[];
  presentation?: DashboardWidgetPresentation;
  title: string;
};

const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"] as const;

const calendarPresentationClassNames: Record<
  DashboardWidgetPresentation,
  {
    day: string;
    emptyDay: string;
    emptyState: string;
    grid: string;
    header: string;
    panel: string;
    weekday: string;
    wrapper: string;
  }
> = {
  compact: {
    day: "size-5 text-[8px] sm:size-6 sm:text-[9px]",
    emptyDay: "size-5 sm:size-6",
    emptyState: "h-40",
    grid: "w-fit grid-cols-7 gap-1 sm:gap-1.5",
    header: "text-[10px]",
    panel: "p-2",
    weekday: "pb-0.5 text-[8px]",
    wrapper: "mx-auto w-full max-w-[19rem]",
  },
  standard: {
    day: "size-6 text-[9px] sm:size-8 sm:text-[10px]",
    emptyDay: "size-6 sm:size-8",
    emptyState: "h-48",
    grid: "w-fit grid-cols-7 gap-1.5",
    header: "text-[11px]",
    panel: "p-3",
    weekday: "pb-1 text-[9px]",
    wrapper: "mx-auto w-full max-w-[23rem]",
  },
  feature: {
    day: "aspect-square w-full min-w-0 text-[10px] sm:text-[12px]",
    emptyDay: "aspect-square w-full min-w-0",
    emptyState: "h-56",
    grid: "mx-auto grid-cols-7 gap-1.5 sm:gap-2",
    header: "text-[11px] sm:text-[12px]",
    panel: "p-3.5 sm:p-4",
    weekday: "pb-1.5 text-[9px] sm:text-[10px]",
    wrapper:
      "grid w-full gap-5 lg:grid-cols-[minmax(0,30rem)_minmax(15rem,1fr)] lg:items-center lg:gap-8",
  },
};

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

function CalendarFeatureSummary({
  metric,
  summary,
}: {
  metric: MetricKey;
  summary: PrismCalendarHeatmapSummary;
}) {
  const peakDate = summary.peakCell
    ? formatCalendarDate(summary.peakCell.date)
    : "데이터 없음";
  const strongestWeekday =
    summary.strongestWeekdayIndex === undefined
      ? "—"
      : `${weekdayLabels[summary.strongestWeekdayIndex]}요일`;

  return (
    <aside className="w-full rounded-xl border border-[#dfe2f5] bg-[linear-gradient(145deg,#f8f9ff_0%,#f2f3ff_100%)] p-4 shadow-[0_10px_26px_rgba(79,70,229,0.06)] sm:p-5">
      <p className="text-[9px] font-semibold tracking-[0.12em] text-[#5750c8] uppercase">
        Month signals
      </p>
      <div className="mt-3 border-b border-[#dfe2f5] pb-3.5">
        <span className="text-[11px] text-[#676b7a]">가장 높은 일자</span>
        <strong className="mt-1 block text-[15px] font-semibold tracking-[-0.025em] text-[#242735]">
          {peakDate}
        </strong>
        <strong className="mt-1 block font-mono text-[19px] tracking-[-0.045em] text-[#312e81]">
          {formatMetricValue(metric, summary.peakCell?.value)}
        </strong>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-[11px]">
        <div>
          <dt className="text-[#676b7a]">기간 합계</dt>
          <dd className="mt-1 font-mono font-semibold tracking-[-0.035em] text-[#2c303b]">
            {formatMetricValue(metric, summary.totalValue)}
          </dd>
        </div>
        <div>
          <dt className="text-[#676b7a]">일평균</dt>
          <dd className="mt-1 font-mono font-semibold tracking-[-0.035em] text-[#2c303b]">
            {formatMetricValue(metric, summary.averageValue)}
          </dd>
        </div>
        <div>
          <dt className="text-[#676b7a]">강한 요일</dt>
          <dd className="mt-1 font-semibold text-[#2c303b]">
            {strongestWeekday}
          </dd>
        </div>
        <div>
          <dt className="text-[#676b7a]">분석 일수</dt>
          <dd className="mt-1 font-mono font-semibold text-[#2c303b]">
            {summary.dataDayCount}일
          </dd>
        </div>
      </dl>
    </aside>
  );
}

export function PrismCalendarHeatmap({
  metric,
  onSelectPoint,
  points,
  presentation = "compact",
  title,
}: PrismCalendarHeatmapProps) {
  const chartId = useId().replace(/:/g, "");
  const [activeDate, setActiveDate] = useState<string | undefined>();
  const data = useMemo(() => createPrismCalendarHeatmapData(points), [points]);
  const monthSummary = useMemo(
    () => createPrismCalendarHeatmapSummary(data),
    [data],
  );
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
  const presentationClassNames = calendarPresentationClassNames[presentation];

  if (data.cells.length === 0) {
    return (
      <div
        aria-label={chartSummary}
        className={`grid ${presentationClassNames.emptyState} place-items-center rounded-lg border border-dashed border-[#d8dbe1] bg-[#fbfcfd] text-sm text-[#777587]`}
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
      className={presentationClassNames.wrapper}
      role="group"
    >
      <div
        className={
          presentation === "feature"
            ? "w-full max-w-[30rem] justify-self-center lg:justify-self-start"
            : undefined
        }
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-2 ${presentationClassNames.header}`}
        >
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

        <div
          className={`mt-2.5 rounded-lg border border-[#e7e9f0] bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_100%)] shadow-[0_6px_18px_rgba(41,44,68,0.035)] ${presentationClassNames.panel}`}
        >
          <div className={`grid ${presentationClassNames.grid}`}>
            {weekdayLabels.map((label, index) => (
              <span
                className={`${presentationClassNames.weekday} text-center font-semibold tracking-[0.08em] ${index > 4 ? "text-[#8785a0]" : "text-[#777587]"}`}
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
                  className={`relative grid place-items-center rounded-[5px] border border-white/75 font-semibold tabular-nums shadow-[0_1px_2px_rgba(25,28,30,0.1)] transition duration-150 hover:z-10 hover:-translate-y-0.5 hover:scale-110 focus-visible:z-10 focus-visible:-translate-y-0.5 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312e81] motion-reduce:transition-none ${presentationClassNames.day} ${isIntense ? "text-white" : "text-[#565867]"} ${isActive ? "ring-2 ring-[#312e81] ring-offset-2" : ""}`}
                  key={cell.date}
                  onClick={() => {
                    setActiveDate(cell.date);
                    onSelectPoint?.(cell.date);
                  }}
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
                  className={`${presentationClassNames.emptyDay} rounded-[5px] bg-transparent`}
                  key={cell.date}
                />
              );
            })}
          </div>
        </div>
      </div>

      {presentation === "feature" ? (
        <CalendarFeatureSummary metric={metric} summary={monthSummary} />
      ) : null}

      <p className="sr-only" id={summaryId}>
        {chartSummary}
      </p>
    </div>
  );
}
