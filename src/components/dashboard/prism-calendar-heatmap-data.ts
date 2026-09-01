import type { DataPoint } from "@/lib/analytics/query-engine";

export const prismCalendarHeatmapColors = [
  "#f1f2f7",
  "#dedfff",
  "#b8bcff",
  "#7673ee",
  "#4f46e5",
] as const;

export type PrismCalendarHeatmapCell = {
  date: string;
  hasData: boolean;
  intensity: number;
  value: number | null;
  weekdayIndex: number;
  weekIndex: number;
};

export type PrismCalendarHeatmapData = {
  cells: readonly PrismCalendarHeatmapCell[];
  peakCell: PrismCalendarHeatmapCell | undefined;
  weekCount: number;
};

function parseIsoDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatIsoDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);

  next.setUTCDate(next.getUTCDate() + amount);

  return next;
}

function getMondayFirstWeekdayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

export function createPrismCalendarHeatmapData(
  points: readonly DataPoint[],
): PrismCalendarHeatmapData {
  const valuesByDate = new Map(
    points.flatMap((point) => {
      const date = parseIsoDate(point.label);

      return date ? [[formatIsoDate(date), point.value] as const] : [];
    }),
  );
  const dates = [...valuesByDate.keys()]
    .map(parseIsoDate)
    .flatMap((date) => (date ? [date] : []))
    .toSorted((left, right) => left.getTime() - right.getTime());
  const firstDate = dates[0];
  const lastDate = dates.at(-1);

  if (!firstDate || !lastDate) {
    return { cells: [], peakCell: undefined, weekCount: 0 };
  }

  const startDate = addDays(firstDate, -getMondayFirstWeekdayIndex(firstDate));
  const endDate = addDays(lastDate, 6 - getMondayFirstWeekdayIndex(lastDate));
  const highestValue = Math.max(
    0,
    ...[...valuesByDate.values()].flatMap((value) =>
      value === null ? [] : [Math.max(0, value)],
    ),
  );
  const cells: PrismCalendarHeatmapCell[] = [];

  for (
    let date = startDate, weekIndex = 0;
    date <= endDate;
    date = addDays(date, 1), weekIndex = Math.floor(cells.length / 7)
  ) {
    const isoDate = formatIsoDate(date);
    const value = valuesByDate.get(isoDate) ?? null;
    const hasData = valuesByDate.has(isoDate);
    const normalizedValue = value === null ? 0 : Math.max(0, value);
    const intensity =
      !hasData || highestValue === 0
        ? 0
        : Math.max(1, Math.ceil((normalizedValue / highestValue) * 4));

    cells.push({
      date: isoDate,
      hasData,
      intensity,
      value,
      weekdayIndex: getMondayFirstWeekdayIndex(date),
      weekIndex,
    });
  }

  const peakCell = cells
    .filter((cell) => cell.hasData && cell.value !== null)
    .toSorted((left, right) => (right.value ?? 0) - (left.value ?? 0))[0];

  return {
    cells,
    peakCell,
    weekCount: Math.ceil(cells.length / 7),
  };
}
