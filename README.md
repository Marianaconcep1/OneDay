# One Day — Mariana

Live app: https://marianaconcep1.github.io/OneDay/ (install from Safari: Share › Add to Home Screen)

The site is served from the repository root (GitHub Pages: `index.html`, `manifest.webmanifest`, `sw.js`, `mindset.json`, `icons/`). Source is in `src/`; run `python3 build.py` and copy `dist/*` to the root to publish changes. Tests: `node test/accept.js`.

A personal, local-first accountability app: one clear next action, quick logging, a two-minute evening check-in, and a short weekly review.

## First open

A first-time visitor chooses a language first (English, Español, Italiano or Français; nothing is preselected). The sealed envelope, Mariana's letter and every onboarding step then appear in that language, with a small language switch on each screen that keeps your answers. Next comes name (required, never prefilled) and timezone: a compact dropdown that shows only the chosen zone (Puerto Rico by default) and opens on tap to a search box over a short list of every IANA zone, by city, region or id, each with its current UTC offset. Picking a zone, tapping outside or pressing Escape closes it. Then the mandatory 6-digit PIN and its recovery code (see PIN lock below), then ten setup questions, one per screen ("Question X of 10", Back and Continue): why you're here, what gets in the way, what has helped, a main focus out of fourteen, a first result for that focus (or "Help me choose a starting action"), optional secondary focuses (up to two), total daily time, which days, a preferred time window and a check-in time with an optional reminder. Nothing is preselected and answers are saved as you go. The last screen is a suggested starting plan built from the answers: short actions with a finish line that fit your daily time, on your days and window. Secondary focuses only get small, optional weekly actions when there's room, movement days are spaced for recovery, and money results never invent amounts. You can edit any answer, remove, add back or replace actions, and nothing is scheduled until you tap "Start my first day". The reminder is off unless you tick it, and it shows only while the app is open; One Day never asks for notification permission. Language never changes timezone or currency (always USD). Progress survives a refresh, and returning users go straight to Today. The letter can be reread from Settings › About. The whole app follows the chosen language: every screen, question, message, notification and exported report, with dates and numbers formatted for that language. Anything you type stays as you wrote it, and outside resources in Mindset keep their original language with a label saying which one. City names in the timezone list and the typed DELETE/ERASE confirmations stay in English. The language preference is saved on this device. There is no online account.

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

## My Companion

The Companion tab (`#companion`) shows your bonsai, garden or farm at its current stage, the same daily quotation as Rest Mode (one per day in your saved timezone, the same in every language), “Meet your companion”, which explains how growth works, and “Change companion”. Switching between bonsai, garden and farm keeps every point, so the stage carries over and nothing is reset. Opening the tab, tapping, changing the scenery or reading the quote never adds growth.

Scenery is decoration only and doesn't follow the light or dark theme:

- **Time of day** follows the clock in your saved timezone, never the device's: dawn 5:00–7:59, daytime 8:00–16:59, sunset 17:00–19:59, night 20:00–4:59. It's on by default. Turn off “Match companion scene to my local time” to pick dawn, daytime, sunset or night yourself.
- **Seasons** are off (neutral scenery) until you choose. You can pick Automatic with a northern calendar (spring Mar–May, summer Jun–Aug, fall Sep–Nov, winter Dec–Feb) or a southern one (the reverse), or choose one season. These are calendar themes, not weather or astronomy. The month comes from the date in your saved timezone. Your location is never used, and the hemisphere is never guessed.
- **Tropical scenery** gives palms and hibiscus all year with each season's light, and never shows snow, frost or bare trees. Winter snow is a separate, optional setting.

The scene is recalculated every 30 seconds, when you come back to the app and when the timezone changes, and it cross-fades to the new look without reloading. With reduced motion on, the drawing is still and changes are immediate. Rest Mode uses the same companion and scenery, and its menu includes the info panel and the scenery settings. Preferences are saved on this device; they don't sync, because nothing does.

## Project dates and medals

Each project with a finish (a number or milestones) has a start date (today in your saved timezone by default, editable), a target completion date on or after it, and a sentence saying what finishing means. Ongoing goals have no target date, but you can add dated milestones inside them, such as "Complete my first four weeks of planned training". Changing a target date keeps all progress, and the original and revised dates stay in the project's date history.

A date never completes anything. Once a target date passes, the project and Today offer a neutral choice: review progress, adjust the date, or end the project. "Complete project" shows the completion criteria and what's recorded, then asks "Have you accomplished what you set out to do?" Your own answer is enough for goals that aren't measured in numbers. The actual completion date is stored separately from the target date.

Only a confirmed completion earns a medal: one per project and one per dated milestone in an ongoing goal. It's saved the moment you confirm. Repeated taps, reloads or completing the same project again never add a second one, and ending an unfinished project earns none. A gift box then waits, closed, until you tap it (or press Enter). Opening it lifts the lid and shows the medal with a short sparkle; with reduced motion on, the medal simply appears. There is no sound. "Open later" keeps the gift in My Companion › My milestones, where medals stay even if you change companions or archive or delete the project. Tapping a medal shows its details and the completion report. Nothing pops up during Rest Mode; gifts wait until you return.

## Animation

The envelope, letter and scenes use the browser's own animation tools (CSS and the Web Animations API), with no animation library and nothing downloaded. The garden, bonsai and farm are layered SVG drawings in `src/20-scene.js` (scenery settings and the Companion tab are in `src/21-companion.js`): leaves, stems, foliage and the caretaker's torso, arm and tool each move on their own, on calm loops (garden 10 s, bonsai 12 s, farm 9 s). With reduced motion on (device setting, or Personalize › Motion), or the companion's gentle movement off, every scene is a still drawing. Rive was considered; it would need a commissioned `.riv` file and a paid Rive plan to export it, so it isn't used.

## PIN lock

A 6-digit PIN is required. It's created right after name and timezone during setup (anyone who set up the app before this change is asked to create one the next time they open it), and there is no way to skip it or turn it off. Leading zeros work (`048213` is a valid PIN). The digits are masked, with a Show/Hide button.

One Day asks for the PIN every time it is opened, refreshed, or brought back from the background, and nothing personal is drawn before the PIN is accepted: not Today, Rest Mode, My Companion, reports, sheets, or a bookmarked page such as `#plan`. Moving between tabs during the same visit doesn't ask again, and unlocking returns to the page you were on. It can also lock after 1–30 minutes without activity (Settings › Profile and security). The lock screen follows your saved language.

Only a salted PBKDF2-SHA256 hash is stored, never the PIN, and it isn't in backups. After 5 wrong tries it waits 30 seconds, then twice as long after each further miss, up to 15 minutes, and the wait survives a reload. “Forgot your PIN?” takes the recovery code shown once at setup and lets you choose a new PIN without touching any records. Changing the PIN needs the current PIN (or the recovery code from the lock screen).

**What this is not.** The check runs in this browser, so it is a device lock that keeps the app private from casual viewing. It is not secure authentication: the records are not encrypted, and someone with full access to the phone's browser data could read them or clear the attempt counter. There is no account, no server-side PIN check and no verified recovery. Those need a backend: account sign-in (passkey or verified email), PIN verification and attempt limits on the server, verified account recovery, and encryption of the records on the device with a key the server only releases after a correct PIN.

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
