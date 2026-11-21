"use client";

import { useTranslations } from "next-intl";
import { useState, type MouseEvent } from "react";
import { useMediaQuery } from "@/client/use-media-query";
import type { SheetContent } from "@/contracts/sheets";
import { screenOrder, teethOf, toothOf, type Species } from "@/domain/teeth/catalog";
import { viewOf } from "@/domain/teeth/derive";
import type { TeethRecord } from "@/domain/teeth/entry";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DentalChart } from "./dental-chart";
import { PerioSummary } from "./perio-summary";
import { QuickPanel } from "./quick-panel";
import { ToothEditorDialog } from "./tooth-editor-dialog";
import { useToothNames } from "./use-tooth-name";

const selectButton =
  "min-h-11 rounded-md border border-border bg-surface px-3 text-sm font-medium outline-offset-2 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary-strong";

/**
 * Tab 1: the dental chart with selection tools, the active tooth bar and the periodontal summary.
 * A tap opens the tooth editor; with multi-select (or Shift) taps collect teeth for quick entry.
 */
export function OdontogramTab({
  species,
  content,
  onContent,
}: {
  species: Species;
  content: SheetContent;
  onContent: (content: SheetContent) => void;
}) {
  const t = useTranslations("chart");
  const common = useTranslations("common");
  const quick = useTranslations("quick");
  const names = useToothNames();
  const lowScreen = useMediaQuery("(max-height: 700px)");

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [multi, setMulti] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const teeth = content.teeth as TeethRecord;
  const onTeeth = (next: TeethRecord) => onContent({ ...content, teeth: next });

  function onToothClick(code: string, event: MouseEvent) {
    setActive(code);
    if (multi || event.shiftKey) {
      const next = new Set(selected);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      setSelected(next);
    } else {
      setSelected(new Set([code]));
      setEditing(code);
    }
  }

  function select(codes: string[]) {
    setSelected(new Set(codes));
    setActive(codes[0] ?? null);
  }

  function step(direction: -1 | 1) {
    const order = screenOrder(species);
    const index = order.findIndex((tooth) => tooth.code === editing);
    const next = order[(index + direction + order.length) % order.length];
    setEditing(next.code);
    setActive(next.code);
    setSelected(new Set([next.code]));
  }

  const all = teethOf(species);
  const activeTooth = active ? toothOf(species, active) : undefined;
  const activeEntry = active ? teeth[active] : undefined;
  const selectionCount = selected.size;
  const showSelectionBar = selectionCount > 1 || (multi && selectionCount > 0);

  return (
    <div className="flex flex-col gap-3">
      <section data-chart-section data-teeth={all.length} className="rounded-xl border border-border bg-surface p-2 sm:p-3 [@media(max-height:700px)]:p-2">
        <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="basis-full text-base font-bold">{t("title", { species: common(species) })}</h2>
          <div className="flex flex-wrap items-center gap-1">
            {showSelectionBar ? (
              <>
                <span className="px-1 text-sm font-semibold">{t("selectedCount", { count: selectionCount })}</span>
                <Button variant="primary" onClick={() => setQuickOpen(true)}>
                  {t("quickFor", { count: selectionCount })}
                </Button>
                <Button onClick={() => setSelected(new Set())}>{t("clearSelection")}</Button>
              </>
            ) : (
              <>
                <span className="text-sm text-foreground-muted">{t("selection")}</span>
                <button type="button" className={selectButton} onClick={() => select(all.map((tooth) => tooth.code))}>
                  {t("selectAll")}
                </button>
                <button type="button" className={selectButton} onClick={() => select(all.filter((tooth) => tooth.arch === "upper").map((tooth) => tooth.code))}>
                  {t("selectUpper")}
                </button>
                <button type="button" className={selectButton} onClick={() => select(all.filter((tooth) => tooth.arch === "lower").map((tooth) => tooth.code))}>
                  {t("selectLower")}
                </button>
                <button
                  type="button"
                  className={selectButton}
                  onClick={() => select(all.filter((tooth) => viewOf(teeth[tooth.code]).pathological).map((tooth) => tooth.code))}
                >
                  {t("selectPathological")}
                </button>
              </>
            )}
            <button
              type="button"
              aria-pressed={multi}
              onClick={() => setMulti((on) => !on)}
              className={cn(selectButton, multi ? "border-primary-strong bg-primary-soft text-primary-strong" : "")}
            >
              {t("multiSelect")}
            </button>
          </div>
          {showSelectionBar ? null : <span className="text-sm text-foreground-muted [@media(max-height:700px)]:hidden">{t("hint")}</span>}
        </div>

        <DentalChart species={species} teeth={teeth} selected={selected} onToothClick={onToothClick} maxChipLines={lowScreen ? 3 : 6} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm">
        <p className="flex flex-wrap items-center gap-x-2">
          <span className="text-foreground-muted">{t("activeTooth")}</span>
          {activeTooth ? (
            <>
              <span className="rounded-md bg-primary-soft-strong px-2 py-0.5 font-mono font-bold text-primary-strong">{activeTooth.code}</span>
              <span className="font-semibold">{names.name(activeTooth)}</span>
              <span>{t("activeStatus", { codes: activeEntry?.codes.join(", ") || "–" })}</span>
              <span className="font-medium text-rose-700">{t("activeTreatment", { codes: activeEntry?.treatments.join(", ") || "–" })}</span>
            </>
          ) : (
            <span>{t("activeNone")}</span>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-foreground-muted">
          <Mark className="rounded-full border-2 border-(--mark-radiograph)" label={t("markTreatment")} />
          <Mark className="rounded-sm bg-(--mark-extraction)" label={t("markExtraction")} />
          <Mark className="rounded-full border-2 border-(--mark-calculus)" label={t("markCalculus")} />
          <Mark className="rounded-full border-2 border-(--mark-fracture)" label={t("markFracture")} />
        </p>
      </div>

      <PerioSummary species={species} value={content.periodontal} onChange={(periodontal) => onContent({ ...content, periodontal })} />

      <ToothEditorDialog
        species={species}
        tooth={editing ? (toothOf(species, editing) ?? null) : null}
        teeth={teeth}
        onTeeth={onTeeth}
        onStep={step}
        onQuick={() => {
          setEditing(null);
          setQuickOpen(true);
        }}
        onClose={() => setEditing(null)}
      />

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent size="xl" title={t("quickFor", { count: selectionCount })} description={quick("title")}>
          <QuickPanel species={species} targets={[...selected]} teeth={teeth} onTeeth={onTeeth} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Mark({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden className={cn("inline-block size-3", className)} />
      {label}
    </span>
  );
}
