# Budget Tracker — Agent Handoff Spec
**Platform:** Android (React Native + Expo)  
**Purpose:** Personal daily spending tracker with a configurable daily budget target

---

## Overview

A lightweight, single-user budget tracking app. The user sets a daily spending target and logs individual expenses throughout the day. The app shows at a glance how much has been spent, how much is left, and a history of past days.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native (Expo SDK 51+) |
| Navigation | Expo Router (file-based, v3) |
| Storage | `expo-sqlite` (local, on-device, no backend) |
| State | React Context + `useReducer` |
| Styling | StyleSheet API (no third-party UI lib) |
| Date handling | `date-fns` |
| Icons | `@expo/vector-icons` (Ionicons) |

---

## Screens & Navigation

```
(tabs)/
  index.tsx        → Today screen (default tab)
  history.tsx      → History screen
  settings.tsx     → Settings screen
```

Use Expo Router's tab layout. No authentication. No onboarding beyond first-run daily target prompt.

---

## Screen Specifications

### 1. Today Screen (`index.tsx`)

**Purpose:** Primary daily-use screen. Log expenses, see remaining budget.

**Layout (top to bottom):**

1. **Date header** — e.g. "Wednesday, April 22"
2. **Budget ring / summary card**
   - Large display: amount spent today (e.g. `$34.50`)
   - Subtitle: `$65.50 remaining` (or `$10.00 over budget` in red if exceeded)
   - Circular progress indicator showing spent/target ratio (capped at 100% visually)
3. **Quick-add row**
   - Numeric input field (decimal keyboard, placeholder `0.00`)
   - Optional short label input (placeholder `Note...`, max 40 chars)
   - `+ Add` button
   - On submit: validate amount > 0, save entry, clear inputs, update totals
4. **Today's entries list**
   - Flat list, most recent at top
   - Each row: label (or "Expense" if blank), amount, time (e.g. `2:14 PM`), swipe-left to delete with confirmation
   - Empty state: "No expenses yet today"
5. **Reset day button** (bottom, subtle) — clears all entries for today after confirmation dialog

**Behaviour:**
- Totals recalculate reactively on add/delete
- If no daily target has been set, show a banner: "Set a daily target in Settings" with a link

---

### 2. History Screen (`history.tsx`)

**Purpose:** Review past days at a glance.

**Layout:**
1. **Section list** grouped by week (e.g. "This Week", "Last Week", "April 7–13")
2. Each day row shows:
   - Day name + date (e.g. "Monday Apr 14")
   - Total spent
   - Green checkmark if under/at target, red indicator if over
   - Tap to expand inline list of that day's entries (accordion)
3. Empty state: "No history yet"

**Behaviour:**
- Only shows days that have at least one entry
- Entries within each expanded day support swipe-left to delete (same affordance as Today screen), with a confirmation alert. Day totals update immediately. If all entries for a day are deleted, that day disappears from the list.

---

### 3. Settings Screen (`settings.tsx`)

**Purpose:** Configure daily target.

**Fields:**
1. **Daily Budget Target**
   - Numeric input, decimal, currency formatted
   - Saved immediately on blur / confirm
   - Displayed as `A$0.00`
2. **Reset all data** — destructive button, requires confirmation alert ("This will permanently delete all entries and settings.")

---

## Data Model

All data stored in SQLite via `expo-sqlite`.

### Tables

```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  amount     REAL    NOT NULL,
  label      TEXT    NOT NULL DEFAULT '',
  date       TEXT    NOT NULL,  -- ISO date string: 'YYYY-MM-DD'
  created_at TEXT    NOT NULL   -- ISO datetime: 'YYYY-MM-DDTHH:MM:SS'
);

CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
```

### Settings keys
| Key | Type | Default |
|---|---|---|
| `daily_target` | REAL as TEXT | `"50.00"` |

> **Currency is fixed to AUD (`A$`).** No currency setting — hardcode the symbol as `A$` in `constants/theme.ts`. Remove the currency field from the Settings screen entirely.

---

## Business Logic

### Daily total
```
dailyTotal = SUM(entries.amount) WHERE entries.date = today
remaining  = daily_target - dailyTotal
isOverBudget = dailyTotal > daily_target
```

### Progress ring value
```
progress = min(dailyTotal / daily_target, 1.0)
// Ring colour: green (#22c55e) under target, amber (#f59e0b) > 80%, red (#ef4444) over
```

### "Today" definition
Use device local date (`new Date()` formatted with `date-fns/format(new Date(), 'yyyy-MM-dd')`).

---

## UX Details & Edge Cases

| Scenario | Behaviour |
|---|---|
| Amount field empty or `0` | Disable Add button, show no error |
| Amount is negative | Reject silently (do not allow) |
| Daily target not set (null / 0) | Hide ring, show banner, remaining = N/A |
| Swipe-to-delete entry | Show red delete affordance; tap confirms; no extra modal |
| Reset day | `Alert.alert` with Cancel / Delete Today |
| Reset all data | `Alert.alert` with Cancel / Delete Everything |
| Very large amounts | Display truncated with `k` suffix (e.g. `$1.2k`) if > 999 |
| Midnight rollover | "Today" recalculates on app foreground (`AppState` listener) |

---

## Visual Design Direction

- **Theme:** Dark-first. Deep charcoal background (`#0f0f0f`), card surfaces at `#1a1a1a`
- **Accent:** A single vivid accent colour — electric teal (`#00d4aa`) for interactive elements and the progress ring
- **Typography:** `System` font stack (no custom fonts needed for MVP), but use weight contrast heavily (700 for amounts, 400 for labels)
- **Spacing:** 16px base unit, 24px section gaps
- **No bottom sheet modals** — keep all interactions inline or in-screen to minimise friction

---

## Project Structure

```
app/
  (tabs)/
    _layout.tsx
    index.tsx
    history.tsx
    settings.tsx
  _layout.tsx
components/
  BudgetRing.tsx       ← SVG circular progress
  EntryRow.tsx         ← Single expense row with swipe-delete
  QuickAddForm.tsx     ← Amount + label inputs
  DayAccordion.tsx     ← Expandable day in history
  EmptyState.tsx
lib/
  db.ts                ← SQLite init, all query functions
  formatters.ts        ← Currency, date, truncation helpers
  useEntries.ts        ← Hook: today's entries + CRUD
  useSettings.ts       ← Hook: read/write settings
  useDailySummary.ts   ← Hook: derived totals + ring value
constants/
  theme.ts             ← Colours, spacing, typography constants
```

---

## Out of Scope (MVP)

- Cloud sync / backup
- Multiple budgets or categories
- Recurring expenses
- Charts / analytics beyond history list
- Notifications / reminders
- iOS support (Android-first, but Expo code should work on iOS too without extra effort)
- Export / import

---

## Initialisation Checklist for Agent

```bash
npx create-expo-app budget-tracker --template blank-typescript
cd budget-tracker
npx expo install expo-sqlite expo-router date-fns
npx expo install react-native-safe-area-context react-native-screens
```

Set `scheme` in `app.json`, configure `expo-router` as the entry point, enable `newArchEnabled: true` in `app.json` for Expo SDK 51+.

### Building with Android Studio

1. After the agent has scaffolded the project, run: `npx expo prebuild --platform android`
2. This generates an `android/` folder — open that folder in Android Studio (not the root project folder)
3. Plug in your Android device via USB (with USB Debugging enabled in Developer Options)
4. Hit the green **Run** button in Android Studio — it will build and install directly to your device
5. For a standalone APK to share or keep: **Build → Build Bundle/APK → Build APK(s)** in the Android Studio menu


---

## Rollover Feature

### Behaviour Summary
When a day ends in overspend, the user can choose to "roll" the overage into the next day's budget — effectively reducing tomorrow's target by the amount overspent.

### Rules
- A **"Roll over to tomorrow"** button appears on the Today screen as soon as the day's spending exceeds the target (i.e. the same day, while you're still in the app)
- If the user does **not** tap it that day, the prompt reappears once on the **next day** when they open the app (as a dismissible banner at the top of the Today screen)
- If dismissed or ignored on the next day, it **never appears again** for that overspend
- Rollovers can only happen on **two consecutive days maximum** — if yesterday's budget was already reduced by a rollover, today's overage cannot be rolled into tomorrow. The button simply does not appear.

### UX Detail
- Button label: `"Roll A$XX.XX overspend to tomorrow"`
- Tapping it shows a confirmation: `"This will reduce tomorrow's budget from A$50.00 to A$32.50. Continue?"`
- Once confirmed, the button disappears and a subtle badge shows on tomorrow's date: `"Includes A$17.50 rollover"`
- The rollover is **permanent once confirmed** — no undo

### Data Model Addition

```sql
CREATE TABLE IF NOT EXISTS rollovers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  from_date     TEXT NOT NULL,   -- 'YYYY-MM-DD' the day that overspent
  to_date       TEXT NOT NULL,   -- 'YYYY-MM-DD' the day being penalised
  amount        REAL NOT NULL,   -- the overspend amount carried forward
  confirmed_at  TEXT NOT NULL,   -- ISO datetime when user confirmed
  prompted_next_day INTEGER NOT NULL DEFAULT 0  -- 0 = not yet shown next day, 1 = has been shown
);
```

### Settings key addition
| Key | Type | Default |
|---|---|---|
| `daily_target` | REAL as TEXT | `"50.00"` |

### Business Logic Addition

```
// Effective target for a given date
effectiveTarget(date) =
  daily_target - SUM(rollovers.amount WHERE rollovers.to_date = date)

// Whether rollover button should show today
canRollover(today) =
  isOverBudget(today)
  AND no confirmed rollover exists with from_date = today
  AND effectiveTarget(today) == daily_target  // today itself wasn't a rollover day
  // (i.e. we haven't already been penalised today, preventing 2-day chain extension)

// On app open: check if yesterday overspent and rollover was not confirmed and not yet prompted next day
showNextDayPrompt =
  isOverBudget(yesterday)
  AND no confirmed rollover with from_date = yesterday
  AND rollovers.prompted_next_day = 0 for yesterday
  → display dismissible banner, mark prompted_next_day = 1 regardless of user action
```

### Component Addition
- `RolloverBanner.tsx` — handles both the same-day button and the next-day dismissible prompt, accepts `overspendAmount`, `tomorrowTarget`, `onConfirm`, `onDismiss` props

