"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "./button";

/** Previous/next paging; lists use this instead of scrolling. */
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
    <div className="flex items-center justify-between gap-2">
      <Button size="icon" aria-label={t("previousPage")} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="size-5" aria-hidden />
      </Button>
      <span className="text-sm text-foreground-muted tabular-nums">{t("pageOf", { page, pages, total })}</span>
      <Button size="icon" aria-label={t("nextPage")} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        <ChevronRight className="size-5" aria-hidden />
      </Button>
    </div>
  );
}
