---
uid: acceptance_criterion-76697419
id: AC-562
type: acceptance_criterion
title: Theme CSS emits the --tracking-* letter-spacing tokens, backfilled for pre-existing
  themes
created_by: xgd
created_at: '2026-07-10T00:52:08.736424+00:00'
updated_at: '2026-07-10T00:52:08.736424+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The generated theme stylesheet emits the letter-spacing (tracking) token group as `--tracking-<step>` custom properties on `:root`, one per step, following the same deterministic per-group naming scheme as the other typography tokens. The default step values are `--tracking-normal: 0em`, `--tracking-tight: -0.025em`, and `--tracking-tighter: -0.05em` (em-based so they scale with the type). Because this token group post-dates earlier themes, a site theme that omits the `tracking` group still validates and still emits the three properties from a schema default — the group is backfilled (not treated as absent), so the token surface always covers `--tracking-*` and the `tracking` dial always resolves to a defined value.

## Verification
Generate theme CSS from a full token set and assert the `:root` block declares `--tracking-normal`, `--tracking-tight`, and `--tracking-tighter` with the default em values. Validate a theme that omits the `tracking` typography group and assert it still validates and the emitted CSS still contains the three `--tracking-*` properties (the default is applied). Assert repeated generation with the same input is identical.
