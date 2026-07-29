---
uid: acceptance_criterion-415d7f85
id: AC-707
type: acceptance_criterion
title: Content-robustness probe asserts the envelope holds under perturbed (grown)
  content
created_by: xgd
created_at: '2026-07-22T20:07:13.870340+00:00'
updated_at: '2026-07-29T04:19:18.897508+00:00'
completed_at: null
last_field_updated: body
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
- Findings are reported per captured width.
- The probe measures the **structure-recovered overlay**, not the absolute base. On a
  real multi-region page the envelope holds at every captured width once recovery is
  region-aware and flows all of a recovering node's children; promoting a single flat
  pile — which keeps one shared gap and leaves non-promoted siblings pinned — is not
  sufficient to satisfy this criterion.

## Verification
Run the probe at 2.5× on a folded fixture of pinned sibling text runs and assert
pass = false with at least one overlap finding. Run it on the equivalent flow-structured
document and assert pass = true with empty findings.

Run the probe on the recovered overlay of a retained real multi-region capture and
assert pass = true with empty findings at every captured width.
