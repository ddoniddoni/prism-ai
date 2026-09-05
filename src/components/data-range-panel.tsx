import { formatDataRange } from "@/lib/data/date-range";
import type { AnalyticsDataRange } from "@/lib/data/repository";
import { CheckCircle2, Database } from "lucide-react";

type DataRangePanelProps = {
  dataRange: AnalyticsDataRange;
  rowCount: number;
};

export function DataRangePanel({ dataRange, rowCount }: DataRangePanelProps) {
  return (
    <section
      aria-labelledby="data-range-title"
      className="flex flex-col gap-4 rounded-lg border border-[#dde2e8] bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
          <Database aria-hidden="true" className="size-[18px]" />
        </span>
        <div>
          <h2
            className="text-[13px] font-semibold text-[#191c1e]"
            id="data-range-title"
          >
            로컬 합성 데이터
          </h2>
          <p className="mt-1 text-[12px] text-[#595e6b]">
            {formatDataRange(dataRange)} · {rowCount.toLocaleString("ko-KR")}개
            레코드
          </p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-[12px] font-medium text-[#17835c]">
        <CheckCircle2 aria-hidden="true" className="size-4" />
        고정 시드 검증 완료 · 외부 서비스 키 불필요
      </p>
    </section>
  );
}
