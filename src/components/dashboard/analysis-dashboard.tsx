"use client";

import {
  CircleCheck,
  DatabaseZap,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  analyzeErrorResponseSchema,
  analyzeResponseSchema,
  type AnalyzeResponse,
} from "@/lib/analysis/schemas";
import type { AnalysisContext } from "@/lib/ai/schemas/analysis-plan";
import {
  createAnalysisHistoryEntry,
  saveAnalysisHistory,
} from "@/lib/history/local-analysis-history";

import {
  notifyLocalAnalysisHistoryChange,
  useLocalAnalysisHistory,
} from "@/components/history/use-local-analysis-history";
import { DashboardRenderer } from "./dashboard-renderer";
import { FollowUpPrompt } from "./follow-up-prompt";

type AnalysisDashboardProps = {
  dashboardId: string;
  question: string;
  historyEntryId?: string;
};

type PendingAnalysis = {
  question: string;
  currentContext?: AnalysisContext;
  sessionId?: string;
};

type AnalysisStatusName = "loading" | "ready" | "error";

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

function getProviderLabel(response: AnalyzeResponse): string {
  if (response.meta.mockMode) {
    return response.meta.fallbackUsed
      ? "Mock AI · fallback active"
      : "Mock AI · verified result";
  }

  return response.meta.fallbackUsed
    ? "Gemini · mock fallback active"
    : "Gemini · verified result";
}

const loadingCards = ["매출", "주문", "전환율", "ROAS"] as const;

function DashboardLoadingState() {
  return (
    <section aria-labelledby="analysis-loading-title" className="py-8 lg:py-10">
      <div className="flex flex-col items-center border-b border-[#dde2e8] px-4 py-8 text-center lg:py-10">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full bg-[#4f46e5] shadow-[0_0_0_5px_rgba(79,70,229,0.1)]"
          />
          <h2
            className="text-xl font-semibold tracking-[-0.025em] text-[#191c1e]"
            id="analysis-loading-title"
          >
            분석 결과를 구성하고 있습니다
          </h2>
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

export function AnalysisDashboard({
  dashboardId,
  question,
  historyEntryId,
}: AnalysisDashboardProps) {
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [status, setStatus] = useState<AnalysisStatusName>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAnalysis, setPendingAnalysis] =
    useState<PendingAnalysis | null>(() =>
      historyEntryId ? null : { question },
    );
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
  const displayStatus =
    savedEntry && !response && !pendingAnalysis ? "ready" : status;

  useEffect(() => {
    if (!activePendingAnalysis) {
      return;
    }

    const controller = new AbortController();
    const activeAnalysis = activePendingAnalysis;

    async function analyzeQuestion() {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: activeAnalysis.question,
            requestId: createRequestId(dashboardId),
            dashboardId,
            ...(activeAnalysis.sessionId
              ? { sessionId: activeAnalysis.sessionId }
              : {}),
            ...(activeAnalysis.currentContext
              ? { currentContext: activeAnalysis.currentContext }
              : {}),
          }),
          signal: controller.signal,
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

        const parsedResponse = analyzeResponseSchema.parse(body);

        saveAnalysisHistory(
          window.localStorage,
          createAnalysisHistoryEntry(activeAnalysis.question, parsedResponse),
        );
        notifyLocalAnalysisHistoryChange();
        setResponse(parsedResponse);
        setPendingAnalysis(null);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "분석 요청을 처리하지 못했습니다.",
        );
        setStatus("error");
      }
    }

    void analyzeQuestion();

    return () => controller.abort();
  }, [activePendingAnalysis, dashboardId, historyFallback]);

  function retryAnalysis() {
    const retryTarget = pendingAnalysis ?? historyFallback;

    if (!retryTarget) {
      return;
    }

    setPendingAnalysis({ ...retryTarget });
    setErrorMessage(null);
    setStatus("loading");
  }

  function startFollowUp(nextQuestion: string) {
    if (!activeResponse) {
      return;
    }

    setPendingAnalysis({
      question: nextQuestion,
      currentContext: activeResponse.context,
      sessionId: activeResponse.sessionId,
    });
    setErrorMessage(null);
    setStatus("loading");
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
          Recoverable analysis error
        </p>
        <h2 className="mt-3 text-xl font-semibold text-[#191c1e]">
          분석을 완성하지 못했습니다.
        </h2>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#595e6b]">
          {errorMessage}
        </p>
        <button
          className="mt-5 rounded-lg bg-[#4f46e5] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
          onClick={retryAnalysis}
          type="button"
        >
          분석 다시 시도
        </button>
      </section>
    );
  }

  if (!activeResponse) {
    return null;
  }

  return (
    <>
      <section className="mt-6 flex flex-col gap-3 rounded-lg border border-[#c3c0ff] bg-[#eef2ff] p-4 sm:flex-row sm:items-start">
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
              : activeResponse.assistantMessage}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-white px-2.5 py-1 text-[10px] font-semibold text-[#17835c]">
          {displayStatus === "loading" ? (
            <LayoutDashboard aria-hidden="true" className="size-3" />
          ) : (
            <CircleCheck aria-hidden="true" className="size-3" />
          )}
          {displayStatus === "loading" ? "Updating" : "Verified"}
        </span>
      </section>
      {displayStatus === "error" ? (
        <section
          className="mt-4 rounded-lg border border-[#f0b8b4] bg-[#fff4f2] p-4"
          role="alert"
        >
          <p className="text-[13px] leading-6 text-[#93000a]">{errorMessage}</p>
          <button
            className="mt-3 text-[13px] font-semibold text-[#93000a] underline decoration-[#f0b8b4] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
            onClick={retryAnalysis}
            type="button"
          >
            후속 분석 다시 시도
          </button>
        </section>
      ) : null}
      <DashboardRenderer
        dashboard={activeResponse.dashboard}
        datasets={activeResponse.datasets}
        findings={activeResponse.findings}
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
