"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleCheck,
  DatabaseZap,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { localizeAnalyticsText } from "./formatters";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  analyzeErrorResponseSchema,
  analyzeResponseSchema,
  type ContextOverride,
  type DrilldownFilter,
  type AnalyzeResponse,
} from "@/lib/analysis/schemas";
import type { AnalysisContext } from "@/lib/ai/schemas/analysis-plan";
import { dimensionCatalog } from "@/lib/analytics/dimension-catalog";
import {
  normalizeAnalyticsFilters,
  type AnalyticsFilter,
  type CompareMode,
  type AnalyticsPeriod,
} from "@/lib/analytics/query-schema";
import {
  createAnalysisHistoryEntry,
  saveAnalysisHistory,
  type AnalysisHistoryEntry,
} from "@/lib/history/local-analysis-history";

import {
  notifyLocalAnalysisHistoryChange,
  useLocalAnalysisHistory,
} from "@/components/history/use-local-analysis-history";
import { FollowUpPrompt } from "./follow-up-prompt";
import { AnalysisResultTools } from "./analysis-result-tools";
import { DashboardVersionHistory } from "./dashboard-version-history";

type AnalysisDashboardProps = {
  dashboardId: string;
  question: string;
  historyEntryId?: string;
};

type PendingAnalysis = {
  contextOverride?: ContextOverride;
  drilldownFilter?: DrilldownFilter;
  question: string;
  currentContext?: AnalysisContext;
  sessionId?: string;
};

type AnalysisMutationInput = PendingAnalysis & {
  dashboardId: string;
};

function createRequestId(dashboardId: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${dashboardId}-${crypto.randomUUID()}`;
  }

  return `${dashboardId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) {
    throw new Error("분석 서버가 응답 본문을 반환하지 않았습니다.");
  }

  try {
    const parsed: unknown = JSON.parse(responseText);

    return parsed;
  } catch {
    throw new Error("분석 서버의 응답 형식을 확인할 수 없습니다.");
  }
}

async function requestAnalysis({
  dashboardId,
  question,
  contextOverride,
  drilldownFilter,
  currentContext,
  sessionId,
}: AnalysisMutationInput): Promise<AnalyzeResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      requestId: createRequestId(dashboardId),
      dashboardId,
      ...(sessionId ? { sessionId } : {}),
      ...(currentContext ? { currentContext } : {}),
      ...(contextOverride ? { contextOverride } : {}),
      ...(drilldownFilter ? { drilldownFilter } : {}),
    }),
  });
  const body = await readResponseBody(response);

  if (!response.ok) {
    const errorResponse = analyzeErrorResponseSchema.safeParse(body);

    throw new Error(
      errorResponse.success
        ? errorResponse.data.error.message
        : "분석 요청을 처리하지 못했습니다.",
    );
  }

  return analyzeResponseSchema.parse(body);
}

function getProviderLabel(response: AnalyzeResponse): string {
  if (response.meta.mockMode) {
    return response.meta.fallbackUsed
      ? "로컬 분석 · 복구 모드"
      : "로컬 분석 · 검증 결과";
  }

  return response.meta.fallbackUsed
    ? "제미나이 · 로컬 분석 복구"
    : "제미나이 · 검증 결과";
}

const loadingCards = ["매출", "주문", "전환율", "광고 수익률"] as const;

function DashboardLoadingState() {
  return (
    <section aria-labelledby="analysis-loading-title" className="py-8 lg:py-10">
      <div className="flex flex-col items-center border-b border-[#dde2e8] px-4 py-8 text-center lg:py-10">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-[#4f46e5] shadow-[0_0_0_5px_rgba(79,70,229,0.1)]"
          />
          <h1
            className="text-xl font-semibold tracking-[-0.025em] text-[#191c1e]"
            id="analysis-loading-title"
          >
            분석 결과를 구성하고 있습니다
          </h1>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#777587]">
          <span className="font-semibold text-[#4f46e5]">질문 이해</span>
          <span aria-hidden="true">›</span>
          <span>데이터 집계</span>
          <span aria-hidden="true">›</span>
          <span>대시보드 구성</span>
        </div>
        <div
          aria-hidden="true"
          className="mt-6 h-1 w-full max-w-md overflow-hidden rounded-full bg-[#e7e8ea]"
        >
          <div
            className="prism-skeleton h-full w-1/3 rounded-full"
            style={{ backgroundColor: "#4f46e5" }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-12">
        {loadingCards.map((label) => (
          <div
            aria-label={`${label} 지표를 불러오는 중`}
            className="rounded-xl border border-[#e1e2e4] bg-white p-5 md:col-span-3"
            key={label}
          >
            <div className="prism-skeleton h-3 w-16 rounded" />
            <div className="prism-skeleton mt-5 h-8 w-28 rounded" />
            <div className="prism-skeleton mt-3 h-3 w-20 rounded" />
          </div>
        ))}
        <div className="min-h-72 rounded-xl border border-[#e1e2e4] bg-white p-6 md:col-span-8">
          <div className="prism-skeleton h-4 w-48 rounded" />
          <div className="mt-8 flex h-48 items-end gap-2 border-b border-l border-[#e1e2e4] px-4">
            {[28, 48, 38, 68, 55, 82, 64, 76].map((height, index) => (
              <div
                className="prism-skeleton w-full rounded-t-sm"
                key={`${height}-${index}`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className="min-h-72 rounded-xl border border-[#e1e2e4] bg-white p-6 md:col-span-4">
          <div className="prism-skeleton h-4 w-32 rounded" />
          <div className="mt-7 space-y-5">
            {[0, 1, 2].map((item) => (
              <div className="flex items-center gap-3" key={item}>
                <div className="prism-skeleton size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="prism-skeleton h-3 w-full rounded" />
                  <div className="prism-skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const DashboardEditor = dynamic(
  () => import("./dashboard-editor").then((module) => module.DashboardEditor),
  {
    loading: DashboardLoadingState,
    ssr: false,
  },
);

export function AnalysisDashboard({
  dashboardId,
  question,
  historyEntryId,
}: AnalysisDashboardProps) {
  const [pendingAnalysis, setPendingAnalysis] =
    useState<PendingAnalysis | null>(() =>
      historyEntryId ? null : { question },
    );
  const [storageMessage, setStorageMessage] = useState("");
  const requestedInitialAnalysis = useRef(false);
  const queryClient = useQueryClient();
  const analysisQueryKey = ["analysis-dashboard", dashboardId] as const;
  const { data: response } = useQuery<AnalyzeResponse | null>({
    queryKey: analysisQueryKey,
    queryFn: async () => null,
    enabled: false,
    gcTime: 0,
    initialData: null,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const { entries: historyEntries, isReady: isHistoryReady } =
    useLocalAnalysisHistory();
  const savedEntry = historyEntryId
    ? historyEntries.find((entry) => entry.id === historyEntryId)
    : undefined;
  const historyFallback = useMemo<PendingAnalysis | null>(() => {
    if (!historyEntryId || !isHistoryReady || savedEntry || response) {
      return null;
    }

    return { question };
  }, [historyEntryId, isHistoryReady, question, response, savedEntry]);
  const activePendingAnalysis = pendingAnalysis ?? historyFallback;
  const activeResponse = response ?? savedEntry?.response ?? null;
  const {
    reset: resetAnalysis,
    error: analysisError,
    isError: isAnalysisError,
    isPending: isAnalysisPending,
    mutate: mutateAnalysis,
  } = useMutation({
    mutationFn: requestAnalysis,
    onSuccess: (nextResponse, input) => {
      queryClient.setQueryData(analysisQueryKey, nextResponse);
      setPendingAnalysis(null);
      try {
        const entry = createAnalysisHistoryEntry(input.question, nextResponse);
        const saved = saveAnalysisHistory(window.localStorage, entry);
        setStorageMessage(
          saved.some((item) => item.id === entry.id)
            ? ""
            : "브라우저 저장 공간이 부족해 기록을 저장하지 못했습니다. 분석 데이터는 내려받을 수 있습니다.",
        );
        notifyLocalAnalysisHistoryChange();
      } catch {
        setStorageMessage(
          "브라우저 저장소를 사용할 수 없어 기록을 저장하지 못했습니다. 현재 분석은 계속 볼 수 있습니다.",
        );
      }
    },
  });
  const displayStatus = isAnalysisPending
    ? "loading"
    : isAnalysisError
      ? "error"
      : activeResponse
        ? "ready"
        : "loading";
  const errorMessage = analysisError?.message ?? null;

  useEffect(() => {
    if (!activePendingAnalysis || requestedInitialAnalysis.current) {
      return;
    }

    requestedInitialAnalysis.current = true;
    mutateAnalysis({
      ...activePendingAnalysis,
      dashboardId,
    });
  }, [activePendingAnalysis, dashboardId, mutateAnalysis]);

  function retryAnalysis() {
    const retryTarget = pendingAnalysis ?? historyFallback;

    if (!retryTarget) {
      return;
    }

    setPendingAnalysis({ ...retryTarget });
    mutateAnalysis({ ...retryTarget, dashboardId });
  }

  function startFollowUp(nextQuestion: string) {
    if (!activeResponse || isAnalysisPending) {
      return;
    }

    const nextAnalysis = {
      question: nextQuestion,
      currentContext: activeResponse.context,
      sessionId: activeResponse.sessionId,
    };

    setPendingAnalysis(nextAnalysis);
    mutateAnalysis({ ...nextAnalysis, dashboardId });
  }

  function startContextFiltersChange(filters: readonly AnalyticsFilter[]) {
    if (!activeResponse || isAnalysisPending) {
      return;
    }

    const contextOverride: ContextOverride = {
      filters: normalizeAnalyticsFilters(filters),
    };
    const nextAnalysis = {
      question: activeResponse.plan.normalizedQuestion,
      currentContext: activeResponse.context,
      sessionId: activeResponse.sessionId,
      contextOverride,
    };

    setPendingAnalysis(nextAnalysis);
    mutateAnalysis({ ...nextAnalysis, dashboardId });
  }

  function startComparisonChange(compareWith: CompareMode) {
    if (
      !activeResponse ||
      isAnalysisPending ||
      activeResponse.context.compareWith === compareWith
    ) {
      return;
    }

    const contextOverride: ContextOverride = { compareWith };
    const nextAnalysis = {
      question: activeResponse.plan.normalizedQuestion,
      currentContext: activeResponse.context,
      sessionId: activeResponse.sessionId,
      contextOverride,
    };

    setPendingAnalysis(nextAnalysis);
    mutateAnalysis({ ...nextAnalysis, dashboardId });
  }

  function startPeriodChange(period: AnalyticsPeriod) {
    if (
      !activeResponse ||
      isAnalysisPending ||
      JSON.stringify(activeResponse.context.period) === JSON.stringify(period)
    )
      return;
    const nextAnalysis = {
      question: activeResponse.plan.normalizedQuestion,
      currentContext: activeResponse.context,
      sessionId: activeResponse.sessionId,
      contextOverride: { period },
    };
    setPendingAnalysis(nextAnalysis);
    mutateAnalysis({ ...nextAnalysis, dashboardId });
  }

  function startDrilldownAnalysis(filter: AnalyticsFilter) {
    if (!activeResponse || isAnalysisPending || filter.operator !== "eq") {
      return;
    }

    const value = filter.values.at(0);

    if (!value || filter.values.length !== 1) {
      return;
    }

    const drilldownFilter: DrilldownFilter = {
      dimension: filter.dimension,
      operator: "eq",
      values: [value],
    };
    const nextAnalysis = {
      question: `선택한 ${dimensionCatalog[filter.dimension].label} ${value}을 자세히 분석해줘.`,
      currentContext: activeResponse.context,
      sessionId: activeResponse.sessionId,
      drilldownFilter,
    };

    setPendingAnalysis(nextAnalysis);
    mutateAnalysis({ ...nextAnalysis, dashboardId });
  }

  function openAnalysisVersion(entry: AnalysisHistoryEntry) {
    if (
      !activeResponse ||
      isAnalysisPending ||
      entry.response.sessionId !== activeResponse.sessionId
    ) {
      return;
    }

    setPendingAnalysis(null);
    resetAnalysis();
    queryClient.setQueryData(analysisQueryKey, entry.response);
  }

  if (displayStatus === "loading" && !activeResponse) {
    return <DashboardLoadingState />;
  }

  if (displayStatus === "error" && !activeResponse) {
    return (
      <section
        className="mt-6 rounded-lg border border-[#f0b8b4] bg-[#fff4f2] p-6"
        role="alert"
      >
        <p className="text-[10px] font-semibold tracking-[0.12em] text-[#ba1a1a] uppercase">
          분석을 다시 시도할 수 있어요
        </p>
        <h1 className="mt-3 text-xl font-semibold text-[#191c1e]">
          분석을 완성하지 못했습니다.
        </h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#595e6b]">
          {errorMessage}
        </p>
        <button
          className="mt-5 min-h-11 rounded-lg bg-[#4f46e5] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
          onClick={retryAnalysis}
          type="button"
        >
          분석 다시 시도
        </button>
        <Link
          className="ml-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#4f46e5] underline underline-offset-4"
          href={`/?question=${encodeURIComponent(question)}#analysis-question`}
        >
          질문 수정하기
        </Link>
        <p className="mt-4 text-xs leading-6 text-[#595e6b]">
          매출, 판매량, 광고 효율, 환불률에 대해 질문해 보세요. 예: 지난달
          매출을 지역별로 보여줘.
        </p>
      </section>
    );
  }

  if (!activeResponse) {
    return null;
  }

  return (
    <>
      <section className="mt-4 flex items-start gap-3 rounded-lg border border-[#c3c0ff] bg-[#eef2ff] p-3 sm:p-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[#4f46e5]">
          {displayStatus === "loading" ? (
            <DatabaseZap aria-hidden="true" className="size-4" />
          ) : (
            <ShieldCheck aria-hidden="true" className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-[#3525cd] uppercase">
            {getProviderLabel(activeResponse)}
          </p>
          <p className="mt-1.5 text-[13px] leading-6 text-[#424753]">
            {displayStatus === "loading"
              ? "기존 분석을 유지한 채 후속 질문을 검증하고 있습니다."
              : localizeAnalyticsText(activeResponse.assistantMessage)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-white px-2.5 py-1 text-[10px] font-semibold text-[#17835c]">
          {displayStatus === "loading" ? (
            <LayoutDashboard aria-hidden="true" className="size-3" />
          ) : (
            <CircleCheck aria-hidden="true" className="size-3" />
          )}
          {displayStatus === "loading"
            ? "업데이트 중"
            : activeResponse.meta.partial
              ? "일부 결과"
              : activeResponse.datasets.every((dataset) => dataset.empty)
                ? "데이터 없음"
                : "검증 완료"}
        </span>
      </section>
      {displayStatus === "error" ? (
        <section
          className="mt-4 rounded-lg border border-[#f0b8b4] bg-[#fff4f2] p-4"
          role="alert"
        >
          <p className="text-[13px] leading-6 text-[#93000a]">{errorMessage}</p>
          <button
            className="mt-3 inline-flex min-h-11 items-center text-[13px] font-semibold text-[#93000a] underline decoration-[#f0b8b4] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
            onClick={retryAnalysis}
            type="button"
          >
            후속 분석 다시 시도
          </button>
        </section>
      ) : null}
      {storageMessage ? (
        <p className="mt-3 text-xs text-[#8a5800]" role="status">
          {storageMessage}
        </p>
      ) : null}
      <AnalysisResultTools
        key={`tools-${activeResponse.analysisId}`}
        response={activeResponse}
      />
      {activeResponse.meta.partial ||
      activeResponse.datasets.every((dataset) => dataset.empty) ? (
        <p
          className="mt-3 rounded-lg border border-[#e8d4a4] bg-[#fff9ec] p-4 text-xs leading-6 text-[#8a5800]"
          role="status"
        >
          {activeResponse.meta.partial
            ? "일부 데이터를 조회하지 못했습니다. 조회 근거에서 누락된 항목을 확인할 수 있습니다."
            : "현재 조건에 일치하는 데이터가 없습니다. 아래에서 기간을 변경하거나 필터를 해제해 주세요."}
        </p>
      ) : null}
      <DashboardEditor
        dashboard={activeResponse.dashboard}
        comparisonControlsDisabled={displayStatus === "loading"}
        contextFilterControlsDisabled={displayStatus === "loading"}
        datasets={activeResponse.datasets}
        drilldownAnalysisDisabled={displayStatus === "loading"}
        findings={activeResponse.findings}
        key={activeResponse.analysisId}
        onPeriodChange={startPeriodChange}
        onComparisonChange={startComparisonChange}
        onContextFiltersChange={startContextFiltersChange}
        onDrilldownAnalysis={startDrilldownAnalysis}
      />
      <DashboardVersionHistory
        activeAnalysisId={activeResponse.analysisId}
        disabled={isAnalysisPending}
        entries={historyEntries}
        onSelectVersion={openAnalysisVersion}
        sessionId={activeResponse.sessionId}
      />
      <div className="mt-5">
        <FollowUpPrompt
          disabled={displayStatus === "loading"}
          onSubmit={startFollowUp}
        />
      </div>
    </>
  );
}
