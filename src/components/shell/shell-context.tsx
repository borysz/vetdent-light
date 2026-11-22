"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** What the open sheet editor exposes to the header (save button, status, tabs, leave guard). */
export type EditorBridge = {
  dirty: boolean;
  saving: boolean;
  /** Always-visible save state next to the Save button, already translated. */
  statusText: string;
  statusTone: "saved" | "dirty" | "saving" | "new" | "error";
  tab: number;
  onTab: (tab: number) => void;
  onSave: () => void;
  onReset: () => void;
  onPdf: () => void;
  pdfBusy: boolean;
  /** Run `proceed` (navigation, sign-out) after asking about unsaved changes, if there are any. */
  requestLeave: (proceed: () => void) => void;
};

type DialogName = "sheets" | "newSheet" | "clinic" | "profile" | null;

type ShellValue = {
  dialog: DialogName;
  openDialog: (name: Exclude<DialogName, null>) => void;
  /** Open the sheets dialog, optionally with one animal already selected. */
  openSheets: (patientId?: string) => void;
  focusPatientId: string | undefined;
  closeDialog: () => void;
  bridge: EditorBridge | null;
  setBridge: (bridge: EditorBridge | null) => void;
  /** Guarded navigation: goes through the editor's unsaved-changes check when a sheet is open. */
  navigate: (href: string) => void;
  /** Guarded action (e.g. sign-out). */
  guard: (proceed: () => void) => void;
};

const ShellContext = createContext<ShellValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogName>(null);
  const [bridge, setBridge] = useState<EditorBridge | null>(null);
  const [focusPatientId, setFocusPatientId] = useState<string | undefined>(undefined);

  const guard = useCallback(
    (proceed: () => void) => {
      setDialog(null);
      if (bridge) bridge.requestLeave(proceed);
      else proceed();
    },
    [bridge],
  );
  const navigate = useCallback((href: string) => guard(() => router.push(href)), [guard, router]);

  const value = useMemo<ShellValue>(
    () => ({
      dialog,
      openDialog: setDialog,
      openSheets: (patientId?: string) => {
        setFocusPatientId(patientId);
        setDialog("sheets");
      },
      focusPatientId,
      closeDialog: () => setDialog(null),
      bridge,
      setBridge,
      navigate,
      guard,
    }),
    [dialog, bridge, navigate, guard, focusPatientId],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellValue {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside ShellProvider");
  return value;
}
