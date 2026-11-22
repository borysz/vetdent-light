# Munkanapló

Minden munkamenet végén egy új bejegyzés kerül a lista **tetejére**: a dátum, az eszköz, mi készült el, mi maradt félbe és mi a következő lépés. A következő munkamenet (akár másik eszközön) innen tudja, hol tart a munka. A részletes döntések a `docs/DONTESEK.md`-ben, a nyitott teendők a `TODO.md`-ben vannak.

Minta:

```
## ÉÉÉÉ-HH-NN – <eszköz> – <rövid cím>
- Kész: …
- Félbemaradt: … (vagy: nincs)
- Következő lépés: …
```

## 2026-11-22 – Windows-laptop (Claude Code) – Profil: név és jelszó
- Kész: a felhasználói menüben **Profil** pont (a „Jelszó módosítása” helyett): a saját név és a jelszó módosítása egy ablakban. A titulus kivezetve, a név része (a meglévők beolvadtak); `PATCH /api/v1/auth/me`; a `user:create` már nem kér `--title`-t. Migráció feltöltve; tesztek, `check:flow` és `check:layout` lefedi.
- Félbemaradt: nincs.
- Következő lépés: a `clinic_members.title` oszlop törlése később (`TODO.md`).

## 2026-11-22 – Windows-laptop (Claude Code) – PDF a röntgenfelvételek között
- Kész: a röntgen szekcióba PDF is feltölthető (a rendelő röntgenszoftvere JPEG-et és PDF-et exportál). A PDF egy csempe, amely új lapon, a böngésző PDF-nézőjében nyílik meg; a képnézegető csak a képeken lép végig. A fájl végpontja `/api/v1/radiographs/{id}/file` lett. Migráció feltöltve; tesztek, `check:flow` és `check:layout` a PDF-et is lefedi.
- Félbemaradt: nincs.
- Következő lépés: ötletek a `docs/OTLETEK.md`-ben (képek a PDF-ben, felirat a képekhez).

## 2026-11-22 – Windows-laptop (Claude Code) – Röntgenképek csatolása
- Kész: a 2. fül „Digitális fogászati röntgen” szekciójában képek csatolhatók ráhúzással és fájlválasztással; bélyegképek, nagy nézet lapozással, törlés megerősítéssel. A kép az adatbázisban van (`sheet_radiographs.image`, megrendelői döntés; migrációk feltöltve, az első változat Storage-tárhelye törölve), API, tesztek (`tests/api/radiographs.test.ts`), a `check:flow` és a `check:layout` is lefedi.
- Félbemaradt: nincs.
- Következő lépés: ötletek: képek a PDF-ben, felirat a képekhez (`docs/OTLETEK.md`).

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
