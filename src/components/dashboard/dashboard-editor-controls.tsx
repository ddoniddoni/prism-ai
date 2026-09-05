"use client";

import { getKoreanDisplayTitle } from "./formatters";
import { getDashboardWidgetDisplayCopy } from "./dashboard-widget-frame";

import { NativeSelect } from "@/components/ui/native-select";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  GripVertical,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
} from "lucide-react";
import type {
  DashboardSpec,
  DashboardWidget,
} from "@/lib/ai/schemas/dashboard-spec";
import {
  getCompatibleWidgetTypes,
  type EditableWidgetType,
} from "@/stores/dashboard-editor-model";
import { useDashboardEditorStore } from "@/stores/dashboard-editor-store";

const widgetTypeLabels: Record<EditableWidgetType, string> = {
  categoryBar: "막대 차트",
  donut: "도넛 차트",
  rankingTable: "순위 표",
  dataTable: "데이터 표",
};

function isEditableWidgetType(value: string): value is EditableWidgetType {
  return Object.prototype.hasOwnProperty.call(widgetTypeLabels, value);
}

export function WidgetEditorControls({
  dashboardId,
  onAction,
  widget,
}: {
  dashboardId: string;
  onAction: (message: string) => void;
  widget: DashboardWidget;
}) {
  const title = getKoreanDisplayTitle(
    widget.title,
    getDashboardWidgetDisplayCopy(widget).label,
  );
  const compatibleTypes = getCompatibleWidgetTypes(widget);

  function move(direction: "backward" | "forward") {
    useDashboardEditorStore
      .getState()
      .moveWidget(dashboardId, widget.id, direction);
    onAction(
      `${title}을 ${direction === "backward" ? "앞" : "뒤"} 순서로 이동했습니다.`,
    );
  }

  function changeType(value: string) {
    if (!isEditableWidgetType(value)) {
      return;
    }

    useDashboardEditorStore
      .getState()
      .setWidgetType(dashboardId, widget.id, value);
    onAction(`${title} 표시 형식을 ${widgetTypeLabels[value]}로 바꿨습니다.`);
  }

  return (
    <div
      aria-label={`${title} 편집 도구`}
      aria-describedby={`${widget.id}-editor-instructions`}
      className="flex flex-wrap items-center justify-end gap-1"
      role="group"
    >
      {compatibleTypes.length > 0 ? (
        <label className="inline-flex min-w-0">
          <span className="sr-only">{title} 표시 형식</span>
          <NativeSelect
            name={`${widget.id}-display-type`}
            aria-label={`${title} 표시 형식`}
            className="text-[12px]"
            onChange={(event) => changeType(event.target.value)}
            value={widget.type}
          >
            {compatibleTypes.map((type) => (
              <option key={type} value={type}>
                {widgetTypeLabels[type]}
              </option>
            ))}
          </NativeSelect>
        </label>
      ) : null}
      <button
        aria-label={`${title}을 앞 순서로 이동`}
        className="dashboard-control-button"
        onClick={() => move("backward")}
        title="앞 순서로 이동"
        type="button"
      >
        <ArrowUp aria-hidden="true" className="size-3.5" />
      </button>
      <button
        aria-label={`${title}을 뒤 순서로 이동`}
        className="dashboard-control-button"
        onClick={() => move("forward")}
        title="뒤 순서로 이동"
        type="button"
      >
        <ArrowDown aria-hidden="true" className="size-3.5" />
      </button>
      <button
        aria-label={`${title} 삭제`}
        className="dashboard-control-button text-[#93000a]"
        onClick={() => {
          useDashboardEditorStore.getState().hideWidget(dashboardId, widget.id);
          onAction(`${title}을 삭제했습니다. 실행 취소로 복원할 수 있습니다.`);
        }}
        title="위젯 삭제"
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
      </button>
      <span
        aria-hidden="true"
        className="dashboard-control-button dashboard-drag-handle cursor-grab active:cursor-grabbing"
        title="드래그하여 이동"
      >
        <GripVertical aria-hidden="true" className="size-3.5" />
      </span>
      <p className="sr-only" id={`${widget.id}-editor-instructions`}>
        위젯은 드래그하거나 앞뒤 이동 버튼으로 순서를 바꿀 수 있습니다.
      </p>
    </div>
  );
}

export function EditorToolbar({
  dashboard,
  isEditing,
  onAction,
  onEditingChange,
}: {
  dashboard: DashboardSpec;
  isEditing: boolean;
  onAction: (message: string) => void;
  onEditingChange: (isEditing: boolean) => void;
}) {
  const document = useDashboardEditorStore(
    (state) => state.documents[dashboard.id],
  );

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#dde2e8] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.1em] text-[#4f46e5] uppercase">
          레이아웃 편집
        </p>
        <p className="mt-1 text-[12px] text-[#595e6b]">
          {isEditing
            ? "위젯을 이동하거나 크기와 표시 형식을 바꿀 수 있습니다."
            : "이 브라우저에 저장된 나만의 대시보드입니다."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <button
              aria-label="대시보드 편집 실행 취소"
              className="dashboard-toolbar-button"
              disabled={!document || document.past.length === 0}
              onClick={() => {
                useDashboardEditorStore.getState().undo(dashboard.id);
                onAction("마지막 대시보드 편집을 실행 취소했습니다.");
              }}
              type="button"
            >
              <Undo2 aria-hidden="true" className="size-3.5" />
              실행 취소
            </button>
            <button
              aria-label="대시보드 편집 다시 실행"
              className="dashboard-toolbar-button"
              disabled={!document || document.future.length === 0}
              onClick={() => {
                useDashboardEditorStore.getState().redo(dashboard.id);
                onAction("마지막 대시보드 편집을 다시 실행했습니다.");
              }}
              type="button"
            >
              <Redo2 aria-hidden="true" className="size-3.5" />
              다시 실행
            </button>
            <button
              className="dashboard-toolbar-button"
              onClick={() => {
                useDashboardEditorStore
                  .getState()
                  .resetDashboard(dashboard.id, dashboard.widgets);
                onAction("대시보드 레이아웃을 기본값으로 초기화했습니다.");
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              초기화
            </button>
          </>
        ) : null}
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4f46e5] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
          onClick={() => {
            onEditingChange(!isEditing);
            onAction(
              isEditing
                ? "대시보드 편집을 마쳤습니다."
                : "대시보드 편집을 시작했습니다.",
            );
          }}
          type="button"
        >
          {isEditing ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Edit3 aria-hidden="true" className="size-4" />
          )}
          {isEditing ? "편집 완료" : "대시보드 편집"}
        </button>
      </div>
    </div>
  );
}
