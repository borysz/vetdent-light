"use client";

import { useTranslations } from "next-intl";
import type { SheetContent } from "@/contracts/sheets";
import type { Species } from "@/domain/teeth/catalog";
import { Field, TextInput } from "@/components/sheet/fields";
import { cn } from "@/lib/utils";

type Periodontal = SheetContent["periodontal"];
const STAGES = ["normal", "1", "2", "3", "4"] as const;

/** Overall periodontal stage and indices, with the abbreviations used in the chart next to it. */
export function PerioSummary({
  species,
  value,
  onChange,
}: {
  species: Species;
  value: Periodontal;
  onChange: (value: Periodontal) => void;
}) {
  const t = useTranslations("perio");
  const set = (patch: Partial<Periodontal>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface p-3 lg:grid-cols-[3fr_2fr]">
      <div className="flex flex-col gap-2">
        <fieldset>
          <legend className="mb-1 text-xs font-bold tracking-wide uppercase">{t("title")}</legend>
          <div className="flex flex-wrap gap-1">
            {STAGES.map((stage) => {
              const active = value.stage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ stage: active ? null : stage })}
                  className={cn(
                    "min-h-11 rounded-md border px-3 text-base outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
                    active ? "border-primary-strong bg-primary-soft font-semibold text-primary-strong" : "border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  {stage === "normal" ? t("normal") : t("stage", { n: stage })}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className={cn("grid gap-2", species === "cat" ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
          <Field label={t("calculusIndex")}>
            {(p) => <TextInput id={p.id} value={value.calculusIndex} onChange={(e) => set({ calculusIndex: e.target.value })} />}
          </Field>
          <Field label={t("gingivitisIndex")}>
            {(p) => <TextInput id={p.id} value={value.gingivitisIndex} onChange={(e) => set({ gingivitisIndex: e.target.value })} />}
          </Field>
          <Field label={t("occlusion")}>
            {(p) => <TextInput id={p.id} value={value.occlusion} onChange={(e) => set({ occlusion: e.target.value })} />}
          </Field>
          {species === "cat" ? (
            <Field label={t("stomatitis")}>
              {(p) => <TextInput id={p.id} value={value.stomatitis} onChange={(e) => set({ stomatitis: e.target.value })} />}
            </Field>
          ) : null}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm">
        <p className="mb-1 text-xs font-bold tracking-wide uppercase">{t("abbreviationsTitle")}</p>
        <p className="text-foreground-muted">{t("abbreviations")}</p>
      </div>
    </div>
  );
}
