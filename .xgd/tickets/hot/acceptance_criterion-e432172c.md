---
uid: acceptance_criterion-e432172c
id: AC-2530
type: acceptance_criterion
title: A laddered <img> carries width and height from the picture's measured intrinsic
  dimensions
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:33:03.562320+00:00'
updated_at: '2026-11-09T17:43:14.303779+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
When the delivery manifest has an entry for an image leaf's site asset, the
emitted `<img>` carries `width` and `height` attributes equal to the source's
measured intrinsic pixel dimensions in that entry. This lets the browser reserve
the box's aspect ratio before the picture loads, so content below it does not
shift.

The attributes follow the manifest entry, not the `srcset`. They are present
even when no `srcset` survives. They are absent when there is no manifest or no
entry for the picture, which keeps draft and edit output byte-identical. They
are also absent when either recorded dimension is non-finite or not positive.

The attributes are hints only: the node's width and height rules stay
stylesheet rules and still govern the rendered box.

## Verification
Render an image leaf with a manifest entry recording a width and height. Assert
that the `<img>` carries exactly those values as `width` and `height`. Render
without a manifest and assert that neither attribute is present. Render with an
entry whose height is 0 and assert that neither attribute is present.