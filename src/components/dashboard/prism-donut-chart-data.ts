import type { DataPoint } from "@/lib/analytics/query-engine";

export const prismDonutColors = [
  "#4f46e5",
  "#6172e8",
  "#168968",
  "#e9a93d",
  "#a855f7",
  "#e96886",
] as const;

export type PrismDonutDatum = {
  color: string;
  id: string;
  label: string;
  sourceLabel: string;
  value: number;
};

export function createPrismDonutData(
  points: readonly DataPoint[],
  formatLabel: (label: string) => string = (label) => label,
): readonly PrismDonutDatum[] {
  return points.flatMap((point, index) => {
    const value = Math.abs(point.value ?? 0);

    if (value === 0) {
      return [];
    }

    return [
      {
        color: prismDonutColors[index % prismDonutColors.length],
        id: `${point.label}-${index}`,
        label: formatLabel(point.label),
        sourceLabel: point.label,
        value,
      },
    ];
  });
}

export function getPrismDonutTotal(data: readonly PrismDonutDatum[]): number {
  return data.reduce((total, datum) => total + datum.value, 0);
}

export function getPrismDonutPercentage(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100;
}
