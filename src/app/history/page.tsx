import { HistoryShell } from "@/components/history/history-shell";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function HistoryPage() {
  return (
    <WorkspaceShell activeNavigation="history" activeTab="overview">
      <HistoryShell />
    </WorkspaceShell>
  );
}
