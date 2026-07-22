---
uid: request-cf8aa307
id: REQ-67
type: request
title: contact-form field styling dials (border colour, radius, submit padding)
created_by: xgd
created_at: '2026-07-18T15:10:51.316275+00:00'
updated_at: '2026-07-19T01:04:55.682661+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: c30ba6fd7629a5de8ae66c45239f01ebcf49ba15
    reconcile_sha: null
    main_sha: null
  version: 0.0.143
---

## Goal

Add contact-form **field styling dials** so the field border colour, control corner
radius, and submit-button horizontal padding are authorable (absolute-or-overlay),
instead of hard-wired to theme tokens.

## Why

The gigabytealchemy reproduction surfaced these as Type-A gaps ([[REQ-64]] repair
order): the reference's inputs have a `#000000` 1px border and `8px` radius, and its
submit buttons `32px` horizontal padding — none of which the module can express. The
field border/radius are hard-wired to `var(--color-border)` / `var(--radius-md)`
(shared theme tokens, so a theme change would perturb every other module), and the
submit padding to `var(--space-6)`. This closes ~12 Type-A deltas by generalizing the
module (a dial, not a new module — CLAUDE.md).

## Scope

- `fieldBorderColor` — absolute `#hex` OR palette role (via `resolveColor`), painting
  the input/textarea border. Default: `var(--color-border)`.
- `fieldRadius` — the form control corner radius (inputs AND submit), a named radius
  token OR an absolute length (via `resolveStep`). Default: `var(--radius-md)`.
- `submitPaddingX` — submit-button horizontal padding, a space token OR absolute
  length. Default: `var(--space-6)`.

Each emits an inline `--fc-*` var consumed by the scoped CSS with the current token as
the fallback, so an omitted dial is byte-identical to today.