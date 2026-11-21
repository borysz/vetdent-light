"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePatients } from "@/client/hooks";
import { useDebounced } from "@/client/use-debounced";
import type { Patient, Species } from "@/contracts/patients";
import { SpeciesBadge } from "@/components/species-badge";
import { Pager } from "@/components/ui/pager";
import { cn } from "@/lib/utils";
import { SearchField } from "./search-field";

/**
 * Searchable, pageable list of animals (no scrolling: fixed page size). Used on the home screen,
 * in the sheets dialog and in the new-sheet dialog.
 */
export function PatientPicker({
  pageSize,
  speciesFilter = false,
  selectedId,
  onSelect,
  searchLabel,
  placeholder,
  emptyText,
}: {
  pageSize: number;
  speciesFilter?: boolean;
  selectedId?: string;
  onSelect: (patient: Patient) => void;
  searchLabel: string;
  placeholder?: string;
  emptyText: string;
}) {
  const common = useTranslations("common");
  const [text, setText] = useState("");
  const [species, setSpecies] = useState<Species | undefined>(undefined);
  const [page, setPage] = useState(1);
  const q = useDebounced(text.trim());
  const patients = usePatients({ q: q || undefined, species, page, pageSize });

  const filters: { value: Species | undefined; label: string }[] = [
    { value: undefined, label: common("all") },
    { value: "dog", label: common("dog") },
    { value: "cat", label: common("cat") },
  ];

  return (
    <div className="flex flex-col gap-2">
      <SearchField
        label={searchLabel}
        placeholder={placeholder}
        value={text}
        onChange={(value) => {
          setText(value);
          setPage(1);
        }}
      />
      {speciesFilter ? (
        <div className="grid grid-cols-3 gap-1" role="group" aria-label={common("search")}>
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              aria-pressed={species === filter.value}
              onClick={() => {
                setSpecies(filter.value);
                setPage(1);
              }}
              className={cn(
                "min-h-11 rounded-md border px-2 text-base font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
                species === filter.value
                  ? "border-primary-strong bg-primary-soft text-primary-strong"
                  : "border-border bg-surface text-foreground-muted hover:bg-surface-muted",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="flex flex-col gap-1" aria-busy={patients.isFetching}>
        {patients.data?.items.map((patient) => (
          <li key={patient.id}>
            <button
              type="button"
              onClick={() => onSelect(patient)}
              aria-current={patient.id === selectedId ? "true" : undefined}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-1 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong",
                patient.id === selectedId
                  ? "border-primary-strong bg-primary-soft"
                  : "border-border bg-surface hover:bg-surface-muted",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{patient.name}</span>
                <span className="block truncate text-sm text-foreground-muted">{patient.ownerName}</span>
              </span>
              <SpeciesBadge species={patient.species} />
            </button>
          </li>
        ))}
        {patients.data && patients.data.items.length === 0 ? (
          <li className="px-1 py-3 text-foreground-muted">{emptyText}</li>
        ) : null}
        {!patients.data && patients.isPending ? <li className="px-1 py-3 text-foreground-muted">{common("loading")}</li> : null}
      </ul>

      {patients.data && patients.data.total > pageSize ? (
        <Pager page={page} pageSize={pageSize} total={patients.data.total} onPage={setPage} />
      ) : null}
    </div>
  );
}
