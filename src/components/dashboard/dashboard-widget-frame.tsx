import type { ReactNode } from "react";
import { dimensionCatalog } from "@/lib/analytics/dimension-catalog";
import { metricCatalog } from "@/lib/analytics/metric-catalog";
import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { DashboardWidget } from "@/lib/ai/schemas/dashboard-spec";
import type { DashboardWidgetPresentation } from "@/stores/dashboard-layout";

type DashboardWidgetDisplayCopy = {
  description: string;
  label: string;
  title: string;
};

export function getDashboardWidgetDisplayCopy(
  widget: DashboardWidget,
  dataset?: AnalyticsDataset,
): DashboardWidgetDisplayCopy {
  const metric =
    metricCatalog[
      dataset?.metric ??
        (widget.type === "metric" ? widget.config.metric : "revenue")
    ].label;
  const dimension = dataset?.groupBy
    ? dimensionCatalog[dataset.groupBy].label
    : "항목";

  switch (widget.type) {
    case "metric":
      return {
        description: `선택 기간의 ${metric} 집계 결과`,
        label: "핵심 지표",
        title: `핵심 ${metric}`,
      };
    case "timeSeries":
      return {
        description: `기간별 ${metric} 변화를 확인합니다.`,
        label: "기간 추이",
        title: `기간별 ${metric} 추이`,
      };
    case "categoryBar":
      return {
        description: `${dimension} 기준으로 정렬한 ${metric}입니다.`,
        label: "비교 차트",
        title: `${dimension}별 ${metric}`,
      };
    case "stackedBar":
      return {
        description: `기간별 ${metric} 구성을 비교합니다.`,
        label: "구성 추이",
        title: `기간별 ${metric} 구성`,
      };
    case "calendarHeatmap":
      return {
        description: `일자별 ${metric} 집중도를 확인합니다.`,
        label: "일별 집중도",
        title: `일자별 ${metric} 집중도`,
      };
    case "donut":
      return {
        description: `${dimension}별 ${metric} 비중입니다.`,
        label: "구성비",
        title: `${dimension}별 ${metric} 구성`,
      };
    case "rankingTable":
      return {
        description: `검증 데이터 기준 ${dimension}별 순위입니다.`,
        label: "순위표",
        title: `${dimension} 순위`,
      };
    case "dataTable":
      return {
        description: `검증된 ${dimension}별 ${metric} 원본 값입니다.`,
        label: "데이터 표",
        title: `${dimension}별 ${metric} 데이터`,
      };
    case "insight":
      return {
        description: "계산된 결과와 검증 근거를 요약합니다.",
        label: "분석 인사이트",
        title: "핵심 분석",
      };
  }
}

export function WidgetFrame({
  children,
  className,
  controls,
  dataset,
  descriptionClassName,
  density = "default",
  presentation = "standard",
  widget,
}: {
  children: ReactNode;
  className?: string;
  controls?: ReactNode;
  dataset?: AnalyticsDataset;
  descriptionClassName?: string;
  density?: "compact" | "default" | "feature";
  presentation?: DashboardWidgetPresentation;
  widget: DashboardWidget;
}) {
  const displayCopy = getDashboardWidgetDisplayCopy(widget, dataset);
  const resolvedDensity =
    density === "compact" || presentation === "compact"
      ? "compact"
      : density === "feature" || presentation === "feature"
        ? "feature"
        : "default";

  return (
    <section
      aria-labelledby={`${widget.id}-title`}
      className={`w-full self-start rounded-xl border border-[#e1e2e4] bg-white ${resolvedDensity === "compact" ? "p-3" : resolvedDensity === "feature" ? "p-4 sm:p-5" : "p-4"} ${className ?? ""}`}
      id={widget.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold tracking-[0.11em] text-[#777587] uppercase">
            {displayCopy.label}
          </p>
          <h2
            className="mt-1 text-[15px] font-semibold tracking-[-0.02em] break-words text-[#191c1e]"
            id={`${widget.id}-title`}
          >
            {displayCopy.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#dde2e8] bg-[#f8f9fb] px-1.5 py-0.5 text-[9px] text-[#777587]">
            {widget.queryIds.length}개 데이터 근거
          </span>
          {controls}
        </div>
      </div>
      {displayCopy.description ? (
        <p
          className={`mt-1.5 text-[12px] leading-5 break-words text-[#595e6b] ${descriptionClassName ?? ""}`}
        >
          {displayCopy.description}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
