import { z } from "zod";

import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

export const editorBreakpoints = ["lg", "md", "sm"] as const;
export const editableWidgetTypes = [
  "categoryBar",
  "donut",
  "rankingTable",
  "dataTable",
] as const;

export type EditorBreakpoint = (typeof editorBreakpoints)[number];
export type EditableWidgetType = (typeof editableWidgetTypes)[number];

const MAX_HISTORY_LENGTH = 30;
const MAX_PERSISTED_DASHBOARDS = 20;

export const editorGridColumns: Record<EditorBreakpoint, number> = {
  lg: 12,
  md: 6,
  sm: 1,
};

const editorLayoutItemSchema = z
  .object({
    i: z.string().trim().min(1).max(100),
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
    minW: z.number().int().positive(),
    minH: z.number().int().positive(),
    maxW: z.number().int().positive(),
    maxH: z.number().int().positive(),
  })
  .strict();

const editorLayoutsSchema = z.object({
  lg: z.array(editorLayoutItemSchema).max(8),
  md: z.array(editorLayoutItemSchema).max(8),
  sm: z.array(editorLayoutItemSchema).max(8),
});

export const dashboardEditorSnapshotSchema = z
  .object({
    layouts: editorLayoutsSchema,
    hiddenWidgetIds: z.array(z.string().trim().min(1).max(100)).max(8),
    typeOverrides: z.record(
      z.string().trim().min(1).max(100),
      z.enum(editableWidgetTypes),
    ),
  })
  .strict();

const dashboardEditorDocumentSchema = z
  .object({
    baseWidgetIds: z.array(z.string().trim().min(1).max(100)).max(8),
    present: dashboardEditorSnapshotSchema,
    past: z.array(dashboardEditorSnapshotSchema).max(30),
    future: z.array(dashboardEditorSnapshotSchema).max(30),
  })
  .strict();

export const persistedDashboardEditorStateSchema = z
  .object({
    documents: z.record(
      z.string().trim().min(1).max(120),
      dashboardEditorDocumentSchema,
    ),
    hasHydrated: z.boolean().optional(),
  })
  .strict()
  .refine(
    (state) => Object.keys(state.documents).length <= MAX_PERSISTED_DASHBOARDS,
    { message: "Too many persisted dashboard editor documents" },
  );

export type EditorLayoutItem = z.infer<typeof editorLayoutItemSchema>;
export type EditorLayouts = z.infer<typeof editorLayoutsSchema>;
export type DashboardEditorSnapshot = z.infer<
  typeof dashboardEditorSnapshotSchema
>;
export type DashboardEditorDocument = z.infer<
  typeof dashboardEditorDocumentSchema
>;

function getWidgetHeight(widget: DashboardWidget): number {
  const heights: Record<DashboardWidget["type"], number> = {
    metric: 4,
    timeSeries: 9,
    categoryBar: 8,
    donut: 8,
    rankingTable: 8,
    dataTable: 8,
    insight: 6,
  };

  return heights[widget.type];
}

function getWidgetWidth(
  widget: DashboardWidget,
  breakpoint: EditorBreakpoint,
): number {
  if (breakpoint === "sm") {
    return 1;
  }

  const desktopWidths: Record<DashboardWidget["size"], number> = {
    small: 3,
    medium: 6,
    large: 8,
    full: 12,
  };
  const width = desktopWidths[widget.size];

  return Math.min(width, editorGridColumns[breakpoint]);
}

function getMinimumWidgetWidth(
  widget: DashboardWidget,
  breakpoint: EditorBreakpoint,
): number {
  if (breakpoint === "sm") {
    return 1;
  }

  const minimumWidths: Record<DashboardWidget["type"], number> = {
    metric: 3,
    timeSeries: 6,
    categoryBar: 4,
    donut: 4,
    rankingTable: 4,
    dataTable: 4,
    insight: 4,
  };

  return Math.min(minimumWidths[widget.type], editorGridColumns[breakpoint]);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createLayoutItem(
  widget: DashboardWidget,
  breakpoint: EditorBreakpoint,
  x: number,
  y: number,
): EditorLayoutItem {
  const columns = editorGridColumns[breakpoint];
  const width = getWidgetWidth(widget, breakpoint);
  const height = getWidgetHeight(widget);

  return {
    i: widget.id,
    x,
    y,
    w: width,
    h: height,
    minW: getMinimumWidgetWidth(widget, breakpoint),
    minH: Math.max(3, height - 2),
    maxW: columns,
    maxH: 16,
  };
}

function createBreakpointLayout(
  widgets: readonly DashboardWidget[],
  breakpoint: EditorBreakpoint,
): EditorLayoutItem[] {
  const columns = editorGridColumns[breakpoint];
  const layout: EditorLayoutItem[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let currentRowHeight = 0;

  for (const widget of widgets) {
    const width = getWidgetWidth(widget, breakpoint);
    const height = getWidgetHeight(widget);

    if (cursorX + width > columns) {
      cursorY += currentRowHeight;
      cursorX = 0;
      currentRowHeight = 0;
    }

    layout.push(createLayoutItem(widget, breakpoint, cursorX, cursorY));
    cursorX += width;
    currentRowHeight = Math.max(currentRowHeight, height);

    if (cursorX >= columns) {
      cursorY += currentRowHeight;
      cursorX = 0;
      currentRowHeight = 0;
    }
  }

  return layout;
}

export function createDashboardEditorSnapshot(
  widgets: readonly DashboardWidget[],
): DashboardEditorSnapshot {
  return dashboardEditorSnapshotSchema.parse({
    layouts: {
      lg: createBreakpointLayout(widgets, "lg"),
      md: createBreakpointLayout(widgets, "md"),
      sm: createBreakpointLayout(widgets, "sm"),
    },
    hiddenWidgetIds: [],
    typeOverrides: {},
  });
}

export function createDashboardEditorDocument(
  widgets: readonly DashboardWidget[],
): DashboardEditorDocument {
  return {
    baseWidgetIds: widgets.map((widget) => widget.id),
    present: createDashboardEditorSnapshot(widgets),
    past: [],
    future: [],
  };
}

export function getCompatibleWidgetTypes(
  widget: DashboardWidget,
): readonly EditableWidgetType[] {
  if (widget.type === "categoryBar" || widget.type === "donut") {
    return ["categoryBar", "donut"];
  }

  if (widget.type === "rankingTable" || widget.type === "dataTable") {
    return ["rankingTable", "dataTable"];
  }

  return [];
}

function isCompatibleWidgetType(
  widget: DashboardWidget,
  type: EditableWidgetType,
): boolean {
  return getCompatibleWidgetTypes(widget).includes(type);
}

export function applyWidgetTypeOverride(
  widget: DashboardWidget,
  override: EditableWidgetType | undefined,
): DashboardWidget {
  if (!override || !isCompatibleWidgetType(widget, override)) {
    return widget;
  }

  if (widget.type === override) {
    return widget;
  }

  if (widget.type === "categoryBar" || widget.type === "donut") {
    const common = {
      id: widget.id,
      title: widget.title,
      ...(widget.description ? { description: widget.description } : {}),
      queryIds: widget.queryIds,
      findingIds: widget.findingIds,
      size: widget.size,
    };

    return override === "donut"
      ? {
          ...common,
          type: "donut",
          config: { queryId: widget.config.queryId },
        }
      : {
          ...common,
          type: "categoryBar",
          config: { queryId: widget.config.queryId, orientation: "horizontal" },
        };
  }

  if (widget.type === "rankingTable" || widget.type === "dataTable") {
    const common = {
      id: widget.id,
      title: widget.title,
      ...(widget.description ? { description: widget.description } : {}),
      queryIds: widget.queryIds,
      findingIds: widget.findingIds,
      size: widget.size,
      config: { queryId: widget.config.queryId },
    };

    return override === "dataTable"
      ? { ...common, type: "dataTable" }
      : { ...common, type: "rankingTable" };
  }

  return widget;
}

function normalizeExistingLayoutItem(
  item: EditorLayoutItem,
  widget: DashboardWidget,
  breakpoint: EditorBreakpoint,
): EditorLayoutItem {
  const columns = editorGridColumns[breakpoint];
  const minimumWidth = getMinimumWidgetWidth(widget, breakpoint);
  const minimumHeight = Math.max(3, getWidgetHeight(widget) - 2);
  const width = clamp(item.w, minimumWidth, columns);
  const height = clamp(item.h, minimumHeight, 16);

  return {
    i: widget.id,
    x: clamp(item.x, 0, Math.max(0, columns - width)),
    y: Math.max(0, item.y),
    w: width,
    h: height,
    minW: minimumWidth,
    minH: minimumHeight,
    maxW: columns,
    maxH: 16,
  };
}

function reconcileBreakpointLayout(
  layout: readonly EditorLayoutItem[],
  widgets: readonly DashboardWidget[],
  breakpoint: EditorBreakpoint,
): EditorLayoutItem[] {
  const widgetsById = new Map(widgets.map((widget) => [widget.id, widget]));
  const reconciled: EditorLayoutItem[] = [];

  for (const item of layout) {
    const widget = widgetsById.get(item.i);

    if (widget) {
      reconciled.push(normalizeExistingLayoutItem(item, widget, breakpoint));
    }
  }

  const existingIds = new Set(reconciled.map((item) => item.i));
  let nextY = reconciled.reduce(
    (maximum, item) => Math.max(maximum, item.y + item.h),
    0,
  );

  for (const widget of widgets) {
    if (existingIds.has(widget.id)) {
      continue;
    }

    const item = createLayoutItem(widget, breakpoint, 0, nextY);
    reconciled.push(item);
    nextY += item.h;
  }

  return reconciled;
}

export function reconcileDashboardEditorSnapshot(
  snapshot: DashboardEditorSnapshot | undefined,
  widgets: readonly DashboardWidget[],
): DashboardEditorSnapshot {
  if (!snapshot) {
    return createDashboardEditorSnapshot(widgets);
  }

  const widgetIds = new Set(widgets.map((widget) => widget.id));
  const widgetsById = new Map(widgets.map((widget) => [widget.id, widget]));
  const typeOverrides: Record<string, EditableWidgetType> = {};

  for (const [widgetId, type] of Object.entries(snapshot.typeOverrides)) {
    const widget = widgetsById.get(widgetId);

    if (widget && isCompatibleWidgetType(widget, type)) {
      typeOverrides[widgetId] = type;
    }
  }

  return dashboardEditorSnapshotSchema.parse({
    layouts: {
      lg: reconcileBreakpointLayout(snapshot.layouts.lg, widgets, "lg"),
      md: reconcileBreakpointLayout(snapshot.layouts.md, widgets, "md"),
      sm: reconcileBreakpointLayout(snapshot.layouts.sm, widgets, "sm"),
    },
    hiddenWidgetIds: snapshot.hiddenWidgetIds.filter((id) => widgetIds.has(id)),
    typeOverrides,
  });
}

export function reconcileDashboardEditorDocument(
  document: DashboardEditorDocument | undefined,
  widgets: readonly DashboardWidget[],
): DashboardEditorDocument {
  if (!document) {
    return createDashboardEditorDocument(widgets);
  }

  return {
    baseWidgetIds: widgets.map((widget) => widget.id),
    present: reconcileDashboardEditorSnapshot(document.present, widgets),
    past: document.past.map((snapshot) =>
      reconcileDashboardEditorSnapshot(snapshot, widgets),
    ),
    future: document.future.map((snapshot) =>
      reconcileDashboardEditorSnapshot(snapshot, widgets),
    ),
  };
}

function snapshotsEqual(
  left: DashboardEditorSnapshot,
  right: DashboardEditorSnapshot,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function commitDashboardEditorSnapshot(
  document: DashboardEditorDocument,
  snapshot: DashboardEditorSnapshot,
): DashboardEditorDocument {
  const validatedSnapshot = dashboardEditorSnapshotSchema.parse(snapshot);

  if (snapshotsEqual(document.present, validatedSnapshot)) {
    return document;
  }

  return {
    ...document,
    present: validatedSnapshot,
    past: [...document.past, document.present].slice(-MAX_HISTORY_LENGTH),
    future: [],
  };
}

export function undoDashboardEditorDocument(
  document: DashboardEditorDocument,
): DashboardEditorDocument {
  const previous = document.past.at(-1);

  if (!previous) {
    return document;
  }

  return {
    ...document,
    present: previous,
    past: document.past.slice(0, -1),
    future: [document.present, ...document.future].slice(0, MAX_HISTORY_LENGTH),
  };
}

export function redoDashboardEditorDocument(
  document: DashboardEditorDocument,
): DashboardEditorDocument {
  const [next, ...remainingFuture] = document.future;

  if (!next) {
    return document;
  }

  return {
    ...document,
    present: next,
    past: [...document.past, document.present].slice(-MAX_HISTORY_LENGTH),
    future: remainingFuture,
  };
}
