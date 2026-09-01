import type { DataPoint } from "@/lib/analytics/query-engine";

export const prismRankedBarColors = ["#4f46e5", "#7c87e8", "#b6bdcf"] as const;

export type PrismRankedBarDatum = {
  change: number;
  color: string;
  hasChange: number;
  id: string;
  label: string;
  rank: number;
  value: number;
};

export function createPrismRankedBarData(
  points: readonly DataPoint[],
): readonly PrismRankedBarDatum[] {
  const drawablePoints = points.flatMap((point, index) => {
    if (point.value === null) {
      return [];
    }

    return [
      {
        change: point.percentChange ?? 0,
        hasChange: point.percentChange === undefined ? 0 : 1,
        id: `${point.label}-${index}`,
        label: point.label,
        value: Math.abs(point.value),
      },
    ];
  });

  return drawablePoints
    .toSorted((left, right) => right.value - left.value)
    .map((point, index) => ({
      ...point,
      color:
        prismRankedBarColors[Math.min(index, prismRankedBarColors.length - 1)],
      rank: index + 1,
    }));
}

export function getPrismRankedBarChartHeight(itemCount: number): number {
  return Math.min(264, Math.max(176, itemCount * 40 + 48));
}
