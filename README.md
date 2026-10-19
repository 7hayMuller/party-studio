# ✦ Party Studio

Create AI-powered digital party invitations, share them with a link and track RSVPs in real time.

The app runs on **iOS, Android and Web** (Expo / React Native). A Node.js backend generates the invitation theme with Claude, stores events in Supabase and emails the host.

---

## Features

### For the host

**Account and login**
- Sign in with Google (OAuth) or email and password, via Supabase Auth.
- Session persisted with `expo-secure-store` on mobile.

**3-step invitation builder**
1. **Type and style:** party type (Birthday, Wedding, Halloween, Festa Junina, Tropical, Carnival, Graduation, Corporate, Other), one or more "vibes" (Elegant, Lively, Dark, Colorful, Minimalist, Glam, Futuristic, Retro), title and description. If the title and description are left blank, the AI writes them.
2. **Palette and media**
   - Primary, secondary and background colors, chosen with a color picker or left to the AI (✦ AI picks!).
   - Cover image: upload from the gallery, describe it in text or let the AI generate it.
   - Background music: audio file or YouTube link (the video ID is detected automatically).
   - Optional video for the confirmation screen background.
3. **Event details:** name, date, time, location, email to receive RSVPs, dress code and a reference image for the outfit.

**AI generation**
- The backend sends the inputs to Claude, which returns style tokens and copy: colors, emoji, title, headlines, button text and confirmation messages in the party's tone.
- The cover image is generated with Pollinations (Flux model) from an AI-written prompt, at the device's screen resolution.
- **Offline fallback:** if the backend fails, the app applies a local preset by party type (Festa Junina, Wedding, Halloween, Tropical, Carnival or default). The screen shows whether the theme came from the AI or the preset.

**Preview, simulation and regeneration**
- Preview the invitation before publishing.
- **Simulate** mode to go through the full guest flow (intro → form → confirmation).
- **Regenerate** the theme, with 2 free regenerations per invitation. After that, a credits paywall appears (coming soon).

**Publishing and sharing**
- On publish, media files are uploaded to Supabase Storage and the event gets a short code (e.g. `A1B2C3`).
- Shareable link `https://party-studio.vercel.app/guest?id=CODE` via native share, the Web Share API or copy to clipboard.

**My invitations**
- List of the host's invitations.
- Guest list with name, plus-ones, message and total headcount.
- Edit or delete invitations.

**Email notification**
- For every new RSVP, the host receives an email (Resend) with the guest's name, plus-ones, message and the total confirmed so far.

### For guests

- Open the invitation from the link, no login needed (with deep linking into the app on Android and iOS).
- **Intro** with the generated theme, cover image and soundtrack. Guests are asked before the music starts, because of browser autoplay restrictions.
- **RSVP form:** name, number of plus-ones (0–20) and an optional message.
- **Confirmation** with an optional background video, a starburst animation and a **digital ticket** showing date, time, location, dress code and a barcode generated from the guest's name.
- The RSVP is saved on the device: reopening the link takes the guest straight to the ticket.

### General

- **Internationalization:** Portuguese, English and Spanish, detected from the device language (default: Portuguese).
- **Web:** phone-frame layout (390×844) in the browser.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| App | Expo 54, React Native 0.81, React 19, TypeScript, Expo Router, Reanimated, i18next |
| Media | expo-audio, expo-video, expo-image-picker, expo-document-picker, react-native-webview (YouTube) |
| Backend | Node.js, Express, Zod, express-rate-limit |
| AI | Anthropic Claude (theme and copy), Pollinations (image) |
| Data and auth | Supabase (Postgres, Auth, Storage) |
| Email | Resend |
| Deploy | Vercel (web), Railway (backend), EAS (mobile builds) |

---

## Project structure

```
app/                  Routes (Expo Router)
  index.tsx           Redirects to /host
  host.tsx            Host flow
  guest.tsx           Guest flow (?id=CODE)
src/
  screens/            HostPanel, HostMenu, LoginScreen, IntroScreen, FormScreen, ConfirmScreen
  components/         PartyTicketAi, ColorPicker, StarBurst, YouTubePlayer, FooterBrand
  services/           ai.ts (API), auth.ts (Supabase Auth), storage.ts (media upload)
  hooks/              useTheme, useBackgroundAudio (web/native)
  context/            AuthContext
  i18n/               pt, en, es
  config/theme.ts     Base theme and types
backend/
  server.js           Express API
  src/db/schema.sql   Tables and RLS policies
  src/middleware/     auth, rate limiting, validation
```

---

## API

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/theme` | — | Generates theme tokens with AI |
| `POST` | `/events` | ✓ | Creates an event and returns its code |
| `GET` | `/events` | ✓ | Lists the host's events |
| `GET` | `/events/:id` | — | Public invitation data |
| `PATCH` | `/events/:id` | ✓ (owner) | Updates the event |
| `DELETE` | `/events/:id` | ✓ (owner) | Deletes the event |
| `POST` | `/events/:id/rsvp` | — | Submits an RSVP |
| `GET` | `/events/:id/rsvps` | ✓ (owner) | Lists the RSVPs |
| `GET` | `/health` | — | Health check |

Authenticated routes use `Authorization: Bearer <Supabase token>`. Rate limits per IP every 15 minutes: 100 requests overall, 10 event creations and 30 RSVPs.

---

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project with Google and email login enabled and a public `event-media` bucket
- An Anthropic API key and, optionally, a Resend API key

### Database

Run `backend/src/db/schema.sql` in the Supabase SQL Editor.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in the variables
npm run dev
```

| Variable | Description |
| --- | --- |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `RESEND_API_KEY` | Optional. Without it, emails are disabled |
| `RESEND_FROM` | Email sender |
| `WEB_URL` | Web app origin allowed by CORS |
| `PORT` | Port (default `3000`) |

### App

Create a `.env` file in the project root:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_WEB_URL=https://party-studio.vercel.app
```

```bash
npm install
npm start          # or: npm run web / npm run android / npm run ios
```

---

## Deploy

- **Web:** Vercel, with `npx expo export --platform web` (`vercel.json`).
- **Backend:** Railway with Nixpacks (`railway.json`, `nixpacks.toml`).
- **Mobile:** EAS Build with `development`, `preview` and `production` profiles (`eas.json`).
