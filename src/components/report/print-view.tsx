"use client";

import { useEffect, useState } from "react";
import { useClinic, useSheet } from "@/client/hooks";
import { ReportDocument } from "./report-document";
import { reportFromSheet } from "./report-data";

/**
 * The page the server-side PDF is made from (`/print/sheets/<id>`): just the report, 186 mm wide
 * (A4 minus the 12 mm page margins). It marks itself `data-report-ready` once data and fonts are in.
 */
export function PrintView({ sheetId }: { sheetId: string }) {
  const sheet = useSheet(sheetId);
  const clinic = useClinic(true);
  const loaded = Boolean(sheet.data) && (clinic.isSuccess || clinic.isError);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => !cancelled && setFontsReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sheet.data || !loaded) return <div data-report-error={sheet.isError ? "true" : undefined} />;
  return (
    <div data-report-ready={fontsReady ? "true" : undefined} className="w-[186mm]">
      <ReportDocument data={reportFromSheet(sheet.data, clinic.data ?? null)} />
    </div>
  );
}
