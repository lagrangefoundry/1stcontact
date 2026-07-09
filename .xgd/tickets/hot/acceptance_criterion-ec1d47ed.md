---
uid: acceptance_criterion-ec1d47ed
id: AC-508
type: acceptance_criterion
title: services-grid cards accept structured accent, badge, checklist, and surface
  treatments
created_by: xgd
created_at: '2026-07-09T22:11:02.303789+00:00'
updated_at: '2026-07-09T22:11:02.303789+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
A services-grid card accepts optional structured, token-backed treatment fields, validated against the content contract and rendered as scoped markup: an `accent` (palette-role enum `primary|accent|muted|secondary|neutral-cool`) drawn as a coloured left border keyed to `--color-<role>`; a `badge` object (`{ label (required), variant: neutral|primary|accent|secondary }`) rendered as a soft pill in the card's top-right corner; a `checklist` (list of strings, max 8) rendered as ✓ items; and a `surface` (`default|muted|neutral-cool`) where a non-default value fills the card as a tinted panel. All four are optional — a card declaring none renders exactly as before (no accent border, no badge, no checklist, standard surface).

## Verification
Render a services-grid whose cards set `accent`, `badge`, `checklist`, and a `muted` surface; assert the accent card carries a `border-left-color: var(--color-<role>)`, the badge pill renders with its label and variant class (defaulting to `neutral` when the variant is omitted), the checklist renders one ✓ item per entry, and the muted card carries the panel fill. Render an untreated card and assert none of the treatment markup is present.
