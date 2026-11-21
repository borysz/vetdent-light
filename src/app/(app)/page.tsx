import { getTranslations } from "next-intl/server";
import { SessionPanel } from "@/components/session-panel";

export default async function Home() {
  const app = await getTranslations("app");
  const home = await getTranslations("home");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <section className="w-full max-w-xl rounded-xl border border-border bg-surface p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{app("name")}</h1>
          <span className="rounded-md border border-primary/30 bg-primary-soft px-2 py-1 font-mono text-xs font-medium text-primary">
            {app("badge")}
          </span>
        </div>
        <h2 className="mt-6 text-lg font-semibold">{home("placeholderTitle")}</h2>
        <p className="mt-2 text-foreground-muted">{home("placeholderBody")}</p>
        <SessionPanel />
      </section>
    </main>
  );
}
