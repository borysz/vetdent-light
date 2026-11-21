"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { archRow, type Arch, type Species, type Tooth } from "@/domain/teeth/catalog";
import { packChips, viewOf, type Chip, type ToothView } from "@/domain/teeth/derive";
import type { TeethRecord } from "@/domain/teeth/entry";
import { cn } from "@/lib/utils";
import { ToothDrawing } from "./tooth-drawing";
import { useToothNames } from "./use-tooth-name";

/** Width of one monospace character of the 11 px chip text (JetBrains Mono, slightly tightened). */
const CHIP_CHAR_PX = 6.3;

const chipStyles: Record<Chip["kind"], string> = {
  treatment: "bg-(--chip-treatment-bg) text-(--chip-treatment-ink)",
  pathology: "bg-(--chip-pathology-bg) text-(--chip-pathology-ink)",
  extraction: "bg-(--chip-extraction-bg) text-(--chip-extraction-ink)",
};

type RowKey = "calculus" | "gingivitis" | "mobility" | "other" | "number" | "drawing";
const ROWS: Record<Arch, RowKey[]> = {
  // Crowns of both arches face the divider between the blocks, exactly as on the sample sheets.
  upper: ["calculus", "gingivitis", "mobility", "other", "number", "drawing"],
  lower: ["drawing", "number", "calculus", "gingivitis", "mobility", "other"],
};
const ROW_SIZES: Record<RowKey, string> = {
  calculus: "var(--chart-index-h)",
  gingivitis: "var(--chart-index-h)",
  mobility: "var(--chart-index-h)",
  other: "auto",
  number: "var(--chart-number-h)",
  drawing: "var(--chart-tooth-h)",
};

/**
 * The dental treatment chart (modified Triadan): two blocks (maxilla, mandibula), the patient's right
 * side on the left of the screen, one evenly spaced column per tooth in each half. A whole column is one
 * touch target, because on a portrait tablet a column is only about 30 px wide.
 */
export function DentalChart({
  species,
  teeth,
  selected,
  onToothClick,
  maxChipLines,
  compact = false,
  className,
}: {
  species: Species;
  teeth: TeethRecord;
  selected: ReadonlySet<string>;
  /** Omit for a read-only chart (report, print). */
  onToothClick?: (code: string, event: MouseEvent) => void;
  /** Lines of codes shown in the "other" cell before the rest is summarised as "+n". */
  maxChipLines: number;
  /** Fixed row sizes independent of the screen (report preview, print and PDF must look the same everywhere). */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("chart");
  return (
    <div
      data-chart
      className={cn(
        "rounded-xl border border-border bg-surface",
        compact
          ? "p-2 [--chart-index-h:20px] [--chart-number-h:18px] [--chart-tooth-h:44px] [--chart-label:104px] [--chart-mid:10px]"
          : "p-1.5 [--chart-index-h:18px] [--chart-number-h:17px] [--chart-tooth-h:40px] [@media(min-height:700px)]:[--chart-index-h:24px] [@media(min-height:700px)]:[--chart-tooth-h:56px] [--chart-label:104px] [--chart-mid:10px] sm:p-2 lg:[--chart-label:132px] lg:[--chart-mid:18px]",
        className,
      )}
    >
      <div className="grid grid-cols-[var(--chart-label)_1fr_auto_1fr] items-center pb-1 text-[11px] font-semibold tracking-wide uppercase">
        <span />
        <span className="text-foreground-muted">{t("rightSide")}</span>
        <span className="px-2 font-bold tracking-widest text-chart-title">{species === "dog" ? t("centerDog") : t("centerCat")}</span>
        <span className="text-right text-foreground-muted">{t("leftSide")}</span>
      </div>
      <ArchBlock species={species} arch="upper" teeth={teeth} selected={selected} onToothClick={onToothClick} maxChipLines={maxChipLines} compact={compact} />
      <div className="my-1 border-t border-border" />
      <ArchBlock species={species} arch="lower" teeth={teeth} selected={selected} onToothClick={onToothClick} maxChipLines={maxChipLines} compact={compact} />
      <div className="flex flex-wrap justify-between gap-x-4 pt-1 text-[11px] text-foreground-muted">
        <span>{t("legendMarks")}</span>
        {onToothClick ? <span>{t("legendClicks")}</span> : null}
      </div>
    </div>
  );
}

function ArchBlock({
  species,
  arch,
  teeth,
  selected,
  onToothClick,
  maxChipLines,
  compact,
}: {
  species: Species;
  arch: Arch;
  teeth: TeethRecord;
  selected: ReadonlySet<string>;
  onToothClick?: (code: string, event: MouseEvent) => void;
  maxChipLines: number;
  compact: boolean;
}) {
  const t = useTranslations("chart");
  const names = useToothNames();
  const { right, left } = archRow(species, arch);
  const perSide = right.length;
  const rows = ROWS[arch];

  // The "other" cell packs its codes by the real column width.
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnPx, setColumnPx] = useState(48);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const cell = grid.querySelector<HTMLElement>("[data-other-cell]");
      if (cell) setColumnPx(cell.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [perSide]);
  const charsPerLine = Math.max(3, Math.floor(columnPx / CHIP_CHAR_PX));

  const shortLabels: Partial<Record<RowKey, string>> = {
    calculus: t("rowCalculusShort"),
    gingivitis: t("rowGingivitisShort"),
  };
  const labels: Record<RowKey, string> = {
    calculus: t("rowCalculus"),
    gingivitis: t("rowGingivitis"),
    mobility: t("rowMobility"),
    other: t("rowOther"),
    number: t("rowTooth"),
    drawing: arch === "upper" ? t("maxilla") : t("mandibula"),
  };

  const style: CSSProperties = {
    gridTemplateColumns: `var(--chart-label) repeat(${perSide}, minmax(0, 1fr)) var(--chart-mid) repeat(${perSide}, minmax(0, 1fr))`,
    gridTemplateRows: rows.map((row) => ROW_SIZES[row]).join(" "),
  };
  const columnOf = (sideIndex: 0 | 1, index: number) => (sideIndex === 0 ? index + 2 : perSide + 3 + index);

  return (
    <div ref={gridRef} className="grid gap-0.5" style={style}>
      {rows.map((row, rowIndex) => (
        <span
          key={row}
          style={{ gridRow: rowIndex + 1, gridColumn: 1 }}
          className={cn(
            "flex items-center pr-1 text-[11px] leading-[1.05] font-semibold",
            row === "number" || row === "drawing" ? "font-bold tracking-wide uppercase" : "",
            row === "drawing" ? "text-xs" : "",
          )}
        >
          <RowLabel full={labels[row]} short={shortLabels[row]} compact={compact} />
        </span>
      ))}

      <span
        aria-hidden
        style={{ gridRow: `1 / span ${rows.length}`, gridColumn: perSide + 2 }}
        className="mx-auto h-full border-l-2 border-dashed border-midline"
      />

      {[right, left].map((side, sideIndex) =>
        side.map((tooth, index) => (
          <ToothColumn
            key={tooth.code}
            tooth={tooth}
            view={viewOf(teeth[tooth.code])}
            column={columnOf(sideIndex as 0 | 1, index)}
            rows={rows}
            selected={selected.has(tooth.code)}
            label={t("toothLabel", { code: tooth.code, name: names.name(tooth) })}
            onClick={onToothClick}
            charsPerLine={charsPerLine}
            maxChipLines={maxChipLines}
          />
        )),
      )}
    </div>
  );
}

/** Row label on one line: the short text unless there is room for the full one (wide screens, not in the report). */
function RowLabel({ full, short, compact }: { full: string; short?: string; compact: boolean }) {
  if (!short || short === full) return <span className="whitespace-nowrap">{full}</span>;
  if (compact) return <span className="whitespace-nowrap">{short}</span>;
  return (
    <span className="whitespace-nowrap">
      <span className="lg:hidden">{short}</span>
      <span className="hidden lg:inline">{full}</span>
    </span>
  );
}

function ToothColumn({
  tooth,
  view,
  column,
  rows,
  selected,
  label,
  onClick,
  charsPerLine,
  maxChipLines,
}: {
  tooth: Tooth;
  view: ToothView;
  column: number;
  rows: RowKey[];
  selected: boolean;
  label: string;
  onClick?: (code: string, event: MouseEvent) => void;
  charsPerLine: number;
  maxChipLines: number;
}) {
  const place = (row: RowKey): CSSProperties => ({ gridRow: rows.indexOf(row) + 1, gridColumn: column });
  const indexCell = (row: "calculus" | "gingivitis" | "mobility") => {
    const value = view[row];
    return (
      <span
        key={row}
        style={place(row)}
        className={cn(
          "flex items-center justify-center rounded-[4px] border font-mono text-[11px] font-bold tabular-nums",
          selected
            ? "border-primary bg-primary-soft"
            : value !== null
              ? "border-(--cell-value-border) bg-(--cell-value-bg)"
              : "border-(--cell-border) bg-(--cell-bg)",
        )}
      >
        {value ?? ""}
      </span>
    );
  };
  const packed = packChips(view.chips, charsPerLine, maxChipLines);

  return (
    <>
      {indexCell("calculus")}
      {indexCell("gingivitis")}
      {indexCell("mobility")}
      <span
        data-other-cell
        style={place("other")}
        className={cn(
          "flex min-h-(--chart-index-h) flex-col items-center justify-center gap-px rounded-[4px] border py-px",
          selected
            ? "border-primary"
            : view.cellTone === "extraction"
              ? "border-(--mark-extraction-stroke)"
              : view.cellTone === "pathology"
                ? "border-(--chip-pathology-bg)"
                : "border-(--cell-border)",
          view.cellTone === "extraction" ? "bg-(--mark-extraction-fill)" : view.cellTone === "pathology" ? "bg-[#faf5ff]" : "bg-(--cell-bg)",
        )}
      >
        {packed.lines.map((line, lineIndex) => (
          <span key={lineIndex} className="flex gap-0.5">
            {line.map((chip, chipIndex) => (
              <span
                key={chipIndex}
                className={cn("rounded-[3px] px-px font-mono text-[11px] leading-[14px] font-bold tracking-[-0.03em]", chipStyles[chip.kind])}
              >
                {chip.label}
              </span>
            ))}
          </span>
        ))}
      </span>
      <span
        style={place("number")}
        className={cn(
          "flex items-center justify-center rounded-[4px] font-mono text-xs font-bold tabular-nums",
          selected ? "bg-primary-strong text-white" : "",
        )}
      >
        {tooth.code}
      </span>
      <span style={place("drawing")} className="flex items-center justify-center">
        <ToothDrawing shape={tooth.shape} arch={tooth.arch} width={tooth.width} view={view} selected={selected} className="h-full w-full" />
      </span>
      {onClick ? (
        <button
          type="button"
          data-touch="column"
          data-tooth={tooth.code}
          aria-label={label}
          aria-pressed={selected}
          onClick={(event) => onClick(tooth.code, event)}
          style={{ gridRow: `1 / span ${rows.length}`, gridColumn: column }}
          className="z-10 rounded-[5px] outline-offset-1 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary-strong"
        />
      ) : null}
    </>
  );
}
