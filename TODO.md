# Teendők

## Megrendelőnek (nem fejlesztői)
- [ ] **Állatorvosi jóváhagyás.** Az összes felületi szöveg (`messages/review/hu.json`, `npm run check:i18n` listázza) és a szakmai adatok (`docs/SZAKMAI_ELLENORZES.md`: gyökérszámok, kódok megnevezése, szabályok, gyógyszersablonok, a jelentés feliratai) jóváhagyásra várnak. Csak állatorvos állíthat `approved`-ra.
- [ ] **Kipróbálás valódi eszközön:** iPad és Android tablet álló helyzetben, ujjal, a képernyő-billentyűzettel; valódi nyomtatás és a PDF megnyitása.
- [ ] **Éles elérés:** HTTPS és tartós tárhely (telepítés előtt egyeztetni). A publikus cím (`borysz.tplinkdns.com:6438`) a fejlesztés alatt nem volt elérhető: TP-Link port-átirányítás és Windows tűzfalszabály ellenőrzése.
- [ ] További felhasználók felvétele: `npm run user:create -- --email … --name … --title "Dr."`.
- [ ] A demóállatok törlése, ha már nem kellenek: `npm run seed:demo -- --reset`.

## Eszközök
- [ ] **Impeccable telepítés újrapróbálása**, ha a bejelentkezésük újra működik: `npx impeccable install`, majd `/impeccable hooks on`. (A tervezői hook a munkamenetben így is futott.)

## Későbbre hagyva (a leírás szerint most nem kell)
Diktálás (a `LongText` komponensbe kerülne), e-mail a gazdinak, adminisztrációs felület, regisztráció és jelszó-visszaállítás, szerepkörök, előfizetés, offline működés, gazdiportál, fotó- és röntgenfeltöltés.
