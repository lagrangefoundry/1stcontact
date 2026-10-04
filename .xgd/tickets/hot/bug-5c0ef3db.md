---
uid: bug-5c0ef3db
id: BUG-197
type: bug
title: 'l1-gate/values-diff: a fold-declared backedBy that fails at rest is reported
  as a viewport-motion escape; a chip inset is compared as padding vs min-height'
created_by: repro-console:repro-www-bluelotusintegralhealing-com#2
created_at: '2026-10-04T12:43:40.799488+00:00'
updated_at: '2026-10-04T14:57:52.555935+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - instrument-blind
  - instrument-asymmetric
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-2aa289a1
---

Filed by `repro-console:repro-www-bluelotusintegralhealing-com#2` (reproduction console, loop 1, iteration 2). Found while diagnosing REQ-380 (the gap ticket filed this round, `fold-groups-band-rows-by-stream-adjacency-not-by-section`). These are instrument defects, not engine gaps.

**Bundle:** `storage/references/www.bluelotusintegralhealing.com/index`. **Evidence:** `storage/tmp/repro-console/repro-www-bluelotusintegralhealing-com/iteration-2/diff/`.

## 1. The containment probe asserts a fold-declared `backedBy` the fold's own geometry contradicts at rest, and reports it as a viewport-motion defect (`instrument-blind`)

**Defence (`instrument-blind`: it measured the wrong thing).** The escape it reports is not "a surface sliding off its copy when the viewport moves". It is a declaration that is already false at the captured width, and the diagnosis it prints sends the implementer to the wrong fix.

`deriveSurfaceBacking` (`tools/generate/src/l1/probes.ts:1514`) promises in its docblock: *"Either way, a pair only enters the set if the surface covers the run in the states the page was MEASURED in, so the probes cannot fire on a page that holds together."* The declared tier does not check that. `:1575-1578` links every `run.backedBy` pair unconditionally, with no `overhang` test at the resting states, unlike the unanimity tier at `:1580-1584`.

On this bundle at 1280 (a captured width), `page.json` has "Contact" at y 2241.29 declaring `backedBy: section-band-4`, whose 1280 box is `{y 1994, h 95}`. Its top is 152px below that surface's bottom edge **at rest** (the gate reports 173px, measured from the run's bottom). The gate's `diagnosis` nevertheless reads: *"A panel that slides off its own copy is structural: the page is exact at rest and comes apart the moment the viewport moves"*. Its `nextStep` is *"Make each escaping surface size itself from the content it backs rather than from a pinned rectangle"*. Both are false here: 58 of the 58 `onSample` escapes are declarations that fail at rest, and the true defect is that the fold chose the wrong surface. A same-fill `backdrop-3`/`backdrop-4` covers every one of those runs at every width, which is why the page paints correctly there.

**Proposed change.** Evaluate each declared pair at the resting states, as the unanimity tier does. Report a declared pair that fails at a captured width as its own finding kind, e.g. `declared-backing-uncovered`, naming the run, the declared surface and the captured width, with a diagnosis that points at the fold's `backedBy` and not at surface sizing. Keep `escape` for pairs that hold at rest and fail between samples.

**How to see it.**
```
bin/1c l1-gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox --json > /tmp/g.json
python3 -c "import json;g=json.load(open('/tmp/g.json'));print([f['detail'] for bw in g['onSample']['byWidth'] if bw['width']==1280 for f in bw['findings']][:3])"
```
**Wrong (now):** 1280-width `escape` findings ("'Get in Touch' … section-band-4 — 54px below its bottom edge") under a diagnosis that says the page is exact at rest. **Right:** the same pairs reported as declared-but-uncovered at the captured width, with `escape` reserved for between-sample failures.

## 2. A chip's inset is compared as padding on one side and min-height on the other (`instrument-asymmetric`)

**Defence (`instrument-asymmetric`).** Both sides paint the same 56px pill. The two procedures disagree only on which CSS property carries the inset and which element counts as the surface.

The four hero CTA pills ("1. About BQH" etc.):
- **Reference** (`expected-manifest.json`): box `{233.98, 654, 193.88×56}`, `renderedTextBox.y` 672.5, `paddingTopPx` 0, `paddingBottomPx` 0, `surface.self` false (surface = the 1280×882 hero band). The page sizes the pill with `min-height` + flex centring, and its fill is `rgba(255,255,255,0)`.
- **Reproduction** (`actual-manifest.json`): box `{233.97, 654, 193.88×56}`, `renderedTextBox.y` 673, padding 18/17 (REQ-371 issue 3's chip inset), `surface.self` true with radius 28 and a 1px #ffffff border.
- `values-diff.json` reports **12 LOW deltas** for this: `paddingTopPx` 0→18 ×4, `paddingBottomPx` 0→17 ×4, and `surfaceFill` "surface band 1280×882" → "own plate 194×56" ×4. No pixel region of the 12 lands on a pill.

**Proposed change.** Compare a run's vertical inset as `renderedTextBox − box` (which both sides measure the same way) rather than raw `padding*` when the reference's padding is 0 and its box is taller than its line block. Resolve the reference's surface walk the way the reproduction's does for a transparent-fill element that draws its own border and radius (it is a chip with no fill, not "no surface"), or compare such a pair on border/radius only. Expected effect: −12 deltas with no loss of a real measurement.

**How to see it.** `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox`, then read `values-diff.json` for "1. About BQH". **Wrong:** three LOW deltas per pill. **Right:** none, with the pill geometry still compared.