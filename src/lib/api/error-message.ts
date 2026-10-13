const MAX_MESSAGE_LENGTH = 200;

/** Reads `{ message }` from an error body. Falls back to `fallback` when it is missing or empty. */
export function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const { message } = body;
    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim().slice(0, MAX_MESSAGE_LENGTH);
    }
  }
  return fallback;
}
