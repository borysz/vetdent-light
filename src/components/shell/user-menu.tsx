"use client";

import { Building2, LogOut, UserRound, UserRoundPen } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLogout, useMe } from "@/client/hooks";
import { buttonStyles } from "@/components/ui/button";
import { useShell } from "./shell-context";

const item =
  "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-base outline-none select-none data-[highlighted]:bg-surface-muted";

export function UserMenu() {
  const t = useTranslations("header");
  const router = useRouter();
  const me = useMe();
  const logout = useLogout();
  const { openDialog, guard } = useShell();

  async function onLogout() {
    await logout.mutateAsync();
    router.replace("/login");
    router.refresh();
  }

  const member = me.data?.member;
  const name = member?.displayName ?? "";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t("userMenu")}
        title={name}
        className={buttonStyles({ variant: "secondary", size: "icon" })}
      >
        <UserRound className="size-5" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          {me.data ? (
            <div className="border-b border-border px-3 py-2">
              <p className="font-semibold">{name}</p>
              <p className="text-sm text-foreground-muted">{me.data.clinic.name}</p>
            </div>
          ) : null}
          <DropdownMenu.Item className={item} onSelect={() => openDialog("clinic")}>
            <Building2 className="size-5" aria-hidden />
            {t("clinicData")}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => openDialog("profile")}>
            <UserRoundPen className="size-5" aria-hidden />
            {t("profile")}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={item}
            onSelect={() => guard(() => void onLogout())}
          >
            <LogOut className="size-5" aria-hidden />
            {t("logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
