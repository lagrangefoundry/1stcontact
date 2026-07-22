---
uid: acceptance_criterion-33ecc306
id: AC-686
type: acceptance_criterion
title: Out-of-range, oversize, and freeform documents are rejected by the envelope
created_by: xgd
created_at: '2026-07-22T19:32:24.574998+00:00'
updated_at: '2026-07-22T19:38:51.284714+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
The validator rejects any document that leaves the safety envelope, including:
a numeric axis outside its declared range (font-size outside 1–400, font-weight
outside 1–1000, geometry coordinate/extent outside ±100000, non-finite
numbers); a non-hex colour; an image source whose scheme is not http(s) or
relative; an object carrying an unknown/extra key (a freeform CSS/HTML/JS escape
hatch such as `style`); a geometry keyframe whose width is not one of the
document's declared widths, or keyframes not strictly ascending; a viewport
ladder not strictly ascending; a tree deeper than the depth cap (32); and a
document whose node count exceeds the cap (2000).

## Verification
Submit documents each violating one envelope rule above and observe the
validator returns a "not ok" result (rejection) for each; submit the equivalent
in-range document and observe acceptance, confirming the boundary is the range
and not the property.