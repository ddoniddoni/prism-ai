import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

export type DashboardLayoutBreakpoint = "lg" | "md" | "sm";

function isSupportingWidget(widget: DashboardWidget): boolean {
  return (
    widget.type === "categoryBar" ||
    widget.type === "stackedBar" ||
    widget.type === "donut" ||
    widget.type === "rankingTable" ||
    widget.type === "dataTable"
  );
}

export function getDashboardWidgetSpan(
  widget: DashboardWidget,
  widgets: readonly DashboardWidget[],
  breakpoint: DashboardLayoutBreakpoint,
): number {
  if (breakpoint === "sm") {
    return 1;
  }

  const metricCount = widgets.filter(
    (candidate) => candidate.type === "metric",
  ).length;
  const hasTimeSeries = widgets.some(
    (candidate) => candidate.type === "timeSeries",
  );
  const supportingWidgets = widgets.filter(isSupportingWidget);
  const supportingWidgetCount = supportingWidgets.length;
  const supportingWidgetIndex = supportingWidgets.indexOf(widget);

  if (breakpoint === "md") {
    if (widget.type === "metric") {
      return metricCount === 1 && !hasTimeSeries && supportingWidgetCount === 1
        ? 3
        : metricCount === 1
          ? 6
          : 3;
    }

    if (widget.type === "timeSeries" || widget.type === "insight") {
      return 6;
    }

    return metricCount === 1 && !hasTimeSeries && supportingWidgetCount === 1
      ? 3
      : supportingWidgetCount === 1
        ? 6
        : 3;
  }

  if (widget.type === "metric") {
    if (metricCount === 1 && hasTimeSeries) {
      return 4;
    }

    if (metricCount === 2) {
      return 6;
    }

    return metricCount === 1 ? 12 : 4;
  }

  if (widget.type === "timeSeries") {
    return metricCount === 1 ? 8 : 12;
  }

  if (widget.type === "insight") {
    return 12;
  }

  if (metricCount === 1 && hasTimeSeries && supportingWidgetCount <= 2) {
    return supportingWidgetIndex === 0 ? 4 : 8;
  }

  if (metricCount === 1 && !hasTimeSeries && supportingWidgetCount === 1) {
    return 8;
  }

  return supportingWidgetCount === 1 ? 12 : 6;
}
