# Döntések

Minden döntés: mit, miért, hol kell módosítani, ha más a válasz.

## 1. fázis

| Döntés | Indok | Módosítás helye |
|---|---|---|
| A fejlesztői és az éles szerver portja **6438** (`npm run dev`, `npm run start`) | A megrendelő kérése | `package.json`, `.claude/launch.json` |
| `cacheComponents` kikapcsolva (a `create-next-app` alapból bekapcsolta, a `partialPrefetching`-gel együtt, ezeket töröltük) | Minden bejelentkezett oldal dinamikus; a vetdent projektben a kérésidejű adat csak `<Suspense>` mögött volt olvasható | `next.config.ts` |
| A nyelv a **cookie-ból** jön (`locale`), az URL-ben nincs nyelvi előtag; alapnyelv `hu` | A felület útvonalai magyarok (`/belepes`, `/lapok/…`), nyelvi előtag felesleges; új nyelv = új katalógus | `src/i18n/config.ts`, `src/i18n/request.ts` |
| Az i18n teljes, nem csak magyar: `messages/<nyelv>.json` + ellenőrzési jegyzék `messages/review/<nyelv>.json` | Lásd `docs/I18N.md`; ez felülírja a `MASTER_PROMPT.md` egynyelvűségi sorát | `docs/I18N.md`, `scripts/i18n.ts` |
| Az ellenőrzési jegyzékben a szöveg `textHash`-e rögzíti, melyik szöveget nézte át az állatorvos; módosított szöveg automatikusan `pending` lesz (`npm run i18n:sync`) | A jóváhagyás ne vonatkozhasson csendben megváltozott szövegre | `scripts/i18n.ts` |
| `@types/node` 24-es | A Vitest 5 a 20-as típusokkal nem telepíthető; a gép Node 24-et használ | `package.json` |
| Betűk: Inter (sans) és JetBrains Mono (kódok, dátumok, számok), `latin-ext`-tel | Az ő és ű miatt; a képek is sans + monospace párost mutatnak | `src/app/layout.tsx` |
| Színtokenek a mintaképekből mérve (pixelolvasás) | A megrendelő kérése; a színek a Tailwind palettáját követik | `src/app/globals.css`, `docs/FELULET.md` |
| Rétegszabály az ESLintben: `src/app/(app)`, `src/components`, `src/client` nem importálhat `@/server`-t és `@supabase/*`-t | API-first architektúra | `eslint.config.mjs` |
| A mintaképek ismert hibái javítva: „Hazadobó Lap” → „Hazaadó lap & Gyógyszerek” (`messages/hu.json`); a többi (108-as fog kvadránsa, „Pulznyitott”, tizedesjel) a megfelelő fázisban | A képek hibáit nem vesszük át | `messages/hu.json` |

## Későbbi fázisokra előre rögzítve

- A gazdi e-mail-címe nem kötelező (csak formátumellenőrzés), amíg nincs e-mail-küldés.
- Külön gazdi-nyilvántartás nincs: a gazdi adatai az állatnál vannak; később bővíthető.
- A kezelési lap egy dokumentumként (`content jsonb`) mentődik; ha később elemzés kell, a fogadatok normalizálhatók.
