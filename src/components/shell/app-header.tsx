"use client";

import { FolderOpen, Loader2, Mail, Plus, RotateCcw, Stethoscope, FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { useShell } from "./shell-context";

const TAB_KEYS = ["odontogram", "anesthesia", "homecare", "report"] as const;
const SHORT_KEYS = ["shortOdontogram", "shortAnesthesia", "shortHomecare", "shortReport"] as const;

const toneDot = {
  saved: "bg-white",
  dirty: "bg-amber-300",
  saving: "bg-white/60",
  new: "bg-white/60",
  error: "bg-red-300",
} as const;

/**
 * Fixed header. One row on laptops (icon buttons, short tab names); on narrower screens the tabs
 * move to a second, full-width row, so nothing ever overflows.
 */
export function AppHeader() {
  const t = useTranslations("header");
  const tabs = useTranslations("tabs");
  const app = useTranslations("app");
  const { bridge, navigate, openDialog, openSheets } = useShell();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface print:hidden">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 xl:flex-nowrap">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label={t("home")}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-md pr-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white" aria-hidden>
            <Stethoscope className="size-6" />
          </span>
          <span className="hidden text-xl font-bold min-[480px]:inline">{app("name")}</span>
          <span className="hidden rounded-md border border-primary/30 bg-primary-soft px-2 py-1 font-mono text-xs font-medium text-primary 2xl:inline">
            {app("badge")}
          </span>
        </button>

        {bridge ? (
          <nav
            aria-label={t("tabsLabel")}
            className="order-last grid basis-full grid-cols-2 gap-1 sm:grid-cols-4 rounded-lg bg-surface-muted p-1 xl:order-none xl:flex xl:min-w-0 xl:flex-1 xl:basis-auto xl:grid-cols-none"
          >
            {TAB_KEYS.map((key, index) => {
              const active = bridge.tab === index + 1;
              return (
                <button
                  key={key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  aria-label={tabs(key)}
                  title={tabs(key)}
                  onClick={() => bridge.onTab(index + 1)}
                  className={cn(
                    "min-h-11 rounded-md px-2 text-base font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong xl:px-3",
                    active ? "bg-surface text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  <span className="min-[2200px]:hidden">{tabs(SHORT_KEYS[index])}</span>
                  <span className="hidden whitespace-nowrap min-[2200px]:inline">{tabs(key)}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="flex-1" />
        )}

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1 xl:ml-0 xl:shrink-0 xl:flex-nowrap">
          <Button
            variant="secondary"
            aria-label={t("newSheet")}
            title={t("newSheet")}
            className="px-0 w-11 2xl:w-auto 2xl:px-4"
            onClick={() => openDialog("newSheet")}
          >
            <Plus className="size-5" aria-hidden />
            <span className="hidden 2xl:inline">{t("newSheet").replace(/^\+\s*/, "")}</span>
          </Button>
          <Button
            variant="secondary"
            aria-label={t("sheets")}
            title={t("sheets")}
            className="px-0 w-11 2xl:w-auto 2xl:px-4"
            onClick={() => openSheets()}
          >
            <FolderOpen className="size-5" aria-hidden />
            <span className="hidden 2xl:inline">{t("sheets")}</span>
          </Button>

          {bridge ? (
            <>
              <button
                type="button"
                onClick={bridge.onSave}
                disabled={bridge.saving}
                className={cn(
                  buttonStyles({ variant: "primary" }),
                  "h-12 min-w-24 flex-col gap-0 px-2 py-0.5 leading-tight sm:min-w-28 sm:px-3",
                )}
              >
                <span className="font-semibold">{bridge.saving ? t("saving") : t("save")}</span>
                <span aria-live="polite" className="flex items-center gap-1 text-xs font-medium text-white/90">
                  <span aria-hidden className={cn("size-2 rounded-full", toneDot[bridge.statusTone])} />
                  {bridge.statusText}
                </span>
              </button>
              <Button
                variant="dark"
                disabled={bridge.pdfBusy}
                aria-busy={bridge.pdfBusy}
                aria-label={bridge.pdfBusy ? t("pdfBusy") : t("pdf")}
                title={bridge.pdfBusy ? t("pdfBusy") : t("pdf")}
                onClick={bridge.onPdf}
                data-pdf-button
                className="px-0 w-11 disabled:cursor-progress disabled:opacity-100 2xl:w-auto 2xl:px-4"
              >
                {bridge.pdfBusy ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden data-pdf-spinner />
                ) : (
                  <FileDown className="size-5" aria-hidden />
                )}
                <span className="hidden 2xl:inline">{bridge.pdfBusy ? t("pdfBusy") : t("pdf")}</span>
              </Button>
              <Button
                variant="secondary"
                disabled
                aria-label={`${t("emailOwner")} (${t("soonShort")})`}
                title={`${t("emailOwner")}: ${t("soonShort")}`}
                className="hidden px-0 w-11 sm:inline-flex"
              >
                <Mail className="size-5" aria-hidden />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t("reset")}
                title={t("reset")}
                onClick={bridge.onReset}
              >
                <RotateCcw className="size-5" aria-hidden />
              </Button>
            </>
          ) : null}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
