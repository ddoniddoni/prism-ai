import Link from "next/link";

export function HistoryShell() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7fb] px-5 py-10 sm:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#6657dd] uppercase">
          Analysis history
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-[#151a2d] sm:text-5xl">
          최근 분석
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          분석이 완성되면 질문과 대시보드 요약을 여기에 저장합니다. History
          persistence는 Follow-up Context 단계에서 연결합니다.
        </p>

        <section
          className="mt-12 border border-dashed border-slate-900/20 bg-white/60 p-8 sm:p-12"
          aria-labelledby="empty-history-title"
        >
          <p className="font-mono text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
            No saved analysis
          </p>
          <h2
            className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#151a2d]"
            id="empty-history-title"
          >
            첫 질문으로 분석 기록을 시작하세요.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
            현재는 탐색과 Local Dataset이 준비된 상태입니다. 분석 결과 저장은
            이후 단계에서 검증된 데이터만 대상으로 합니다.
          </p>
          <Link
            className="mt-7 inline-flex bg-[#151a2d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6657dd] focus-visible:ring-2 focus-visible:ring-[#6657dd] focus-visible:ring-offset-2 focus-visible:outline-none"
            href="/"
          >
            질문 시작하기
          </Link>
        </section>
      </div>
    </main>
  );
}
