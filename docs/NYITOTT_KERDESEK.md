# Nyitott kérdések

| # | Kérdés | Jelenlegi alapértelmezés | Kinek |
|---|---|---|---|
| 1 | Impeccable telepítés és hook bekötése | A hook működik a munkafában; a bejelentkezéses telepítés elhalasztva, lásd `TODO.md` | Megrendelő |
| 2 | A rendelő pontos neve, címe a demóhoz | Semleges demóadat | Megrendelő |
| 3 | Éles (HTTPS) elérés: a publikus cím most HTTP-n megy, a belépési süti `Secure` jelzője csak HTTPS-en kapcsol be | Fejlesztéshez HTTP is működik | Megrendelő |
| 4 | Felhasználók létrehozása: az első rendelői felhasználót a megrendelő hozza létre a saját termináljában (`npm run user:create -- --email … --name … --title "Dr."`) | A szkript kész, felhasználó még nincs | Megrendelő |

## Megoldva

- Supabase CLI összekötve a `vetdent-light` projekttel (ref `xysdcrrwljyukxwbnswc`); a migrációk `npx supabase db push --remote` paranccsal mennek, adatbázisjelszó nem kellett.
- Supabase Auth önregisztráció kikapcsolva (megrendelő, 2026-11-21).
