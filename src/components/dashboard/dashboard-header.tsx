"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { DashboardPeriodControl } from "./dashboard-period-control";

import { SlidersHorizontal, X } from "lucide-react";
import { metricCatalog } from "@/lib/analytics/metric-catalog";
import {
  compareModes,
  type AnalyticsFilter,
  type AnalyticsPeriod,
  type CompareMode,
} from "@/lib/analytics/query-schema";
import type { DashboardSpec } from "@/lib/ai/schemas/dashboard-spec";
import {
  formatDimensionValue,
  getComparisonLabel,
  getPeriodLabel,
} from "./formatters";
import {
  getDashboardContextFilterLabel,
  removeDashboardContextFilter,
} from "./dashboard-context-controls-data";

function getDashboardHeaderCopy(dashboard: DashboardSpec): {
  subtitle: string;
  summary: string;
  title: string;
} {
  const primaryMetric = metricCatalog[dashboard.context.primaryMetric].label;
  const [singleFilter] = dashboard.context.filters;
  const scope =
    dashboard.context.filters.length === 1 && singleFilter?.values.length === 1
      ? formatDimensionValue(singleFilter.dimension, singleFilter.values[0])
      : undefined;
  const period = getPeriodLabel(dashboard.context.period);

  return {
    subtitle: scope
      ? `${period} ${scope} 범위의 검증 데이터를 기준으로 분석했습니다.`
      : `${period} ${dashboard.context.filters.length > 0 ? "선택한 조건의" : "전체"} 데이터를 기준으로 분석했습니다.`,
    summary: "표시된 수치는 결정론적 분석 엔진이 계산한 결과입니다.",
    title: `${scope ? `${scope} ` : ""}${primaryMetric} 분석 결과`,
  };
}

export function DashboardHeader({
  dashboard,
  comparisonControlsDisabled = false,
  filterControlsDisabled = false,
  onComparisonChange,
  onFiltersChange,
  onPeriodChange,
}: {
  dashboard: DashboardSpec;
  comparisonControlsDisabled?: boolean;
  filterControlsDisabled?: boolean;
  onComparisonChange?: (compareWith: CompareMode) => void;
  onFiltersChange?: (filters: readonly AnalyticsFilter[]) => void;
  onPeriodChange?: (period: AnalyticsPeriod) => void;
}) {
  const canChangeComparison = Boolean(onComparisonChange);
  const canChangeFilters = Boolean(onFiltersChange);
  const headerCopy = getDashboardHeaderCopy(dashboard);

  return (
    <div className="py-2 sm:py-3">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-[#4f46e5] uppercase">
        검증된 데이터 기반
      </p>
      <h1
        className="mt-2 max-w-4xl text-[28px] leading-tight font-semibold tracking-[-0.04em] text-[#191c1e] sm:text-[34px]"
        id="analysis-dashboard-title"
      >
        {headerCopy.title}
      </h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#595e6b]">
        {headerCopy.subtitle}
      </p>
      <div className="mt-4 rounded-lg border border-[#dde2e8] bg-[#f8f9fb] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.1em] text-[#595e6b] uppercase">
            <SlidersHorizontal aria-hidden="true" className="size-3" />
            분석 조건
          </p>
          {dashboard.context.filters.length > 0 && canChangeFilters ? (
            <button
              className="min-h-8 rounded-md px-2 text-[10px] font-semibold text-[#4f46e5] transition-colors hover:bg-[#eef2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-not-allowed disabled:text-[#9296a0]"
              disabled={filterControlsDisabled}
              onClick={() => onFiltersChange?.([])}
              type="button"
            >
              전체 해제
            </button>
          ) : null}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[#595e6b]">
          {onPeriodChange ? (
            <DashboardPeriodControl
              key={JSON.stringify(dashboard.context.period)}
              period={dashboard.context.period}
              disabled={comparisonControlsDisabled}
              onChange={onPeriodChange}
            />
          ) : (
            <span className="inline-flex min-h-9 items-center rounded-lg border border-[#dde2e8] bg-white px-2.5 py-1.5">
              {getPeriodLabel(dashboard.context.period)}
            </span>
          )}
          {canChangeComparison ? (
            <label className="inline-flex min-w-0">
              <span className="sr-only">비교 기준</span>
              <NativeSelect
                density="compact"
                name="comparison-mode"
                aria-label="비교 기준"
                className="border-[#c3c0ff] text-[#3525cd]"
                disabled={comparisonControlsDisabled}
                onChange={(event) => {
                  const nextCompareWith = compareModes.find(
                    (compareWith) => compareWith === event.target.value,
                  );

                  if (nextCompareWith) {
                    onComparisonChange?.(nextCompareWith);
                  }
                }}
                value={dashboard.context.compareWith}
              >
                {compareModes.map((compareWith) => (
                  <option key={compareWith} value={compareWith}>
                    {getComparisonLabel(compareWith)}
                  </option>
                ))}
              </NativeSelect>
            </label>
          ) : (
            <span className="inline-flex min-h-9 items-center rounded-lg border border-[#dde2e8] bg-white px-2.5 py-1.5">
              {getComparisonLabel(dashboard.context.compareWith)}
            </span>
          )}
          {dashboard.context.filters.length === 0 ? (
            <span className="inline-flex min-h-9 items-center rounded-lg border border-dashed border-[#c9ccd2] bg-white px-2.5 py-1.5 text-[#777587]">
              전체 데이터
            </span>
          ) : (
            dashboard.context.filters.map((filter) => {
              const label = getDashboardContextFilterLabel(filter);

              return (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-[#c3c0ff] bg-[#eef2ff] py-1 pl-2.5 text-[#3525cd]"
                  key={`${filter.dimension}-${filter.operator}-${filter.values.join("-")}`}
                >
                  {label}
                  {canChangeFilters ? (
                    <button
                      aria-label={`${label} 조건 제거`}
                      className="grid size-7 place-items-center rounded-r-md text-[#4f46e5] transition-colors hover:bg-[#dedcff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5] disabled:cursor-not-allowed disabled:text-[#9296a0]"
                      disabled={filterControlsDisabled}
                      onClick={() =>
                        onFiltersChange?.(
                          removeDashboardContextFilter(
                            dashboard.context.filters,
                            filter,
                          ),
                        )
                      }
                      type="button"
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  ) : null}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
