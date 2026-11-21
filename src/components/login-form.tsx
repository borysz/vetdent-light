"use client";

import { Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { ApiClientError } from "@/client/api";
import { useLogin } from "@/client/hooks";

const field =
  "h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary-strong";

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
    <main className="flex flex-1 items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-border bg-surface p-8" noValidate>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white" aria-hidden>
            <Stethoscope className="size-6" />
          </span>
          <span className="text-xl font-bold">VetDent Pro</span>
        </div>
        <h1 className="mt-6 text-lg font-semibold">{t("title")}</h1>
        <p className="mt-1 text-foreground-muted">{t("subtitle")}</p>

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
          className={`${field} mt-1`}
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
          className={`${field} mt-1`}
        />

        {errorCode ? (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {errors(errorCode)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={login.isPending || email.trim() === "" || password === ""}
          className="mt-6 h-11 w-full rounded-md bg-primary-strong px-4 text-base font-semibold text-white outline-offset-2 hover:bg-[#00645d] focus-visible:outline-2 focus-visible:outline-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {login.isPending ? t("submitting") : t("submit")}
        </button>
      </form>
    </main>
  );
}
