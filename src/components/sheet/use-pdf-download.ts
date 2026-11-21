"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { api, ApiClientError } from "@/client/api";

/**
 * Downloads the saved sheet as a PDF (made on the server from the same report component as the preview):
 * state for the button and the error banner, and the browser download itself.
 */
export function usePdfDownload() {
  const errorText = useTranslations("errors");
  const reportText = useTranslations("reportTab");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const runPdf = useCallback(
    async (sheetId: string) => {
      setPdfBusy(true);
      setPdfError(null);
      try {
        const { blob, fileName } = await api.sheetPdf(sheetId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      } catch (error) {
        setPdfError(error instanceof ApiClientError ? errorText(error.code) : reportText("pdfFailed"));
      } finally {
        setPdfBusy(false);
      }
    },
    [errorText, reportText],
  );

  return { pdfBusy, pdfError, runPdf };
}
