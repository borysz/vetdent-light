# Döntések

Minden döntés: mit, miért, hol kell módosítani, ha más a válasz.

## 1. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A fejlesztői és az éles szerver portja **6438** (`npm run dev`, `npm run start`) | A megrendelő kérése | `package.json`, `.claude/launch.json` |
| `cacheComponents` kikapcsolva (a `create-next-app` alapból bekapcsolta, a `partialPrefetching`-gel együtt, ezeket töröltük) | Minden bejelentkezett oldal dinamikus; a vetdent projektben a kérésidejű adat csak `<Suspense>` mögött volt olvasható | `next.config.ts` |
| A nyelv a **cookie-ból** jön (`locale`), az URL-ben nincs nyelvi előtag; alapnyelv `hu` | Az URI-k és a forráskód mindig angolok (`/login`, `/sheets/…`), a nyelv nem része az útvonalnak; új nyelv = új katalógus | `src/i18n/config.ts`, `src/i18n/request.ts` |
| Az i18n teljes, nem csak magyar: `messages/<nyelv>.json` + ellenőrzési jegyzék `messages/review/<nyelv>.json` | Lásd `docs/I18N.md`; ez felülírja a `MASTER_PROMPT.md` egynyelvűségi sorát | `docs/I18N.md`, `scripts/i18n.ts` |
| Az ellenőrzési jegyzékben a szöveg `textHash`-e rögzíti, melyik szöveget nézte át az állatorvos; módosított szöveg automatikusan `pending` lesz (`npm run i18n:sync`) | A jóváhagyás ne vonatkozhasson csendben megváltozott szövegre | `scripts/i18n.ts` |
| `@types/node` 24-es | A Vitest 5 a 20-as típusokkal nem telepíthető; a gép Node 24-et használ | `package.json` |
| Betűk: Inter (sans) és JetBrains Mono (kódok, dátumok, számok), `latin-ext`-tel | Az ő és ű miatt; a képek is sans + monospace párost mutatnak | `src/app/layout.tsx` |
| Színtokenek a mintaképekből mérve (pixelolvasás) | A megrendelő kérése; a színek a Tailwind palettáját követik | `src/app/globals.css`, `docs/FELULET.md` |
| Rétegszabály az ESLintben: `src/app/(app)`, `src/components`, `src/client` nem importálhat `@/server`-t és `@supabase/*`-t | API-first architektúra | `eslint.config.mjs` |
| A mintaképek ismert hibái javítva: „Hazadobó Lap” → „Hazaadó lap & Gyógyszerek” (`messages/hu.json`); a többi (108-as fog kvadránsa, „Pulznyitott”, tizedesjel) a megfelelő fázisban | A képek hibáit nem vesszük át | `messages/hu.json` |

## 2. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A lap egy dokumentumként mentődik (`treatment_sheets.content jsonb`), zod-dal ellenőrizve (`src/contracts/sheets.ts`), `schema_version`-nel | Egyszerű mentés és verziózás; ha később elemzés kell, a fogadatok normalizálhatók | `src/contracts/sheets.ts`, `supabase/migrations/` |
| Külön gazdi-nyilvántartás nincs, a gazdi adatai az állatnál vannak | Elég a jelenlegi igényhez; később bővíthető | `patients` tábla |
| A becsült születési hónap a laphoz megadott korból számolódik (`src/domain/age.ts`), a páciens kora a mai napra ebből adódik | A következő lapon a kor magától nő | `src/domain/age.ts` |
| A páciens utolsó testtömege a legutóbb mentett lap testtömege | Egyszerű, nem szükséges külön mező kezelése | `save_sheet`, `create_patient_with_sheet` |
| Az új állat és az első lap egy adatbázis-függvényben (`create_patient_with_sheet`) készül, a mentés (`save_sheet`) is függvény; mindkettő `security invoker`, `set search_path = ''` | Atomi művelet, az RLS a hívóra érvényes | `supabase/migrations/20261121140000_core_schema.sql` |
| Meglévő állathoz új lap két lépésben készül (lap beszúrása, majd az állat korának és súlyának frissítése), ez nem egy tranzakció | Az állat adatainak frissítése másodlagos, a lap nem veszhet el miatta; a követelmény csak az új állat + lap párosra vonatkozik | `src/server/services/sheets.ts` |
| `is_clinic_member` `security definer` | A `clinic_members` saját szabályába ütközne (rekurzió); csak egy logikai értéket ad vissza | migráció |
| Törlés nincs (nincs `delete` szabály az RLS-ben) | A leírás szerint most nem kell | migráció |
| A sütis munkamenet `httpOnly`, `SameSite=Lax`, a `Secure` jelző akkor kapcsol be, ha a kérés HTTPS-en jött | A publikus fejlesztői cím HTTP-n megy, ott a `Secure` süti nem működne | `src/server/auth.ts`, `src/proxy.ts` |
| Sütis kérésnél az állapotváltoztató metódusokra kötelező az azonos eredetű `Origin` (CSRF-védelem); Bearer-kérésnél nincs ilyen ellenőrzés | A süti automatikusan megy a kéréssel, a Bearer token nem | `src/server/http.ts` |
| A belépés és a kilépés elfogadja az `Origin` nélküli kérést (nem böngészős kliens); a belépés csak a `returnTokens: true` kérésre ad vissza tokent | Nem böngészős kliensnek is kell tudnia belépni; a böngésző a sütit használja | `src/app/api/v1/auth/login/route.ts` |
| A hibás belépés mindig `invalid_credentials` (nem derül ki, melyik adat rossz) | Felhasználók felderítése ellen | login route |
| `GET /reference-data` egyelőre csak kódokat ad (faj, nem, ASA, stádium); a fogkatalógus és a kódlisták a 4. fázisban jönnek | A megnevezések felületi szövegek, szakmai jóváhagyással | `src/contracts/reference.ts` |
| A `GET /sheets/{id}/pdf` a 6. fázisban készül el | A leírás fázisbeosztása szerint | – |
| Az API-integrációs tesztek a valódi Supabase-projekten futnak, saját jelölt adattal (`itest-<futás>-…@vetdent-light.test`, „itest …” rendelők), és utána törlik azt | A leírás szerint; a futás végén a projekt üres | `tests/` |
| A `supabase db push` ehhez a CLI-verzióhoz `--remote` kapcsolót kér (alapból a helyi Dockeres adatbázist célozza) | Tapasztalat | `CLAUDE.md` |

## Későbbi fázisokra előre rögzítve

- A gazdi e-mail-címe nem kötelező (csak formátumellenőrzés), amíg nincs e-mail-küldés.
- Külön gazdi-nyilvántartás nincs: a gazdi adatai az állatnál vannak; később bővíthető.
- A kezelési lap egy dokumentumként (`content jsonb`) mentődik; ha később elemzés kell, a fogadatok normalizálhatók.

## URI-k és forráskód nyelve

| Döntés | Indok | Módosítás helye |
|---|---|---|
| Az oldalak és az API URI-jei, valamint a teljes forráskód mindig angol. A bejelentkezési oldal `/login` (nem `/belepes`); a tervezett útvonalak: `/sheets/[id]`, `/sheets/new?species=dog|cat` vagy `?patient=<id>`, fül: `?tab=1..4` (nem `/lapok`, `?faj=`, `?paciens=`, `?ful=`) | A megrendelő kérése; a `MASTER_PROMPT.md` magyar útvonalai ezzel felülíródnak | `src/app/`, `src/proxy.ts`, `tests/language.test.ts` |
| A `tests/language.test.ts` hibát jelez, ha a `src`, `scripts`, `tests` vagy `supabase` mappában ékezetes magyar szöveg vagy magyar útvonalnév van | Hogy a szabály ne sérülhessen észrevétlenül | `tests/language.test.ts` |

## 3. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A felugró ablakok, gombok és fülek shadcn-stílusú, kézzel írt komponensek a `radix-ui` csomagra építve (nem a `shadcn` CLI-vel generáltak) | A CLI felülírná a mért színtokeneket a `globals.css`-ben; ugyanazok a Radix-alapok, a tokenekből stílusozva | `src/components/ui/` |
| 1536 px alatt (laptop, tablet) a fejléc gombjai csak ikonok (feliratuk `aria-label` és `title`), a fülek rövid nevűek („1. Odontogram”, „2. Anesztézia”, „3. Hazaadó lap”, „4. Zárójelentés”); 1536 px-től a teljes felirat és a „FOGÁSZATI LAP” címke is látszik | A 1280×580-as laptopon a fejlécnek egy sorba kell férnie (kb. 500 px marad a táblázatnak); a hosszú feliratok a mintaképek szerintiek | `src/components/shell/app-header.tsx`, `messages/hu.json` |
| Álló tableten (xl alatt) a fülek külön, teljes szélességű második sorba törnek | A leírás szerint | `app-header.tsx` |
| A mentés gomb alatt mindig látszik az állapot („Mentve 10:42”, „Nem mentett változások”, „Még nincs mentve”) pöttyel jelezve | A leírás szerint | `app-header.tsx`, `sheet-editor.tsx` |
| A PDF mentés és az e-mail a gazdinak gomb letiltva („Hamarosan” az `aria-label`-ben és a `title`-ben) | A PDF a 6. fázisban készül, az e-mail-küldés később | `app-header.tsx` |
| A kezelés dátuma külön mező a páciens-kártyában (a mintaképen csak az összegző sorban kattintva módosítható) | Egyszerűbb és érintőbarátabb; az összegző sorban a dátum látszik | `patient-card.tsx` |
| A páciens-kártya a 3. fázisban a mentéshez szükséges mezőket tartalmazza (név, faj, fajta, kor, súly, gazdi, nem, ASA, kezelőorvos, dátum); az anamnézis mezői a 4. fázisban jönnek | A mentés és a folyamat kipróbálható legyen | `patient-card.tsx` |
| Új lap meglévő állathoz: a faj nem módosítható; új állatnál az első mentésig módosítható | A faj csak addig módosítható, amíg az állatnak nincs lapja | `patient-card.tsx`, `sheet-editor.tsx` |
| A fül és az első mentés utáni cím (`/sheets/<id>`) a böngésző előzményének cseréjével (`history.replaceState`) frissül, a szerkesztő nem töltődik újra | Ne vesszenek el a beírt adatok, nincs villogás | `sheet-editor.tsx` |
| A nem mentett változások helyi piszkozata a `localStorage`-ban él (`vetdent:draft:…`), a lap azonosítója vagy a kiindulás (új állat faja, meglévő állat) a kulcs; mentés után törlődik | A leírás szerint; a tároló hiányozhat vagy betelhet, ezért minden hívás védett | `src/client/local-draft.ts` |
| Elhagyás előtt (fejléc, ablakok, kilépés) a szerkesztő rákérdez (Mentés és tovább, Elvetés és tovább, Maradok); böngészőablak bezárásakor `beforeunload` figyelmeztet | Böngészőben nincs beépített útvonal-elhagyás elleni védelem a Next App Routerben | `shell-context.tsx`, `sheet-editor.tsx` |
| Ütközésnél (409) két választás: „Az én változatom mentése” (a legfrissebb verzióra rámentve) vagy „A másik változat betöltése” | Csendben semmi nem veszhet el | `sheet-editor.tsx` |
| A listák (kezdőképernyő, ablakok) lapozhatók, nem görgethetők, 3–4 sorral | A felugró ablakok nem görgethetők, a kezdőképernyő egy képernyőn elfér | `patient-picker.tsx`, `home-screen.tsx`, `sheets-dialog.tsx` |
| `check:layout` (valódi Chrome, 7 méret, 12 oldal- és ablakállapot méretenként) és `check:flow` (létrehozás, piszkozat, elhagyás, ütközés) éles buildre fut, saját jelölt adattal, és utána töröl | A leírás szerint; a fejlesztői szerver saját gombokat tesz az oldalra, ezért éles buildet használunk | `scripts/check-layout.ts`, `scripts/check-flow.ts` |

## Fogszám a felületen

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A felületen nem jelenik meg a fogak darabszáma (nincs „42 fog” / „30 fog” a kártyákon, az ablakokban és a faj gombjain) | A megrendelő kérése (2026-11-21). A fogtábla címe a mintaképeken „Kutya · 42 fog”: a 4. fázisban megkérdezendő, hogy ott is elhagyjuk-e | `messages/hu.json` |
