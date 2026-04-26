---
title: feat: Add Week period, fix date range, add deficit carryover
type: feat
status: active
date: 2026-04-26
origin: docs/brainstorms/2026-04-26-period-views-carryover-fix-requirements.md
---

# Period Views & Carryover Fix - Implementation Plan

## Overview

Add "Week" period option, fix date range calculation so entries actually appear, and implement deficit carryover with 3-day limit for Today view only.

## Problem Frame

The existing period views (Today, Fortnight, Month, Year) show $0 even when data exists. Root cause: `getPeriodStartDate` uses calendar date instead of effective today based on `dayStartHour`. Additionally, users want deficit carryover functionality.

## Requirements Trace

- R1. Add "Week" to period selector (Today, Week, Fortnight, Month, Year order)
- R2. Fix date range calculation so entries actually appear for each period
- R3. Week period = last 7 days from effective today
- R4. Period queries must use "effective today" based on day start hour (not calendar date)
- R5. Query entries where date >= period_start AND date <= effective_today
- R6. When daily spending < daily target, the unused amount can carry to next day
- R7. Track consecutive carryover days - max 3 days in a row allowed
- R8. After 3 consecutive days of carryover, it resets (next deficit day starts fresh)
- R9. Carryover only applies to Today view (not Week/Fortnight/Month/Year)
- R10. Display current carryover amount and days remaining on Today screen
- R11. Allow user to disable carryover feature in settings
- R12. Show current carryover days count in settings

## Scope Boundaries

- Carryover is Today-view only
- Period views do not include carryover (pure view of past N days)
- Hard cap and mandatory note features remain separate

## Context & Research

### Relevant Code and Patterns

- `lib/db.native.ts` - Native DB with Period type (line 8), `getPeriodStartDate` (lines 80-89), `getEntriesByDateRange` (lines 91-96)
- `lib/db.web.ts` - Web DB matching native patterns
- `lib/usePeriodSummary.ts` - Period summary hook using `getEntriesByDateRange` and `getPeriodStartDate`
- `lib/SettingsContext.tsx` - Settings provider with dailyTarget, dayStartHour, hardCap
- `app/(tabs)/index.tsx` - Today screen with period selector buttons (lines 28-35 define PERIODS array)
- `app/(tabs)/settings.tsx` - Settings screen with existing setting patterns

### Institutional Learnings

- No existing `docs/solutions/` for period or carryover (this is greenfield)
- Entry date stored as YYYY-MM-DD string in `Entry.date`

### External References

- None required - well-established local patterns

## Key Technical Decisions

- **Week period**: Added between Today and Fortnight in selector order
- **Date calculation fix**: `getPeriodStartDate` must use `getEffectiveToday(dayStartHour)` to determine the "end date" before calculating subtract days backwards
- **Carryover state**: Store in AsyncStorage alongside settings as `{ carryover_enabled: 0|1, carryover_balance: number, carryover_days: number, last_carryover_date: string }`
- **3-day reset**: Count consecutive days where user didn't need to use carryover

## Open Questions

### Resolved During Planning

- How to store carryover state: Use AsyncStorage with other settings (no separate table needed)
- Sort order for entries: Already sorted by `created_at` descending in `getEntriesByDateRange`

### Deferred to Implementation

- None identified

## Implementation Units

- [ ] **Unit 1: Add "Week" to Period type and getDaysInPeriod**

**Goal:** Add Week period option with 7-day duration

**Requirements:** R1, R3

**Dependencies:** None

**Files:**
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`

**Approach:**
- Add `'week'` to Period type union
- Add `case 'week': return 7;` in getDaysInPeriod switch

**Patterns to follow:**
- db.native.ts lines 66-78 (getDaysInPeriod pattern)
- db.web.ts lines 58-70

**Test scenarios:**
- Happy path: getDaysInPeriod('week') returns 7

**Verification:** getDaysInPeriod('week') returns 7

- [ ] **Unit 2: Fix getPeriodStartDate to use effective today**

**Goal:** Make period start date calculation respect dayStartHour

**Requirements:** R4, R5

**Dependencies:** Unit 1

**Files:**
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`

**Approach:**
- Import/call existing `getEffectiveToday(dayStartHour)` function
- Use effective today as the end point when calculating start date
- Example: If effective today is 2026-04-26 and period is fortnight (14 days), start = 2026-04-13

**Technical design:**
```typescript
// Current (broken): uses calendar today
export const getPeriodStartDate = (period: Period, dayStartHour: number): string => {
  const now = new Date();  // Uses calendar date - ignores dayStartHour!
  const days = getDaysInPeriod(period);
  now.setDate(now.getDate() - (days - 1));
  return formatDate(now);
};

// Fixed: uses effective today
export const getPeriodStartDate = (period: Period, dayStartHour: number): string => {
  const effectiveToday = getEffectiveToday(dayStartHour);  // e.g., "2026-04-26"
  const effectiveTodayDate = new Date(effectiveToday + 'T00:00:00');
  const days = getDaysInPeriod(period);
  effectiveTodayDate.setDate(effectiveTodayDate.getDate() - (days - 1));
  return formatDate(effectiveTodayDate);
};
```

**Patterns to follow:**
- db.native.ts lines 50-60 (getEffectiveToday pattern)
- db.native.ts lines 80-89 (existing getPeriodStartDate structure)

**Test scenarios:**
- Happy path: With dayStartHour=4 and current time 2am, effective today = yesterday; period start for "today" = yesterday
- Edge case: When dayStartHour=0, effective today = calendar today

**Verification:** getPeriodStartDate returns correct effective date range

- [ ] **Unit 3: Update usePeriodSummary to use effective today as end date**

**Goal:** Fetch entries from period_start to effective_today (not arbitrary calendar date)

**Requirements:** R2, R5

**Dependencies:** Unit 2

**Files:**
- Modify: `lib/usePeriodSummary.ts`

**Approach:**
- Use getEffectiveToday(dayStartHour) as the end date parameter
- Remove redundant manual end date calculation in usePeriodSummary

**Patterns to follow:**
- usePeriodSummary.ts lines 11-34 (existing useEffect that loads entries)

**Test scenarios:**
- Happy path: Entries from last N days appear correctly

**Verification:** Entries display in period view

- [ ] **Unit 4: Add Week to period selector UI**

**Goal:** Add Week button to Today screen

**Requirements:** R1

**Dependencies:** Unit 1

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Approach:**
- Add 'week' to PeriodType type
- Add { key: 'week', label: 'Week' } to PERIODS array

**Patterns to follow:**
- index.tsx lines 28-35 (PERIODS array pattern)

**Test scenarios:**
- Happy path: Week button appears between Today and Fortnight

**Verification:** Week selector visible on Today screen

- [ ] **Unit 5: Add carryover setting to SettingsContext and Settings**

**Goal:** Store and toggle carryover enable/disable

**Requirements:** R11, R12

**Dependencies:** None

**Files:**
- Modify: `lib/SettingsContext.tsx`
- Modify: `app/(tabs)/settings.tsx`

**Approach:**
- Add carryoverEnabled, carryoverBalance, carryoverDays, lastCarryoverDate to SettingsContext
- Add toggle in Settings screen

**Patterns to follow:**
- SettingsContext.tsx (existing settings provider pattern)
- settings.tsx (existing setting toggle pattern)

**Test scenarios:**
- Happy path: Toggle carryover on/off in settings

**Verification:** Carryover toggle works

- [ ] **Unit 6: Implement carryover calculation logic**

**Goal:** Calculate and track deficit carryover with 3-day limit

**Requirements:** R6, R7, R8

**Dependencies:** Unit 5

**Files:**
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`
- Create: `lib/useCarryover.ts` (new hook)

**Approach:**
- Create useCarryover hook that:
  - On day load, checks if yesterday had unused budget
  - If yes, adds to carryover_balance
  - Tracks consecutive days in carryover_days
  - Resets after 3 consecutive days of no usage
- Call from entry creation (addEntry) to update balance

**Patterns to follow:**
- db.native.ts addEntry pattern (lines 146-156)
- SettingsContext state management

**Test scenarios:**
- Happy path: Deficit of $10 carries to next day
- Edge case: After 3 days carryover, balance resets to 0

**Verification:** Carryover amount displays correctly

- [ ] **Unit 7: Display carryover on Today screen**

**Goal:** Show carryover amount and days remaining in Today view

**Requirements:** R10

**Dependencies:** Unit 6

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Approach:**
- Import and use useCarryover hook
- Display in BudgetRing section

**Patterns to follow:**
- index.tsx BudgetRing display pattern

**Test scenarios:**
- Happy path: Carryover amount shows on Today screen

**Verification:** Carryover visible on Today screen

- [ ] **Unit 8: Display carryover days in Settings**

**Goal:** Show current carryover days count in settings

**Requirements:** R12

**Dependencies:** Unit 6

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Approach:**
- Display carryover days in settings below toggle

**Patterns to follow:**
- settings.tsx existing display pattern

**Test scenarios:**
- Happy path: "Carryover days: X" shows in settings

**Verification:** Days count displays in settings

## System-Wide Impact

- **Interaction graph:** Entry creation (addEntry) triggers carryover recalculation
- **Error propagation:** Carryover calculation errors should not block entry creation
- **State lifecycle risks:** None significant - carryover stored atomically with entries
- **API surface parity:** Both native and web DB need same changes
- **Integration coverage:** Both index.tsx and settings.tsx modified

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Day boundary at dayStartHour | Use getEffectiveToday consistently in all date calculations |
| Carryover 3-day reset logic edge cases | Test consecutive day scenarios manually |
| Web DB parity | Apply same changes to both db.native.ts and db.web.ts |

## Documentation / Operational Notes

- No external docs needed
- App restart may be needed after initial DB schema changes (none here - just logic)

## Sources & References

- Origin document: [docs/brainstorms/2026-04-26-period-views-carryover-fix-requirements.md](docs/brainstorms/2026-04-26-period-views-carryover-fix-requirements.md)
- Related code: lib/db.native.ts, lib/db.web.ts, lib/usePeriodSummary.ts, app/(tabs)/index.tsx, app/(tabs)/settings.tsx