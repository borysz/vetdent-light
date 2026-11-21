"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "./button";

/** First / previous / next / last paging; lists use this instead of scrolling. */
export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const t = useTranslations("common");
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center gap-1">
      <Button size="icon" aria-label={t("firstPage")} title={t("firstPage")} disabled={page <= 1} onClick={() => onPage(1)}>
        <ChevronsLeft className="size-5" aria-hidden />
      </Button>
      <Button size="icon" aria-label={t("previousPage")} title={t("previousPage")} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="size-5" aria-hidden />
      </Button>
      <span className="min-w-0 flex-1 text-center text-sm text-foreground-muted tabular-nums">{t("pageOf", { page, pages, total })}</span>
      <Button size="icon" aria-label={t("nextPage")} title={t("nextPage")} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        <ChevronRight className="size-5" aria-hidden />
      </Button>
      <Button size="icon" aria-label={t("lastPage")} title={t("lastPage")} disabled={page >= pages} onClick={() => onPage(pages)}>
        <ChevronsRight className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
