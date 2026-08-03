---
uid: acceptance_criterion-6e25c33a
id: AC-770
type: acceptance_criterion
title: A viewport-height response is fitted only from a height probe, as a hero's
  height factor with a matching y factor below it
created_by: xgd
created_at: '2026-08-03T02:08:34.722727+00:00'
updated_at: '2026-08-03T02:23:34.310553+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A block sized to the viewport height (`100vh` / `min-h-screen`) cannot be
identified from a width ladder: the ladder varies width and height together, so a
hero measuring 1024px tall at 768×1024 and 768px tall at 1024×768 is
indistinguishable from one whose height simply falls as the viewport widens. The
fold therefore reads the capture's **height probe** — one ladder width re-shot at a
second viewport height — and fits the response as a finite difference:

- a probe pairs with its ladder projection at the same width, and every element's
  measured change in y and in height over the change in viewport height becomes a
  typed response factor on that node;
- the response is a **derivative**, not a local fact: a viewport-tall hero carries
  a height factor and everything the hero pushes down carries the matching y
  factor, so both say the same thing in the same units;
- a **section band** takes its response from its own section edges, not from the
  runs it contains — a viewport-tall hero's copy sits in the top half and never
  moves while the band's bottom travels a full viewport height — and every sampled
  width must agree, or the band is not describable as one height rule;
- with **no probe in the capture, no response is emitted at all**. The fold never
  infers one from a correlation with width, and a bundle captured before the probe
  existed folds exactly as it did before.

The probe is evidence only: it never becomes a keyframe of its own, so it does not
add a width to the ladder that defines keyframes, screenshots or comparison cells.

## Verification
Fold a capture whose section is viewport-tall and which includes a height probe;
assert the section band carries a height factor of 1 and that nodes positioned below
it carry a y factor of 1, and that each keyframe still evaluates to its captured
pixels at the height it was captured at. Fold the same capture with the probe
removed and assert no height response is emitted anywhere. Assert the probe
contributes no keyframe at its width.