# AGENTS.md

## Cursor Cloud specific instructions

This repository contains **two independent npm projects** (no monorepo tooling; each has its own `package-lock.json`):

- **Root (`/workspace`)** — `ct-heishikan`, a **Next.js 14 (App Router)** marketing site + BJJ training toolkit (round timer, CBJJ scoreboard/placar, PWA hub). Package manager: **npm**.
- **`bjj-tv-app/`** — `Heishikan Arena`, an **Expo (React Native)** app that mirrors the timer/placar logic on-device. Package manager: **npm**.

Node `v22` and npm are available on the VM. Dependencies for both projects are refreshed by the startup update script (`npm install` in the root and in `bjj-tv-app/`), so you normally don't need to install anything manually.

### Running the services

Standard scripts (already defined in each `package.json`); run each in its own long-lived terminal:

- Next.js website (dev): `npm run dev` from the repo root → serves on **http://localhost:3000**.
- Expo app (web preview): `npm run web` from `bjj-tv-app/` → serves on **http://localhost:8081** (Metro bundler). `npm run android` / `npm run ios` require an emulator/simulator and are not usable headless in the cloud VM; use the web preview for verification.

The two services are fully independent — the Expo app does **not** talk to the Next.js server.

### Non-obvious notes

- **No lint or test tooling is configured** in either project (no ESLint/Jest/etc., no `lint`/`test` scripts). Don't expect `npm test` to work; verify changes by running the dev servers and exercising the UI.
- **Timer persistence**: the web timer API (`/api/timer-data`) writes to `data/timer-db.json` in local dev (Upstash Redis is only used in production when `KV_REST_API_URL`/`KV_REST_API_TOKEN` are set). `data/timer-db.json` **is tracked by git** — if you exercise the API, `git checkout data/timer-db.json` afterward so you don't commit test writes.
- **QR phone remote (web)**: `/timer` and `/placar` remote control uses PeerJS/WebRTC and is documented as **not working on `localhost`** (needs a public HTTPS URL). Timer/placar UIs still work standalone for local verification.
- `/placar/display` is a **TV full-screen layout** — large unstyled-looking number blocks are intentional (designed for a big screen), not a rendering bug.
- The repo-root `index.html` is a legacy static export of the landing page and is **not** part of the Next.js dev server.
