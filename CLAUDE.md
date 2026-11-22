# VetDent Light – átadási jegyzék

@AGENTS.md

Állatorvosi fogászati kezelési lap webalkalmazás (kutya 42, macska 30 fog), tabletre és laptopra. A megrendelő nem fejlesztő. Az eredeti igény a `docs/requirements/MASTER_PROMPT.md`, a mintaképek a `docs/requirements/samples/` mappában. A termékkontextus a `PRODUCT.md`-ben, a felépítés a `docs/ARCHITEKTURA.md`-ben van.

## Munkamenet: több eszközön, nem egyszerre
A projektet a megrendelő több gépen fejleszti (Claude Code, Claude Cowork), felváltva. **A Git `main` ága az egyetlen igazság**; a részletek: `docs/TOBB_ESZKOZ.md`.
- **Új eszközön először:** az eszköz saját deploy kulcsa (`npm run setup:deploy-key`, a klónozás előtti lépések a `docs/TOBB_ESZKOZ.md`-ben), utána `npm run setup:check`.
- **Elején:** `git pull` (vagy munkafán `git fetch` + `origin/main` beolvasztása), ha a `package-lock.json` változott: `npm ci`; `npm run setup:check`; olvasd el a `docs/MUNKANAPLO.md` legfelső bejegyzését és a `TODO.md`-t.
- **Végén** (a feladat kész, minden ellenőrzés zöld): új bejegyzés a `docs/MUNKANAPLO.md` tetejére (magyarul: kész, félbemaradt, következő lépés); commit; a munka a `main`-re kerül (munkafán: a helyi `main`-t előbb `origin/main`-re hozod, majd `--no-ff` merge), és **push** kérdés nélkül. Ha a környezet nem tud pusholni, mondd meg a felhasználónak, hogy futtassa a `git push`-t.
- Ha piros valami, nem kerül `main`-re; a félbemaradt állapot a munkanaplóba és a saját ágra kerül.
- A tartós szabályok és a megrendelő kérései ide vagy a `docs/`-ba kerülnek, ne csak a helyi memóriába: az nem utazik a géppel.

## Nyelv
Csevegés: magyarul, tegezve. Felület: magyar, magázó, de **i18n-képes** (`docs/I18N.md` felülírja a MASTER_PROMPT egynyelvűségét). **Az URI-k (oldalak és API) és a teljes forráskód (azonosítók, megjegyzések, szkriptek, tesztek, commit-üzenetek) mindig angolok**: pl. `/login`, `/sheets/[id]`, `/sheets/new?species=dog`, nem `/belepes`, `/lapok`. Magyar csak a `messages/`-ben, a `supabase/seed/demo-data.json`-ban, a `docs/`-ban és a gyökérdokumentumokban van; a `tests/language.test.ts` őrzi.

## Technológia
Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS 4, next-intl, zod, TanStack Query, Supabase (Postgres + Auth), Vitest. Felületi elemek: saját komponensek a `radix-ui` csomagra építve (`src/components/ui/`; nem a shadcn CLI-vel generáltak). PDF: a szerveren futó valódi Chrome `puppeteer-core`-ral. A Next.js 16 eltér a megszokottól: a csomagolt dokumentáció a `node_modules/next/dist/docs/`-ban van, kódírás előtt olvasd el az érintett részt (a middleware neve `proxy`, `src/proxy.ts`).

## Szabályok
- API-first: minden adatművelet a `src/app/api/v1/**` alatt, a felületi kód nem importál `@/server/*`-t vagy `@supabase/*`-t (ESLint őrzi). Rétegek: `src/contracts`, `src/server`, `src/domain`, `src/client`, `src/components`.
- Felületi szöveg csak üzenetkulcsból (`messages/hu.json`); minden új szöveg `pending` ellenőrzési állapotú a `messages/review/hu.json`-ban (`npm run i18n:sync`). Csak állatorvos állít `approved`-ra.
- Szakmai adatot nem találunk ki; kételyek: `docs/SZAKMAI_ELLENORZES.md`. Az app rögzít, nem dönt.
- Szín és méret csak tokenből (`src/app/globals.css`). Érintési cél ≥ 44 px, beviteli mező 16 px, felugró ablak nem görgethető, a teljes fogtáblázat mindig egyben látszik.
- Nem kért dolgot nem építünk: ötlet → `docs/OTLETEK.md`. Döntések: `docs/DONTESEK.md`, kérdések: `docs/NYITOTT_KERDESEK.md`.
- Titkot soha ne olvass ki és ne írj ki; a `.env*` fájlok Gitben nincsenek (a `.env.example` igen).

## Parancsok
| Parancs | Feladat |
|---|---|
| `npm run dev` | Fejlesztői szerver a **6438**-as porton |
| `npm run check` | lint + típusellenőrzés + tesztek + i18n-ellenőrzés (a tesztek a valódi Supabase-projekten futnak) |
| `npm run build && npm run start` | Éles build és szerver; erre futnak a böngészős ellenőrzések |
| `npm run setup:deploy-key` | Az eszköz saját deploy kulcsa: létrehozás, felvétel a GitHubon (a GitHub CLI-vel vagy útmutatással), olvasási és írási próba |
| `npm run setup:check` | Kész-e a gép a folytatásra: Node, csomagok, `.env.local` (csak nevek), Supabase, Chrome, Git (lemaradás az `origin/main`-hez) |
| `npm run check:layout` | Valódi Chrome, 9 méret (telefon is): túlcsordulás, görgethető ablakok, 44 px-es célok, a teljes fogtábla; képernyőképek a `screenshots/` mappába |
| `npm run check:flow` | Böngészős folyamat: mentés, piszkozat, ütközés, fogtábla, 2. és 3. fül, PDF-letöltés, nyomtatás |
| `npm run check:pdf` | PDF-végpont: ő és ű a PDF-ből kiolvasva, A4, oldalszám, jogosultság |
| `npm run check:volume` | Sok adat (alapból 300 állat, `-- --animals 1500`): kezdőlap lapozóval, lapozás, kereső, válaszidők; a végén mindent töröl |
| `npm run i18n:sync` | Új vagy módosított szövegek felvétele az ellenőrzési jegyzékbe |
| `npm run user:create` / `npm run seed:demo` | Felhasználó létrehozása (a saját termináljában) / demóadat |
| `npm run user:password -- --email <cím>` | Meglévő felhasználó új jelszava (a saját termináljában, kétszer kéri) |
| `npm run supabase:auth-config` | Supabase Auth: Site URL és Redirect URL-ek, `-- --smtp` saját levelező (a saját termináljában, személyes tokennel; csak a nevesített mezőket írja) |

Minden felületi változtatás után futtasd a három böngészős ellenőrzést; ami ott nem zöld, az nincs kész.

## Gépfüggő tudnivalók
- **Chrome:** a szkriptek és a PDF maguk keresik meg (`CHROME_PATH`, a `.chrome/` a `npm run chrome:install` után, vagy a rendszer szokásos helye Windowson, macOS-en, Linuxon); `src/server/chrome.ts`, `scripts/lib/browser.ts`.
- **Git:** távoli `git@github.com:borysz/vetdent-light.git` (privát), ág `main`; `--force` soha. Minden eszköz saját, írási joggal felvett deploy kulccsal pushol (`~/.ssh/vetdent_light_deploy_ed25519`, a repó `core.sshCommand` beállítása); létrehozás és ellenőrzés: `npm run setup:deploy-key` (`-- --check`: csak ellenőriz).
- **Munkafán (worktree)** a Gitben nem lévő fájlok (`.env.local`) nincsenek meg: a főmappából kell átmásolni.
- **A megrendelő Windows-gépén** (nincs rendszergazdai jog): a shell nem örökli a friss PATH-t: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`, és `npm.cmd` / `npx.cmd`; az Edge headless módban nem indul, a Chrome igen.
- Supabase CLI: `npx supabase projects list`; ha nincs belépve, a felhasználó futtassa a `npx supabase login` parancsot a saját termináljában. A céges hálózati védelem miatt a tanúsítvány-ellenőrzést nem kapcsoljuk ki.

## Adatbázis és API
- Migrációk: `supabase/migrations/`; feltöltés: `npx supabase db push --remote` (e nélkül a helyi Dockeres adatbázist célozza); típusok: `npx supabase gen types typescript --linked` → `src/server/db/database.types.ts` (BOM nélkül mentsd). Új migráció után mindig frissítsd a típusokat.
- API: `src/app/api/v1/**`, szerződések `src/contracts/`, szolgáltatások `src/server/services/`, OpenAPI: `GET /api/v1/openapi.json`. A kérések a felhasználó tokenjével futnak (RLS), a secret key csak `src/server/admin.ts`-ben (szkriptek, tesztek).
- Belépés: `npm run user:create`; regisztrációs felület nincs. Elfelejtett jelszó: `/forgot-password` → levél (ideiglenesen a Supabase küldi) → `/auth/confirm` → `/reset-password`; a Supabase-beállítás: `docs/JELSZO_VISSZAALLITAS.md`.
- Tesztek (`npm test`): a route handlereket közvetlenül hívják (`tests/helpers/fixtures.ts` `call`), saját, utána törölt adattal; a `next/headers` sütit a `tests/setup.ts` mockolja.

## Fogtábla (1. fül)
- Szakmai logika tisztán, tesztelve: `src/domain/teeth/` (`catalog.ts` katalógus és képernyősorrend, `codes.ts` kódok, `entry.ts` szabályok, `derive.ts` a tábla jelöléseinek levezetése és a kódok tördelése). Szakmai adatot ne találj ki: `docs/SZAKMAI_ELLENORZES.md`.
- Felület: `src/components/chart/` (`dental-chart.tsx` a tábla, `tooth-drawing.tsx` a saját SVG-rajzok, `odontogram-tab.tsx`, `tooth-editor-dialog.tsx`, `quick-panel.tsx`, `perio-summary.tsx`).
- A teljes táblának minden célméreten egyben kell látszania: a `check:layout` ezt, a 42/30 fogat és a 11 px-es legkisebb betűt is ellenőrzi.

## Röntgenképek (2. fül)
- A „Digitális fogászati röntgen” szekcióban képek csatolhatók (ráhúzással vagy fájlválasztással): `src/components/sheet/radiograph-gallery.tsx`. Csak mentett laphoz; JPEG, PNG, WebP és PDF (a rendelő röntgenszoftvere JPEG-et és PDF-et exportál), fájlonként legfeljebb 15 MB, laponként legfeljebb 30 fájl (`src/contracts/radiographs.ts`). A kép bélyegképként és nagy nézetben, a PDF új lapon, a böngésző PDF-nézőjében nyílik.
- **A kép az adatbázisban van** (megrendelői döntés): a `sheet_radiographs.image` (bytea) oszlopban, a rendelő tagságát ellenőrző RLS-sel. Írás és olvasás a `add_sheet_radiograph` és `sheet_radiograph_image` adatbázis-függvénnyel (base64), a listák a képet nem töltik le. A fájl csak az API-n át érhető el (`GET /api/v1/radiographs/{id}/file`), a típust a szerver a fájl első bájtjaiból ellenőrzi (`src/server/services/radiographs.ts`). A rendelő vagy a lap törlése a képeket is törli.
- Az adatbázis mérete: a Supabase ingyenes csomagjában 500 MB; a képek ebbe számítanak bele.

## Zárójelentés és PDF (4. fül)
- Egyetlen komponens: `src/components/report/report-document.tsx` (előnézet, böngészős nyomtatás, szerveroldali PDF). Az előnézet az aktuális szerkesztésből, a PDF a mentett lapból készül.
- PDF: `GET /api/v1/sheets/{id}/pdf` → `src/server/pdf.ts` a `/print/sheets/<id>` oldalt nyomtatja a szerveren futó Chrome-mal (`CHROME_PATH`, `INTERNAL_BASE_URL`).

## Telepítés
Render.com, natív Node-szolgáltatás: `render.yaml` és `docs/TELEPITES_RENDER.md`. A build letölti a Chrome headless shellt (`npm run chrome:install`, `.chrome/`), a szerver `CHROME_PATH` nélkül is megtalálja (`src/server/chrome.ts`); konténerben `CHROME_ARGS=--no-sandbox --disable-dev-shm-usage`. A titkos kulcs (`SUPABASE_SECRET_KEY`) nem kerül a szerverre.

## Demóadat
`npm run seed:demo` felveszi Max kutyát és Mici macskát (a mintaképek példái, `supabase/seed/demo-data.json`) az első rendelőbe; `-- --reset` törli őket. A `check:layout` ugyanezt a demóadatot használja, így a képernyőképei a mintaképekkel vethetők össze. A böngészős ellenőrzések közös ideiglenes felhasználója: `scripts/lib/e2e.ts`.

## Szkriptírás: ismert buktatók
- Szkriptet shellből beágyazva (heredoc, `node -e`) ne írj: a shell elrontja a backtickeket és a dollárjeleket. Írd fájlba, és úgy futtasd.
- A `String.replace` cseréjében a `$$`, ``$` `` és `$'` különleges (a fájl más részét szúrhatják be, így duplázódott meg egyszer ez a fájl is): javítószkriptben `split(...).join(...)`-t vagy függvényes cserét használj. A `tests/docs.test.ts` az ismétlődő bekezdéseket jelzi.
- Ékezetes betűt a forráskódban kódpontból építs (`String.fromCharCode`): a szerkesztőeszköz a `\u0151` jelölést valódi betűvé alakíthatja, a `tests/language.test.ts` pedig hibát jelez, ha a kódban ékezetes magyar betű van. Az `npm pkg set` a `>=` jelet átirányításnak veszi (`>`): a `package.json`-t fájlként szerkeszd.
- A Windows-os fájlok sorvége néha CRLF (pl. `.gitignore`): soralapúan szerkessz, ne `\n`-re illessz.

## Állapot
**Mind a 7 fázis kész.** Az elfogadási feltételek állapota és a mintaképekkel való összevetés: `docs/ELFOGADAS.md`. Nyitott, nem fejlesztői teendők: állatorvosi jóváhagyás (`docs/SZAKMAI_ELLENORZES.md`, `pending` szövegek), kipróbálás valódi tableten és nyomtatón, HTTPS és éles elérés (`TODO.md`). A szándékosan későbbre hagyottak (diktálás, e-mail a gazdinak, admin felület, saját levélküldő rendszer, szerepkörök, offline, fotófeltöltés, röntgenképek a PDF-ben) a `docs/OTLETEK.md`-ben gyűlnek, ha felmerülnek. A többsoros szövegmezők a közös `src/components/ui/long-text.tsx` komponensen mennek át (a diktálás később ide kerül).
