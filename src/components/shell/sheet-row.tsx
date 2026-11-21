"use client";

import { useTranslations } from "next-intl";
import type { SheetSummary } from "@/contracts/sheets";
import { SpeciesBadge } from "@/components/species-badge";
import { Button } from "@/components/ui/button";

/** One saved sheet in a list: date, vet, main procedures, and an Open button. */
export function SheetRow({
  sheet,
  showAnimal,
  onOpen,
}: {
  sheet: SheetSummary;
  showAnimal: boolean;
  onOpen: () => void;
}) {
  const common = useTranslations("common");
  return (
    <li className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface px-3 py-1">
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2">
          {showAnimal ? (
            <>
              <span className="min-w-0 truncate font-semibold">{sheet.patientName}</span>
              <SpeciesBadge species={sheet.species} />
            </>
          ) : null}
          <span className="font-mono text-sm tabular-nums">{sheet.treatmentDate}</span>
        </p>
        <p className="truncate text-sm text-foreground-muted">
          {[sheet.treatingVet, sheet.procedures.join(", ")].filter(Boolean).join(" · ") || " "}
        </p>
      </div>
      <Button onClick={onOpen}>{common("open")}</Button>
    </li>
  );
}
