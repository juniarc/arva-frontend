/**
 * Maps the `?success=` query value to the text shown in the banner.
 * Only known keys are accepted, so a crafted URL cannot put arbitrary text
 * on the page.
 */
const SUCCESS_MESSAGES: Record<string, string> = {
  account_created: "Account created. Please log in.",
};

export function getSuccessMessage(key: string | string[] | undefined): string | undefined {
  return typeof key === "string" ? SUCCESS_MESSAGES[key] : undefined;
}
