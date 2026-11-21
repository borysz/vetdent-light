"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { ApiClientError } from "@/client/api";
import { useLogin } from "@/client/hooks";
import { AuthCard, AuthError, AuthLink, authSubmitStyles } from "@/components/auth/auth-card";
import { inputStyles } from "@/components/ui/input-styles";

export function LoginForm() {
  const t = useTranslations("login");
  const errors = useTranslations("errors");
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await login.mutateAsync({ email: email.trim(), password });
      router.replace("/");
      router.refresh();
    } catch {
      // The error is shown from login.error below.
    }
  }

  const error = login.error;
  const errorCode = error instanceof ApiClientError ? error.code : error ? "internal_error" : null;

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")} onSubmit={onSubmit}>
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

      <label className="mt-4 block text-sm font-medium" htmlFor="password">
        {t("password")}
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${inputStyles} mt-1`}
      />

      {errorCode ? <AuthError>{errors(errorCode)}</AuthError> : null}

      <button type="submit" disabled={login.isPending || email.trim() === "" || password === ""} className={authSubmitStyles}>
        {login.isPending ? t("submitting") : t("submit")}
      </button>
      <AuthLink href="/forgot-password">{t("forgotPassword")}</AuthLink>
    </AuthCard>
  );
}
