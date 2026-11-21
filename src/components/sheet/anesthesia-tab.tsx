"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SheetContent } from "@/contracts/sheets";
import { ANESTHETICS, emptyNerveBlock, NERVES, SIDES, type NerveBlock } from "@/domain/anesthesia";
import { Button } from "@/components/ui/button";
import { LongText } from "@/components/ui/long-text";
import { NumberInput } from "@/components/ui/number-input";
import { Field, selectStyles, TextInput } from "./fields";
import { SectionCard } from "./section-card";

type Props = { content: SheetContent; onContent: (content: SheetContent) => void };

/** A list select that also shows a stored value that is not (or no longer) in the list, so nothing is hidden. */
function CodeSelect({
  id,
  value,
  options,
  label,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  options: readonly string[];
  label: (code: string) => string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <select id={id} className={selectStyles} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {value !== "" && !options.includes(value) ? <option value={value}>{value}</option> : null}
      {options.map((code) => (
        <option key={code} value={code}>
          {label(code)}
        </option>
      ))}
    </select>
  );
}

/** Tab 2: local anesthesia and nerve blocks, sutures and surgical details, dental radiographs. */
export function AnesthesiaTab({ content, onContent }: Props) {
  const t = useTranslations("anesthesia");
  const nerves = useTranslations("nerves");
  const sides = useTranslations("sides");
  const anesthetics = useTranslations("anesthetics");

  const blocks = content.nerveBlocks;
  const setBlocks = (next: NerveBlock[]) => onContent({ ...content, nerveBlocks: next });
  const setBlock = (index: number, patch: Partial<NerveBlock>) =>
    setBlocks(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)));

  const surgery = content.surgery;
  const radiology = content.radiology;

  return (
    <div className="flex flex-col gap-3">
      <SectionCard
        title={t("nerveBlocksTitle")}
        hint={t("nerveBlocksHint")}
        actions={
          <Button variant="primary" onClick={() => setBlocks([...blocks, emptyNerveBlock()])}>
            {t("addBlock")}
          </Button>
        }
      >
        <ul className="flex flex-col gap-2">
          {blocks.map((block, index) => (
            <li key={index} className="grid grid-cols-[2fr_1fr_auto] items-end gap-2 rounded-lg border border-border bg-surface-muted p-2 lg:grid-cols-[2fr_1fr_2fr_1fr_auto]">
              <Field label={t("nerve")}>
                {(p) => (
                  <CodeSelect
                    id={p.id}
                    value={block.nerve}
                    options={NERVES}
                    label={(code) => nerves(code as (typeof NERVES)[number])}
                    placeholder={t("choose")}
                    onChange={(nerve) => setBlock(index, { nerve })}
                  />
                )}
              </Field>
              <Field label={t("side")}>
                {(p) => (
                  <CodeSelect
                    id={p.id}
                    value={block.side}
                    options={SIDES}
                    label={(code) => sides(code as (typeof SIDES)[number])}
                    placeholder={t("choose")}
                    onChange={(side) => setBlock(index, { side })}
                  />
                )}
              </Field>
              <Field label={t("anesthetic")}>
                {(p) => (
                  <CodeSelect
                    id={p.id}
                    value={block.anesthetic}
                    options={ANESTHETICS}
                    label={(code) => anesthetics(code as (typeof ANESTHETICS)[number])}
                    placeholder={t("choose")}
                    onChange={(anesthetic) => setBlock(index, { anesthetic })}
                  />
                )}
              </Field>
              <Field label={t("amount")}>
                {(p) => <NumberInput id={p.id} value={block.amountMl} max={50} onChange={(amountMl) => setBlock(index, { amountMl })} />}
              </Field>
              <Button
                size="icon"
                aria-label={t("removeBlock")}
                title={t("removeBlock")}
                className="col-start-3 row-span-2 row-start-1 self-center lg:col-start-auto lg:row-span-1 lg:row-start-auto lg:self-end"
                onClick={() => setBlocks(blocks.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-5 text-red-700" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={t("sutureTitle")}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Field label={t("suture")}>
              {(p) => (
                <TextInput id={p.id} value={surgery.suture} onChange={(e) => onContent({ ...content, surgery: { ...surgery, suture: e.target.value } })} />
              )}
            </Field>
            <p className="mt-1 text-xs text-foreground-muted">{t("sutureHint")}</p>
          </div>
          <Field label={t("stitchType")}>
            {(p) => (
              <TextInput id={p.id} value={surgery.stitchType} onChange={(e) => onContent({ ...content, surgery: { ...surgery, stitchType: e.target.value } })} />
            )}
          </Field>
          <LongText
            className="md:col-span-2"
            label={t("surgeryNotes")}
            value={surgery.description}
            onChange={(description) => onContent({ ...content, surgery: { ...surgery, description } })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title={t("radiologyTitle")}
        hint={t("radiologyHint")}
        actions={
          <Field label={t("imageCount")} className="w-40">
            {(p) => (
              <NumberInput
                id={p.id}
                integer
                max={200}
                value={radiology.imageCount}
                onChange={(imageCount) => onContent({ ...content, radiology: { ...radiology, imageCount } })}
              />
            )}
          </Field>
        }
      >
        <div className="grid gap-3">
          <LongText label={t("findings")} value={radiology.findings} onChange={(findings) => onContent({ ...content, radiology: { ...radiology, findings } })} />
          <LongText
            label={t("intraoperative")}
            rows={2}
            value={radiology.intraoperative}
            onChange={(intraoperative) => onContent({ ...content, radiology: { ...radiology, intraoperative } })}
          />
        </div>
      </SectionCard>
    </div>
  );
}
