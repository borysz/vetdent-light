"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PatientPicker } from "./patient-picker";
import { useShell } from "./shell-context";

/** Start a sheet for a new dog or cat, or for an existing animal found by search. */
export function NewSheetDialog() {
  const t = useTranslations("newSheetDialog");
  const { dialog, closeDialog, navigate } = useShell();
  return (
    <Dialog open={dialog === "newSheet"} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent title={t("title")} description={t("description")} size="md">
        <div className="flex flex-col gap-4">
          <section aria-label={t("newAnimal")}>
            <h3 className="mb-2 font-semibold">{t("newAnimal")}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="dog" className="min-h-14" onClick={() => navigate("/sheets/new?species=dog")}>
                {t("dog")}
              </Button>
              <Button variant="cat" className="min-h-14" onClick={() => navigate("/sheets/new?species=cat")}>
                {t("cat")}
              </Button>
            </div>
          </section>
          <section aria-label={t("existing")}>
            <h3 className="mb-2 font-semibold">{t("existing")}</h3>
            <PatientPicker
              pageSize={3}
              onSelect={(patient) => navigate(`/sheets/new?patient=${patient.id}`)}
              searchLabel={t("searchLabel")}
              placeholder={t("searchLabel")}
              emptyText={t("searchLabel")}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
