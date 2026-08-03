---
uid: acceptance_criterion-33ecc306
id: AC-686
type: acceptance_criterion
title: Out-of-range, oversize, and freeform documents are rejected by the envelope
created_by: xgd
created_at: '2026-07-22T19:32:24.574998+00:00'
updated_at: '2026-08-03T01:32:13.371209+00:00'
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
outside 1–1000, geometry coordinate/extent outside ±100000, per-side padding
negative or above 10000, non-finite numbers); a non-hex colour; an image source
whose scheme is not http(s) or relative; an object carrying an unknown/extra key
(a freeform CSS/HTML/JS escape hatch such as `style`); a geometry keyframe whose
width is not one of the document's declared widths, or keyframes not strictly
ascending; a viewport ladder not strictly ascending; a tree deeper than the depth
cap (32); and a document whose node count exceeds the cap (2000).

The same discipline governs the per-width and viewport-relative families, so a
responsive document cannot smuggle a value past the envelope that a static one
could not:
- a **scalar track** (a type axis or a padding side) is rejected when a keyframe
  sits at a width the document does not declare, when its keyframes are not
  strictly ascending, when a keyframe value leaves its own axis's range, or when
  its per-segment flags are not exactly one shorter than its keyframes;
- a **viewport-height response** is rejected unless every keyframe of that node
  carries the viewport height it was captured at — applying a response with no
  origin to measure from would silently treat the origin as zero and turn a
  full-viewport height into height-plus-a-viewport;
- a **column anchor** is rejected when the document declares no column (a
  dangling reference fails loudly rather than falling back to geometry that
  merely looks plausible), when it governs neither `x` nor `width`, and when its
  constant or cap leaves the geometry range or its column fraction leaves ±10.

The unknown-key rule admits no grandfathered exceptions, including for renamed
fields. A `slot` leaf authored with the pre-REQ-87 `capability` key instead of
`behavior` is rejected as an unknown key — the rename is atomic, not a
tolerated alias, so a stale document fails loudly at the envelope rather than
silently dropping its module id. (Absorbs FC test
`test_UAT_FC_REQ-87_discriminant_atomic_l1_slot_seam_renamed_in_site_schema`.)

The same envelope discipline — typed values, bounded numbers, hex-only colours,
an allowlisted URL scheme, and no unknown keys — governs the document's
structured effect axes and its document-level resource table without exception;
those two surfaces carry their own bounds and are pinned separately (see the
criteria covering structured-axis rejection and font-resource rejection), so a
value that leaves the envelope through a gradient, shadow, border, mask,
transform, background image, chip surface, or font face is rejected exactly as
one that leaves it through a scalar axis.

## Verification
Submit documents each violating one envelope rule above and observe the
validator returns a "not ok" result (rejection) for each; submit the equivalent
in-range document and observe acceptance, confirming the boundary is the range
and not the property. For the responsive families, submit a track keyframe at an
off-ladder width and one whose value is out of range, a height response on
keyframes lacking a captured height, and an anchor on a document with no column —
and observe rejection of each with the offending path named. For the rename case,
submit the same slot twice — once keyed `behavior` and once keyed `capability` —
and observe acceptance of the former and rejection of the latter.
