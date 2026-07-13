---
uid: acceptance_criterion-91ea8dc1
id: AC-596
type: acceptance_criterion
title: Mixed positioned and flowed hero objects split per object
created_by: xgd
created_at: '2026-07-13T20:23:17.821682+00:00'
updated_at: '2026-07-13T20:23:17.821682+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d70a0264
  kind: behavior
  regression_only: false
---

## Criterion
Within a single hero, positioning is decided per object: objects that carry a
position are lifted onto the full-band absolute canvas while objects that do not
remain in the normal content flow. The two sets render independently in the same
hero — one positioned object does not force the others out of flow.

## Verification
Render a hero where the heading carries a position but the eyebrow does not.
Confirm the eyebrow renders in normal flow (no positioned placement) while the
heading renders on the full-band absolute canvas.
