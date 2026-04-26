---
title: QuickAddForm amount remaining not updating
date: 2026-04-26
module: budgiet
problem_type: ui_bug
component: tooling
symptoms:
  - Amount remaining display not updating after adding entries via QuickAddForm
  - Had to tab through periods to see the updated total
root_cause: duplicate_data_fetching
resolution_type: code_fix
severity: medium
tags: [react-state, shared-context, today-screen]
---

# QuickAddForm amount remaining not updating

## Problem

The QuickAddForm component on the Today screen was not updating the "amount remaining" display in real-time when entries were added. Users had to tab through other periods and return to "Today" to see the updated total.

## Symptoms

- Adding an expense via QuickAddForm does not immediately reflect in the remaining amount display
- The BudgetRing component shows stale total until the user changes periods

## What Didn't Work

- Multiple independent `useEntries()` hooks created separate state instances, preventing shared state updates
- QuickAddForm had its own `useEffect` with `getTodayTotal()` call to fetch the current total on mount

## Solution

The fix involved three changes:

1. **Added `currentTotal` prop to QuickAddForm interface:**

```typescript
// components/QuickAddForm.tsx
interface QuickAddFormProps {
  onAdd: (amount: number, label: string, note?: string) => void;
  dailyTarget: number;
  currentTotal: number; // NEW: prop to receive total from parent
}
```

2. **Removed the internal state update hack:**

The original code had a `setCurrentTotal` call that was working around the stale state issue. This was removed since QuickAddForm now receives the correct total from its parent.

3. **Passed `total` from `usePeriodSummary` to QuickAddForm:**

```typescript
// app/(tabs)/index.tsx
<QuickAddForm
  onAdd={handleAddEntry}
  dailyTarget={dailyTarget ?? 50}
  currentTotal={total}  // Single source of truth from shared hook
/>
```

## Why This Works

The `usePeriodSummary` hook already fetches entries and calculates the total for the entire Today screen. By passing `total` as a prop to QuickAddForm, all components share the same data source. When `addEntry` updates the database, React re-renders with the updated entries from `usePeriodSummary`, and QuickAddForm receives the correct `currentTotal` value.

This follows the React pattern of **lifting state up** — the parent component owns the state, and children receive it as props.

## Prevention

- **Prefer props over local fetching**: When a shared hook already provides data, pass it as a prop rather than fetching separately
- **Use shared context/state**: Components that need the same data should share a single source of truth
- **Avoid useEffect data fetching in child components**: If a child needs data that the parent already has, pass it as a prop

## Related Issues

- See `app/(tabs)/index.tsx` for the correct pattern of passing `total` from `usePeriodSummary`
- See `lib/usePeriodSummary.ts` for the single source of truth for period data
