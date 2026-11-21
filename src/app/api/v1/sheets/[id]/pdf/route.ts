import { pdfFileName } from "@/domain/report";
import { authenticate } from "@/server/auth";
import { handler, parseId } from "@/server/http";
import { renderSheetPdf } from "@/server/pdf";
import { getSheet } from "@/server/services/sheets";

/** The saved sheet as an A4 PDF (download). */
export const GET = handler<{ id: string }>(async (req, { params }) => {
  const ctx = await authenticate(req);
  const id = parseId(params.id);
  const sheet = await getSheet(ctx, id); // 404 for other clinics' sheets, and gives the file name
  const bearer = req.headers.get("authorization");
  const pdf = await renderSheetPdf({ sheetId: id, authorization: bearer, cookie: bearer ? null : req.headers.get("cookie") });

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(sheet.patient.name, sheet.treatmentDate)}"`,
      "Cache-Control": "no-store",
    },
  });
});
