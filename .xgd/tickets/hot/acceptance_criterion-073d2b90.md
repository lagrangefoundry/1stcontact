---
uid: acceptance_criterion-073d2b90
id: AC-1275
type: acceptance_criterion
title: A region carrying an image, an overlay and a fill together keeps both controls
  live and both writes land — a sibling parameter is not occlusion
created_by: xgd
created_at: '2026-08-20T02:57:48.820898+00:00'
updated_at: '2026-08-20T03:25:22.648216+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A region is marked unavailable on the test **"is the write observable and
complete?"** — never on the mere presence of another parameter beside the one the
control writes.

So a panel carrying a background image, a scrim over it and a fill underneath
keeps **both** of its controls live, with no reason attached to either, and a
write to either lands and is painted. A scrim tints the photograph rather than
hiding it, and a translucent layer over a fill shows the fill through it, so both
writes remain observable: a sibling parameter is not occlusion.

The same holds of a panel carrying a gradient over its fill. Locking on the
presence of a sibling would withdraw controls that work, across regions that are
common on real pages — which is the failure this test exists to avoid, and the
mirror image of the failure that unavailability exists to avoid.

## Verification

Seed a band carrying a background image, an overlay and a fill together. Request
its fields and assert both the image picker and the fill are returned, that
neither is marked unavailable and neither carries a reason, and that a new value
written into each lands in the draft and is painted by the re-render. Repeat with
a panel carrying a gradient layer over its fill and assert the fill is likewise
live.