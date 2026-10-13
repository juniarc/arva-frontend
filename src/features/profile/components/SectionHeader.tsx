interface SectionHeaderProps {
  title: string;
  headingId: string;
  /** The visible link text, for example "Edit Profile". */
  editText: string;
  /** Names for the three buttons. Each contains its visible text. */
  editLabel: string;
  cancelLabel: string;
  saveLabel: string;
  editing: boolean;
  /** Something is being saved: every button waits. */
  busy: boolean;
  saveDisabled?: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

const SMALL_BUTTON = "min-h-11 rounded-sm border px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-info lg:min-h-8";

/**
 * The section title with Edit on the right, or Cancel and Save while editing.
 * Save is a submit button, so this must be inside the section's <form> when `editing` is true.
 */
export function SectionHeader(props: SectionHeaderProps) {
  const { title, headingId, editText, editLabel, cancelLabel, saveLabel, editing, busy, saveDisabled, onEdit, onCancel } = props;

  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={headingId} className="font-serif text-xl font-bold text-ink lg:text-2xl">
        {title}
      </h2>
      {editing ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label={cancelLabel}
            className={`${SMALL_BUTTON} border-danger bg-danger-soft text-danger-strong disabled:opacity-60`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || saveDisabled}
            aria-label={saveLabel}
            className={`${SMALL_BUTTON} border-brand bg-mint text-brand disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Save
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          disabled={busy}
          aria-label={editLabel}
          className="min-h-11 px-1 text-sm font-bold text-brand underline focus-visible:outline-2 focus-visible:outline-info disabled:opacity-60 lg:min-h-8 lg:text-xs"
        >
          {editText}
        </button>
      )}
    </div>
  );
}
