"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The one multi-line text field of the app. Every long text goes through it, so that dictation
 * (a microphone button) can be added here later, in one place.
 */
export function LongText({
  label,
  value,
  onChange,
  rows = 3,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "block w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
        )}
      />
    </div>
  );
}
