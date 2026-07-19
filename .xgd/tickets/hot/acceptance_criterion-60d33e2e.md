---
uid: acceptance_criterion-60d33e2e
id: AC-629
type: acceptance_criterion
title: Rendered-text-extent delta surfaces when computed font values match
created_by: xgd
created_at: '2026-07-19T02:17:55.085255+00:00'
updated_at: '2026-07-19T02:25:29.521600+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
When two paired text runs have identical computed font values (size, weight, family, letter-spacing) but their captured rendered glyph extents differ by more than the ratio tolerance (default 1.2% of the extent), `values-diff` reports a rendered-text-extent delta for that run — and does NOT report a computed font-size delta (that value genuinely matches).

## Verification
Diff a reference and a reproduction whose paired run has equal computed font size/weight/family but a glyph extent ~7% wider on the reproduction side. Assert the output contains a rendered-text-extent delta for that run's text, and contains no computed font-size delta for it.