import { WidgetFrame } from "../dashboard-widget-frame";
import type { DashboardWidgetProps } from "./types";
import { localizeAnalyticsText } from "../formatters";

export function InsightWidget({
  widget,
  findingsById,
  cardClassName,
  controls,
  presentation,
}: DashboardWidgetProps) {
  if (widget.type !== "insight") {
    return null;
  }

  const finding = findingsById.get(widget.config.findingId);
  const toneClass: Record<typeof widget.config.tone, string> = {
    neutral: "border-[#c3c0ff] bg-[#eef2ff]",
    positive: "border-[#a8dcc5] bg-[#effaf5]",
    warning: "border-[#ebcf9d] bg-[#fff9ec]",
    critical: "border-[#f0b8b4] bg-[#fff4f2]",
  };

  return (
    <WidgetFrame
      className={cardClassName}
      controls={controls}
      presentation={presentation}
      widget={widget}
    >
      <div className={`rounded-lg border p-4 ${toneClass[widget.config.tone]}`}>
        <p className="text-[13px] leading-6 text-[#191c1e]">
          {finding
            ? localizeAnalyticsText(finding.fallbackText)
            : "검증된 분석 근거를 찾지 못했습니다."}
        </p>
        <p className="mt-3 text-[9px] tracking-[0.09em] text-[#777587] uppercase">
          검증 근거 · {finding?.evidenceQueryIds.length ?? 0}개 데이터
        </p>
      </div>
    </WidgetFrame>
  );
}
