"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ApiClientError } from "@/client/api";
import { useClinic, useUpdateClinic } from "@/client/hooks";
import type { Clinic } from "@/contracts/clinic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { inputStyles } from "./search-field";
import { useShell } from "./shell-context";

/** Letterhead data for the PDF (name, address, phone, e-mail). */
export function ClinicDialog() {
  const t = useTranslations("clinic");
  const { dialog, closeDialog } = useShell();
  const open = dialog === "clinic";
  const clinic = useClinic(open);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
      <DialogContent title={t("title")} description={t("description")} size="md">
        {clinic.data ? <ClinicForm clinic={clinic.data} onDone={closeDialog} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ClinicForm({ clinic, onDone }: { clinic: Clinic; onDone: () => void }) {
  const t = useTranslations("clinic");
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const update = useUpdateClinic();
  const [form, setForm] = useState({
    name: clinic.name,
    postalCode: clinic.postalCode ?? "",
    city: clinic.city ?? "",
    street: clinic.street ?? "",
    phone: clinic.phone ?? "",
    email: clinic.email ?? "",
  });
  const [saved, setSaved] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync(form);
      setSaved(true);
    } catch {
      // Shown from update.error.
    }
  }

  const errorCode = update.error instanceof ApiClientError ? update.error.code : update.error ? "internal_error" : null;
  const fields: { key: keyof typeof form; label: string; span?: string; type?: string; autoComplete?: string }[] = [
    { key: "name", label: t("name"), span: "sm:col-span-2" },
    { key: "postalCode", label: t("postalCode"), autoComplete: "postal-code" },
    { key: "city", label: t("city") },
    { key: "street", label: t("street"), span: "sm:col-span-2" },
    { key: "phone", label: t("phone"), type: "tel" },
    { key: "email", label: t("email"), type: "email" },
  ];

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className={`block text-sm font-medium ${field.span ?? ""}`}>
          {field.label}
          <input
            className={`${inputStyles} mt-1`}
            type={field.type ?? "text"}
            autoComplete={field.autoComplete}
            value={form[field.key]}
            onChange={(event) => set(field.key)(event.target.value)}
          />
        </label>
      ))}
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p role="status" className={errorCode ? "text-sm font-medium text-red-700" : "text-sm text-primary-strong"}>
          {errorCode ? errors(errorCode) : saved ? t("saved") : " "}
        </p>
        <div className="flex gap-2">
          <Button onClick={onDone}>{common("close")}</Button>
          <Button type="submit" variant="primary" disabled={update.isPending || form.name.trim() === ""}>
            {t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}

