import { SheetLoader } from "@/components/sheet/sheet-loader";

/** /sheets/new?species=dog|cat starts a sheet for a new animal; /sheets/new?patient=<id> for an existing one. */
export default async function NewSheetPage({ searchParams }: PageProps<"/sheets/new">) {
  const { species, patient } = await searchParams;
  const patientId = typeof patient === "string" && /^[0-9a-f-]{36}$/i.test(patient) ? patient : undefined;
  return <SheetLoader species={species === "cat" ? "cat" : "dog"} patientId={patientId} />;
}
