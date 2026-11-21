# VetDent Light – átadási jegyzék

@AGENTS.md

Állatorvosi fogászati kezelési lap webalkalmazás (kutya 42, macska 30 fog), tabletre és laptopra. A megrendelő nem fejlesztő. Az eredeti igény a helyi `template pics/MASTER_PROMPT.md` (Gitben nincs, a főmappában: `C:\Users\Borysz\Work\vetdent-light\template pics\`), a mintaképekkel együtt. A termékkontextus a `PRODUCT.md`-ben van.

## Nyelv
Csevegés: magyarul, tegezve. Felület: magyar, magázó, de **i18n-képes** (`docs/I18N.md` felülírja a MASTER_PROMPT egynyelvűségét). Kód, azonosítók, commit-üzenetek: angolul.

## Technológia
Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS 4, next-intl, zod, TanStack Query, Supabase (Postgres + Auth), Vitest. Tervezett: shadcn/ui, puppeteer-core (PDF, `check:layout`). A Next.js 16 eltér a megszokottól: a csomagolt dokumentáció a `node_modules/next/dist/docs/`-ban van, kódírás előtt olvasd el az érintett részt (a middleware neve `proxy`, `src/proxy.ts`).

## Szabályok
- API-first: minden adatművelet a `src/app/api/v1/**` alatt, a felületi kód nem importál `@/server/*`-t vagy `@supabase/*`-t (ESLint őrzi). Rétegek: `src/contracts`, `src/server`, `src/domain`, `src/client`, `src/components`.
- Felületi szöveg csak üzenetkulcsból (`messages/hu.json`); minden új szöveg `pending` ellenőrzési állapotú a `messages/review/hu.json`-ban (`npm run i18n:sync`). Csak állatorvos állít `approved`-ra.
- Szakmai adatot nem találunk ki; kételyek: `docs/SZAKMAI_ELLENORZES.md`. Az app rögzít, nem dönt.
- Szín és méret csak tokenből (`src/app/globals.css`). Érintési cél ≥ 44 px, beviteli mező 16 px, felugró ablak nem görgethető, a teljes fogtáblázat mindig egyben látszik.
- Nem kért dolgot nem építünk: ötlet → `docs/OTLETEK.md`. Döntések: `docs/DONTESEK.md`, kérdések: `docs/NYITOTT_KERDESEK.md`.
- Titkot soha ne olvass ki és ne írj ki; a `.env*` fájlok Gitben nincsenek (`.env.example` igen).

## Parancsok
`npm run dev` (port **6438**), `npm run build`, `npm run check` (lint + typecheck + test + i18n), `npm run i18n:sync`.

## Gépfüggő tudnivalók (Windows, nincs rendszergazdai jog)
- A shell nem örökli a friss PATH-t: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`, és `npm.cmd` / `npx.cmd`.
- Chrome headless: `C:\Program Files\Google\Chrome\Application\chrome.exe` (az Edge itt nem indul).
- Munkafán (worktree) a Gitben nem lévő fájlok (`template pics/`, `.env.supabase`) nincsenek meg: abszolút úttal olvasd őket a főmappából. `.env.local`-t át kell másolni.
- Git: távoli `git@github.com:borysz/vetdent-light.git`, ág `main`; `--force` soha; munkafán a saját ágra pusholj.
- Supabase CLI: `npx supabase projects list`; ha nincs belépve, a felhasználó futtassa a `npx supabase login` parancsot a saját termináljában. A céges hálózati védelem miatt a tanúsítvány-ellenőrzést nem kapcsoljuk ki.

## Állapot
1. fázis (alapozás) kész, kivéve a Supabase CLI összekötését (`docs/NYITOTT_KERDESEK.md`). Következik: 2. fázis (adatbázis, API-váz, belépés).
