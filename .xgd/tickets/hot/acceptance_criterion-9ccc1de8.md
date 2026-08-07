---
uid: acceptance_criterion-9ccc1de8
id: AC-815
type: acceptance_criterion
title: A band's captured box is the painted extent of its subtree, clamped to the
  document canvas
created_by: xgd
created_at: '2026-08-06T01:46:04.827484+00:00'
updated_at: '2026-08-07T23:12:08.114328+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
A captured band's box is the painted extent of its whole subtree, clamped to the
document's painted canvas — not the band's own in-flow border box.

A top-level band that collapses to zero height while still painting (a header whose
children are absolutely positioned) therefore keeps its subtree: its logo, nav links
and every run beneath it reach the manifest and are comparable, instead of the entire
subtree being dropped before extraction and being unrecoverable downstream. The band
is boxed at what it actually paints.

The clamp is what keeps that safe in the other direction: a child whose border box
extends past what it paints because an ancestor clips it — a carousel's off-stage
slides under `overflow: hidden` — cannot inflate the band beyond the page. Overflow
that genuinely extends the document grows the canvas and is kept; overflow that is
clipped does not and is cut.

A subtree that paints nothing on the page contributes no band at all, so an
off-screen hidden block (positioned far outside the canvas) is still excluded. A
conventionally laid-out band is unchanged, its children already inside its own box.

## Verification
Capture a page with a collapsed (0px-tall) header whose absolutely-positioned
children paint a full nav bar, an overflow-clipped carousel with off-stage slides,
and a hidden block positioned far off-canvas. Assert the header band is boxed at its
painted nav bar and its logo and links appear in the manifest; assert the carousel's
band is no wider than the document; assert the off-canvas block yields no band; and
assert a conventional band's box is unchanged from its own border box.