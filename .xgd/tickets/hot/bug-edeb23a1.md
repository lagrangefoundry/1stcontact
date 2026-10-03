---
uid: bug-edeb23a1
id: BUG-179
type: bug
title: 'values-diff: a run clipped away by its ancestor reads clean, and 18 of 23
  deltas compare the wrong thing'
created_by: repro-console:repro-joyfulculinarycreations-com#5
created_at: '2026-10-03T01:13:50.344172+00:00'
updated_at: '2026-10-03T01:14:05.174556+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  defect_class:
  - instrument-blind
  - instrument-asymmetric
  - capture-loses-it
  - harness
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# values-diff: a run clipped away by its ancestor reads clean, and 18 of 23 deltas compare the wrong thing

Filed by `repro-console:repro-joyfulculinarycreations-com#5`. These are ruler defects found while diagnosing
the gap ticket filed in the same round (header nav folded into a clip container). Same bundle and artifacts:
`storage/references/joyfulculinarycreations.com/index` (`capturedAt 2026-10-02T23:18:22.456Z`, schema 12),
`storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-5/diff/`.

`defect_class`: **`instrument-blind`**, `instrument-asymmetric`, `capture-loses-it`, `harness`.

Of `values.deltas 23`: 3 are REQ-265 (real), 1 is REQ-332 issue 2 (real), 1 is a 1.23px text-width
difference, and **the other 18 describe nothing wrong in the served page**. Every pixel claim below is a
per-channel mean of `|actual.png − screenshot.full.png|` over the stated rectangle.

## 1. A run hidden by an ancestor's `overflow: hidden` is compared as if painted. `instrument-blind`

*Defence:* the five header nav links are invisible at 1280. The brightest pixel in `x 642–1260, y 83–102` is
`(80,80,81)` on ours and `(255,255,255)` on the reference. Yet `objects[]` reports them `paired`,
`deltaCount 0`: same `color #ffffff`, same `box (915.625,70) 144.08x46`, same `renderedTextBox`. Both
boxes come from `getBoundingClientRect` / a `Range`, and neither knows about ancestor clipping. The served parent is
`.l1-93 { … overflow: hidden; top: 7443.8px … }` in the footer.
**Fix:** record a `visibleFraction` per run (its rect intersected with every ancestor whose
`overflow` ≠ `visible`) and compare it as an axis. **This will add 5 deltas on this bundle**, and it makes
"present but clipped" measurable for the first time.

## 2. A reference element is paired with one of several coincident reproduction layers. `instrument-asymmetric`

6 false deltas: `backgroundImage` ×2 HIGH, `filter` MEDIUM, `opacity` LOW, `paddingTop/BottomPx` LOW.

- Hero: `expected-manifest[11]` `(generic) (0,0) 1280x800`, `HERO-…jpeg`, `filter brightness(0.67) contrast(0.88) saturate(1.06) blur(0px) hue-rotate(0deg)`,
  `opacity 0.49`. Ours carries exactly that on `actual-manifest[12]` (`filter "brightness(0.67) contrast(0.88) saturate(1.06)"`,
  `opacity 0.49`), but the pairing took a different coincident `1280x800` generic, so the delta reads
  `HERO… → —`, `present → none`, `0.49 → 1`.
- Quote band: `expected[53]` is one element that holds the text, the photograph and `padding 45/45`. Ours splits it into
  `actual[54]` (the text, no image) and `actual[55]` (the textless `backdrop-6`: the image and `paddingTopPx 45`).
  The text key pairs 53↔54.

The `box` param agrees in both pairings (`(0,0) 1280x800` and `(0,2668) 1280x267`), so BUG-151's
pair-by-box (landed in `0efbf668ed`) is satisfied, and cannot separate layers that share a rectangle.
**Fix:** when several reproduction elements share the paired box (±2px), compare each paint axis against the
union of what those layers paint, not against the queue head.

## 3. `surfaceFill` tie-break picks the parent over the veil painted on top of it. `instrument-asymmetric`

3 LOW deltas (+ part of the MEDIUM systemic aggregate): the quote-band runs `"It's not just about…"`,
`Chef Sarah Joy`, `Owner` read `#636a63 → #ffffff`. **Pixels agree:** the band `y 2668–2934` differs by
`[1.51, 1.20, 1.53]`/255, and spot pixels are `(11,38,45)` vs `(11,38,46)` and `(66,75,43)` vs `(67,75,44)`.
The reference composites its overlay *element* (`#141E14BA`, `opacity 0.92`) over white. Ours
paints the same veil as a gradient layer on `backdrop-6`
(`background-image: linear-gradient(#141e14ab, #141e14ab), url(…)`), which `flatGradientRgba` reads.
*Hypothesis (not run in a browser):* `paintedSurfaces()` (`extract.ts:988-1011`) sorts by area, and
`section-bg-2` (opaque `#ffffff`, the parent) ties `backdrop-6` at 1280x267. A stable sort keeps DOM order, so the parent comes
first, `surfaceFillOf` (`extract.ts:1287`) stops at its opaque white, and the veil above it is never reached.
This was masked until REQ-351 issue 2 removed `card-3`'s opaque `#636a63` plate, which was tighter.
**Fix:** break area ties by paint order (descendant / later sibling first).
(The two `#28542d → #ffffff` testimonial deltas are *not* this. Those runs sit at `x −419` and `x 1027`, off the band.
That is REQ-332 issue 2.)

## 4. `zIndex` is compared as an absolute number, though the fold clamps it by design. `instrument-blind`

HIGH `zIndex` on the logo `(img)`: `z:9999 → z:1000`. `fold.ts:1352-1364` (`foldPaintOrder`) clamps
to `L1_ENVELOPE.paintOrder.max` *because* a rank is what matters. The only other level on the page is 2
(the nav links), so the order is preserved, and the logo pixels agree exactly (mean `(70,74,70)` on both).
**Fix:** compare paint *rank* among overlapping siblings, or clamp the expected side to the envelope before comparing.

## 5. A coalesced reference section is paired with one raw reproduction band. `instrument-asymmetric`

LOW `opacity` on `§3`: `0.5 → 1`, plus the round's whole "1 population" unmeasured.
`expected-manifest.sections[3]` is `(0,1335.97) 1280x1331.55`, `#7a7a7a`, `opacity 0.5`. That opacity belongs to
its first 267.5px (the 50% overlay, `expected[45]`). Ours has the raw bands `sections[2]` `1280x267.5 opacity 0.5`
(→ `unpairedActualSections`) and `sections[3]` `1280x1064.05 opacity 1`. Pixels over `y 1336–2667`: 1.31/255.
**Fix:** compare a coalesced section against the area-weighted union of the bands it covers.

## 6. The capture records the footer band as painting nothing. `capture-loses-it`

LOW `surfaceFill` on `§9`: `(none) → #edc251`, **against a correct reproduction**. The reference pixels are
`(237,194,81)` = `#edc251` at `(20,4460)`, `(640,4700)` and `(1260,4600)`. The footer differs by 0.58/255. `capture.json`
`sections[9].background` is `{"kind":"none"}` for box `1280x303.31`, while `expected-manifest[86]` paints
`#edc251` over `1280x302.31` of it (via `var(--e-global-color-4d816bd)`). *Hypothesis:* `sliceBackgroundColor`
(`extract.ts:2449`) consults only `slice.layers` and `slice.el`, and the fill is on a descendant rather than on a
coincident layer. **Fix:** accept a descendant covering ≥ 99% of the slice as its fill. This needs a re-capture.

## 7. Two small ones

- LOW `lineHeightPx` ×3 (`Personal Chef Services` etc.), `37.13 → 37.12`, `magnitude 0`. A delta whose
  own magnitude rounds to 0 should not be emitted. (The fold's `round2(37.125)` gives `37.12` by float error.)
- `harness`: `gate.json` `layout.findings` entries carry **no probe name** (`onSample` / `offSample` /
  `contentRobustness`). Of 184 escapes, 92 are `contentRobustness` (text lengthened about 2.5x, e.g. `'If you are
  stepping…'` at `h 208` against `78` captured). Without the probe name they read as on-sample defects at captured
  widths. I only told them apart by running `bin/1c l1-gate … --json` and diffing.

## How to see it

```
python3 -c "import json;v=json.load(open('storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-5/diff/values-diff.json'))
[print(o['label'][:40],[(p['name'],p['expected'],p['actual']) for p in o['params'] if p['mismatch']]) for o in v['objects'] if o['deltaCount']]"
```

**Wrong (now):** the rows above, including `zIndex z:9999→z:1000`, `backgroundImage HERO…→—`, and
`surfaceFill #636a63→#ffffff`. There is **no** row for `Meet the Chef`. **Right:** after re-running
`CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox`,
items 2–6 are gone and the five header links carry a `visibleFraction` delta (until the gap ticket lands, then 0).
