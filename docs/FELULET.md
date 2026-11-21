# Felület leírása (a mintaképekből)

A mintaképek (`template pics/`, helyi, Gitben nincs) a kinézet és a működés forrásai. Ez a leírás rögzíti őket szövegben, hogy a tudás a repóban is meglegyen. A képeken szereplő nevek, e-mail-címek és rendelő csak példák.

## Színek (pixelolvasással mérve, tokenek: `src/app/globals.css`)

| Token | Érték | Hol |
|---|---|---|
| `--dog` | `#FE9A00` | „Kutya (42 fog)” gomb |
| `--dog-soft` / `--dog-ink` | `#FFFBEB` / `#973C00` | „Kutya” címke |
| `--cat` | `#9810FA` | „Macska (30 fog)” gomb |
| `--cat-soft` / `--cat-ink` | `#F3E8FF` / `#6E11C2` | „Macska” címke |
| `--primary` | `#009689` | E-mail gomb, kijelölt címke szövege |
| `--primary-strong` | `#00786F` | Kijelölt ASA-gomb, aktív fog jelvénye |
| `--primary-soft` / `-strong` | `#F0FDFA` / `#CBFBF1` | Kijelölt címke háttere, aktív fog sáv, menta jelvények |
| `--dark` / `--foreground` | `#0F172B` | „PDF Mentés” gomb, szöveg |
| `--background` | `#F5F7FA` | Oldalháttér |
| `--surface-preview` | `#EAEEF4` | Az A4-lap körüli szürke terület |
| `--mark-extraction` | `#E11D48` | Piros X (extrakció) |
| `--mark-missing` | `#8290A4` | Szürke X (hiányzó) |
| `--midline` | `#50A2FF` | Szaggatott kék felezővonal |
| `--cell-pathology-bg` | `#FFE2E2` | Lelet (FX-C, PE) cella |
| `--cell-missing-bg` | `#F3E8FF` | Hiányzó (M) cella |

## Fejléc

Logó (teal négyzet, sztetoszkóp), „VetDent Pro”, „FOGÁSZATI LAP” címke, négy fül (aktív: fehér), jobbra: „Minta Kutya”, „Minta Macska” (nálunk „+ Új lap”), ↺, „Kezelési lapok”, „Mentés”, „PDF Mentés” (sötét), „E-mail a Gazdinak” (teal; nálunk letiltva, „Hamarosan”).

Fülek: 1. Odontogram & Fogvizsgálat · 2. Anesztézia & Műtét · 3. Hazaadó lap & Gyógyszerek (a képen „Hazadobó”, javítva) · 4. Zárójelentés előnézet.

## Páciens-kártya (minden fülön)

Összecsukva: név, faj címke, Fajta, Kor, Nem, Súly, Gazdi, ASA, Dátum. Kinyitva: Páciens neve*, Faj (Odontogram típusa)* (Kutya 42 fog / Macska 30 fog), Fajta, Kor (év / hó), Súly (kg); Gazdi neve*, Gazdi e-mail címe, Gazdi telefonszáma, Állat neme (Hím, Nőstény, Ivartalanított hím, Ivartalanított nőstény); ASA-státusz I–V, Utolsó etetés ideje (Koplalás), Preoperatív vérvizsgálat, Kezelőorvos & Asszisztens; Fő panaszok és indikációk (címkék: Bűzös lehelet (halitosis), Fogkő, Fájdalom jelzése rágáskor, Fokozott nyálzás, Táplálási nehézség / féloldalas rágás, Letört fog, Ínyvérzés, Pofa dörzsölése); Egyéb anamnézis / Panasz leírás, Otthoni szájhigiénia, Etetés / Táp típusa. Tizedesjel: vessző (32,5).

## 1. fül – Fogászati Kezelési Táblázat

Cím: „Fogászati Kezelési Táblázat – Módosított Triadan Rendszer (Kutya · 42 fog)”. Kijelölés: Összes, Felső ív (Maxilla), Alsó ív (Mandibula), Patológiás fogak. Fejléc: PÁCIENS JOBB OLDALA (RHS) · KUTYA · 42 MARADANDÓ FOG (kék) · PÁCIENS BAL OLDALA (LHS).

Felső blokk: Calculus Index (0-3), Gingivitis Index (0-3), Mobilitás (0-3), Egyéb, FOG, MAXILLA (fograjzok). Alsó blokk: MANDIBULA, FOG, Calculus, Gingivitis, Mobilitás, Egyéb. Középen szaggatott kék felezővonal.

Sorrend: kutya felső 110→101 | 201→210, alsó 411→401 | 301→311; macska felső 109 108 107 106 104 103 102 101 | 201 202 203 204 206 207 208 209, alsó 409 408 407 404 403 402 401 | 301 302 303 304 307 308 309.

Az „Egyéb” cella a lelet- és kezeléskódokat mutatja egymás alatt (pl. FX-C, PE, PD2, RX, X-S; U, POL, CURE; M). Jelölések: piros X extrakció, szürke X hiányzó, kék karika röntgen, narancs kitöltés fogkő/íny, lila törés/TR. Kijelölt fog: sötét teal jelvény, szaggatott keret. Alatta: jelmagyarázat, aktív fog sáv, Periodontális stádium (Normál, 1.–4.), Fogkő index, Ínygyulladás index, Okklúzió, macskánál Stomatitis / Feline resorptív státusz, „Gyakori rövidítések a táblázatban”.

Fogszerkesztő (nálunk felugró ablak): Tasakmélység (M, B, D, L/P), Fog állapota / Kóros elváltozások (0, T1–T3, G1–G3, PD1–PD4, Mob1–Mob3, Fur1–Fur3, FX-C, FX-CR, PE, UCF, TR1–TR5, M, U), Kezelés (U, POL, CURE, EXT-S, EXT-SURG, RX, ENDO, FLAP, BIO), Egyedi megjegyzés. Gyorsbevitel: diagnosztikai és terápiás gyorsgombok, tasakmélység 1, 2, 3, 4, 5, 6, 8 mm, „Visszaállítás ép állapotra (0)”.

## 2. fül – Anesztézia & Műtét

Lokális érzéstelenítés & idegblokkok (Ideg, Oldal, Helyi érzéstelenítő, Mennyiség ml, törlés; „+ Idegblokk hozzáadása”), Varratok & Sebészi részletek (varróanyag, öltéstípus, részletes leírás), Digitális fogászati röntgen (felvételek száma, lelet, műtét alatti észrevételek / szövődmények).

## 3. fül – Hazaadó lap & Gyógyszerek

Otthoni gyógyszeres kezelési terv (gyors sablonok: Fájdalomcsillapító, Antibiotikum, Szájápoló gél; „+ Új gyógyszer”; soronként Készítmény neve & hatáserősség, Egyszeri adag, Gyakoriság, Időtartam (nap), Útmutató), Műtét utáni ápolás & gazdi tanácsok (Táplálási javaslat*, Rágási korlátozások*, Otthoni szájhigiénia, záró megjegyzés), Kontroll időpont & varratszedés.

## 4. fül – Zárójelentés előnézet (A4)

Felső sáv gombjai: Közvetlen Nyomtatás, PDF Letöltése, E-mail Küldése a Gazdinak (letiltva). Az A4-lap: rendelői fejléc, „ÁLLATORVOSI FOGÁSZATI LAP”, páciens- és gazdiblokk, Előzmények & fő panaszok, a fogtáblázat, periodontális összesítő, Érintett & kezelt fogak részletezése (Fog #, Megnevezés, Patológia / Állapot, Tasak (mm), Beavatkozás, Megjegyzés), Műtéti & érzéstelenítési napló, Otthoni utókezelési terv & gazdi tájékoztató, lábléc (Kelt, kezelőorvos, aláírás és bélyegző, „VetDent Pro digitális orvosi rendszerből generálva”).
