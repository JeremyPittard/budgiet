---
title: QuickAddForm shake animation too aggressive
date: 2026-04-26
category: ui-bugs
component: quickaddform
module: budget-tracker
problem_type: ui_bug
symptoms:
  - Input shakes with 10px amplitude after 3 failed attempts
  - Animation feels jarring and unprofessional
root_cause: Animation amplitude set to 10px with 50ms duration per movement
resolution_type: code_fix
severity: low
tags:
  - animation
  - quickaddform
  - react-native
  - ux
---

## Problem

QuickAddForm shake animation after 3 failed +Add clicks was too aggressive with 10px horizontal displacement per shake frame, feel jarring to users.

## Symptoms

- Input field shakes violently when user clicks +Add 3+ times with invalid amount
- Animation draws too much attention making it feel like a bug rather than feedback

## Solution

Reduced animation amplitude from 10px to 2px and increased duration slightly:

```typescript
// Before (too aggressive)
const shake = useCallback(() => {
  Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]).start();
}, [shakeAnim]);

// After (subtle)
const shake = useCallback(() => {
  Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 2, duration: 30, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -2, duration: 30, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 2, duration: 30, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -2, duration: 30, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
  ]).start();
}, [shakeAnim]);
```

## Why This Works

- 2px is enough movement to catch peripheral attention without being jarring
- 30ms duration feels snappy but not frantic
- Uses `useNativeDriver: true` for smooth performance

## Prevention

When implementing feedback animations for errors:
1. Start with smaller amplitude values (1-3px)
2. Test on actual device - simulator doesn't convey the same tactile feel
3. Consider that error states already have visual indicators (red border, error text) - animation should be subtle supplementary feedback