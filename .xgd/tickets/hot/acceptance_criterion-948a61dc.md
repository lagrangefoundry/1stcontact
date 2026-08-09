---
uid: acceptance_criterion-948a61dc
id: AC-851
type: acceptance_criterion
title: Authoring-time validation and the emitter's own neutralisation are independent
  lines of defence, neither standing in for the other
created_by: xgd
created_at: '2026-08-06T03:03:37.804174+00:00'
updated_at: '2026-08-09T05:41:22.891628+00:00'
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
Holding an authored definition to the envelope adds a line of defence; it
replaces none. The two lines are independent and neither is conditioned on the
other:

- **The emitter still neutralises on its own.** A document handed straight to
  the renderer without passing site-definition validation still publishes no
  unsafe URL: an off-allowlist image source emits an empty source and an
  off-allowlist link target emits no link at all. The emitter's inertness
  guarantee is unchanged by the presence of the earlier gate.
- **The earlier gate covers what the emitter cannot.** Defects that no emitter
  can neutralise — a numeric axis outside its range, a node count past the cap, a
  duplicate node id, a geometry track referring to a column the document does not
  declare — have no second line of defence at all: the page renders without
  complaint and the defect surfaces only in the published output. Validation is
  where they are caught, and the same definition that renders is refused.

An unsafe URL therefore raises **both** answers for one definition: validation
names the offending field, and rendering the same definition directly still
publishes nothing unsafe.

## Verification
Render a document carrying an off-allowlist image source and an off-allowlist
link target directly through the renderer with no prior validation, and assert
the published output carries neither the disallowed value nor a live link or
source; assert validating the same document reports both offending fields.
Separately, assert that a document whose only defect is an out-of-range axis, an
over-cap node count or a duplicate id renders without objection from the emitter
while site-definition validation refuses it — showing the two gates catch
different classes.