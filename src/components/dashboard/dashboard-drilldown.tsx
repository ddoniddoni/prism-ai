"use client";

import { ArrowUpRight, ChevronRight, Crosshair, X } from "lucide-react";

import type { Finding } from "@/lib/analytics/findings";
import { dimensionCatalog } from "@/lib/analytics/dimension-catalog";
import { metricCatalog } from "@/lib/analytics/metric-catalog";
import type { AnalyticsDataset } from "@/lib/analytics/query-engine";
import type { AnalyticsFilter } from "@/lib/analytics/query-schema";

import {
  createDashboardDrilldown,
  createDashboardDrilldownFilter,
  type DashboardDrilldownSelection,
} from "./dashboard-drilldown-data";
import { formatChangeWithDirection, formatMetricValue } from "./formatters";

type DashboardDrilldownProps = {
  dataset: AnalyticsDataset;
  disabled?: boolean;
  findings: readonly Finding[];
  onAnalyzeSelection?: (filter: AnalyticsFilter) => void;
  onDismiss: () => void;
  selection: DashboardDrilldownSelection;
};

function formatSelectionLabel(label: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);

  if (!match) {
    return label;
  }

  return `${Number(match[2])}월 ${Number(match[3])}일`;
}

function formatSharePercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DashboardDrilldown({
  dataset,
  disabled = false,
  findings,
  onAnalyzeSelection,
  onDismiss,
  selection,
}: DashboardDrilldownProps) {
  const drilldown = createDashboardDrilldown(dataset, selection.label);

  if (!drilldown) {
    return null;
  }

  const dimensionLabel = drilldown.dataset.groupBy
    ? dimensionCatalog[drilldown.dataset.groupBy].label
    : "선택값";
  const drilldownFilter = createDashboardDrilldownFilter(
    dataset,
    selection.label,
  );
  const isRelatedFinding = (finding: Finding) =>
    finding.evidenceQueryIds.includes(drilldown.dataset.queryId);
  const relatedFinding =
    findings.find(
      (finding) =>
        isRelatedFinding(finding) && finding.segment === drilldown.point.label,
    ) ?? findings.find((finding) => isRelatedFinding(finding));

  return (
    <aside
      aria-label={`${formatSelectionLabel(drilldown.point.label)} 상세 근거`}
      className="mt-3 overflow-hidden rounded-lg border border-[#c9cbff] bg-[linear-gradient(135deg,#f6f7ff_0%,#ffffff_58%)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dde0fb] px-3 py-2.5 sm:px-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#4f46e5] text-white shadow-[0_3px_8px_rgba(79,70,229,0.24)]">
            <Crosshair aria-hidden="true" className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.1em] text-[#4f46e5] uppercase">
              Selected evidence
            </p>
            <p className="truncate text-[12px] font-semibold text-[#272b35]">
              {formatSelectionLabel(drilldown.point.label)} · {dimensionLabel}
            </p>
          </div>
        </div>
        <button
          aria-label="선택 상세 닫기"
          className="grid size-7 shrink-0 place-items-center rounded-md text-[#777587] transition-colors hover:bg-white hover:text-[#343844] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="grid gap-px bg-[#dde0fb] sm:grid-cols-2 xl:grid-cols-4">
        <dl className="min-w-0 bg-white px-3 py-2.5">
          <dt className="text-[9px] font-semibold tracking-[0.09em] text-[#777587] uppercase">
            선택 {metricCatalog[drilldown.metric].label}
          </dt>
          <dd className="mt-1 truncate font-mono text-[15px] font-semibold tracking-[-0.035em] text-[#191c1e]">
            {formatMetricValue(drilldown.metric, drilldown.point.value)}
          </dd>
        </dl>
        <dl className="min-w-0 bg-white px-3 py-2.5">
          <dt className="text-[9px] font-semibold tracking-[0.09em] text-[#777587] uppercase">
            {drilldown.dataset.groupBy === "date"
              ? "일별 평균"
              : "비교 그룹 평균"}
          </dt>
          <dd className="mt-1 truncate font-mono text-[15px] font-semibold tracking-[-0.035em] text-[#191c1e]">
            {formatMetricValue(drilldown.metric, drilldown.averageValue)}
          </dd>
        </dl>
        <dl className="min-w-0 bg-white px-3 py-2.5">
          <dt className="text-[9px] font-semibold tracking-[0.09em] text-[#777587] uppercase">
            순위
          </dt>
          <dd className="mt-1 text-[15px] font-semibold tracking-[-0.025em] text-[#191c1e]">
            {drilldown.rank === null
              ? "—"
              : `${drilldown.rank}위 / ${drilldown.validPointCount}`}
          </dd>
        </dl>
        <dl className="min-w-0 bg-white px-3 py-2.5">
          <dt className="text-[9px] font-semibold tracking-[0.09em] text-[#777587] uppercase">
            {drilldown.comparison ? "비교 기간 변화" : "기간 내 비중"}
          </dt>
          <dd
            className={`mt-1 text-[15px] font-semibold tracking-[-0.025em] ${drilldown.comparison?.percentChange !== null && drilldown.comparison?.percentChange !== undefined && drilldown.comparison.percentChange < 0 ? "text-[#ba1a1a]" : "text-[#17835c]"}`}
          >
            {drilldown.comparison
              ? formatChangeWithDirection(drilldown.comparison.percentChange)
              : drilldown.sharePercent === null
                ? "—"
                : formatSharePercent(drilldown.sharePercent)}
          </dd>
        </dl>
      </div>

      <div className="flex flex-col gap-2.5 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:px-3.5">
        <p className="max-w-2xl text-[10px] leading-5 text-[#595e6b]">
          {relatedFinding
            ? relatedFinding.fallbackText
            : `${drilldown.dataset.dataRange.startDate}부터 ${drilldown.dataset.dataRange.endDate}까지의 검증된 ${dimensionLabel} 집계입니다.`}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {drilldownFilter && onAnalyzeSelection ? (
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-[#4f46e5] px-2.5 text-[10px] font-semibold text-white transition-colors hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-not-allowed disabled:bg-[#9296a0]"
              disabled={disabled}
              onClick={() => onAnalyzeSelection(drilldownFilter)}
              type="button"
            >
              {disabled ? "분석 준비 중" : `${dimensionLabel} 상세 분석`}
              {!disabled ? (
                <ArrowUpRight aria-hidden="true" className="size-3" />
              ) : null}
            </button>
          ) : null}
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#4f46e5]">
            Query ref {drilldown.dataset.queryId}
            <ChevronRight aria-hidden="true" className="size-3" />
          </span>
        </div>
      </div>
    </aside>
  );
}
