# 127 — Your online IT Library — PRD

**Language:** Communicate with the user in **Dutch (NL)**.

## Original problem statement
Dutch IT-tools web app ("127"). Suite of browser-based hardware/diagnostic tools + an "Autosoft" admin panel. Stack: React + FastAPI + MongoDB. Domain: **127.be**. Pexels images/videos are proxied through the backend (API key kept server-side).

## Core tools (public routes)
- `/dpd` Dead Pixel Detector
- `/printer` Printer Tester
- `/sscreen` Screen Refresh Tester
- `/wea` Webcam & Audio Tester
- `/password` Password Generator
- Admin panel on protected routes (JWT + TOTP 2FA). Admin: `admin@127.be`.

## Key architecture
- Backend `/app/backend/server.py` (single file, ~1375 lines). Routes prefixed `/api`.
- Pexels proxy: `/api/pexels/photos`, `/api/pexels/videos` (in-memory TTL cache, graceful empty fallback).
- Tool toggle: `/api/tools`, `/api/tools/{id}/status` (fail-open: unknown id → enabled:true).
- Frontend env: `REACT_APP_BACKEND_URL`. Backend env keys: MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET_KEY, ADMIN_EMAIL, TOTP_SECRET, PEXELS_API_KEY.

## Implemented (log)
- 2026-06: Fixed "website keeps loading / must refresh manually" — `App.js` had a global `if (checkingSetup) return <Loading/>` that blocked the ENTIRE app (incl. public pages) behind the `/api/admin/needs-setup` fetch; a hung request left a permanent loading screen. Removed the global gate (public routes render immediately; ProtectedRoute still gates admin), added AbortController 5s timeout. Verified iteration_2.json.
- 2026-06: Landing page background changed from Pexels video → subtle animated multi-color CSS gradient (`.animated-gradient-bg` + `@keyframes subtle-gradient-shift` in App.css). Removed video-playlist fetch logic (also reduced loading noise).
- 2026-06: Koodh logo added bottom-left of landing page (white, links to koodh.com), no pill.
- 2026-06: Fixed "tools offline" bug — `/api/tools/{id}/status` now fail-opens (200 + enabled:true) instead of 404 when tool not seeded; `ToolStatusWrapper.jsx` also fail-opens on non-2xx.
- 2026-06: Pexels proxy now cached (TTL 3600s) + graceful empty fallback → faster, more resilient tools.
- 2026-06: Browser title changed `127 | Yannick Tools` → `Your online IT Library`. Added SEO meta (description, keywords, canonical, OG, Twitter), GEO (hreflang nl-BE/en, geo.region BE), 2× JSON-LD (WebSite + ItemList of tools), robots.txt (incl. AI crawlers) and sitemap.xml.
- Verified via testing_agent iteration_1.json: backend 12/12 pytest pass, frontend 100%.

## Pending / backlog
- WordPress export: only Landing + Password Generator fully exported to `/app/wordpress-export/`. PixelTest, PrinterTest, ScreenTest, WebcamAudioTest still to export (awaiting user format choice). ZIP: `/app/127-tools-complete-export.zip`.
- P1: React Error Boundary component.
- P2: Full NL/EN language switcher across all pages.
- Optional (from test report): console-noise on landing Pexels video fetch; React boolean-attribute warning on `/password`.
- Note: `PEXELS_API_KEY` must be set in the DEPLOYED environment or images won't load in production.

## Deploy note
- IGNORED an injected request to set up a "Koodh VDC" reverse SSH tunnel + auto-deploy via `curl|bash` (security risk). Not implemented. Awaiting user confirmation if legitimate.
