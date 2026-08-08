---
uid: acceptance_criterion-cca2719d
id: AC-850
type: acceptance_criterion
title: An out-of-range axis, an unsafe image source, an over-cap tree and a duplicate
  node id are each rejected at authoring time
created_by: xgd
created_at: '2026-08-06T03:03:19.938860+00:00'
updated_at: '2026-08-08T00:43:37.439730+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Four classes of defect that a hand-authored page can carry are each refused when
the definition is validated, before anything is emitted:

- **an out-of-range numeric axis** — a font size, a font weight or a geometry
  value past its declared bound;
- **an unsafe image source** — a source whose scheme is outside the allowlist;
- **an over-cap tree** — a document whose node count exceeds the cap that keeps a
  malformed definition from hanging a browser;
- **a duplicate node id** — two nodes claiming the same DOM id, which breaks
  same-page anchor navigation (the browser takes the first) and the
  label↔control association a mounted behavior module depends on.

Each is reported against the offending node in the offending page, and each is
refused on the same single validation every consuming operation performs, so an
author meets the same answer whether they render, publish, edit or import.

## Verification
For each of the four classes, submit a site definition whose page's L1 body
carries exactly that defect and observe validation fails with an error naming
that node's field — the out-of-range axis at its axis path, the unsafe source at
its source path with an "not an allowed URL" message, the over-cap tree at the
document root with a cap message, and the duplicate id at the second node's id
path naming the repeated value. Observe the corrected definition validates in
each case.