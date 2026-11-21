# VetDent Light

Állatorvosi fogászati kezelési lap kutyák és macskák számára, tabletre és laptopra. Az állatorvos (vagy asszisztens) kitölti az anamnézist, az interaktív fogtáblát (Triadan-számozás), az érzéstelenítést és műtétet, a hazaadó lapot és a gyógyszereket; a lapból A4-es zárójelentés készül, amely kinyomtatható és PDF-ben letölthető. A lapok az állat alatt, kezelési dátum szerint visszanézhetők.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth) · next-intl (jelenleg magyar felület) · Vitest.

## Indulás

Szükséges: Node.js 24, Git, Google Chrome (a PDF-hez és az ellenőrzésekhez), egy Supabase-projekt.

```bash
npm install
copy .env.example .env.local   # Windows; máshol: cp .env.example .env.local
```

Töltsd ki a `.env.local`-t a Supabase-adatokkal és a `CHROME_PATH`-szal (a változók a `.env.example`-ben). Az adatbázis-migrációk feltöltése (egyszer):

```bash
npx supabase login
npx supabase link --project-ref <a projekt azonosítója>
npx supabase db push --remote
```

Felhasználó létrehozása (a jelszót rejtve kéri be; regisztrációs felület nincs), majd az alkalmazás:

```bash
npm run user:create -- --email te@pelda.hu --name "Neved" --title "Dr."
npm run seed:demo      # opcionális: Max kutya és Mici macska demóadatként
npm run dev            # http://localhost:6438
```

## Parancsok

| Parancs | Feladat |
|---|---|
| `npm run dev` / `npm run start` | Fejlesztői / éles szerver a 6438-as porton (`npm run build` után) |
| `npm run check` | lint + típusellenőrzés + tesztek + i18n-ellenőrzés (a tesztek a valódi Supabase-projekten futnak, saját, utána törölt adattal) |
| `npm run check:layout` | Valódi Chrome, 7 méret: túlcsordulás, görgethető ablakok, 44 px-es célok, a teljes fogtábla; képernyőképek a `template pics/screenshots/` mappába |
| `npm run check:flow` | Böngészős folyamat: mentés, piszkozat, ütközés, fogtábla, fülek, PDF-letöltés, nyomtatás |
| `npm run check:pdf` | PDF-végpont: ő és ű a PDF-ből kiolvasva, A4, oldalszám, jogosultság |
| `npm run user:create -- --email … --name … --title "Dr."` | Felhasználó és rendelőtagság létrehozása |
| `npm run seed:demo` | Demóadat az első rendelőbe; `-- --reset` törli |
| `npm run i18n:sync` | Új vagy módosított szövegek felvétele az ellenőrzési jegyzékbe (`pending`) |

A három böngészős ellenőrzés a futó **éles** szervert használja: `npm run build && npm run start`.

## Dokumentáció

| Dokumentum | Tartalom |
|---|---|
| `PRODUCT.md` | Kinek készül, mire való, milyen korlátok és elvek érvényesek |
| `CLAUDE.md` | Átadási jegyzék a fejlesztőnek (és a következő munkamenetnek): szabályok, parancsok, gépfüggő tudnivalók |
| `docs/ARCHITEKTURA.md` | Felépítés, rétegek, adatfolyam, bővítés lépései |
| `docs/DONTESEK.md` | Minden döntés indoklással és a módosítás helyével |
| `docs/ELFOGADAS.md` | Az elfogadási feltételek állapota, összevetés a mintaképekkel, mi nincs kipróbálva |
| `docs/SZAKMAI_ELLENORZES.md` | Állatorvosnak jóváhagyandó szakmai adatok és kérdések |
| `docs/I18N.md` | Nyelvesítés és a felületi szövegek szakmai ellenőrzése |
| `docs/FELULET.md` | A mintaképek szöveges leírása és színei |
| `docs/NYITOTT_KERDESEK.md`, `docs/OTLETEK.md`, `TODO.md` | Nyitott kérdések, ötletek, teendők |

## Szabályok röviden

Az URI-k és a teljes forráskód angol, a felület magyar és i18n-képes. A felület csak az API-n át ér el adatot. Szakmai adatot nem találunk ki, az alkalmazás rögzít, nem dönt. A titkok (`.env*`) nincsenek a Gitben.
