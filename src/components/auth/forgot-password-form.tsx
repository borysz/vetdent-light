"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { ApiClientError } from "@/client/api";
import { useRequestPasswordReset } from "@/client/hooks";
import { inputStyles } from "@/components/ui/input-styles";
import { AuthCard, AuthError, AuthLink, authSubmitStyles } from "./auth-card";

/** Ask for a password reset e-mail. After sending, the same neutral notice shows whether or not the address exists. */
export function ForgotPasswordForm({ linkInvalid }: { linkInvalid: boolean }) {
  const t = useTranslations("forgotPassword");
  const errors = useTranslations("errors");
  const reset = useRequestPasswordReset();
  const [email, setEmail] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await reset.mutateAsync(email.trim());
    } catch {
      // The error is shown from reset.error below.
    }
  }

  const error = reset.error;
  const errorCode = error instanceof ApiClientError ? error.code : error ? "internal_error" : null;

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")} onSubmit={onSubmit}>
      {linkInvalid && !reset.isSuccess ? <AuthError>{t("linkInvalid")}</AuthError> : null}

      {reset.isSuccess ? (
        <p role="status" className="mt-6 rounded-md border border-primary/30 bg-primary-soft p-3 text-sm">
          {t("sent")}
        </p>
      ) : (
        <>
          <label className="mt-6 block text-sm font-medium" htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputStyles} mt-1`}
          />
          {errorCode ? <AuthError>{errors(errorCode)}</AuthError> : null}
          <button type="submit" disabled={reset.isPending || email.trim() === ""} className={authSubmitStyles}>
            {reset.isPending ? t("submitting") : t("submit")}
          </button>
        </>
      )}
      <AuthLink href="/login">{t("backToLogin")}</AuthLink>
    </AuthCard>
  );
}
