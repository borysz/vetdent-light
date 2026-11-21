"use client";

import { useState } from "react";
import { formatDecimal, parseDecimal } from "@/client/sheet-draft";
import { cn } from "@/lib/utils";

/**
 * Number field with a decimal comma. It keeps what the user is typing (e.g. "1,") and reports a number
 * only when the text is a valid one (or empty = null); out-of-range values are not reported.
 */
export function NumberInput({
  id,
  value,
  onChange,
  max,
  integer = false,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  max: number;
  integer?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(formatDecimal(value));
  const typed = parseDecimal(text);
  // When the value changed from outside (e.g. a row was removed), show it instead of the stale text.
  const shown = Number.isNaN(typed) || typed === value ? text : formatDecimal(value);

  return (
    <input
      id={id}
      aria-label={ariaLabel}
      inputMode={integer ? "numeric" : "decimal"}
      value={shown}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const parsed = parseDecimal(raw);
        if (parsed === null) onChange(null);
        else if (!Number.isNaN(parsed) && parsed <= max && (!integer || Number.isInteger(parsed))) onChange(parsed);
      }}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-3 font-mono text-base text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
        className,
      )}
    />
  );
}
