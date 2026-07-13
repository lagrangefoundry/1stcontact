---
uid: acceptance_criterion-4be9f4f0
id: AC-619
type: acceptance_criterion
title: Per-run style overrides are expressed via the attribute-span notation and inherit
  the rest from baseline
created_by: xgd
created_at: '2026-07-13T21:00:33.466241+00:00'
updated_at: '2026-07-13T21:00:33.466241+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
An inline span authored as `[text]{field=value …}` produces a run whose text is the bracketed content and whose style overrides are exactly the listed fields, with every unlisted axis inherited from the block baseline. The overridable run axes are font family, font size, font weight, colour, letter-spacing, line-height, and left padding, plus a link target (`href`) and emphasis. Example: `[x]{fontSizePx=18 color=#314158}` yields a run with those two overrides and no others.

## Verification
Parse an attribute-span with a subset of override keys and assert the resulting run carries exactly those axes as overrides and no others; confirm a run with no span carries only its text (all axes inherited).
