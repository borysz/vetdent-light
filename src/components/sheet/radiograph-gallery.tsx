"use client";

import { ChevronLeft, ChevronRight, ImageUp, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type DragEvent } from "react";
import { ApiClientError } from "@/client/api";
import { useDeleteRadiograph, useRadiographs, useUploadRadiograph } from "@/client/hooks";
import { RADIOGRAPH_MAX_BYTES, RADIOGRAPH_TYPES, type Radiograph } from "@/contracts/radiographs";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ACCEPT = RADIOGRAPH_TYPES.join(",");

/**
 * Radiograph images of a sheet (tab 2): drop files on the box or pick them, thumbnails, a large view with
 * previous/next, and delete. Images belong to a saved sheet, so a new sheet asks to be saved first.
 */
export function RadiographGallery({ sheetId }: { sheetId: string | null }) {
  const t = useTranslations("radiographs");
  const errorText = useTranslations("errors");
  const list = useRadiographs(sheetId);
  const upload = useUploadRadiograph(sheetId);
  const remove = useDeleteRadiograph(sheetId);
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Radiograph | null>(null);

  const items = list.data?.items ?? [];

  async function addFiles(files: File[]) {
    if (!sheetId || files.length === 0) return;
    setProblems([]);
    const failed: string[] = [];
    // One at a time: a tablet on a weak network should not send ten large images at once.
    for (const file of files) {
      if (!(RADIOGRAPH_TYPES as readonly string[]).includes(file.type)) {
        failed.push(t("uploadFailed", { name: file.name, reason: errorText("unsupported_file_type") }));
        continue;
      }
      if (file.size > RADIOGRAPH_MAX_BYTES) {
        failed.push(t("uploadFailed", { name: file.name, reason: errorText("file_too_large") }));
        continue;
      }
      setPending((names) => [...names, file.name]);
      try {
        await upload.mutateAsync(file);
      } catch (error) {
        const code = error instanceof ApiClientError ? error.code : "internal_error";
        failed.push(t("uploadFailed", { name: file.name, reason: errorText(code) }));
      } finally {
        // Remove one entry with this name (two files may share a name).
        setPending((names) => {
          const at = names.indexOf(file.name);
          return at < 0 ? names : [...names.slice(0, at), ...names.slice(at + 1)];
        });
      }
    }
    setProblems(failed);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void addFiles([...event.dataTransfer.files]);
  }

  if (!sheetId) {
    return <p className="rounded-lg border border-dashed border-border px-3 py-4 text-foreground-muted">{t("saveFirst")}</p>;
  }

  const viewed = viewIndex !== null ? items[viewIndex] : undefined;

  return (
    <div className="flex flex-col gap-2" data-radiographs>
      <h3 className="text-base font-semibold">{t("title")}</h3>

      <div
        data-drop-zone
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors",
          dragging ? "border-primary bg-primary-soft" : "border-border bg-surface-muted",
        )}
      >
        <ImageUp className="size-6 text-foreground-muted" aria-hidden />
        <span className="text-foreground-muted">{dragging ? t("dropNow") : t("dropHint")}</span>
        <Button variant="primary" onClick={() => input.current?.click()}>
          {t("choose")}
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-radiograph-input
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            void addFiles(files);
          }}
        />
        <p className="basis-full text-xs text-foreground-muted">{t("limits")}</p>
      </div>

      {problems.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 || pending.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-busy={pending.length > 0}>
          {items.map((item, index) => (
            <li key={item.id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-dark" data-radiograph>
              <button
                type="button"
                className="size-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong"
                aria-label={t("open", { name: item.fileName })}
                title={item.fileName}
                onClick={() => setViewIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- private image from the API, sent with the session cookie */}
                <img src={item.imageUrl} alt={item.fileName} className="size-full object-cover" loading="lazy" />
              </button>
              <Button
                size="icon"
                variant="secondary"
                aria-label={t("delete")}
                title={t("delete")}
                className="absolute top-1 right-1"
                onClick={() => setToDelete(item)}
              >
                <Trash2 className="size-5 text-red-700" aria-hidden />
              </Button>
            </li>
          ))}
          {pending.map((name, index) => (
            <li
              key={`${name}-${index}`}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface-muted p-1 text-center text-xs text-foreground-muted"
              data-radiograph-pending
            >
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <span>{t("uploading")}</span>
              <span className="w-full truncate">{name}</span>
            </li>
          ))}
        </ul>
      ) : list.data ? (
        <p className="text-sm text-foreground-muted">{t("empty")}</p>
      ) : null}

      <Dialog open={viewed !== undefined} onOpenChange={(open) => !open && setViewIndex(null)}>
        {viewed ? (
          <DialogContent title={viewed.fileName} size="xl">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center rounded-lg bg-dark">
                {/* eslint-disable-next-line @next/next/no-img-element -- private image from the API */}
                <img
                  src={viewed.imageUrl}
                  alt={viewed.fileName}
                  className="max-h-[calc(100dvh-12rem)] w-auto max-w-full object-contain"
                  data-radiograph-large
                />
              </div>
              {items.length > 1 ? (
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="icon"
                    aria-label={t("previous")}
                    title={t("previous")}
                    onClick={() => setViewIndex((i) => ((i ?? 0) - 1 + items.length) % items.length)}
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </Button>
                  <span className="text-sm text-foreground-muted tabular-nums">
                    {t("position", { index: (viewIndex ?? 0) + 1, count: items.length })}
                  </span>
                  <Button
                    size="icon"
                    aria-label={t("next")}
                    title={t("next")}
                    onClick={() => setViewIndex((i) => ((i ?? 0) + 1) % items.length)}
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        title={t("deleteTitle")}
        body={toDelete ? t("deleteBody", { name: toDelete.fileName }) : ""}
        onDismiss={() => setToDelete(null)}
        actions={[
          { label: t("cancel"), onClick: () => setToDelete(null) },
          {
            label: t("deleteConfirm"),
            variant: "danger",
            onClick: () => {
              if (toDelete) remove.mutate(toDelete.id);
              setToDelete(null);
              setViewIndex(null);
            },
          },
        ]}
      />
    </div>
  );
}
