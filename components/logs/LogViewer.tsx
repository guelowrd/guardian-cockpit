"use client";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Level = "ALL" | "INFO" | "WARN" | "ERROR";

// Matches Rust tracing format: "TIMESTAMP  LEVEL module: message"
const LEVEL_RE = /\s(ERROR|WARN|INFO|DEBUG|TRACE)\s/;
function detectLevel(line: string): Level {
  const match = line.match(LEVEL_RE);
  if (!match) return "INFO";
  const l = match[1];
  if (l === "ERROR") return "ERROR";
  if (l === "WARN") return "WARN";
  return "INFO";
}

const levelColor: Record<Level, string> = {
  ALL: "",
  INFO: "text-sky-400",
  WARN: "text-amber-400",
  ERROR: "text-red-400",
};

export function LogViewer() {
  const [lines, setLines] = useState<string[]>([]);
  const [filter, setFilter] = useState<Level>("ALL");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/logs");
    es.onmessage = (e) => {
      const line: string = JSON.parse(e.data);
      setLines((prev) => [...prev.slice(-500), line]);
    };
    es.onerror = () => {
      setError("No log source available. Set DOCKER_CONTAINER_NAME (preferred) or LOG_FILE_PATH in your environment.");
      es.close();
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, autoScroll]);

  const visible = lines.filter((l) => {
    if (filter !== "ALL" && detectLevel(l) !== filter) return false;
    if (search && !l.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "INFO", "WARN", "ERROR"] as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${filter === l ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {l}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto rounded border bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={() => setAutoScroll((a) => !a)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${autoScroll ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}
        >
          Auto-scroll {autoScroll ? "on" : "off"}
        </button>
      </div>

      {/* Log output */}
      <div className="h-[calc(100vh-220px)] overflow-y-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs">
        {visible.length === 0 && (
          <span className="text-muted-foreground">Waiting for log lines…</span>
        )}
        {visible.map((line, i) => {
          const level = detectLevel(line);
          return (
            <div key={i} className={`leading-5 ${levelColor[level]}`}>
              {line}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {visible.length} of {lines.length} lines
      </div>
    </div>
  );
}
