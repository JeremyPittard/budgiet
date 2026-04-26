# AGENTS.md

## Project Overview

Expo SDK 54 + React Native + expo-router for file-based routing. Budget tracker app (Android-first).

## Commands

```bash
npx expo start           # Dev server (Metro)
npx expo run:android     # Build and run on device/emulator
npx expo start --web     # Web build
npm run lint             # ESLint
```

## Architecture

- **Routing**: `app/` directory with expo-router file-based routing
- **Platform-specific DB**: `lib/db.native.ts` (SQLite) vs `lib/db.web.ts` (localStorage)
- **Entry point**: `lib/db.ts` auto-selects implementation via `Platform.OS`
- **Currency**: Hardcoded as AUD (`A$`), never localized
- **Date format**: ISO `YYYY-MM-DD` strings, use `date-fns`

## Structure

| Directory | Purpose |
|---|---|
| `app/(tabs)/` | Tab screens (index, history, settings) |
| `app/_layout.tsx` | Root layout, DB init |
| `lib/` | DB, hooks, formatters |
| `components/` | UI components |
| `constants/theme.ts` | Colors, spacing |
| `hooks/` | use-color-scheme, use-theme-color |

## Quirks

- DB initializes lazily on app load (loading spinner while `initDatabase()` runs)
- Tab icons from `@expo/vector-icons` (Ionicons)
- Swipe-to-delete uses `react-native-gesture-handler`
- Dark theme by default, background `#0f0f0f`

## Testing

No test suite configured. Manual verification via `npx expo run:android`.

## Known Issues

| Bug | Location | Status |
|---|---|---|
| Target not updating in real-time | Today screen | **Fixed** — shared EntriesContext now provides single state |
| History not refreshing | History tab | **Fixed** — shared EntriesContext now provides single state |
| Amount remaining doesn't update | Today screen after adding expense | **Fixed** — shared EntriesContext now provides single state |

## Former Issues (Fixed)

These issues were caused by multiple `useEntries()` calls creating separate state instances. Fixed by creating a shared `EntriesContext` that all components now use.

## Compound Engineering

Use these skills for structured workflows:

| Skill | When |
|---|---|
| `ce:brainstorm` | Feature ideas, problem framing, vague requirements |
| `ce:plan` | Transform requirements into implementation plans |
| `ce:work` | Execute features with verified completeness |
| `ce:review` | Structured PR review before merging |
| `ce:compound` | Document solved problems to `docs/solutions/` |
| `ce:compound-refresh` | Refresh stale pattern docs against current code |

Key files:
- `docs/solutions/` — past solutions indexed by pattern
- Spec: `budget-tracker-spec.md` — source of truth for features