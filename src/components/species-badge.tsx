import { useTranslations } from "next-intl";
import type { Species } from "@/contracts/patients";
import { cn } from "@/lib/utils";

/** Species label in the species colour (dog orange, cat purple), as on the sample sheets. */
export function SpeciesBadge({ species, className }: { species: Species; className?: string }) {
  const t = useTranslations("common");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-sm font-medium",
        species === "dog"
          ? "border-dog/40 bg-dog-soft text-dog-ink"
          : "border-cat/30 bg-cat-soft text-cat-ink",
        className,
      )}
    >
      {t(species)}
    </span>
  );
}
