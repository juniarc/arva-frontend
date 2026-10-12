import { GoogleIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/Button";

/** UI only: Google sign-in is not built yet, so the button is disabled. */
export function GoogleButton({ label, id }: { label: string; id: string }) {
  const noteId = `${id}-note`;

  return (
    <div>
      <Button variant="outline" disabled aria-describedby={noteId}>
        <GoogleIcon className="size-5" />
        {label}
      </Button>
      <p id={noteId} className="mt-1 text-center text-xs text-muted">
        Coming soon
      </p>
    </div>
  );
}
