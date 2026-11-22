# Fejlesztés több eszközön

A projekt több gépen fejleszthető, de **nem egyszerre**. Minden, ami a folytatáshoz kell, a Git-tárolóban van: a kód, a szabályok (`CLAUDE.md`), a döntések, az eredeti igény és a mintaképek (`docs/requirements/`), és a munkanapló (`docs/MUNKANAPLO.md`), amely megmondja, hol tart a munka. A Git `main` ága az egyetlen igazság: ami ott van, azt látja a következő eszköz, és azt telepíti a Render is.

Két dolog **nincs** a Gitben, és nem is lesz: a titkos kulcsok (`.env.local`) és a gépenkénti bejelentkezések (GitHub, Supabase CLI). Ezeket eszközönként egyszer kell beállítani.

## Új eszköz, első alkalommal

**0. Programok:** Git, Node.js 24 (nodejs.org), Google Chrome; Claude Code-hoz vagy Claude Coworkhöz a Claude asztali alkalmazás. A tárolót mindig **klónozni** kell: a GitHubról letöltött ZIP-ben nincs Git, azzal nem lehet szinkronizálni.

### 1. lépés: az eszköz saját deploy kulcsa (mindig ez az első)

Minden eszköznek saját kulcsa van, amely csak ehhez a tárolóhoz ad hozzáférést. Így egy elveszett gép kulcsát egyenként lehet letiltani, és nem kell a GitHub-fiók jelszava.

**a) Kulcs készítése.** A jelszót kérdező két sorra csak Entert nyomj (a kulcs csak ezt az egy tárolót nyitja).

Windows (PowerShell):
```powershell
ssh-keygen -t ed25519 -C "vetdent-light deploy $env:COMPUTERNAME" -f "$HOME\.ssh\vetdent_light_deploy_ed25519"
Get-Content "$HOME\.ssh\vetdent_light_deploy_ed25519.pub"
```

macOS / Linux:
```bash
ssh-keygen -t ed25519 -C "vetdent-light deploy $(hostname)" -f ~/.ssh/vetdent_light_deploy_ed25519
cat ~/.ssh/vetdent_light_deploy_ed25519.pub
```

**b) Felvétel a GitHubon.** A második parancs kiírta a **nyilvános** kulcsot (`ssh-ed25519 …` kezdetű sor; ezt nyugodtan meg lehet mutatni, a titkos kulcs a gépen marad). Nyisd meg: https://github.com/borysz/vetdent-light/settings/keys/new
- Title: az eszköz neve (pl. „vetdent-light Macbook”)
- Key: a kiírt sor
- Pipáld be: **Allow write access**, majd **Add key**.

**c) Klónozás a kulccsal**, abba a mappába, ahol dolgozni fogsz (Coworkben ezt add meg munkamappának):
```
git clone -c core.sshCommand="ssh -i ~/.ssh/vetdent_light_deploy_ed25519 -o IdentitiesOnly=yes" git@github.com:borysz/vetdent-light.git
```
Az első kapcsolódáskor az SSH megkérdezi, megbízol-e a `github.com` gépben. A kiírt ujjlenyomatot vesd össze a GitHub hivatalos listájával (https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints), és ha egyezik, írd be: `yes`.

**d) Ellenőrzés:** a letöltött mappában
```
npm ci
npm run setup:deploy-key
```
Ez beállítja a tárolót a kulcs használatára, és kiírja: `OK read access` és `OK write access (push)`. Ha a kulcs nincs még a GitHubon, megmondja, mit kell tenni; ha a GitHub CLI be van jelentkezve (`gh auth login`), fel is veszi helyetted. Csak ellenőrzés, módosítás nélkül: `npm run setup:deploy-key -- --check`.

*Más út, ha a gépen a GitHub CLI már be van jelentkezve:* `gh repo clone borysz/vetdent-light`, majd a mappában `npm ci` és `npm run setup:deploy-key`: ez elkészíti és felveszi a kulcsot, és átállítja a tárolót SSH-ra.

**Gép elvesztése vagy lecserélése:** a https://github.com/borysz/vetdent-light/settings/keys oldalon töröld az eszköz kulcsát.

### 2. lépés: titkok és ellenőrzés

1. **Titkok:** másold át a `.env.local` fájlt a másik gépről (vagy a jelszókezelődből). Ha nincs meg: a `.env.example` alapján töltsd ki, az értékek a Supabase felületén vannak (**Project settings → API**). A fájlt soha ne tedd a Gitbe, ne küldd e-mailben.
2. **Ellenőrzés:** `npm run setup:check`. Minden sor `OK` legyen; ahol `MISSING` áll, ott a sor végén ott a teendő.
3. Csak ha adatbázist is módosítasz (migráció): `npx supabase login`, majd `npx supabase link --project-ref <azonosító>` (az azonosító a `SUPABASE_URL` elején áll).

## Minden munkamenet elején

1. A legfrissebb állapot letöltése: `git pull` (a `main` ágon).
2. Ha a `package-lock.json` változott: `npm ci`.
3. `npm run setup:check`.
4. Claude-nak elég ennyit mondani: „Olvasd el a CLAUDE.md-t és a munkanapló utolsó bejegyzését, és folytassuk.” Claude Code ezt magától is megteszi, mert a `CLAUDE.md`-t minden munkamenet elején beolvassa.

## Minden munkamenet végén

Ezt Claude csinálja (a `CLAUDE.md` előírja), de érdemes ellenőrizni:

1. Minden ellenőrzés zöld.
2. Új bejegyzés a `docs/MUNKANAPLO.md`-ben: mi készült el, mi maradt félbe, mi a következő lépés.
3. Commit, majd a változás a `main` ágra kerül, és **push** a GitHubra.

Ha a munkamenet környezete nem tud pusholni (például a Cowork homokozója nem látja a gép SSH-kulcsát), a push-t a saját terminálodban futtasd a projekt mappájában: `git push`. **Amíg nincs push, a másik eszköz nem látja a változást.**

## Ha mégis elfelejtődött a push

Ha a másik gépen már dolgoztál, és utólag kerül fel a régi változás, a `git pull` összefésüli őket. Ha ugyanazt a fájlrészt mindkét helyen módosítottad, a Git ütközést jelez: ilyenkor kérd meg Claude-ot, hogy oldja fel. `--force`-szal pusholni soha nem szabad, mert az felülírja a másik gép munkáját.

## Mi nem utazik a géppel

| Mi | Hol van | Mi a teendő |
|---|---|---|
| `.env.local` (titkok) | csak a gépen | eszközönként egyszer átmásolni |
| Claude helyi memóriája | csak a gépen | a tartós szabályok ezért a `CLAUDE.md`-be és a `docs/`-ba kerülnek, nem a memóriába |
| `screenshots/` (a `check:layout` és a `check:pdf` képei) | csak a gépen, generált | újra elkészülnek a parancsokkal |
| `.chrome/`, `node_modules/`, `.next/` | csak a gépen, generált | `npm run chrome:install`, `npm ci`, `npm run build` |
| Deploy kulcs (`~/.ssh/vetdent_light_deploy_ed25519`) | csak a gépen | eszközönként egyszer, lásd 1. lépés |
| Supabase CLI-bejelentkezés | csak a gépen | eszközönként egyszer, csak migrációhoz |
