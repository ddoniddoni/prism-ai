import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SiteHeader } from "@/components/site-header";
import { LocalAnalyticsRepository } from "@/lib/data/local-repository";

type DashboardPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    question?: string | string[];
    historyId?: string | string[];
  }>;
};

function readQuestion(value: string | string[] | undefined) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return "지난달 매출이 왜 감소했어?";
}

function readHistoryEntryId(value: string | string[] | undefined) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().slice(0, 160);
  }

  return undefined;
}

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const repository = new LocalAnalyticsRepository();
  const dataRange = await repository.getDataRange();

  return (
    <div
      data-dashboard-id={id}
      className="min-h-screen bg-[#f6f7fb] text-[#151a2d]"
    >
      <SiteHeader />
      <DashboardShell
        dashboardId={id}
        dataRange={dataRange}
        historyEntryId={readHistoryEntryId(query.historyId)}
        question={readQuestion(query.question)}
      />
    </div>
  );
}
