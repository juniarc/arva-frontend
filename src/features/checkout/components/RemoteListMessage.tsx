import { Button } from "@/components/ui/Button";
import type { RemoteListStatus } from "../state/useRemoteList";

interface RemoteListMessageProps {
  status: RemoteListStatus;
  /** Shown when the endpoint is not built yet (404), for example "Shipping options are not available yet." */
  unavailableText: string;
  /** Shown for any other failure. */
  errorText: string;
  onRetry: () => void;
}

/** What a modal shows instead of its list while it loads, or when the list cannot be shown. Null when ready. */
export function RemoteListMessage({ status, unavailableText, errorText, onRetry }: RemoteListMessageProps) {
  if (status === "loading" || status === "idle") {
    return (
      <p role="status" className="px-5 py-6 text-center text-xs text-muted">
        Loading...
      </p>
    );
  }
  if (status === "unavailable") {
    return <p className="px-5 py-6 text-center text-sm text-muted">{unavailableText}</p>;
  }
  if (status === "error") {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-5 py-6 text-center text-sm text-danger-strong">
        <p>{errorText}</p>
        <Button variant="outline" className="w-auto px-6" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }
  return null;
}
