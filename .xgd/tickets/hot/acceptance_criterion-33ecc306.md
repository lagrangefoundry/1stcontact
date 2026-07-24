---
uid: acceptance_criterion-33ecc306
id: AC-686
type: acceptance_criterion
title: Out-of-range, oversize, and freeform documents are rejected by the envelope
created_by: xgd
created_at: '2026-07-22T19:32:24.574998+00:00'
updated_at: '2026-07-24T22:54:51.095645+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
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

The unknown-key rule admits no grandfathered exceptions, including for renamed
fields. A `slot` leaf authored with the pre-REQ-87 `capability` key instead of
`behavior` is rejected as an unknown key — the rename is atomic, not a
tolerated alias, so a stale document fails loudly at the envelope rather than
silently dropping its module id. (Absorbs FC test
`test_UAT_FC_REQ-87_discriminant_atomic_l1_slot_seam_renamed_in_site_schema`.)

## Verification
Submit documents each violating one envelope rule above and observe the
validator returns a "not ok" result (rejection) for each; submit the equivalent
in-range document and observe acceptance, confirming the boundary is the range
and not the property. For the rename case, submit the same slot twice — once
keyed `behavior` and once keyed `capability` — and observe acceptance of the
former and rejection of the latter.
