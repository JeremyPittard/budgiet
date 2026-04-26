---
date: 2026-04-26
topic: period-views-carryover-fix
---

# Period Views & Carryover Fix

## Problem Frame

The existing period views (Today, Fortnight, Month, Year) are non-functional - entries show $0 even when data exists. Additionally, users need a "Week" option and want deficit carry-over with a 3-day limit.

## Requirements

**Period Views**
- R1. Add "Week" to period selector (Today, Week, Fortnight, Month, Year order)
- R2. Fix date range calculation so entries actually appear for each period
- R3. Week period = last 7 days from effective today

**Period Date Logic**
- R4. Period queries must use "effective today" based on day start hour (not calendar date)
- R5. Query entries where date >= period_start AND date <= effective_today

**Carryover System**
- R6. When daily spending < daily target, the unused amount can carry to next day
- R7. Track consecutive carryover days - max 3 days in a row allowed
- R8. After 3 consecutive days of carryover, it resets (next deficit day starts fresh)
- R9. Carryover only applies to Today view (not Week/Fortnight/Month/Year)
- R10. Display current carryover amount and days remaining on Today screen

**Settings**
- R11. Allow user to disable carryover feature in settings
- R12. Show current carryover days count in settings

## Success Criteria
- [ ] Switching to Week shows entries from last 7 days
- [ ] Switching to Fortnight shows entries from last 14 days  
- [ ] Switching to Month shows entries from last ~30 days
- [ ] Switching to Year shows entries from last 365/366 days
- [ ] Deficit of $10 one day adds $10 to next day's available budget
- [ ] After 3 days of carryover, new day shows $0 carryover (resets)
- [ ] Feature can be toggled off in settings

## Scope Boundaries
- Carryover is Today-view only
- Period views do not include carryover (pure view of past N days)
- Hard cap and mandatory note features remain separate

## Key Decisions
- Week added as second option (between Today and Fortnight)
- 3-day limit applies to consecutive carryover days, not total
- Carryover resets when user has 3 days where they didn't need to use it

## Dependencies / Assumptions
- Uses existing dayStartHour setting
- Uses existing SettingsContext pattern for carryover enable/disable
- Entries already have date field stored as YYYY-MM-DD

## Outstanding Questions

### Resolve Before Planning
- None - choices made during brainstorm

### Deferred to Planning
- [Technical] How to store carryover state (per-day balance) vs just accumulating deficit?
- [Needs research] Does period query need to sort by created_at descending?

## Next Steps
→ `/ce:plan` for structured implementation planning