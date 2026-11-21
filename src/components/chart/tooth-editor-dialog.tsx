"use client";

import { Check, ChevronLeft, ChevronRight, Mic } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatDecimal, parseDecimal } from "@/client/sheet-draft";
import type { Species, Tooth } from "@/domain/teeth/catalog";
import { EXTRACTIONS, FINDINGS, POCKET_ALERT_MM, POCKET_SITES, TREATMENTS, type PocketSite } from "@/domain/teeth/codes";
import {
  emptyEntry,
  findingBlocked,
  setPocket,
  toggleFinding,
  toggleTreatment,
  treatmentBlocked,
  updateTeeth,
  type TeethRecord,
  type ToothEntry,
} from "@/domain/teeth/entry";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LongText } from "@/components/ui/long-text";
import { cn } from "@/lib/utils";
import type messages from "../../../messages/hu.json";
import { useToothNames } from "./use-tooth-name";

type CodeKey = keyof (typeof messages)["codes"];
type DetailKey = keyof (typeof messages)["codeDetails"];
type TreatmentKey = keyof (typeof messages)["treatments"];
const DETAIL_CODES: readonly string[] = ["FX-C", "PE", "PD2"] satisfies DetailKey[];
const BLOCKED_KEY = { cat_only: "blockedCatOnly", single_root: "blockedSingleRoot", missing: "blockedMissing" } as const;

type EditorTab = "findings" | "treatment";

/**
 * Editor of one tooth, opened by tapping it. It never scrolls: findings and treatment are two tabs sized
 * for the smallest target screen, and quick entry opens in its own dialog.
 */
export function ToothEditorDialog({
  species,
  tooth,
  teeth,
  onTeeth,
  onStep,
  onQuick,
  onClose,
}: {
  species: Species;
  tooth: Tooth | null;
  teeth: TeethRecord;
  onTeeth: (teeth: TeethRecord) => void;
  onStep: (direction: -1 | 1) => void;
  /** Switch to the quick entry dialog for this tooth. */
  onQuick: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("toothEditor");
  const names = useToothNames();
  const [tab, setTab] = useState<EditorTab>("findings");

  return (
    <Dialog open={tooth !== null} onOpenChange={(open) => !open && onClose()}>
      {tooth ? (
        <DialogContent
          size="lg"
          title={`${tooth.code} – ${names.name(tooth)}`}
          header={
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-primary-soft-strong px-2 py-1 font-mono text-lg font-bold text-primary-strong">{tooth.code}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{names.name(tooth)}</p>
                <p className="truncate text-sm text-foreground-muted">{names.quadrant(tooth)}</p>
              </div>
              <Button size="icon" aria-label={t("previous")} onClick={() => onStep(-1)}>
                <ChevronLeft className="size-5" aria-hidden />
              </Button>
              <Button size="icon" aria-label={t("next")} onClick={() => onStep(1)}>
                <ChevronRight className="size-5" aria-hidden />
              </Button>
            </div>
          }
        >
          <div role="tablist" className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1">
            {(["findings", "treatment"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "min-h-11 rounded-md px-2 text-base font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
                  tab === key ? "bg-surface shadow-sm" : "text-foreground-muted",
                )}
              >
                {key === "findings" ? t("tabFindings") : t("tabTreatment")}
              </button>
            ))}
          </div>
          <ToothPanel
            key={tooth.code}
            tab={tab}
            species={species}
            tooth={tooth}
            entry={teeth[tooth.code] ?? emptyEntry()}
            teeth={teeth}
            onTeeth={onTeeth}
          />
          <div className="mt-2 flex justify-between gap-2">
            <Button onClick={onQuick}>{t("tabQuick")}</Button>
            <Button variant="primary" onClick={onClose}>
              {t("done")}
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function ToothPanel({
  tab,
  species,
  tooth,
  entry,
  teeth,
  onTeeth,
}: {
  tab: EditorTab;
  species: Species;
  tooth: Tooth;
  entry: ToothEntry;
  teeth: TeethRecord;
  onTeeth: (teeth: TeethRecord) => void;
}) {
  const t = useTranslations("toothEditor");
  const codeNames = useTranslations("codes");
  const codeDetails = useTranslations("codeDetails");
  const treatmentNames = useTranslations("treatments");
  const soon = useTranslations("common")("soon");
  const change = (next: (entry: ToothEntry) => ToothEntry) => onTeeth(updateTeeth(teeth, [tooth.code], next));

  // Pocket depths are typed as text (decimal comma allowed) and stored once they are valid numbers.
  const [pockets, setPockets] = useState<Record<PocketSite, string>>(() => ({
    mesial: formatDecimal(entry.pocketMm.mesial),
    buccal: formatDecimal(entry.pocketMm.buccal),
    distal: formatDecimal(entry.pocketMm.distal),
    palatolingual: formatDecimal(entry.pocketMm.palatolingual),
  }));

  if (tab === "treatment") {
    return (
      <div className="flex flex-col gap-3">
        <section>
          <h3 className="mb-1 text-sm font-semibold">{t("treatmentsTitle")}</h3>
          <div className="flex flex-wrap gap-1">
            {TREATMENTS.map((code) => {
              const active = entry.treatments.includes(code);
              const blocked = !active && treatmentBlocked(code, entry) !== null;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  disabled={blocked}
                  onClick={() => change((current) => toggleTreatment(current, code))}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1 rounded-md border px-3 text-sm font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong disabled:cursor-not-allowed disabled:opacity-45",
                    active
                      ? EXTRACTIONS.includes(code)
                        ? "border-rose-700 bg-rose-700 text-white"
                        : "border-primary-strong bg-primary-strong text-white"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  {active ? <Check className="size-4" aria-hidden /> : null}
                  <span className="font-mono font-semibold">{code}:</span> {treatmentNames(code as TreatmentKey)}
                </button>
              );
            })}
          </div>
        </section>
        <LongText label={t("note")} rows={2} value={entry.note} onChange={(note) => change((current) => ({ ...current, note }))} />
        <div>
          <Button disabled title={soon} aria-label={`${t("voiceNote")} (${soon})`}>
            <Mic className="size-5" aria-hidden />
            {t("voiceNote")}
          </Button>
        </div>
      </div>
    );
  }

  const selectedFindings = entry.codes;
  return (
    <div className="flex flex-col gap-3">
      <section>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">{t("pocketTitle")}</h3>
          <span className="text-sm font-medium text-red-700">{t("pocketAlert")}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {POCKET_SITES.map((site) => {
            const stored = entry.pocketMm[site];
            return (
              <label key={site} className="block text-center text-sm text-foreground-muted">
                {t(site)}
                <input
                  inputMode="decimal"
                  value={pockets[site]}
                  onChange={(event) => {
                    const text = event.target.value;
                    setPockets((current) => ({ ...current, [site]: text }));
                    const value = parseDecimal(text);
                    if (value === null || (!Number.isNaN(value) && value <= 30)) change((current) => setPocket(current, site, value));
                  }}
                  className={cn(
                    "mt-1 h-11 w-full rounded-md border px-2 text-center font-mono text-base text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
                    stored !== null && stored >= POCKET_ALERT_MM ? "border-red-400 bg-red-50" : "border-border bg-surface",
                  )}
                />
              </label>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold">{t("findingsTitle")}</h3>
        <div className="flex flex-wrap gap-1">
          {FINDINGS.map(({ code }) => {
            const active = selectedFindings.includes(code);
            const reason = active ? null : findingBlocked(code, tooth, species, entry);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                disabled={reason !== null}
                title={reason && reason !== "unknown" ? t(BLOCKED_KEY[reason]) : codeNames(code as CodeKey)}
                onClick={() => change((current) => toggleFinding(current, code, tooth, species))}
                className={cn(
                  "min-h-11 min-w-11 rounded-md border px-2 font-mono text-sm font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong disabled:cursor-not-allowed disabled:opacity-40",
                  active ? "border-dark bg-dark text-white" : "border-border bg-surface hover:bg-surface-muted",
                )}
              >
                {code === "0" ? `0: ${codeNames("0")}` : code}
              </button>
            );
          })}
        </div>
      </section>

      <ul className="min-h-12 rounded-md border border-border bg-surface-muted px-3 py-1 text-sm">
        {selectedFindings.map((code) => (
          <li key={code}>
            <span className="font-mono font-semibold">{code}:</span> {codeNames(code as CodeKey)}
            {DETAIL_CODES.includes(code) ? <span className="text-foreground-muted"> — {codeDetails(code as DetailKey)}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
