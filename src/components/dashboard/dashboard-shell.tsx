import Link from "next/link";

import { AnalysisStatus } from "@/components/status/analysis-status";
import { formatDataRange } from "@/lib/data/date-range";
import type { AnalyticsDataRange } from "@/lib/data/repository";

type DashboardShellProps = {
  dataRange: AnalyticsDataRange;
  question: string;
};

export function DashboardShell({ dataRange, question }: DashboardShellProps) {
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
              Mock dashboard route
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-[#151a2d] sm:text-5xl">
              분석 작업대를 준비했습니다.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              지금은 Product Shell 단계입니다. 다음 Phase에서 이 질문을 검증된
              분석 계획과 실제 위젯으로 연결합니다.
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

          <aside className="space-y-4" aria-label="분석 준비 상태">
            <AnalysisStatus stage="planning" />
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

        <section
          aria-labelledby="next-up-title"
          className="mt-12 border-t border-slate-900/10 pt-6"
        >
          <p
            className="font-mono text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
            id="next-up-title"
          >
            Connected in later phases
          </p>
          <ol className="mt-4 grid gap-px overflow-hidden border border-slate-900/10 bg-slate-900/10 sm:grid-cols-3">
            <li className="bg-[#f6f7fb] p-5">
              <p className="font-mono text-xs text-[#6657dd]">01</p>
              <p className="mt-4 font-semibold text-[#151a2d]">Query DSL</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                허용된 지표와 차원으로 질문을 해석합니다.
              </p>
            </li>
            <li className="bg-[#f6f7fb] p-5">
              <p className="font-mono text-xs text-[#6657dd]">02</p>
              <p className="mt-4 font-semibold text-[#151a2d]">
                Deterministic findings
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                실제 데이터에서 변화와 근거를 계산합니다.
              </p>
            </li>
            <li className="bg-[#f6f7fb] p-5">
              <p className="font-mono text-xs text-[#6657dd]">03</p>
              <p className="mt-4 font-semibold text-[#151a2d]">
                Dashboard registry
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                검증된 참조만으로 결과를 렌더링합니다.
              </p>
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
