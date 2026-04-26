# Bump Version

Bump the app version and update changelog. Use when the user says "bump version", "release", "new version", or similar.

This skill:
1. Asks user whether it's major, minor, or patch
2. Updates version in `app.json`
3. Adds entry to `CHANGELOG.md`

## Workflow

1. Ask user: major, minor, or patch?
2. Read current `app.json` to get version
3. Increment version appropriately:
   - **major** (x.0.0): breaking changes
   - **minor** (x.y.0): new features
   - **patch** (x.y.z): bug fixes
4. Read current `CHANGELOG.md`
5. Update `app.json` version
6. Prepend new changelog entry with today's date

Use today's date: 2026-04-26