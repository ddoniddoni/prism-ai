"use client";

import { useMemo, useState } from "react";
import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { Finding } from "@/lib/analytics/findings";
import type { AnalyticsFilter } from "@/lib/analytics/query-schema";
import type {
  DashboardSpec,
  DashboardWidget,
} from "@/lib/ai/schemas/dashboard-spec";
import {
  createDashboardLayoutPlan,
  dashboardLayoutConstraints,
  type DashboardLayoutDataDensity,
  type DashboardLayoutBreakpoint,
  type DashboardLayoutPlan,
} from "@/stores/dashboard-layout";
import { DashboardHeader } from "./dashboard-header";
import { DashboardWidgetCard } from "./dashboard-widget-registry";
import {
  getDashboardWidgetDrilldown,
  type DashboardDrilldownSelection,
} from "./dashboard-drilldown-data";

type DashboardRendererProps = {
  dashboard: DashboardSpec;
  datasets: readonly AnalyticsDataset[];
  findings: readonly Finding[];
};

const gridSpanClassNames: Record<
  Exclude<DashboardLayoutBreakpoint, "sm">,
  Record<number, string>
> = {
  lg: {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    10: "lg:col-span-10",
    11: "lg:col-span-11",
    12: "lg:col-span-12",
  },
  md: {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
  },
};

function getWidgetGridClassName(
  widget: DashboardWidget,
  mdLayoutPlan: DashboardLayoutPlan,
  lgLayoutPlan: DashboardLayoutPlan,
): string {
  const mdSpan = mdLayoutPlan.get(widget.id)?.w ?? 1;
  const lgSpan = lgLayoutPlan.get(widget.id)?.w ?? 1;

  return `${gridSpanClassNames.md[mdSpan]} ${gridSpanClassNames.lg[lgSpan]}`;
}

function getDashboardGridWidgetOrder(
  widgets: readonly DashboardWidget[],
  layoutPlan: DashboardLayoutPlan,
): readonly DashboardWidget[] {
  return widgets
    .map((widget, index) => ({
      index,
      layout: layoutPlan.get(widget.id),
      widget,
    }))
    .toSorted(
      (left, right) =>
        (left.layout?.y ?? 0) - (right.layout?.y ?? 0) ||
        (left.layout?.x ?? 0) - (right.layout?.x ?? 0) ||
        left.index - right.index,
    )
    .map((item) => item.widget);
}

export function DashboardWidgetGrid({
  activeDrilldown,
  drilldownAnalysisDisabled,
  widgets,
  datasets,
  findings,
  onDrilldownChange,
  onDrilldownAnalysis,
}: Pick<DashboardRendererProps, "datasets" | "findings"> & {
  activeDrilldown?: DashboardDrilldownSelection | null;
  drilldownAnalysisDisabled?: boolean;
  onDrilldownChange?: (selection: DashboardDrilldownSelection | null) => void;
  onDrilldownAnalysis?: (filter: AnalyticsFilter) => void;
  widgets: readonly DashboardWidget[];
}) {
  const datasetsById = useMemo(
    () => new Map(datasets.map((dataset) => [dataset.queryId, dataset])),
    [datasets],
  );
  const findingsById = useMemo(
    () => new Map(findings.map((finding) => [finding.id, finding])),
    [findings],
  );
  const layoutDataDensity = useMemo<DashboardLayoutDataDensity>(
    () =>
      Object.fromEntries(
        datasets.map((dataset) => [dataset.queryId, dataset.points.length]),
      ),
    [datasets],
  );
  const mdLayoutPlan = useMemo(
    () => createDashboardLayoutPlan(widgets, "md", layoutDataDensity),
    [layoutDataDensity, widgets],
  );
  const lgLayoutPlan = useMemo(
    () => createDashboardLayoutPlan(widgets, "lg", layoutDataDensity),
    [layoutDataDensity, widgets],
  );
  const orderedWidgets = useMemo(
    () => getDashboardGridWidgetOrder(widgets, lgLayoutPlan),
    [lgLayoutPlan, widgets],
  );

  return (
    <div
      className="mt-5 grid md:grid-cols-6 lg:grid-cols-12"
      style={{ gap: dashboardLayoutConstraints.lg.gutterPx }}
    >
      {orderedWidgets.map((widget) => (
        <div
          className={getWidgetGridClassName(widget, mdLayoutPlan, lgLayoutPlan)}
          key={widget.id}
        >
          <DashboardWidgetCard
            activeDrilldown={getDashboardWidgetDrilldown(
              activeDrilldown,
              widget.id,
            )}
            datasetsById={datasetsById}
            drilldownAnalysisDisabled={drilldownAnalysisDisabled}
            findingsById={findingsById}
            onDrilldownChange={onDrilldownChange}
            onDrilldownAnalysis={onDrilldownAnalysis}
            presentation={lgLayoutPlan.get(widget.id)?.presentation}
            widget={widget}
          />
        </div>
      ))}
    </div>
  );
}

export function DashboardRenderer({
  dashboard,
  datasets,
  findings,
}: DashboardRendererProps) {
  const [activeDrilldown, setActiveDrilldown] =
    useState<DashboardDrilldownSelection | null>(null);

  return (
    <section aria-labelledby="analysis-dashboard-title" className="mt-7">
      <DashboardHeader dashboard={dashboard} />
      <DashboardWidgetGrid
        activeDrilldown={activeDrilldown}
        datasets={datasets}
        findings={findings}
        onDrilldownChange={setActiveDrilldown}
        widgets={dashboard.widgets}
      />
    </section>
  );
}
