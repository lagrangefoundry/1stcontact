---
uid: acceptance_criterion-d452a281
id: AC-561
type: acceptance_criterion
title: Hero heading and header wordmark expose a token-backed tracking dial
created_by: xgd
created_at: '2026-07-10T00:52:02.192502+00:00'
updated_at: '2026-07-10T00:52:02.192502+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `hero` module (its heading) and the `header` module (its text wordmark) each expose a `tracking` dial drawn from a finite enumeration (`normal` | `tight` | `tighter`, default `normal`) that applies token-backed letter-spacing to the display type. `normal` emits no letter-spacing override, so a heading/wordmark that omits the dial (or sets `normal`) is left untracked and unchanged — a display wordmark keeps the tracking of its own font rules. `tight` and `tighter` emit `letter-spacing: var(--tracking-tight)` / `letter-spacing: var(--tracking-tighter)` respectively, so the value is always a typography token, never a raw em value in the site definition. On the header the dial applies only to a text wordmark, not an image logo, and its override wins over the display face's built-in tracking. The module contract advertises `tracking` with its finite value set.

## Verification
Render a hero heading and a header text wordmark at each `tracking` value and assert: `tight`/`tighter` carry a hook that resolves to `letter-spacing: var(--tracking-tight)` / `var(--tracking-tighter)`; `normal` (and the omitted-dial default) emits no letter-spacing override, leaving the type untracked. Assert the header dial is inert on an image logo, and that the module contract lists `tracking` with values `normal`/`tight`/`tighter`.
