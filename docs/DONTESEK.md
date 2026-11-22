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
| A felületen nem jelenik meg a fogak darabszáma (nincs „42 fog” / „30 fog” a kártyákon, az ablakokban és a faj gombjain) | A megrendelő kérése (2026-11-21). A fogtábla címéből és fejlécéből is kikerült (4. fázis), a mintaképeken még „Kutya · 42 fog” áll | `messages/hu.json` |

## 4. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A fogtábla címében és fejlécében nincs fogszám („… (Kutya)”, „KUTYA · MARADANDÓ FOGAK”) | A megrendelő a felületről kérte a fogszám elhagyását; a kártyáknál már így van | `messages/hu.json` (`chart.*`) |
| A tábla két külön rács (maxilla, mandibula); minden ívfélben a fogak egyenletesen töltik ki a fél szélességet, ezért a felső és az alsó oszlopok nem esnek egy vonalba | Pontosan a mintaképek szerint | `src/components/chart/dental-chart.tsx` |
| Egy fog teljes oszlopa egyetlen érintési cél (átlátszó gomb az oszlop fölött) | Álló tableten egy oszlop kb. 30 px széles; a 44 px a magasságban teljesül | `dental-chart.tsx`, `check-layout.ts` (`data-touch="column"`) |
| Az „Egyéb” cella a kódokat a tényleges oszlopszélességhez tördeli; alacsony képernyőn (≤ 700 px magas) legfeljebb 3 sort mutat, a többit „+n” jelzi (a fogszerkesztőben és az aktív fog sávban minden kód látszik) | A teljes táblának a laptop fejléce alatti kb. 510 px-be kell férnie a legrosszabb esetben is | `src/domain/teeth/derive.ts` (`packChips`), `odontogram-tab.tsx` |
| Alacsony képernyőn a tábla sorai tömörebbek (index 18 px, fograjz 40 px), magasabb képernyőn nagyobbak (24 / 56 px) | Ugyanaz az ok | `dental-chart.tsx` (CSS-változók) |
| Több fog kijelölésekor a kijelölő gombok helyére a kijelölési sáv kerül („N fog kijelölve”, „Gyorsbevitel – N fog”, „Kijelölés törlése”) | Ne nőjön a tábla magassága új sorral | `odontogram-tab.tsx` |
| A fogszerkesztő ablak két fülre bomlik (Állapot, Kezelés); a gyorsbevitel a lábléc gombjáról külön ablakban nyílik | A felugró ablak nem görgethető, a három rész együtt nem fér el 1280×580-on | `tooth-editor-dialog.tsx` |
| A gyorsbevitel gombjai kapcsolók: ha minden érintett fogon megvan a kód, a kattintás leveszi; a nem alkalmazható fogakat kihagyja és megszámolja | Gyors javítás lehetősége; a szabályok ugyanazok, mint a fogszerkesztőben | `quick-panel.tsx` |
| A gyorsbevitelben a TR-nek (csak macskánál) és a mobilitásnak fokozatonként külön gombja van (TR1–TR5, Mob1–Mob3), nem egy „TR” és egy „Mob” gomb | A mintaképen a fokozat nem derül ki; fokozatot nem találunk ki | `quick-panel.tsx` |
| A fograjzok saját SVG-k a minták stílusában (vékony körvonal, koronavonal); a felső fogak az alsók tükörképei, így mindkét ív koronái a vízszintes elválasztó felé néznek | A `referencia/*.jpg` ábrái nem másolhatók; a minták stílusát követjük | `tooth-drawing.tsx` |
| Fajváltáskor (csak az első mentés előtt lehetséges) a fogadatokból az marad meg, ami az új fajnál is érvényes | A kutya és a macska fogai és kódjai eltérnek | `adaptTeethToSpecies` |
| Az API a fogadatokat a fajhoz ellenőrzi (létező fog, megengedett kód), hibánál 422 | A szabályok a szerveren is érvényesüljenek | `src/server/services/sheets.ts` |
| A preoperatív vérvizsgálat szabad szöveges mező egy javaslattal („Normál referenciaértékek”) | A mintaképen csak ez az egy elem látszik; további elemet nem találunk ki | `patient-card.tsx` |
| A hosszú fülnevek csak 1800 px-től látszanak (alatta a rövidek) | 1536–1800 px között a teljes nevek két sorba törtek | `app-header.tsx` |

## 5. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| Az idegblokk ideg-, oldal- és érzéstelenítő-listája csak a mintaképen látható elemeket tartalmazza (két ideg, két érzéstelenítő); az oldalaknál a „Jobb” mellé a „Bal” is bekerült | Új szakmai elemet nem találunk ki; a „Bal” a „Jobb” nyilvánvaló párja, és a minta mentális idegblokkja is bal oldalra kellhet. Mindhárom szöveg `pending` | `src/domain/anesthesia.ts`, `messages/hu.json` |
| A listák értékei kódok (`infraorbital`, `right`, `lidocaine_2`), a nevek felületi szövegek; ha a lapon olyan érték van, ami nincs a listában, a mező mégis megmutatja | A zárójelentés és más nyelvek a kódból fordítanak; adat nem rejtőzhet el | `anesthesia-tab.tsx` |
| A gyógyszersablonok kitöltik a nevet, a gyakoriságot, az időtartamot és az útmutatót, **az adagot soha** | Az alkalmazás nem számol adagot, az adag mezőt az orvos tölti ki | `src/domain/medications.ts`, `messages/hu.json` (`medicationTemplates`) |
| A fájdalomcsillapító sablon útmutatója faj nélküli („Gyulladáscsökkentő és fájdalomcsillapító. Mindig teli gyomorra adandó!”); a mintán „kutyáknak” szerepel | Macskánál a sablon ne állítson fajra nem igaz dolgot; a készítmény macskára való alkalmasságát az állatorvosnak kell eldöntenie | `messages/hu.json` |
| A számmezők (mennyiség, felvételek száma, időtartam) tizedesvesszőt fogadnak, és csak érvényes értéket tárolnak (gépelés közben a szöveg megmarad, pl. „1,”) | A tizedesjel egységesen vessző | `src/components/ui/number-input.tsx` |
| A táplálási javaslat és a rágási korlátozás mezője csillagos (kötelező jelzéssel), de a mentést nem tiltja; a PDF készítésekor (6. fázis) figyelmeztet, ha üres | A leírás szerint | `homecare-tab.tsx` |
| Keskenyebb képernyőn az idegblokk sora két sorba tördelődik (ideg és oldal fent, érzéstelenítő és mennyiség lent, törlés jobbra), a hosszú nevek így nem vágódnak le | Álló tableten a nevek egy sorban nem fértek el | `anesthesia-tab.tsx` |

## 6. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| Az A4-es zárójelentés **egyetlen React-komponens** (`ReportDocument`): az előnézet, a böngészős nyomtatás és a szerveroldali PDF is ebből készül | A leírás szerint; ami az előnézeten látszik, az kerül a papírra | `src/components/report/report-document.tsx` |
| Az előnézet az **aktuális, akár mentetlen** szerkesztésből készül; a PDF a **mentett** állapotból | A PDF-et a szerver állítja elő, ami csak mentett adatot lát | `report-data.ts`, `src/server/pdf.ts` |
| A PDF gomb (a 4. fülön és a fejlécben) mentetlen változásnál felajánlja a mentést („Mentés és PDF”); üres táplálási javaslatnál vagy rágási korlátozásnál figyelmeztet, de nem tilt („PDF így is” / „Kitöltöm”) | A leírás szerint | `sheet-editor.tsx` |
| A PDF-et a szerveren futó **valódi Chrome** nyomtatja (`puppeteer-core`, `CHROME_PATH`) a `/print/sheets/<id>` oldalból, a hívó hitelesítő adataival (Bearer fejléc vagy süti), így az oldal a lapot az API-n át, a hívó jogaival olvassa | A leírás szerint; az RLS itt is érvényes | `src/server/pdf.ts`, `src/app/print/sheets/[id]/page.tsx` |
| A Chrome a szerver saját címén éri el a nyomtatási oldalt (`INTERNAL_BASE_URL`, alapérték `http://127.0.0.1:6438`), nem a publikus néven | A publikus név a saját hálózatból nem biztos, hogy elérhető | `src/server/env.ts` |
| Egyszerre legfeljebb 2 Chrome fut, a többi kérés sorban vár | A memóriahasználat korlátozása | `src/server/pdf.ts` |
| A nyomtatási oldalt (`/print/…`) a proxy csak bejelentkezettnek vagy Bearer fejléces kérésnek engedi | Az oldal maga nem tartalmaz adatot, de nem lehet nyilvános | `src/proxy.ts` |
| A fájlnév ékezet nélküli: `fogaszati-lap_<allatnev>_<datum>.pdf` (pl. „Őzike” → `ozike`) | A leírás szerint | `src/domain/report.ts` |
| Az ő és ű betűk a PDF-ben helyesek: a Chrome a használt betűkészletet (Inter, `latin-ext`) beágyazza; a `check:pdf` a PDF-ből kiolvasott szövegben ellenőrzi őket | Ismert csapda a PDF-könyvtárak alapbetűivel (Latin-1) | `scripts/check-pdf.ts` |
| A „Érintett & kezelt fogak” táblázat csak azokat a fogakat sorolja, amelyeken lelet, kezelés, tasakmélység vagy megjegyzés van; ha egy fogon csak kezelés van és nincs állapotkód, az állapot „–” (nem „Egészséges”) | Az alkalmazás rögzít, nem dönt: egészségesnek csak az „0” kód jelöli | `src/domain/report.ts`, `report-document.tsx` |
| A táblázatfejléc minden oldalon ismétlődik, a sorok és a nagy blokkok nem törnek két oldalra (`break-inside: avoid`) | A leírás szerint | `report-document.tsx` |
| A zárójelentés fogtáblája rögzített sormagasságú (`compact`), így a képernyőtől függetlenül ugyanúgy néz ki; a keskeny állapotokban a sorfeliratok rövidek („Calculus (0-3)”, „Gingivitis (0-3)”) | A hosszú feliratok háromsorosra törtek és egymásba értek | `dental-chart.tsx` |
| Az előnézet A4 szélességű lap, amely a rendelkezésre álló szélességhez kicsinyítve látszik (felfelé nem nagyít), így nincs vízszintes görgetés | A leírás szerint | `scaled-page.tsx` |
| Böngészős nyomtatásnál a fejléc, a páciens-kártya és az eszköztár rejtett, csak a zárójelentés nyomtatódik; az `@page` A4, 12 mm margó | Közvetlen nyomtatás | `globals.css`, `app-header.tsx`, `sheet-editor.tsx` |
| A `puppeteer-core` éles függőség (nem csak fejlesztői); az `@next` külső csomagként kezeli | A szerver futás közben használja | `package.json`, `next.config.ts` |
| A `.env.local`-ban (és éles környezetben) szükséges: `CHROME_PATH`, opcionálisan `INTERNAL_BASE_URL` | A PDF-hez Chrome kell a szerver gépén | `.env.example` |

## 7. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A demóadat a mintaképek két példája (Max kutya, Mici macska), semleges nevekkel (Minta Péter, Dr. Minta Eszter) és `example.com` címekkel; a magyar szövegek az adatfájlban vannak (`supabase/seed/demo-data.json`), nem a kódban | A képeken szereplő nevek csak példák; a kód nyelve angol | `supabase/seed/demo-data.json`, `scripts/lib/demo.ts` |
| A demófogak alapállapota „0” (ép) és U+POL, rajta a mintán látható eltérések (108 extrakció, 104, 204, 409, 308 a kutyánál; 108, 208, 407, 307 a macskánál) | Ugyanazt mutatja, mint a mintakép; a betöltés a fogszabályokat ellenőrzi | `scripts/lib/demo.ts`, `tests/demo-data.test.ts` |
| `npm run seed:demo` az első rendelőbe tölt (vagy `--clinic "Név"`); újrafuttatva nem duplikál (azonos gazdi e-mail alapján); `--reset` törli a két demóállatot és a lapjaikat | Visszafordítható, ismételhető | `scripts/seed-demo.ts` |
| A rendelő üres fejlécadatait a demóadat tölti ki, a már megadottakat nem írja felül; a rendelő nevét nem módosítja | A felhasználó saját adatát nem írjuk felül | `fillDemoClinic` |
| A demóadat a megrendelő rendelőjébe (`Demo clinic`) is bekerült | A leírás szerint a Supabase-projekt egyben a demóprojekt is | – |
| Az összevetés a mintaképekkel három eltérést talált és javított: 1920 px-en a negyedik fül neve levágódott (a teljes fülnevek most 2200 px-től látszanak, a `check:layout` ezt már jelzi); az A4 előnézet középre került; az előzmények sorainál a „Részletek:” felirat csak a szabad szöveg előtt áll | Pontos egyezés a mintával, hiba nélkül | `app-header.tsx`, `scaled-page.tsx`, `report-document.tsx` |
| A címek mondatkezdő nagybetűsek, nem minden szó nagybetűs, mint a mintán | A helyes magyar helyesírás szerint | `messages/hu.json` |

## Karbantartás (kódátnézés)

| Döntés | Indok | Módosítás helye |
|---|---|---|
| Az `.env.example` bekerült a Gitbe: a `.gitignore` második `.env*` sora (a későbbi szabály nyer) kizárta, így friss klónban nem lett volna miből másolni | Hiba volt | `.gitignore` |
| Az eszközmappák (`.claude/`, `.agents/`, `.codex/`) gépenként eltérők, ezért nincsenek a Gitben | Tiszta `git status` | `.gitignore` |
| A használaton kívüli Next-sablonképek törölve (`public/*.svg`) | Nem hivatkozott rájuk semmi | `public/` |
| A fejlesztői szerver további hostnevei a `ALLOWED_DEV_ORIGINS` környezeti változóból jönnek (vesszővel elválasztva), a publikus DNS-név nincs a tárolóban | A tároló ne kötődjön egy géphez | `next.config.ts`, `.env.example` |
| A nem használt `prettier` eltávolítva; a `vite` közvetlen fejlesztői függőség (a Vitest-beállítás importálja); a csomag neve `vetdent-light`, `engines`: Node ≥ 24 | Rend a függőségekben | `package.json` |
| Közös segédek az ismétlések helyett: `src/domain/date.ts` (egy „ma” a rendelő időzónájában), `src/components/sex-labels.ts`, `src/components/ui/input-styles.ts` (egy űrlapmező-stílus), `src/server/db/json.ts` (a JSON-átalakítás egy nevesített helyen), `scripts/lib/e2e.ts` (a böngészős ellenőrzések közös ideiglenes felhasználója, hiba esetén is takarít), `src/components/sheet/use-pdf-download.ts` (a PDF-letöltés külön hookban) | Kevesebb ismétlés, egy helyen javítható | lásd az oszlopban |
| A `CLAUDE.md` egyszer megduplázódott egy javítószkript miatt (`String.replace` és a `$` jelek): újraírva; a `tests/docs.test.ts` őrzi az ismétlődő bekezdéseket és a nem létező fájlokra mutató hivatkozásokat | A hiba így nem ismétlődhet észrevétlenül | `CLAUDE.md`, `tests/docs.test.ts` |
| Új dokumentum: `docs/ARCHITEKTURA.md` (felépítés, adatfolyam, bővítés lépései); a `README.md` a teljes indulási útmutatót tartalmazza | Új fejlesztő gyorsan eligazodjon | `docs/`, `README.md` |

## Elfelejtett jelszó

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A levelet ideiglenesen a Supabase beépített levelezője küldi; saját levélküldő rendszer később | Megrendelői döntés; a korlátokat a `docs/JELSZO_VISSZAALLITAS.md` írja le | `TODO.md` |
| A kérés válasza mindig ugyanaz (202), akár létezik a fiók, akár nem | Ne lehessen kipróbálni, kinek van fiókja | `src/app/api/v1/auth/password-reset/route.ts` |
| A `/auth/confirm` a levél kétféle linkjét is elfogadja: `token_hash` (saját sablon, bármelyik eszközön működik) és `code` (alapsablon, csak a kérő böngészőben) | A sablon cseréje nem töri el a már kiküldött linkeket | `src/server/services/password.ts` |
| A `/auth/confirm` relatív címre irányít át | A szerver a saját belső címét látja (0.0.0.0, proxy mögött), nem a publikusat | `src/app/auth/confirm/route.ts` |
| Az új jelszó legalább 12 karakter, kétszer kell beírni; ugyanez a szabály a parancssori `user:create` és `user:password` esetén | Egy helyen definiálva (`MIN_PASSWORD_LENGTH`) | `src/contracts/auth.ts` |
| A Supabase Auth beállításait (címek, SMTP) szkript írja a Management API-n, nem a `supabase config push` | A `config push` a teljes beállítást felülírná (például visszakapcsolhatná az önregisztrációt); a szkript csak a nevesített mezőket küldi, és megerősítést kér | `scripts/supabase-auth-config.ts` |
| Egyelőre a Supabase alapsablonja küldi a levelet | Megrendelői döntés; a saját sablon a `docs/JELSZO_VISSZAALLITAS.md`-ben kész, ha kell | `docs/JELSZO_VISSZAALLITAS.md` |
| A belépési, az elfelejtett jelszó és az új jelszó oldal közös kártyát használ | Egy kinézet, egy helyen javítható | `src/components/auth/auth-card.tsx` |

## Röntgenképek csatolása

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A 2. fül röntgen szekciójában képek csatolhatók ráhúzással és fájlválasztással | Megrendelői kérés (a MASTER_PROMPT még későbbre hagyta) | `src/components/sheet/radiograph-gallery.tsx` |
| Csak mentett laphoz lehet képet csatolni; új lapon „előbb mentse” üzenet | A kép a laphoz tartozik, a lapnak előbb azonosítója kell | uo. |
| JPEG (.jpg, .jpeg), PNG, WebP és PDF; fájlonként legfeljebb 15 MB, laponként legfeljebb 30 fájl; a típust a szerver a fájl tartalmából ellenőrzi | A rendelő röntgenszoftvere JPEG-et és PDF-et exportál (megrendelő, 2026-11-22); PNG és WebP például tabletes fotóhoz. A korlát az adatbázis méretét és a tableten a feltöltési időt védi | `src/contracts/radiographs.ts`, `src/server/services/radiographs.ts` |
| A képek bélyegképként és nagy nézetben látszanak; a PDF egy PDF-csempe, amely új lapon, a böngésző saját PDF-nézőjében nyílik meg | A PDF-et a böngésző nem tudja bélyegképként mutatni; a saját PDF-néző tableten is jól kezelhető | `src/components/sheet/radiograph-gallery.tsx` |
| A fájl végpontja `/radiographs/{id}/file` (nem `/image`), `inline` megnyitással és az eredeti fájlnévvel | Nem csak kép jöhet rajta; a mentett PDF megtartja a nevét | `src/app/api/v1/radiographs/[id]/file/route.ts` |
| A „Felvételek száma” mező nem változik a csatolt képek számától | Az alkalmazás rögzít, nem dönt: a felvételek száma eltérhet a csatolt képekétől | — |
| **A kép az adatbázis-táblában van** (`sheet_radiographs.image`, bytea), nem a Supabase Storage-ban | Megrendelői döntés (2026-11-22). Következmény: az adatbázis mérete a képekkel nő (ingyenes csomag: 500 MB), a mentésekben is benne vannak | `supabase/migrations/20261122140000_radiographs_in_database.sql` |
| A kép base64-ben megy az adatbázis-függvényekbe és onnan vissza; a listák a képet nem töltik le | A base64 fele akkora, mint a bytea hexa alakja; a lista gyors marad | `src/server/services/radiographs.ts` |
| A képek csak az API-n át, a rendelő tagjainak érhetők el | Egészségügyi adat; nyilvános link nincs | `supabase/migrations/20261122120000_sheet_radiographs.sql` |
| Az első változat Storage-tárhelyét (`radiographs`) töröltük; új telepítésen az első migráció még létrehozza, de üres marad és nem használjuk | A már feltöltött migrációt nem írjuk át | `supabase/migrations/` |
| A fájlok egyesével töltődnek fel | Gyenge tabletes hálózaton se induljon egyszerre tíz nagy kép | `src/components/sheet/radiograph-gallery.tsx` |
| A képek nem kerülnek a zárójelentésbe és a PDF-be | Nem volt kérés; ötletként felírva | `docs/OTLETEK.md` |

## Sok adat: kereső és lapozó

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A listák mindig lapoznak (4 elem oldalanként), sosem jelenik meg minden egyszerre; a lapozón első és utolsó oldal gomb is van | 1500 állatnál 375 oldal lett, az utolsó oldal csak előre-hátra lépkedve 374 koppintás lett volna | `src/components/ui/pager.tsx` |
| A kereső nem érzékeny az ékezetekre és a kis- és nagybetűre („Kovacs” megtalálja a „Kovács” gazdit) | Tableten gyakran ékezet nélkül gépelnek | `supabase/migrations/20261122090000_patient_search.sql`, `src/domain/text.ts` |
| Telefonszám szóközök nélkül és 06-tal kezdve is kereshető | A rendelőben így mondják és gépelik | `src/server/services/patients.ts` |
| A keresőmezők az adatbázisban számított oszlopok (`search_text`, `phone_digits`), nem külön index | 1500 állattal és 3000 lappal is fél másodperc alatt válaszol (`npm run check:volume`) | `supabase/migrations/` |

## Telepítés: Render.com

| Döntés | Indok | Módosítás helye |
|---|---|---|
| Render.com, **natív Node-szolgáltatás** (nem Docker) | Megrendelői döntés | `render.yaml`, `docs/TELEPITES_RENDER.md` |
| A Chrome-ot a build tölti le a projekt `.chrome/` mappájába (`npm run chrome:install`, Chrome headless shell); ha a `CHROME_PATH` üres, a szerver ezt találja meg | A Render natív környezetében nincs Chrome, és a letöltött Chrome útvonala verziófüggő | `src/server/chrome.ts`, `package.json` |
| Chrome-kapcsolók környezeti változóból (`CHROME_ARGS`), a Renderen `--no-sandbox --disable-dev-shm-usage` | Konténerben a Chrome sandboxa és a `/dev/shm` nem használható; helyben nem kell | `src/server/chrome.ts`, `.env.example` |
| A Renderen a start parancs a `PORT` változót használja (`npx next start -H 0.0.0.0 -p $PORT`), az `INTERNAL_BASE_URL` ugyanerre a portra mutat | A Render a saját portján várja az alkalmazást; a `npm run start` a fejlesztéshez rögzített 6438-at használja | `render.yaml` |
| A `SUPABASE_SECRET_KEY` nem kerül a Renderre | A futó alkalmazás nem használja, csak a szkriptek és a tesztek | `docs/TELEPITES_RENDER.md` |
| Legalább 1–2 GB memóriás csomag, Frankfurt régió | A PDF-hez headless Chrome indul; a Supabase-projekt `eu-central-1`-ben van | `render.yaml` |
