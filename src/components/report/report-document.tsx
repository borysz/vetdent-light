"use client";

import { CheckCircle2, Stethoscope } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatDecimal } from "@/client/sheet-draft";
import { DentalChart } from "@/components/chart/dental-chart";
import { useToothNames } from "@/components/chart/use-tooth-name";
import type { Sex } from "@/contracts/patients";
import { affectedTeeth, pocketText } from "@/domain/report";
import { COMPLAINTS } from "@/domain/teeth/codes";
import type { TeethRecord } from "@/domain/teeth/entry";
import { cn } from "@/lib/utils";
import type messages from "../../../messages/hu.json";
import type { ReportData } from "./report-data";

type CodeKey = keyof (typeof messages)["codes"];
type TreatmentKey = keyof (typeof messages)["treatments"];
type NerveKey = keyof (typeof messages)["nerves"];
type SideKey = keyof (typeof messages)["sides"];
type AnestheticKey = keyof (typeof messages)["anesthetics"];

const SEX_KEYS: Record<Sex, "sexMale" | "sexFemale" | "sexNeuteredMale" | "sexSpayedFemale"> = {
  male: "sexMale",
  female: "sexFemale",
  neutered_male: "sexNeuteredMale",
  spayed_female: "sexSpayedFemale",
};
const STAGES = ["normal", "1", "2", "3", "4"] as const;
const NO_SELECTION: ReadonlySet<string> = new Set();

const heading = "mb-1.5 border-b border-border pb-1 text-[11px] font-bold tracking-wider uppercase";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dotted border-border py-0.5 last:border-b-0">
      <dt className="shrink-0 text-foreground-muted">{label}</dt>
      <dd className="min-w-0 text-right font-semibold break-words">{children}</dd>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p>
      <span className="font-bold">{label}</span> {children}
    </p>
  );
}

/**
 * The A4 final report. One component serves the live preview (tab 4), the print view and the
 * server-side PDF, so what is previewed is what is printed. Sized for 186 mm of content width.
 */
export function ReportDocument({ data }: { data: ReportData }) {
  const t = useTranslations("report");
  const card = useTranslations("card");
  const common = useTranslations("common");
  const complaintNames = useTranslations("complaints");
  const codeNames = useTranslations("codes");
  const treatmentNames = useTranslations("treatments");
  const nerveNames = useTranslations("nerves");
  const sideNames = useTranslations("sides");
  const anestheticNames = useTranslations("anesthetics");
  const perio = useTranslations("perio");
  const toothNames = useToothNames();

  const { content, clinic } = data;
  const teeth = content.teeth as TeethRecord;
  const clinicLine = clinic
    ? [
        [clinic.postalCode, clinic.city, clinic.street].filter(Boolean).join(" "),
        clinic.phone ? `Tel: ${clinic.phone}` : "",
        clinic.email ? `E-mail: ${clinic.email}` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const place = clinic ? [clinic.postalCode, clinic.city].filter(Boolean).join(" ") : "";
  const speciesName = common(data.species);

  const anamnesis = content.anamnesis;
  const complaints = COMPLAINTS.filter((complaint) => anamnesis.complaints.includes(complaint));
  const detailLines = [
    anamnesis.otherAnamnesis && t("details", { text: anamnesis.otherAnamnesis }),
    anamnesis.homeHygiene && `${card("homeHygiene")}: ${anamnesis.homeHygiene}`,
    anamnesis.diet && `${card("diet")}: ${anamnesis.diet}`,
  ].filter(Boolean);

  const rows = affectedTeeth(data.species, teeth);

  const blocks = content.nerveBlocks
    .filter((block) => block.nerve !== "")
    .map((block) => {
      const nerve = nerveNames(block.nerve as NerveKey);
      const details = [
        block.side && t("sideSuffix", { side: sideNames(block.side as SideKey) }),
        block.anesthetic && anestheticNames(block.anesthetic as AnestheticKey),
        block.amountMl !== null && t("amountMl", { amount: formatDecimal(block.amountMl) }),
      ].filter(Boolean);
      return details.length > 0 ? `${nerve} (${details.join(", ")})` : nerve;
    });
  const { surgery, radiology, medications, homecare, followUp } = content;
  const sutureText = [surgery.suture, surgery.stitchType].filter(Boolean).join(" – ");
  const surgeryLog: [string, string][] = [
    [t("nerveBlocks"), blocks.join("; ")],
    [t("sutures"), [sutureText, surgery.description].filter(Boolean).join(" ")],
    [t("xrayCount"), radiology.imageCount !== null ? t("xrayCountValue", { count: radiology.imageCount }) : ""],
    [t("xrayFindings"), radiology.findings],
    [t("intraoperative"), radiology.intraoperative],
  ];
  const surgeryShown = surgeryLog.filter(([, value]) => value !== "");

  const meds = medications.filter((medication) => medication.name.trim() !== "");
  const adviceBoxes: [string, string][] = [
    [t("feeding"), homecare.feeding],
    [t("chewing"), homecare.chewingRestrictions],
    [t("oralHygiene"), homecare.oralHygiene],
    [t("closingNote"), homecare.closingNote],
  ];
  const adviceShown = adviceBoxes.filter(([, value]) => value.trim() !== "");
  const homecareShown = meds.length > 0 || adviceShown.length > 0 || followUp.date !== null || followUp.purpose !== "";

  return (
    <article data-report className="w-[210mm] bg-white p-[12mm] text-[13px] leading-snug text-foreground print:w-auto print:p-0">
      <header className="flex items-start justify-between gap-4 border-b-2 border-primary-strong pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white" aria-hidden>
              <Stethoscope className="size-6" />
            </span>
            <h1 className="text-xl leading-tight font-bold uppercase">{clinic?.name ?? ""}</h1>
          </div>
          {clinicLine ? <p className="mt-1 text-xs text-foreground-muted">{clinicLine}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-block rounded-md border border-primary/40 bg-primary-soft px-2 py-1 text-xs font-bold tracking-wide text-primary-strong">{t("badge")}</span>
          <p className="mt-1 font-mono text-xs">{t("date", { date: data.treatmentDate })}</p>
        </div>
      </header>

      <section className="mt-3 grid grid-cols-2 gap-x-6 rounded-lg border border-border bg-surface-muted px-3 py-2 break-inside-avoid">
        <dl>
          <Row label={t("patientName")}>{data.patientName}</Row>
          <Row label={t("speciesBreed")}>{[speciesName, data.breed].filter(Boolean).join(" / ")}</Row>
          <Row label={t("ageWeight")}>
            {[data.age ? card("yearsMonths", { years: data.age.years, months: data.age.months }) : "", data.weightKg !== null ? `${formatDecimal(data.weightKg)} kg` : ""]
              .filter(Boolean)
              .join(" · ") || "–"}
          </Row>
          <Row label={t("sex")}>{data.sex ? card(SEX_KEYS[data.sex]) : "–"}</Row>
        </dl>
        <dl>
          <Row label={t("ownerName")}>{data.ownerName}</Row>
          <Row label={t("ownerEmail")}>{data.ownerEmail || "–"}</Row>
          <Row label={t("vet")}>{data.treatingVet || "–"}</Row>
          <Row label={t("asa")}>{data.asa ? `ASA ${data.asa}` : "–"}</Row>
        </dl>
      </section>

      {complaints.length > 0 || detailLines.length > 0 ? (
        <section className="mt-4 break-inside-avoid">
          <h2 className={heading}>{t("history")}</h2>
          {complaints.length > 0 ? (
            <ul className="mb-1.5 flex flex-wrap gap-1.5">
              {complaints.map((complaint) => (
                <li key={complaint} className="rounded-md border border-border bg-surface-muted px-2 py-0.5">
                  {complaintNames(complaint)}
                </li>
              ))}
            </ul>
          ) : null}
          {detailLines.map((line) => (
            <p key={line} className="text-foreground-muted italic">
              {line}
            </p>
          ))}
        </section>
      ) : null}

      <section className="mt-4 break-inside-avoid">
        <div className="flex items-baseline justify-between">
          <h2 className={cn(heading, "flex-1")}>{t("chartTitle")}</h2>
          <span className="mb-1.5 border-b border-border pb-1 font-mono text-[11px] text-foreground-muted">{t("chartSpecies", { species: speciesName })}</span>
        </div>
        <DentalChart compact species={data.species} teeth={teeth} selected={NO_SELECTION} maxChipLines={6} />
      </section>

      <section className="mt-3 grid grid-cols-[3fr_2fr] gap-3 rounded-lg border border-border p-2.5 break-inside-avoid">
        <div>
          <p className="mb-1 text-[11px] font-bold tracking-wider uppercase">{perio("title")}</p>
          <ul className="mb-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {STAGES.map((stage) => (
              <li key={stage} className={cn("flex items-center gap-1", content.periodontal.stage === stage ? "font-bold" : "text-foreground-muted")}>
                <span aria-hidden className={cn("flex size-3.5 items-center justify-center rounded-[3px] border text-[10px] leading-none", content.periodontal.stage === stage ? "border-primary-strong bg-primary-strong text-white" : "border-border")}>
                  {content.periodontal.stage === stage ? "✓" : ""}
                </span>
                {stage === "normal" ? perio("normal") : perio("stage", { n: stage })}
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-3 gap-x-3">
            <div>
              <dt className="text-[11px] font-bold tracking-wide text-foreground-muted uppercase">{perio("calculusIndex")}</dt>
              <dd className="min-h-5 border-b border-border">{content.periodontal.calculusIndex || "–"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold tracking-wide text-foreground-muted uppercase">{perio("gingivitisIndex")}</dt>
              <dd className="min-h-5 border-b border-border">{content.periodontal.gingivitisIndex || "–"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold tracking-wide text-foreground-muted uppercase">{perio("occlusion")}</dt>
              <dd className="min-h-5 border-b border-border">{content.periodontal.occlusion || "–"}</dd>
            </div>
          </dl>
          {data.species === "cat" && content.periodontal.stomatitis ? (
            <p className="mt-1">
              <span className="text-[11px] font-bold tracking-wide text-foreground-muted uppercase">{perio("stomatitis")}:</span> {content.periodontal.stomatitis}
            </p>
          ) : null}
        </div>
        <div className="rounded-md border border-border bg-surface-muted p-2 text-[11px] leading-snug">
          <p className="mb-0.5 font-bold tracking-wide uppercase">{perio("abbreviationsTitle")}</p>
          <p className="text-foreground-muted">{perio("abbreviations")}</p>
        </div>
      </section>

      {rows.length > 0 ? (
        <section className="mt-4">
          <h2 className={heading}>{t("affected")}</h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead className="table-header-group bg-surface-muted">
              <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-2 [&>th]:py-1.5 [&>th]:font-bold">
                <th>{t("colTooth")}</th>
                <th>{t("colName")}</th>
                <th>{t("colPathology")}</th>
                <th>{t("colPocket")}</th>
                <th>{t("colTreatment")}</th>
                <th>{t("colNote")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ tooth, entry }) => (
                <tr key={tooth.code} className="break-inside-avoid align-top [&>td]:border-b [&>td]:border-border [&>td]:px-2 [&>td]:py-1">
                  <td className="font-mono font-bold">{tooth.code}</td>
                  <td>{toothNames.name(tooth)}</td>
                  <td>
                    {entry.codes.length === 0 ? (
                      <span className="text-foreground-muted">–</span>
                    ) : (
                      <ul className="flex flex-col gap-0.5">
                        {entry.codes.map((code) => (
                          <li key={code} className="font-mono text-[11px]">
                            <span className="font-bold">{code}</span>: {codeNames(code as CodeKey)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="font-mono text-[11px] whitespace-nowrap">{pocketText(entry.pocketMm) || "–"}</td>
                  <td>
                    <ul className="flex flex-wrap items-start gap-0.5">
                      {entry.treatments.map((treatment) => (
                        <li key={treatment} className="rounded bg-(--chip-treatment-bg) px-1.5 py-px font-mono text-[11px] font-semibold text-(--chip-treatment-ink)">
                          {treatmentNames(treatment as TreatmentKey)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="text-foreground-muted italic">{entry.note || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {surgeryShown.length > 0 ? (
        <section className="mt-4 rounded-lg border border-border bg-surface-muted p-3 break-inside-avoid">
          <h2 className={heading}>{t("surgeryLog")}</h2>
          <div className="flex flex-col gap-1">
            {surgeryShown.map(([label, value]) => (
              <Labelled key={label} label={label}>
                {value}
              </Labelled>
            ))}
          </div>
        </section>
      ) : null}

      {homecareShown ? (
        <section className="mt-4 rounded-lg border-2 border-primary-strong p-3">
          <h2 className="mb-2 flex items-center gap-2 border-b border-border pb-1.5 text-xs font-bold tracking-wider text-primary-strong uppercase">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("homecare")}
          </h2>
          {meds.length > 0 ? (
            <div className="mb-3">
              <p className="mb-1 font-bold">{t("medsList")}</p>
              <table className="w-full border-collapse text-left text-xs">
                <thead className="table-header-group bg-surface-muted">
                  <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-2 [&>th]:py-1 [&>th]:font-bold">
                    <th>{t("medName")}</th>
                    <th>{t("medDose")}</th>
                    <th>{t("medFrequency")}</th>
                    <th>{t("medDuration")}</th>
                    <th>{t("medInstructions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((medication, index) => (
                    <tr key={index} className="break-inside-avoid align-top [&>td]:border-b [&>td]:border-border [&>td]:px-2 [&>td]:py-1.5">
                      <td className="font-bold">{medication.name}</td>
                      <td className="font-mono text-[11px]">{medication.dose || "–"}</td>
                      <td>{medication.frequency || "–"}</td>
                      <td className="whitespace-nowrap font-bold">{medication.durationDays !== null ? t("daysValue", { days: medication.durationDays }) : "–"}</td>
                      <td className="text-foreground-muted italic">{medication.instructions || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {adviceShown.length > 0 ? (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {adviceShown.map(([label, value]) => (
                <div key={label} className="rounded-md border border-border p-2 break-inside-avoid">
                  <p className="font-bold">{label}</p>
                  <p className="text-foreground-muted whitespace-pre-line">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {followUp.date !== null || followUp.purpose !== "" ? (
            <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 break-inside-avoid">
              <p>
                <span className="font-bold">{t("followUp")}</span> <span className="font-mono font-bold">{followUp.date ?? "–"}</span>
              </p>
              {followUp.purpose ? <p className="text-foreground-muted">{t("followUpPurpose", { purpose: followUp.purpose })}</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-6 flex items-end justify-between gap-6 border-t border-border pt-3 break-inside-avoid">
        <div className="text-xs">
          <p>{t("issuedAt", { date: data.treatmentDate, place })}</p>
          <p className="mt-1 text-[11px] text-foreground-muted">{t("generatedBy")}</p>
        </div>
        <div className="w-64 text-center">
          <p className="min-h-6 border-b border-foreground pb-0.5 font-serif text-sm italic">{data.treatingVet}</p>
          <p className="mt-0.5 text-[11px] tracking-wider text-foreground-muted uppercase">{t("signature")}</p>
        </div>
      </footer>
    </article>
  );
}
