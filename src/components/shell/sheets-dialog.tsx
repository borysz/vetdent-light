"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePatient, usePatientSheets } from "@/client/hooks";
import { SpeciesBadge } from "@/components/species-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Pager } from "@/components/ui/pager";
import { PatientPicker } from "./patient-picker";
import { SheetRow } from "./sheet-row";
import { useShell } from "./shell-context";

const ANIMALS_PER_PAGE = 4;
const SHEETS_PER_PAGE = 4;

/** Animals on the left, the selected animal's sheets (newest treatment first) on the right. Never scrolls. */
export function SheetsDialog() {
  const t = useTranslations("sheetsDialog");
  const { dialog, closeDialog } = useShell();
  return (
    <Dialog open={dialog === "sheets"} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent title={t("title")} description={t("description")} size="lg">
        <SheetsBody />
      </DialogContent>
    </Dialog>
  );
}

function SheetsBody() {
  const t = useTranslations("sheetsDialog");
  const { focusPatientId, navigate } = useShell();
  const [selectedId, setSelectedId] = useState<string | undefined>(focusPatientId);
  const [page, setPage] = useState(1);
  const patient = usePatient(selectedId);
  const sheets = usePatientSheets(selectedId, { page, pageSize: SHEETS_PER_PAGE });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section aria-label={t("animals")}>
        <PatientPicker
          pageSize={ANIMALS_PER_PAGE}
          speciesFilter
          selectedId={selectedId}
          onSelect={(p) => {
            setSelectedId(p.id);
            setPage(1);
          }}
          searchLabel={t("animals")}
          placeholder={t("searchPlaceholder")}
          emptyText={t("noAnimals")}
        />
      </section>

      <section className="flex flex-col gap-2">
        {!selectedId || !patient.data ? (
          <p className="py-3 text-foreground-muted">{t("pickAnimal")}</p>
        ) : (
          <>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <span className="truncate">{t("sheetsOf", { name: patient.data.name })}</span>
                <SpeciesBadge species={patient.data.species} />
              </h3>
              <p className="truncate text-sm text-foreground-muted">{t("owner", { owner: patient.data.ownerName })}</p>
            </div>
            <Button variant="primary" onClick={() => navigate(`/sheets/new?patient=${patient.data.id}`)}>
              {t("newForAnimal")}
            </Button>
            <ul className="flex flex-col gap-1">
              {sheets.data?.items.map((sheet) => (
                <SheetRow key={sheet.id} sheet={sheet} showAnimal={false} onOpen={() => navigate(`/sheets/${sheet.id}`)} />
              ))}
              {sheets.data && sheets.data.items.length === 0 ? (
                <li className="px-1 py-3 text-foreground-muted">{t("noSheetsForAnimal")}</li>
              ) : null}
            </ul>
            {sheets.data && sheets.data.total > SHEETS_PER_PAGE ? (
              <Pager page={page} pageSize={SHEETS_PER_PAGE} total={sheets.data.total} onPage={setPage} />
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
