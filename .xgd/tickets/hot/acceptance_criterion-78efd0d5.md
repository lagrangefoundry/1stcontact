---
uid: acceptance_criterion-78efd0d5
id: AC-1344
type: acceptance_criterion
title: 'Conformance is exercised in both shipping shapes: standalone, and mounted
  into an L1 seam through the same validated binding a real page uses'
created_by: xgd
created_at: '2026-08-20T08:04:16.402860+00:00'
updated_at: '2026-08-20T08:04:16.402860+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion

A behavior module ships in **two shapes** — standalone, as a bare module stack, and
**mounted into an L1 seam** — and its conformance obligations are exercised in
both. The conformance harness therefore carries a second fixture mode
(`mountInL1`) that, instead of building the fixture page as a bare module stack,
gives it an L1 host document and binds the instance to a seam in that document by
name, through the **same validated binding a real page uses** (the page composition
rule, AC-1343). The universal ACs — safety, security, cross-browser, responsive —
then run against the mounted shape.

The second mode exists because a behaviour that conforms standalone but not once
mounted, or the reverse, is a real defect that nothing else in the matrix would
catch: the declared dimension set (AC-704) says *which* obligations are checked,
not *in how many shapes*.

The host document is constructed so that a failure under this mode is
**attributable to the behaviour rather than to the wrapper**: it carries a geometry
keyframe at every probed width, so the seam spans exactly the viewport at each
probe and the host can never be the thing that overflows. An overflow observed
under this mode is the behaviour's own.

## Verification

Run the conformance harness over a catalog behaviour twice — once in the default
standalone shape and once with the fixture's `mountInL1` mode set — and confirm:

- both runs exercise the same universal AC set, and both report a per-dimension
  outcome;
- the mounted run's page is a real L1 host document with the instance bound to a
  named seam in it, resolved through the same binding validation a real page goes
  through (an unresolvable binding fails the fixture rather than falling back to
  the standalone shape);
- the host's seam spans the viewport at every probed width, so a responsive
  observation under this mode reflects the behaviour's own layout.

Confirm a behaviour that conforms standalone is still reported as failing when it
breaks only under the mounted shape.
