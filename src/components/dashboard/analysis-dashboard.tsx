"use client";

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
import { AnalysisStatus } from "@/components/status/analysis-status";

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
    return (
      <section className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="border border-slate-900/10 bg-white p-6">
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#6657dd] uppercase">
            Analysis pipeline
          </p>
          <p className="mt-3 text-xl font-semibold text-[#151a2d]">
            검증된 분석 계획을 준비하고 있습니다.
          </p>
          <div className="prism-spectrum mt-6 h-1.5 w-full animate-pulse" />
        </div>
        <AnalysisStatus stage="planning" />
      </section>
    );
  }

  if (displayStatus === "error" && !activeResponse) {
    return (
      <section
        className="mt-10 border border-rose-200 bg-rose-50 p-6"
        role="alert"
      >
        <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-rose-700 uppercase">
          Recoverable analysis error
        </p>
        <h2 className="mt-3 text-xl font-semibold text-[#151a2d]">
          분석을 완성하지 못했습니다.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
          {errorMessage}
        </p>
        <button
          className="mt-5 bg-[#151a2d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6657dd] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none"
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
      <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="border border-[#67d8c8]/50 bg-[#effdfb] p-4">
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#28776e] uppercase">
            {getProviderLabel(activeResponse)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {displayStatus === "loading"
              ? "기존 분석을 유지한 채 후속 질문을 검증하고 있습니다."
              : activeResponse.assistantMessage}
          </p>
        </section>
        <AnalysisStatus
          stage={displayStatus === "loading" ? "planning" : "ready"}
        />
      </div>
      {displayStatus === "error" ? (
        <section
          className="mt-4 border border-rose-200 bg-rose-50 p-4"
          role="alert"
        >
          <p className="text-sm leading-6 text-rose-800">{errorMessage}</p>
          <button
            className="mt-3 text-sm font-semibold text-rose-800 underline decoration-rose-300 underline-offset-4 focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none"
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
      <div className="mt-6">
        <FollowUpPrompt
          disabled={displayStatus === "loading"}
          onSubmit={startFollowUp}
        />
      </div>
    </>
  );
}
