# VetDent Light – átadási jegyzék

@AGENTS.md

Állatorvosi fogászati kezelési lap webalkalmazás (kutya 42, macska 30 fog), tabletre és laptopra. A megrendelő nem fejlesztő. Az eredeti igény a helyi `template pics/MASTER_PROMPT.md` (Gitben nincs, a főmappában: `C:\Users\Borysz\Work\vetdent-light\template pics\`), a mintaképekkel együtt. A termékkontextus a `PRODUCT.md`-ben van.

## Nyelv
Csevegés: magyarul, tegezve. Felület: magyar, magázó, de **i18n-képes** (`docs/I18N.md` felülírja a MASTER_PROMPT egynyelvűségét). **Az URI-k (oldalak és API) és a teljes forráskód (azonosítók, megjegyzések, szkriptek, tesztek, commit-üzenetek) mindig angolok**: pl. `/login`, `/sheets/[id]`, `/sheets/new?species=dog`, nem `/belepes`, `/lapok`. Magyar csak a `messages/`-ben, a `docs/`-ban és a gyökérdokumentumokban van; a `tests/language.test.ts` őrzi.

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
`npm run dev` (port **6438**), `npm run build`, `npm run check` (lint + typecheck + test + i18n), `npm run i18n:sync`. Felületi ellenőrzés éles buildre: `npm run build && npm run start`, majd `npm run check:layout` (méretek, görgethető ablakok, 44 px-es célok, képernyőképek a `template pics/screenshots/` mappába) és `npm run check:flow` (mentés, piszkozat, ütközés). Minden felületi változtatás után futtasd; ami ott nem zöld, az nincs kész.

## Gépfüggő tudnivalók (Windows, nincs rendszergazdai jog)
- A shell nem örökli a friss PATH-t: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`, és `npm.cmd` / `npx.cmd`.
- Chrome headless: `C:\Program Files\Google\Chrome\Application\chrome.exe` (az Edge itt nem indul).
- Munkafán (worktree) a Gitben nem lévő fájlok (`template pics/`, `.env.supabase`) nincsenek meg: abszolút úttal olvasd őket a főmappából. `.env.local`-t át kell másolni.
- Git: távoli `git@github.com:borysz/vetdent-light.git`, ág `main`; `--force` soha; munkafán a saját ágra pusholj.
- Supabase CLI: `npx supabase projects list`; ha nincs belépve, a felhasználó futtassa a `npx supabase login` parancsot a saját termináljában. A céges hálózati védelem miatt a tanúsítvány-ellenőrzést nem kapcsoljuk ki.

## Adatbázis és API
- Migrációk: `supabase/migrations/`; feltöltés: `npx supabase db push --remote` (e nélkül a helyi Dockeres adatbázist célozza); típusok: `npx supabase gen types typescript --linked` → `src/server/db/database.types.ts` (BOM nélkül mentsd). Új migráció után mindig frissítsd a típusokat.
- API: `src/app/api/v1/**`, szerződések `src/contracts/`, szolgáltatások `src/server/services/`, OpenAPI: `GET /api/v1/openapi.json`. A kérések a felhasználó tokenjével futnak (RLS), a secret key csak `src/server/admin.ts`-ben (szkriptek, tesztek).
- Belépés: `npm run user:create` (a felhasználó saját termináljában); regisztrációs felület nincs.
- Tesztek (`npm test`) a valódi Supabase-projekten futnak saját, utána törölt adattal; `.env.local` kell hozzá.
- A route handlereket a tesztek közvetlenül hívják (`tests/helpers/fixtures.ts` `call`); a `next/headers` sütit a `tests/setup.ts` mockolja.

## Fogtábla (1. fül)
- Szakmai logika tisztán, tesztelve: `src/domain/teeth/` (`catalog.ts` katalógus és képernyősorrend, `codes.ts` kódok, `entry.ts` szabályok, `derive.ts` a tábla jelöléseinek levezetése és a kódok tördelése). Szakmai adatot ne találj ki: `docs/SZAKMAI_ELLENORZES.md`.
- Felület: `src/components/chart/` (`dental-chart.tsx` a tábla, `tooth-drawing.tsx` a saját SVG-rajzok, `odontogram-tab.tsx`, `tooth-editor-dialog.tsx`, `quick-panel.tsx`, `perio-summary.tsx`).
- A teljes táblának minden célméreten egyben kell látszania: a `check:layout` ezt, a 42/30 fogat és a 11 px-es legkisebb betűt is ellenőrzi.
- Szkriptet shellből beágyazva (heredoc, `node -e`) ne írj: a shell elrontja a backtickeket és a `# VetDent Light – átadási jegyzék

@AGENTS.md

Állatorvosi fogászati kezelési lap webalkalmazás (kutya 42, macska 30 fog), tabletre és laptopra. A megrendelő nem fejlesztő. Az eredeti igény a helyi `template pics/MASTER_PROMPT.md` (Gitben nincs, a főmappában: `C:\Users\Borysz\Work\vetdent-light\template pics\`), a mintaképekkel együtt. A termékkontextus a `PRODUCT.md`-ben van.

## Nyelv
Csevegés: magyarul, tegezve. Felület: magyar, magázó, de **i18n-képes** (`docs/I18N.md` felülírja a MASTER_PROMPT egynyelvűségét). **Az URI-k (oldalak és API) és a teljes forráskód (azonosítók, megjegyzések, szkriptek, tesztek, commit-üzenetek) mindig angolok**: pl. `/login`, `/sheets/[id]`, `/sheets/new?species=dog`, nem `/belepes`, `/lapok`. Magyar csak a `messages/`-ben, a `docs/`-ban és a gyökérdokumentumokban van; a `tests/language.test.ts` őrzi.

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
`npm run dev` (port **6438**), `npm run build`, `npm run check` (lint + typecheck + test + i18n), `npm run i18n:sync`. Felületi ellenőrzés éles buildre: `npm run build && npm run start`, majd `npm run check:layout` (méretek, görgethető ablakok, 44 px-es célok, képernyőképek a `template pics/screenshots/` mappába) és `npm run check:flow` (mentés, piszkozat, ütközés). Minden felületi változtatás után futtasd; ami ott nem zöld, az nincs kész.

## Gépfüggő tudnivalók (Windows, nincs rendszergazdai jog)
- A shell nem örökli a friss PATH-t: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`, és `npm.cmd` / `npx.cmd`.
- Chrome headless: `C:\Program Files\Google\Chrome\Application\chrome.exe` (az Edge itt nem indul).
- Munkafán (worktree) a Gitben nem lévő fájlok (`template pics/`, `.env.supabase`) nincsenek meg: abszolút úttal olvasd őket a főmappából. `.env.local`-t át kell másolni.
- Git: távoli `git@github.com:borysz/vetdent-light.git`, ág `main`; `--force` soha; munkafán a saját ágra pusholj.
- Supabase CLI: `npx supabase projects list`; ha nincs belépve, a felhasználó futtassa a `npx supabase login` parancsot a saját termináljában. A céges hálózati védelem miatt a tanúsítvány-ellenőrzést nem kapcsoljuk ki.

## Adatbázis és API
- Migrációk: `supabase/migrations/`; feltöltés: `npx supabase db push --remote` (e nélkül a helyi Dockeres adatbázist célozza); típusok: `npx supabase gen types typescript --linked` → `src/server/db/database.types.ts` (BOM nélkül mentsd). Új migráció után mindig frissítsd a típusokat.
- API: `src/app/api/v1/**`, szerződések `src/contracts/`, szolgáltatások `src/server/services/`, OpenAPI: `GET /api/v1/openapi.json`. A kérések a felhasználó tokenjével futnak (RLS), a secret key csak `src/server/admin.ts`-ben (szkriptek, tesztek).
- Belépés: `npm run user:create` (a felhasználó saját termináljában); regisztrációs felület nincs.
- Tesztek (`npm test`) a valódi Supabase-projekten futnak saját, utána törölt adattal; `.env.local` kell hozzá.
- A route handlereket a tesztek közvetlenül hívják (`tests/helpers/fixtures.ts` `call`); a `next/headers` sütit a `tests/setup.ts` mockolja.

 jeleket. Írd fájlba, és úgy futtasd.

## Zárójelentés és PDF (4. fül)
- Egyetlen komponens: `src/components/report/report-document.tsx` (előnézet, böngészős nyomtatás, szerveroldali PDF). Az előnézet az aktuális szerkesztésből, a PDF a mentett lapból készül.
- PDF: `GET /api/v1/sheets/{id}/pdf` → `src/server/pdf.ts` a `/print/sheets/<id>` oldalt nyomtatja a szerveren futó Chrome-mal (`CHROME_PATH`, `INTERNAL_BASE_URL`). Az ő és ű helyességét a `npm run check:pdf` a PDF-ből kiolvasott szövegben ellenőrzi.
- Ékezetes betűt tartalmazó tesztadatot a forráskódban kódpontból építs (`String.fromCharCode`): a szerkesztőeszköz a `\\u0151` jelölést valódi betűvé alakíthatja, a `tests/language.test.ts` pedig hibát jelez, ha a kódban ékezetes magyar betű van.

## Demóadat
`npm run seed:demo` felveszi Max kutyát és Mici macskát (a mintaképek példái, `supabase/seed/demo-data.json`) az első rendelőbe; `-- --reset` törli őket. A `check:layout` ugyanezt a demóadatot használja, így a képernyőképei a mintaképekkel vethetők össze.

## Állapot
**Mind a 7 fázis kész.** Az elfogadási feltételek állapota és a mintaképekkel való összevetés: `docs/ELFOGADAS.md`. Nyitott, nem fejlesztői teendők: állatorvosi jóváhagyás (`docs/SZAKMAI_ELLENORZES.md`, `pending` szövegek), kipróbálás valódi tableten és nyomtatón, HTTPS és éles elérés, `TODO.md`. A szándékosan későbbre hagyottak (diktálás, e-mail a gazdinak, admin felület, jelszó-visszaállítás, szerepkörök, offline, fotófeltöltés) a `docs/OTLETEK.md`-ben gyűlnek, ha felmerülnek. A többsoros szövegmezők a közös `src/components/ui/long-text.tsx` komponensen mennek át (a diktálás később ide kerül). A `String.replace` cseréjében a `$` egy `# VetDent Light – átadási jegyzék

@AGENTS.md

Állatorvosi fogászati kezelési lap webalkalmazás (kutya 42, macska 30 fog), tabletre és laptopra. A megrendelő nem fejlesztő. Az eredeti igény a helyi `template pics/MASTER_PROMPT.md` (Gitben nincs, a főmappában: `C:\Users\Borysz\Work\vetdent-light\template pics\`), a mintaképekkel együtt. A termékkontextus a `PRODUCT.md`-ben van.

## Nyelv
Csevegés: magyarul, tegezve. Felület: magyar, magázó, de **i18n-képes** (`docs/I18N.md` felülírja a MASTER_PROMPT egynyelvűségét). **Az URI-k (oldalak és API) és a teljes forráskód (azonosítók, megjegyzések, szkriptek, tesztek, commit-üzenetek) mindig angolok**: pl. `/login`, `/sheets/[id]`, `/sheets/new?species=dog`, nem `/belepes`, `/lapok`. Magyar csak a `messages/`-ben, a `docs/`-ban és a gyökérdokumentumokban van; a `tests/language.test.ts` őrzi.

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
`npm run dev` (port **6438**), `npm run build`, `npm run check` (lint + typecheck + test + i18n), `npm run i18n:sync`. Felületi ellenőrzés éles buildre: `npm run build && npm run start`, majd `npm run check:layout` (méretek, görgethető ablakok, 44 px-es célok, képernyőképek a `template pics/screenshots/` mappába) és `npm run check:flow` (mentés, piszkozat, ütközés). Minden felületi változtatás után futtasd; ami ott nem zöld, az nincs kész.

## Gépfüggő tudnivalók (Windows, nincs rendszergazdai jog)
- A shell nem örökli a friss PATH-t: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`, és `npm.cmd` / `npx.cmd`.
- Chrome headless: `C:\Program Files\Google\Chrome\Application\chrome.exe` (az Edge itt nem indul).
- Munkafán (worktree) a Gitben nem lévő fájlok (`template pics/`, `.env.supabase`) nincsenek meg: abszolút úttal olvasd őket a főmappából. `.env.local`-t át kell másolni.
- Git: távoli `git@github.com:borysz/vetdent-light.git`, ág `main`; `--force` soha; munkafán a saját ágra pusholj.
- Supabase CLI: `npx supabase projects list`; ha nincs belépve, a felhasználó futtassa a `npx supabase login` parancsot a saját termináljában. A céges hálózati védelem miatt a tanúsítvány-ellenőrzést nem kapcsoljuk ki.

## Adatbázis és API
- Migrációk: `supabase/migrations/`; feltöltés: `npx supabase db push --remote` (e nélkül a helyi Dockeres adatbázist célozza); típusok: `npx supabase gen types typescript --linked` → `src/server/db/database.types.ts` (BOM nélkül mentsd). Új migráció után mindig frissítsd a típusokat.
- API: `src/app/api/v1/**`, szerződések `src/contracts/`, szolgáltatások `src/server/services/`, OpenAPI: `GET /api/v1/openapi.json`. A kérések a felhasználó tokenjével futnak (RLS), a secret key csak `src/server/admin.ts`-ben (szkriptek, tesztek).
- Belépés: `npm run user:create` (a felhasználó saját termináljában); regisztrációs felület nincs.
- Tesztek (`npm test`) a valódi Supabase-projekten futnak saját, utána törölt adattal; `.env.local` kell hozzá.
- A route handlereket a tesztek közvetlenül hívják (`tests/helpers/fixtures.ts` `call`); a `next/headers` sütit a `tests/setup.ts` mockolja.

## Fogtábla (1. fül)
- Szakmai logika tisztán, tesztelve: `src/domain/teeth/` (`catalog.ts` katalógus és képernyősorrend, `codes.ts` kódok, `entry.ts` szabályok, `derive.ts` a tábla jelöléseinek levezetése és a kódok tördelése). Szakmai adatot ne találj ki: `docs/SZAKMAI_ELLENORZES.md`.
- Felület: `src/components/chart/` (`dental-chart.tsx` a tábla, `tooth-drawing.tsx` a saját SVG-rajzok, `odontogram-tab.tsx`, `tooth-editor-dialog.tsx`, `quick-panel.tsx`, `perio-summary.tsx`).
- A teljes táblának minden célméreten egyben kell látszania: a `check:layout` ezt, a 42/30 fogat és a 11 px-es legkisebb betűt is ellenőrzi.
- Szkriptet shellből beágyazva (heredoc, `node -e`) ne írj: a shell elrontja a backtickeket és a `# VetDent Light – átadási jegyzék

@AGENTS.md

Állatorvosi fogászati kezelési lap webalkalmazás (kutya 42, macska 30 fog), tabletre és laptopra. A megrendelő nem fejlesztő. Az eredeti igény a helyi `template pics/MASTER_PROMPT.md` (Gitben nincs, a főmappában: `C:\Users\Borysz\Work\vetdent-light\template pics\`), a mintaképekkel együtt. A termékkontextus a `PRODUCT.md`-ben van.

## Nyelv
Csevegés: magyarul, tegezve. Felület: magyar, magázó, de **i18n-képes** (`docs/I18N.md` felülírja a MASTER_PROMPT egynyelvűségét). **Az URI-k (oldalak és API) és a teljes forráskód (azonosítók, megjegyzések, szkriptek, tesztek, commit-üzenetek) mindig angolok**: pl. `/login`, `/sheets/[id]`, `/sheets/new?species=dog`, nem `/belepes`, `/lapok`. Magyar csak a `messages/`-ben, a `docs/`-ban és a gyökérdokumentumokban van; a `tests/language.test.ts` őrzi.

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
`npm run dev` (port **6438**), `npm run build`, `npm run check` (lint + typecheck + test + i18n), `npm run i18n:sync`. Felületi ellenőrzés éles buildre: `npm run build && npm run start`, majd `npm run check:layout` (méretek, görgethető ablakok, 44 px-es célok, képernyőképek a `template pics/screenshots/` mappába) és `npm run check:flow` (mentés, piszkozat, ütközés). Minden felületi változtatás után futtasd; ami ott nem zöld, az nincs kész.

## Gépfüggő tudnivalók (Windows, nincs rendszergazdai jog)
- A shell nem örökli a friss PATH-t: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`, és `npm.cmd` / `npx.cmd`.
- Chrome headless: `C:\Program Files\Google\Chrome\Application\chrome.exe` (az Edge itt nem indul).
- Munkafán (worktree) a Gitben nem lévő fájlok (`template pics/`, `.env.supabase`) nincsenek meg: abszolút úttal olvasd őket a főmappából. `.env.local`-t át kell másolni.
- Git: távoli `git@github.com:borysz/vetdent-light.git`, ág `main`; `--force` soha; munkafán a saját ágra pusholj.
- Supabase CLI: `npx supabase projects list`; ha nincs belépve, a felhasználó futtassa a `npx supabase login` parancsot a saját termináljában. A céges hálózati védelem miatt a tanúsítvány-ellenőrzést nem kapcsoljuk ki.

## Adatbázis és API
- Migrációk: `supabase/migrations/`; feltöltés: `npx supabase db push --remote` (e nélkül a helyi Dockeres adatbázist célozza); típusok: `npx supabase gen types typescript --linked` → `src/server/db/database.types.ts` (BOM nélkül mentsd). Új migráció után mindig frissítsd a típusokat.
- API: `src/app/api/v1/**`, szerződések `src/contracts/`, szolgáltatások `src/server/services/`, OpenAPI: `GET /api/v1/openapi.json`. A kérések a felhasználó tokenjével futnak (RLS), a secret key csak `src/server/admin.ts`-ben (szkriptek, tesztek).
- Belépés: `npm run user:create` (a felhasználó saját termináljában); regisztrációs felület nincs.
- Tesztek (`npm test`) a valódi Supabase-projekten futnak saját, utána törölt adattal; `.env.local` kell hozzá.
- A route handlereket a tesztek közvetlenül hívják (`tests/helpers/fixtures.ts` `call`); a `next/headers` sütit a `tests/setup.ts` mockolja.

 jeleket. Írd fájlba, és úgy futtasd.

## Zárójelentés és PDF (4. fül)
- Egyetlen komponens: `src/components/report/report-document.tsx` (előnézet, böngészős nyomtatás, szerveroldali PDF). Az előnézet az aktuális szerkesztésből, a PDF a mentett lapból készül.
- PDF: `GET /api/v1/sheets/{id}/pdf` → `src/server/pdf.ts` a `/print/sheets/<id>` oldalt nyomtatja a szerveren futó Chrome-mal (`CHROME_PATH`, `INTERNAL_BASE_URL`). Az ő és ű helyességét a `npm run check:pdf` a PDF-ből kiolvasott szövegben ellenőrzi.
- Ékezetes betűt tartalmazó tesztadatot a forráskódban kódpontból építs (`String.fromCharCode`): a szerkesztőeszköz a `\\u0151` jelölést valódi betűvé alakíthatja, a `tests/language.test.ts` pedig hibát jelez, ha a kódban ékezetes magyar betű van.

-ra egyszerűsödik: javítószkripthez használj függvényes cserét.
