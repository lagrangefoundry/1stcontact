---
uid: request-54f9f2a6
id: REQ-371
type: request
title: 'capture/renderer/fold: a non-Elementor scroll-reveal is captured at opacity
  0 (2 of 6 sections lost), the root lets its first section margin collapse out (+84px
  on every surface), and a min-height pill loses its height'
created_by: repro-console:repro-www-bluelotusintegralhealing-com#1
created_at: '2026-10-03T19:40:26.182498+00:00'
updated_at: '2026-10-03T19:41:52.632756+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  defect_class:
  - capture-loses-it
  - renderer-wrong
  - fold-wrong
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Filed by `repro-console:repro-www-bluelotusintegralhealing-com#1` (reproduction console, loop 1, iteration 1).

**Leading residual class:** `capture-settles-only-elementor-reveals-so-other-builders-capture-at-opacity-0`

**Stored reference:** `storage/references/www.bluelotusintegralhealing.com/index` (a Zyro/Astro site). All evidence below comes from this one bundle.
**Reproduction:** sandbox site `repro-www-bluelotusintegralhealing-com`. Evidence dir: `storage/tmp/repro-console/repro-www-bluelotusintegralhealing-com/iteration-1/` (`$ITER` below). `$REF` = the bundle path above.

**Gate:** `structural-failure` · mean 25.76/255 · 13.51% over threshold · 12 regions · total ranked score 363593.65 · 36 deltas · unmeasured 13.
The reference was captured 2026-10-03T18:26:43Z at schema 14. Nothing has landed in the engine since, so none of this is a landed fix waiting on a re-capture.

## Summary, in dependency order

| # | residual class | class (§5) | `defect_class` | what it costs on this bundle |
|---|---|---|---|---|
| 1 | `capture-settles-only-elementor-reveals-so-other-builders-capture-at-opacity-0` | 1, engine shortfall | `capture-loses-it` | **2 of the reference's 6 content sections captured empty**: "Get in Touch", 2 emails, a 4-field contact form, the footer tagline, a mailing-list form, the copyright line and the logo, plus 2 testimonial attributions. 19 of 29 reveal wrappers are at opacity 0. 0 deltas and 0 unmeasured, because the oracle has no record of any of it |
| 2 | `renderer-root-lets-first-flow-child-margin-collapse-out` | 3, renderer bug | `renderer-wrong` | every root-level pinned surface paints **+84px** at ≥1024 (and +66px below). Regions #1 and #2 = 183960 of 363593.65 (**50.6%** of the ranked score), plus part of #3. 3 CRITICAL position deltas, and the document is 3030 tall where it should be 2946 |
| 3 | `fold-drops-the-box-height-of-a-text-run-that-is-taller-than-its-line` | 1, engine shortfall | `fold-wrong` | the 4 CTA pills render **21px** tall where the reference box is **56px**. 4 CRITICAL deltas at −17.5, then everything below the hero is −35 (7 CRITICAL position deltas), and region #4 |
| 4 | `fold-drops-zindex-and-maskedge-from-emitted-box-leaves` | 1, engine shortfall | `fold-wrong` | 4 HIGH `zIndex` and 3 MEDIUM `mask` deltas. `1c l1-gate` names all five itself in `foldResiduals` |

**Already filed elsewhere, so not re-filed here:** the 6 CRITICAL `missing` header-nav links are REQ-302 issue 2 (`fold-emits-flow-siblings-out-of-order-and-repairs-with-negative-margins`); this round's numbers are added there as a comment. The 2 `overlap` findings at 1024 are pairs **the reference itself has** (heading y 184.34–517.09 over paragraph 432.28–504.28 in `$REF/multistate.json` at 1024×768), which is REQ-331's `stacked: true` class. The 3 LOW `surfaceFill` #30499c vs #4359a5 are REQ-302 issue 4's scrim asymmetry. Two instrument defects found on the way are filed as separate bugs (named in the closing note).

**Order:** issues 1–4 are independent of one another. Issue 1 is first because content completeness comes before pixels, and because **it needs a re-capture after it lands** (`1c refold` cannot pick it up). Once it lands, the reproduction is measured against two sections it does not yet draw, so **this will add deltas**: roughly 19 currently-invisible elements become real comparisons. Issue 2 is the largest pixel item and is a one-declaration fix. Issue 3 is smaller and self-contained.

---

## Issue 1: the capture's reveal settle only knows Elementor, so a Zyro page's scroll-reveal content is captured at opacity 0

**Class 1 (engine shortfall). `defect_class: capture-loses-it`.** The defence: the strings are present in `$REF/rendered.html` (the capture's own post-settle DOM) and absent from `capture.json`, `multistate.json` and `forms.json`; the reference screenshot paints zero ink where they sit. The fold and the renderer never saw them, so they are innocent.

**Test run.** Q1 (can L1 express it?) is not reached, because the capture never recorded it. I counted strings across the bundle:

```
string                     capture.json  multistate.json  forms.json  rendered.html
Get in Touch                     0              0             0             2
Laurie S                         0              0             0             2
All rights reserved              0              0             0             2
Transformative healing for self  0              0             0             2
support@bluelotus                0              0             0             2
Submit Your Message              0              0             0             2
Add to Mailing List              0              0             0             2
Kristin K                        0              2 (375 only)  0             2
```

**Ink in the reference screenshot**, measured with PIL over `$REF/screenshot-1280.png` in 40px rows (share of pixels more than 120 L1 away from the row's dominant colour): **0.00%** in every row from y=2020 to y=2540 (dominant #ffffff) and from y=2580 to y=2946 (dominant #249ed3). Those are reference sections 5 (box y 1994 h 560) and 6 (y 2554 h 392) in `$ITER/diff/expected-manifest.json`, and **neither section has a single element in that manifest**. The rows at y=1900–1980, where "Laurie S." sits, are also 0.00%.

**Mechanism, read from the bundle's own stylesheet** `$REF/assets/_..jMVJmPqh.css`:

```
.transition.transition--slide:not(.transition--root-hidden){opacity:0;transition-property:transform,opacity;transform:translateY(20%)}
.transition.transition--slide:not(.transition--root-hidden)[data-animation-state=active]{…opacity:1;…transform:translate(0%)}
```

In `$REF/rendered.html`, **29** `layout-element … transition …` wrappers exist, and only **10** carry `data-animation-state="active"`. All 10 active ones are in the header/hero/About/testimonial-text area. The **19** inactive ones are `ai-bbhhvm` (Kristin K), `ai-q-_ay4` (Laurie S.), `ai-qrd8l9` (Get in Touch), `ai-uwjwpv`, `ai-gzb4uc`, `ai-ttqabi`, `ai-j22mxp`, `ai-gpibds`, `ai-utivcg` (contact form), `ai-nituns`, `ai-5c1o20` (social icons), `ai-sjltkc`, `ai-s6pdiz`, `ai-j3lbdc`, `ai-96n3i7`, `ai-dn18uu` (mailing list form), `ai-wt0ba6` (copyright), `zit4pk` (the logo, which is why the gate's `unreferenced-image` finding names `logo-YanqPZoG7LU1P8Lv.png` and `-1.png`), and `za4jey` (the About photo). The photo is the exception: it uses the `root-hidden`/`.loaded` path and does paint. Its pixel census is identical on both sides.

**Hypothesis.** `tools/generate/src/cli/capture/page-scripts.ts:82-83` `SETTLE_CSS` collapses animation/transition timing to 0 and force-reveals **only** `.elementor-invisible`. `SETTLE_SCROLL` (`:91-107`) steps `window.innerHeight` with a 120ms sleep and returns to the top. Zyro's observer did not flip `data-animation-state` on 19 wrappers during that pass (on this page it never did below the testimonial text). Because the pre-animation state is an `opacity:0` rule keyed on a missing attribute, zeroing the transition duration does nothing. The resting style *is* invisible.

**Proposed change.** Make the reveal settle builder-agnostic rather than adding a second builder's class name:
1. After `SETTLE_SCROLL`, walk elements whose computed `opacity` is 0 (or whose `visibility` is hidden) while an ancestor-or-self has a `transition`/`animation` on `opacity`/`transform`, and whose box intersects the document. Force those to their end state with an injected `!important` rule (`opacity:1; transform:none`), the same way `.elementor-invisible` is handled now. Or, cheaper and more targeted: also add the known pattern `[class*="transition--"]:not([data-animation-state=active])` to `SETTLE_CSS`.
2. Re-run the scroll with a longer per-step dwell (or `scrollIntoView` per still-hidden candidate) before forcing, so observer-driven pages get the first chance to reveal themselves.
3. Record how many elements had to be forced (a `settle.forcedReveals` count in `capture.json`) so a later round can see it. Today nothing in the bundle says a reveal was missed.

**How to see it.**
```
REF=storage/references/www.bluelotusintegralhealing.com/index
grep -o '<div class="layout-element[^"]*transition[^"]*"[^>]*>' $REF/rendered.html | wc -l                                  # 29
grep -o '<div class="layout-element[^"]*transition[^"]*"[^>]*>' $REF/rendered.html | grep -vc 'data-animation-state="active"'  # wrong: 19
for t in "Get in Touch" "Laurie S." "All rights reserved" "Submit Your Message"; do echo "$t: $(grep -c "$t" $REF/capture.json)"; done   # wrong: all 0
```
**Right:** after the fix and a re-capture (`CHROMIUM_LAUNCH_ARGS=--single-process bin/1c capture page http://www.bluelotusintegralhealing.com`, or the console's **recapture**), the second command prints `0` (or the forced-reveal count equals 19), each string count is ≥1, `$ITER`-equivalent `expected-manifest.json` has elements inside y 1994–2946 at 1280, and the coverage finding no longer lists the two logo files.

---

## Issue 2: the renderer lets the root's first flow child's `margin-top` collapse out of the root, moving every pinned surface down by that margin

**Class 3 (renderer bug). `defect_class: renderer-wrong`.** The defence: L1 places `backdrop-0` at y=0 and `section-bg-0` at y=84 (`$ITER/page.json`, 1280 keyframes), and the served page paints `backdrop-0` at y=84 with the hero still at 84. The L1 value is right and the render disagrees.

**Test run.**
Q1: L1 expresses it. Root-level pinned `box` nodes with keyframes. Q2: the L1 values are right. At 1280: `backdrop-0` y 0 h 84, `backdrop-1` y 966 h 513, `backdrop-2` y 1478 h 516, `box-0` y 1993 h 561, `box-1` y 2553 h 393. These match the reference sections (`expected-manifest.json` S3 y 966 h 513, S4 y 1479 h 515, S5 y 1994 h 560, S6 y 2554 h 392) to ≤1px. Q3: I rendered `$ITER/site/index.html` in Chromium (`--single-process`) at 1280×800 and read bounding boxes:

```
.l1-0 (root)   y 84    h 1758.5      ← should be 0
#backdrop-0    y 84    h 84          ← L1 y 0
#backdrop-1    y 1050  h 513         ← L1 y 966
#section-bg-0  y 84    h 847  margin-top 84px   (the hero is where L1 says)
scrollHeight   3030                  ← reference 2946
```

`$ITER/diff/actual-manifest.json` agrees independently. Elements 0, 10, 15, 16 and 17 sit at y **84, 1050, 1562, 2077, 2637**, each at exactly its L1 y + 84 with its L1 height unchanged. So the whole surface layer is translated by the hero's `margin-top`, and the hero is not.

**Why.** The served CSS is `.l1-0 { position: relative }` and nothing else (no padding, no border, no BFC), and its first in-flow child is `.l1-6 { … margin-top: 84px }` (66px below 1024). `position: relative` does not establish a block formatting context, so the child's top margin collapses through the root. The root's border box moves down 84px, and every `position:absolute` child is placed from it. The engine already knows this hazard: `tools/generate/src/l1/fold.ts:3025-3028` ("a block's first in-flow child has its `margin-top` COLLAPSE OUT of it, which would move the panel instead of its content"). It just doesn't apply it to the root, which is still emitted as a plain `box`.

**Where.** `packages/framework/src/l1/render.ts:4856-4859`, `case 'box'`: a geometry-less box gets `position: relative` only.

**What it costs.**
- Regions #1 `{x:0,y:1984,w:1280,h:96}` and #2 `{x:0,y:2544,w:1280,h:96}`: score 91980 each, meanDiff 191.63. Both are the band boundary swapped over an 84px strip (ref boundary 1993/2553, ours 2077/2637). `nodes` on both sides: `section` (90% of region on ref, 98% on ours). Together 50.6% of the ranked score.
- Region #3 `{x:0,y:1472,w:1280,h:400}`: score 89060.86 (24.5%). The blue band starts at 1478 on ref and 1562 on ours (this issue), mixed with issue 3's −35 on the testimonial text.
- values-diff: `position (generic) @ (0, 1478)` → `(0, 1562)`, `(0, 1993)` → `(0, 2077)`, `(0, 2553)` → `(0, 2637)`, all CRITICAL with magnitude 84. Probably also the CRITICAL `missing (generic)` (the reference's z13 header band at y 8; ours paints it at 84 and it does not pair). I have not proved that pairing claim.
- The l1-gate's 36 `escape` findings are partly this. At 1280, card-0's text (y 1482.5) starts 79.5px above `backdrop-2`'s rendered top (1562) in the browser. The magnitudes the gate quotes (643px / 1062px) are not what the browser shows; see the instrument bug filed separately.

**Proposed change.** Give the root (and any geometry-less `box` that has pinned children alongside in-flow children) its own BFC: emit `display: flow-root` alongside `position: relative` at `render.ts:4859`. Alternatively, have the fold emit the root as a `container`, per the reasoning at `fold.ts:3025`. `flow-root` is the smaller change and keeps a `box`'s block layout otherwise identical.

**How to see it.**
```
cd tools/generate && node -e "
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--single-process']});
const p=await b.newPage({viewport:{width:1280,height:800}});
await p.goto('file://'+require('path').resolve('../../storage/tmp/repro-console/repro-www-bluelotusintegralhealing-com/iteration-1/site/index.html'));
console.log(await p.evaluate(()=>JSON.stringify({root:document.querySelector('.l1-0').getBoundingClientRect().y+scrollY,
 backdrop0:document.querySelector('#backdrop-0').getBoundingClientRect().y+scrollY,docH:document.documentElement.scrollHeight})));await b.close()})()"
```
**Wrong (now):** `{"root":84,"backdrop0":84,"docH":3030}`. **Right:** `{"root":0,"backdrop0":0,"docH":2946}`. Then `bin/1c repro`/re-render the slug and run `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox`. Regions #1/#2 should disappear and the three magnitude-84 position deltas should go to 0.

---

## Issue 3: the fold drops the height of a text run whose box is taller than its line (a fixed/min-height pill), so a 56px CTA renders 21px tall

**Class 1 (engine shortfall). `defect_class: fold-wrong`.** The defence: the capture carries the 56px box and the centred glyph box, L1 can carry a run's height (`padding`/`responsivePadding`/`sizing` are spread into every kind, `text` included: `packages/site-schema/src/l1/schema.ts:2118-2133`), and the fold writes neither.

**Test run.**
Q1: L1 can express it (see above). Q2: is it in L1? `$ITER/page.json` node `0.5.3.0` ("1. About BQH") has `axes` {surfaceFill, borderRadiusPx 28, border 1px #ffffff, fontSizePx 16, …}, **no `lineHeightPx`, no `padding`, no `sizing`**, and geometry with no height. The capture (`$REF/capture.json` `.sections[2].content[3]`) has `box: {x 233.98, y 654, width 193.875, height 56}`, `renderedTextBox: {x 282.09, y 672.5, width 97.66, height 19}`, `borderWidthPx 1`, `paddingTopPx 0`, `paddingBottomPx 0`. The 0 padding is probably true: Zyro sizes the pill with `min-height: var(--grid-button-primary-min-height)` plus `display:flex; align-items:center` (`.grid-button--primary` in the bundle CSS), so the inset lives in the box, not in padding. Q3 is therefore not reached: L1 is wrong.

**Numbers, every width** (`$REF/multistate.json`): box height 56 at 320/375/768/1024/1280/1440, with the label inset exactly 18.5 from the box top (e.g. 1280: 672.5 − 654). Rendered (Chromium, `.l1-11`): height **21**, label at y 655 (`actual-manifest.json` renderedTextBox y 655).

**What it costs.** values-diff: `position "1. About BQH" text @ (282, 673)` → `(282, 655)`, and the same for "2. Order A Session" (474), "3. Book Appointment" (669) and "4. Client Intake Form" (876). All CRITICAL, magnitude 17.5. The hero is then 56 − 21 = **35px** short: it ends at 931 (`actual-manifest.json` element 11 y 931) where the reference band ends at 966. Seven CRITICAL deltas of magnitude ~35 follow: `(generic) @ (0,966)` → `(0,931)`, "About Me" 1088 → 1053, both testimonial texts 1518 → 1483, the image 1192 → 1157, and "Welcome to my…" 1182 → 1147. Region #4 `{x:0,y:928,w:1280,h:48}` (score 32912.5, meanDiff 137.14) is the 35px strip where ours is already the white About band and the reference is still the hero. The probe the gate declined (`element.arrangement`, "the element's own box had moved") is this shift.

**Hypothesis.** The text-node emission (`textAxes`/the run's geometry in `tools/generate/src/l1/fold.ts`) takes the run's position from `box` and its height from the line count (`lineCountOf`, `fold.ts:256-262`), and never compares `box.height` with the line box. So a run whose border box is taller than `borderTop + lines × lineHeight + borderBottom` loses the difference.

**Proposed change.** When `box.height − 2×borderWidthPx` exceeds the measured line box (`renderedTextBox.height`, or `lineHeight × lines` where lineHeight is known) by more than ~1px, emit the difference as vertical padding split by where the glyphs sit: top = `renderedTextBox.y − box.y − borderTop`, bottom = the remainder (here 17.5 / 17.5, giving 1 + 17.5 + 19 + 17.5 + 1 = 56). Use `responsivePadding` when it varies by width. Padding rather than `sizing.height` because it keeps the label centred without a vertical-alignment axis L1 does not have for text.

**How to see it.** Same Chromium snippet as issue 2, reading `document.querySelector('.l1-11').getBoundingClientRect().height`. **Wrong:** `21`. **Right:** `56`. Then in `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c values-diff …` (or `1c gate`, as in issue 2) the four −17.5 deltas and the seven ~−35 deltas go to 0 and region #4 disappears. Offline check without a browser: `bin/1c refold --ref storage/references/www.bluelotusintegralhealing.com/index`, then inspect the emitted node for "1. About BQH" for `padding.topPx ≈ 17.5`.

---

## Issue 4: zIndex and maskEdge are dropped from emitted box leaves

**Class 1 (engine shortfall). `defect_class: fold-wrong`.** The defence: the gate itself reports it. `bin/1c l1-gate repro-www-bluelotusintegralhealing-com --ref $REF --sandbox --json` → `foldResiduals` has 5 entries `{"kind":"box","reason":"axes dropped from an emitted box leaf","capturedAxes":["zIndex"]` or `["maskEdge","zIndex"]`, widths 320–1440}.

**Evidence.** values-diff: 4 × HIGH `zIndex (generic)` expected `z:13`, actual `z:0`, and 3 × MEDIUM `mask (generic)` expected `present`, actual `none`. In the reference these are the band elements with `maskEdge: "inset(0px)"` and `zIndex: 13` (`expected-manifest.json` elements 16/20/21). Low visual value on this page: `inset(0px)` clips nothing and the bands do not overlap anything with a competing z. It is listed for completeness and because the gate names it. Whether `inset(0px)` should count as a mask at all is an instrument question I could not settle here.

**How to see it / know it is fixed.** `bin/1c l1-gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox --json | python3 -c "import json,sys;print(json.load(sys.stdin)['foldResiduals'])"`. **Wrong:** 5 box entries. **Right:** `[]`.

---

## Not attributed

- `renderedTextBox "Troy is a wonderful…"` 502×379 vs 502×355: one line fewer at the same width (16 vs 15 lines at 24px). Not separated this round; the L1 `resources.fonts` declares only Lato 400 while runs use 500/600, which may matter, but I did not test it.
- `gap (generic)→(generic)` −1px vs 120px, `size (generic)` 1280×513 vs 1280×432, `paddingBottomPx` 0 vs 48, `contentAnchor §4` center 0.45 vs top 0.19: these all describe `section-band-1`/`backdrop-1` and the testimonial band after issues 2 and 3 moved them. Re-measure after 2 and 3 before reading them as defects.
- Unmeasured 13: the 1 probe is issue 3's shift. I did not decompose the 3 bands / 9 populations further.



## Related tickets filed this round

- **BUG-188** (`instrument-blind`): `1c l1-gate`'s layout model has no margin collapse, so it passes sampleFidelity at 0.009px over issue 2's +84px. Its escape magnitudes are 575.75px away from Chromium.
- **BUG-189** (`instrument-blind`): gate coverage does not flag a reference section with a box and no content, so issue 1's lost sections read as `structural-failure` instead of `capture-incomplete`.
- The 6 CRITICAL missing nav links were added to **REQ-302** issue 2 as a comment (same class, now losing content at a sampled width).
