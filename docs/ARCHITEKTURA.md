# Architektúra

Rövid áttekintés arról, hogyan áll össze az alkalmazás, és merre kell nyúlni, ha valamit bővíteni kell. A döntések indoklása a `docs/DONTESEK.md`-ben van.

## Áttekintés

```
Böngésző (React, src/components)
   │  fetch /api/v1/…  (httpOnly sütis munkamenet)
   ▼
Next.js proxy (src/proxy.ts): munkamenet frissítése, belépés nélkül /login vagy 401
   ▼
Route handlerek (src/app/api/v1/**)  →  szolgáltatások (src/server/services)
   ▼
Supabase: Postgres + Auth, minden táblán RLS (csak a rendelő tagjai látják az adatot)

PDF:  GET /api/v1/sheets/{id}/pdf → szerveren futó Chrome → /print/sheets/{id} → ugyanaz az API
```

Az alapszabály: **a felület csak az API-n át ér el adatot.** Az `src/components`, `src/client` és `src/app/(app)` mappából nem importálható az `@/server/*` és az `@supabase/*` (az ESLint őrzi, lásd `eslint.config.mjs`).

## Mappák és rétegek

| Mappa | Feladat | Függ tőle |
|---|---|---|
| `src/domain/` | Tiszta szakmai logika, mellékhatás nélkül: fogkatalógus, kódok és szabályok (`teeth/`), kor, dátum, jelentés-segédek | senkitől |
| `src/contracts/` | zod sémák: a felület és a szerver közös nyelve; az OpenAPI-leírás is ebből készül (`openapi.ts`) | `domain` |
| `src/server/` | Szolgáltatásréteg (`services/`), hitelesítés (`auth.ts`), hibakezelés (`errors.ts`, `http.ts`), PDF (`pdf.ts`), adatbázis-típusok | `contracts`, `domain` |
| `src/app/api/v1/` | Vékony route handlerek: hitelesítés, bemenet ellenőrzése, szolgáltatás hívása | `server` |
| `src/client/` | Típusos API-kliens (`api.ts`), TanStack Query hookok, a lap szerkesztési modellje (`sheet-draft.ts`), helyi piszkozat (`local-draft.ts`) | `contracts`, `domain` |
| `src/components/` | Felület: `ui/` (alapelemek), `shell/` (fejléc, ablakok), `sheet/` (szerkesztő, páciens-kártya, fülek), `chart/` (fogtábla), `report/` (A4 jelentés) | `client`, `domain` |
| `messages/` | Felületi szövegek nyelvenként és az ellenőrzési jegyzék (`review/`) | |
| `supabase/` | Migrációk és a demóadat | |
| `scripts/` | Felhasználó létrehozása, demóadat, szövegellenőrzés, böngészős ellenőrzések | |

## Egy lap mentése

1. A szerkesztő (`src/components/sheet/sheet-editor.tsx`) egy **piszkozatot** (`SheetDraft`) tart: űrlapmezők szövegként, a lap többi része a `content` dokumentum.
2. A „Mentés” a piszkozatot kérésre alakítja (`toCreateBody` / `toUpdateBody`, `src/client/sheet-draft.ts`), és az API-ra küldi (`POST /sheets` vagy `PUT /sheets/{id}` a `version`-nel).
3. A route handler ellenőrzi a bemenetet (`src/contracts/sheets.ts`), a szolgáltatás (`src/server/services/sheets.ts`) a fogadatokat a fajhoz (`validateTeeth`), majd az adatbázis-függvényeket hívja.
4. Új állat + első lap **egy tranzakcióban** készül (`create_patient_with_sheet`), a mentés `save_sheet` függvénnyel, optimista zárolással: eltérő verziónál 409 `version_conflict`, a felület ütközési ablakot mutat.
5. Közben a nem mentett változások a böngészőben, `localStorage`-ban is megmaradnak (`src/client/local-draft.ts`), és elhagyás előtt a szerkesztő rákérdez.

## Hitelesítés és jogosultság

- Belépés: `POST /auth/login` e-mail + jelszóval; a böngésző `httpOnly` sütit kap, a böngészőben nincs Supabase-kulcs.
- Elfelejtett jelszó: `POST /auth/password-reset` levelet kér, a levél linkje a `/auth/confirm` útvonalon lép be, az új jelszót a `PUT /auth/password` menti (`docs/JELSZO_VISSZAALLITAS.md`).
- Más kliens `Authorization: Bearer <token>` fejlécet is küldhet; a tokent a Supabase ellenőrzi (`src/server/auth.ts`).
- Minden kérés **a felhasználó tokenjével** fut az adatbázisban, ezért az RLS mindig érvényes. A secret key csak szkriptekben és tesztekben használható (`src/server/admin.ts`).
- Sütis, állapotváltoztató kérésnél azonos eredetű `Origin` kell (CSRF-védelem, `src/server/http.ts`).
- Jogosultság: aki a rendelő tagja, az mindent lát és szerkeszt a rendelőben; aki nem tag, 403-at kap. Regisztrációs felület nincs, a felhasználót a `npm run user:create` hozza létre.

## Röntgenképek

- Feltöltés: `POST /sheets/{id}/radiographs` (multipart, `file` mező), lista: `GET /sheets/{id}/radiographs`, fájl: `GET /radiographs/{id}/file` (kép vagy PDF, a böngészőben megnyitva), törlés: `DELETE /radiographs/{id}`.
- A kép bájtjai az adatbázisba, a `sheet_radiographs.image` oszlopba kerülnek a felhasználó tokenjével (RLS: csak a rendelő tagja írhatja és olvashatja); a szerver base64-ben küldi és kapja az `add_sheet_radiograph` és `sheet_radiograph_image` függvénnyel (`supabase/migrations/20261122140000_radiographs_in_database.sql`). A listák csak az adatokat kérik le, a képet nem.
- A felület a képet az API-tól kéri a munkamenet sütijével; Supabase-cím vagy -kulcs nem kerül a böngészőbe.

## Keresés és lapozás

- Minden lista szerveroldalon lapoz (`page`, `pageSize`), a felület 4 elemet mutat oldalanként, első / előző / következő / utolsó gombbal.
- Az állatkereső a névben, a gazdi nevében és a telefonszámban keres; az ékezet és a kis- és nagybetű nem számít (a `search_text` számított oszlop és a `foldForSearch` ugyanúgy alakít), a telefonszám szóközök nélkül és 06-tal is megy (`phone_digits`).
- Nagy adatmennyiségre a `npm run check:volume` ellenőrzi (alapból 300, `-- --animals 1500`).

## Adatmodell

Táblák: `clinics`, `clinic_members`, `patients`, `treatment_sheets` (`supabase/migrations/20261121140000_core_schema.sql`). A lap részletei egyetlen, zod-dal ellenőrzött `content jsonb` dokumentumban vannak (anamnézis, fogak foganként, periodontális összesítő, idegblokkok, varratok, röntgen, gyógyszerek, tanácsok, kontroll), `schema_version`-nel. Új mező a `content`-ben **nem kér migrációt**, csak a séma bővítését (lásd lent).

## Fogtábla

A szakmai logika a `src/domain/teeth/`-ben van, tesztekkel: a katalógus (`catalog.ts`), a kódok (`codes.ts`), a szabályok (`entry.ts`: TR csak macskánál, furkáció csak többgyökerű fogon, hiányzó fogra nincs lelet, egy csoportban egy fokozat) és a tábla jelöléseinek levezetése (`derive.ts`). A felület (`src/components/chart/`) ezekből rajzolja a táblát; a szerver ugyanezekkel a szabályokkal ellenőriz. A tábla minden célméreten egyben látszik, ezt a `scripts/check-layout.ts` ellenőrzi.

## i18n és szövegek szakmai ellenőrzése

Felületi szöveg csak üzenetkulcsból jön (`messages/<nyelv>.json`, next-intl, típusellenőrzött kulcsok). Minden kulcshoz ellenőrzési állapot tartozik (`messages/review/<nyelv>.json`); új vagy módosított szöveg `pending`, jóváhagyni csak állatorvos tud. Részletek: `docs/I18N.md`, eszköz: `scripts/i18n.ts`.

## PDF

A zárójelentés egyetlen React-komponens (`src/components/report/report-document.tsx`): az előnézet (tab 4), a böngészős nyomtatás és a PDF ugyanazt használja. A PDF-et a szerver állítja elő: `src/server/pdf.ts` egy headless Chrome-mal megnyitja a `/print/sheets/{id}` oldalt a hívó hitelesítő adataival, és A4 PDF-be nyomtatja. A Chrome beágyazza a betűkészletet, ezért az ő és ű helyes.

## Tesztek és ellenőrzések

| Mit | Hol / hogyan |
|---|---|
| Tiszta logika (fogszabályok, kor, dátum, fájlnév, piszkozat) | `src/**/*.test.ts` |
| API a valódi Supabase-projekten (401, 403, RLS, 409, atomi létrehozás, keresés) | `tests/api/api.test.ts` |
| Kódnyelv (a kódban nincs magyar szöveg, az URI-k angolok) | `tests/language.test.ts` |
| Dokumentáció (nincs ismétlődő bekezdés, a hivatkozott fájlok léteznek) | `tests/docs.test.ts` |
| Demóadat a szabályok szerint | `tests/demo-data.test.ts` |
| Elrendezés valódi Chrome-mal, 7 méreten, minden ablakkal | `npm run check:layout` |
| Böngészős folyamat (mentés, piszkozat, ütközés, fogtábla, fülek, PDF, nyomtatás) | `npm run check:flow` |
| PDF-végpont (ő és ű a PDF-ből kiolvasva, A4, jogosultság) | `npm run check:pdf` |

## Új mező felvétele a laphoz

1. `src/contracts/sheets.ts`: a mező a `sheetContentSchema`-ba, alapértékkel (a régi lapok így is érvényesek maradnak).
2. Felület: a megfelelő fül (`src/components/sheet/`), a szöveg a `messages/hu.json`-ba, utána `npm run i18n:sync`.
3. Ha a jelentésen is látszik: `src/components/report/report-document.tsx`.
4. Ha a séma nem visszafelé kompatibilis: `SHEET_SCHEMA_VERSION` növelése és a tárolt dokumentumok átalakítása.
5. Tesztek, majd `npm run check` és a böngészős ellenőrzések.

## Környezeti változók

A `.env.example` felsorolja őket (csak nevek). A `.env.local` Gitben nincs. Szükséges: a Supabase-adatok, a `CHROME_PATH` (PDF és böngészős ellenőrzések); opcionális: `INTERNAL_BASE_URL`, `ALLOWED_DEV_ORIGINS`.
