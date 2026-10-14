/** A failed save from any of our API clients. */
export interface Failure {
  status: number;
  message: string;
  field?: string;
  errors?: Record<string, string>;
}

export interface SaveFailure {
  /** Messages for fields the form has: shown under each field. */
  fieldErrors: Record<string, string>;
  /** The banner text, when nothing could be shown under a field. */
  banner: string | null;
}

/** Statuses whose message the backend wrote for the user (our proxy replaces every 5xx message). */
const USER_FACING_STATUSES = new Set([400, 401, 403, 409, 422, 429]);

/**
 * How to show a failed create or save. Field messages go under their fields. Otherwise the banner says
 * the real reason when it is one the user can act on ("Too many requests", "You already have a shop",
 * a message for a field the form does not have, "Unable to reach the server"), and the fallback otherwise.
 */
export function readSaveFailure(result: Failure, knownFields: readonly string[], fallback: string): SaveFailure {
  const fieldErrors: Record<string, string> = {};
  if (result.status === 409 && result.field && knownFields.includes(result.field)) fieldErrors[result.field] = result.message;

  const otherMessages: string[] = [];
  if (result.status === 400) {
    for (const [field, message] of Object.entries(result.errors ?? {})) {
      if (knownFields.includes(field)) fieldErrors[field] = message;
      else otherMessages.push(message);
    }
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, banner: null };

  if (otherMessages.length > 0) return { fieldErrors, banner: otherMessages[0] ?? fallback };
  // Status 0 is a network failure: its message ("Unable to reach the server") is ours.
  if (result.status === 0 || USER_FACING_STATUSES.has(result.status)) return { fieldErrors, banner: result.message };
  return { fieldErrors, banner: fallback };
}
