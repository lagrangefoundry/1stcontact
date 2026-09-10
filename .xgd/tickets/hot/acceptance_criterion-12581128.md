---
uid: acceptance_criterion-12581128
id: AC-1631
type: acceptance_criterion
title: The fold derives each text run's nowrap threshold as a width from the ladder's
  single-line suffix
created_by: martin-github@westhead.me
created_at: '2026-09-10T14:40:30.523151+00:00'
updated_at: '2026-09-10T15:36:57.629416+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The fold derives, for each text run, the smallest sampled width at which the
reference set that run on a **single line at that width and at every wider sampled
width**, and carries it on the run's text leaf as its nowrap-from axis. It is a
**width, not a flag**.

- The threshold is the ladder's single-line **suffix**, not the first single-line
  width found. A run that is one line at 1024 but two lines at 1280 carries the
  rung above the wrapping one, never 1024 — responsive type can grow faster than
  its column, and a threshold may never claim more than the reference showed.
- A run's line count is measured from what the capture recorded — its glyph extent
  over its line height. A width whose line count **cannot be measured** (either
  value missing or non-finite) **breaks the suffix** rather than counting as a
  single line: reading "unknown" as "one line" would pin a real paragraph
  unbreakable and overprint whatever the fold placed absolutely below it.
- A run that did not rest on a single line at the widest sampled width carries **no
  axis at all**. The fold emits nothing rather than a guess, and the folded document
  still validates against the L1 envelope with the axis absent.

What the renderer then spends the threshold on above that width is the structured
copy-editing capability's wrapping floor (CAP-70, STORY-83 / AC-1010), not this
criterion; this one pins the fold's side — the derivation and the carrying.

## Verification
Fold a multi-width ladder whose run is single-line at every sampled width and assert
its text leaf carries the nowrap-from axis equal to the **narrowest** sampled width.
Fold a ladder whose run is single-line at the narrowest and the widest widths but
wraps at an intermediate one, and assert the axis equals the sampled width
immediately **above** the wrapping rung rather than the narrowest single-line width.
Fold a ladder whose widest sample has no measurable line count (no recorded line
height, or no glyph extent) and assert no axis is emitted even though narrower
samples read as one line. Fold a ladder whose run wraps at every width and assert
the leaf carries no axis. Assert every folded document above validates against the
L1 envelope.