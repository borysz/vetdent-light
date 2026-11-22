# Munkanapló

Minden munkamenet végén egy új bejegyzés kerül a lista **tetejére**: a dátum, az eszköz, mi készült el, mi maradt félbe és mi a következő lépés. A következő munkamenet (akár másik eszközön) innen tudja, hol tart a munka. A részletes döntések a `docs/DONTESEK.md`-ben, a nyitott teendők a `TODO.md`-ben vannak.

Minta:

```
## ÉÉÉÉ-HH-NN – <eszköz> – <rövid cím>
- Kész: …
- Félbemaradt: … (vagy: nincs)
- Következő lépés: …
```

## 2026-11-22 – Windows-laptop (Claude Code) – Töltésjelző a PDF-gombokon
- Kész: amíg a PDF készül, a fejléc PDF-gombján és a 4. fül „PDF letöltése” gombján forgó jelző látszik az ikon helyén, a felirat „PDF készül…”. A `check:flow` ellenőrzi, hogy a jelző megjelenik, majd a letöltés után eltűnik.
- Félbemaradt: nincs.
- Következő lépés: lásd a `TODO.md`-t.

## 2026-11-22 – Windows-laptop (Claude Code) – Jelszó módosítása a menüből
- Kész: a felhasználói menüben (jobb felül) új pont: **Jelszó módosítása**. Ez az új jelszó oldalra visz (ugyanaz, ahová a visszaállító levél linkje), ahol egy „Mégse, vissza a kezdőlapra” link is van. A `check:flow` mindkettőt kipróbálja.
- Félbemaradt: nincs.
- Következő lépés: lásd az alábbi bejegyzést és a `TODO.md`-t.

## 2026-11-22 – Windows-laptop (Claude Code) – Felkészülés a több eszközös fejlesztésre
- Kész: a projekt bármelyik gépen folytatható. Új eszközön az első lépés az eszköz saját deploy kulcsa (`npm run setup:deploy-key`: létrehozza, felveteti a GitHubon, és ellenőrzi az olvasást és az írást); a `setup:check` is ellenőrzi a push-jogot. Az eredeti igény és a mintaképek a `docs/requirements/` mappában vannak; a Chrome-ot a szkriptek minden rendszeren maguk keresik meg; új parancs a gép ellenőrzésére (`npm run setup:check`); a lépések a `docs/TOBB_ESZKOZ.md`-ben; a munkamenetek eleje és vége a `CLAUDE.md`-ben.
- Előtte ugyanezen a napon: elfelejtett jelszó (levélküldés ideiglenesen a Supabase-zel), terhelési ellenőrzés (`npm run check:volume`), ékezetfüggetlen kereső és telefonszám-keresés, első/utolsó oldal a lapozón, a Supabase Auth beállító szkriptje (`npm run supabase:auth-config`), telefonos nézet javítása.
- Félbemaradt: nincs.
- Következő lépés (a megrendelőnél): a Supabase Auth beállítása a szkripttel; saját levelező (SMTP) a külső tesztelők előtt; állatorvosi jóváhagyás; kipróbálás valódi tableten. Lásd `TODO.md`.
