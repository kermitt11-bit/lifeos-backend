# LifeOS — Planner Journal

A planner + journal you can use today on iPhone (PWA, no Mac required) **and**
a full native iOS SwiftUI app for when you have Xcode access. Both share the
same feature surface; both store data locally on-device.

```
.
├── public/               # PWA — open in Safari, "Add to Home Screen"
├── ios/                  # Native iOS app (SwiftUI, iOS 17+)
│   ├── LifeOS.xcodeproj
│   └── LifeOS/
└── api/                  # Express backend (optional sync target)
    └── index.js
```

## Install on iPhone (no Mac, ~30 seconds)

This repo deploys to Vercel automatically. Once the latest commit is live:

1. Open the deploy URL in **Safari** on your iPhone
   (e.g. `https://lifeos-backend-*.vercel.app/`)
2. Tap the **Share** icon → **Add to Home Screen** → **Add**
3. Launch from your home screen — it now runs full-screen like a native app,
   saves your data to the phone (IndexedDB), and works offline.

Your data lives in your phone's storage. Nothing leaves the device.

## What's in the app

Five tabs cover the daily planner-journal loop:

- **Today** — greeting, mood check-in, today's tasks, overdue work, reflection
  prompt, habit chips with a streak counter.
- **Planner** — week strip, list mode and time-blocked schedule, task
  priorities, categories, subtasks, reminders, estimates vs. actuals.
- **Journal** — mood + gratitude + highlights + challenges + tomorrow's focus,
  rotating reflection prompts, full search, tag filtering, month grouping,
  streak/word-count stats.
- **Habits** — daily/weekly cadence, target per week, 14-day strip,
  12-week heatmap, streaks, custom icon + color, optional reminder.
- **Insights** — mood trend chart, daily task completion bars, time-by-category,
  habit consistency, goal progress (Swift Charts).

Plus **Goals** (timeframe, area, progress slider, milestones, linked tasks) and
**Settings** (theme, evening journal reminder, JSON export, local data wipe,
optional backend sync).

Everything is **local-first** via SwiftData. Sync is opt-in.

## Open & run the iOS app

Requirements: macOS with Xcode 15.0+ and an iOS 17 simulator or device.

```bash
open ios/LifeOS.xcodeproj
```

Then `⌘R` to build and run. The first launch shows a 4-step onboarding;
after that you land on the Today tab.

### Bundle identifier

The default bundle ID is `com.lifeos.planner`. To deploy to a physical
device, change it under **Signing & Capabilities → Bundle Identifier** and
set your Development Team.

### Notifications

The first time you tap "Request notification permission" in Settings the
system prompt appears. Task reminders, habit reminders, and a nightly
journal reminder are all scheduled through `UNUserNotificationCenter`.

## Backend (optional)

The iOS app works fully offline. The backend exists so you can sync data
between devices.

```bash
npm install
npm start                 # http://localhost:3000/health
```

Set the following environment variables (see `.env.example`):

| Variable                   | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `SUPABASE_URL`             | Your Supabase project URL                          |
| `SUPABASE_SERVICE_ROLE_KEY`| Service role key for server-side writes            |
| `API_TOKEN`                | Optional shared secret; the iOS app sends Bearer X |
| `PORT`                     | Defaults to 3000                                   |

Endpoints (auth required if `API_TOKEN` is set):

```
GET    /health
GET    /journal      POST /journal      DELETE /journal/:id
GET    /tasks        POST /tasks        DELETE /tasks/:id
GET    /habits       POST /habits       DELETE /habits/:id
GET    /goals        POST /goals        DELETE /goals/:id
GET    /moods        POST /moods        DELETE /moods/:id
```

POST accepts either a single record or `{ items: [...] }`. Records are
upserted by `id`.

### Connecting the app to a backend

In the app: **Insights → Settings & data → Backend sync**, paste the URL
and (optionally) the API token, then tap **Test connection**.

## Architecture

```
LifeOSApp
└── modelContainer(JournalEntry, PlannerTask, TimeBlock, Habit, HabitLog, Goal, MoodEntry)
    └── RootView (onboarding gate)
        └── TabView
            ├── TodayView
            ├── PlannerView ─→ AddTaskSheet · AddTimeBlockSheet · TaskDetailSheet
            ├── JournalView ─→ JournalEntryDetailView · NewJournalEntryView · MoodCheckinSheet
            ├── HabitsView ─→ HabitDetailView · NewHabitSheet
            └── InsightsView ─→ SettingsView ─→ GoalsView · BackendSyncView
```

Persistence is SwiftData; theming is centralized in `Theme/Theme.swift`;
charting uses the system `Charts` framework.

## Project status

Production-shaped scaffold with full feature surface area. Replace the
default app icon, set your team in Signing & Capabilities, and you're
ready to ship to TestFlight.
