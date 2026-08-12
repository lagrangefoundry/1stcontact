---
uid: acceptance_criterion-0e2f38fa
id: AC-1130
type: acceptance_criterion
title: A picture's colour is adjusted through bounded percentage controls over the
  form the definition holds, and a control returned to its identity leaves the definition
  exactly as it found it, container and all
created_by: xgd
created_at: '2026-08-12T21:29:03.861779+00:00'
updated_at: '2026-08-12T21:29:03.861779+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A picture's colour is adjusted through **bounded percentage controls** — how
bright, how contrasty, how saturated, how black-and-white, how far its hue is
shifted and how far it is blurred — while the region stores the adjustment in the
form a browser reports it in. The control and the stored parameter therefore
carry different names and different numbers on purpose: "saturation 40%" is what
an operator means, and the fraction is what the definition holds, so a page
folded from a capture and a page adjusted by hand express the same adjustment the
same way.

**A control at its identity leaves the definition exactly as it found it.** The
identity is not the same number for every control — unchanged for the scaling
adjustments, none-at-all for the rest — so each is judged against its own. Saving
a control at its identity removes that adjustment from the region, and removing
the last one removes the group holding them, leaving no empty container behind.

Selecting several adjustments in one form produces one change to the site, not
one per adjustment.

## Verification

Save several colour adjustments on an image region in a single change map and
assert the save succeeds and the stored region carries each adjustment in the
browser's own form, converted from the percentages that were submitted. Assert
the rendered page carries the adjustment. Save each of those controls back to its
own identity and assert the region carries no colour adjustment at all and no
empty group in its place. Assert that a control left at its identity throughout
is never written.
