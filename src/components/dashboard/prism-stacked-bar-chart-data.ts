import type { DataPoint } from "@/lib/analytics/query-engine";

export const prismStackedBarColors = [
  "#4f46e5",
  "#7180e8",
  "#15906d",
  "#d59a2f",
  "#a855f7",
  "#df5c7a",
] as const;

export type PrismStackedBarSeries = {
  id: string;
  label: string;
  points: readonly DataPoint[];
};

export type PrismStackedBarDatum = {
  label: string;
  [seriesId: string]: number | string;
};

export function createPrismStackedBarData(
  series: readonly PrismStackedBarSeries[],
): readonly PrismStackedBarDatum[] {
  const labels = new Set<string>();
  const pointsBySeries = new Map(
    series.map((item) => [
      item.id,
      new Map(
        item.points.map((point) => [
          point.label,
          Math.max(0, point.value ?? 0),
        ]),
      ),
    ]),
  );

  for (const item of series) {
    for (const point of item.points) {
      labels.add(point.label);
    }
  }

  return [...labels]
    .toSorted((left, right) => left.localeCompare(right))
    .map((label) => {
      const datum: PrismStackedBarDatum = { label };

      for (const item of series) {
        datum[item.id] = pointsBySeries.get(item.id)?.get(label) ?? 0;
      }

      return datum;
    });
}

export function getPrismStackedBarTotal(
  datum: PrismStackedBarDatum,
  series: readonly PrismStackedBarSeries[],
): number {
  return series.reduce((total, item) => {
    const value = datum[item.id];

    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

export function getPrismStackedBarTickValues(
  data: readonly PrismStackedBarDatum[],
): readonly string[] {
  if (data.length <= 3) {
    return data.map((datum) => datum.label);
  }

  const first = data[0]?.label;
  const middle = data[Math.floor(data.length / 2)]?.label;
  const last = data.at(-1)?.label;

  return [first, middle, last].flatMap((label) => (label ? [label] : []));
}

export function getPrismStackedBarTooltipAnchor(
  barTop: number,
  barHeight: number,
): "top" | "bottom" {
  return barTop + barHeight / 2 < 76 ? "bottom" : "top";
}
