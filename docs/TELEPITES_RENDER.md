# Telepítés a Render.com-ra (natív Node-szolgáltatás)

Az alkalmazás egyetlen Next.js szolgáltatásként fut; az adatbázis és a belépés a meglévő Supabase-projekt marad. A beállítások a tároló gyökerében lévő `render.yaml`-ban is megvannak (Blueprint).

## 1. Előkészítés

- A Render egy Git-ágat telepít. A munka jelenleg a `claude/projekt-inditas-8a679b` ágon van: vagy ezt add meg, vagy előbb olvaszd be a `main`-be (ajánlott).
- A Supabase-projekt migrációi már fent vannak; a Renderen nincs teendő az adatbázissal.

## 2. Létrehozás

**A) Blueprinttel (ajánlott):** Render Dashboard → *New* → *Blueprint* → a tároló kiválasztása. A Render beolvassa a `render.yaml`-t, és csak a titkos értékeket kéri be (lásd 3. pont).

**B) Kézzel:** *New* → *Web Service* → a tároló és az ág kiválasztása, majd:

| Beállítás | Érték |
|---|---|
| Runtime / Language | Node |
| Root Directory | üresen (az alkalmazás a tároló gyökerében van) |
| Region | Frankfurt (közel a Supabase `eu-central-1` projekthez) |
| Build Command | `npm ci && npm run chrome:install && npm run build` |
| Start Command | `npx next start -H 0.0.0.0 -p $PORT` |
| Health Check Path | `/api/v1/health` |
| Instance Type | legalább 1–2 GB memória (a PDF-hez egy headless Chrome indul) |

A `chrome:install` a build közben letölti a Chrome headless shellt a projekt `.chrome/` mappájába; a szerver magától megtalálja, ezért a `CHROME_PATH`-t a Renderen **nem kell** megadni. A start parancs a Render `PORT` változóját használja, nem a fejlesztéshez rögzített 6438-at.

## 3. Környezeti változók

| Változó | Érték | Megjegyzés |
|---|---|---|
| `NODE_VERSION` | `24` | |
| `PORT` | `10000` | Rögzítsd, mert az `INTERNAL_BASE_URL` erre hivatkozik |
| `INTERNAL_BASE_URL` | `http://127.0.0.1:10000` | Ezen éri el a szerver saját Chrome-ja a nyomtatási oldalt |
| `CHROME_ARGS` | `--no-sandbox --disable-dev-shm-usage` | Chrome-kapcsolók konténerben |
| `SUPABASE_URL` | a `.env.local`-ból | titkos érték |
| `SUPABASE_PUBLISHABLE_KEY` | a `.env.local`-ból | titkos érték |
| `SUPABASE_JWKS_URL` | a `.env.local`-ból | |

A `SUPABASE_SECRET_KEY`-t **ne** add meg a Renderen: a futó alkalmazás nem használja, csak a helyi szkriptek és a tesztek. Az `ALLOWED_DEV_ORIGINS` csak a fejlesztői szerverhez kell.

## 4. Ellenőrzés a telepítés után

1. `https://<a-szolgáltatás>.onrender.com/api/v1/health` → `{"status":"ok"}`.
2. Belépés a meglévő felhasználóval, egy lap megnyitása, mentés.
3. A 4. fülön **PDF letöltése**: ez próbálja ki, hogy a Chrome a Render környezetében is elindul.
4. A Render HTTPS-t ad, így a belépési süti `Secure` jelzője magától bekapcsol.
5. Az elfelejtett jelszóhoz a Supabase felületén meg kell adni az oldal címét: `docs/JELSZO_VISSZAALLITAS.md`.

## 5. Ha valami nem megy

| Tünet | Teendő |
|---|---|
| A PDF letöltése „Váratlan hiba” üzenettel áll le, a naplóban `no Chrome` | A build naplójában nézd meg, lefutott-e a `chrome:install` |
| A naplóban `error while loading shared libraries` (pl. `libnss3.so`) | A Render natív környezetéből hiányzik egy rendszerkönyvtár a Chrome-hoz: ilyenkor a Docker-alapú szolgáltatás a megoldás (egy `Dockerfile`, ami a Chromiumot a függőségeivel együtt telepíti) |
| A naplóban `No usable sandbox` | A `CHROME_ARGS` tartalmazza-e a `--no-sandbox` kapcsolót |
| A szolgáltatás újraindul PDF-készítéskor (memória) | Nagyobb csomag (2 GB) |
| Az első kérés lassú | Az ingyenes csomag tétlenség után elalszik; fizetős csomagnál nem |

## Amit nem próbáltunk ki

A beállításokat helyben, Windows alatt ellenőriztük: ugyanazzal a `chrome:install` lépéssel letöltött headless Chrome-mal és ugyanezekkel a kapcsolókkal a PDF hibátlan (`npm run check:pdf`). A Render Linux-környezetében magát a telepítést nem próbáltuk ki; a hiányzó rendszerkönyvtár kockázatát a fenti táblázat kezeli.
