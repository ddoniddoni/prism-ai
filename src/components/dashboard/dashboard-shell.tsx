import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";

import { AnalysisDashboard } from "@/components/dashboard/analysis-dashboard";
import { formatDataRange } from "@/lib/data/date-range";
import type { AnalyticsDataRange } from "@/lib/data/repository";

type DashboardShellProps = {
  dashboardId: string;
  dataRange: AnalyticsDataRange;
  question: string;
  historyEntryId?: string;
};

export function DashboardShell({
  dashboardId,
  dataRange,
  question,
  historyEntryId,
}: DashboardShellProps) {
  return (
    <main className="min-h-[calc(100vh-60px)] px-4 py-6 sm:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-col gap-3 border-b border-[#dde2e8] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold text-[#595e6b] hover:text-[#4f46e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            질문으로 돌아가기
          </Link>
          <p className="flex items-center gap-2 text-[11px] text-[#595e6b]">
            <Database aria-hidden="true" className="size-3.5 text-[#4f46e5]" />
            Local dataset · {formatDataRange(dataRange)}
          </p>
        </div>

        <section
          aria-labelledby="submitted-question-title"
          className="mt-5 flex flex-col gap-2 rounded-lg border border-[#dde2e8] bg-white px-4 py-3 sm:flex-row sm:items-center"
        >
          <p
            className="shrink-0 text-[10px] font-semibold tracking-[0.1em] text-[#777587] uppercase"
            id="submitted-question-title"
          >
            Submitted question
          </p>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-[#dde2e8] sm:block"
          />
          <p className="truncate text-[13px] font-medium text-[#191c1e]">
            {question}
          </p>
        </section>

        <AnalysisDashboard
          dashboardId={dashboardId}
          historyEntryId={historyEntryId}
          key={`${dashboardId}-${historyEntryId ?? "new"}`}
          question={question}
        />
      </div>
    </main>
  );
}
