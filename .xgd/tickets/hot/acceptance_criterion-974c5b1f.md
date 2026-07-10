---
uid: acceptance_criterion-974c5b1f
id: AC-563
type: acceptance_criterion
title: Hero exposes a subheadLeading dial setting the subhead line-height independently
created_by: xgd
created_at: '2026-07-10T00:52:13.756821+00:00'
updated_at: '2026-07-10T00:52:13.756821+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `hero` module exposes a `subheadLeading` dial drawn from a finite enumeration (`tight` | `normal` | `relaxed`, default `relaxed`) that sets the subhead's line-height independently of the global relaxed default. Each value maps to a line-height token: `relaxed` → `var(--line-height-relaxed)`, `normal` → `var(--line-height-normal)`, `tight` → `var(--line-height-tight)`. `relaxed` (the default) reproduces the prior fixed subhead leading, so a hero that omits the dial is unchanged; `normal`/`tight` densen the subhead block. The value is always a line-height token, never a raw value in the site definition. The module contract advertises `subheadLeading` with its finite value set.

## Verification
Render heroes exercising each `subheadLeading` value and assert the subhead resolves to `var(--line-height-tight)` / `var(--line-height-normal)` / `var(--line-height-relaxed)` accordingly, and that the omitted-dial default (`relaxed`) reproduces the prior subhead leading. Assert the module contract lists `subheadLeading` with values `tight`/`normal`/`relaxed`.
