import type { AnalyzeResponse } from "@/lib/analysis/schemas";
import { metricCatalog } from "@/lib/analytics/metric-catalog";
import { dimensionCatalog } from "@/lib/analytics/dimension-catalog";
import { formatDimensionValue } from "./formatters";
import { getDashboardContextFilterLabel } from "./dashboard-context-controls-data";

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  // Keep labels as text when opened in a spreadsheet, including formula-like input.
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createAnalysisCsv(response: AnalyzeResponse): string {
  const rows: (string | number | null | undefined)[][] = [
    [
      "조회",
      "행 구분",
      "지표",
      "단위",
      "분류",
      "항목",
      "시작일",
      "종료일",
      "현재 값",
      "비교 값",
      "비교 시작일",
      "비교 종료일",
      "적용 필터",
      "데이터 상태",
    ],
  ];
  const units = {
    currency: "원",
    count: "건",
    percent: "비율 (1 = 100%)",
    ratio: "배",
  };
  for (const dataset of response.datasets) {
    const metric = metricCatalog[dataset.metric];
    const filters =
      response.plan.queries.find((query) => query.id === dataset.queryId)
        ?.filters ?? response.context.filters;
    const addRow = (
      kind: string,
      label: string,
      value: number | null,
      previous: number | null | undefined,
    ) =>
      rows.push([
        dataset.queryId,
        kind,
        metric.label,
        dataset.metric === "customers"
          ? "명"
          : dataset.metric === "unitsSold"
            ? "개"
            : dataset.metric === "sessions"
              ? "회"
              : units[metric.format],
        dataset.groupBy ? dimensionCatalog[dataset.groupBy].label : "전체",
        label,
        dataset.dataRange.startDate,
        dataset.dataRange.endDate,
        value,
        previous,
        dataset.comparisonRange?.startDate,
        dataset.comparisonRange?.endDate,
        filters.map(getDashboardContextFilterLabel).join(" · ") ||
          "전체 데이터",
        dataset.empty
          ? "데이터 없음"
          : dataset.warnings.join(" · ") || "조회 완료",
      ]);
    addRow("전체 집계", "전체", dataset.currentTotal, dataset.previousTotal);
    if (dataset.groupBy) {
      for (const point of dataset.points) {
        addRow(
          "분류별 집계",
          formatDimensionValue(dataset.groupBy, point.label),
          point.value,
          point.previousValue,
        );
      }
    }
  }
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
