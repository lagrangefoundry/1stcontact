---
uid: acceptance_criterion-38c65ed5
id: AC-433
type: acceptance_criterion
title: Theme CSS declares a custom property for every token slot with deterministic
  names
created_by: xgd
created_at: '2026-07-08T19:20:05.445622+00:00'
updated_at: '2026-07-08T19:20:05.445622+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Generating theme CSS from a complete set of theme tokens produces a `:root { … }` block containing exactly one CSS custom property per token slot across every token group, using a deterministic, group-specific naming scheme:
- palette roles → `--color-<role>` (kebab-cased, e.g. `--color-bg`, `--color-surface-subtle`, `--color-text`)
- font families → `--font-family-<name>`
- type scale → `--font-size-<step>`
- weights → `--font-weight-<name>`
- line heights → `--line-height-<name>`
- spacing → `--space-<step>`
- radius → `--radius-<name>`
- shadow → `--shadow-<name>`
- container → `--container-<name>`
- breakpoints → `--breakpoint-<name>`

Each property's value equals the corresponding token value. The same input always yields the same output.

## Verification
Call the generator with a full token set and assert the returned string contains a `:root` block with a matching declaration for each slot in every group, at least one representative per naming prefix, and that repeated calls with the same input produce identical output.
