"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { controlBase } from "@/components/ui/input-styles";
import { cn } from "@/lib/utils";


/** Label, control and error message wired together for assistive technology. */
export function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </label>
      {children({ id, invalid: Boolean(error), describedBy: error ? errorId : undefined })}
      {error ? (
        <p id={errorId} className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlBase, invalid ? "border-red-700" : "border-border", className)}
      {...props}
    />
  );
}

export const selectStyles = cn(controlBase, "border-border");
