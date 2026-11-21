# Elfelejtett jelszó

A belépési oldalon az **Elfelejtette a jelszavát?** link a `/forgot-password` oldalra visz. Ott a felhasználó megadja az e-mail-címét, és a rendszer küld egy linket. A link a `/auth/confirm` címre mutat: ez belépteti a felhasználót, majd a `/reset-password` oldalra viszi, ahol kétszer beírja az új jelszót (legalább 12 karakter). Mentés után a kezdőlap nyílik meg.

- Az oldal nem árulja el, létezik-e fiók az adott címmel: mindig ugyanazt az üzenetet mutatja.
- A link egyszer használható és lejár (alapból 1 óra). Érvénytelen linknél az oldal új link kérését kínálja.
- API: `POST /api/v1/auth/password-reset` (levél kérése), `PUT /api/v1/auth/password` (új jelszó a bejelentkezett felhasználónak). Kód: `src/server/services/password.ts`, `src/app/auth/confirm/route.ts`.
- A levelet **ideiglenesen a Supabase küldi** a saját levelezőjével. Saját levélküldő rendszer később kell (lásd `TODO.md`).

## Beállítás a Supabase felületén (egyszer kell)

### 1. Engedélyezett címek
**Authentication → URL Configuration**
- **Site URL:** `https://vetdent.hu`
- **Redirect URLs:** vedd fel ezeket:
  - `https://vetdent.hu/**`
  - `http://localhost:6438/**`

E nélkül a levélben lévő link nem a mi oldalunkra visz vissza.

### 2. A levél sablonja (ajánlott)
**Authentication → Emails → Templates → Reset Password**

Az alapsablon linkje csak abban a böngészőben működik, amelyikben a linket kérték. Ha a felhasználó a tableten kéri, de a telefonján nyitja meg a levelet, a link „érvénytelen”. Ez a sablon bármelyik eszközön működik:

- **Subject:** `Jelszó visszaállítása – VetDent`
- **Body:**

```html
<h2>Jelszó visszaállítása</h2>
<p>Új jelszót kért a VetDent fiókjához. Az alábbi linkre kattintva állíthatja be:</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Új jelszó beállítása</a></p>
<p>A link egyszer használható, és hamarosan lejár. Ha nem Ön kérte, hagyja figyelmen kívül ezt a levelet.</p>
```

Az alkalmazás mindkét fajta linket elfogadja, így a sablon cseréje bármikor megtehető.

## A Supabase beépített levelezőjének korlátai

- **Csak a Supabase-szervezet tagjainak küld levelet.** Más címre a levél nem megy ki, és ezt hibaüzenet sem jelzi. Ideiglenes megoldás: a felhasználót meg kell hívni a Supabase-szervezetbe (**Organization → Team**). Végleges megoldás: saját levelező (SMTP), lásd `TODO.md`.
- **Óránként csak néhány levelet küld** (a pontos szám a **Authentication → Rate Limits** oldalon látszik). Ha túllépi, a felület ezt írja: „Túl sok kérés érkezett…”.
- A levél a Supabase feladójától érkezik, és könnyen a levélszemétbe kerül.

## Jelszócsere a parancssorból

Ha a levél nem érkezik meg, az új jelszót a fejlesztő a saját termináljában is beállíthatja: `npm run user:password -- --email <cím>`. A parancs kétszer kéri a jelszót.
