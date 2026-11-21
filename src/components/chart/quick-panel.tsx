"use client";

import { Check, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toothOf, type Species } from "@/domain/teeth/catalog";
import { POCKET_QUICK_VALUES } from "@/domain/teeth/codes";
import {
  addFinding,
  addTreatment,
  emptyEntry,
  findingBlocked,
  isMissing,
  removeFinding,
  removeTreatment,
  resetToHealthy,
  setAllPockets,
  treatmentBlocked,
  updateTeeth,
  type TeethRecord,
} from "@/domain/teeth/entry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tones = {
  amber: "border-amber-300 bg-amber-50 text-amber-950",
  rose: "border-rose-300 bg-rose-50 text-rose-950",
  orange: "border-orange-300 bg-orange-50 text-orange-950",
  purple: "border-purple-300 bg-purple-50 text-purple-950",
  slate: "border-slate-300 bg-slate-50 text-slate-900",
  teal: "border-teal-300 bg-teal-50 text-teal-950",
  red: "border-red-300 bg-red-50 text-red-950",
} as const;

function QuickButton({
  tone,
  active,
  onClick,
  children,
}: {
  tone: keyof typeof tones;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md border px-2 font-mono text-sm font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
        tones[tone],
        active ? "border-2 border-foreground" : "",
      )}
    >
      {active ? <Check className="size-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-sm text-foreground-muted">{label}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

/**
 * Quick entry for one or many teeth: a click assigns a finding or treatment to every target tooth it
 * may apply to (a second click removes it), following the same rules as the tooth editor.
 */
export function QuickPanel({
  species,
  targets,
  teeth,
  onTeeth,
}: {
  species: Species;
  targets: string[];
  teeth: TeethRecord;
  onTeeth: (teeth: TeethRecord) => void;
}) {
  const t = useTranslations("quick");
  const [skipped, setSkipped] = useState(0);
  const targetTeeth = targets.flatMap((code) => toothOf(species, code) ?? []);
  const entryOf = (code: string) => teeth[code] ?? emptyEntry();

  const findingTargets = (code: string) => targetTeeth.filter((tooth) => !findingBlocked(code, tooth, species, entryOf(tooth.code)));
  const treatmentTargets = (code: string) => targetTeeth.filter((tooth) => !treatmentBlocked(code, entryOf(tooth.code)));
  const hasFinding = (code: string) => {
    const applicable = findingTargets(code);
    return applicable.length > 0 && applicable.every((tooth) => entryOf(tooth.code).codes.includes(code));
  };
  const hasTreatment = (code: string) => {
    const applicable = treatmentTargets(code);
    return applicable.length > 0 && applicable.every((tooth) => entryOf(tooth.code).treatments.includes(code));
  };

  function toggleFinding(code: string) {
    const applicable = findingTargets(code);
    const remove = hasFinding(code);
    setSkipped(targetTeeth.length - applicable.length);
    onTeeth(
      updateTeeth(teeth, applicable.map((tooth) => tooth.code), (entry, toothCode) =>
        remove ? removeFinding(entry, code) : addFinding(entry, code, toothOf(species, toothCode)!, species),
      ),
    );
  }

  function toggleTreatment(code: string) {
    const applicable = treatmentTargets(code);
    const remove = hasTreatment(code);
    setSkipped(targetTeeth.length - applicable.length);
    onTeeth(
      updateTeeth(teeth, applicable.map((tooth) => tooth.code), (entry) =>
        remove ? removeTreatment(entry, code) : addTreatment(entry, code),
      ),
    );
  }

  function scaleAndPolish() {
    const applicable = treatmentTargets("U");
    setSkipped(targetTeeth.length - applicable.length);
    onTeeth(updateTeeth(teeth, applicable.map((tooth) => tooth.code), (entry) => addTreatment(addTreatment(entry, "U"), "POL")));
  }

  function setPockets(value: number) {
    const applicable = targetTeeth.filter((tooth) => !isMissing(entryOf(tooth.code)));
    setSkipped(targetTeeth.length - applicable.length);
    onTeeth(updateTeeth(teeth, applicable.map((tooth) => tooth.code), (entry) => setAllPockets(entry, value)));
  }

  function reset() {
    setSkipped(0);
    onTeeth(updateTeeth(teeth, targets, () => resetToHealthy()));
  }

  const finding = (code: string, tone: keyof typeof tones, label: string = code) => (
    <QuickButton key={code} tone={tone} active={hasFinding(code)} onClick={() => toggleFinding(code)}>
      {label}
    </QuickButton>
  );
  const treatment = (code: string, tone: keyof typeof tones, label: string) => (
    <QuickButton key={code} tone={tone} active={hasTreatment(code)} onClick={() => toggleTreatment(code)}>
      {label}
    </QuickButton>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-sm">
          {targets.length <= 8 ? t("target", { teeth: targets.join(", ") }) : t("targetCount", { count: targets.length })}
        </p>
        <Button variant="primary" onClick={scaleAndPolish}>
          <Sparkles className="size-5" aria-hidden />
          {t("scaleAndPolish")}
        </Button>
      </div>

      <section>
        <h3 className="mb-1 text-sm font-semibold">
          {t("diagnostic")} <span className="font-normal text-foreground-muted">({t("diagnosticHint")})</span>
        </h3>
        <div className="grid gap-x-6 gap-y-1 lg:grid-cols-2">
          <Row label={t("calculus")}>
            {finding("T1", "amber", t("t1"))}
            {finding("T2", "amber", t("t2"))}
            {finding("T3", "amber", t("t3"))}
          </Row>
          <Row label={t("trauma")}>
            {finding("FX-C", "rose", t("fxc"))}
            {finding("PE", "rose", t("pe"))}
          </Row>
          <Row label={t("gingivitis")}>
            {finding("G1", "rose")}
            {finding("G2", "rose", t("g2"))}
            {finding("G3", "rose", t("g3"))}
          </Row>
          <Row label={t("mobility")}>
            {["Mob1", "Mob2", "Mob3"].map((code) => finding(code, "slate"))}
            {finding("M", "slate", t("missing"))}
          </Row>
          <Row label={t("periodontitis")}>{["PD1", "PD2", "PD3", "PD4"].map((code) => finding(code, "orange"))}</Row>
          {species === "cat" ? (
            <Row label="TR:">{["TR1", "TR2", "TR3", "TR4", "TR5"].map((code) => finding(code, "purple"))}</Row>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold">{t("therapy")}</h3>
        <div className="flex flex-wrap gap-1">
          {treatment("U", "teal", t("treatU"))}
          {treatment("POL", "teal", t("treatPol"))}
          {treatment("RX", "slate", t("treatRx"))}
          {treatment("EXT-S", "red", t("treatExtS"))}
          {treatment("EXT-SURG", "red", t("treatExtSurg"))}
          {treatment("CURE", "amber", t("treatCure"))}
        </div>
      </section>

      <section className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="mb-1 text-sm font-semibold">{t("pocket")}</h3>
          <div className="flex flex-wrap gap-1">
            {POCKET_QUICK_VALUES.map((value) => (
              <QuickButton key={value} tone={value >= 4 ? "red" : "slate"} active={false} onClick={() => setPockets(value)}>
                {t("mm", { value })}
              </QuickButton>
            ))}
          </div>
        </div>
        <Button onClick={reset}>
          <RotateCcw className="size-5" aria-hidden />
          {t("reset")}
        </Button>
      </section>

      <p role="status" className="min-h-5 text-sm text-amber-800">
        {skipped > 0 ? t("skipped", { count: skipped }) : ""}
      </p>
    </div>
  );
}
