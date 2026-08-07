---
uid: acceptance_criterion-b211815a
id: AC-872
type: acceptance_criterion
title: The scaffolded width ladder is the capture ladder itself, so an authored document
  and a reproduced one vary at identical widths
created_by: xgd
created_at: '2026-08-06T03:42:54.795672+00:00'
updated_at: '2026-08-07T18:44:41.120798+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The list of viewport widths a newly created site's layout document declares is
exactly the ladder of widths a capture records a reference site at, in the same
order — derived from that ladder rather than restated, so the two cannot drift
apart. An authored document and a reproduced one therefore keyframe at the same
widths by construction.

## Verification
Create a site and compare the widths declared by its layout document against the
widths of the capture viewport ladder: assert element-wise equality, including
order and length. Assert the same of the published starting-ladder value the
scaffold exposes, so a change to the capture ladder is observable in a created
site without editing the scaffold.