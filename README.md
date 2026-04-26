# Track Bud

A personal daily budget tracker app built with React Native + Expo. Track your daily spending, see how much budget remains, and review your spending history.

## Features

- **Daily Budget Tracking** — Set a daily spending target and log expenses throughout the day
- **Progress Ring** — Visual indicator showing spent/target ratio with color coding (green → amber → red)
- **Quick Add** — Fast expense entry with optional note
- **History** — Review past days grouped by week, expand to see individual entries
- **Rollover** — Carry overspend to tomorrow's budget (with confirmation)
- **Swipe to Delete** — Remove entries with swipe gesture + confirmation

## Tech Stack

- Expo SDK 54 + React Native 0.81
- expo-router (file-based routing)
- expo-sqlite for local storage
- date-fns for date handling
- @expo/vector-icons (Ionicons)

## Getting Started

### Prerequisites

- Node.js 18+
- Android SDK (for Android builds)
- Expo CLI

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android device/emulator
npx expo run:android

# Run on web
npx expo start --web
```

### Commands

| Command | Description |
|---------|-------------|
| `npx expo start` | Start Metro dev server |
| `npx expo run:android` | Build and run on Android |
| `npx expo start --web` | Run web build |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/
  (tabs)/
    index.tsx      # Today screen
    history.tsx    # History screen
    settings.tsx   # Settings screen
  _layout.tsx      # Root layout + DB init
components/
  BudgetRing.tsx
  EntryRow.tsx
  QuickAddForm.tsx
  DayAccordion.tsx
  RolloverBanner.tsx
  EmptyState.tsx
lib/
  db.ts            # SQLite + platform detection
  db.native.ts     # SQLite implementation
  db.web.ts        # localStorage fallback
  formatters.ts    # Currency, date helpers
hooks/
  useEntries.ts    # Entries CRUD
  useSettings.ts   # Settings read/write
  useDailySummary.ts
constants/
  theme.ts         # Colors, spacing
```

## Configuration

- **Currency**: Hardcoded as AUD (`A$`)
- **Date format**: ISO `YYYY-MM-DD` strings
- **Theme**: Dark-first (`#0f0f0f` background)
- **Platform-specific DB**: SQLite on native, localStorage on web

## License

MIT