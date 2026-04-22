import { HeartbeatCard } from "@/components/overview/HeartbeatCard";
import { NodeInfoCard } from "@/components/overview/NodeInfoCard";
import { SystemMetrics } from "@/components/overview/SystemMetrics";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <HeartbeatCard />
        <NodeInfoCard />
        <SystemMetrics />
      </div>
    </div>
  );
}
