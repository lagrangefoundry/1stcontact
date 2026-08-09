---
uid: acceptance_criterion-7785b92a
id: AC-689
type: acceptance_criterion
title: Capture emits one validated full-language L1 reproduction document spanning
  the sampled width ladder
created_by: xgd
created_at: '2026-07-22T19:42:22.229224+00:00'
updated_at: '2026-08-09T08:20:17.169408+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
Capturing a page produces, in the capture bundle, a single L1 reproduction
document artifact that passes L1 envelope validation, whose declared widths equal
the sampled capture ladder (the fixed set of sampled viewport widths), and whose
root is a container node. The document is emitted in the **full** L1 language, not
text alone: it may carry text leaves, image leaves, box leaves and backing-surface
leaves, and — where the capture supports it — a document background band and a
document font resource table. If no resting sample can be folded, the fold fails
explicitly rather than emitting an empty/invalid document.

## Verification
Capture a fixture site; assert the L1 document artifact exists in the bundle,
validates against the L1 envelope, its `widths` equal the sampled ladder, and its
root is a container. Fold a capture containing runs, media and painted panels and
assert the document contains leaves of more than one kind. Assert an empty ladder
yields an explicit fold error.