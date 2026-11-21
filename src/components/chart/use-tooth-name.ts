"use client";

import { useTranslations } from "next-intl";
import type { Tooth } from "@/domain/teeth/catalog";

/** Localised tooth names (e.g. the fourth premolar, PM4) and quadrant names. */
export function useToothNames() {
  const t = useTranslations("teeth");
  return {
    name: (tooth: Tooth) => (tooth.kind === "canine" ? t("canine") : t(tooth.kind, { n: tooth.index })),
    quadrant: (tooth: Tooth) => t(`quadrant${tooth.quadrant}`),
  };
}
