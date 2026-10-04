---
uid: bug-24c5e78b
id: BUG-198
type: bug
title: 'values-diff: a div colour panel is never recorded on the reproduction side,
  and a run''s surface extent is compared nowhere'
created_by: repro-console:repro-www-hearingzone510-com#3
created_at: '2026-10-04T15:05:20.439713+00:00'
updated_at: '2026-10-04T15:05:20.439713+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - instrument-asymmetric
  - instrument-no-axis
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-6d0d2af6
---

Filed by `repro-console:repro-www-hearingzone510-com#3`. Bundle: `storage/references/www.hearingzone510.com/index`. Evidence: `storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-3/diff/`. One bundle. Companion gap ticket: see the round's request.

## Item 1: a non-full-bleed colour panel is recorded on the reference side (SVG) and not on the reproduction side (div), giving 2 CRITICAL false `missing` and 2 of 14 unmeasured · `instrument-asymmetric`

**Evidence.** `values-diff.json` has two CRITICAL `missing` on "(generic)" (severity 4060 each). Their `objects` entries are `paired:false`, `surfaceFill` expected `#224e7a`, box expected `(646, 3878) 606×296` and `(29, 3878) 605×296`. These are `expected-manifest.json` #57/#58, the testimonial panels that Zyro paints as inline-SVG rectangles. They are also the whole of `unmatched: 2`, so they account for 2 of the round's 14 unmeasured.

**The reproduction paints them.** `page.json` `0.10.0` `box-0` `{x 645.8, y 170.41 (in section-band-3 at 3708 → 3878.41), 606.17×296, surfaceFill #224e7a}` and `0.10.1` `box-1` `{28.97, …, 604.84×296}`. In `actual.png` vs `screenshot-1280.png`, the share of pixels within 6 of #224e7a is 89.5% vs 90.6% over `(29,3878,605,296)` and 93.0% vs 93.9% over `(646,3878,606,296)`. `actual-manifest.json` has **no** element at y≈3878 with width >500.

**Why.** `tools/generate/src/cli/capture/extract.ts`. `fieldsUnder` (`:3092-3123`) admits a textless surface through two routes. One is `svgPanelFillOf` (REQ-370), which is how the reference's SVG panels get in. The other is `backdropBoxes()`, and `:1013-1015` admits a **colour-only** box there only when it is full-bleed. The reproduction renders the same panel as a `div` with `background-color`, which is not full-bleed, so the extractor never records it. The two sides use different procedures for the same painted thing.

**Proposed.** Admit an opaque colour-only box whose fill differs from its containing band as a field, as an SVG panel is admitted. That could be limited to boxes ≥ `BACKDROP_MIN_HEIGHT` that contain no text run of their own, if the wider admission is too noisy on reference pages. Alternatively, when pairing, treat an unmatched expected `generic` with `surfaceFill` as matched by an actual run whose `surface.box` equals it. Either way, the 2 CRITICAL `missing` should go to 0 on this bundle and `unmatched` to 0.

**See it.** `python3 -c "import json;v=json.load(open('storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-3/diff/values-diff.json'));print(v['unmatched'],[d['property'] for d in v['deltas']].count('missing'))"` prints **`2 2`** now. When fixed it prints `0 0`. Re-measure with `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox`.

## Item 2: a run's surface EXTENT is recorded on both sides and compared nowhere · `instrument-no-axis`

**Evidence.** The run "Learn to train your brain to hear better." (`expected-manifest.json` #0 / `actual-manifest.json` #0) is recorded on each side as follows:
- reference: `surface.box {0,0,1280×40}`, `surfaceFill null`
- reproduction: `surface.box {463.80, 7.59, 352.41×23.39}`, `surfaceFill #ffffff`

Both carry the same `surfaceGradient`. The run's `values-diff.json` object compares only `a11yRole, fontFamily, fontSizePx, fontWeight, color, letterSpacingPx, lineHeightPx, renderedTextBox, box`. Its `deltaCount` is 0. Yet this is the region with the largest score on the page: region #1 `{0,0,1280×48}`, score 17408.12 of 36000.28 (48.36%), meanDiff 72.53. The fold painted the bar's gradient on a run-sized card, and the rest of the bar renders white. That is the companion gap ticket's issue 1. The instrument holds both numbers and reports nothing.

**Proposed.** Compare `surface.box` per text run when either side's `surface.self` is false, with a tolerance on each edge (a few px). Also compare `surfaceFill`/`surfaceGradient` when they are present on either side. **This will add deltas.** On this bundle it adds at least this run's surface box, and it turns a 0-delta 48% region into a measured one.

**See it.** `python3 -c "import json;[print(f,[e['surface']['box'] for e in json.load(open('storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-3/diff/'+f))['elements'] if 'Learn to train' in (e.get('text') or '')]) for f in ('expected-manifest.json','actual-manifest.json')]"` shows the two different boxes. `grep -c surface` over that run's `params` names in `values-diff.json` `objects` is 0 now. When fixed, a `surface` param appears and mismatches until the gap ticket's issue 1 lands.