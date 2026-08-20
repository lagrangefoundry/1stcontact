---
uid: acceptance_criterion-33ecc306
id: AC-686
type: acceptance_criterion
title: Out-of-range, oversize, and freeform documents are rejected by the envelope
created_by: xgd
created_at: '2026-07-22T19:32:24.574998+00:00'
updated_at: '2026-08-20T08:42:15.526681+00:00'
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

**The rejection is guaranteed for an authored document, not only for one
produced by the fold.** The envelope is not a stage of the reproduction
pipeline: it runs wherever a site definition is validated, so a page whose L1
body a person or an AI free-typed into a definition file is held to exactly the
bounds above, on the same path that renders, publishes, edits and imports a
site. A document that clears only the *shape* check — typed axes, closed enums,
no unknown keys — is not accepted; the numeric bounds, the URL-scheme
allowlist, the node-count cap, geometry-track well-formedness and the unique-id
rule apply to it identically. **The site-definition entry point itself is owned
and pinned by AC-849/AC-850** (the authoring-envelope criteria), which drive
`validateSite` over authored pages; this criterion pins the rejection rules
themselves, at the validator.

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
transform, background image, or font face is rejected exactly as one that leaves
it through a scalar axis.

## Verification
Submit documents each violating one envelope rule above and observe the
validator returns a "not ok" result (rejection) for each; submit the equivalent
in-range document and observe acceptance, confirming the boundary is the range
and not the property. For the rename case, submit the same slot twice — once
keyed `behavior` and once keyed `capability` — and observe acceptance of the
former and rejection of the latter. Do **not** re-run a representative violation
through a site definition here: that path is verified by AC-849/AC-850, whose
UATs drive `validateSite` over authored pages, and repeating it would duplicate
their evidence rather than add any.
