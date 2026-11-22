"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { ApiClientError } from "@/client/api";
import { useChangePassword } from "@/client/hooks";
import { MIN_PASSWORD_LENGTH } from "@/contracts/auth";
import { inputStyles } from "@/components/ui/input-styles";
import { AuthCard, AuthError, AuthLink, authSubmitStyles } from "./auth-card";

/**
 * Set a new password: after a reset link (which signs the user in) or from the user menu (Change password).
 * Asked twice; afterwards the app opens.
 */
export function ResetPasswordForm() {
  const t = useTranslations("resetPassword");
  const errors = useTranslations("errors");
  const router = useRouter();
  const change = useChangePassword();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [localError, setLocalError] = useState<"tooShort" | "mismatch" | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) return setLocalError("tooShort");
    if (password !== again) return setLocalError("mismatch");
    setLocalError(null);
    try {
      await change.mutateAsync(password);
      router.replace("/");
      router.refresh();
    } catch {
      // The error is shown from change.error below.
    }
  }

  const error = change.error;
  const errorCode = error instanceof ApiClientError ? error.code : error ? "internal_error" : null;

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle", { min: MIN_PASSWORD_LENGTH })} onSubmit={onSubmit}>
      <label className="mt-6 block text-sm font-medium" htmlFor="new-password">
        {t("password")}
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${inputStyles} mt-1`}
      />
      <label className="mt-4 block text-sm font-medium" htmlFor="new-password-again">
        {t("passwordAgain")}
      </label>
      <input
        id="new-password-again"
        type="password"
        autoComplete="new-password"
        required
        value={again}
        onChange={(e) => setAgain(e.target.value)}
        className={`${inputStyles} mt-1`}
      />

      {localError ? <AuthError>{t(localError, { min: MIN_PASSWORD_LENGTH })}</AuthError> : null}
      {!localError && errorCode ? <AuthError>{errors(errorCode)}</AuthError> : null}

      <button type="submit" disabled={change.isPending || password === "" || again === ""} className={authSubmitStyles}>
        {change.isPending ? t("submitting") : t("submit")}
      </button>
      <AuthLink href="/">{t("cancel")}</AuthLink>
    </AuthCard>
  );
}
