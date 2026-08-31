import { formatDataRange } from "@/lib/data/date-range";
import type { AnalyticsDataRange } from "@/lib/data/repository";

type DataRangePanelProps = {
  dataRange: AnalyticsDataRange;
  rowCount: number;
};

export function DataRangePanel({ dataRange, rowCount }: DataRangePanelProps) {
  return (
    <section
      aria-labelledby="data-range-title"
      className="border border-slate-900/10 bg-white/70 p-5 shadow-[0_16px_40px_-30px_rgba(21,26,45,0.55)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#6657dd] uppercase">
            Local signal
          </p>
          <h2
            className="mt-2 text-base font-semibold text-[#151a2d]"
            id="data-range-title"
          >
            분석 가능한 합성 데이터
          </h2>
        </div>
        <span className="size-2 rounded-full bg-[#67d8c8] shadow-[0_0_0_4px_rgba(103,216,200,0.18)]" />
      </div>
      <p className="mt-5 font-mono text-sm font-medium tracking-[-0.02em] text-[#151a2d]">
        {formatDataRange(dataRange)}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {rowCount.toLocaleString("ko-KR")}개의 일별 레코드 · 고정 시드 · API 키
        불필요
      </p>
    </section>
  );
}
