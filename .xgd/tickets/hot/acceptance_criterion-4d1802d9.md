---
uid: acceptance_criterion-4d1802d9
id: AC-1345
type: acceptance_criterion
title: A section folds a background box when it paints an image or a scrim, each axis
  read from the widest width carrying it
created_by: xgd
created_at: '2026-08-20T12:47:43.235410+00:00'
updated_at: '2026-08-20T12:47:43.235410+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
A section folds a background box when it paints a background **image** *or* a
translucent **scrim** — a colour carrying its own alpha, layered above the background
image within that one box. The scrim is not a node of its own: it rides on the same
section-background box as the image, because the renderer already layers the two in one
box, so a hero veil over a photograph survives the fold instead of the picture
reproducing unveiled at full brightness.

Because the fold condition is image-**or**-scrim rather than image-only:

- a section painting only a scrim over a solid band — no image at all — still folds, and
  the veil is carried just as faithfully as one over a photograph;
- a section painting only an image folds exactly as before, with no scrim axis emitted;
- a section painting neither folds no background box.

**Each of the two axes is read from the widest width that carries *it***, rather than
both being read off one widest sample. A section may paint an image at some widths and
only a scrim at others; taking both from a single widest entry drops whichever axis that
entry happens to lack.

The box's geometry pins all four sides at every width the section is present at, matched
across the ladder by the section's ordinal index.

## Verification
Fold a multi-width capture whose hero section paints a background photograph under a
translucent scrim, and assert the emitted section-background box carries **both** the
image handle and the scrim's colour and alpha; render and assert the veil paints over the
photograph rather than the photograph paining at full brightness.

Fold a capture whose section paints a scrim over a solid fill with **no** background
image and assert a section-background box is still emitted carrying the scrim — the
image-or-scrim condition — and that a section painting neither emits none.

Per-axis widest read: fold a capture whose section carries the image only at the widest
rung and the scrim only at a narrower one, and assert the single folded box carries both
axes — reading both off one widest entry would drop the scrim.
