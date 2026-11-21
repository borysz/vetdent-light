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
