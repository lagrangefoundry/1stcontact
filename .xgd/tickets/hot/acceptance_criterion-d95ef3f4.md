---
uid: acceptance_criterion-d95ef3f4
id: AC-573
type: acceptance_criterion
title: 'Ignore-masks: default-on calendar-year fold (--compare-years opts out) and
  --ignore regex masks with an honest suppressed count; malformed patterns inert'
created_by: xgd
created_at: '2026-07-10T01:47:28.882170+00:00'
updated_at: '2026-07-10T01:47:28.882170+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
Correct-by-design dynamic content can be masked so it never produces a spurious delta. A built-in calendar-year mask is on by default: every 4-digit year (19xx/20xx) is folded in both the pairing key and the verbatim-text comparison, so a run differing *only* by year (`© 2025` vs a dynamic `© 2026`) both still pairs and reads as unchanged, while any other word/casing change on the same run still fires; the `--compare-years` flag opts out to compare years verbatim. In addition, `--ignore <regex,…>` accepts a comma-separated list of regular-expression masks; a delta is suppressed when a pattern matches the element text or either the expected or actual value. Suppression is counted honestly (the report exposes a suppressed count) and happens before ranking, so a masked delta can never rank. A malformed regex is skipped rather than fatal (over-reporting is the safe direction).

## Verification
Diff a footer that differs only by calendar year and assert no delta by default but a text delta with `--compare-years`; pass an `--ignore` pattern matching a known dynamic value and assert the delta is suppressed and reflected in the suppressed count; pass a malformed regex and assert the run does not crash.
