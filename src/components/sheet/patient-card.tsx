"use client";

import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DraftErrors, SheetDraft } from "@/client/sheet-draft";
import { sexValues, type Sex, type Species } from "@/contracts/patients";
import type { SheetContent } from "@/contracts/sheets";
import { COMPLAINTS } from "@/domain/teeth/codes";
import { SpeciesBadge } from "@/components/species-badge";
import { cn } from "@/lib/utils";
import { Field, selectStyles, TextInput } from "./fields";

const ASA_VALUES = ["I", "II", "III", "IV", "V"] as const;
const SEX_KEYS: Record<Sex, "sexMale" | "sexFemale" | "sexNeuteredMale" | "sexSpayedFemale"> = {
  male: "sexMale",
  female: "sexFemale",
  neutered_male: "sexNeuteredMale",
  spayed_female: "sexSpayedFemale",
};

/**
 * Patient card shown above every tab. Collapsed it is one summary line; expanded it holds the
 * animal, owner, ASA, vet, date and anamnesis fields.
 */
export function PatientCard({
  draft,
  onChange,
  onAnamnesis,
  errors,
  speciesLocked,
  expanded,
  onToggle,
}: {
  draft: SheetDraft;
  onChange: (patch: Partial<SheetDraft>) => void;
  onAnamnesis: (patch: Partial<SheetContent["anamnesis"]>) => void;
  errors: DraftErrors;
  speciesLocked: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("card");
  const complaintText = useTranslations("complaints");
  const anamnesis = draft.content.anamnesis;
  const err = (key: keyof DraftErrors) => (errors[key] ? t(errors[key]) : undefined);

  const summary: [string, string][] = [
    [t("summaryBreed"), draft.breed],
    [
      t("summaryAge"),
      draft.ageYears || draft.ageMonths
        ? t("yearsMonths", { years: draft.ageYears || "0", months: draft.ageMonths || "0" })
        : "",
    ],
    [t("summarySex"), draft.sex ? t(SEX_KEYS[draft.sex]) : ""],
    [t("summaryWeight"), draft.weightKg ? `${draft.weightKg} kg` : ""],
    [t("summaryOwner"), draft.ownerName],
    [t("summaryAsa"), draft.asa],
    [t("summaryDate"), draft.treatmentDate],
  ];

  return (
    <section aria-label={t("title")} className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="truncate text-lg font-bold">{draft.patientName || t("title")}</h2>
          <SpeciesBadge species={draft.species} />
          {expanded
            ? null
            : summary
                .filter(([, value]) => value !== "")
                .map(([label, value]) => (
                  <span key={label} className="text-sm text-foreground-muted">
                    {label}: <strong className="font-semibold text-foreground">{value}</strong>
                  </span>
                ))}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? t("collapse") : t("expand")}
          title={expanded ? t("collapse") : t("expand")}
          className="flex size-11 shrink-0 items-center justify-center rounded-md outline-offset-2 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary-strong"
        >
          {expanded ? <ChevronUp className="size-5" aria-hidden /> : <ChevronDown className="size-5" aria-hidden />}
        </button>
      </div>

      {expanded ? (
        <div className="grid gap-x-4 gap-y-3 border-t border-border px-4 py-3 md:grid-cols-4">
          <Field label={t("patientName")} required error={err("patientName")}>
            {(p) => (
              <TextInput
                id={p.id}
                invalid={p.invalid}
                aria-describedby={p.describedBy}
                value={draft.patientName}
                onChange={(e) => onChange({ patientName: e.target.value })}
                autoComplete="off"
              />
            )}
          </Field>

          <fieldset className="md:col-span-1">
            <legend className="mb-1 block text-sm font-medium">
              {t("species")}
              <span aria-hidden> *</span>
            </legend>
            <div className="grid grid-cols-2 gap-1">
              {(["dog", "cat"] as Species[]).map((species) => {
                const active = draft.species === species;
                return (
                  <button
                    key={species}
                    type="button"
                    aria-pressed={active}
                    disabled={speciesLocked && !active}
                    title={speciesLocked ? t("speciesLocked") : undefined}
                    onClick={() => onChange({ species })}
                    className={cn(
                      "min-h-11 rounded-md border px-2 text-sm font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong disabled:cursor-not-allowed disabled:opacity-50",
                      active
                        ? species === "dog"
                          ? "border-dog bg-dog text-white"
                          : "border-cat bg-cat text-white"
                        : "border-border bg-surface text-foreground hover:bg-surface-muted",
                    )}
                  >
                    {species === "dog" ? t("speciesDog") : t("speciesCat")}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field label={t("breed")}>
            {(p) => (
              <TextInput id={p.id} value={draft.breed} onChange={(e) => onChange({ breed: e.target.value })} autoComplete="off" />
            )}
          </Field>

          <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-1">
            <Field label={t("age")} error={err("ageYears") ?? err("ageMonths")} className="col-span-2">
              {(p) => (
                <div className="grid grid-cols-2 gap-1">
                  <TextInput
                    id={p.id}
                    invalid={Boolean(errors.ageYears)}
                    inputMode="numeric"
                    aria-label={t("years")}
                    placeholder={t("years")}
                    value={draft.ageYears}
                    onChange={(e) => onChange({ ageYears: e.target.value })}
                  />
                  <TextInput
                    invalid={Boolean(errors.ageMonths)}
                    inputMode="numeric"
                    aria-label={t("months")}
                    placeholder={t("months")}
                    value={draft.ageMonths}
                    onChange={(e) => onChange({ ageMonths: e.target.value })}
                  />
                </div>
              )}
            </Field>
            <Field label={t("weight")} error={err("weightKg")}>
              {(p) => (
                <TextInput
                  id={p.id}
                  invalid={p.invalid}
                  aria-describedby={p.describedBy}
                  inputMode="decimal"
                  className="font-mono"
                  value={draft.weightKg}
                  onChange={(e) => onChange({ weightKg: e.target.value })}
                />
              )}
            </Field>
          </div>

          <Field label={t("ownerName")} required error={err("ownerName")}>
            {(p) => (
              <TextInput
                id={p.id}
                invalid={p.invalid}
                aria-describedby={p.describedBy}
                value={draft.ownerName}
                onChange={(e) => onChange({ ownerName: e.target.value })}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label={t("ownerEmail")} error={err("ownerEmail")}>
            {(p) => (
              <TextInput
                id={p.id}
                type="email"
                invalid={p.invalid}
                aria-describedby={p.describedBy}
                value={draft.ownerEmail}
                onChange={(e) => onChange({ ownerEmail: e.target.value })}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label={t("ownerPhone")}>
            {(p) => (
              <TextInput
                id={p.id}
                type="tel"
                value={draft.ownerPhone}
                onChange={(e) => onChange({ ownerPhone: e.target.value })}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label={t("sex")}>
            {(p) => (
              <select
                id={p.id}
                className={selectStyles}
                value={draft.sex}
                onChange={(e) => onChange({ sex: e.target.value as SheetDraft["sex"] })}
              >
                <option value="">{t("sexUnknown")}</option>
                {sexValues.map((sex) => (
                  <option key={sex} value={sex}>
                    {t(SEX_KEYS[sex])}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <fieldset className="md:col-span-2">
            <legend className="mb-1 block text-sm font-medium">
              {t("asa")} <span className="font-normal text-foreground-muted">{t("asaHint")}</span>
            </legend>
            <div className="grid max-w-xs grid-cols-5 gap-1">
              {ASA_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={draft.asa === value}
                  onClick={() => onChange({ asa: draft.asa === value ? "" : value })}
                  className={cn(
                    "min-h-11 rounded-md border px-1 font-mono text-sm font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
                    draft.asa === value
                      ? "border-primary-strong bg-primary-strong text-white"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label={t("treatingVet")}>
            {(p) => (
              <TextInput id={p.id} value={draft.treatingVet} onChange={(e) => onChange({ treatingVet: e.target.value })} autoComplete="off" />
            )}
          </Field>
          <Field label={t("treatmentDate")} required error={err("treatmentDate")}>
            {(p) => (
              <TextInput
                id={p.id}
                type="date"
                invalid={p.invalid}
                aria-describedby={p.describedBy}
                className="font-mono"
                value={draft.treatmentDate}
                onChange={(e) => onChange({ treatmentDate: e.target.value })}
              />
            )}
          </Field>

          <Field label={t("lastFeeding")}>
            {(p) => <TextInput id={p.id} value={anamnesis.lastFeeding} onChange={(e) => onAnamnesis({ lastFeeding: e.target.value })} autoComplete="off" />}
          </Field>
          <Field label={t("preoperativeBlood")}>
            {(p) => (
              <>
                <TextInput
                  id={p.id}
                  list={p.id + "-options"}
                  value={anamnesis.preoperativeBlood}
                  onChange={(e) => onAnamnesis({ preoperativeBlood: e.target.value })}
                  autoComplete="off"
                />
                <datalist id={p.id + "-options"}>
                  <option value={t("preoperativeBloodNormal")} />
                </datalist>
              </>
            )}
          </Field>
          <Field label={t("assistant")} className="md:col-span-2">
            {(p) => <TextInput id={p.id} value={anamnesis.assistant} onChange={(e) => onAnamnesis({ assistant: e.target.value })} autoComplete="off" />}
          </Field>

          <fieldset className="md:col-span-4">
            <legend className="mb-1 block text-sm font-medium">{t("complaints")}</legend>
            <div className="flex flex-wrap gap-1">
              {COMPLAINTS.map((complaint) => {
                const active = anamnesis.complaints.includes(complaint);
                return (
                  <button
                    key={complaint}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onAnamnesis({
                        complaints: active
                          ? anamnesis.complaints.filter((item) => item !== complaint)
                          : [...anamnesis.complaints, complaint],
                      })
                    }
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1 rounded-md border px-3 text-sm font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
                      active ? "border-primary bg-primary-soft text-primary-strong" : "border-border bg-surface text-foreground-muted hover:bg-surface-muted",
                    )}
                  >
                    {active ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                    {complaintText(complaint)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field label={t("otherAnamnesis")} className="md:col-span-2">
            {(p) => <TextInput id={p.id} value={anamnesis.otherAnamnesis} onChange={(e) => onAnamnesis({ otherAnamnesis: e.target.value })} autoComplete="off" />}
          </Field>
          <Field label={t("homeHygiene")}>
            {(p) => <TextInput id={p.id} value={anamnesis.homeHygiene} onChange={(e) => onAnamnesis({ homeHygiene: e.target.value })} autoComplete="off" />}
          </Field>
          <Field label={t("diet")}>
            {(p) => <TextInput id={p.id} value={anamnesis.diet} onChange={(e) => onAnamnesis({ diet: e.target.value })} autoComplete="off" />}
          </Field>
        </div>
      ) : null}
    </section>
  );
}
