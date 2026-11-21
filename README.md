# VetDent Light

Állatorvosi fogászati kezelési lap (kutya, macska) webalkalmazás tabletre és laptopra.

## Indítás

```bash
npm install
cp .env.example .env.local   # majd töltsd ki a Supabase-adatokkal
npm run dev                  # http://localhost:6438
```

## Parancsok

| Parancs | Feladat |
|---|---|
| `npm run dev` / `npm run start` | Fejlesztői / éles szerver a 6438-as porton |
| `npm run build` | Éles build |
| `npm run check` | lint + típusellenőrzés + tesztek + i18n-ellenőrzés |
| `npm run user:create -- --email … --name … --title "Dr."` | Felhasználó és rendelőtagság létrehozása (jelszót rejtve kér be; a saját termináljában futtasd) |
| `npm run check:layout` / `npm run check:flow` | Böngészős ellenőrzés (valódi Chrome) a futó éles szerveren: méretek, ablakok, mentési folyamat |
| `npm run check:pdf` | A PDF-végpont ellenőrzése (ő és ű, oldalszám, fájlnév, jogosultság) a futó éles szerveren |
| `npm run seed:demo` | Demóadat (Max kutya, Mici macska) az első rendelőbe; `-- --reset` törli őket |
| `npm run i18n:sync` | Új vagy módosított szövegek felvétele az ellenőrzési jegyzékbe (`pending`) |

## Dokumentáció

`PRODUCT.md` (termékkontextus), `CLAUDE.md` (átadási jegyzet), `docs/` (felület, döntések, nyitott kérdések, szakmai ellenőrzés, i18n, ötletek).
