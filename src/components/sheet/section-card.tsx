import type { ReactNode } from "react";

/** A titled block of a tab, in the look of the sample sheets (white card, bold title, grey hint). */
export function SectionCard({
  title,
  hint,
  actions,
  children,
}: {
  title: string;
  hint?: string;
  /** Buttons next to the title (e.g. "add a row"). */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{title}</h2>
          {hint ? <p className="text-sm text-foreground-muted">{hint}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
