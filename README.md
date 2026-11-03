# Inkwell Notes

A handwriting note-taking app for iPad and Apple Pencil, in the spirit of GoodNotes and Notability.
Single-file web app (`www/index.html`), no build step, no dependencies. Original code under the MIT license.

## Features
Pressure-sensitive pen, highlighter, stroke eraser, lasso (move/resize/duplicate/delete/recolor), shapes,
hold-to-straighten, text, images, emoji stickers, undo/redo, zoom, multi-page notebooks, paper templates,
page colors, notebook library with folders and search, Pencil-only palm rejection, autosave, share page as PNG.

## Ship it for $0
**1. Web app / PWA (no Apple account, no Mac).**
Repo Settings → Pages → Source: *GitHub Actions*. Push to `main`; `pages.yml` publishes `www/`.
On the iPad: Safari → Share → *Add to Home Screen*. It runs full-screen and works offline.

**2. Check the native build (free for public repos).**
`ios-build.yml` wraps the app with Capacitor and builds it on a GitHub macOS runner. No signing, no Mac needed.

**3. Real iOS app (needs an Apple Developer account, owned by the developer).**
```
npm install
npx cap add ios
npx cap sync ios
npx cap open ios     # on a Mac: set Team + bundle ID, then Run or Archive
```
Change `appId` in `capacitor.config.json` first. App Store publishing needs the developer's Apple Developer Program membership;
free Apple IDs can only sideload to your own device (expires every 7 days).

## Roadmap (native features a web app can't do)
- [ ] Replace canvas with PencilKit (SwiftUI) for lowest latency and Pencil double-tap
- [ ] PDF import/annotation (PDFKit)
- [ ] Handwriting search and conversion (Vision / Scribble)
- [ ] Audio recording synced to strokes (AVFoundation)
- [ ] iCloud sync (SwiftData + CloudKit)
- [ ] Export to PDF

## Notes
Do not use GoodNotes or Notability names, icons or artwork. Notes are stored in the browser's localStorage on the device.

## v2: PDF, cloud, storage
- **Import PDF to annotate:** *File → Import PDF*. Each PDF page becomes a notebook page; pen, highlighter, lasso, text etc. all work on top.
- **Export PDF for assignments:** *File → Export PDF* (download) or *Share PDF…* (Files, Mail, OneDrive/Drive apps). Handwriting is flattened onto the pages.
- **Storage:** notebooks and PDF pages live in IndexedDB (hundreds of MB), not the 5 MB localStorage. Use *Backup notebook* as a safety copy (PDF backgrounds are not included in the JSON).
- **Open the app at** `https://<user>.github.io/<repo>/www/` (the repo root redirects there). Pages source can be *Deploy from branch* or *GitHub Actions*.

### Cloud setup (optional, free)
Without this, *Share PDF…* still saves to iCloud/Files/OneDrive/Drive through the iPad share sheet, and *Import PDF* can pick files from the Files app (including Drive/OneDrive).
Direct upload needs your own app IDs, put in `www/config.js`:
1. **Google Drive:** console.cloud.google.com → new project → enable *Google Drive API* → OAuth consent screen (External, *Testing*, add your Google account as test user) → Credentials → *OAuth client ID* → Web application → Authorized JavaScript origin `https://<user>.github.io`. Copy the client ID to `googleClientId`. Scope used: `drive.file` (only files the app creates).
2. **OneDrive / Microsoft 365:** entra.microsoft.com → App registrations → New → *Accounts in any organizational directory and personal Microsoft accounts* → Redirect URI, platform **Single-page application**: `https://<user>.github.io/<repo>/www/` → copy *Application (client) ID* to `msClientId`. API permission: Microsoft Graph delegated `Files.ReadWrite`. A university/work tenant may require admin consent; if blocked, use *Share PDF…* instead.
PDFs are uploaded to Drive (root) and to `OneDrive/InkNotes/`. Sign-in popups work best in a normal Safari tab, not in the Home Screen app.
