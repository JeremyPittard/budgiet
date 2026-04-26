---
title: Period summary not updating after add/delete
date: 2026-04-26
module: track-bud
problem_type: ui_bug
component: tooling
symptoms:
  - Today screen totals don't update immediately after adding entries
  - Today screen totals don't update immediately after deleting entries
  - User must switch period tabs to see updated values
root_cause: async_timing
resolution_type: code_fix
severity: medium
tags: [react-hook, useeffect, refresh-function, period-summary]
---

# Period summary not updating after add/delete

## Problem

After adding or deleting an entry via the Today screen, the summary totals don't update immediately. Users must switch period tabs and return to see the new values.

## Symptoms

- Adding an expense shows stale total until period tab is changed
- Deleting an expense shows stale total until period tab is changed
- BudgetRing and summary cards display outdated amounts

## What Didn't Work

- The original codebase had QuickAddForm receive `currentTotal` as a prop (see `quickaddform-stale-total.md`), which was a workaround
- The underlying issue is that `usePeriodSummary` fetches entries on mount via `useEffect` with no way to refresh after external data changes

## Solution

1. **Added `refresh` function to `usePeriodSummary` hook** that re-fetches entries:

```typescript
// lib/usePeriodSummary.ts
export function usePeriodSummary(period: Period) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getEntriesForPeriod(period);
    setEntries(data);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    refresh();
  }, [period]);

  return { entries, loading, refresh };  // NEW: return refresh
}
```

2. **Returned `refresh` from the hook** to callers

3. **Called `refresh()` after DB operations** in handlers:

```typescript
// app/(tabs)/index.tsx
const handleAddEntry = async (amount: number, label: string, note?: string) => {
  await addEntryToDb({ amount, label, note, date: today });
  refresh();  // NEW: refresh after add
};

const handleDeleteEntry = async (id: number) => {
  await deleteEntryFromDb(id);
  refresh();  // NEW: refresh after delete
};
```

## Why This Works

The root cause was that `usePeriodSummary` fetches data once on mount via `useEffect`, but provides no way for external operations (like add/delete) to trigger a re-fetch. By exposing a `refresh` function that re-fetches entries and calling it after DB operations complete, the UI stays in sync with the database.

This follows the React pattern of **explicit refresh for external mutations** — when data changes outside a hook's control flow, the hook should expose a way to re-sync.

## Prevention

- **Always expose a refresh function** for custom hooks that load data, especially when the data can change externally
- **Document refresh patterns** in team conventions for custom hooks
- **Consider using React Query or SWR** for production apps, which handle caching and refetching automatically