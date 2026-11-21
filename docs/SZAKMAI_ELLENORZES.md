# Szakmai ellenőrzés (állatorvosnak)

Minden itt szereplő adatot állatorvosnak kell jóváhagynia. A felületi szövegek ellenőrzési állapota nyelvenként a `messages/review/<nyelv>.json` jegyzékben van (`npm run check:i18n` listázza a `pending` szövegeket); a szabályok a `docs/I18N.md`-ben.

## Ismert bizonytalan pontok (a mintaképek alapján)

| Téma | Forrás | Bizonytalanság |
|---|---|---|
| „Pulznyitott” felirat | `kutya.png` (PE kód, gyorsgomb) | Valószínűleg „pulpanyitott” |
| „U” az állapotkódok között | `kutya.png` (fogszerkesztő) | Az „U” kezeléskódként ultrahangos depurálás; állapotkódként mit jelent? |
| A Calculus/Gingivitis/Mobilitás sor és a T/G/Mob kódok megfeleltetése | `kutya.png` | A sor a fog T1–T3, G1–G3, Mob1–Mob3 kódjának fokát mutatja: jóváhagyandó |
| Gyökérszámok a fogkatalógusban (Fur csak többgyökerű fogon) | vetdent `catalog.ts` | Állatorvosi jóváhagyásra vár |
| TR-kód csak macskánál; hiányzó (M) fogra nem vehető fel új lelet; „0: Ép” kizárja a kóros kódokat | `kutya.png`, `macska.png` | Jelölési szabályok jóváhagyandók |
| Idegblokk-, érzéstelenítő- és varróanyag-listák, gyógyszersablonok | `3.png`, `4.png` | Csak a képeken láthatók indulnak, minden további elem jóváhagyással kerülhet be |
| A 108-as fog kvadránsa a képen „Jobb alsó” | `kutya.png` | Helyesen jobb felső (100 jobb felső, 200 bal felső, 300 bal alsó, 400 jobb alsó) |

## 4. fázis: a fogtábla szakmai adatai (mind jóváhagyandó)

Forrás: `src/domain/teeth/` (katalógus, kódok, szabályok, jelölések levezetése) és a `messages/hu.json` `codes.*`, `treatments.*`, `teeth.*`, `quick.*`, `perio.*`, `complaints.*` szövegei.

| Téma | Jelenlegi megvalósítás | Kérdés az állatorvosnak |
|---|---|---|
| Gyökérszámok (a furkáció csak többgyökerű fogon választható) | Kutya felső: I1–3 és C 1, PM1 1, PM2–3 2, PM4 3, M1–2 3; alsó: I, C, PM1 1, PM2–4 2, M1–2 2, M3 1. Macska felső: PM2 1, PM3 2, PM4 3, M1 2; alsó: PM3–4 2, M1 2 | Helyesek-e? (A macska felső M1 gyökérszáma különösen bizonytalan.) |
| A Calculus / Gingivitis / Mobilitás sor | A fog T1–T3, G1–G3, Mob1–Mob3 kódjának fokát mutatja | Így helyes-e? |
| Az „Egyéb” cella | A többi leletkód, majd a kezelések; extrakció: X (egyszerű) és X-S (sebészi) | Így helyes-e? |
| Kék karika (röntgen vagy speciális kezelés) | RX, CURE, ENDO, FLAP, BIO kezelésnél jelenik meg (a mintán a 409-es fogon CURE mellett is van) | Mely kezelések számítanak „speciálisnak”? |
| Narancs kitöltés | T vagy G kód esetén | – |
| Lila kitöltés (törés / TR) | FX-C, FX-CR, PE, UCF és TR1–TR5 esetén | A PE és az UCF ide tartozik-e? |
| Hiányzó fog (M) | Más lelet nem vehető fel; kezelésként csak RX; a tömeges U+POL kihagyja (a mintán a 308-ason sincs) | Így helyes-e? |
| „0: Ép / Egészséges” | Kizárja a kóros kódokat, és fordítva | – |
| Egy csoporton belül egy fokozat | T, G, PD, Mob, Fur, TR: egyszerre egy fokozat | – |
| TR csak macskánál | Kutyánál nem választható (az API is elutasítja) | – |
| Kódok megnevezése | FX-CR „Korona-gyökér törés”, UCF „Szövődménymentes koronatörés” (AVDC-rövidítések alapján), TR „Resorptív lézió 1–5”, Mob „Mobilitás 1–3”, Fur „Furkáció I.–III.”, T „Fogkő I.–III.”, G „Ínygyulladás I.–III.”, PD „Periodontitis 1–4” | Helyesek-e a megnevezések és a fokozatjelölések? |
| „U” az állapotkódok között | „U (jelentése tisztázandó)” felirattal szerepel | Mit jelent? (Kezelésként az U az ultrahangos depurálás.) |
| Kódmagyarázatok | Csak a mintán láthatók: FX-C, PE, PD2 | A többi kódhoz kell-e magyarázat? |
| „FLAP: Ínylebeny” | A mintán elírás látszott; „Ínylebeny”-re javítva | Helyes-e a kifejezés? |
| „PE: Pulpanyitott törés” | A mintán „Pulznyitott” | Helyes-e? |
| Tasakmélység-riasztás | ≥ 4 mm pirossal kiemelve | – |
| Gyorsbevitel feliratai | T1 (Enyhe), T2 (Közepes), T3 (Súlyos), G2 (Vérzés), G3 (Spontán), „Egyszerű húzás”, „Sebészi húzás”, „Kürettálás” a minta szerint | – |
| Fő panaszok listája | A mintán látható nyolc elem | Kell-e további elem? |
| Preoperatív vérvizsgálat | Szabad szöveg, egy javaslattal | Kell-e választéklista, és milyen elemekkel? |

## 5. fázis: anesztézia, műtét, hazaadó lap (mind jóváhagyandó)

Forrás: `src/domain/anesthesia.ts`, `src/domain/medications.ts` és a `messages/hu.json` `anesthesia.*`, `nerves.*`, `sides.*`, `anesthetics.*`, `homecare.*`, `medicationTemplates.*` szövegei.

| Téma | Jelenlegi megvalósítás | Kérdés az állatorvosnak |
|---|---|---|
| Idegblokk: ideg | Csak a mintán látható kettő: N. infraorbitalis (felső elülső), N. mentalis (alsó elülső) | Mely további idegek kellenek (pl. a hátsó blokkokhoz)? |
| Idegblokk: oldal | Jobb, Bal (a minta csak a „Jobb”-ot mutatta) | Kell-e „Mindkét oldal”? |
| Helyi érzéstelenítő | Bupivacain + Lidocain (1:1), Lidocain 2% | Mely további készítmények és hígítások kellenek? |
| Mennyiség (ml) | Szabad szám, legfeljebb 50 ml | Van-e ésszerű felső korlát (pl. testtömegtől függően)? Az alkalmazás nem számol adagot. |
| Varróanyag-javaslat | „Gyakori: Monocryl 4-0 / 5-0 (gyorsan felszívódó), Vicryl 4-0” a minta szerint | – |
| Dentális RTG szövegei | „periapikális lízis, rezorpció és gyökérstátusz” a minta szerint | – |
| Fájdalomcsillapító sablon | Meloxidyl 1,5 mg/ml orális szuszpenzió; naponta 1x délelőtt eleséggel; 5 nap; „Gyulladáscsökkentő és fájdalomcsillapító. Mindig teli gyomorra adandó!” | A készítmény, a gyakoriság és az időtartam helyes-e? Macskánál is használható-e így? (A mintán „kutyáknak” szerepelt; ezt kivettük.) |
| Antibiotikum sablon | Kesium 500 mg tabletta (Amoxicillin/Klavulánsav); naponta 2x (12 óránként); 7 nap; „Széles spektrumú antibiotikum a szájüregi sebfertőzés megelőzésére.” | Ugyanezek a kérdések; a 500 mg-os tabletta kis testtömegnél is alkalmas-e? |
| Szájápoló gél sablon | Stomodine szájápoló gél; naponta 2x este; 10 nap; „Kívülről a pofa felől óvatosan az ínyre juttatni a seb közvetlen piszkálása nélkül.” | Ugyanezek a kérdések |
| Az adag | Egyik sablon sem tölti ki; a minta példái (pl. „32 kg-os jelzésig szívva fecskendővel”) egy konkrét állatra szóltak | – |
| Hazaadó lap felirata | „Hazaadó lap & Gyógyszerek” (a mintán elírt „Hazadobó”) | Helyes-e? |

## 6. fázis: zárójelentés

Forrás: `messages/hu.json` `report.*`, `reportTab.*`; elrendezés: `src/components/report/`.

| Téma | Jelenlegi megvalósítás | Kérdés az állatorvosnak |
|---|---|---|
| Felirat: „ÁLLATORVOSI FOGÁSZATI LAP” | A minta szerint | – |
| A páciens- és gazdiblokk feliratai | Páciens neve, Faj / Fajta, Kor / Súly, Állat neme; Gazdi neve, E-mail, Kezelőorvos, ASA altatási státusz | Helyesek-e? |
| „Érintett & kezelt fogak részletezése”: állapotoszlop | Az állapotkódok „KÓD: megnevezés” alakban; ha nincs állapotkód, „–” | Kell-e, hogy a csak kezelt, állapot nélküli fogakon „Egészséges” álljon? (Most nem írjuk oda, mert nem rögzítettük.) |
| Tasak (mm) oszlop | „M:2 B:4 D:2 L:2” (mesialis, buccalis, distalis, linguális/palatinális) | Jó-e a rövidítés? |
| „Műtéti & érzéstelenítési napló” | Idegblokkok „(Jobb oldal, érzéstelenítő, mennyiség ml)” alakban, varratok, röntgen | – |
| „Otthoni utókezelési terv & gazdi tájékoztató” | Gyógyszertábla, táplálási javaslat, rágási és fizikai kímélet, szájhigiénia, záró megjegyzés, kontroll | Megfelel-e a gazdi tájékoztatónak? |
| „Kelt:” sor | A kezelés dátuma és a rendelő irányítószáma, települése | Kell-e külön „kelt” dátum a kezelés dátuma mellett? |
| Lábléc | „VetDent Pro digitális orvosi rendszerből generálva”; a kezelőorvos neve és „Kezelőorvos aláírása és bélyegzője” | – |
