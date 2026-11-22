# Elfelejtett jelszó

A belépési oldalon az **Elfelejtette a jelszavát?** link a `/forgot-password` oldalra visz. Ott a felhasználó megadja az e-mail-címét, és a rendszer küld egy linket. A link a `/auth/confirm` címre mutat: ez belépteti a felhasználót, majd a `/reset-password` oldalra viszi, ahol kétszer beírja az új jelszót (legalább 12 karakter). Mentés után a kezdőlap nyílik meg.

- Az oldal nem árulja el, létezik-e fiók az adott címmel: mindig ugyanazt az üzenetet mutatja.
- A link egyszer használható és lejár (alapból 1 óra). Érvénytelen linknél az oldal új link kérését kínálja.
- API: `POST /api/v1/auth/password-reset` (levél kérése), `PUT /api/v1/auth/password` (új jelszó a bejelentkezett felhasználónak). Kód: `src/server/services/password.ts`, `src/app/auth/confirm/route.ts`.
- A levelet **ideiglenesen a Supabase küldi**, a saját alapsablonjával (angol szöveg). Saját levélküldő rendszer később kell (lásd `TODO.md`).

## Beállítás a Supabase-ben: `npm run supabase:auth-config`

A beállítást egy szkript végzi a Supabase Management API-n keresztül; a felületen nem kell kattintgatni. Csak az itt felsorolt mezőket módosítja, minden mást (például a kikapcsolt önregisztrációt és a levélsablonokat) békén hagy. Futtatás előtt kiírja a jelenlegi állapotot és a tervezett változásokat, és csak megerősítés után ment.

**Kell hozzá egy személyes hozzáférési token:** supabase.com → jobb felül a profil → **Access Tokens** → **Generate new token**. A szkript rejtve kéri be, nem menti el és nem írja ki. Használat után a tokent ugyanott törölheted.

A saját terminálodban, a projekt mappájában:

```powershell
npm.cmd run supabase:auth-config
```

Ez beállítja:
- **Site URL:** `https://vetdent.hu` (más címhez: `-- --site https://masik.hu`)
- **Redirect URLs:** hozzáadja a `https://vetdent.hu/**` és a `http://localhost:6438/**` címet; a már meglévőket megtartja.

Csak megnézni, mi változna: `npm.cmd run supabase:auth-config -- --dry-run`.

## Saját levelező (SMTP)

**A Supabase beépített levelezője csak a Supabase-szervezet tagjainak küld levelet.** Más címre a levél nem megy ki, és ezt hibaüzenet sem jelzi. Külső tesztelőket **ne** hívj meg a szervezetbe: a tagok hozzáférnek a projekthez és az adatbázishoz. Külső felhasználóknak tehát saját levelező kell. Ezen felül a beépített levelező óránként csak néhány levelet küld, és a levelek könnyen a levélszemétbe kerülnek.

Lépések:
1. Regisztráció egy levélküldő szolgáltatónál (például Resend, Brevo vagy Mailgun; kis forgalomra mindegyik ingyenes).
2. A `vetdent.hu` domain hitelesítése a szolgáltatónál: a szolgáltató megadja, milyen DNS-bejegyzéseket (SPF, DKIM) kell felvenni a domain DNS-beállításaiba.
3. Az SMTP-adatok beállítása a Supabase-ben, ugyanazzal a szkripttel:

```powershell
npm.cmd run supabase:auth-config -- --smtp
```

A szkript bekéri a szerver címét, a portot, a felhasználónevet, a jelszót (rejtve), a feladó címét (például `noreply@vetdent.hu`) és nevét.

## A levél sablonja (később)

Most a Supabase alapsablonja megy ki. Ennek linkje csak abban a böngészőben működik, amelyikben a linket kérték: ha valaki a tableten kéri, de a telefonján nyitja meg a levelet, a link „érvénytelen”. Ha ez zavaró lesz, a **Authentication → Emails → Templates → Reset Password** sablont erre lehet cserélni, és akkor bármelyik eszközön működik:

- **Subject:** `Jelszó visszaállítása – VetDent`
- **Body:**

```html
<h2>Jelszó visszaállítása</h2>
<p>Új jelszót kért a VetDent fiókjához. Az alábbi linkre kattintva állíthatja be:</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Új jelszó beállítása</a></p>
<p>A link egyszer használható, és hamarosan lejár. Ha nem Ön kérte, hagyja figyelmen kívül ezt a levelet.</p>
```

Az alkalmazás mindkét fajta linket elfogadja, így a sablon cseréje bármikor megtehető.

## Jelszócsere a parancssorból

Ha a levél nem érkezik meg, az új jelszót a fejlesztő a saját termináljában is beállíthatja: `npm run user:password -- --email <cím>`. A parancs kétszer kéri a jelszót.
