# One Day — Mariana

Live app: https://marianaconcep1.github.io/OneDay/ (install from Safari: Share › Add to Home Screen)

The site is served from the repository root (GitHub Pages: `index.html`, `manifest.webmanifest`, `sw.js`, `mindset.json`, `icons/`). Source is in `src/`; run `python3 build.py` and copy `dist/*` to the root to publish changes. Tests: `node test/accept.js`.

A personal, local-first accountability app: one clear next action, quick logging, a two-minute evening check-in, and a short weekly review.

## First open

A first-time visitor chooses a language first (English, Español, Italiano or Français; nothing is preselected). The sealed envelope, Mariana's letter and every onboarding step then appear in that language, with a small language switch on each screen that keeps your answers. Next comes name (required, never prefilled) and timezone (Puerto Rico by default, any IANA zone searchable), then time available, check-in time, weekly focus and the five areas. Language never changes timezone or currency (always USD). Progress survives a refresh, and returning users go straight to Today. The letter can be reread from Settings › About. The whole app follows the chosen language: every screen, question, message, notification and exported report, with dates and numbers formatted for that language. Anything you type stays as you wrote it, and outside resources in Mindset keep their original language with a label saying which one. City names in the timezone list and the typed DELETE/ERASE confirmations stay in English. The language preference is saved on this device (there is no account step yet).

## Put it on your iPhone

The app is a set of static files (this folder). To install it as a real home-screen app it has to be served from an **https** address. The preview link is good for trying it, not for daily use.

1. Host this folder on any free static host. Two easy options:
   - **Netlify Drop**: sign in at app.netlify.com/drop and drag this whole folder onto the page. You get an https address.
   - **GitHub Pages**: put these files in a repository, then Settings › Pages › deploy from the main branch.
2. On your iPhone, open that address in **Safari**.
3. Tap **Share › Add to Home Screen › Add**.
4. Open **One Day** from the home screen from then on. It works offline after the first load.

Important: Safari and the home-screen app keep **separate** storage on iOS. Pick one (the home-screen app) and use it consistently. If you tried it in Safari first, make a backup there and restore it in the home-screen app.

## Where your data lives

- Everything is stored in this browser on this device (IndexedDB). There is no account, server, analytics, advertising tracker, or bank connection.
- It does not sync between devices.
- Clearing website data, deleting the home-screen app, or using private browsing can erase it.
- iOS can clear storage for websites you haven't opened in a while in Safari; home-screen apps are kept. Back up regularly either way.

## Back up and restore

- **Settings › Your data › Back up (JSON)** creates a complete backup of all records and settings, including goals, pauses, companion growth and Mindset saves. It does not include your PIN or your own background photo. On iPhone it saves to Files › Downloads; a copy box is also shown so you can paste it into Notes or iCloud Drive.
- **Settings › Restore from backup** checks the file first, shows what it contains, and asks before replacing anything. Restoring the same backup twice never creates duplicates.
- **Settings › Spreadsheet exports** gives CSV files for money entries, the task log, the training log, and check-ins.
- **Copy weekly report for ChatGPT** (Progress or Settings) produces plain text you can paste; money amounts are excluded unless you include them.

## Reminders

The check-in reminder appears inside the app while it's open, and never during a pause. The app cannot notify you while it's closed, so set a repeating iPhone alarm or Reminder for your check-in time. Email and text reminders are not built: they need a server and a sending service, which the app owner would pay for.

## Taking a break (Rest Mode)

Settings › Pause › Plan a pause › Everything. While a pause of everything is running, the app shows only Rest Mode: a daily quotation with its author and source, your bonsai, garden or farm with all its growth, and a small caretaker tending it (still when reduced motion is on). The regular views, reminders, reviews and progress stay hidden, and every address (`#today`, `#plan`, …) opens Rest Mode until you tap “I’m ready to return”. A small menu keeps language, accessibility and appearance, pause dates, privacy and backup, and the PIN lock within reach. Pausing selected areas never opens Rest Mode.

Paused days have nothing scheduled, build no backlog, aren’t counted in progress and don’t change your companion’s growth. Rest Mode stays on after the planned end until you choose to return; returning opens Today with “Welcome back. Let’s start with today.” and an optional “Adjust today’s plan”, with no review or catching up that day.

The return reminder is one note shown inside the app, once, the first time you open it on or after the planned end, and only if you ticked it. Returning earlier cancels it. Email, text and phone notifications would need a server and aren’t built.

### Rest Mode quotations (for the app owner)

The collection is `src/rest-quotes.json`, and only entries with `"status": "approved"` are built into the app. Each entry records the exact wording, author, original language, source with link, rights, translations (published edition, or `app` for One Day’s own translation, which the app labels “Translated from …” with the original wording available) and verification notes. The current 7 approved entries were each checked word for word against their linked source; 4 candidates were rejected (an unconfirmed Emerson line, an unchecked Lubbock passage, an Ovid line whose context is about love, and a Pascal line whose wording differs by edition). To add one, check it against the original source, add it with `"status": "approved"`, and rebuild with `python3 build.py`. One quotation shows per day in your timezone, cycling through the collection before any repeats.

## PIN lock

Settings › Profile and security › Set up a PIN. It's a 6-digit convenience lock for this device. Only a salted PBKDF2 hash is stored, never the PIN. After 5 wrong tries it waits 30 seconds, then longer. It auto-locks after inactivity (1–30 minutes) and when you leave the app. A recovery code, shown once, resets a forgotten PIN.

The PIN does **not** encrypt your records, and it is not an online account. Real accounts (passkey or verified email sign-in), sync between devices and multi-user admin roles all need a backend.

## Mindset editions (for the app owner)

The creator roster is fixed in the app code (`src/16-mindset.js`, `MINDSET_ROSTER`). Each weekly edition is the file `mindset.json`, published next to `index.html`. Only someone who can change the hosted files can change the roster or the edition, so that's where the owner-only permission lives. There is no in-app admin.

To publish a new edition:

1. Edit `mindset.json`. Give it a new `id` and `weekOf`, and set `updatedAt` to the time you finish checking.
2. For each item, give the creator (from the roster), type, title, original `published` date, direct https `url`, `access` (`free`, or `free-signup` with a `signup` note), a factual `summary`, `topics`, and any `claims`. Label each claim as `opinion`, `promotional`, `uncertain` or `research`; a `research` claim needs a `source` link.
3. Re-upload the folder. In the app, Mindset › Check for a new edition loads it.

The app rejects files with off-roster creators, paid access, missing dates or non-https links, and keeps the previous edition when a check fails. Refreshing is manual: automatic weekly updates would need a scheduled server job.

## Files

- `index.html`: the whole app (HTML, CSS, JavaScript)
- `manifest.webmanifest`, `icons/`: home-screen install
- `sw.js`: offline support; it caches the app itself, never your data
- `mindset.json`: the current Mindset edition
