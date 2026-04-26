---
title: "React Native state not updating across components"
module: budget-tracker
date: "2026-04-23"
problem_type: ui_bug
component: mobile_app
symptoms:
  - "Adding expense doesn't update remaining amount on Today screen"
  - "Changing daily target in Settings doesn't reflect on Today screen"
  - "History doesn't refresh when returning to History tab"
root_cause: logic_error
resolution_type: code_fix
severity: high
tags:
  - react-native
  - react-context
  - state-management
---

## Problem

Multiple custom hooks calling `useState` create independent state instances, causing state updates in one component not to reflect in others.

## Symptoms

1. When adding an expense on the Today screen, the remaining amount doesn't update
2. Changing the daily target in Settings and returning to Today shows the old target
3. History tab doesn't show new entries when switching back from Settings

## What Didn't Work

**Adding `useFocusEffect` to refresh on tab focus**

Added `useFocusEffect` in both Today and History screens to call `refreshToday()` and `refreshHistory()` when tabs gain focus. This didn't work because each component calling `useEntries()` creates its own state instance via separate hook calls.

## Solution

Created shared React Context providers that wrap the app at the root layout level. All components now consume from the same state source.

**Files created/modified:**

1. `lib/EntriesContext.tsx` - Shared state for entries
2. `lib/SettingsContext.tsx` - Shared state for settings
3. `app/_layout.tsx` - Wraps app with providers
4. `lib/useEntries.ts` - Now uses EntriesContext
5. `lib/useSettings.ts` - Now uses SettingsContext

```tsx
// lib/EntriesContext.tsx
export const EntriesProvider: React.FC<EntriesProviderProps> = ({ children }) => {
  const [todayEntries, setTodayEntries] = useState<Array<any>>([]);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  // ... load functions using useCallback

  const value = useMemo(() => ({
    todayEntries,
    todayTotal,
    addEntry: addEntryHandler,
    deleteEntry: deleteEntryHandler,
    refreshToday: loadTodayData,
  }), [...]);

  return (
    <EntriesContext.Provider value={value}>
      {children}
    </EntriesContext.Provider>
  );
};

// app/_layout.tsx
return (
  <EntriesProvider>
    <SettingsProvider>
      <ThemeProvider ...>
        <Stack ... />
      </ThemeProvider>
    </SettingsProvider>
  </EntriesProvider>
);
```

## Why This Works

React Context provides a single source of truth. When any component calls `setState`, all consumers receive the update because they're reading from the same context value.

Key steps:
1. Create a context at the module level
2. Provide a Provider at the root (app entry point)
3. Use `useMemo` to prevent value instability causing infinite re-renders
4. All custom hooks consume from context instead of managing their own state

## Prevention

1. **Always use shared context for cross-component state** - If multiple components need to share state, create a context provider at the app root
2. **Memoize context values** - Use `useMemo` to prevent the "Maximum update depth exceeded" error
3. **Never call hooks in try/catch** - React hooks can't be called conditionally; context availability is handled at the use call site
4. **Document state ownership** - Clearly indicate which components "own" shared state vs "consume" it
5. **Pass data as props, don't fetch separately** - If a parent component already has data from a hook, pass it to children via props rather than having children fetch their own copy
6. **When adding a new component, check for existing data sources** - Before adding a useEffect that loads data, check if the parent already has that data from a shared hook

## Related Cases

### QuickAddForm stale total (2026-04-26)
QuickAddForm was fetching its own `getTodayTotal()` instead of using `total` from `usePeriodSummary()`. Fixed by adding `currentTotal` prop to QuickAddForm and passing `total` from parent.
Files: `components/QuickAddForm.tsx`, `app/(tabs)/index.tsx`

### usePeriodSummary missing refresh (2026-04-26)
After adding/deleting entries, totals didn't update. Root cause: usePeriodSummary fetched on mount but had no refresh function. Fixed by adding `refresh` function to hook and calling it after DB operations.
Files: `lib/usePeriodSummary.ts`, `app/(tabs)/index.tsx`