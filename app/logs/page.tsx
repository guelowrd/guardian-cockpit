import { LogViewer } from "@/components/logs/LogViewer";

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Logs</h1>
      <LogViewer />
    </div>
  );
}
