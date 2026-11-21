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
