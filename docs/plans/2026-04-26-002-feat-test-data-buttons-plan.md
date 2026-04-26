---
title: Add debug test data buttons to settings
type: feat
status: active
date: 2026-04-26
---

# Add Debug Test Data Buttons to Settings

## Overview

Add buttons to Settings screen that generate realistic test data and clear it. These buttons only appear in development builds, not in production release APK.

## Requirements

- R1. "Generate Test Data" button creates 30 days of data
- R2. Daily spending randomly between $500 and $200
- R3. "Clear Test Data" button removes all entries
- R4. Buttons only visible when `__DEV__` is true (development build)
- R5. Test data should span last 30 days including today

## Key Technical Decisions

- **`__DEV__` global**: Expo/React Native exposes this - true in dev, false in production
- **Date range**: Generate entries for last 30 days
- **Entry distribution**: Use Math.random() to get values between 500-200
- **Use existing DB functions**: `addEntry` for creating, existing delete mechanism for clearing

## Implementation Units

- [ ] **Unit 1: Add test data generation function**

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Approach:**
- Create `generateTestData()` async function
- Loop 30 times from -29 to 0 days ago
- For each day, generate 1-5 entries totaling random(500-200)
- Use `addEntry` with appropriate dates (need to modify addEntry or create entries directly)
- Show loading indicator during generation

**Note:** The current `addEntry` uses current date. Need to either:
- Option A: Modify `addEntry` to accept optional date
- Option B: Call DB directly with specific dates

Option B is cleaner - create entries directly with correct dates.

**Test scenarios:**
- Happy path: Generate data, entries appear in history across 30 days
- Edge case: Generate twice - should create duplicate data (user's choice to clear first)

- [ ] **Unit 2: Add clear test data function**

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Approach:**
- Call existing delete functions or add bulk delete
- Need to check existing DB for delete mechanism

**Test scenarios:**
- Happy path: Clear data, history is empty

- [ ] **Unit 3: Add UI buttons (dev only)**

**Files:**
- Modify: `app/(tabs)/settings.tsx`
- Add: `app/(tabs)/_layout.tsx` if needed for entry refresh

**Approach:**
- Add section at bottom of settings screen
- Wrap with `if (__DEV__)` conditional
- "Generate Test Data" button - shows loading, disables during generation
- "Clear Test Data" button - shows confirmation alert first
- After operations, refresh entries context

**Patterns to follow:**
- Match existing button styles in settings
- Use Alert for confirmation on clear
- Use loading state during generation

**Test scenarios:**
- Edge case: Buttons don't appear in production build (verify by building release)
- Happy path: Both buttons work correctly in dev

## Files to Modify

- `app/(tabs)/settings.tsx` - Add buttons and functions
- `lib/db.native.ts` / `lib/db.web.ts` - May need bulk delete function

## Verification

1. Open Settings in dev build - see test data buttons at bottom
2. Open Settings in release build - buttons not visible
3. Tap "Generate Test Data" - see loading, then success
4. Go to History - see 30 days of data
5. Go to Today - see today's entries
6. Tap "Clear Test Data" - confirm alert
7. Confirm - history is empty