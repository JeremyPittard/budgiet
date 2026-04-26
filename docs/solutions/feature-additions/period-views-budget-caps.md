---
title: Period views with soft/hard budget caps
category: feature-additions
date: 2026-04-26
last_updated: 2026-04-26
tags:
  - budget-tracking
  - react-native
  - expo
  - period-views
  - settings
  - mandatory-notes
  - ui-refinements
component: lib/db
module: db.native.ts
---

# Period Views with Soft/Hard Budget Caps

## Problem

The original TrackBud app had several limitations:
1. Day boundary was UTC-based, meaning for AEDT users the day changed at ~11am instead of midnight/4am
2. No way to view spending over longer periods (fortnight, month, year)
3. No concept of a "hard cap" as a visual reference beyond the daily target
4. No enforcement of notes when exceeding budget (useful as a mental barrier)

## Symptoms

- Users in certain timezones experienced inconsistent day boundaries
- No visibility into weekly/monthly spending trends
- Could not set a soft vs hard budget limit
- Easy to overspend without reflection when exceeding daily target

## Solution

### 1. Local Time-Based Day Calculation

Added `day_start_hour` setting (default: 4am) and created `getEffectiveToday()` helper that uses local time:

```typescript
// lib/db.native.ts
const getEffectiveToday = (dayStartHour: number): string => {
  const now = new Date();
  const localHour = now.getHours();
  if (localHour < dayStartHour) {
    now.setDate(now.getDate() - 1);
  }
  // Format as YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

### 2. Period Views

Added period types and date helpers:

```typescript
// lib/db.native.ts
export type Period = 'today' | 'fortnight' | 'month' | 'year';

export const getDaysInPeriod = (period: Period): number => {
  const year = new Date().getFullYear();
  switch (period) {
    case 'today': return 1;
    case 'fortnight': return 14;
    case 'month': return 30;
    case 'year': return isLeapYear(year) ? 366 : 365;
  }
};

export const getPeriodStartDate = (period: Period, dayStartHour: number): string => {
  const now = new Date();
  const days = getDaysInPeriod(period);
  now.setDate(now.getDate() - (days - 1));
  // ... return YYYY-MM-DD
};
```

Created `usePeriodSummary()` hook to calculate period-specific totals and targets.

### 3. Hard Cap Setting

Added to SettingsContext:

```typescript
// lib/SettingsContext.tsx
interface SettingsContextType {
  hardCap: number | null;
  setHardCap: (cap: number) => Promise<void>;
  // ...
}
```

Default is `daily_target × 1.5` when not explicitly set.

### 4. Mandatory Notes

In QuickAddForm, when entry would exceed daily target:

```typescript
// components/QuickAddForm.tsx
const handleAmountChange = useCallback((value: string) => {
  const numAmount = parseFloat(value);
  const newTotal = currentTotal + (isNaN(numAmount) ? 0 : numAmount);
  if (newTotal > dailyTarget) {
    setNoteRequired(true);
  } else {
    setNoteRequired(false);
  }
}, [currentTotal, dailyTarget]);
```

Entry cannot be saved without a note when over budget.

## Why This Works

- Local time calculation respects user's timezone and configured day start hour
- Period calculations scale daily target by 1/14/30/365 days
- Hard cap is purely visual (no blocking) - serves as reference point
- Mandatory notes create a "mental barrier" moment before exceeding budget

## Prevention

1. **Always use local time methods** (`getHours()`, `getDate()`) rather than UTC methods when dealing with user-visible dates
2. **Keep settings extensible** - new settings should follow the existing pattern (interface + context + UI)
3. **Consider mandatory notes for budget apps** - creates helpful friction before overspending
4. **Scale periods correctly** - account for leap years in year calculations
5. **Use consistent font sizing** - establish a base size and scale proportionally
6. **Never disable buttons** - show error text below fields instead when validation fails
7. **Match element heights** - inputs and buttons should have matching heights for visual consistency

## UI Refinements

### Font Sizing
- Base regular text: 18px (md)
- All other sizes scale proportionally from this base
- Notation/secondary text: 14px (sm)

### Settings Screen
- Inline input + save button in single row per setting
- Time picker uses two number fields (hours:minutes)
- Hard cap and daily target use $ prefix
- Reset All Data positioned at bottom with padding for tab bar
- Order: Daily Budget → Hard Cap → Day Starts At → Reset

### QuickAddForm
- Button always enabled - never disable for validation
- Show error text below fields when input is invalid or note required
- $ prefix on amount input
- Input and button heights match (42px)
- Gap between elements: 16px (lg)
- Amount input width: 60-80px (narrow, max 4 digits)

## Files Modified

- `lib/db.native.ts` - Added period types, helpers, note field, hard_cap setting
- `lib/db.web.ts` - Same changes
- `lib/SettingsContext.tsx` - Added hardCap state
- `lib/usePeriodSummary.ts` - New hook for period calculations
- `app/(tabs)/index.tsx` - Segmented control, period views
- `app/(tabs)/settings.tsx` - Hard cap UI, day start time picker
- `components/QuickAddForm.tsx` - Mandatory note feature
- `components/BudgetRing.tsx` - Hard cap display
- `components/EntryRow.tsx` - Note display