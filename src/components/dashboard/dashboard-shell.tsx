import Link from "next/link";

import { AnalysisDashboard } from "@/components/dashboard/analysis-dashboard";
import { formatDataRange } from "@/lib/data/date-range";
import type { AnalyticsDataRange } from "@/lib/data/repository";

type DashboardShellProps = {
  dashboardId: string;
  dataRange: AnalyticsDataRange;
  question: string;
};

export function DashboardShell({
  dashboardId,
  dataRange,
  question,
}: DashboardShellProps) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7fb] px-5 py-10 sm:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          className="inline-flex rounded-sm font-mono text-xs font-semibold tracking-[0.08em] text-[#5144bb] uppercase focus-visible:ring-2 focus-visible:ring-[#6d5ce7] focus-visible:outline-none"
          href="/"
        >
          ← 질문으로 돌아가기
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section>
            <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#6657dd] uppercase">
              Mock analysis route
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-[#151a2d] sm:text-5xl">
              질문을 검증된 분석으로 연결합니다.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Mock Planner는 허용된 Query만 선택하고, 화면에 표시되는 수치는
              Local Dataset에서 결정론적으로 계산합니다.
            </p>

            <section
              aria-labelledby="submitted-question-title"
              className="mt-10 border-l-2 border-[#67d8c8] bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(21,26,45,0.7)]"
            >
              <p
                className="font-mono text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase"
                id="submitted-question-title"
              >
                Submitted question
              </p>
              <p className="mt-3 text-xl leading-8 font-medium text-[#151a2d]">
                {question}
              </p>
            </section>
          </section>

          <aside className="space-y-4" aria-label="분석 데이터 정보">
            <section className="border border-slate-900/10 bg-[#151a2d] p-5 text-white">
              <p className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#a9a0ff] uppercase">
                Dataset window
              </p>
              <p className="mt-3 font-mono text-sm">
                {formatDataRange(dataRange)}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Local synthetic data is ready for the analytics engine.
              </p>
            </section>
          </aside>
        </div>

        <AnalysisDashboard dashboardId={dashboardId} question={question} />
      </div>
    </main>
  );
}
