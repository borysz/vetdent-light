"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiClientError } from "@/client/api";
import { useInvalidateSheetData } from "@/client/hooks";
import { draftKey, readDraft, removeDraft, writeDraft, type StoredDraft } from "@/client/local-draft";
import {
  draftFromSheet,
  draftsEqual,
  toCreateBody,
  toUpdateBody,
  validateDraft,
  type SheetDraft,
} from "@/client/sheet-draft";
import type { SheetDetail } from "@/contracts/sheets";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useShell } from "@/components/shell/shell-context";
import { PatientCard } from "./patient-card";

const TAB_KEYS = ["odontogram", "anesthesia", "homecare", "report"] as const;

function clampTab(value: string | null): number {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 4 ? number : 1;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Budapest" }).format(date);
}

export type SheetEditorProps = {
  /** Null for a sheet that has not been saved yet. */
  sheetId: string | null;
  /** The animal this sheet belongs to; null while it is still a new animal. */
  patientId: string | null;
  initial: SheetDraft;
  initialVersion: number | null;
  /** When the loaded version was saved (ISO), for the status text. */
  savedAt: string | null;
};

/**
 * The working copy of one treatment sheet: explicit save with an always-visible state, a local draft in
 * the browser, a warning before leaving with unsaved changes, and a clear dialog on a save conflict (409).
 */
export function SheetEditor(props: SheetEditorProps) {
  const t = useTranslations("editor");
  const errorText = useTranslations("errors");
  const tabsText = useTranslations("tabs");
  const { setBridge } = useShell();
  const invalidate = useInvalidateSheetData();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState(() => clampTab(searchParams.get("tab")));
  const [sheetId, setSheetId] = useState(props.sheetId);
  const [patientId, setPatientId] = useState(props.patientId);
  const [version, setVersion] = useState(props.initialVersion);
  const [draft, setDraft] = useState(props.initial);
  const [saved, setSaved] = useState(props.initial);
  const [savedAt, setSavedAt] = useState<Date | null>(props.savedAt ? new Date(props.savedAt) : null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [cardOpen, setCardOpen] = useState(props.sheetId === null);
  const [leave, setLeave] = useState<{ proceed: () => void } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [conflict, setConflict] = useState(false);

  // What this sheet was opened from decides its draft key; the key follows the sheet once it has an id.
  const keyFor = useCallback(
    (id: string | null) => draftKey({ sheetId: id, patientId: props.patientId, species: props.initial.species }),
    [props.patientId, props.initial.species],
  );
  const key = keyFor(sheetId);

  const [restorable, setRestorable] = useState<StoredDraft | null>(() => {
    const stored = readDraft(keyFor(props.sheetId));
    return stored && !draftsEqual(stored.draft, props.initial) ? stored : null;
  });

  const dirty = !draftsEqual(draft, saved);
  const errors = useMemo(() => (showErrors ? validateDraft(draft) : {}), [showErrors, draft]);

  // Keep unsaved edits in the browser; drop the stored copy once everything is saved.
  useEffect(() => {
    if (restorable) return; // The user has not decided about the found draft yet.
    if (!dirty) {
      removeDraft(key);
      return;
    }
    const timer = setTimeout(
      () => writeDraft(key, { draft, savedAt: new Date().toISOString(), baseVersion: version }),
      500,
    );
    return () => clearTimeout(timer);
  }, [draft, dirty, key, version, restorable]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const adopt = useCallback(
    (result: SheetDetail, requested: SheetDraft) => {
      const serverDraft = draftFromSheet(result);
      setSaved(serverDraft);
      setVersion(result.version);
      setSavedAt(new Date());
      setSaveError(null);
      // Edits made while the request was running stay; otherwise show what the server stored.
      setDraft((current) => (draftsEqual(current, requested) ? serverDraft : current));
      if (sheetId === null) {
        removeDraft(keyFor(null));
        setSheetId(result.id);
        setPatientId(result.patientId);
        window.history.replaceState(null, "", `/sheets/${result.id}?tab=${tab}`);
      }
      removeDraft(keyFor(result.id));
      invalidate();
    },
    [sheetId, keyFor, tab, invalidate],
  );

  const save = useCallback(async (): Promise<boolean> => {
    if (Object.keys(validateDraft(draft)).length > 0) {
      setShowErrors(true);
      setCardOpen(true);
      setSaveError(t("fixErrors"));
      return false;
    }
    setSaving(true);
    setSaveError(null);
    const requested = draft;
    try {
      const result =
        sheetId === null
          ? await api.createSheet(toCreateBody(requested, patientId ?? undefined))
          : await api.updateSheet(sheetId, toUpdateBody(requested, version as number));
      adopt(result, requested);
      return true;
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "version_conflict") setConflict(true);
      else setSaveError(error instanceof ApiClientError ? errorText(error.code) : t("saveFailed"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, sheetId, patientId, version, adopt, t, errorText]);

  /** Conflict, option 1: keep my edits and save them on top of the newer version. */
  const keepMine = useCallback(async () => {
    if (sheetId === null) return;
    setConflict(false);
    setSaving(true);
    const requested = draft;
    try {
      const latest = await api.sheet(sheetId);
      adopt(await api.updateSheet(sheetId, toUpdateBody(requested, latest.version)), requested);
    } catch (error) {
      setSaveError(error instanceof ApiClientError ? errorText(error.code) : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [sheetId, draft, adopt, t, errorText]);

  /** Conflict, option 2: drop my edits and load the other version. */
  const loadTheirs = useCallback(async () => {
    if (sheetId === null) return;
    setConflict(false);
    try {
      const latest = await api.sheet(sheetId);
      const theirs = draftFromSheet(latest);
      setDraft(theirs);
      setSaved(theirs);
      setVersion(latest.version);
      setSavedAt(new Date(latest.updatedAt));
      setSaveError(null);
      removeDraft(key);
    } catch (error) {
      setSaveError(error instanceof ApiClientError ? errorText(error.code) : t("loadFailed"));
    }
  }, [sheetId, key, t, errorText]);

  const requestLeave = useCallback(
    (proceed: () => void) => {
      if (dirty) setLeave({ proceed });
      else proceed();
    },
    [dirty],
  );

  const onTab = useCallback((next: number) => {
    setTab(next);
    window.history.replaceState(null, "", `${window.location.pathname}?tab=${next}`);
  }, []);

  // The header talks to the editor through the bridge; callbacks go through a ref so the bridge is not rebuilt on every keystroke.
  const actions = useRef({ save, requestLeave, onTab });
  useEffect(() => {
    actions.current = { save, requestLeave, onTab };
  });

  let statusTone: "saved" | "dirty" | "saving" | "new" | "error" = "new";
  let statusText = t("notSaved");
  if (saveError) {
    statusTone = "error";
    statusText = t("saveFailed");
  } else if (dirty) {
    statusTone = "dirty";
    statusText = t("unsaved");
  } else if (savedAt) {
    statusTone = "saved";
    statusText = t("saved", { time: formatTime(savedAt) });
  }
  if (saving) statusTone = "saving";

  useEffect(() => {
    setBridge({
      dirty,
      saving,
      statusText,
      statusTone,
      tab,
      onTab: (next) => actions.current.onTab(next),
      onSave: () => void actions.current.save(),
      onReset: () => setConfirmReset(true),
      requestLeave: (proceed) => actions.current.requestLeave(proceed),
    });
  }, [setBridge, dirty, saving, statusText, statusTone, tab]);
  useEffect(() => () => setBridge(null), [setBridge]);

  const change = (patch: Partial<SheetDraft>) => {
    setSaveError(null);
    setDraft((current) => ({ ...current, ...patch }));
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 p-3">
      {restorable ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2">
          <p className="min-w-0 flex-1 text-amber-950">
            {t("draftFound", { time: formatTime(new Date(restorable.savedAt)) })}
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setDraft(restorable.draft);
              setRestorable(null);
            }}
          >
            {t("restoreDraft")}
          </Button>
          <Button
            onClick={() => {
              removeDraft(key);
              setRestorable(null);
            }}
          >
            {t("discardDraft")}
          </Button>
        </div>
      ) : null}

      {saveError ? (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-medium text-red-900">
          {saveError}
        </p>
      ) : null}

      <PatientCard
        draft={draft}
        onChange={change}
        errors={errors}
        speciesLocked={sheetId !== null || patientId !== null}
        expanded={cardOpen}
        onToggle={() => setCardOpen((open) => !open)}
      />

      <section
        aria-label={tabsText(TAB_KEYS[tab - 1])}
        className="rounded-xl border border-border bg-surface p-6 text-foreground-muted"
      >
        <h2 className="mb-1 text-lg font-semibold text-foreground">{tabsText(TAB_KEYS[tab - 1])}</h2>
        <p>{tabsText("placeholder")}</p>
      </section>

      <ConfirmDialog
        open={leave !== null}
        title={t("leaveTitle")}
        body={t("leaveBody")}
        onDismiss={() => setLeave(null)}
        actions={[
          { label: t("stay"), onClick: () => setLeave(null) },
          {
            label: t("discardAndLeave"),
            variant: "danger",
            onClick: () => {
              const proceed = leave?.proceed;
              removeDraft(key);
              setLeave(null);
              // The editor unmounts on navigation; clear the dirty flag first so nothing asks again.
              setDraft(saved);
              proceed?.();
            },
          },
          {
            label: t("saveAndLeave"),
            variant: "primary",
            onClick: async () => {
              const proceed = leave?.proceed;
              setLeave(null);
              if (await save()) proceed?.();
            },
          },
        ]}
      />

      <ConfirmDialog
        open={confirmReset}
        title={t("resetTitle")}
        body={t("resetBody")}
        onDismiss={() => setConfirmReset(false)}
        actions={[
          { label: t("stay"), onClick: () => setConfirmReset(false) },
          {
            label: t("resetConfirm"),
            variant: "danger",
            onClick: () => {
              setDraft(saved);
              removeDraft(key);
              setSaveError(null);
              setConfirmReset(false);
            },
          },
        ]}
      />

      <ConfirmDialog
        open={conflict}
        title={t("conflictTitle")}
        body={t("conflictBody")}
        onDismiss={() => setConflict(false)}
        actions={[
          { label: t("loadTheirs"), onClick: () => void loadTheirs() },
          { label: t("keepMine"), variant: "primary", onClick: () => void keepMine() },
        ]}
      />
    </main>
  );
}
