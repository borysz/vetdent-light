# Elfogadási feltételek: állapot (7. fázis zárása)

A `MASTER_PROMPT.md` 13. fejezetének tíz feltétele, a bizonyítékkal együtt. Az ellenőrzéseket az éles buildre (`npm run build && npm run start`) futtattuk; a parancsok a `README.md`-ben vannak.

| # | Feltétel | Állapot | Bizonyíték |
|---|---|---|---|
| 1 | Belépés nélkül semmi nem érhető el (oldal → `/login`, API → 401); a rendelőhöz nem tartozó felhasználó 403-at kap | **Teljesül** | `tests/api` (401, 403 minden végponton), `check:pdf` (401 és a nyomtatási oldal átirányítása), `check:flow` (belépés) |
| 2 | Kutyánál 42, macskánál 30 fog, helyes Triadan-számozással és oldalhelyességgel, a minta szerinti táblázatban | **Teljesül** | `src/domain/teeth/teeth.test.ts` (katalógus, sorrend, kvadránsok), `check:layout` (fogszám minden állapotban), `check:flow` (42 fog). A táblázat összevetve a `kutya.png` és `macska.png` képpel (lásd lent) |
| 3 | Új állat + kitöltött lap + Mentés → az adatbázisban van; újranyitva minden mező ugyanaz | **Teljesül** | `check:flow`: az állat az adatbázisban, a fogtábla, a gyógyszer és az idegblokk újratöltés után ugyanaz |
| 4 | Egy állatnak több lapja lehet, kezelési dátum szerint csökkenő sorrendben; új lapnál előtöltött adatok, a kor a becsült születési hónapból frissül | **Teljesül** (egység- és API-szinten) | `tests/api` (sorrend), `src/domain/age.test.ts`, `src/client/sheet-draft.test.ts` (előtöltés, kor). A kor „magától nő” viselkedését böngészőben nem külön próbáltuk ki |
| 5 | Több fog kijelölése után egy gombbal U+POL mindegyikre; a táblázat azonnal frissül; TR csak macskánál | **Teljesül** | `check:flow` (egy kattintás → 42 fog U+POL, kutyánál nincs TR), `teeth.test.ts` |
| 6 | A 4. fül előnézete és a letöltött PDF a minta szerinti A4-es dokumentum, helyes ékezetekkel; a nyomtatás is működik | **Teljesül** | `check:pdf` (az ő és ű a PDF-ből kiolvasva, A4, oldalszám, ismétlődő táblázatfejléc), `check:flow` (valódi letöltés, böngészős nyomtatás) |
| 7 | Minden oldal és felugró ablak a célméreteken: nincs vízszintes görgetés, a felugró ablakok nem görgethetők, a teljes fogtáblázat egyben látszik, minden gomb legalább 44 px | **Teljesül** (Chrome-ban, méretezve) | `check:layout`: 196 állapot 7 méreten (1280×580, 820×1100, 810×1000, 800×1150 és a másodlagosak). **Valódi tableten nem próbáltuk** |
| 8 | Minden adatművelet az `/api/v1` alatt, OpenAPI-leírással; a felületi kód nem importál szerveroldali kódot | **Teljesül** | `GET /api/v1/openapi.json`, ESLint-szabály (`eslint.config.mjs`) |
| 9 | Két böngészőben ugyanazt a lapot szerkesztve a második mentés ütközést jelez; csendben semmi nem íródik felül | **Teljesül** | `tests/api` (409), `check:flow` (ütközési ablak, „Az én változatom mentése”) |
| 10 | Titok nincs a Gitben; a `.env*` fájlok ki vannak zárva | **Teljesül** | A `.gitignore` kizárja őket; a titkos és a publikus kulcs, valamint a projekt címe 0 helyen szerepel a követett fájlokban és a Git teljes történetében (ellenőrizve, az értékek kiírása nélkül) |

## Összevetés a mintaképekkel

A saját képernyőképeket (`screenshots/`, a `check:layout` hozza létre, a Max és Mici demólapokról) egyenként összenéztük a mintaképekkel.

| Minta | Eredmény |
|---|---|
| `kutya.png` fogtábla | Egyezik: sorok, sorrend, felezővonal, jelölések (piros X az extrakció, szürke X a hiányzó fog, kék karika, narancs és lila kitöltés), kódcímkék és színezésük, jelmagyarázat |
| `macska.png` fogtábla | Egyezik: 30 fog a macska-sorrendben, TR-kódok, mobilitás, stomatitis mező |
| `3.png`, `4.png` (2. és 3. fül) | Egyezik: azonos szakaszok, mezők és értékek |
| `5.png`, `6.png` (zárójelentés) | Egyezik: azonos blokkok és sorrend; az A4-es lap középen, szürke háttéren |

**Szándékos eltérések** (a döntések a `docs/DONTESEK.md`-ben):
- Nincs fogszám a felületen (megrendelői kérés).
- A fejléc laptopon rövid fülneveket és ikonos gombokat használ (egy sorba kell férnie); a teljes nevek 2200 px-től látszanak.
- A páciens-kártya meglévő lapnál összecsukva nyílik, az összegző sorral; új lapnál kinyitva.
- A „Hazadobó” és a „Pulznyitott” elírások, valamint a 108-as fog „Jobb alsó” kvadránsa javítva.
- A címek mondatkezdő nagybetűsek („Lokális érzéstelenítés & idegblokkok”), nem minden szó nagybetűs, mint a mintán.
- A kutya és a macska színe kisebb kiemelés, nem tömör nagy gomb (megrendelői kérés).

## Ami nincs kipróbálva

- **Valódi tablet és ujjal használat**, a képernyő-billentyűzet hatása (a leírás szerint ezt kézzel kell nézni).
- **Valódi nyomtató**, és a PDF megnyitása különböző olvasókban (a szövegét kiolvastuk, a kinézetét a nyomtatási nézet képéből ítéltük meg).
- **Publikus elérés és HTTPS**: a publikus cím a fejlesztés alatt nem volt elérhető.
- **Az állatorvosi jóváhagyás** minden szakmai adatra és felületi szövegre (lásd `docs/SZAKMAI_ELLENORZES.md`).
