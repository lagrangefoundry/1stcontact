---
uid: acceptance_criterion-fc6690e2
id: AC-1826
type: acceptance_criterion
title: A cloud-captured and a locally captured bundle of the same URL are equivalent
  member-for-member and schema-for-schema, with screenshots compared as images
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:18.676481+00:00'
updated_at: '2026-09-19T13:37:18.676481+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

A bundle captured in the cloud and one captured on the operator's machine, for
the same URL, are equivalent — stated precisely, because they are deliberately
not byte-equal:

- **Same name.** The same URL names the same bundle wherever it was captured.
- **Same member set.** The two bundles list exactly the same member keys,
  including the per-width ladder screenshots.
- **Same derived artifacts.** The folded L1 document, the recovered form model,
  the structural hints and the multi-viewport oracle are **equal outright**, as
  they are a pure function of what was observed and of the current fold.
- **Same capture record but for its capture time.** Every field of the capture
  record is equal except the recorded capture moment, which is present and is
  expected to differ.
- **Screenshots are compared as images, not as bytes.** A bundle promises a
  screenshot at each ladder width, not identical bytes: the two runtimes' browsers
  encode differently, so no screenshot is asserted byte-wise. Geometry equivalence
  is the existing gate's tolerance applied to the multi-viewport oracle, which is
  the artifact asserted equal above.

## Verification

Capture the same URL twice through the production capture path with the same
deterministic browser on the far side — once into the deployment's object storage
and once into a backing both runtimes can hold — and assert: the names match;
the member key listings are equal; the four derived artifacts are equal; the
capture records are equal with the capture moment blanked, and that moment is
present on both. Assert a full-page screenshot is a well-formed image rather than
asserting its bytes. Equivalence with the operator's own tree is carried across
the runtime boundary by the shared backing, which the local suite asserts
equivalent to the filesystem one.
