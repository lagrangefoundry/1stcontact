---
uid: acceptance_criterion-582e0d5e
id: AC-632
type: acceptance_criterion
title: Box-border delta surfaces a differing uniform box border; matching or absent
  borders produce none
created_by: xgd
created_at: '2026-07-19T02:18:19.150996+00:00'
updated_at: '2026-07-19T02:25:29.233392+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
`values-diff` captures each element's uniform box border (its width and colour, distinct from an asymmetric accent bar) and compares it as a medium-severity delta. When a paired element's box border differs in width or colour (e.g. a dark `#334155` outline vs a pale `#cbbfad` one at the same width), a box-border delta is reported. When both sides have matching box borders, or neither side paints a box border, no box-border delta is reported.

## Verification
Diff three paired-element cases: (1) same border width but different colour; (2) identical borders on both sides; (3) no border on either side. Assert a box-border delta only for case 1, and none for cases 2 and 3.