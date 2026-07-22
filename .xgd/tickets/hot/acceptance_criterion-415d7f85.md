---
uid: acceptance_criterion-415d7f85
id: AC-707
type: acceptance_criterion
title: Content-robustness probe asserts the envelope holds under perturbed (grown)
  content
created_by: xgd
created_at: '2026-07-22T20:07:13.870340+00:00'
updated_at: '2026-07-22T20:14:30.376537+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
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

## Verification
Run the probe at 2.5× on a folded fixture of pinned sibling text runs and assert
pass = false with at least one overlap finding. Run it on the equivalent flow-structured
document and assert pass = true with empty findings.