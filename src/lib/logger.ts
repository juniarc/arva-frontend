import "server-only";

/**
 * Only these fields can be logged. The narrow type is deliberate: it makes it
 * impossible to pass form data, passwords or tokens by accident.
 */
interface SafeLogContext {
  endpoint?: string;
  status?: number;
  reason?: string;
}

export function logServerError(event: string, context: SafeLogContext = {}): void {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      time: new Date().toISOString(),
      ...context,
    }),
  );
}
