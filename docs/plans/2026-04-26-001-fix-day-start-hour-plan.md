---
title: Add configurable day start hour
type: fix
status: complete
date: 2026-04-26
---

# Add Configurable Day Start Hour

## Overview

Fix UTC-based day boundary by adding a configurable `day_start_hour` setting (default: 4am) that determines when the "day" resets based on local time.

## Problem Frame

Currently, the app uses `new Date().toISOString().split('T')[0]` to get today's date. This returns UTC midnight, which for AEDT (UTC+11) means the day doesn't change until ~11am local time.

## Requirements Trace

- R1. Add `day_start_hour` setting (number, default: 4) to persist user preference
- R2. Create `getEffectiveToday()` helper using local time + day_start_hour offset
- R3. Replace all 4 occurrences of UTC-based date calculation with new helper
- R4. Add UI in Settings to configure day start hour (0-23 picker)

## Scope Boundaries

- Only affects date calculation for entry filtering/totals
- Does not affect historical data - entries retain their original recorded date
- Currency remains AUD

## Context & Research

### Relevant Code and Patterns

- `lib/db.native.ts` lines 95, 119: Uses UTC date for adding entries and getting today's total
- `lib/db.web.ts` lines 79, 101: Same pattern in web DB
- Settings pattern exists in `lib/db.native.ts:25-27` with `daily_target`

### Institutional Learnings

- This is a straightforward fix - no prior art in docs/solutions/

## Key Technical Decisions

- Use JavaScript `Date` with local timezone methods (getHours, setHours) rather than date-fns
- Store setting as number 0-23
- Use simple hour comparison: if local hour < day_start_hour, show previous day's date

## Implementation Units

- [ ] **Unit 1: Add day_start_hour to Settings type**

**Goal:** Extend Settings interface to include day_start_hour with default value

**Files:**
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`

**Approach:**
- Add `day_start_hour: number` to Settings interface
- Update default settings in both files to include `day_start_hour: 4`

**Test scenarios:**
- Happy path: Default settings include day_start_hour: 4

**Verification:**
- Settings object has day_start_hour property with value 4

---

- [ ] **Unit 2: Create getEffectiveToday() helper function**

**Goal:** Create a reusable function that calculates today's date based on local time + day_start_hour

**Files:**
- Modify: `lib/db.native.ts`
- Modify: `lib/db.web.ts`

**Approach:**
- Create function that:
  1. Gets current local date
  2. Gets local hour
  3. If hour < day_start_hour, returns previous day's date
  4. Otherwise returns current day's date
  5. Returns formatted "YYYY-MM-DD" string

**Technical design (directional):**
```typescript
function getEffectiveToday(dayStartHour: number): string {
  const now = new Date();
  const localHour = now.getHours();
  if (localHour < dayStartHour) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split('T')[0]; // This is now local midnight, not UTC
}
```

**Test scenarios:**
- Edge case: When local hour < day_start_hour, returns yesterday
- Edge case: When local hour >= day_start_hour, returns today
- Happy path: At 4:30am with day_start_hour=4, returns yesterday

**Verification:**
- Function correctly returns previous day before configured hour
- Function correctly returns current day on or after configured hour

---

- [ ] **Unit 3: Replace UTC date calls with helper**

**Goal:** Update all 4 occurrences to use getEffectiveToday()

**Files:**
- Modify: `lib/db.native.ts` (lines 95, 119)
- Modify: `lib/db.web.ts` (lines 79, 101)

**Approach:**
- Replace `new Date().toISOString().split('T')[0]` with `getEffectiveToday(cache.settings.day_start_hour ?? 4)`
- Extract to shared helper or inline based on code structure

**Test scenarios:**
- Happy path: Entry added at 3am with day_start_hour=4 shows as yesterday's date
- Happy path: Entry added at 5am with day_start_hour=4 shows as today's date

**Verification:**
- All 4 occurrences updated
- App builds successfully

---

- [ ] **Unit 4: Add day start hour UI to Settings screen**

**Goal:** Allow users to configure the day start hour

**Files:**
- Modify: `app/(tabs)/settings.tsx`
- Modify: `lib/useSettings.ts` (if needed for getter)

**Approach:**
- Add state for day_start_hour
- Use a simple picker (could be TextInput with numeric validation, or scrollPicker if available)
- Save setting via useSettings hook
- Add new setting section below daily target

**Patterns to follow:**
- Follow existing settings UI pattern in settings.tsx

**Test scenarios:**
- Happy path: User can change day start hour and see saved value on reload
- Edge case: User enters 0 (midnight) - should work
- Edge case: User enters 23 (11pm) - should work

**Verification:**
- Setting persists across app restarts
- New entries use the updated day start hour

## System-Wide Impact

- Only affects date calculations for "today" view
- Historical entries remain unchanged
- No API or data format changes

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Migration of existing entries | Not needed - existing dates stay as recorded |
| Invalid hour values | Validate 0-23 in UI before saving |

## Next Steps

- Start `/ce:work` to implement this plan