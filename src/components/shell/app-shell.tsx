"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { ClinicDialog } from "./clinic-dialog";
import { NewSheetDialog } from "./new-sheet-dialog";
import { SheetsDialog } from "./sheets-dialog";
import { ShellProvider } from "./shell-context";

/** Header, global dialogs and the page; everything inside (app) is signed in. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <AppHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <SheetsDialog />
      <NewSheetDialog />
      <ClinicDialog />
    </ShellProvider>
  );
}
