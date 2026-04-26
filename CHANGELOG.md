# Changelog

## [1.2.0] - 2026-04-26

### Added
- Week period view (Today, Week, Fortnight, Month, Year)
- Deficit carryover with 3-day limit
- Carryover toggle in settings

### Fixed
- Period views now show correct entries (was showing $0)
- QuickAddForm now updates totals in real-time after adding entries (was requiring tab switch)
- Removed duplicate styles in QuickAddForm component

## [1.1.0] - 2026-04-26

### Added
- Period views with segmented control (Today, Fortnight, Month, Year)
- Period-specific budget targets (daily × period days)
- Hard cap setting with visual reference on BudgetRing
- Day start hour setting (configurable day boundary)
- Note field for expenses (required when over budget)
- Progress ring coloring: green (0-80%), yellow (80-100%), red (100%+)

### Changed
- Renamed useDailySummary to usePeriodSummary for period-based calculations
- BudgetRing shows "left" / "over" instead of "remaining" / "over budget"
- Settings UI redesign with inline save buttons

## [1.0.0] - 2026-04-26

### Added
- Initial release of TrackBud budget tracker app
- Today screen with budget target and spending tracking
- History screen with expense entries
- Settings screen with budget configuration
- Dark theme by default
- Swipe-to-delete functionality