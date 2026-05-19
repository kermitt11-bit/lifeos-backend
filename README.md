# Life OS

A calm, adaptive, mobile-first personal operating system. **Plan, eat, move, recover, grow.**
PWA you can install on your iPhone in 30 seconds, plus a SwiftUI native app and an
optional sync backend.

```
.
├── public/               # PWA — open in Safari, "Add to Home Screen"
├── ios/                  # Native iOS app (SwiftUI, iOS 17+)
│   ├── LifeOS.xcodeproj
│   └── LifeOS/
└── api/                  # Express backend (optional sync target)
    └── index.js
```

## What's inside

Ten pillars, equal weight to food, hobbies, and structure:

1. **Home** — greeting · mood · water / sleep / steps rings · next-best step · quick actions
2. **Planner** — preset vs actual timeline, week strip, move / skip / replace / reschedule (originals never disappear)
3. **Food** — pantry, meal suggestions from what you actually have (no eggs, snack-box rule, explicit portions, fallback meals), AI meal builder, MyNetDiary import
4. **Workout** — energy-aware suggestions (low / medium / high) with equipment matching, AI workout builder, JustFit import
5. **Hobbies** — creative · skill · restorative · social. Mood/energy/time filters with 5-minute starts and deep paths.
6. **Health** — water · sleep · steps · supplements with simple logging, week trends, Apple Health JSON import
7. **Habits** — streaks, weekly targets, 14-day strip + 12-week heatmap
8. **Reset** — overwhelmed · off day · low energy · anxious. Shrink the world to 30 minutes.
9. **Reviews** — weekly & monthly summaries: wins, patterns, friction, one useful upgrade (with optional AI summary)
10. **Settings** — cream / cocoa theme · health targets · integrations · local-first export/erase

### Integrations

| App           | Direction | How                                                                              |
| ------------- | --------- | -------------------------------------------------------------------------------- |
| Apple Health  | in        | Paste JSON `{steps, sleep, weight}` from a Shortcut or the iOS companion         |
| MyNetDiary    | in        | Paste the daily summary — we parse meals + macros and log them                   |
| JustFit       | in        | Paste a finished session — we log title, minutes, calories, exercises            |
| ChatGPT       | out       | Add an OpenAI key — powers AI meals, AI workouts, AI resets, kind weekly reviews |

## Install on iPhone (no Mac, ~30 seconds)

This repo deploys to Vercel automatically. Once the latest commit is live:

1. Open the deploy URL in **Safari** on your iPhone
2. Tap the **Share** icon → **Add to Home Screen** → **Add**
3. Launch from your home screen — runs full-screen, works offline, saves to IndexedDB

Your data lives in your phone's storage. Nothing leaves the device unless you connect an integration.

## Design principles

- The original plan must always remain visible.
- The user can move, skip, replace, or reschedule items without deleting the original.
- Never shame, never rigid, never overwhelming.
- Soft cream + blush palette, rounded cards, serif headings, gentle motion only.
- Hobbies are a major pillar, equal to food and workouts.
- Reset, not catch-up, after off days.

## Architecture

- **Frontend:** Preact + htm template tags (no build step), Preact Signals for state.
- **Storage:** IndexedDB (`/lib/db.js`), with a kv store for prefs. Local-first.
- **AI:** Optional OpenAI client (`/lib/ai.js`) — opt-in, key stored locally.
- **Backend:** Express + Supabase (optional, see `api/index.js`).
- **iOS native:** SwiftUI (iOS 17+) in `/ios/LifeOS`, SwiftData persistence.

## Run locally

```bash
# Static PWA — serve /public
python3 -m http.server -d public 5173
# Optional backend
npm install && npm start
```
