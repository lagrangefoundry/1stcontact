---
uid: acceptance_criterion-9ccc1de8
id: AC-815
type: acceptance_criterion
title: A band's captured box is the painted extent of its subtree, clamped to the
  document canvas
created_by: xgd
created_at: '2026-08-06T01:46:04.827484+00:00'
updated_at: '2026-08-20T06:58:45.002949+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
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

**Evidence gating.** This criterion is a geometry computation over element rects, so
its whole surface is provable without a paint. The load-bearing evidence is therefore
**headless and runs on every runner**: `tests/bug27-nested-backdrop-capture.test.ts`
Part A′ drives the real `EXTRACT_SCRIPT` — the exact in-page script Chromium
evaluates — over a jsdom DOM with layout stubbed per class, covering all four clauses
(`test_UAT_AC815_collapsed_band_is_boxed_at_its_painted_subtree`,
`…_collapsed_band_subtree_reaches_the_manifest`,
`…_clipped_overflow_does_not_widen_a_band_past_the_document`,
`…_offscreen_block_yields_no_band_and_inflates_none`,
`…_a_conventional_band_box_is_unchanged`). Both halves are red-checked: reverting
`paintedExtent` to the element's own box fails the two subtree clauses, and dropping
the canvas clamp fails the two extent clauses.

Part A of the same file is the real-engine sibling (`cmdCapturePage` against a
committed fixture in headless Chromium) and is gated with `it.runIf(browserOk)` — a
skip, never a wrapper that returns early. A wrapper reports PASS where no browser
exists, which is how this criterion previously read fully covered while asserting
nothing on every runner in this environment.