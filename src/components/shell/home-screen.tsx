"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRecentSheets } from "@/client/hooks";
import { Plus } from "lucide-react";
import { CatArt, DogArt } from "@/components/species-art";
import { cn } from "@/lib/utils";
import { Pager } from "@/components/ui/pager";
import { PatientPicker } from "./patient-picker";
import { SheetRow } from "./sheet-row";
import { useShell } from "./shell-context";

const PER_PAGE = 4;

/** Start screen: new sheet for a dog or a cat, search saved animals, latest sheets. Fits one screen; lists page instead of scrolling. */
export function HomeScreen() {
  const t = useTranslations("home");
  const { navigate, openSheets } = useShell();
  const [page, setPage] = useState(1);
  const recent = useRecentSheets({ page, pageSize: PER_PAGE });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-3">
        <SpeciesCard species="dog" onClick={() => navigate("/sheets/new?species=dog")} />
        <SpeciesCard species="cat" onClick={() => navigate("/sheets/new?species=cat")} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section aria-label={t("searchResults")} className="rounded-xl border border-border bg-surface p-3">
          <PatientPicker
            pageSize={PER_PAGE}
            onSelect={(patient) => openSheets(patient.id)}
            searchLabel={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            emptyText={t("searchPlaceholder")}
          />
        </section>

        <section aria-label={t("recent")} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
          <h2 className="px-1 text-lg font-semibold">{t("recent")}</h2>
          <ul className="flex flex-col gap-1">
            {recent.data?.items.map((sheet) => (
              <SheetRow key={sheet.id} sheet={sheet} showAnimal onOpen={() => navigate(`/sheets/${sheet.id}`)} />
            ))}
            {recent.data && recent.data.items.length === 0 ? (
              <li className="px-1 py-3 text-foreground-muted">{t("noSheets")}</li>
            ) : null}
          </ul>
          {recent.data && recent.data.total > PER_PAGE ? (
            <Pager page={page} pageSize={PER_PAGE} total={recent.data.total} onPage={setPage} />
          ) : null}
        </section>
      </div>
    </main>
  );
}

/** Start a sheet for a dog or a cat: one card each, with a drawn animal and the species accent colour. */
function SpeciesCard({ species, onClick }: { species: "dog" | "cat"; onClick: () => void }) {
  const t = useTranslations("home");
  const dog = species === "dog";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dog ? t("newDog") : t("newCat")}
      className={cn(
        "flex min-h-20 min-w-0 items-center gap-2 rounded-xl border border-border bg-surface p-2 text-left outline-offset-2 sm:gap-3 sm:p-3 transition-colors focus-visible:outline-2 focus-visible:outline-primary-strong",
        dog ? "hover:border-dog" : "hover:border-cat",
      )}
    >
      <span
        className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl sm:size-14", dog ? "bg-dog-soft" : "bg-cat-soft")}
      >
        {dog ? <DogArt className="size-10 sm:size-11" /> : <CatArt className="size-10 sm:size-11" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold sm:text-xl">{dog ? t("dogTitle") : t("catTitle")}</span>
        <span className="block text-sm text-foreground-muted sm:truncate sm:text-base">{dog ? t("dogSubtitle") : t("catSubtitle")}</span>
      </span>
      <span
        aria-hidden
        className={cn("hidden size-10 shrink-0 items-center justify-center rounded-full sm:flex", dog ? "bg-dog-soft text-dog-ink" : "bg-cat-soft text-cat-ink")}
      >
        <Plus className="size-5" />
      </span>
    </button>
  );
}
