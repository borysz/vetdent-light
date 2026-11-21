"use client";

import { FileDown, Mail, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ReportDocument } from "./report-document";
import type { ReportData } from "./report-data";
import { ScaledPage } from "./scaled-page";

/** Tab 4: toolbar (print, PDF, e-mail) and the live A4 preview of the report built from the current draft. */
export function ReportTab({
  data,
  pdfBusy,
  onPdf,
}: {
  data: ReportData;
  pdfBusy: boolean;
  onPdf: () => void;
}) {
  const t = useTranslations("reportTab");
  const soon = useTranslations("common")("soon");

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 print:hidden">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="text-sm text-foreground-muted">{t("hint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.print()}>
            <Printer className="size-5" aria-hidden />
            {t("print")}
          </Button>
          <Button variant="dark" disabled={pdfBusy} onClick={onPdf}>
            <FileDown className="size-5" aria-hidden />
            {pdfBusy ? t("pdfBusy") : t("pdf")}
          </Button>
          <Button variant="secondary" disabled title={soon} aria-label={`${t("email")} (${soon})`}>
            <Mail className="size-5" aria-hidden />
            {t("email")}
          </Button>
        </div>
      </section>

      <div className="rounded-xl bg-surface-preview p-2 sm:p-3 print:bg-transparent print:p-0">
        <ScaledPage>
          <ReportDocument data={data} />
        </ScaledPage>
      </div>
    </div>
  );
}
