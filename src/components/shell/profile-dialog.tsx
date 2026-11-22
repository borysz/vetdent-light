"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ApiClientError } from "@/client/api";
import { useChangePassword, useMe, useUpdateProfile } from "@/client/hooks";
import { MIN_PASSWORD_LENGTH } from "@/contracts/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { inputStyles } from "@/components/ui/input-styles";
import { useShell } from "./shell-context";

const errorCodeOf = (error: unknown) => (error instanceof ApiClientError ? error.code : error ? "internal_error" : null);

/** The signed-in user's own data: the name as it appears on sheets (title included), and a new password. */
export function ProfileDialog() {
  const t = useTranslations("profile");
  const { dialog, closeDialog } = useShell();
  const open = dialog === "profile";
  const me = useMe();
  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
      <DialogContent title={t("title")} description={me.data?.user.email ?? undefined} size="md">
        {me.data ? (
          <div className="flex flex-col gap-4">
            <NameForm initial={me.data.member.displayName} />
            <PasswordForm />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Status({ error, done, doneText }: { error: unknown; done: boolean; doneText: string }) {
  const errors = useTranslations("errors");
  const code = errorCodeOf(error);
  return (
    <p role="status" className={code ? "text-sm font-medium text-red-700" : "text-sm text-primary-strong"}>
      {code ? errors(code) : done ? doneText : " "}
    </p>
  );
}

function NameForm({ initial }: { initial: string }) {
  const t = useTranslations("profile");
  const update = useUpdateProfile();
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync(name.trim());
      setSaved(true);
    } catch {
      // Shown by Status.
    }
  }

  const unchanged = name.trim() === initial.trim();
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3" data-profile-name>
      <h3 className="font-semibold">{t("nameTitle")}</h3>
      <label className="block text-sm font-medium" htmlFor="profile-name">
        {t("name")}
      </label>
      <input
        id="profile-name"
        className={inputStyles}
        autoComplete="name"
        maxLength={120}
        value={name}
        onChange={(event) => {
          setSaved(false);
          setName(event.target.value);
        }}
      />
      <p className="text-xs text-foreground-muted">{t("nameHint")}</p>
      <div className="flex items-center justify-between gap-3">
        <Status error={update.error} done={saved} doneText={t("nameSaved")} />
        <Button type="submit" variant="primary" disabled={update.isPending || name.trim() === "" || unchanged}>
          {update.isPending ? t("saving") : t("saveName")}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const t = useTranslations("profile");
  const reset = useTranslations("resetPassword");
  const change = useChangePassword();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [localError, setLocalError] = useState<"tooShort" | "mismatch" | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setDone(false);
    if (password.length < MIN_PASSWORD_LENGTH) return setLocalError("tooShort");
    if (password !== again) return setLocalError("mismatch");
    setLocalError(null);
    try {
      await change.mutateAsync(password);
      setPassword("");
      setAgain("");
      setDone(true);
    } catch {
      // Shown by Status.
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3" data-profile-password>
      <h3 className="font-semibold">{t("passwordTitle")}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {reset("password")}
          <input
            id="profile-password"
            type="password"
            autoComplete="new-password"
            className={`${inputStyles} mt-1`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          {reset("passwordAgain")}
          <input
            id="profile-password-again"
            type="password"
            autoComplete="new-password"
            className={`${inputStyles} mt-1`}
            value={again}
            onChange={(event) => setAgain(event.target.value)}
          />
        </label>
      </div>
      <p className="text-xs text-foreground-muted">{reset("subtitle", { min: MIN_PASSWORD_LENGTH })}</p>
      <div className="flex items-center justify-between gap-3">
        {localError ? (
          <p role="status" className="text-sm font-medium text-red-700">
            {reset(localError, { min: MIN_PASSWORD_LENGTH })}
          </p>
        ) : (
          <Status error={change.error} done={done} doneText={t("passwordSaved")} />
        )}
        <Button type="submit" variant="primary" disabled={change.isPending || password === "" || again === ""}>
          {change.isPending ? t("saving") : t("savePassword")}
        </Button>
      </div>
    </form>
  );
}
