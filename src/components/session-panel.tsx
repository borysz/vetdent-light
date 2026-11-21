"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLogout, useMe } from "@/client/hooks";

export function SessionPanel() {
  const t = useTranslations("session");
  const router = useRouter();
  const me = useMe();
  const logout = useLogout();

  async function onLogout() {
    await logout.mutateAsync();
    router.replace("/belepes");
    router.refresh();
  }

  if (me.isPending) return <p className="mt-6 text-foreground-muted">{t("loading")}</p>;
  if (!me.data) return null;

  const { member, clinic } = me.data;
  const name = [member.title, member.displayName].filter(Boolean).join(" ");

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
      <div>
        <p className="font-semibold">{t("greeting", { name })}</p>
        <p className="text-foreground-muted">{t("clinic", { clinic: clinic.name })}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={logout.isPending}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-4 font-medium outline-offset-2 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary-strong disabled:opacity-60"
      >
        <LogOut className="size-5" aria-hidden />
        {t("logout")}
      </button>
    </div>
  );
}
