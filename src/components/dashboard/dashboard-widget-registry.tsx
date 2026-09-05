"use client";

import { memo, type ReactNode } from "react";
import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";
import type { DashboardWidgetProps } from "./widgets/types";
import { MetricWidget } from "./widgets/metric-widget";
import { TimeSeriesWidget } from "./widgets/time-series-widget";
import { CategoryBarWidget } from "./widgets/category-bar-widget";
import { StackedBarWidget } from "./widgets/stacked-bar-widget";
import { CalendarHeatmapWidget } from "./widgets/calendar-heatmap-widget";
import { DonutWidget } from "./widgets/donut-widget";
import { TableWidget } from "./widgets/table-widget";
import { InsightWidget } from "./widgets/insight-widget";

const componentRegistry = {
  metric: MetricWidget,
  timeSeries: TimeSeriesWidget,
  categoryBar: CategoryBarWidget,
  stackedBar: StackedBarWidget,
  calendarHeatmap: CalendarHeatmapWidget,
  donut: DonutWidget,
  rankingTable: TableWidget,
  dataTable: TableWidget,
  insight: InsightWidget,
} satisfies Record<
  DashboardWidget["type"],
  (props: DashboardWidgetProps) => ReactNode
>;

export const DashboardWidgetCard = memo(function DashboardWidgetCard(
  props: DashboardWidgetProps,
) {
  const Widget = componentRegistry[props.widget.type];

  return <Widget {...props} />;
});
