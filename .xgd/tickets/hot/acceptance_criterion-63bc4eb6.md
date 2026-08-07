---
uid: acceptance_criterion-63bc4eb6
id: AC-817
type: acceptance_criterion
title: A painted background image is compared by mirrored basename, so a correct reproduction
  raises no delta
created_by: xgd
created_at: '2026-08-06T01:46:13.532357+00:00'
updated_at: '2026-08-07T23:11:22.155620+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
`values-diff` compares the background image an element paints as its own delta axis,
matched by **mirrored basename** rather than by the URL verbatim.

The two sides legitimately name the same bytes differently: the reference carries the
captured origin URL and the reproduction the site-local mirror. Comparing the strings
would raise a delta on every correctly reproduced image, so a correctly reproduced
image raises none. A missing image — the case where a photography-led page reproduces
as flat colour while every other value axis stays green — and a wrong one each raise a
delta naming the two basenames, with an absent handle reported as such on either side.

## Verification
Diff a reproduction whose background images are correct site-local mirrors of the
reference's origin URLs and assert no background-image delta. Diff one with an image
missing, and one carrying a different asset, and assert a delta in each case naming
the reference's basename against ours.