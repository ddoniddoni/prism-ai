import { dimensionCatalog } from "@/lib/analytics/dimension-catalog";
import type { AnalyticsFilter } from "@/lib/analytics/query-schema";

function getDashboardContextFilterId(filter: AnalyticsFilter): string {
  return `${filter.dimension}:${filter.operator}:${filter.values.join("\u0001")}`;
}

export function getDashboardContextFilterLabel(
  filter: AnalyticsFilter,
): string {
  const dimension = dimensionCatalog[filter.dimension].label;
  const values = filter.values.join(", ");

  if (filter.operator === "notIn") {
    return `${dimension} · ${values} 제외`;
  }

  if (filter.operator === "in") {
    return `${dimension} · ${values} 포함`;
  }

  return `${dimension} · ${values}`;
}

export function removeDashboardContextFilter(
  filters: readonly AnalyticsFilter[],
  filterToRemove: AnalyticsFilter,
): AnalyticsFilter[] {
  const filterId = getDashboardContextFilterId(filterToRemove);

  return filters.filter(
    (filter) => getDashboardContextFilterId(filter) !== filterId,
  );
}
