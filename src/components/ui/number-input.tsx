"use client";

import { useState } from "react";
import { formatDecimal, parseDecimal } from "@/client/sheet-draft";
import { inputStyles } from "./input-styles";
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
      className={cn(inputStyles, "font-mono", className)}
    />
  );
}
