"use client";

import { useTranslations } from "next-intl";
import { Suspense, useSyncExternalStore } from "react";
import { ApiClientError } from "@/client/api";
import { useMe, usePatient, useSheet } from "@/client/hooks";
import { draftFromSheet, memberName, newDraft } from "@/client/sheet-draft";
import type { Species } from "@/contracts/patients";
import { SheetEditor } from "./sheet-editor";

const noopSubscribe = () => () => undefined;

/** True only in the browser after hydration: the editor reads localStorage, so it never renders on the server. */
function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function Message({ text, alert = false }: { text: string; alert?: boolean }) {
  return (
    <main className="mx-auto w-full max-w-7xl p-4">
      <p role={alert ? "alert" : "status"} className={alert ? "font-medium text-red-700" : "text-foreground-muted"}>
        {text}
      </p>
    </main>
  );
}

function ExistingSheet({ id }: { id: string }) {
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const sheet = useSheet(id);

  if (sheet.isError) {
    const code = sheet.error instanceof ApiClientError ? sheet.error.code : "internal_error";
    return <Message alert text={errors(code)} />;
  }
  if (!sheet.data) return <Message text={common("loading")} />;
  return (
    <SheetEditor
      key={sheet.data.id}
      sheetId={sheet.data.id}
      patientId={sheet.data.patientId}
      initial={draftFromSheet(sheet.data)}
      initialVersion={sheet.data.version}
      savedAt={sheet.data.updatedAt}
    />
  );
}

function NewSheet({ species, patientId }: { species: Species; patientId?: string }) {
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const patient = usePatient(patientId);
  const me = useMe();

  if (patientId && patient.isError) {
    const code = patient.error instanceof ApiClientError ? patient.error.code : "internal_error";
    return <Message alert text={errors(code)} />;
  }
  // The treating vet defaults to the signed-in user, so wait for them (the header already loads it).
  if ((patientId && !patient.data) || me.isPending) return <Message text={common("loading")} />;
  return (
    <SheetEditor
      key={patientId ?? `new-${species}`}
      sheetId={null}
      patientId={patientId ?? null}
      initial={newDraft(species, patient.data, undefined, me.data ? memberName(me.data.member) : "")}
      initialVersion={null}
      savedAt={null}
    />
  );
}

/** Opens a saved sheet (`sheetId`) or starts a new one for a species or an existing animal. */
export function SheetLoader(props: { sheetId: string } | { species: Species; patientId?: string }) {
  const common = useTranslations("common");
  const isClient = useIsClient();
  if (!isClient) return <Message text={common("loading")} />;
  return (
    <Suspense fallback={<Message text={common("loading")} />}>
      {"sheetId" in props ? (
        <ExistingSheet id={props.sheetId} />
      ) : (
        <NewSheet species={props.species} patientId={props.patientId} />
      )}
    </Suspense>
  );
}
