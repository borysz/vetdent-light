"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SheetContent } from "@/contracts/sheets";
import { emptyMedication, medicationFromTemplate, MEDICATION_TEMPLATES, type Medication, type MedicationTemplate } from "@/domain/medications";
import { Button } from "@/components/ui/button";
import { LongText } from "@/components/ui/long-text";
import { NumberInput } from "@/components/ui/number-input";
import { Field, TextInput } from "./fields";
import { SectionCard } from "./section-card";

type Props = { content: SheetContent; onContent: (content: SheetContent) => void };

const TEMPLATE_LABELS = { painkiller: "templatePainkiller", antibiotic: "templateAntibiotic", oralGel: "templateOralGel" } as const;

/** Tab 3: home medication plan, post-operative advice for the owner, follow-up visit. */
export function HomecareTab({ content, onContent }: Props) {
  const t = useTranslations("homecare");
  const templateTexts = useTranslations("medicationTemplates");

  const medications = content.medications;
  const setMedications = (next: Medication[]) => onContent({ ...content, medications: next });
  const setMedication = (index: number, patch: Partial<Medication>) =>
    setMedications(medications.map((medication, i) => (i === index ? { ...medication, ...patch } : medication)));

  const addTemplate = (template: MedicationTemplate) =>
    setMedications([
      ...medications,
      medicationFromTemplate(template, {
        name: templateTexts(`${template}.name`),
        frequency: templateTexts(`${template}.frequency`),
        instructions: templateTexts(`${template}.instructions`),
      }),
    ]);

  const homecare = content.homecare;
  const setHomecare = (patch: Partial<typeof homecare>) => onContent({ ...content, homecare: { ...homecare, ...patch } });
  const followUp = content.followUp;

  return (
    <div className="flex flex-col gap-3">
      <SectionCard title={t("medsTitle")} hint={t("medsHint")}>
        <div className="mb-3 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-sm text-foreground-muted">{t("templates")}</span>
          {MEDICATION_TEMPLATES.map((template) => (
            <Button key={template} onClick={() => addTemplate(template)}>
              {t(TEMPLATE_LABELS[template])}
            </Button>
          ))}
          <Button variant="primary" onClick={() => setMedications([...medications, emptyMedication()])}>
            {t("addMedication")}
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {medications.map((medication, index) => (
            <li key={index} className="grid gap-2 rounded-lg border border-border bg-surface-muted p-2 md:grid-cols-[3fr_3fr_3fr_1.2fr_auto]">
              <Field label={t("name")}>
                {(p) => <TextInput id={p.id} value={medication.name} onChange={(e) => setMedication(index, { name: e.target.value })} />}
              </Field>
              <Field label={t("dose")}>
                {(p) => <TextInput id={p.id} className="font-mono" value={medication.dose} onChange={(e) => setMedication(index, { dose: e.target.value })} />}
              </Field>
              <Field label={t("frequency")}>
                {(p) => <TextInput id={p.id} value={medication.frequency} onChange={(e) => setMedication(index, { frequency: e.target.value })} />}
              </Field>
              <Field label={t("days")}>
                {(p) => (
                  <NumberInput id={p.id} integer max={365} value={medication.durationDays} onChange={(durationDays) => setMedication(index, { durationDays })} />
                )}
              </Field>
              <div className="flex items-end">
                <Button size="icon" aria-label={t("removeMedication")} title={t("removeMedication")} onClick={() => setMedications(medications.filter((_, i) => i !== index))}>
                  <Trash2 className="size-5 text-red-700" aria-hidden />
                </Button>
              </div>
              <div className="md:col-span-5">
                <Field label={t("instructions")}>
                  {(p) => <TextInput id={p.id} value={medication.instructions} onChange={(e) => setMedication(index, { instructions: e.target.value })} />}
                </Field>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={t("adviceTitle")}>
        <div className="grid gap-3 md:grid-cols-2">
          <LongText required label={t("feeding")} value={homecare.feeding} onChange={(feeding) => setHomecare({ feeding })} />
          <LongText required label={t("chewing")} value={homecare.chewingRestrictions} onChange={(chewingRestrictions) => setHomecare({ chewingRestrictions })} />
          <LongText rows={2} label={t("oralHygiene")} value={homecare.oralHygiene} onChange={(oralHygiene) => setHomecare({ oralHygiene })} />
          <LongText rows={2} label={t("closingNote")} value={homecare.closingNote} onChange={(closingNote) => setHomecare({ closingNote })} />
        </div>
      </SectionCard>

      <SectionCard title={t("followUpTitle")}>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
          <Field label={t("followUpDate")}>
            {(p) => (
              <TextInput
                id={p.id}
                type="date"
                className="font-mono"
                value={followUp.date ?? ""}
                onChange={(e) => onContent({ ...content, followUp: { ...followUp, date: e.target.value === "" ? null : e.target.value } })}
              />
            )}
          </Field>
          <Field label={t("followUpPurpose")}>
            {(p) => <TextInput id={p.id} value={followUp.purpose} onChange={(e) => onContent({ ...content, followUp: { ...followUp, purpose: e.target.value } })} />}
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
