import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

export type DashboardLayoutBreakpoint = "lg" | "md" | "sm";
export type DashboardWidgetPresentation = "compact" | "standard" | "feature";
export type DashboardLayoutDataDensity = Readonly<Record<string, number>>;
export type DashboardLayoutHeightOverrides = Readonly<Record<string, number>>;

export type DashboardWidgetLayoutPlan = {
  h: number;
  id: string;
  presentation: DashboardWidgetPresentation;
  w: number;
  x: number;
  y: number;
};

export type DashboardLayoutPlan = ReadonlyMap<
  string,
  DashboardWidgetLayoutPlan
>;

export const dashboardLayoutConstraints = {
  lg: {
    columns: 12,
    gutterPx: 20,
    maxUnusedCanvasRatio: 0.18,
  },
  md: {
    columns: 6,
    gutterPx: 20,
    maxUnusedCanvasRatio: 0.2,
  },
  sm: {
    columns: 1,
    gutterPx: 20,
    maxUnusedCanvasRatio: 0,
  },
} as const;

type WidgetLayoutProfile = Pick<
  DashboardWidgetLayoutPlan,
  "h" | "presentation" | "w"
>;

const dashboardColumns: Record<DashboardLayoutBreakpoint, number> = {
  lg: dashboardLayoutConstraints.lg.columns,
  md: dashboardLayoutConstraints.md.columns,
  sm: dashboardLayoutConstraints.sm.columns,
};

function isSupportingWidget(widget: DashboardWidget): boolean {
  return (
    widget.type === "categoryBar" ||
    widget.type === "stackedBar" ||
    widget.type === "calendarHeatmap" ||
    widget.type === "donut" ||
    widget.type === "rankingTable" ||
    widget.type === "dataTable"
  );
}

function getWidgetDataPointCount(
  widget: DashboardWidget,
  dataDensity: DashboardLayoutDataDensity,
): number {
  return Math.max(
    0,
    ...widget.queryIds.map((queryId) => dataDensity[queryId] ?? 0),
  );
}

function getTabletSpan(
  widget: DashboardWidget,
  widgets: readonly DashboardWidget[],
): number {
  const metricCount = widgets.filter(
    (candidate) => candidate.type === "metric",
  ).length;
  const hasTimeSeries = widgets.some(
    (candidate) => candidate.type === "timeSeries",
  );
  const supportingWidgetCount = widgets.filter(isSupportingWidget).length;

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

function getDefaultProfile(
  widget: DashboardWidget,
  dataDensity: DashboardLayoutDataDensity,
): WidgetLayoutProfile {
  const dataPointCount = getWidgetDataPointCount(widget, dataDensity);

  switch (widget.type) {
    case "metric":
      return { h: 4, presentation: "compact", w: 4 };
    case "timeSeries":
      return {
        h: dataPointCount > 45 ? 9 : 8,
        presentation: "feature",
        w: 8,
      };
    case "categoryBar":
      return {
        h: dataPointCount > 8 ? 7 : 6,
        presentation: dataPointCount > 8 ? "feature" : "standard",
        w: dataPointCount > 8 ? 8 : 6,
      };
    case "stackedBar":
      return { h: 7, presentation: "feature", w: 8 };
    case "calendarHeatmap":
      return {
        h: dataPointCount > 28 ? 7 : 6,
        presentation: "compact",
        w: 4,
      };
    case "donut":
      return { h: 7, presentation: "standard", w: 6 };
    case "rankingTable":
    case "dataTable":
      return {
        h: dataPointCount > 8 ? 8 : 7,
        presentation: dataPointCount > 8 ? "feature" : "standard",
        w: dataPointCount > 8 ? 8 : 6,
      };
    case "insight":
      return { h: 4, presentation: "standard", w: 12 };
  }
}

function getStandaloneProfile(
  widget: DashboardWidget,
  dataDensity: DashboardLayoutDataDensity,
): WidgetLayoutProfile {
  const profile = getDefaultProfile(widget, dataDensity);

  switch (widget.type) {
    case "metric":
      return profile;
    case "calendarHeatmap":
      return { h: 9, presentation: "feature", w: 12 };
    case "donut":
      return { h: 8, presentation: "feature", w: 8 };
    case "timeSeries":
    case "categoryBar":
    case "stackedBar":
    case "rankingTable":
    case "dataTable":
    case "insight":
      return { ...profile, presentation: "feature", w: 12 };
  }
}

function withHeightOverride(
  widget: DashboardWidget,
  profile: WidgetLayoutProfile,
  heightOverrides: DashboardLayoutHeightOverrides,
): WidgetLayoutProfile {
  return {
    ...profile,
    h: Math.max(profile.h, heightOverrides[widget.id] ?? 0),
  };
}

function createSequentialLayoutPlan(
  widgets: readonly DashboardWidget[],
  breakpoint: DashboardLayoutBreakpoint,
  dataDensity: DashboardLayoutDataDensity,
  heightOverrides: DashboardLayoutHeightOverrides,
): DashboardLayoutPlan {
  const columns = dashboardColumns[breakpoint];
  const plan = new Map<string, DashboardWidgetLayoutPlan>();
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const widget of widgets) {
    const baseProfile =
      widgets.length === 1 && breakpoint === "lg"
        ? getStandaloneProfile(widget, dataDensity)
        : getDefaultProfile(widget, dataDensity);
    const profile = withHeightOverride(widget, baseProfile, heightOverrides);
    const width =
      breakpoint === "sm"
        ? 1
        : breakpoint === "md"
          ? getTabletSpan(widget, widgets)
          : profile.w;
    const height = breakpoint === "sm" ? Math.max(3, profile.h - 1) : profile.h;

    if (cursorX > 0 && cursorX + width > columns) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    plan.set(widget.id, {
      h: height,
      id: widget.id,
      presentation: breakpoint === "sm" ? "compact" : profile.presentation,
      w: width,
      x: cursorX,
      y: cursorY,
    });

    cursorX += width;
    rowHeight = Math.max(rowHeight, height);

    if (cursorX >= columns) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }
  }

  return plan;
}

export function getDashboardUnusedCanvasRatio(
  plan: DashboardLayoutPlan,
  breakpoint: DashboardLayoutBreakpoint,
): number {
  const layoutItems = [...plan.values()];

  if (layoutItems.length === 0) {
    return 0;
  }

  const canvasHeight = Math.max(...layoutItems.map((item) => item.y + item.h));
  const canvasArea = dashboardColumns[breakpoint] * canvasHeight;
  const usedArea = layoutItems.reduce(
    (total, item) => total + item.w * item.h,
    0,
  );

  return canvasArea === 0 ? 0 : (canvasArea - usedArea) / canvasArea;
}

function createDesktopBentoPlanCandidate(
  widgets: readonly DashboardWidget[],
  dataDensity: DashboardLayoutDataDensity,
  heightOverrides: DashboardLayoutHeightOverrides,
  calendarUsesFeatureCanvas: boolean,
): DashboardLayoutPlan | undefined {
  const [metricWidget, trendWidget, ...remainingWidgets] = widgets;
  const supportingWidgets = remainingWidgets.filter(isSupportingWidget);

  if (
    metricWidget?.type !== "metric" ||
    trendWidget?.type !== "timeSeries" ||
    supportingWidgets.length === 0 ||
    supportingWidgets.length > 2
  ) {
    return undefined;
  }

  const plan = new Map<string, DashboardWidgetLayoutPlan>();
  const metricProfile = withHeightOverride(
    metricWidget,
    getDefaultProfile(metricWidget, dataDensity),
    heightOverrides,
  );
  const trendProfile = withHeightOverride(
    trendWidget,
    getDefaultProfile(trendWidget, dataDensity),
    heightOverrides,
  );

  plan.set(metricWidget.id, {
    ...metricProfile,
    id: metricWidget.id,
    w: 4,
    x: 0,
    y: 0,
  });
  plan.set(trendWidget.id, {
    ...trendProfile,
    id: trendWidget.id,
    w: 8,
    x: 4,
    y: 0,
  });

  const calendarWidget = supportingWidgets.find(
    (widget) => widget.type === "calendarHeatmap",
  );
  let compactLaneBottom = metricProfile.h;
  let analysisLaneBottom = trendProfile.h;
  let supportingWidgetIndex = 0;

  for (const widget of remainingWidgets) {
    const profile = withHeightOverride(
      widget,
      getDefaultProfile(widget, dataDensity),
      heightOverrides,
    );
    const isSupporting = isSupportingWidget(widget);
    const isCalendar = widget.id === calendarWidget?.id;

    if (!isSupporting) {
      const y = Math.max(compactLaneBottom, analysisLaneBottom);

      plan.set(widget.id, {
        ...profile,
        id: widget.id,
        presentation: "standard",
        w: 12,
        x: 0,
        y,
      });
      compactLaneBottom = y + profile.h;
      analysisLaneBottom = compactLaneBottom;
      continue;
    }

    const isLeftLane = calendarUsesFeatureCanvas
      ? !isCalendar
      : isCalendar || (!calendarWidget && supportingWidgetIndex === 0);
    const forcedProfile: WidgetLayoutProfile = isLeftLane
      ? {
          ...profile,
          presentation: "compact",
          w: 4,
        }
      : {
          ...profile,
          h:
            isCalendar && calendarUsesFeatureCanvas
              ? Math.max(profile.h, 8)
              : profile.h,
          presentation: "feature",
          w: 8,
        };
    const x = isLeftLane ? 0 : 4;
    const y = isLeftLane ? compactLaneBottom : analysisLaneBottom;

    plan.set(widget.id, { ...forcedProfile, id: widget.id, x, y });

    if (isLeftLane) {
      compactLaneBottom += forcedProfile.h;
    } else {
      analysisLaneBottom += forcedProfile.h;
    }

    supportingWidgetIndex += 1;
  }

  return plan;
}

function createDesktopBentoPlan(
  widgets: readonly DashboardWidget[],
  dataDensity: DashboardLayoutDataDensity,
  heightOverrides: DashboardLayoutHeightOverrides,
): DashboardLayoutPlan | undefined {
  const compactPlan = createDesktopBentoPlanCandidate(
    widgets,
    dataDensity,
    heightOverrides,
    false,
  );
  const calendarWidget = widgets.find(
    (widget) => widget.type === "calendarHeatmap",
  );

  if (
    !compactPlan ||
    !calendarWidget ||
    getWidgetDataPointCount(calendarWidget, dataDensity) < 21
  ) {
    return compactPlan;
  }

  const featurePlan = createDesktopBentoPlanCandidate(
    widgets,
    dataDensity,
    heightOverrides,
    true,
  );

  if (!featurePlan) {
    return compactPlan;
  }

  return getDashboardUnusedCanvasRatio(featurePlan, "lg") <=
    dashboardLayoutConstraints.lg.maxUnusedCanvasRatio
    ? featurePlan
    : compactPlan;
}

function createMetricCalendarPlan(
  widgets: readonly DashboardWidget[],
  dataDensity: DashboardLayoutDataDensity,
  heightOverrides: DashboardLayoutHeightOverrides,
): DashboardLayoutPlan | undefined {
  const [metricWidget, calendarWidget] = widgets;

  if (
    widgets.length !== 2 ||
    metricWidget?.type !== "metric" ||
    calendarWidget?.type !== "calendarHeatmap"
  ) {
    return undefined;
  }

  const metricProfile = withHeightOverride(
    metricWidget,
    getDefaultProfile(metricWidget, dataDensity),
    heightOverrides,
  );
  const calendarProfile = withHeightOverride(
    calendarWidget,
    { h: 8, presentation: "feature", w: 8 },
    heightOverrides,
  );

  return new Map([
    [
      metricWidget.id,
      { ...metricProfile, id: metricWidget.id, w: 4, x: 0, y: 0 },
    ],
    [
      calendarWidget.id,
      { ...calendarProfile, id: calendarWidget.id, w: 8, x: 4, y: 0 },
    ],
  ]);
}

function createMetricRankingEvidencePlan(
  widgets: readonly DashboardWidget[],
  dataDensity: DashboardLayoutDataDensity,
  heightOverrides: DashboardLayoutHeightOverrides,
): DashboardLayoutPlan | undefined {
  if (widgets.length !== 4) {
    return undefined;
  }

  const metricWidget = widgets.find((widget) => widget.type === "metric");
  const barWidget = widgets.find((widget) => widget.type === "categoryBar");
  const rankingWidget = widgets.find(
    (widget) => widget.type === "rankingTable" || widget.type === "dataTable",
  );
  const insightWidget = widgets.find((widget) => widget.type === "insight");

  if (
    !metricWidget ||
    !barWidget ||
    !rankingWidget ||
    !insightWidget ||
    barWidget.config.queryId !== rankingWidget.config.queryId
  ) {
    return undefined;
  }

  const metricProfile = withHeightOverride(
    metricWidget,
    getDefaultProfile(metricWidget, dataDensity),
    heightOverrides,
  );
  const barProfile = withHeightOverride(
    barWidget,
    { h: 7, presentation: "feature", w: 8 },
    heightOverrides,
  );
  const rankingProfile = withHeightOverride(
    rankingWidget,
    { h: 7, presentation: "compact", w: 4 },
    heightOverrides,
  );
  const insightProfile = withHeightOverride(
    insightWidget,
    { h: 4, presentation: "standard", w: 8 },
    heightOverrides,
  );

  return new Map([
    [
      metricWidget.id,
      { ...metricProfile, id: metricWidget.id, w: 4, x: 0, y: 0 },
    ],
    [barWidget.id, { ...barProfile, id: barWidget.id, w: 8, x: 4, y: 0 }],
    [
      rankingWidget.id,
      { ...rankingProfile, id: rankingWidget.id, w: 4, x: 0, y: 4 },
    ],
    [
      insightWidget.id,
      { ...insightProfile, id: insightWidget.id, w: 8, x: 4, y: 7 },
    ],
  ]);
}

/**
 * Creates deterministic widget rectangles from validated widget semantics and
 * measured query-result density. It intentionally does not use LLM output or
 * rendered dimensions, so identical dashboards always receive the same layout.
 */
export function createDashboardLayoutPlan(
  widgets: readonly DashboardWidget[],
  breakpoint: DashboardLayoutBreakpoint,
  dataDensity: DashboardLayoutDataDensity = {},
  heightOverrides: DashboardLayoutHeightOverrides = {},
): DashboardLayoutPlan {
  if (breakpoint !== "lg") {
    return createSequentialLayoutPlan(
      widgets,
      breakpoint,
      dataDensity,
      heightOverrides,
    );
  }

  return (
    createMetricRankingEvidencePlan(widgets, dataDensity, heightOverrides) ??
    createMetricCalendarPlan(widgets, dataDensity, heightOverrides) ??
    createDesktopBentoPlan(widgets, dataDensity, heightOverrides) ??
    createSequentialLayoutPlan(
      widgets,
      breakpoint,
      dataDensity,
      heightOverrides,
    )
  );
}

export function getDashboardWidgetSpan(
  widget: DashboardWidget,
  widgets: readonly DashboardWidget[],
  breakpoint: DashboardLayoutBreakpoint,
): number {
  return createDashboardLayoutPlan(widgets, breakpoint).get(widget.id)?.w ?? 1;
}

export function getDashboardWidgetPresentation(
  widget: DashboardWidget,
  widgets: readonly DashboardWidget[],
  breakpoint: DashboardLayoutBreakpoint,
  dataDensity: DashboardLayoutDataDensity = {},
): DashboardWidgetPresentation {
  return (
    createDashboardLayoutPlan(widgets, breakpoint, dataDensity).get(widget.id)
      ?.presentation ?? "standard"
  );
}
