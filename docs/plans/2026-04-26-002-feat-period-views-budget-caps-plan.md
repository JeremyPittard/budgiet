---
title: "feat: Add period views (Fortnight, Month, Year) with segmented control and soft/hard budget caps"
type: feat
status: complete
date: 2026-04-26
---

# Period Views & Budget Caps Feature

## Overview

Add period-based budget views (Today, Fortnight, Month, Year) to the main screen with a segmented control, plus soft/hard budget caps with mandatory notes when exceeding the soft cap.

## Problem Frame

Currently the app only shows a "Today" view with a single daily target. Users need to track spending over different periods (fortnightly, monthly, yearly) with both soft caps (daily target scaled) and optional hard caps, plus mandatory notes when exceeding soft cap in the Today view.

## Requirements Trace

- R1. Add segmented control with periods: Today, Fortnight, Month, Year
- R2. Calculate period-specific budget targets (daily × period days)
- R3. Display progress ring colored by percentage: Green (0-80%), Yellow (80-100%), Red (100%+)
- R4. Add hard_cap setting (optional, default: daily_target × 1.5)
- R5. When adding entry in Today view that pushes total OVER soft cap → require note
- R6. Cannot save entry without note when threshold exceeded
- R7. Year calculation: 366 days for leap years, 365 otherwise

## Scope Boundaries

- Period segmented control only on main screen (index.tsx)
- Mandatory notes only apply to Today view
- Hard cap is visual reference only (does not block entries)
- Currency remains AUD
- Does not affect history screen

## Context & Research

### Relevant Code and Patterns

- `lib/db.native.ts` / `lib/db.web.ts`: Settings interface, getEffectiveToday(), getEntriesByDate()
- `lib/SettingsContext.tsx`: Settings state management pattern to follow
- `app/(tabs)/index.tsx`: Main screen with BudgetRing and entry list
- `app/(tabs)/settings.tsx`: Settings UI pattern (TextInput for numeric values)
- `components/BudgetRing.tsx`: Progress ring component with progressColor prop
- `constants/theme.ts`: Progress colors already defined:
  - `progress.underTarget` (#22c55e - green)
  - `progress.over80Percent` (#f59e0b - amber/yellow)
  - `progress.overTarget` (#ef4444 - red)
- `lib/useDailySummary.ts`: Budget calculation hook pattern

### Institutional Learnings

- The existing codebase uses ISO date strings (YYYY-MM-DD)
- Settings stored as string values, parsed on read
- Uses AsyncStorage on native, localStorage on web
- Day start hour already configurable (4am default)

## Key Technical Decisions

- **Period calculation approach**: Use date-fns to generate date ranges from effective today backward. Each period is "last N days" from today, not calendar boundaries.
- **Reuse vs separate**: Build period switching into main index.tsx with stateful period selector. Entries and summary update based on selected period.
- **Leap year detection**: Use `new Date().getFullYear()` to get current year, check leap with `(year % 4 === 0 && year % 100 !== 0) || year % 400 === 0`
- **Hard cap persistence**: Add `hard_cap` to Settings interface, store as string, derive default from daily_target × 1.5
- **Mandatory note state**: Track in QuickAddForm component with local state that enables when threshold exceeded

## Open Questions

### Resolved During Planning

- How to calculate period dates?
  - Resolution: Use date-fns subDays() from effective today: fortnight = last 14 days, month = last 30/31 days, year = last 365/366 days
- Whether to reuse existing History screen structure or build separate?
  - Resolution: Build into main index.tsx with period state. History remains separate for full date browsing.
- How to handle leap year detection?
  - Resolution: Check current year at runtime: `const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0`
- How to persist hard_cap setting?
  - Resolution: Same pattern as daily_target - add to Settings interface, store as string, parse as number

### Deferred to Implementation

- None yet identified

## Implementation Units

- [ ] **Unit 1: Add period types and date helper functions to db**

**Goal:** Add getEffectiveDate() and getEntriesByDateRange() to both db.native.ts and db.web.ts

**Requirements:** R1, R7

**Dependencies:** None

**Files:**
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`

**Approach:**
- Add Period type: 'today' | 'fortnight' | 'month' | 'year'
- Add getDaysInPeriod(period) helper with leap year logic
- Add getEffectiveDate(period, dayStartHour) that returns start date for the period
- Add getEntriesByDateRange(startDate, endDate) export
- Export types for use in components

**Test scenarios:**
- Edge case: Leap year (2024, 2028) returns 366 days for year period
- Edge case: Non-leap year (2025, 2026) returns 365 days for year period
- Happy path: today returns single day, fortnight returns 14 days, month returns ~30 days

**Verification:**
- All helper functions exported and working
- Leap years correctly detected

---

- [ ] **Unit 2: Add hard_cap to Settings context and persistence**

**Goal:** Extend SettingsContext with hard_cap state and CRUD operations

**Requirements:** R4

**Dependencies:** Unit 1

**Files:**
- Modify: `lib/SettingsContext.tsx`
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`

**Approach:**
- Add `hard_cap` to Settings interface in db files
- Add `hardCap` state to SettingsContext with default calculation (daily_target × 1.5)
- Add loader for hard_cap from storage (fallback to calculated default)
- Add setHardCap() method to context
- Update default settings to include hard_cap when daily_target changes

**Test scenarios:**
- Happy path: hard_cap defaults to daily_target × 1.5 when not set
- Edge case: User sets hard_cap, value persists across app restart

**Verification:**
- SettingsContext provides hardCap value
- Hard cap persists in storage

---

- [ ] **Unit 3: Add hard cap UI to Settings screen**

**Goal:** Add UI for configuring hard cap in settings

**Requirements:** R4

**Dependencies:** Unit 2

**Files:**
- Modify: `app/(tabs)/settings.tsx`
- Modify: `lib/useSettings.ts` (if needed for hook access)

**Approach:**
- Add new section below daily target for "Hard Cap Budget Limit"
- Show calculated default as placeholder
- Input accepts decimal values
- Save triggers setHardCap() from context

**Patterns to follow:**
- Follow existing settings UI pattern in settings.tsx (lines 89-112)

**Test scenarios:**
- Happy path: User can change hard cap and see saved value on reload
- Edge case: User enters 0 (disables hard cap visual)
- Edge case: User enters lower than daily target

**Verification:**
- Hard cap setting persists across app restarts
- Saved value reflects in main screen

---

- [ ] **Unit 4: Add period selector and summary hook to main screen**

**Goal:** Add period state and period-specific budget calculations

**Requirements:** R1, R2, R3

**Dependencies:** Unit 1, Unit 2

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Create: `lib/usePeriodSummary.ts` (similar to useDailySummary but accepts period)

**Approach:**
- Add useState for selectedPeriod ('today' | 'fortnight' | 'month' | 'year')
- Create usePeriodSummary hook that:
  - Accepts period parameter
  - Uses getEffectiveDate() to get date range
  - Uses getEntriesByDateRange() to fetch entries for period
  - Calculates period target: daily_target × days_in_period
  - Calculates progress percentage
  - Returns { entries, total, target, progress, progressColor, isOverBudget }
- Update index.tsx to use period-based data instead of useDailySummary directly

**Technical design (directional):**
```typescript
// lib/usePeriodSummary.ts
const usePeriodSummary = (period: Period) => {
  const { dailyTarget } = useSettings();
  const daysInPeriod = getDaysInPeriod(period);
  const target = dailyTarget * daysInPeriod;
  // ... fetch entries for period range, calculate totals
  return { entries, total, target, progress, progressColor, isOverBudget };
};
```

**Test scenarios:**
- Happy path: Switching periods updates target and entries correctly
- Edge case: No entries for period shows 0 total

**Verification:**
- Period selector UI renders
- Switching periods changes displayed target and entries

---

- [ ] **Unit 5: Add segmented control UI to main screen**

**Goal:** Render period segmented control and update BudgetRing for period

**Requirements:** R1, R2, R3

**Dependencies:** Unit 4

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `components/BudgetRing.tsx` (if needed for period label)

**Approach:**
- Add segmented control (use React Native's built-in SegmentedControlIOS or custom TouchableOpacity row)
- Segments: "Today" | "Fortnight" | "Month" | "Year"
- Update date header to show period name (e.g., "This Fortnight" for fortnight period)
- Pass period target to BudgetRing instead of daily target
- Show hard cap indicator when applicable (optional visual marker)

**Patterns to follow:**
- Follow existing UI patterns in index.tsx
- Use theme colors for consistency

**Test scenarios:**
- Happy path: Each segment shows correct label and selection state
- Edge case: Very long period names scroll or truncate

**Verification:**
- Segmented control renders below date header
- Selecting period updates BudgetRing and entries

---

- [ ] **Unit 6: Add mandatory note feature to QuickAddForm**

**Goal:** When entry pushes Today total over soft cap, require note

**Requirements:** R5, R6

**Dependencies:** Unit 4 (use daily target from settings)

**Files:**
- Modify: `components/QuickAddForm.tsx`
- Modify: `app/(tabs)/index.tsx` (pass threshold check callback)

**Approach:**
- QuickAddForm accepts optional onCheckThreshold callback
- When user enters amount, call onCheckThreshold(currentTotal + newAmount, dailyTarget)
- If result requiresNote, show inline TextInput for note
- Disable submit until note entered (disable button or show alert)
- Store note with entry (requires extending Entry type in db)

**Technical design (directional):**
```typescript
// In QuickAddForm
const [noteRequired, setNoteRequired] = useState(false);
const [note, setNote] = useState('');

const handleAmountChange = (amount: number) => {
  const wouldExceed = (currentTodayTotal + amount) > dailyTarget;
  setNoteRequired(wouldExceed);
};
```

**Patterns to follow:**
- Inline form pattern in QuickAddForm.tsx

**Test scenarios:**
- Edge case: Entry amount exactly equals target → note NOT required (not over)
- Edge case: Entry pushes total just 1 cent over → note required
- Error path: Try to submit without note when required → prevented

**Verification:**
- Note input appears inline when threshold exceeded
- Cannot save entry without note when required

---

- [ ] **Unit 7: Update BudgetRing to show period context**

**Goal:** Update BudgetRing to display period-specific labels

**Requirements:** R2

**Dependencies:** Unit 4

**Files:**
- Modify: `components/BudgetRing.tsx`
- Modify: `app/(tabs)/index.tsx`

**Approach:**
- Add optional periodLabel prop to BudgetRing
- Update targetText to show "of {target} {period}" (e.g., "of $700 fortnight")
- Add hardCap indicator line when visible (e.g., "hard cap: $1050")

**Technical design (directional):**
```typescript
// BudgetRing additional props (optional)
interface BudgetRingProps {
  // ... existing
  periodLabel?: string; // 'day' | 'fortnight' | 'month' | 'year'
  showHardCap?: boolean;
  hardCapAmount?: number;
}
```

**Test scenarios:**
- Happy path: Ring shows "of $700 fortnight" for fortnight period
- Happy path: Ring shows "hard cap: $1050" when showHardCap is true

**Verification:**
- Period-specific label displays correctly

---

- [ ] **Unit 8: Add Entry note field to database**

**Goal:** Extend Entry type to include optional note field

**Requirements:** R5

**Dependencies:** None (base layer)

**Files:**
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`

**Approach:**
- Add optional note field to Entry interface: `note?: string`
- modify addEntry() to accept optional note parameter
- Note stored with entry in cache

**Test scenarios:**
- Happy path: Entry with note persists and retrieves correctly

**Verification:**
- Entries with notes saved and loadable

---

## System-Wide Impact

- **Interaction graph**: Changes affect index.tsx (main screen), settings.tsx, QuickAddForm, BudgetRing, db layer
- **Error propagation**: If db fails, settings and entries not saved (handled by existing error boundaries)
- **State lifecycle**: Period state persists only in component (resets on navigation away), period selection does not persist
- **Unchanged invariants**: History screen unchanged, day start hour unchanged, currency unchanged

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Period performance with many entries | getEntriesByDateRange filters efficiently; defer optimization if needed |
| Note field schema migration | Optional field - no migration needed for existing entries |
| Hard cap display clutter | Show only when set and not equal to soft cap |

## Verification Criteria

- [ ] Segmented control shows all 4 periods
- [ ] Each period shows correct target (daily × period days)
- [ ] Progress ring colors: green 0-80%, yellow 80-100%, red 100%+
- [ ] Hard cap setting can be configured in settings
- [ ] Hard cap displays on BudgetRing when configured
- [ ] Note required when Today entry exceeds soft cap
- [ ] Note input appears inline when required
- [ ] Cannot submit without note when required
- [ ] Year period uses 366 days in leap year, 365 otherwise

## Files Likely Affected (from feature description)

- `app/(tabs)/index.tsx` - Main screen, add segmented control and period logic ✓
- `lib/db.native.ts` - Add getEffectiveDate for periods, getEntriesByDateRange ✓
- `lib/db.web.ts` - Same changes ✓
- `lib/SettingsContext.tsx` - Add hard_cap state ✓
- `app/(tabs)/settings.tsx` - Add hard cap UI ✓
- `components/QuickAddForm.tsx` - Add mandatory note feature ✓
- `components/BudgetRing.tsx` - Add period label support

## Documentation / Operational Notes

- User education: New users should understand period-based viewing
- No migration needed for existing data
- Settings persist via existing AsyncStorage/localStorage