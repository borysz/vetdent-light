# Nyitott kérdések

| # | Kérdés | Jelenlegi alapértelmezés | Kinek |
|---|---|---|---|
| 1 | **Állatorvosi jóváhagyás**: a felületi szövegek (`npm run check:i18n` listázza) és a szakmai adatok (`docs/SZAKMAI_ELLENORZES.md`) | Minden szöveg `pending`, a szakmai adatok a minták alapján, jóváhagyás nélkül | Állatorvos |
| 2 | A rendelő pontos neve és címe | A demóadat semleges (a rendelő nevét a „Rendelő adatai” ablakban lehet megadni) | Megrendelő |
| 3 | **Éles elérés**: HTTPS és tartós tárhely; a belépési süti `Secure` jelzője csak HTTPS-en kapcsol be | Fejlesztéshez HTTP is működik; a publikus cím a fejlesztés alatt nem volt elérhető | Megrendelő |
| 4 | Kipróbálás valódi tableten (iPad, Android), ujjal, a képernyő-billentyűzettel; valódi nyomtatás | Csak Chrome-ban, méretezve ellenőriztük | Megrendelő |
| 5 | Impeccable telepítés és hook bekötése | A hook a munkamenetben működött; a bejelentkezéses telepítés elhalasztva, lásd `TODO.md` | Megrendelő |
| 6 | További rendelői felhasználók felvétele | `npm run user:create` (a saját termináljában) | Megrendelő |

## Megoldva

- Supabase CLI összekötve a `vetdent-light` projekttel; a migrációk `npx supabase db push --remote` paranccsal mennek, adatbázisjelszó nem kellett.
- Supabase Auth önregisztráció kikapcsolva (megrendelő, 2026-11-21).
- Az első felhasználó létrejött (`npm run user:create`).
- Demóadat betöltve (`npm run seed:demo`); a fogszám elhagyása a felületről eldöntve.
