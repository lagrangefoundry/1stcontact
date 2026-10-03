---
uid: bug-edeb23a1
id: BUG-179
type: bug
title: 'values-diff: a run clipped away by its ancestor reads clean, and 18 of 23
  deltas compare the wrong thing'
created_by: repro-console:repro-joyfulculinarycreations-com#5
created_at: '2026-10-03T01:13:50.344172+00:00'
updated_at: '2026-10-03T20:35:28.092963+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  defect_class:
  - instrument-blind
  - instrument-asymmetric
  - capture-loses-it
  - harness
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-57ef52fd
  commits:
  - working_sha: ee378c143ea9a4a592253c974417f822b58cbfc9
    reconcile_sha: null
    main_sha: null
  version: 0.2.455
  story_points: 5
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


## Implementation (free-coded)

All seven items are fixed in the ruler. None of them changes the fold or the reproduction.

1. **`visibleFraction` (new delta property, `presence` kind, Type B).** For each paired element, the visible fraction is `area(box ∩ clip) / area(box)`, read from the `box` and `clip` both sides already carry (REQ-332). This works on the existing bundle, with no re-capture. A difference above 0.05 is reported as `visibleFraction`, for example `100% → 0%`. Limit: `clip` is only the *nearest* clipping ancestor, so a run cut off by a further ancestor is not seen. The axis is compared only when the reference manifest records `clip` on at least one element. On a bundle older than REQ-332, "nothing clips it" and "not recorded" look the same, so there the axis stays silent rather than reporting a false clip.
2. **Coincident reproduction layers.** Before any paired element is compared, its paint axes are resolved against every other reproduction element whose box matches within ±2px on x, y, w and h. The axes are `backgroundImage`, `filter`, `opacity`, `blendMode`, `mask`, and padding on all four sides. If the paired layer disagrees with the reference and a coincident layer agrees, that layer's value is used. This applies only when the reference value actually paints something (not none or the identity, opacity ≠ 1, padding ≠ 0). So a reproduction with an *extra* paint is still reported. The object card shows the resolved value.
3. **`paintedSurfaces()` tie-break** (`extract.ts`). Surfaces are sorted by area, and equal areas (within 1px²) are broken by paint order: the later element in document order (a descendant or a later sibling) comes first. This affects the live reproduction extraction now. A reference bundle picks it up on re-capture.
4. **`zIndex`** is compared after clamping both sides to `L1_ENVELOPE.paintOrder` (−1000..1000), the same clamp `foldPaintOrder` applies. So `9999` against `1000` agrees.
5. **Coalesced reference section.** A reproduction band that no reference section claimed, and that lies vertically inside a paired reference section (±2px), is *covered* by it. Covered bands are claimed, so they leave `unpairedActualSections`. Each of the section's paint axes (`overlay`, `surfaceFill`, `backgroundImage`, `opacity`, `filter`, `blendMode`) agrees if *any* band in the group agrees, under the same "reference value paints" rule as item 2. Not area-weighted as first proposed: a weighted mean reads 0.9 against the reference's 0.5 on this exact band, because that 0.5 describes only the first 267.5px. A weighted mean would therefore still report the false delta.
6. **Band fill painted by a descendant** (`extract.ts`, new `coveringDescendantFill`). When neither a coincident layer nor the band element paints a fill, a descendant that paints an opaque fill over ≥ 99% of the band is taken as the band fill (the topmost one, in paint order). This applies on both band paths: the geometric slice (`sliceBackgroundColor`) and the top-level band root (`bandRoots.forEach`), which is the path the reference footer actually goes through. This needs a re-capture of the reference.
7. (a) `lineHeightPx` and `letterSpacingPx` ignore a difference within the 0.01px recording quantum: `37.13` against `37.12` is no longer a delta, and the delta now carries its own magnitude. (b) Every `gate.json` `layout.findings` entry now carries `probe: 'onSample' | 'offSample' | 'contentRobustness'`. `layoutCollisions` takes the reports keyed by probe name.

## Test plan

`tests/test_UAT_FC_BUG-179_values_diff_measures_what_paints.test.ts` exercises the public `diffManifests` and `layoutCollisions` on synthetic manifests:
- clipped-away run: one `visibleFraction` delta; silent when the reference records no `clip` anywhere
- coincident hero layer and split quote band: no `backgroundImage`/`filter`/`opacity`/padding delta; an extra paint the reference lacks is still reported
- `z:9999` against `z:1000`: no delta; `z:2` against `z:5`: still a delta
- coalesced section: no `opacity` delta, and the covered band leaves `unpairedActualSections`
- `37.13` against `37.12`: no delta; `37.13` against `37.0`: still a delta
- layout findings carry their probe name

- items 3 and 6, offline: `paintedSurfaces` and `coveringDescendantFill` are sliced out of `EXTRACT_SCRIPT` and run on stub elements (the BUG-161/174 pattern). The tie puts the veil before its parent. A descendant covering 99% gives `#edc251`; one covering 50% gives null.

Existing UATs updated for the contract change: BUG-112 (the collision key set now includes `probe`), BUG-143 and BUG-158 (`layoutCollisions` takes reports keyed by probe), BUG-161 (its offline `sliceBackgroundColor` harness stands in `coveringDescendantFill → null` for its descendant-free stub slices).

Verified on the real `iteration-5` manifests (offline `diffManifests`): 23 → 17 deltas. The 5 `visibleFraction` deltas on the header links were added. Gone: `zIndex`, `backgroundImage` ×2, `filter`, `opacity` ×2, `lineHeightPx` ×3 and padding ×2. The surfaceFill rows that remain belong to items 3 and 6 and need a browser re-gate or a re-capture.