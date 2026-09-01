"use client";

import type { Layout } from "react-grid-layout";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";

import {
  commitDashboardEditorSnapshot,
  createDashboardEditorSnapshot,
  editorGridColumns,
  persistedDashboardEditorStateSchema,
  reconcileDashboardEditorDocument,
  redoDashboardEditorDocument,
  undoDashboardEditorDocument,
  type DashboardEditorDocument,
  type EditorBreakpoint,
  type EditorLayoutItem,
  type EditableWidgetType,
} from "./dashboard-editor-model";

const DASHBOARD_EDITOR_STORAGE_KEY = "prism-ai:dashboard-editor:v1";
const MAX_PERSISTED_DASHBOARDS = 20;

type MoveDirection = "backward" | "forward";

type DashboardEditorState = {
  documents: Record<string, DashboardEditorDocument>;
  hasHydrated: boolean;
  initializeDashboard: (
    dashboardId: string,
    widgets: readonly DashboardWidget[],
  ) => void;
  commitLayout: (
    dashboardId: string,
    breakpoint: EditorBreakpoint,
    layout: Layout,
  ) => void;
  ensureWidgetHeight: (
    dashboardId: string,
    breakpoint: EditorBreakpoint,
    widgetId: string,
    height: number,
  ) => void;
  hideWidget: (dashboardId: string, widgetId: string) => void;
  moveWidget: (
    dashboardId: string,
    widgetId: string,
    direction: MoveDirection,
  ) => void;
  setWidgetType: (
    dashboardId: string,
    widgetId: string,
    type: EditableWidgetType,
  ) => void;
  undo: (dashboardId: string) => void;
  redo: (dashboardId: string) => void;
  resetDashboard: (
    dashboardId: string,
    widgets: readonly DashboardWidget[],
  ) => void;
  setHydrated: (hasHydrated: boolean) => void;
};

function replaceDocument(
  documents: Record<string, DashboardEditorDocument>,
  dashboardId: string,
  document: DashboardEditorDocument,
): Record<string, DashboardEditorDocument> {
  const retainedDocuments = Object.fromEntries(
    Object.entries(documents).filter(([id]) => id !== dashboardId),
  );
  const nextDocuments = { ...retainedDocuments, [dashboardId]: document };
  const dashboardIds = Object.keys(nextDocuments);

  if (dashboardIds.length <= MAX_PERSISTED_DASHBOARDS) {
    return nextDocuments;
  }

  const oldestDashboardId = dashboardIds.find((id) => id !== dashboardId);

  if (!oldestDashboardId) {
    return nextDocuments;
  }

  return Object.fromEntries(
    Object.entries(nextDocuments).filter(([id]) => id !== oldestDashboardId),
  );
}

function mergeLayoutChange(
  currentLayout: readonly EditorLayoutItem[],
  changedLayout: Layout,
): EditorLayoutItem[] {
  const changedById = new Map(changedLayout.map((item) => [item.i, item]));

  return currentLayout.map((currentItem) => {
    const changedItem = changedById.get(currentItem.i);

    if (!changedItem) {
      return currentItem;
    }

    return {
      ...currentItem,
      x: Math.max(0, Math.round(changedItem.x)),
      y: Math.max(0, Math.round(changedItem.y)),
      w: Math.max(currentItem.minW, Math.round(changedItem.w)),
      h: Math.max(currentItem.minH, Math.round(changedItem.h)),
    };
  });
}

function moveLayoutItem(
  layout: readonly EditorLayoutItem[],
  widgetId: string,
  direction: MoveDirection,
  columns: number,
  hiddenWidgetIds: readonly string[],
): EditorLayoutItem[] {
  const hiddenIds = new Set(hiddenWidgetIds);
  const ordered = [...layout]
    .filter((item) => !hiddenIds.has(item.i))
    .sort((left, right) =>
      left.y === right.y ? left.x - right.x : left.y - right.y,
    );
  const currentIndex = ordered.findIndex((item) => item.i === widgetId);
  const targetIndex =
    direction === "backward" ? currentIndex - 1 : currentIndex + 1;
  const current = ordered[currentIndex];
  const target = ordered[targetIndex];

  if (!current || !target) {
    return [...layout];
  }

  return layout.map((item) => {
    if (item.i === current.i) {
      return {
        ...item,
        x: Math.min(target.x, Math.max(0, columns - item.w)),
        y: target.y,
      };
    }

    if (item.i === target.i) {
      return {
        ...item,
        x: Math.min(current.x, Math.max(0, columns - item.w)),
        y: current.y,
      };
    }

    return item;
  });
}

export const useDashboardEditorStore = create<DashboardEditorState>()(
  persist(
    (set) => ({
      documents: {},
      hasHydrated: false,
      initializeDashboard: (dashboardId, widgets) =>
        set((state) => {
          const document = reconcileDashboardEditorDocument(
            state.documents[dashboardId],
            widgets,
          );

          return {
            documents: replaceDocument(state.documents, dashboardId, document),
          };
        }),
      commitLayout: (dashboardId, breakpoint, layout) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (!document) {
            return state;
          }

          const nextSnapshot = {
            ...document.present,
            layoutMode: "custom" as const,
            layouts: {
              ...document.present.layouts,
              [breakpoint]: mergeLayoutChange(
                document.present.layouts[breakpoint],
                layout,
              ),
            },
          };

          return {
            documents: replaceDocument(
              state.documents,
              dashboardId,
              commitDashboardEditorSnapshot(document, nextSnapshot),
            ),
          };
        }),
      ensureWidgetHeight: (dashboardId, breakpoint, widgetId, height) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (!document) {
            return state;
          }

          const currentLayout = document.present.layouts[breakpoint];
          const nextLayout = currentLayout.map((item) => {
            if (item.i !== widgetId) {
              return item;
            }

            const measuredHeight = Math.min(
              item.maxH,
              Math.max(item.minH, Math.round(height)),
            );
            const nextHeight =
              document.present.layoutMode === "auto"
                ? measuredHeight
                : Math.max(item.h, measuredHeight);

            return nextHeight === item.h ? item : { ...item, h: nextHeight };
          });

          if (
            nextLayout.every((item, index) => item === currentLayout[index])
          ) {
            return state;
          }

          return {
            documents: replaceDocument(state.documents, dashboardId, {
              ...document,
              present: {
                ...document.present,
                layouts: {
                  ...document.present.layouts,
                  [breakpoint]: nextLayout,
                },
              },
            }),
          };
        }),
      hideWidget: (dashboardId, widgetId) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (
            !document ||
            document.present.hiddenWidgetIds.includes(widgetId)
          ) {
            return state;
          }

          const nextSnapshot = {
            ...document.present,
            hiddenWidgetIds: [...document.present.hiddenWidgetIds, widgetId],
            layoutMode: "custom" as const,
          };

          return {
            documents: replaceDocument(
              state.documents,
              dashboardId,
              commitDashboardEditorSnapshot(document, nextSnapshot),
            ),
          };
        }),
      moveWidget: (dashboardId, widgetId, direction) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (!document) {
            return state;
          }

          const layouts = {
            lg: moveLayoutItem(
              document.present.layouts.lg,
              widgetId,
              direction,
              editorGridColumns.lg,
              document.present.hiddenWidgetIds,
            ),
            md: moveLayoutItem(
              document.present.layouts.md,
              widgetId,
              direction,
              editorGridColumns.md,
              document.present.hiddenWidgetIds,
            ),
            sm: moveLayoutItem(
              document.present.layouts.sm,
              widgetId,
              direction,
              editorGridColumns.sm,
              document.present.hiddenWidgetIds,
            ),
          };
          const nextSnapshot = {
            ...document.present,
            layoutMode: "custom" as const,
            layouts,
          };

          return {
            documents: replaceDocument(
              state.documents,
              dashboardId,
              commitDashboardEditorSnapshot(document, nextSnapshot),
            ),
          };
        }),
      setWidgetType: (dashboardId, widgetId, type) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (!document) {
            return state;
          }

          const nextSnapshot = {
            ...document.present,
            layoutMode: "custom" as const,
            typeOverrides: {
              ...document.present.typeOverrides,
              [widgetId]: type,
            },
          };

          return {
            documents: replaceDocument(
              state.documents,
              dashboardId,
              commitDashboardEditorSnapshot(document, nextSnapshot),
            ),
          };
        }),
      undo: (dashboardId) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (!document) {
            return state;
          }

          return {
            documents: replaceDocument(
              state.documents,
              dashboardId,
              undoDashboardEditorDocument(document),
            ),
          };
        }),
      redo: (dashboardId) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (!document) {
            return state;
          }

          return {
            documents: replaceDocument(
              state.documents,
              dashboardId,
              redoDashboardEditorDocument(document),
            ),
          };
        }),
      resetDashboard: (dashboardId, widgets) =>
        set((state) => {
          const document = state.documents[dashboardId];

          if (!document) {
            return state;
          }

          return {
            documents: replaceDocument(
              state.documents,
              dashboardId,
              commitDashboardEditorSnapshot(
                document,
                createDashboardEditorSnapshot(widgets),
              ),
            ),
          };
        }),
      setHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: DASHBOARD_EDITOR_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => window.localStorage),
      skipHydration: true,
      partialize: (state) => ({
        ...state,
        hasHydrated: false,
        documents: Object.fromEntries(
          Object.entries(state.documents).map(([dashboardId, document]) => [
            dashboardId,
            { ...document, past: [], future: [] },
          ]),
        ),
      }),
      merge: (persistedState, currentState) => {
        const result =
          persistedDashboardEditorStateSchema.safeParse(persistedState);

        if (!result.success) {
          return currentState;
        }

        return {
          ...currentState,
          documents: result.data.documents,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
