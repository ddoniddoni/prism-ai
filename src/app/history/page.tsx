import { HistoryShell } from "@/components/history/history-shell";
import { SiteHeader } from "@/components/site-header";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#151a2d]">
      <SiteHeader />
      <HistoryShell />
    </div>
  );
}
