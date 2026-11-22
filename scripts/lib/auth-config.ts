/**
 * The Supabase Auth settings this app needs, as a minimal change set for the Management API
 * (PATCH /v1/projects/{ref}/config/auth). Only the fields named here are ever sent, so nothing else
 * (for example the disabled self sign-up) can change by accident.
 */

/** The fields of the auth config this script reads or writes. */
export type AuthConfig = {
  site_url?: string | null;
  uri_allow_list?: string | null;
  disable_signup?: boolean | null;
  smtp_host?: string | null;
  smtp_port?: string | number | null;
  smtp_user?: string | null;
  smtp_admin_email?: string | null;
  smtp_sender_name?: string | null;
  rate_limit_email_sent?: number | null;
};

export type SmtpSettings = {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderEmail: string;
  senderName: string;
};

/** Redirect URLs the password reset link may return to: the site and the local development server. */
export function redirectUrlsFor(siteUrl: string): string[] {
  return [`${siteUrl.replace(/\/+$/, "")}/**`, "http://localhost:6438/**"];
}

/** The project ref from the project URL (https://<ref>.supabase.co). */
export function projectRefOf(supabaseUrl: string): string {
  const host = new URL(supabaseUrl).hostname;
  const match = /^([a-z0-9]+)\.supabase\.co$/.exec(host);
  if (!match) throw new Error(`Not a Supabase project URL: ${host}`);
  return match[1];
}

function splitList(list: string | null | undefined): string[] {
  return (list ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * The change set for the URL settings: the site URL, and the redirect URLs added to the ones already allowed
 * (existing entries are kept). Empty when everything is already set.
 */
export function urlChanges(current: AuthConfig, siteUrl: string): Pick<AuthConfig, "site_url" | "uri_allow_list"> {
  const changes: Pick<AuthConfig, "site_url" | "uri_allow_list"> = {};
  const site = siteUrl.replace(/\/+$/, "");
  if ((current.site_url ?? "").replace(/\/+$/, "") !== site) changes.site_url = site;
  const existing = splitList(current.uri_allow_list);
  const missing = redirectUrlsFor(site).filter((url) => !existing.includes(url));
  if (missing.length > 0) changes.uri_allow_list = [...existing, ...missing].join(",");
  return changes;
}

/** The change set for a custom SMTP server (the password is sent, never printed). */
export function smtpChanges(smtp: SmtpSettings): Record<string, string | number> {
  return {
    smtp_host: smtp.host,
    smtp_port: String(smtp.port),
    smtp_user: smtp.user,
    smtp_pass: smtp.pass,
    smtp_admin_email: smtp.senderEmail,
    smtp_sender_name: smtp.senderName,
  };
}

/** A printable description of a change set, with secrets masked. */
export function describeChanges(changes: Record<string, unknown>): string[] {
  return Object.entries(changes).map(([key, value]) => `  ${key}: ${/pass/i.test(key) ? "********" : String(value)}`);
}
