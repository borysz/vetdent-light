import { PrintView } from "@/components/report/print-view";

/** Print view of a saved sheet; the server renders the PDF from this page with a headless Chrome. */
export default async function PrintSheetPage({ params }: PageProps<"/print/sheets/[id]">) {
  const { id } = await params;
  return <PrintView sheetId={id} />;
}
