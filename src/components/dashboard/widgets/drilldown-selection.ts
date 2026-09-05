import type { DashboardDrilldownSelection } from "../dashboard-drilldown-data";

export function getActiveDrilldown(
  activeDrilldown: DashboardDrilldownSelection | null | undefined,
  widgetId: string,
  queryId: string,
): DashboardDrilldownSelection | undefined {
  return activeDrilldown?.widgetId === widgetId &&
    activeDrilldown.queryId === queryId
    ? activeDrilldown
    : undefined;
}

export function createDrilldownSelection(
  widgetId: string,
  queryId: string,
  label: string,
): DashboardDrilldownSelection {
  return { label, queryId, widgetId };
}
