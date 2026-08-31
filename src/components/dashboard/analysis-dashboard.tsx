"use client";

import { useEffect, useState } from "react";

import {
  analyzeErrorResponseSchema,
  analyzeResponseSchema,
  type AnalyzeResponse,
} from "@/lib/analysis/schemas";

import { AnalysisStatus } from "@/components/status/analysis-status";

import { DashboardRenderer } from "./dashboard-renderer";

type AnalysisDashboardProps = {
  dashboardId: string;
  question: string;
};

type AnalysisState =
  | { status: "loading" }
  | { status: "success"; response: AnalyzeResponse }
  | { status: "error"; message: string };

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

export function AnalysisDashboard({
  dashboardId,
  question,
}: AnalysisDashboardProps) {
  const [state, setState] = useState<AnalysisState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function analyzeQuestion() {
      setState({ status: "loading" });

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            requestId: createRequestId(dashboardId),
            dashboardId,
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

        setState({
          status: "success",
          response: analyzeResponseSchema.parse(body),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "분석 요청을 처리하지 못했습니다.",
        });
      }
    }

    void analyzeQuestion();

    return () => controller.abort();
  }, [attempt, dashboardId, question]);

  if (state.status === "loading") {
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

  if (state.status === "error") {
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
          {state.message}
        </p>
        <button
          className="mt-5 bg-[#151a2d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6657dd] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => setAttempt((current) => current + 1)}
          type="button"
        >
          분석 다시 시도
        </button>
      </section>
    );
  }

  return (
    <>
      <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="border border-[#67d8c8]/50 bg-[#effdfb] p-4">
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#28776e] uppercase">
            Mock AI · verified result
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {state.response.assistantMessage}
          </p>
        </section>
        <AnalysisStatus stage="ready" />
      </div>
      <DashboardRenderer
        dashboard={state.response.dashboard}
        datasets={state.response.datasets}
        findings={state.response.findings}
      />
    </>
  );
}
