---
uid: acceptance_criterion-415d7f85
id: AC-707
type: acceptance_criterion
title: Content-robustness probe asserts the envelope holds under perturbed (grown)
  content
created_by: xgd
created_at: '2026-07-22T20:07:13.870340+00:00'
updated_at: '2026-08-07T23:54:09.205995+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The content-robustness probe grows every text run's effective length and every pinned
box/image height by a scale factor (default 2.5×), evaluates the document at each
captured width, and reports pass = true with empty findings exactly when the perturbed
layout produces no sibling overlap and no clip.

- A purely-pinned region whose grown content overruns a fixed-position sibling produces
  an overlap finding and pass = false.
- A region whose interior flows (siblings reflow to absorb the extra content) keeps the
  envelope and reports pass = true.
- Findings are reported per captured width, so the report names the widths at which the
  perturbed layout degrades.
- The probe measures the **structure-recovered overlay**, not the absolute base. On a
  multi-region page — several independently-colliding bands separated by roomy space —
  the envelope holds at every captured width once recovery is region-aware and flows all
  of a recovering node's children; promoting a single flat pile — which keeps one shared
  gap and leaves non-promoted siblings pinned — is not sufficient to satisfy this
  criterion.

## Verification
Run the probe at 2.5× on a folded fixture of pinned sibling text runs and assert
pass = false with at least one overlap finding. Run it on the equivalent flow-structured
document and assert pass = true with empty findings.

Multi-region: run the probe on a fold whose page carries several independently-colliding
bands, and assert the pinned base reports overlap findings spanning more than one band
at the widths where the grown content collides. Run it on the recovered overlay of that
same fold (recovery promoting more than one region) and assert pass = true with empty
findings at every captured width.