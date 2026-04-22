import { NextResponse } from "next/server";
import fs from "fs";

export const dynamic = "force-dynamic";

const LOG_FILE = process.env.LOG_FILE_PATH;
const CONTAINER = process.env.DOCKER_CONTAINER_NAME;
const TAIL_LINES = 200;

function emit(controller: ReadableStreamDefaultController, encoder: TextEncoder, line: string) {
  const trimmed = line.trimEnd();
  if (trimmed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(trimmed)}\n\n`));
}

// Docker multiplexed log stream uses 8-byte frames: [streamType(1), pad(3), size(4)]
function parseMuxChunk(chunk: Buffer, onLine: (line: string) => void, leftover: { buf: Buffer }) {
  let buf = Buffer.concat([leftover.buf, chunk]);
  while (buf.length >= 8) {
    const frameSize = buf.readUInt32BE(4);
    if (buf.length < 8 + frameSize) break;
    const payload = buf.subarray(8, 8 + frameSize).toString("utf-8");
    buf = buf.subarray(8 + frameSize);
    for (const line of payload.split("\n")) {
      onLine(line);
    }
  }
  leftover.buf = buf;
}

async function sseFromDocker(containerName: string, signal: AbortSignal): Promise<Response> {
  const Docker = (await import("dockerode")).default;
  const docker = new Docker();
  const container = docker.getContainer(containerName);

  const logStream: NodeJS.ReadableStream = await container.logs({
    follow: true,
    stdout: true,
    stderr: true,
    tail: TAIL_LINES,
  }) as unknown as NodeJS.ReadableStream;

  const encoder = new TextEncoder();
  const leftover = { buf: Buffer.alloc(0) };

  const stream = new ReadableStream({
    start(controller) {
      logStream.on("data", (chunk: Buffer) => {
        parseMuxChunk(chunk, (line) => emit(controller, encoder, line), leftover);
      });
      logStream.on("end", () => controller.close());
      logStream.on("error", () => controller.close());
      signal.addEventListener("abort", () => {
        (logStream as unknown as { destroy?: () => void }).destroy?.();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

function sseFromFile(filePath: string, signal: AbortSignal): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send existing tail
      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split("\n").slice(-TAIL_LINES)) {
        emit(controller, encoder, line);
      }
      // Watch for new bytes
      let size = fs.statSync(filePath).size;
      const watcher = fs.watch(filePath, () => {
        try {
          const newSize = fs.statSync(filePath).size;
          if (newSize <= size) return;
          const fd = fs.openSync(filePath, "r");
          const buf = Buffer.alloc(newSize - size);
          fs.readSync(fd, buf, 0, buf.length, size);
          fs.closeSync(fd);
          size = newSize;
          for (const line of buf.toString("utf-8").split("\n")) {
            emit(controller, encoder, line);
          }
        } catch { /* file may have rotated */ }
      });
      signal.addEventListener("abort", () => { watcher.close(); controller.close(); });
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

export async function GET(req: Request) {
  const isSSE = (req.headers.get("accept") ?? "").includes("text/event-stream");

  // Priority: Docker container > log file > error
  if (CONTAINER) {
    try {
      if (isSSE) return await sseFromDocker(CONTAINER, req.signal);
      // Non-SSE fallback for Docker: return last N lines synchronously
      const Docker = (await import("dockerode")).default;
      const docker = new Docker();
      const rawBuf: Buffer = await docker.getContainer(CONTAINER).logs({ stdout: true, stderr: true, tail: TAIL_LINES }) as unknown as Buffer;
      const leftover = { buf: Buffer.alloc(0) };
      const lines: string[] = [];
      parseMuxChunk(rawBuf, (l) => { if (l.trimEnd()) lines.push(l.trimEnd()); }, leftover);
      return NextResponse.json({ lines, source: "docker" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!LOG_FILE) {
        return NextResponse.json({ error: `Docker unavailable: ${msg}. Set LOG_FILE_PATH as fallback.` }, { status: 503 });
      }
      // fall through to file
    }
  }

  if (LOG_FILE) {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ error: `Log file not found: ${LOG_FILE}` }, { status: 404 });
    }
    if (isSSE) return sseFromFile(LOG_FILE, req.signal);
    const lines = fs.readFileSync(LOG_FILE, "utf-8").split("\n").filter(Boolean).slice(-TAIL_LINES);
    return NextResponse.json({ lines, source: "file" });
  }

  return NextResponse.json(
    { error: "No log source configured. Set DOCKER_CONTAINER_NAME or LOG_FILE_PATH in your environment." },
    { status: 404 }
  );
}
