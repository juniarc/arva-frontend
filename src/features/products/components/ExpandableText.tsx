"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";

/** Text shorter than this is shown in full, with no toggle. */
const COLLAPSE_AFTER_CHARS = 200;

interface ExpandableTextProps {
  text: string;
  moreLabel?: string;
  lessLabel?: string;
}

/** Shows 3 lines of text with a full-width toggle button when the text is long. */
export function ExpandableText({
  text,
  moreLabel = "Read more description",
  lessLabel = "Hide description",
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const textId = useId();
  const isLong = text.length > COLLAPSE_AFTER_CHARS;
  const Chevron = expanded ? ChevronUp : ChevronDown;

  return (
    <div>
      <p id={textId} className={`text-sm leading-relaxed text-ink ${isLong && !expanded ? "line-clamp-3" : ""}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-mint text-sm text-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
        >
          {expanded ? lessLabel : moreLabel}
          <Chevron className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
