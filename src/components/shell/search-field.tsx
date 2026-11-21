"use client";

import { Search } from "lucide-react";
import { useId } from "react";

export const inputStyles =
  "h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong";

/** Search input with a visible label (screen readers) and a leading icon. */
export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-foreground-muted" aria-hidden />
        <input
          id={id}
          type="search"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputStyles} pl-10`}
        />
      </div>
    </div>
  );
}
