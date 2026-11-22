# VetDent Light – indító prompt (master prompt)

> **A felhasználónak – így indítsd:** nyiss új Claude Code munkamenetet a `C:\Users\Borysz\Work\vetdent-light` mappában, és írd be:
> *„Olvasd el a `template pics/MASTER_PROMPT.md` fájlt, és hajtsd végre.”*
>
> Ez a fájl a `template pics/` mappában van, ezért **nincs Gitben** (szándékosan). Ha a munkamenet munkafán (worktree) fut, ott a `template pics/` és a `.env*` fájlok nincsenek meg: abszolút úttal olvasd őket a fő mappából (`C:\Users\Borysz\Work\vetdent-light\…`).

---

## 1. Szereped és munkamódszered

Tapasztalt full-stack fejlesztőként egy tabletre és laptopra tervezett **állatorvosi fogászati kezelési lap** webalkalmazást építesz fel a nulláról ebben a mappában. A megrendelő nem fejlesztő.

- **Nyelv:** a csevegésben magyarul, **tegezve** beszélünk; a felület magázó. A kód, az azonosítók és a commit-üzenetek angolul, a felület és a `docs/` magyarul készül.
- **Először olvass:** ezt a fájlt végig, majd a `template pics/` hét képét egyenként és alaposan (3. fejezet). A Next.js telepítése után a csomaggal szállított dokumentációt (`node_modules/next/dist/docs/`). Könyvtárak API-ját ne emlékezetből használd: nézd meg az aktuális stabil verzió dokumentációját.
- **Fázisokban dolgozz** (12. fejezet). Minden fázis végén: `npm run check` zöld, `npm run build`, felületi változásnál `npm run check:layout`, commit, push, és 5–10 soros **őszinte** összefoglaló: mi készült el, mit próbáltál ki valódi böngészőben, mi nincs ellenőrizve.
- **Kérdések:** kifelé ható vagy nehezen visszavonható lépés előtt (új külső szolgáltatás, telepítés, kulcs, Supabase-projektbeállítás, adat törlése) mindig kérdezz. Egyéb nyitott kérdésnél válaszd az indokolt alapértelmezést, írd be a `docs/DONTESEK.md`-be (mit, miért, hol kell módosítani, ha más a válasz), a kérdést a `docs/NYITOTT_KERDESEK.md`-be, és haladj tovább. Ha egy kérdés a munka nagy részét rossz irányba vinné, állj meg és kérdezz.
- **Ne építs olyat, amit nem kértek** (14. fejezet). Ami hasznosnak tűnik, de nincs a leírásban, az a `docs/OTLETEK.md`-be kerül.
- **Szakmai adatot ne találj ki** (8. fejezet).

## 2. A termék röviden

Bejelentkezés után az állatorvos (vagy asszisztens) kutyát vagy macskát választ, megadja az állat és a gazdi adatait, majd kitölti a fogászati kezelési lapot: anamnézis, interaktív fogképlet (Triadan-számozás), érzéstelenítés és műtét, hazaadó lap és gyógyszerek. A lapot menti; az állat is mentődik, és a lapjai a kezelés időpontja szerint csökkenő sorrendben visszanézhetők. A kész lapból A4-es zárójelentés készül, amely kinyomtatható és PDF-ben letölthető.

Fő folyamatok:
1. Belépés e-mail-címmel és jelszóval.
2. Kezdőképernyő: új lap kutyának vagy macskának, illetve meglévő állat keresése; a legutóbbi lapok.
3. Kezelési lap négy fülön (7. fejezet), a kitöltéshez felugró ablakokkal, hogy ne kelljen a lapról elnavigálni.
4. Mentés → az állat és a lap a Supabase-adatbázisba kerül.
5. Egy állat kiválasztásakor a lapjai dátum szerint csökkenő sorrendben; új lap ugyanannak az állatnak előtöltött adatokkal.
6. Zárójelentés-előnézet, nyomtatás, PDF-letöltés.

Később, **nem most**: diktálás, e-mail a gazdinak, adminisztrációs felület (14. fejezet).

## 3. Forrásanyagok

### 3.1 A mintaképek (`template pics/`) – a kinézet és a működés forrása

| Fájl | Mit mutat |
|---|---|
| `1.png` | Széles asztali nézet: fejléc (logó, „VetDent Pro”, „FOGÁSZATI LAP” címke, négy fül, gombok) és a páciens-/anamnézis-kártya (az 1. fül teteje) |
| `kutya.png` | Az 1. fül alsó része kutyánál: fogászati kezelési táblázat (42 fog), aktív fog sáv, periodontális összesítő, fogszerkesztő panel, gyorsbeviteli eszköztár |
| `macska.png` | Az 1. fül macskánál (30 fog), kitöltött kártyával; macskánál plusz mező: „Stomatitis / Feline resorptív státusz” |
| `3.png` | 2. fül: Anesztézia & Műtét |
| `4.png` | 3. fül: Hazaadó lap & Gyógyszerek |
| `5.png`, `6.png` | 4. fül: Zárójelentés-előnézet (A4) eleje és vége – ez a PDF tartalma is |

`2.png` nincs, nem kell keresni.

Alapelvek:
- **A fogászati kezelési táblázat (fogképlet) pontosan ilyen legyen**, mint a `kutya.png` és a `macska.png` képen: sorok, sorrend, oszlopok, jelölések, színek, feliratok, felezővonal (részletek: 7.6).
- A többi felület a képek elrendezését, színvilágát, tipográfiáját és komponenseit kövesse. Ahol a 9. fejezet (méretek, görgetés nélküli felugró ablakok) mást kíván, az nyer, de a vizuális nyelv maradjon ugyanaz.
- **A színeket mérd ki a képekből** (pixelolvasással, pl. PowerShell `System.Drawing`), ne becsüld; tokenként rögzítsd a `globals.css`-ben.
- A képek nincsenek Gitben, ezért az 1. fázisban írd le a felületet szövegesen a `docs/FELULET.md`-be (szekciók, mezők, feliratok, választéklisták, színek, jelölések), hogy a tudás a repóban is meglegyen.
- A képeken szereplő rendelő-, orvos- és gazdinevek, e-mail-címek **csak példák**. A demóadat semleges legyen (`example.com` / `.test` e-mail-domain).

A képek ismert hibái, ezeket javítsd és rögzítsd a `docs/DONTESEK.md`-ben:
- „3. Hazadobó Lap” → **„3. Hazaadó lap & Gyógyszerek”**.
- A 108-as fog fejlécében „Jobb alsó kvadráns” áll; helyesen **jobb felső** (100 jobb felső, 200 bal felső, 300 bal alsó, 400 jobb alsó).
- „Pulznyitott” → valószínűleg „pulpanyitott”; javítsd, és írd fel szakmai ellenőrzésre is.
- A tizedesjel vegyes (32,5 és 32.5 kg) → egységesen vessző.
- Keskenyebb szélességen a fejléc gombjai kilógnak (`3.png` jobb széle) → ez nálunk egyetlen célméreten sem fordulhat elő.
- A fogszerkesztő panel belül görgetősávos (`kutya.png`) → nálunk felugró ablak, görgetés nélkül, szükség esetén fülekkel.

### 3.2 A vetdent projekt (`C:\Users\Borysz\Work\vetdent`) – csak háttér

Ugyanennek a felhasználónak egy nagyobb, más célú projektje (több-bérlős SaaS, offline működés, előfizetés). **Az ottani szabályok, fázisok és a CLAUDE.md itt nem érvényesek.** Hozzáférést a mappához akkor kérj, ha szükséged van rá.
- `referencia/PROJEKT_PROMPT.md` 8.3–8.4 fejezete (fogkatalógus, kódtörzs, színkód) szakmai háttérnek jó; ahol a mintaképek mást mutatnak, a képek nyernek.
- A `referencia/*.jpg` (BSAVA/Zoetis) képek szerzői jogvédettek: **nem másolhatók és nem rajzolhatók át.**
- Átvehető, bevált részek (olvasd el, értsd meg, igazítsd, ne vakon másold):
  - `src/domain/teeth/catalog.ts`: fogkatalógus (Triadan, képernyősorrend, gyökérszám; a gyökérszámok állatorvosi jóváhagyásra várnak);
  - `tests/tablet/check-tablet.mjs`: méretellenőrzés valódi Chrome-mal (puppeteer-core);
  - `src/lib/summary/pdf.ts` tanulsága: a beépített PDF-betűkészletekből hiányzik az ő és az ű, ezért beágyazott betűkészlet kell.

## 4. Technológia

| Terület | Választás |
|---|---|
| Keretrendszer | **Next.js 16** (App Router, Turbopack), React 19. Frontend és backend egy alkalmazásban. |
| Nyelv | **TypeScript strict** a teljes forrásban (kliens, szerver, szkriptek, tesztek); `any` kerülendő |
| UI | Tailwind CSS 4 + shadcn/ui (Dialog, Tabs, Select stb.), lucide-react ikonok. Betűk `next/font`-tal a képek szerint (egy sans-serif, pl. Inter, és egy monospace a kódokhoz, dátumokhoz, számokhoz), `latin-ext` készlettel (ő, ű). |
| Adatlekérés a kliensen | TanStack Query a típusos API-kliensen át |
| Validáció | zod: a szerződés egyetlen forrása (5. fejezet) |
| Adatbázis és belépés | **Supabase** (Postgres + Auth), felhős projekt, **nem a vetdent projektje**. SQL-migrációk a Supabase CLI-vel (`supabase/migrations/`), generált típusok, RLS minden táblán. |
| PDF | Szerveroldali HTML → PDF headless Chromiummal (puppeteer-core), **ugyanabból a React-komponensből**, mint a 4. fül előnézete |
| Felületi szövegek | Egy helyen: `messages/hu.json`, next-intl, típusellenőrzött kulcsok. Lásd docs/I18N.md, az felülírja az egynyelvűséget |
| Tesztek | Vitest (egység + API-integráció a valódi Supabase-projekten, saját és utána törölt tesztadattal); méretellenőrző szkript valódi Chrome-mal (9. fejezet) |
| Formátumok | Időzóna `Europe/Budapest`, hu-HU számformátum. A lapon a dátum a képek szerint `ÉÉÉÉ-HH-NN`. |

**A Next.js 16 eltér attól, amit tudhatsz.** Néhány példa a vetdent tapasztalataiból:
- A middleware neve `proxy`, helye `src/proxy.ts`.
- A `cacheComponents` maradjon kikapcsolva (minden bejelentkezett oldal dinamikus), hacsak nincs rá jó okod. A vetdentben bekapcsolva azt tapasztaltuk, hogy a kérésidejű adat csak `<Suspense>` mögött olvasható.
- A vetdentben a Next az elhagyott oldalakat elrejtette (Activity), nem szüntette meg, így az űrlapok megőrizték az értékeiket. Új lap megnyitásakor az űrlapot mindig explicit módon inicializáld.

## 5. Architektúra: API-first

A backend verziózott REST/JSON API: `src/app/api/v1/**/route.ts`. **Minden adatművelet csak ezen át megy:** a frontend nem éri el közvetlenül az adatbázist, és adatra nem használ Server Actiont. Így a frontend később leváltható úgy, hogy a backendhez nem kell nyúlni.

**Rétegek**
- `src/contracts/` – zod sémák és típusok (kérés, válasz, hibakódok). Ez a frontend és a backend közös nyelve; ebből készül az OpenAPI-leírás (`GET /api/v1/openapi.json`).
- `src/server/` – szolgáltatásréteg (üzleti logika, Supabase-hozzáférés, PDF). Csak a route handlerek és a szerveroldali szkriptek importálhatják.
- `src/domain/` – tiszta szakmai logika (fogkatalógus, kódok, a táblázat jelöléseinek levezetése). Mellékhatás nélküli, a frontend és a backend is használhatja.
- `src/client/` – típusos API-kliens (fetch) és TanStack Query hookok.
- `src/app/(app)/…`, `src/components/` – felület.
- A határt ESLint-szabály (`no-restricted-imports`) őrzi: felületi kód nem importálhat `@/server/*`-t és `@supabase/*`-t.

**Belépés és munkamenet**
- Supabase Auth, e-mail + jelszó. Az API-nak saját hitelesítési végpontjai vannak: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- A böngészős (Next) kliens httpOnly sütis munkamenetet kap (`@supabase/ssr`). Más kliens `Authorization: Bearer <access token>` fejlécet küldhet. Az API mindkettőt elfogadja, és a tokent a JWKS alapján ellenőrzi (`supabase.auth.getClaims()` vagy `jose` a `SUPABASE_JWKS_URL`-lel).
- **A böngészőnek nem kell Supabase-kulcs:** nincs `NEXT_PUBLIC_` változó.
- Az API a felhasználó tokenjével éri el az adatbázist (publishable key + a felhasználó JWT-je), így az RLS mindig érvényesül. A secret key csak szerveroldali szkriptekben (felhasználó létrehozása, seed, tesztek) használható, a kérések feldolgozásában soha.
- Az állapotot változtató kéréseknél CSRF-védelem: SameSite süti, `Origin`-ellenőrzés, csak JSON.
- `src/proxy.ts`: frissíti a munkamenetet; be nem jelentkezett felhasználó oldalkérésre `/belepes`-re kerül, API-kérésre 401-es JSON-választ kap.
- Regisztrációs felület nincs. Felhasználót a `npm run user:create` szkript hoz létre: a felhasználó a **saját termináljában** futtatja, a jelszót rejtve kéri be, létrehozza a megerősített Auth-felhasználót és a rendelőtagságot. Te csak tesztfelhasználót hozhatsz létre (10. fejezet).

**API-konvenciók**
- JSON camelCase-szel, ISO dátumok. Minden bemenetet zod ellenőriz, a válaszokat a tesztek is ellenőrzik.
- Hibaformátum: `{ "error": { "code": "…", "message": "…", "fields": { … } } }`. A `code` stabil angol kulcs, a felület ezt fordítja magyarra a `messages/hu.json`-ból.
- Állapotkódok: 400, 401, 403, 404, 409, 422, 500. Listáknál `page` és `pageSize`.
- Az API útvonalai angolok (`/patients`), a felület útvonalai magyarok (`/belepes`, `/lapok/…`).

**Végpontok (legalább)**

| Végpont | Feladat |
|---|---|
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Belépés, kilépés, a belépett felhasználó és rendelője |
| `GET /reference-data` | Fogkatalógus fajonként, kódok és jelentésük, választéklisták |
| `GET /patients?q=&species=&page=` | Keresés állatnévre, gazdi nevére, telefonszámra |
| `POST /patients`, `GET /patients/{id}`, `PATCH /patients/{id}` | Állat felvétele, lekérése, módosítása |
| `GET /patients/{id}/sheets` | Az állat lapjai, a kezelés időpontja szerint **csökkenő** sorrendben |
| `GET /sheets?page=` | Legutóbbi lapok |
| `POST /sheets` | Új lap meglévő `patientId`-val, vagy új állat adataival (az új állat és a lap **egy tranzakcióban**) |
| `GET /sheets/{id}`, `PUT /sheets/{id}` | Teljes lap; mentés `version`-nel, eltérő verziónál 409 |
| `GET /sheets/{id}/pdf` | A4-es PDF letöltésre (`Content-Disposition: attachment`) |
| `GET /clinic`, `PUT /clinic` | A rendelő fejlécadatai a PDF-hez |
| `GET /openapi.json`, `GET /health` | Leírás és állapotellenőrzés |

Törlés most nem kell.

## 6. Adatmodell (Supabase)

- `clinics`: név, cím (irányítószám, település, utca), telefon, e-mail – a PDF fejléce. Egy demó rendelő.
- `clinic_members`: rendelő, felhasználó, megjelenített név, titulus (pl. „Dr.”). **Mindenki, aki a rendelő tagja, minden állatot és lapot lát és szerkeszthet.** Aki nem tag, semmit nem lát (403). Az adatok már most rendelőhöz kötöttek, így később több rendelő is kiszolgálható.
- `patients`: azonosító (UUID), rendelő, faj (`dog` | `cat`), név, fajta, ivar (`male` | `female` | `neutered_male` | `spayed_female`), becsült születési hónap (a megadott korból számolva, hogy a következő lapon a kor magától nőjön), utolsó testtömeg, gazdi neve, e-mail-címe, telefonszáma, létrehozás/módosítás ideje és szerzője.
  - Külön gazdi-nyilvántartás nincs: a gazdi adatai az állatnál vannak. Ezt döntésként rögzítsd, később bővíthető.
  - A faj csak addig módosítható, amíg az állatnak nincs lapja.
- `treatment_sheets`: azonosító, rendelő, állat, a kezelés dátuma, a listához szükséges oszlopok (pl. kezelőorvos), a vizitkori pillanatkép (kor év/hó, testtömeg, ASA), és a lap részletei egy **zod-dal ellenőrzött, verziózott `content jsonb`** mezőben: anamnézis, fogak foganként, periodontális összesítő, idegblokkok, varratok, röntgen, gyógyszerek, hazaadó tanácsok, kontroll. Továbbá `schema_version`, `version` (optimista zárolás), létrehozás/módosítás ideje és szerzője.
  - Rendezés: kezelés dátuma csökkenő, azon belül létrehozás ideje csökkenő.
  - Indokold a `docs/DONTESEK.md`-ben: a lap egy dokumentumként mentődik; ha később elemzés kell, a fogadatok normalizálhatók.
- RLS minden táblán: olvasni és írni csak a rendelő tagjai tudnak (`clinic_members` + `auth.uid()`).
- Az atomi műveletek (új állat + első lap) adatbázis-függvényben (`security invoker`, `set search_path = ''`).
- Minden migráció után generáld újra a típusokat.

## 7. Felület

### 7.1 Általános
- **Fejléc** (rögzített, a képek szerint): logó + „VetDent Pro” + „FOGÁSZATI LAP”; a négy fül; jobbra „Kezelési lapok”, „Mentés”, „PDF mentés”, „E-mail a gazdinak” (letiltva, „Hamarosan” jelzéssel), valamint a ↺ ikon (vissza az utolsó mentett állapotra, megerősítéssel). A „Minta Kutya / Minta Macska” gombok helyére **„+ Új lap”** kerül (felugró ablak: Kutya vagy Macska, illetve meglévő állat keresése). A fejléc egyetlen célméreten sem lóghat ki: álló tableten két sorba törik (felül logó és gombok, alatta a fülek teljes szélességben).
- **Mentés:** kifejezett „Mentés” gomb, ahogy a képen. A mentés állapota mindig látszik a gomb mellett („Mentve 10:42”, „Nem mentett változások”). Nem mentett változással elnavigáláskor vagy bezáráskor figyelmeztetés. A nem mentett változások helyi piszkozatként a böngészőben is maradjanak meg, és újranyitáskor a felület ajánlja fel a visszaállításukat.
- **Ütközés (409):** érthető ablak arról, hogy közben más is módosította a lapot; a felhasználó választ (az övé felülírja, vagy betölti a másikat). Csendben semmi nem veszhet el.
- **Felugró ablakok** a kitöltéshez, ahol csak lehet, hogy a felhasználó ne navigáljon el a lapról. Szabályaik: 9. fejezet.
- A felhasználói menüből érhető el a kilépés és a „Rendelő adatai” ablak (név, cím, telefon, e-mail a PDF fejlécéhez; logófeltöltés most nincs, az alkalmazás jelét használjuk).

### 7.2 Belépés (`/belepes`)
A képeken nem szerepel: a minta stílusában készüljön (logó, kártya, e-mail, jelszó, „Belépés” gomb, magyar hibaüzenetek).

### 7.3 Kezdőképernyő (`/`)
Két nagy gomb: „Új kezelési lap – Kutya” (narancs) és „Új kezelési lap – Macska” (lila); keresőmező a mentett állatokra (név, gazdi neve, telefonszám); a legutóbbi lapok listája. Egy képernyőn elfér, a lista görgetés helyett lapozható.

### 7.4 „Kezelési lapok” ablak
Bal oldalt az állatok listája kereséssel és fajszűrővel, lapozva. Jobb oldalt a kiválasztott állat adatai és kezelési lapjai **a kezelés időpontja szerint csökkenő sorrendben** (dátum, kezelőorvos, a fő beavatkozások rövid összegzése), „Megnyitás” gombbal, valamint „+ Új lap ennek az állatnak”. Az ablak nem görgethető, a listák lapozhatók.

### 7.5 Kezelési lap (`/lapok/[id]`; új lap: `/lapok/uj?faj=kutya|macska` vagy `?paciens=<id>`)
- Az aktív fül az URL-ben van (`?ful=1..4`).
- **Páciens-kártya** minden fülön, a képek szerint. Összecsukható; összecsukva az összegző sor látszik: név, faj címke, fajta, kor, nem, súly, gazdi, ASA, dátum.
- Mezők a képek szerint:
  - Páciens neve*, Faj (Odontogram típusa)* – „Kutya (42 fog)” narancs, „Macska (30 fog)” lila –, Fajta, Kor (év / hó), Súly (kg);
  - Gazdi neve*, Gazdi e-mail címe (PDF küldéshez), Gazdi telefonszáma, Állat neme (Hím / Nőstény / Ivartalanított hím / Ivartalanított nőstény);
  - ASA-státusz (Altatási rizikó) I–V, „I (egészséges) – V (kritikus)”; Utolsó etetés ideje (Koplalás); Preoperatív vérvizsgálat (választék); Kezelőorvos & Asszisztens (szabad szöveg, javaslatokkal);
  - Fő panaszok és indikációk (Válasszon egy vagy több tünetet), többválasztós címkék: Bűzös lehelet (halitosis), Fogkő, Fájdalom jelzése rágáskor, Fokozott nyálzás, Táplálási nehézség / féloldalas rágás, Letört fog, Ínyvérzés, Pofa dörzsölése;
  - Egyéb anamnézis / Panasz leírás, Otthoni szájhigiénia, Etetés / Táp típusa.
- A **kezelés dátuma** alapértelmezés szerint a mai nap; az összegző sorban a dátumra kattintva módosítható (a képen nincs külön mező).
- A gazdi e-mail-címe a képen kötelező, de amíg nincs e-mail-küldés, **ne legyen kötelező** (csak formátumellenőrzés); rögzítsd döntésként.
- A mentéshez kötelező: páciens neve, faj, gazdi neve, dátum. A 3. fül csillagos mezői (táplálási javaslat, rágási korlátozás) a PDF készítésekor figyelmeztetnek, ha üresek, de nem tiltanak.

### 7.6 1. fül – Odontogram & Fogvizsgálat (`kutya.png`, `macska.png`)

**A táblázat – pontosan a képek szerint**
- Cím: „Fogászati Kezelési Táblázat – Módosított Triadan Rendszer (Kutya · 42 fog)”, mellette: „Kattintson egy fogra a szerkesztéshez”. Kijelölés: Összes · Felső ív (Maxilla) · Alsó ív (Mandibula) · Patológiás fogak. Tableten ezek mellé egy „Többes kijelölés” kapcsoló kerül, mert ott nincs Shift.
- Fejléc: „PÁCIENS JOBB OLDALA (RHS)” – középen kékkel „KUTYA · 42 MARADANDÓ FOG” – „PÁCIENS BAL OLDALA (LHS)”.
- Felső blokk sorai: Calculus Index (0-3) · Gingivitis Index (0-3) · Mobilitás (0-3) · Egyéb · FOG (számok) · MAXILLA (fograjzok). Alsó blokk: MANDIBULA (fograjzok) · FOG · Calculus Index · Gingivitis Index · Mobilitás · Egyéb. Középen függőleges, szaggatott kék felezővonal; a két blokk között vékony vízszintes elválasztó.
- Sorrend balról jobbra:
  - kutya felső: 110 → 101 | 201 → 210; alsó: 411 → 401 | 301 → 311;
  - macska felső: 109 108 107 106 104 103 102 101 | 201 202 203 204 206 207 208 209; alsó: 409 408 407 404 403 402 401 | 301 302 303 304 307 308 309.
- Minden ívfélben a fogak egyenletesen kitöltik a fél szélességet, ezért a felső és az alsó oszlopok nem esnek egy vonalba (ahogy a képen).
- A Calculus, Gingivitis és Mobilitás sor a fog T1–T3, G1–G3, illetve Mob1–Mob3 kódjának fokát mutatja (üres, ha nincs ilyen kód). Az „Egyéb” cella a többi lelet- és kezeléskód rövidítése egymás alatt (pl. FX-C, PE, PD2, RX, X-S; U, POL, CURE; M), a kezeléskódok színkiemeléssel, ahogy a képen.
- **Fograjzok:** saját SVG, fogtípusonként (metsző-, szem-, előzáp- és zápfog; felső és alsó; kutya és macska), a képek stílusában (vékony körvonal). Jelölések: piros X = extrakció; szürke X = hiányzó; kék karika = röntgen vagy speciális kezelés; narancs kitöltés = fogkő vagy íny; lila = törés vagy TR. A kijelölt fog száma sötét türkiz (teal) jelvényben, a fog körül szaggatott keret, és a fog oszlopának cellái is kiemelve.
- Jelmagyarázat a táblázat alatt: „Áthúzott fog (X): hiányzó vagy extrahált · Kék karika (◯): röntgen vagy speciális kezelés jelölve.”, jobbra: „Kattintás: fog szerkesztése · Shift+kattintás: többes kijelölés”.
- **Érintési felület:** a fog teljes oszlopa (minden sora) egyetlen célfelület, mert álló tableten egy oszlop csak kb. 30 px széles; így a 44 px-es szabály a magasságban teljesül.
- **Aktív fog sáv:** pl. „401 · 1. metszőfog · Státusz: 0 · Kezelés: U, POL”, mellette a jelölések magyarázata (RX / Kezelés, Extrakció, Fogkő / Íny, Törés / TR).
- **Periodontális stádium (összesített):** Normál · 1. · 2. · 3. · 4. stádium (egy választható), Fogkő index, Ínygyulladás index, Okklúzió (harapás); macskánál ezeken felül Stomatitis / Feline resorptív státusz. Mellette a „Gyakori rövidítések a táblázatban” doboz.

**Fogszerkesztő – felugró ablak** (fogra kattintva; nem görgethető, szükség esetén fülekkel)
- Fejléc: fogszám jelvény, név (pl. „4. premoláris (PM4)”), kvadráns, ‹ › léptetés a szomszéd fogra.
- Tasakmélység szondázás (mm): Mesialis (M), Buccalis (B), Distalis (D), Palat./Ling. (L/P); „≥ 4 mm periodontális tasak” pirossal kiemelve.
- Fog állapota / Kóros elváltozások (több is választható): 0: Ép / Egészséges, T1–T3, G1–G3, PD1–PD4, Mob1–Mob3, Fur1–Fur3, FX-C, FX-CR, PE, UCF, TR1–TR5, M, U. Alatta a kiválasztott kódok magyarázata.
- Kezelés / Végzett beavatkozás ezen a fogon: U: Ultrahangos depurálás, POL: Polírozás, CURE: Subgingivális kürett, EXT-S: Egyszerű extrakció, EXT-SURG: Sebészi extrakció, RX: Dentális röntgen, ENDO: Gyökérkezelés, FLAP: Ínylebenyeg, BIO: Biopszia.
- Egyedi fogászati megjegyzés. A „Hangjegyzet rögzítése” gomb letiltva, „Hamarosan” jelzéssel.

**Gyorsbeviteli eszköztár** (a képen a jobb alsó panel), több kijelölt fogra: felugró ablakként nyílik a kijelölési sávból („Gyorsbevitel – 3 fog”), és a fogszerkesztő ablakban is elérhető. Tartalma:
- Cél (a kijelölt fogak); „Mindet depurál + políroz (U+POL)”;
- 1. Diagnosztikai gyorsgombok: Fogkő T1/T2/T3, Ínygyull. G1/G2/G3, Periodont PD1–PD4, Trauma/TR: FX-C, PE, TR (macska FORL), Mob, M;
- 2. Terápiás gyorsgombok: U, POL, RX, EXT-S, EXT-SURG, CURE;
- 3. Tasakmélység gyorsrögzítő minden oldalra: 1, 2, 3, 4, 5, 6, 8 mm;
- „Visszaállítás ép állapotra (0)”.

**Szabályok** (mind szakmai ellenőrzésre): TR-kód csak macskánál; hiányzó (M) fogra új lelet nem vehető fel; Fur csak többgyökerű fogon (a katalógus gyökérszáma alapján); a „0: Ép” kizárja a kóros kódokat.

### 7.7 2. fül – Anesztézia & Műtét (`3.png`)
- **Lokális érzéstelenítés & idegblokkok:** soronként Ideg (anatómiai elhelyezkedés), Oldal, Helyi érzéstelenítő, Mennyiség (ml), törlés; „+ Idegblokk hozzáadása”. A választéklisták a képen láthatókból indulnak (pl. N. infraorbitalis (felső elülső), N. mentalis (alsó elülső), Jobb, Bupivacain + Lidocain (1:1), Lidocain 2%). Minden további elem csak állatorvosi jóváhagyásra jelölve kerülhet be.
- **Varratok & sebészi részletek:** Alkalmazott varróanyag (alatta: „Gyakori: Monocryl 4-0 / 5-0 (gyorsan felszívódó), Vicryl 4-0”), Öltéstípus / Öltésminta, Részletes sebészi leírás / Megjegyzések.
- **Digitális fogászati röntgen (dentális RTG):** Felvételek száma, Röntgenvizsgálat lelete és megállapításai, Műtét alatti észrevételek / Szövődmények.

### 7.8 3. fül – Hazaadó lap & Gyógyszerek (`4.png`)
- **Otthoni gyógyszeres kezelési terv:** gyors sablonok (+ Fájdalomcsillapító, + Antibiotikum, + Szájápoló gél) és „+ Új gyógyszer”. Soronként: Készítmény neve & hatáserősség, Egyszeri adag, Gyakoriság, Időtartam (nap), Gazdinak szóló részletes alkalmazási útmutató, törlés. A sablonok tartalma szakmai adat (jóváhagyásra). Adagot a rendszer nem számol, az adag mezőt az orvos tölti ki.
- **Műtét utáni ápolás & gazdi tanácsok:** Táplálási javaslat a műtét utáni napokra*, Rágási korlátozások & fizikai kímélet*, Otthoni szájhigiénia a gyógyulás alatt, Kezelőorvos záró megjegyzése a gazdinak.
- **Kontroll időpont & varratszedés:** Javasolt kontroll dátuma, Kontroll célja / teendő.

### 7.9 4. fül – Zárójelentés előnézet (`5.png`, `6.png`)
- Felső sáv: „Nyomtatási & PDF előnézet (A4 formátum)” és a magyarázó sor. Gombok: „Közvetlen nyomtatás” (böngészős nyomtatás, nyomtatási CSS-sel), „PDF letöltése” (API), „E-mail küldése a gazdinak” (letiltva, „Hamarosan”).
- Az A4-es lap tartalma pontosan a képek szerint:
  - rendelői fejléc (jel, név, cím, telefon, e-mail), „ÁLLATORVOSI FOGÁSZATI LAP” címke, dátum;
  - páciens- és gazdiblokk;
  - Előzmények & fő panaszok (címkék + részletek);
  - Fogászati kezelési táblázat (ugyanaz a komponens, nyomtatási méretben);
  - periodontális összesítő és rövidítések;
  - Érintett & kezelt fogak részletezése (Fog #, Megnevezés, Patológia / Állapot, Tasak (mm), Beavatkozás, Megjegyzés), csak azokkal a fogakkal, amelyeken lelet vagy beavatkozás van;
  - Műtéti & érzéstelenítési napló;
  - Otthoni utókezelési terv & gazdi tájékoztató (gyógyszertáblázat, táplálási javaslat, rágási kímélet, kontroll);
  - lábléc: „Kelt:” dátum és település, a kezelőorvos neve, „Kezelőorvos aláírása és bélyegzője”, „VetDent Pro digitális orvosi rendszerből generálva”.
- A PDF a szerveren, **ugyanebből a komponensből** készül. Ha van nem mentett változás, a PDF előtt menteni kell (a gomb felajánlja). Fájlnév: `fogaszati-lap_<allatnev>_<datum>.pdf` (ékezet nélkül).
- Többoldalas lapnál a blokkok ne törjenek csúnyán (`break-inside: avoid`, táblázatfejléc ismétlése). Az ő és ű betű a PDF-ben is helyes (beágyazott betűkészlet).

## 8. Szakmai tartalom

- A szakmai adatokat (kódok jelentése és fokozatai, választéklisták, gyógyszersablonok, jelölési szabályok, gyökérszámok, a Calculus/Gingivitis/Mobilitás sor és a T/G/Mob kódok megfeleltetése) **állatorvosnak kell jóváhagynia**. Listázd őket a `docs/SZAKMAI_ELLENORZES.md`-ben, forrással (melyik kép) és azzal együtt, ami bizonytalan. Ilyen például az állapotkódok között szereplő „U” jelentése (az U kezeléskódként az ultrahangos depurálás).
- A képek feliratai a kiindulópont; új kódot ne találj ki.
- Az alkalmazás rögzít és megjelenít, nem dönt: nincs adagszámítás, automatikus diagnózis vagy kezelési javaslat.
- A fogkatalógus adatként él (`src/domain/teeth/`), nem a komponensbe égetve. Magyar fognevek a képek szerint: „1. metszőfog (I1)”, „Szemfog (C)”, „1. premoláris (PM1)”, „1. moláris (M1)”. Kvadránsok: 100 jobb felső, 200 bal felső, 300 bal alsó, 400 jobb alsó.

## 9. Megjelenés és méretek – KIEMELTEN FONTOS

A felhasználó eszközei, ezekre kell **nagyon pontosan** optimalizálni:

| Eszköz | Böngésző hasznos területe (CSS px) | Ellenőrzési méret |
|---|---|---|
| Laptop, 1920×1080 kijelző 150%-os nagyítással | kb. 1280 × 580–630 (a tálca és a böngészősávok miatt) | **1280×580** |
| iPad álló (10. gen / Air: 820×1180; 9. gen: 810×1080) | a Safari sávjai nélkül kevesebb | **820×1100**, **810×1000** |
| Android tablet álló (800×1280) | a Chrome és a rendszersávok nélkül kevesebb | **800×1150** |

Másodlagos méretek (itt sem törhet el semmi): 768×1024, fekvő tablet 1180×820, széles asztali 1920×1080.

Szabályok:
- Nincs vízszintes oldalgörgetés, nincs levágott vagy takart elem, minden gomb elérhető.
- **A felugró ablakok soha nem görgethetők.** Ami a legkisebb célméreten (1280×580) nem fér el, az fülekre bomlik. Tableten a képernyő-billentyűzet a magasság nagy részét elveszi: a fókuszban lévő mező ilyenkor se kerüljön a billentyűzet alá.
- **A teljes fogtáblázat mindig egyben látszik** minden célméreten, vízszintes görgetés és kicsinyítés nélkül, olvashatóan (a nyomtatási nézetben is). Laptopon a fejléc alatt kb. 500 px marad: a táblázatnak a fejlécével és a jelmagyarázatával együtt ebbe bele kell férnie.
- A fő fülek hosszabb tartalma (pl. a gyógyszerlista) a képek szerint lefelé görgethető; a fejléc (fülek, Mentés, PDF) közben rögzített.
- Gombok és szövegek azonnal elérhetők és olvashatók: érintési célfelület legalább 44×44 px; beviteli mezők 16 px-es betűvel (az iOS így nem nagyít rá); alap betűméret legalább 16 px; a táblázat apró feliratai se legyenek 11 px-nél kisebbek. Hoverhez kötött funkció nincs.
- Szín és méret csak tokenekből (`globals.css`). A fajok színe (kutya narancs, macska lila) és a jelölések színei a képekből mérve.
- **Automatikus ellenőrzés:** `npm run check:layout` valódi Chrome-mal (puppeteer-core, `CHROME_PATH`), éles buildre (`npm run build && npm run start`). Minden fő oldalon és **minden felugró ablakot kinyitva**, minden célméreten ellenőrzi: vízszintes túlcsordulás, a képernyőből kilógó elem, görgethető felugró ablak (`scrollHeight > clientHeight`), 44 px alatti érintési cél. Képernyőképet ment a `template pics/screenshots/` mappába (helyi, Gitben nincs); ezeket nézd meg, és vesd össze a mintaképekkel. Új oldal vagy ablak = új bejegyzés a szkript listájában. Minden felületi változtatás után futtasd; **ami ott nem tökéletes, az nincs kész.** A billentyűzet hatását tableten kézzel kell megnézni (a böngészőpanel `resize_window` eszközével).

## 10. Titkok és biztonság

- A felhasználó a Supabase-adatokat a `.env.supabase` fájlba tette (változók: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`). Az 1. fázisban **fájlmásolással** (pl. `Copy-Item`) vidd át `.env.local`-ba, mert a Next ezt tölti be. Bővítsd a `CHROME_PATH`-szal. **Az értékeket soha ne olvasd ki, és ne írd ki** a csevegésbe, naplóba vagy kódba. A `.env.example` csak a változóneveket tartalmazza, és Gitben van; minden más `.env*` fájlt a `.gitignore` kizár.
- A Supabase-projekt új, és csak a vetdent-lighté (nem a vetdent projektje). Jelenleg ez a fejlesztői és a demóprojekt is: a tesztek csak saját, megjelölt tesztadatot hozhatnak létre, és utána törlik (`itest-…@vetdent-light.test`).
- A Supabase Auth önregisztrációját ki kell kapcsolni: regisztrációs felület nincs, de az Auth végpontja alapból nyitva lehet. Ez projektbeállítás, ezért kérd meg a felhasználót, hogy kapcsolja ki (Authentication → Sign In / Providers → „Allow new users to sign up”), vagy kérdezz, mielőtt bármit átállítasz.
- Ár, titok és belépési adat nem kerül a kódba.
- Böngészős próbánál a felhasználó saját munkamenetét **soha ne léptesd ki**. Tesztfelhasználót a secret key-jel hozz létre (`e2e-…@vetdent-light.test`, előre megerősítve, véletlen jelszóval, amelyet nem írsz ki), és utána töröld.

## 11. Környezet (ez a gép: Windows, céges, nincs rendszergazdai jog)

- Node.js 24.15, npm 11.12, Git 2.46. A GitHub CLI (`gh`) nincs telepítve.
- Az eszközshell nem örökli a friss PATH-t. Parancsok előtt: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`, és `npm.cmd` / `npx.cmd`.
- **Git:** a távoli tároló `git@github.com:borysz/vetdent-light.git` (privát), az ág `main`. A repóhoz saját, jelszó nélküli deploy kulcs tartozik írási joggal (`~/.ssh/vetdent_light_deploy_ed25519`), amelyet a repó helyi `core.sshCommand` beállítása használ, ezért a `git push origin <ág>` kérdés nélkül működik. `--force` soha. Munkafán a saját ágadra pusholj; `main`-re csak akkor, ha közvetlenül a fő mappában dolgozol, vagy a felhasználó kéri.
- A commit-üzenet angol; PowerShell here-stringben **ne legyen benne idézőjel** (különben a parancs szétesik). A végén a mindenkori utasítás szerinti `Co-Authored-By` sor áll.
- **Munkafán (worktree)** a Gitben nem lévő fájlok (`template pics/`, `.env.supabase`, `.env.local`) nincsenek meg: a képeket és ezt a fájlt abszolút úttal olvasd, a `.env.local`-t másold át.
- **Chrome** headless futtatáshoz: `C:\Program Files\Google\Chrome\Application\chrome.exe`. Az Edge headless módban ezen a gépen nem indul (a vetdent tapasztalata).
- **Supabase CLI** devDependencyként (`npx supabase …`). Ezen a gépen valószínűleg nincs bejelentkezve; ellenőrizd a `npx supabase projects list` paranccsal. Ha nem megy, kérd meg a felhasználót, hogy a **saját termináljában** futtassa a `npx supabase login` parancsot (böngészős belépés). Utána: `npx supabase link --project-ref <ref>`; a ref a `SUPABASE_URL` aldomainje, olvasd ki szkripttel, a kulcsokat ehhez se írd ki.
- **Migráció:** `npx supabase db push`. Ehhez adatbázisjelszó kell: a felhasználó maga írja be a `.env.local`-ba `SUPABASE_DB_PASSWORD` néven, vagy a parancs kéri a termináljában. A céges hálózati védelem (Sophos) a közvetlen Postgres-kapcsolatot időnként megszakítja; **a tanúsítvány-ellenőrzést ilyenkor sem szabad kikapcsolni.** Működő kerülőút HTTPS-en: `npx supabase db query --remote --yes --file supabase/migrations/<fájl>.sql`, majd `insert into supabase_migrations.schema_migrations (version, name) values ('<verzió>', '<név>')`. Típusok: `npx supabase gen types typescript --linked` (HTTPS-en is megy). Új migráció után mindig frissítsd a típusokat.
- **Böngészőpanel** (Claude asztali alkalmazás): a háttérben lévő oldal nem kap képkockát, ezért teljes betöltés után az oldal „megállhat”; kérj képernyőképet, vagy kattints. A panel `launch.json`-ja a munkamenet mappájában van, nem a projektben.
- Kérésre dolgozz az 5 órás keret kb. 90%-áig (`mcp__ccd_session_mgmt__get_usage`, ToolSearch-csel tölthető be), a végén pusholj.

## 12. Fázisok

1. **Alapozás:**
   - Next.js-váz a meglévő mappába; a `.git`, `.gitignore`, `.env.supabase` és `template pics/` maradjon. A `create-next-app` nem üres mappába nem települ, ezért ideiglenes mappában generáld, és másold át.
   - TypeScript strict, ESLint (rétegszabállyal), Vitest, Tailwind + shadcn/ui, next-intl (`messages/hu.json`), a képekből mért tokenek.
   - `.env.local` és `.env.example`; a Supabase CLI összekötése; `npm run check` (lint + typecheck + test).
   - Dokumentáció: `CLAUDE.md` (átadási jegyzet a következő munkamenetnek: mi ez, technológia, szabályok, gépfüggő tudnivalók, és hogy az eredeti igény ez a helyi fájl; titok nélkül), `README.md`, `docs/FELULET.md`, `docs/DONTESEK.md`, `docs/NYITOTT_KERDESEK.md`, `docs/SZAKMAI_ELLENORZES.md`, `docs/OTLETEK.md`.
2. **Adatbázis, API-váz, belépés:**
   - Migrációk (`clinics`, `clinic_members`, `patients`, `treatment_sheets`), RLS, típusgenerálás.
   - `src/contracts`, `src/server`, hibakezelés, OpenAPI, hitelesítési végpontok, `src/proxy.ts`, `user:create` szkript, belépőoldal.
   - API-integrációs tesztek: 401, 403 (nem tag semmit nem lát), RLS, 409 verzióütközés, az új állat és a lap tranzakciója.
3. **Alkalmazáshéj:** fejléc minden célméreten, kezdőképernyő, „Kezelési lapok” ablak, új lap folyamata (faj választása vagy meglévő állat), mentés és állapotjelzés, figyelmeztetés elhagyás előtt, helyi piszkozat, a `check:layout` szkript első változata.
4. **1. fül:** páciens-kártya, anamnézis, fogkatalógus (kutya 42, macska 30), a fogtáblázat SVG-vel pontosan a képek szerint, kijelölés, fogszerkesztő ablak, gyorsbevitel, periodontális összesítő. Egységtesztek a katalógusra és a jelölések levezetésére.
5. **2. és 3. fül.**
6. **4. fül és PDF:** A4-es előnézet, nyomtatási CSS, szerveroldali PDF (`GET /sheets/{id}/pdf`), ékezetek, többoldalas tördelés.
7. **Demóadat és simítás:** seed (a képek két példája, Max kutya és Mici macska, semleges demó rendelővel és e-mail-címekkel), teljes `check:layout` minden célméreten, a képernyőképek összevetése a mintaképekkel, dokumentáció frissítése.

## 13. Elfogadási feltételek

1. Belépés nélkül semmi nem érhető el (oldal → `/belepes`, API → 401); a rendelőhöz nem tartozó felhasználó 403-at kap.
2. Kutyánál 42, macskánál 30 fog jelenik meg, helyes Triadan-számozással és oldalhelyességgel (a páciens jobb oldala a képernyő bal felén), pontosan a minta szerinti táblázatban.
3. Új állat adatai + kitöltött lap + Mentés → az állat és a lap az adatbázisban van; újranyitva minden mező ugyanaz.
4. Egy állatnak több lapja is lehet: kiválasztáskor a lapok a kezelés időpontja szerint csökkenő sorrendben jelennek meg. Új lapnál az állat adatai előtöltve, a kor a becsült születési hónapból frissül.
5. Több fog kijelölése után egy gombbal U+POL kerül mindegyikre; a táblázat sorai és jelölései azonnal frissülnek; TR csak macskánál választható.
6. A 4. fül előnézete és a letöltött PDF a minta szerinti A4-es dokumentum, helyes ékezetekkel; a nyomtatás is működik.
7. Minden oldal és felugró ablak a célméreteken (1280×580, 820×1100, 810×1000, 800×1150): nincs vízszintes görgetés, a felugró ablakok nem görgethetők, a teljes fogtáblázat egyben látszik, minden gomb legalább 44 px és elérhető. Az automatikus ellenőrzés zöld, a képernyőképek a mintát követik.
8. Minden adatművelet elérhető az `/api/v1` alatt, OpenAPI-leírással; a felületi kód nem importál szerveroldali kódot (lint-szabály őrzi).
9. Ha két böngészőben ugyanazt a lapot szerkesztik, a második mentés ütközést jelez; csendben semmi nem íródik felül.
10. Titok nincs a Gitben; a `.env*` fájlok ki vannak zárva.

## 14. Amit most ne csinálj

- **Diktálás:** később lesz. Most csak a „Hangjegyzet rögzítése” gomb jelenjen meg letiltva, és a többsoros szövegmezők egy közös komponensen menjenek át, hogy a mikrofon később egy helyen bekerülhessen.
- **E-mail-küldés:** a gombok letiltva, „Hamarosan” jelzéssel.
- Adminisztrációs felület, regisztráció, jelszó-visszaállítás, szerepkörök, előfizetés, fizetés, offline működés / PWA, gazdiportál, fotó- vagy röntgenkép-feltöltés.
- Telepítés (pl. Vercel) vagy bármilyen új külső szolgáltatás bekötése: előbb kérdezz.
- Gyógyszeradag-számítás, automatikus diagnózis vagy kezelési javaslat.
- A vetdent `referencia/*.jpg` ábráinak másolása vagy átrajzolása; harmadik fél logója.
- Ne jelents késznek olyat, aminek a tesztje vagy a méretellenőrzése nem zöld: ilyenkor írd le pontosan, mi nem működik.
