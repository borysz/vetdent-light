import { SheetLoader } from "@/components/sheet/sheet-loader";

export default async function SheetPage({ params }: PageProps<"/sheets/[id]">) {
  const { id } = await params;
  return <SheetLoader sheetId={id} />;
}
