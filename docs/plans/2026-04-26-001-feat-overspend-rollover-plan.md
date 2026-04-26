---
title: Add overspend rollover buttons to history
type: feat
status: completed
date: 2026-04-26
---

# Add Overspend Rollover Buttons to History

## Overview

Add "Soft" and "Hard" rollover buttons to each day in the History screen. When a day exceeds budget, these buttons allow users to make up the overspend by adding an expense entry to the current day.

## Problem Frame

Users need a way to acknowledge and "pay back" days where they exceeded their budget caps. Rather than automatically carrying over negative balance, this is an explicit action the user takes when they're ready.

## Requirements

- R1. Show "Soft" button on days over soft cap - adds (spent - soft cap) to today
- R2. Show "Hard" button on days over hard cap - adds (spent - hard cap) to today
- R3. Both buttons add entries with appropriate note ("overspend - soft" or "overspend - hard")
- R4. Buttons only appear when relevant (over that cap level)
- R5. Entry is added with today's date, current timestamp

## Scope Boundaries

- No automatic rollover - user must explicitly tap button
- No limit on how old the day can be
- No modification of the original day's entries

## Key Technical Decisions

- **Use existing `addEntry` function** - already handles creating entries with optional notes
- **Get today's effective date from DB** - respect the day start hour setting
- **Calculate overspend amounts inline** - simple subtraction, no new helpers needed

## Implementation Units

- [ ] **Unit 1: Add rollover handler to history screen**

**Goal:** Add function to create overspend entry for today

**Requirements:** R3, R5

**Dependencies:** None

**Files:**
- Modify: `app/(tabs)/history.tsx`

**Approach:**
- Import `addEntry` from db
- Get `getEffectiveToday` and `getSetting` for day start hour
- Create `handleOverspendRollover(type: 'soft' | 'hard')` function
- Calculate amount: `item.total - (type === 'soft' ? dailyTarget : hardCap)`
- Call `addEntry(amount, '', 'overspend - ' + type)`
- Refresh history after adding

**Patterns to follow:**
- Use same Alert confirmation pattern as delete entry
- Match existing button styling

**Test scenarios:**
- Happy path: Tap soft button when over soft cap, entry added with correct amount and note
- Happy path: Tap hard button when over hard cap, entry added with correct amount and note
- Edge case: Day exactly at cap - button should not appear (handled by visibility logic)

**Verification:**
- New entry appears in today's entries on Today screen
- Entry has correct amount and note
- History screen refreshes after adding

- [ ] **Unit 2: Add rollover button UI**

**Goal:** Add Soft and Hard buttons to expanded day view

**Requirements:** R1, R2, R4

**Dependencies:** Unit 1

**Files:**
- Modify: `app/(tabs)/history.tsx`

**Approach:**
- Add state to track hard cap: `const { dailyTarget, hardCap } = useSettings()`
- Calculate if over each cap: `const overSoft = item.total > (dailyTarget ?? 50)`, `const overHard = hardCap ? item.total > hardCap : false`
- Calculate amounts: `softAmount = item.total - (dailyTarget ?? 50)`, `hardAmount = hardCap ? item.total - hardCap : 0`
- Add buttons in entriesContainer after entries list
- Show "Soft" button only if over soft cap
- Show "Hard" button only if over hard cap (or over soft cap and hard cap)
- Add styles for rollover buttons

**Patterns to follow:**
- Match existing entry row styling
- Use `TouchableOpacity` with proper hit slop
- Match button visual weight of delete button

**Test scenarios:**
- Happy path: Day over soft but under hard - only Soft button shows
- Happy path: Day over both caps - both buttons show with correct amounts
- Edge case: Day under both caps - no buttons show

**Verification:**
- Buttons appear only when applicable
- Button text shows correct amount
- Tapping button triggers rollover

- [ ] **Unit 3: Refresh today data after rollover**

**Goal:** Ensure Today screen updates after rollover entry is added

**Requirements:** Implicit from UX

**Dependencies:** Unit 1

**Files:**
- Modify: `lib/EntriesContext.tsx`

**Approach:**
- Add `refreshHistory` call in the rollover handler after adding entry
- This ensures history screen is also refreshed when user returns to it

**Test scenarios:**
- Integration: Add rollover, go to Today screen, entry is visible

**Verification:**
- History refreshes after adding
- Today screen updates if navigated to

## System-Wide Impact

- **Entry creation:** Uses existing `addEntry` - no new DB schema needed
- **State:** History and Today contexts both need refresh after adding
- **Notes field:** The note is stored with the entry, appears in history if entry is ever viewed

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Negative amounts if hard cap > spent | Guard with `overHard` check - button won't show unless over cap |
| User taps wrong button | Include amount in confirmation message |
| Today screen doesn't update | Ensure both refreshToday and refreshHistory are called |

## Verification

1. Expand a day in history that's over budget
2. See Soft button (and Hard button if over hard cap)
3. Tap Soft button
4. See confirmation alert with correct amount
5. Confirm
6. Entry appears in History for today
7. Entry appears in Today screen with "overspend - soft" note