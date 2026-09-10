---
uid: acceptance_criterion-3bce83ba
id: AC-1628
type: acceptance_criterion
title: A retained bundle materializes as a servable site whose home page is its folded
  L1 document, with assets localized
created_by: martin-github@westhead.me
created_at: '2026-09-10T14:10:03.154460+00:00'
updated_at: '2026-09-10T15:36:54.460735+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A retained capture bundle can be materialized as a servable 1c site whose home page
**is** the bundle's folded L1 document, so the existing render / serve / shot / diff /
values-diff loop operates on the reproduction unchanged.

- The import copies the folded document verbatim — it adds and subtracts nothing on
  the reproduction values — and mirrors the bundle's assets into the site draft.
- It is **idempotent**: re-running over the same bundle wipes and rebuilds the draft,
  leaving the same result rather than accumulating.
- Every media handle in the document is **rebound from the captured origin to the
  bundle's own mirror before the document is written**. A referenced handle with no
  mirrored asset **fails the import outright** with a re-capture instruction: a
  reproduction that hotlinks the origin would render only while that host is up and
  would blind the perceptual gate to image regressions.
- Mirrored assets (image or font) that the folded document references nowhere are
  **reported** as a fold gap to close, not silently ignored.
- A bundle with no folded document, or one whose L1 seams and behaviour bindings
  disagree, is rejected with a re-capture instruction rather than imported into a
  reproduction that would render its behaviours as inert placeholders.

## Verification
Materialize a fixture bundle. Assert the resulting site draft exists, its home page
carries the bundle's L1 document with the same node count, and the reported localized
handle count equals the number of media handles rewritten to the mirror; assert no
handle in the written document still names the captured origin. Run the import a
second time over the same bundle and assert the draft is identical (idempotence).
Materialize a bundle whose document references a handle with no mirrored asset and
assert the import throws, naming the unmirrored handle. Materialize a bundle carrying
a mirrored asset no leaf references and assert it is reported in the unreferenced set
while the import still succeeds. Assert a bundle with no folded document, and one
whose slot names and behaviour bindings disagree, are each rejected with an error
naming the fix.