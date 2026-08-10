/**
 * Structured JSON logger for Edge Functions.
 * Emits single-line JSON logs with level, timestamp, function, message, and context.
 */
type LogLevel = "info" | "warn" | "error" | "debug";

function emit(level: LogLevel, fn: string, message: string, ctx?: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    level,
    ts: new Date().toISOString(),
    fn,
    message,
  };
  if (ctx) entry.ctx = ctx;
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.log(line);
}

export function logger(fn: string) {
  return {
    info: (msg: string, ctx?: Record<string, unknown>) => emit("info", fn, msg, ctx),
    warn: (msg: string, ctx?: Record<string, unknown>) => emit("warn", fn, msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>) => emit("error", fn, msg, ctx),
    debug: (msg: string, ctx?: Record<string, unknown>) => emit("debug", fn, msg, ctx),
  };
}
