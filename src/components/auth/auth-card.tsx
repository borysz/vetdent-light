import { Stethoscope } from "lucide-react";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";

/** The full-width submit button of the sign-in style forms. */
export const authSubmitStyles =
  "mt-6 h-11 w-full rounded-md bg-primary-strong px-4 text-base font-semibold text-white outline-offset-2 hover:bg-[#00645d] focus-visible:outline-2 focus-visible:outline-primary-strong disabled:cursor-not-allowed disabled:opacity-60";

/** Centered card with the app mark, a title and a form: sign-in, forgotten password, new password. */
export function AuthCard({
  title,
  subtitle,
  onSubmit,
  children,
}: {
  title: string;
  subtitle: string;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 sm:p-8" noValidate>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white" aria-hidden>
            <Stethoscope className="size-6" />
          </span>
          <span className="text-xl font-bold">VetDent Pro</span>
        </div>
        <h1 className="mt-6 text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-foreground-muted">{subtitle}</p>
        {children}
      </form>
    </main>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-4 text-sm font-medium text-red-700">
      {children}
    </p>
  );
}

/** A secondary link under the form (e.g. back to sign-in); at least 44 px tall to tap. */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-3 flex min-h-11 items-center justify-center rounded-md text-sm font-medium text-primary-strong underline-offset-4 outline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary-strong"
    >
      {children}
    </Link>
  );
}
