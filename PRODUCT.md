# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Fixed by the owner's brief (`template pics/MASTER_PROMPT.md`, local file, not in git): Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4, Radix UI primitives (own components in `src/components/ui/`), lucide-react, TanStack Query, zod, next-intl (Hungarian for now, i18n-ready, see `docs/I18N.md`), Supabase (Postgres + Auth), server-side PDF (headless Chrome via puppeteer-core) from the same React component as the preview. API-first: all data goes through a versioned REST API under `/api/v1`.

## Users

Veterinarians and their assistants in a small-animal clinic (the owner is not a developer). Primary situation, confirmed: filling in the sheet **during the treatment, on a tablet** (portrait iPad or Android tablet), with a laptop as secondary device for follow-up and the final report. Hands are busy and attention is on the animal, so input must be fast and touch-first.

## Product Purpose

VetDent Light is a veterinary dental treatment sheet for dogs and cats. After login the user picks a species, enters the animal and owner details, and fills in four tabs: anamnesis with an interactive dental chart (modified Triadan numbering), anesthesia and surgery, home-care sheet and medications, and an A4 final report. Sheets are saved per animal and can be reviewed in descending order of treatment date; the final report can be printed or downloaded as PDF.

Success: a sheet is completed quickly and correctly at the table, and the printed or PDF report is clean enough to hand to the owner.

## Positioning

Confirmed primary value: a fast, precise interactive dental chart (42 teeth for dogs, 30 for cats) that replaces paper charting. The chart is the centre of the product; the rest of the sheet and the report support it.

## Operating Context

- Target devices: laptop (1920x1080 at 150% zoom, about 1280x580 usable), iPad portrait (820x1100, 810x1000), Android tablet portrait (800x1150). Secondary: 768x1024, landscape tablet 1180x820, wide desktop.
- The full dental chart must always be visible at once, without horizontal scroll or shrinking. Pop-ups must never scroll.
- Touch targets at least 44x44 px, inputs at 16 px, no hover-only functions.
- Interface language: Hungarian for now, formal address, but the app is i18n-ready: no user-visible string in code, every locale is a message catalogue (`messages/<locale>.json`, next-intl, typed keys), `hu` is the default locale and further languages are added by adding a catalogue, not by touching components. Locale-dependent formats (dates, numbers, decimal comma) come from the locale, never hard-coded. Code, identifiers, comments, scripts, tests, commit messages and all URIs (pages and API) are always English (e.g. `/login`, `/sheets/[id]`); Hungarian lives only in `messages/`, `docs/` and the root documents.
- Time zone Europe/Budapest, hu-HU number formats (decimal comma), dates as YYYY-MM-DD on the sheet.
- Login by e-mail and password; no self-registration. All members of a clinic see and edit all of its animals and sheets.

## Capabilities and Constraints

- Four tabs: 1. Odontogram and examination, 2. Anesthesia and surgery, 3. Home-care sheet and medications, 4. Final report preview (A4).
- Tooth editor and quick-entry toolbar open as pop-ups so the user never navigates away from the sheet.
- Explicit Save button with always-visible save status, unsaved-change warning, local draft recovery, and a clear conflict dialog on version mismatch (409).
- Deferred on purpose: voice dictation (disabled "Hangjegyzet rögzítése" button), e-mail to owner (disabled, "Hamarosan"), admin UI, registration, password reset, roles, subscription, offline/PWA, photo or X-ray upload, deployment.
- The app records and displays; it does not calculate doses, diagnose, or suggest treatment.
- All clinical content (codes, option lists, medication templates, root counts, marking rules) needs veterinary approval; track it in `docs/SZAKMAI_ELLENORZES.md`. No invented codes.
- **Terminology review of all UI text:** every string shown in the web app must be checked that it is genuine veterinary (dental) terminology or correct plain-language wording, per locale. Each message key carries a review status (`pending` / `approved`, with reviewer and date) in a review manifest next to the catalogue (`messages/review/<locale>.json`). New or changed text starts as `pending`; a `check:i18n` script fails on keys missing from the manifest or catalogues and reports every `pending` key, so unreviewed text is visible and cannot ship unnoticed. Only a veterinarian approves; the agent never marks its own wording `approved`. Details: `docs/I18N.md`.
- Dog and cat sheets differ (tooth set; TR codes and the feline stomatitis/resorptive field are cat-only).

## Brand Commitments

Product name in the interface: "VetDent Pro" with the label "FOGÁSZATI LAP". Species colours are binding: dog orange, cat purple. The owner supplied sample screenshots (`docs/requirements/samples/`: 1, 3, 4, 5, 6, kutya, macska) as the source of look and behaviour; the dental chart must match `kutya.png` and `macska.png` exactly. Colours are to be measured from those images. Names, e-mails and clinics in the samples are examples only.

## Evidence on Hand

- Seven sample screenshots in `docs/requirements/samples/` and the original brief `docs/requirements/MASTER_PROMPT.md`.
- Supabase project credentials in `.env.supabase` (local, git-ignored; never read or print values).
- Absent: real clinic data, real owner or patient data, logo, approved clinical option lists. Do not fabricate them; demo data uses neutral names and `example.com` / `.test` addresses.
- The `referencia/*.jpg` images of the older vetdent project are copyrighted and must not be copied or redrawn.

## Product Principles

1. The dental chart comes first: it is always whole, legible and fast to operate by touch.
2. Nothing is silently lost: explicit save, visible status, drafts, conflict dialogs.
3. Record, never decide: no clinical calculation or advice; clinical content only with veterinary sign-off.
4. One component, two outputs: the on-screen report and the PDF come from the same source.
5. Build only what was asked; useful extras go to the ideas list.

## Accessibility & Inclusion

Large touch targets (44 px minimum), 16 px base text, table labels no smaller than 11 px, no hover dependence, correct Hungarian characters (ő, ű) in the UI and in the PDF.
