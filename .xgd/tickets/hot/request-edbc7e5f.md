---
uid: request-edbc7e5f
id: REQ-302
type: request
title: 'renderer/fold/capture: a flow-placed run stretches to its container, the fold
  repairs mis-ordered siblings with negative margins, and four measurement residuals'
created_by: repro-console:repro-gigabytealchemy-ai#4
created_at: '2026-09-22T22:25:47.579565+00:00'
updated_at: '2026-09-23T00:08:15.653549+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  defect_class:
  - renderer-wrong
  - fold-wrong
  - instrument-asymmetric
  - capture-loses-it
  - cannot-tell
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-2a742332
  commits:
  - working_sha: 0137b752bfe87d5a666d2f7cd52a1476583067bb
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 68166ee04043a9102fdc76f535a070257a889391
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 3382f06690e4a20ff49c41520fed3203955e1d0b
    reconcile_sha: null
    main_sha: null
  version: 0.2.333
  story_points: 8
---

Loop 1, iteration **4** of `repro-gigabytealchemy-ai` against the stored bundle
`storage/references/gigabytealchemy.ai/index`.

`gate.json` verdict: **`structural-failure`** — `l1Pass: false`, `layout.pass: true`,
`perceptualBreach: false`, `valuesBreach: true`, mean 0.52/255, 0.38% of pixels over
threshold, 10 ranked regions totalling **1043.47** score, **23 value deltas**
(`matched: 59`, `unmatched: 0`, `unpairedActual: 0`), **unmeasured 5**
(4 axes + 1 band).

The reference is stamped `capturedAt: 2026-09-22T20:38:02.849Z`, `captureSchema: 4`,
and nothing has landed in the engine since, so every residual below is measured by
the instrument running now. None of it is REQ-270's stale-bundle window.

## Paths used throughout

```
REPO=/Users/martin/lagrangefoundry/1stcontact
REF=$REPO/storage/references/gigabytealchemy.ai/index
ITER=$REPO/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4
SLUG=repro-gigabytealchemy-ai
```

All commands below are run from `$REPO` and use `bin/1c` (the CLI is not on
`PATH` in an agent shell). None of issues 1–7 needs a browser except where a
`CHROMIUM_LAUNCH_ARGS=--single-process` prefix is shown.

## Summary — seven residuals, in the order to work them

| # | residual class | kind | `defect_class` | what it costs |
|---|---|---|---|---|
| 1 | `renderer-stretches-flow-placed-run-to-container-width` | **class 3** — renderer bug | `renderer-wrong` | **609.22 of the 1043.47 ranked region score (58.4%)** and 10 of the 20 individual value deltas |
| 2 | `fold-emits-flow-siblings-out-of-order-and-repairs-with-negative-margins` | **class 1** — engine shortfall | `fold-wrong` | **the `structural-failure` verdict itself**: 2 off-sample collisions at 500px, 19 content-robustness collisions at every width |
| 3 | `capture-reads-a11yrole-on-the-text-node-not-the-semantic-ancestor` | instrument | `instrument-asymmetric` | the **two highest-severity deltas in the run** (3100 each), and they point the wrong way — the reproduction is right |
| 4 | `run-surface-drops-scrim-alpha-and-lands-on-a-different-axis-per-side` | instrument | `instrument-asymmetric` | 8 of the 20 individual deltas, all false |
| 5 | `capture-bundle-drops-three-padding-sides-and-textalign-from-a-run` | **class 1** — engine shortfall | `capture-loses-it` | **4 of the 5 unmeasured** — 4 axes × 59 matched runs compared nowhere |
| 6 | `fold-rounds-run-geometry-to-whole-pixels` | **class 1** — engine shortfall | `fold-wrong` | 127.69 of the ranked score (12.2%) |
| 7 | the remaining 306.56 of ranked score (29.4%) | — | `cannot-tell` | not separable from the artifacts in hand; what would separate it is named |

**The seven account for the whole ranked score**: 609.22 + 127.69 + 306.56 = 1043.47,
and for all 23 deltas: 10 (issue 1) + 2 (issue 3) + 8 (issue 4) + 3 systemic aggregates.

**Order and dependencies.**

- **Issue 1 is first and is the cheapest.** It is a one-declaration renderer change
  with the largest measured payoff, and it changes the rendered width of 15 runs — so
  issue 2's collision set must be re-measured *after* it lands, not before.
- **Issue 2 is second** and is the only reason the gate says FAIL. It is a fold
  change, not a renderer one, and it must **not** be fixed by reverting REQ-278's
  flow recovery — that would give back the horizontal geometry REQ-278 exists to keep.
- **Issues 3, 4 and 5 are measurement**, and all three change what the *oracle*
  says. 3 and 5 write values that are **persisted in the bundle**
  (`a11yRole` ×59, `paddingLeftPx` ×59 in `$REF/capture.json`), so landing them
  changes nothing until the operator presses **recapture**. Say so in the commit;
  `1c refold` cannot pick them up.
- **Issue 5 will RAISE the delta count**, because it makes 4 axes × 59 runs into real
  comparisons that currently return nothing. That is the instrument sharpening
  ([[REQ-277]]) and is the point.
- **Issue 6** is independent of all of the above.

Landing 1 and 2 is a good outcome. The rest will still be visible to a later round.

Everything below is quoted out of a file on disk or is the output of a command this
round ran. Nothing is read off a screenshot.

---

## Issue 1 — a flow-placed run whose width was relaxed to a floor stretches to its container, and a `background-clip: text` gradient is painted across the wrong width

**Residual class:** `renderer-stretches-flow-placed-run-to-container-width`

**Class: 3 — renderer bug.** `defect_class: renderer-wrong` — L1 carries
`geometry.keyframes[at=1280].width = 686`, which matches the reference's measured
685.3125 to within the rounding of issue 6, and the served document lays the element
out at **1192**. The L1 value is right and the render disagrees with it.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(evidence from this one bundle only — but the mechanism is width-independent and
site-independent, see "why this is not one site's residual" below).

### The three questions, and what each returned

1. **Can L1 express it?** Yes, twice over — `geometry.keyframes[].width` is a number
   the fold already writes, and `l1AxisSizingSchema` (`packages/site-schema/src/l1/schema.ts:316`)
   has `width: { mode: 'hug' }` for fit-content. Not class 2.
2. **Is the value in the L1 document, and is it right?** Yes and yes:

   ```
   bin/1c page get repro-gigabytealchemy-ai home --sandbox --json \
     | python3 -c "import sys,json;d=json.load(sys.stdin)['data']['page']['l1']['root'];
   def w(n):
    yield n
    for c in n.get('children') or []: yield from w(c)
   [print([k for k in n['geometry']['keyframes'] if k['at']==1280][0], n['axes'].get('nowrapFromPx')) for n in w(d) if n.get('text')=='Gigabyte Alchemy']"
   ```

   returns `{'at': 1280, 'x': 88, 'y': 83, 'width': 686, 'atHeight': 800} 375`.
3. **Does the render agree with L1?** **No.** → **class 3, stop here.**

### Evidence

**The reference and the reproduction disagree on the element's box, not on its paint.**
From `$ITER/diff/expected-manifest.json` and `$ITER/diff/actual-manifest.json`, the
run `"Gigabyte Alchemy"`:

| | `box` | `renderedTextBox` | `gradient` |
|---|---|---|---|
| expected | `{x: 88, y: 82.5, width: 685.3125, height: 90}` | `{x: 88, y: 79, width: 685.3125, height: 97}` | `90°` `[#f5e6a3 0%, #f5e6a3 60%, #ff8c42 90%, #ff6b35 100%]` |
| actual | `{x: 88, y: 83, width: **1192**, height: 90}` | `{x: 88, y: 79, width: 685.3125, height: 97}` | *identical* |

The glyphs land in the same place. The **background positioning area** does not, and
that is the area a `background-clip: text` gradient is painted across.

**The ground truth.** `$REF/raw.html`:

```html
<a href="/" class="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight leading-tight md:whitespace-nowrap" style="font-family: 'Cinzel', serif;">
  <span style="background: linear-gradient(90deg, #F5E6A3 0%, #F5E6A3 60%, #FF8C42 90%, #FF6B35 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
    Gigabyte Alchemy
  </span>
</a>
```

An inline `<a>` is shrink-to-fit: 685.31px. The gradient's `60%` stop therefore sits at
`88 + 0.6 × 685.31 = 499.2` and `100%` at `773.3`. In the reproduction the same stops
sit at `88 + 0.6 × 1192 = 803.2` and `1280` — past the right edge of the text — so the
whole run stays in the flat `#f5e6a3` head of the ramp and never reaches orange.

**The pixel regions say exactly that, and nothing else.** From `$ITER/diff/regions.json`
(`rankedBy: "score"`, `dims: {w: 1280, h: 4376}`, `blockPx: 16`):

- **#1** `bbox {x: 672, y: 96, w: 96, h: 48}` · score **476.38** · meanDiff 43.31 · area 4608
  · `nodes.ref[0]` = `"Gigabyte Alchemy"` role `body` box `{88, 82.5, 685.31, 90}`
  (`ofRegion: 1`) · `nodes.actual[0]` = `"Gigabyte Alchemy"` role `link` box
  `{88, 83, 1192, 90}` (`ofRegion: 1`).
- **#5** `bbox {x: 640, y: 112, w: 16, h: 32}` · score **75.6** · meanDiff 37.8 — same two leads.
- **#6** `bbox {x: 608, y: 112, w: 16, h: 32}` · score **57.24** · meanDiff 28.62 — same two leads.

**609.22 of 1043.47 = 58.4% of the whole ranked score**, and all three regions lie in
`x ∈ [608, 768]`, i.e. between 76% and 99% of the reference run's width — precisely the
stretch where the reference ramp has gone orange and the reproduction has not. The
predicted per-channel difference at the centre of region #1 is
`#fc9a51` vs `#f5e6a3` ≈ 53/255; the measured `meanDiff` over that block (glyphs plus
background) is 43.31. At region #6 the prediction is ≈ 33/255 and the measurement is
28.62. The arithmetic and the artifact agree.

**Same disagreement drives 10 value deltas**, through the run's *surface* attribution:
the manifest resolves a run's surface geometrically (a run whose box fits inside a
painted card takes the card's fill/border), so a stretched run falls out of its card.
From `$ITER/diff/values-diff.json`:

```
borderLeft "These aren't just features—they're foundations…"  4px #00d492 → none   MEDIUM 2030
borderLeft "Your private space to think out loud"             4px #ffb900 → none   MEDIUM 2030
borderLeft "AI-powered development methodology and tools"     4px #50a2ff → none   MEDIUM 2030
borderLeft "What We're Exploring"                             4px #90a1b9 → none   MEDIUM 2030
borderLeft "More to come as these ideas take shape."          4px #90a1b9 → none   MEDIUM 2030
borderLeft "We're not trying to change you…"                  4px #ffb900 → none   MEDIUM 2030
surfaceGradient "What We're Exploring"      135° [#f1f5f9 0%, #e2e8f0 100%] → none MEDIUM 2020
surfaceGradient "More to come as these…"    135° [#f1f5f9 0%, #e2e8f0 100%] → none MEDIUM 2020
surfaceFill "Your private space to think out loud"  #f8f5f2 → #e8dfd3            LOW 1060.06
surfaceFill "AI-powered development methodology…"   #f8f5f2 → #e8dfd3            LOW 1060.06
```

plus their share of the three `⟨6 elements⟩` systemic aggregates
(`borderLeft` HIGH 3030.86, `surfaceGradient` HIGH 3020.86, `surfaceFill` MEDIUM 2060.86).

Every one of those 6 runs is stretched, and **the reproduction's L1 carries the values
the deltas say it lost**. From `page.json`, the sibling box nodes:

```
/6  box {"surfaceFill":"#f8f5f2","borderRadiusPx":8,"borderLeft":{"widthPx":4,"color":"#ffb900"}}
/7  box {"surfaceFill":"#f8f5f2","borderRadiusPx":8,"borderLeft":{"widthPx":4,"color":"#50a2ff"}}
/8  box {"surfaceFill":"#e8dfd3","borderRadiusPx":8,"surfaceGradient":{"angleDeg":135,"stops":[{"color":"#f1f5f9","position":0},{"color":"#e2e8f0","position":100}]},"borderLeft":{"widthPx":4,"color":"#90a1b9"}}
/12 box {"surfaceFill":"#d9ccba","borderLeft":{"widthPx":4,"color":"#00d492"}}
/13 box {"surfaceFill":"#d9ccba","borderLeft":{"widthPx":4,"color":"#ffb900"}}
```

The cards are painted correctly. The runs simply stop fitting inside them — compare
two siblings with *identical* L1 geometry (`width: 828` at 1280) in
`$ITER/diff/actual-manifest.json`:

```
[24] "Your private space to think out loud"  box.width 1156  surface {0,1882,1280,1257}  borderLeft null
[25] "A voice-first app that helps you…"     box.width  828  surface {88,2119,896,332}   borderLeft {4, #ffb900}
```

`[25]` fits inside the card and keeps everything; `[24]` runs to `124 + 1156 = 1280`,
the document's right edge, and loses it.

### Hypothesis — where it comes from, by file and line

`packages/framework/src/l1/render.ts`, `geometryRules`:

```ts
2376:  const relaxed = (atPx: number): boolean => nowrapFromPx !== undefined && atPx >= nowrapFromPx
...
2390:  const widthDecls = (atPx: number, value: string): string[] =>
2391:    relaxed(atPx) ? [`width: auto`, `min-width: ${value}`] : [`width: ${value}`]
```

REQ-117's comment above it states the intent exactly, and states the premise that no
longer holds:

> *"`min-width` keeps the captured geometry as the floor while letting the box grow
> with its content, so the paint area grows with it."* … *"Resetting `width` to `auto`
> on the same rung restores the override and **hands sizing to shrink-to-fit**."*

`width: auto` is shrink-to-fit for an **absolutely positioned** box — which is what
every placement was when REQ-117 was written. REQ-278's in-flow frame (same file,
`if (geo.place === 'flow')` at line 2427) emits `position: relative` on a block-level
element, and there `width: auto` means **fill the containing block**. The same
`widthDecls` is called from both frames (line 2398 for the absolute frame, line 2430
for the flow one), so the flow frame inherited a relaxation whose premise is false in
flow.

The served CSS, from `$ITER/site/index.html` (`.l1-16` is the wordmark), rung by rung:

```
base:      position: relative; margin-left: 16px; margin-top: 32px; width: 170px
≥375px:    margin-left: 16px; margin-top: 49px; width: auto; min-width: 343px
≥768px:    margin-left: calc(24px + …); margin-top: calc(83px + …); width: auto; min-width: calc(686px + …)
≥1024px:   margin-left: calc(24px + (64 * (100vw - 1024px) / 256)); width: auto; min-width: calc(686px + …)
≥1280px:   margin-left: calc(88px + (80 * (100vw - 1280px) / 160)); width: auto; min-width: calc(686px + …)
≥1440px:   margin-left: 168px; margin-top: 83px; width: auto; min-width: 686px
.l1-16 {   display: block; … background-image: linear-gradient(90deg, #f5e6a3 0%, #f5e6a3 60%, #ff8c42 90%, #ff6b35 100%);
           -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; margin: 0 }
```

`display: block` + `position: relative` + `width: auto` + `margin-left: 88px` in a
1280px containing block = **1192px**, which is the number the manifest reports.

### Why this is not one site's residual

The predicate is `nowrapFromPx !== undefined && atPx >= nowrapFromPx`, and *every*
flow-placed run with a `nowrapFromPx` at or below the rendered width is affected. On
this page that is **15 runs**, stretched by +88px to +871px:

```
  diff    L1w   renw  nowrapFromPx  text
   871    321   1192           320  'Intentional Software'
   506    686   1192           375  'Gigabyte Alchemy'
   328    828   1156           768  'Your private space to think out loud'
   328    828   1156           768  'AI-powered development methodology and tools'
   328    828   1156           320  "What We're Exploring"
   328    828   1156           768  'More to come as these ideas take shape.'
   296    896   1192           768  'Tools for clarity, presence, and positive connection'
   296    896   1192           375  'A Different Approach'
   296    896   1192           320  'Our Mission'
   296    896   1192          1024  'Our work is guided by a simple belief…'
   296    868   1164          1024  "These aren't just features—they're foundations…"
   296    896   1192           375  "What We're Building"
   296    896   1192          1024  'From personal reflection tools to developer platforms…'
   296    896   1192           320  'The Alchemy'
   296    868   1164          1024  "We're not trying to change you…"
    88    528    616           320  'Protected by Cloudflare Turnstile.'
```

Every run with `nowrapFromPx: null` has `diff 0`. The correlation is exact.

### Proposed change

In `widthDecls`, relax to a value that means shrink-to-fit in **both** frames:

```ts
relaxed(atPx) ? [`width: fit-content`, `min-width: ${value}`] : [`width: ${value}`]
```

`fit-content` is shrink-to-fit under absolute positioning *and* in flow, and it still
grows with longer content — which is REQ-117's whole stated purpose, and it is what
makes the gradient's paint area track the glyphs instead of the column. Add
`max-width: 100%` on the same rung if the floor should not be allowed to overflow a
narrow parent. The `width: auto` reset REQ-117's comment relies on (to stop a lower
rung's `calc()` interpolation leaking upward) is preserved: `fit-content` overrides the
same property.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact

# (a) what L1 says the box is
bin/1c page get repro-gigabytealchemy-ai home --sandbox --json | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']['page']['l1']['root']
def w(n):
    yield n
    for c in n.get('children') or []: yield from w(c)
for n in w(d):
    if n.get('text')=='Gigabyte Alchemy':
        print('L1 width@1280 =', [k for k in n['geometry']['keyframes'] if k['at']==1280][0]['width'])"

# (b) what the served document does with it
python3 -c "
import json
d=json.load(open('storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4/diff/actual-manifest.json'))
print('rendered box =', [e for e in d['elements'] if e.get('text')=='Gigabyte Alchemy'][0]['box'])"

# (c) the declaration that does it
grep -o 'width: auto; min-width: calc(686px[^}]*' \
  storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4/site/index.html

# (d) re-measure end to end after the change
CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-gigabytealchemy-ai \
  --ref storage/references/gigabytealchemy.ai/index --sandbox
```

**Wrong (today):** (a) prints `L1 width@1280 = 686`; (b) prints
`rendered box = {'x': 88, 'y': 83, 'width': 1192, 'height': 90}`; (c) prints
`width: auto; min-width: calc(686px + (0 * (100vw - 768px) / 256))`; (d) reports
`23 delta(s)` and a top region of score 476.38 at `(672, 96) 96×48`.

**Right (fixed):** (a) unchanged at 686; (b) prints a `width` within a pixel of
**685.31**; (c) prints nothing (the declaration is now `width: fit-content`); (d)
reports **10 fewer individual deltas** — the six `borderLeft`, the two 135° gradients
and the two `#f8f5f2` fills above are gone, along with the three systemic aggregates —
and the top three regions on `"Gigabyte Alchemy"` drop out of the ranking, taking
**609.22 of the 1043.47** ranked score with them.

---

## Issue 2 — the fold emits flow siblings out of visual order and repairs the offset with large negative margins, so the document only holds at the sampled widths

**Residual class:** `fold-emits-flow-siblings-out-of-order-and-repairs-with-negative-margins`

**Class: 1 — engine shortfall.** `defect_class: fold-wrong` — the capture carries the
runs in document order and L1 can express them in any order, and the fold writes an
order that requires `margin-top: -946px` to look right. The test: `1c l1-gate` (below)
returns `off-sample FAIL (2 envelope finding(s))` naming two L1 paths whose geometry
keyframes I then read out of `page.json`; the keyframes are negative.

**This is the residual that makes the verdict `structural-failure`.** `gate.json` says
`l1Pass: false` with `layout.pass: true` and `layout.findings: []`, so nothing in
`gate.json` itself says what failed — the answer is only in `1c l1-gate`.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(evidence from this one bundle only).

### Evidence

```
bin/1c l1-gate repro-gigabytealchemy-ai --ref storage/references/gigabytealchemy.ai/index --sandbox
```

returns:

```
acceptance gate on storage/references/gigabytealchemy.ai/index: FAIL
  sample-fidelity     PASS  (maxΔ 0.9px, 0 residual(s), 0 unmatched, 12 in mounted behaviour)
  on-sample           PASS  (0 envelope finding(s) at the captured widths)
  off-sample          FAIL  (2 envelope finding(s))
  content-robustness  FAIL  (116 finding(s))
  recovery (SERVED, graded above): 0.14, 0.15, 0.16, 0.17, 0.19 — 287 finding(s) → 116, at maxΔ 0.9px / 0 fidelity residual(s)
  fold residuals (folder-power gaps): 0
```

The two off-sample findings, at **width 500** — a width between the 375 and 768 rungs,
with the **captured** text, not mutated content:

```json
{"kind":"overlap","detail":"A voice-first app that helps you access clarity… overlaps ✓","paths":["0.15.4","0.15.11.0"]}
{"kind":"overlap","detail":"A voice-first app that helps you access clarity… overlaps Completely on-device—your thoughts never leave your phone","paths":["0.15.4","0.15.11.1"]}
```

And content-robustness fails **at every width**, 19 findings each at 320 / 768 / 1024 /
1280 / 1440 and 21 at 375, concentrated on the same paths
(`0.15.7` ×5, `0.15.11.1` ×4, `0.15.12.1` ×3, `0.15.13.1` ×3, `0.17.2.0.2` ×3,
`0.14.10` ×3, `0.15.6` ×2).

**Why those paths collide.** `$ITER/page.json`, the geometry keyframes of the three
nodes the findings name:

```
0.15.4   'A voice-first app that helps you access clar…'
  [{at:320,x:60,y:16,w:204}, {at:375,x:60,y:16,w:259}, {at:768,x:60,y:16,w:652},
   {at:1024,x:60,y:16,w:828}, {at:1280,x:124,y:16,w:828}, {at:1440,x:204,y:16,w:828}]

0.15.11.0  '✓'
  [{at:320,x:60,y:-946,w:14}, {at:375,x:60,y:-824,w:14}, {at:768,x:60,y:-460,w:14},
   {at:1024,x:60,y:-460,w:14}, {at:1280,x:124,y:-460,w:14}, {at:1440,x:204,y:-460,w:14}]

0.15.11.1  'Completely on-device—your thoughts never lea…'
  [{at:320,x:12,y:-950,w:179}, {at:375,x:12,y:-828,w:234}, {at:768,x:12,y:-464,w:447},
   {at:1024,x:12,y:-464,w:447}, {at:1280,x:12,y:-464,w:447}, {at:1440,x:12,y:-464,w:447}]
```

`y: -946`, `-950`, `-824`, `-828`, `-460`, `-464`. Under REQ-278's flow frame these
compile to `margin-top: -946px` and friends (`render.ts:2429`,
`` `margin-top: ${kf.y}px` ``), interpolated between rungs — so at width 500 the `✓`
row is pulled to `-824 + 364 × (500-375)/(768-375) = -708.2`, while the paragraph above
it has wrapped to a height nobody sampled. They land on top of each other.

**Where the negative numbers come from.** The fold emitted the two cards' children in
the wrong relative order. `$REF/raw.html` has the Sanctum Voice card (h3 + badge +
italic p + p + `<ul>` of three `<li>`) **before** the XGD card and its three `<li>`.
The L1 tree in `$ITER/page.json` has:

```
/15/2  container  'Sanctum Voice' + 'In development'
/15/3  text       'Your private space to think out loud'      (Sanctum)
/15/4  text       'A voice-first app that helps you access…'  (Sanctum)
/15/5  container  'XGD (Extreme Generative Development)' + 'Coming soon'
/15/6  text       'AI-powered development methodology and…'   (XGD)
/15/7  text       'An open-source platform and methodology…'  (XGD)
/15/8  container  '✓' + 'Designed for developers building…'   (XGD)   y  +28
/15/9  container  '✓' + 'Open source and community-driven'    (XGD)   y  +12
/15/10 container  '✓' + 'Practical tools for modern software' (XGD)   y  +12
/15/11 container  '✓' + 'Completely on-device—your thoughts…' (Sanctum) y -460
/15/12 container  '✓' + 'Creates space for deeper reflection' (Sanctum) y -424
/15/13 container  '✓' + 'Optional modules for journaling…'    (Sanctum) y -388
```

Sanctum's three bullets are emitted **after** XGD's three and then dragged ~460px back
up the page. The painted result is right at the sampled widths (`on-sample PASS`,
0 findings; `sample-fidelity` maxΔ 0.9px) and wrong everywhere else. The same shape
appears at `/14/10` (`y: 720 → 271.8`) sitting above `/14/11`'s three-column row
(`y: -237.2`).

### Hypothesis — where it comes from, by file and function

The flow-recovery pass in `tools/generate/src/l1/fold.ts` that promotes a band's runs
into a `container` with `geometry.place: 'flow'` (the `promoted` list `1c l1-gate`
reports — `0.14`, `0.15`, `0.16`, `0.17`, `0.19`) is choosing the child order from
something other than visual reading order — grouping, most likely, by the *kind* of run
(all the plain paragraphs, then all the `<li>` rows) rather than by the document /
geometric order — and then writing `y` as the signed offset from the previous sibling's
flow cursor, which makes the repair arithmetically correct and structurally fragile.

### Proposed change

1. Order flow-promoted siblings by the reference's own reading order (document order
   where the capture has it, top-then-left geometric order otherwise), so that every
   `y` in a flow keyframe is a non-negative gap.
2. Refuse to emit a negative `y` from the flow recovery at all: if the pass wants one,
   it has mis-ordered, and a fold-residual (`foldResiduals`, currently `[]`) is the
   honest output rather than a document that only works at six widths.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact

bin/1c l1-gate repro-gigabytealchemy-ai --ref storage/references/gigabytealchemy.ai/index --sandbox

bin/1c page get repro-gigabytealchemy-ai home --sandbox --json | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']['page']['l1']['root']
def w(n,p='0'):
    yield p,n
    for i,c in enumerate(n.get('children') or []): yield from w(c,p+'.'+str(i))
for p,n in w(d):
    for k in (n.get('geometry') or {}).get('keyframes') or []:
        if k.get('y',0) < 0:
            print(p, repr((n.get('text') or '')[:40]), k); break"
```

**Wrong (today):** the first command prints `off-sample FAIL (2 envelope finding(s))`
and `content-robustness FAIL (116 finding(s))`; the second prints 9 nodes with negative
keyframe `y`, the largest `0.15.11.1 'Completely on-device…' {'at': 320, 'x': 12,
'y': -950, 'width': 179, 'atHeight': 800}`.

**Right (fixed):** the first command prints `off-sample PASS` and a
content-robustness count in the low single digits or zero; the second prints nothing.
`on-sample` must stay `PASS` and `sample-fidelity` must stay at `maxΔ ≤ 0.9px` with
`0 residual(s)` — the reordering has to be invisible at the sampled widths.

---

## Issue 3 — the capture reads `a11yRole` on the text node while reading `href` and `headingLevel` on the semantic ancestor, so a heading or link wrapped in a `<span>` is recorded as `generic`

**Residual class:** `capture-reads-a11yrole-on-the-text-node-not-the-semantic-ancestor`

**Class: instrument.** `defect_class: instrument-asymmetric` — the two sides are
measured by the same function over different DOM shapes, and the difference it reports
is entirely its own. The test: I read the same record's own neighbouring fields. The
reference record for `"Gigabyte Alchemy"` carries `"a11yRole": "generic"` **and**
`"href": "/"`; the record for `"Intentional Software"` carries `"a11yRole": "generic"`
**and** `"headingLevel": 1`. A record cannot have an href and not be in a link.

**These are the two highest-severity deltas in the whole run** (`severity 3100`, tier
`HIGH`, the top two of 23) and **they point the wrong way** — the reproduction is
correct and the oracle is not:

```
a11yRole "Gigabyte Alchemy"      expected generic  actual link     HIGH 3100
a11yRole "Intentional Software"  expected generic  actual heading  HIGH 3100
```

A round that "fixed" these would delete the heading and link semantics REQ-269 was
filed to add.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(evidence from this one bundle only).

### Evidence

`$REF/raw.html` — both texts are wrapped in a presentational `<span>` inside the
semantic element, which is exactly what a gradient-text or colour-accent treatment
requires:

```html
<a href="/" class="text-4xl …"><span style="background: linear-gradient(90deg,…); background-clip: text;"> Gigabyte Alchemy </span></a>
<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-6"><span style="color: #FBBA72;">Intentional Software</span></h1>
```

`$ITER/diff/expected-manifest.json` (the oracle side):

```json
{"text":"Gigabyte Alchemy",     "role":"body", "a11yRole":"generic", "href":"/"}
{"text":"Intentional Software", "role":"body", "a11yRole":"generic", "headingLevel":1}
```

`$ITER/diff/actual-manifest.json` (the reproduction side):

```json
{"text":"Gigabyte Alchemy",     "role":"link",    "a11yRole":"link",    "href":"/"}
{"text":"Intentional Software", "role":"heading", "a11yRole":"heading", "headingLevel":1}
```

The other nine headings on the page agree on both sides, because their `<h2>`/`<h3>`
owns the text directly with no wrapper.

### Hypothesis — where it comes from, by file and line

`tools/generate/src/cli/capture/extract.ts`, three sibling functions, all called on the
same `el` at lines 1815/1818/1822:

```js
1211:  function hrefOf(el) {
1212:    var a = el.closest ? el.closest('a[href]') : null;        // walks UP
...
1234:  function headingLevelOf(el) {
1235:    var h = el.closest ? el.closest('h1,h2,h3,h4,h5,h6,[role="heading"]') : null;   // walks UP
...
1264:  function a11yRoleOf(el) {
1265:    var explicit = el.getAttribute && el.getAttribute('role');  // el ONLY
1266:    if (explicit) return explicit.trim().toLowerCase();
1267:    var t = el.tagName.toLowerCase();                           // el ONLY
```

`hrefOf` and `headingLevelOf` resolve from the nearest semantic ancestor.
`a11yRoleOf` does not walk at all. When the run's owning element is the inner `<span>`,
the first two find the `<a>`/`<h1>` and the third returns `'generic'`.

On the reproduction side the same function returns the right answer, because the
renderer emits the `<a>`/`<h1>` *directly* around the text (there is no presentational
span in an L1 render). Same function, different DOM shape, not a like-for-like
comparison.

### Proposed change

Give `a11yRoleOf` the same ancestor resolution its two neighbours already have — e.g.
`el.closest('[role],a[href],button,h1,h2,h3,h4,h5,h6,input,textarea,select,img,hr')`,
falling back to `el` — so that the role is read at the element the href and the heading
level were read at.

**This is persisted, so it needs a re-capture.** `$REF/capture.json` carries
`"a11yRole"` 59 times; the stored value is what the oracle reports. `1c refold` cannot
pick the fix up. The commit should say so, and the operator must press **recapture**
for the two deltas to clear.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact

python3 -c "
import json
d=json.load(open('storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4/diff/expected-manifest.json'))
for e in d['elements']:
    if e.get('href') or e.get('headingLevel'):
        print(repr(e['text'][:34]), 'a11yRole=',e['a11yRole'], 'href=',e.get('href'), 'headingLevel=',e.get('headingLevel'))"

grep -o '<a href=\"/\"[^>]*>' storage/references/gigabytealchemy.ai/index/raw.html | head -1
```

**Wrong (today):** the first command prints, among others,
`'Gigabyte Alchemy' a11yRole= generic href= / headingLevel= None` and
`'Intentional Software' a11yRole= generic href= None headingLevel= 1` — two records
that carry link/heading evidence and a `generic` role.

**Right (fixed, after a re-capture):** no record in that listing has
`a11yRole= generic`; `"Gigabyte Alchemy"` reads `a11yRole= link` and
`"Intentional Software"` reads `a11yRole= heading`, and the two HIGH `a11yRole` deltas
disappear from `values-diff.json`.

---

## Issue 4 — a translucent scrim is reported on `surfaceFill` by the reference and on `surfaceGradient` by the reproduction, with the alpha dropped on both sides

**Residual class:** `run-surface-drops-scrim-alpha-and-lands-on-a-different-axis-per-side`

**Class: instrument.** `defect_class: instrument-asymmetric` — both sides paint the
same 30% navy veil over the same hero image, and the run-level surface axes describe it
two different ways, neither of them true. The test: I read the *band* record in the
same two manifests and they **agree** (`overlay {color:#030717, opacity:0.3}` on both,
`surfaceFill: null` on both, `sectionPairing` overlap 1.0, zero section deltas). Only
the run-level axes disagree, so the disagreement is in the run-surface projection, not
in what is painted.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(evidence from this one bundle only).

### Evidence

8 of the 20 individual deltas, all four hero runs, from `$ITER/diff/values-diff.json`:

```
surfaceGradient "Gigabyte Alchemy"                                none → 180° [#030717, #030717]  MEDIUM 2020
surfaceGradient "Intentional Software"                            none → 180° [#030717, #030717]  MEDIUM 2020
surfaceGradient "Tools for clarity, presence, and positive…"      none → 180° [#030717, #030717]  MEDIUM 2020
surfaceGradient "We're a software studio building technology…"    none → 180° [#030717, #030717]  MEDIUM 2020
surfaceFill     "Gigabyte Alchemy"                             #030717 → #e8dfd3                  LOW 1060.44
surfaceFill     "Intentional Software"                         #030717 → #e8dfd3                  LOW 1060.44
surfaceFill     "Tools for clarity, presence, and positive…"   #030717 → #e8dfd3                  LOW 1060.44
surfaceFill     "We're a software studio building technology…" #030717 → #e8dfd3                  LOW 1060.44
```

These are **not** issue 1: `"We're a software studio…"` is one of the runs whose width
is *not* stretched (L1 768, rendered 768) and it is a delta anyway.

**What is actually painted.** `$REF/raw.html`:

```html
<section class="relative min-h-screen bg-cover bg-center bg-no-repeat" style="background-image: url('/images/AlchemistLabWithTech.png');">
  <div class="absolute inset-0 bg-slate-950/30"></div>
```

— a separate absolutely-positioned element with a **translucent background-colour**.

`$ITER/site/index.html` (the reproduction):

```css
background-image: linear-gradient(#0307174d, #0307174d), url("assets/AlchemistLabWithTech.png"); background-size: cover; background-position: center; background-repeat: no-repeat
```

— the same veil as a **gradient layer**, and `4d` = 77/255 = **0.302**, which is right.
`$ITER/page.json` node `/5` carries `{"backgroundImageUrl":"/assets/AlchemistLabWithTech.png","overlay":{"color":"#030717","opacity":0.3}}` — L1 is right and the
renderer is right. The reproduction is innocent.

**The band records agree; only the run records disagree.** From the `sections` arrays
of the two manifests:

```
expected §1: {"overlay":{"color":"#030717","opacity":0.3}, "surfaceFill":null, "backgroundImageUrl":"assets/AlchemistLabWithTech.png", "box":{0,0,1280,800}}
actual   §0: {"overlay":{"color":"#030717","opacity":0.3}, "surfaceFill":null, "backgroundImageUrl":"http://localhost:56224/assets/AlchemistLabWithTech.png", "box":{0,0,1280,800}}
```

`sectionPairing` gives them `overlap: 1`, and the section pass produces **zero**
deltas. So the band-scope axes already carry the alpha correctly; the run-scope ones
throw it away — the reference collapsing the veil into an opaque `surfaceFill:
"#030717"`, the reproduction collapsing it into an opaque `surfaceGradient` with two
identical stops and reporting the body background `#e8dfd3` underneath as its fill.

### Hypothesis — where it comes from, by file and function

`tools/generate/src/cli/capture/extract.ts`: `surfaceFillOf` and `surfaceGradientOf`
(`extract.ts:994` and `extract.ts:1093`, called at 1787/1790) answer "what colour is behind
this run" with an opaque colour and no alpha channel, and they have no notion of an
overlay — so a veil reaches one of them or the other depending on whether the page
painted it as a `background-color` on a sibling or as a gradient layer on the box. This
is [[BUG-24]]'s alpha loss (`free_and_reconciled` — fixed at band scope, where
`overlay {color, opacity}` now exists) surviving at run scope, and it is adjacent to
[[REQ-271]] (`ready_to_reconcile`), which is about the **band** axes and does not
describe the run ones.

Two independent defects sit here:

- **no alpha** — `#0307174d` is reported as `#030717` on the actual side, and
  `rgba(2,6,23,0.3)` as `#030717` on the reference side;
- **no normalisation** — a gradient whose stops are all one colour is a flat fill, and
  `values-diff.ts` compares `surfaceGradient` and `surfaceFill` as independent axes, so
  the same veil on two different axes is two deltas rather than none.

### Proposed change

1. Report a run's surface as the same `{fill, gradient, overlay}` triple the band record
   already carries, alpha included, so the two scopes cannot disagree.
2. Normalise in `values-diff.ts` before comparing: a `surfaceGradient` whose stops are
   all the same colour collapses to a `surfaceFill` of that colour, on both sides.

Do (1) before (2): normalising alone would turn `180° [#030717, #030717]` into
`#030717` on the actual side and then compare it against `#e8dfd3` — still a delta, and
a more confusing one.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact

python3 -c "
import json
b='storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4/diff/'
for f in ('expected-manifest.json','actual-manifest.json'):
    d=json.load(open(b+f))
    e=[x for x in d['elements'] if x.get('text')=='Intentional Software'][0]
    print(f, 'run  fill=',e['surfaceFill'],' gradient=',json.dumps(e['surfaceGradient']))
    s=[x for x in d['sections'] if x['box']['height']==800][0]
    print(f, 'band fill=',s['surfaceFill'],' overlay=',json.dumps(s['overlay']))"

grep -o 'linear-gradient(#0307174d, #0307174d)' \
  storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4/site/index.html
grep -o 'bg-slate-950/30' storage/references/gigabytealchemy.ai/index/raw.html
```

**Wrong (today):** the first command prints, for the same run, reference
`fill= #030717  gradient= null` against reproduction
`fill= #e8dfd3  gradient= {"angleDeg": 180, "stops": [{"color": "#030717", "position": null}, {"color": "#030717", "position": null}]}`, while both **band** lines read
`fill= None  overlay= {"color": "#030717", "opacity": 0.3}`.

**Right (fixed):** the two run lines agree with each other and with their band lines —
the veil is reported once, with its 0.3, and the 8 deltas above are gone.

---

## Issue 5 — the capture bundle drops three of a run's four padding sides and its text-align, so four axes the comparator can read are unmeasured on every reference

**Residual class:** `capture-bundle-drops-three-padding-sides-and-textalign-from-a-run`

**Class: 1 — engine shortfall.** `defect_class: capture-loses-it` — the extractor
measures all four values in the browser and the persisted record throws three of them
away, so nothing downstream can recover them. The test: I looked for the fields in the
`ContentRun` interface and in the bundle. Both say no.

**This is 4 of the round's 5 unmeasured** — the number this loop exists to drive down.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(and, per `gate.json`'s own wording, every reference bundle).

### Evidence

`$ITER/diff/gate.json`, `values.unmeasuredAxes` — four entries, all
`"scope": "element"`, `"side": "reference"`:

```
paddingTopPx / paddingRightPx / paddingBottomPx / textAlign
reason: "ContentRun does not record it — REQ-64 added the axis to RawRun and to the
comparator but not to the capture bundle, and REQ-269 #1 added it to a text-free Field
only. The extractor has to record it before the reference can read it."
```

I confirmed each half of that against the source rather than trusting the summary.

**The browser measures all four.** `tools/generate/src/cli/capture/extract.ts:1796-1804`:

```js
paddingLeftPx: Math.round(parseFloat(s.paddingLeft)) || 0,
// REQ-64 — the other three padding sides + normalized text-align (Type-A).
paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
paddingRightPx: Math.round(parseFloat(s.paddingRight)) || 0,
paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
textAlign: s.textAlign === 'center' ? 'center' : …
```

**The persisted record keeps one.** `tools/generate/src/cli/capture/sections.ts:72`,
`toContentRun(r: RawRun): ContentRun`:

```ts
const run: ContentRun = {
  role: r.role, text: r.text, color: r.color, fontFamily: r.fontFamily,
  fontSizePx: r.fontSizePx, fontWeight: r.fontWeight, letterSpacingPx: r.letterSpacingPx,
  gradient: normalizeGradient(r.gradientCss), borderLeft,
  paddingLeftPx: r.paddingLeftPx,          // ← and only this one
}
```

and `ContentRun` itself (`tools/generate/src/cli/capture/types.ts:507-602`) declares
`paddingLeftPx` and neither `paddingTopPx`, `paddingRightPx`, `paddingBottomPx` nor
`textAlign`.

**The bundle proves it.** `$REF/capture.json` key counts:

```
paddingLeftPx    59      paddingTopPx  4      paddingRightPx  4
paddingBottomPx   4      textAlign     0
```

The four `paddingTopPx` are REQ-269's form `Field`s. `textAlign` occurs **zero times**
in a 130KB capture of a page with 59 runs. The reproduction side carries all four
(`$ITER/diff/actual-manifest.json` every run has `paddingTopPx`/`paddingRightPx`/
`paddingBottomPx`/`textAlign`), so the comparator is ready and only one side can speak.

### Proposed change

Add `paddingTopPx`, `paddingRightPx`, `paddingBottomPx` and `textAlign` to the
`ContentRun` interface and copy them in `toContentRun`, beside `paddingLeftPx`. Bump
`captureSchema` past 4, and add a `schema.ts` presence probe for them next to the
existing one at `schema.ts:111-113`, so a bundle written before the change is detected
rather than read as clean.

**This will raise the delta count**, by making 4 axes × 59 matched runs into
comparisons that currently return nothing. Per [[REQ-277]] that is the instrument
getting finer, not the reproduction getting worse, and `unmeasured` drops from 5 to 1.

**And it needs a re-capture**: the values are persisted, so `1c refold` cannot pick
them up.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact

python3 -c "
import json
d=json.load(open('storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4/diff/gate.json'))
for a in d['values']['unmeasuredAxes']: print(a['scope'], a['axis'], a['side'])"

python3 -c "
import json; s=json.dumps(json.load(open('storage/references/gigabytealchemy.ai/index/capture.json')))
for k in ('paddingLeftPx','paddingTopPx','paddingRightPx','paddingBottomPx','textAlign'):
    print(k, s.count('\"%s\"'%k))"
```

**Wrong (today):** the first prints four `element … reference` rows; the second prints
`paddingLeftPx 59 / paddingTopPx 4 / paddingRightPx 4 / paddingBottomPx 4 / textAlign 0`.

**Right (fixed, after a re-capture):** the first prints nothing (and `gate.json`'s
headline unmeasured count falls from 5 to 1, the remaining 1 being the unpaired header
band); the second prints `59` for all five keys.

---

## Issue 6 — the fold rounds a run's geometry to whole pixels, shifting runs by up to half a pixel

**Residual class:** `fold-rounds-run-geometry-to-whole-pixels`

**Class: 1 — engine shortfall.** `defect_class: fold-wrong` — the capture carries
`149.546875`, and L1's keyframe schema accepts it —
`l1KeyframeSchema` (`packages/site-schema/src/l1/schema.ts:38-44`) types `x`/`y`/`width`
as `finite`, not as integers — and the fold writes `150`. The test: I compared
the two manifests' boxes for a run with no other measured difference and found the
delta was exactly the rounding.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(evidence from this one bundle only).

### Evidence

`$ITER/diff/regions.json`, three ranked regions whose `nodes` are the **same run on
both sides** with no values-diff delta between them:

- **#4** `bbox {x: 512, y: 2688, w: 48, h: 16}` · score **78.11** · meanDiff 26.04 ·
  ref `"Designed for developers building AI-enhanced workflows"` box
  `{x: 149.55, y: 2683.25, w: 413.23, h: 24}` · actual, same text, box
  `{x: 150, y: 2683.19, w: 414, h: 24}`
- **#9** `bbox {x: 640, y: 2400, w: 16, h: 16}` · score **25.25** · ref
  `"Optional modules for journaling, dreams, gratitude, and personal growth"` box
  `{x: 149.55, y: 2391.25, w: 520.67, h: 24}` · actual box `{x: 150, y: 2391.19, w: 521, h: 24}`
- **#10** `bbox {x: 464, y: 2400, w: 16, h: 16}` · score **24.33** · same pair of nodes

**127.69 of 1043.47 = 12.2% of the ranked score**, and the only measured difference
between the two sides is `149.546875 → 150` and `413.234375 → 414` — a 0.45px
horizontal shift, which is enough to change every glyph's subpixel rasterisation across
the run and to score ~26/255 on a 16px block.

### Hypothesis — where it comes from, by file and line

`tools/generate/src/l1/fold.ts`:

```ts
1491:      x: Math.round(e.sv.box!.x),
1492:      y: Math.round(e.sv.box!.y),
1493:      width: Math.round(e.sv.box!.width),
1494:      height: Math.round(e.sv.box!.height),
```

and the same four at `1942-1945`. The file already has a `round2` helper
(`fold.ts:465`, `Math.round(n * 100) / 100`) used for line-height and letter-spacing,
so the precision convention exists and geometry is not using it.

### Proposed change

Use the existing `round2` for keyframe `x`/`y`/`width`/`height`, as
`lineHeightPx`/`letterSpacingPx` already do. Two decimals is well inside what a browser
resolves and removes the systematic half-pixel.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact

python3 -c "
import json
b='storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-4/diff/'
t='Designed for developers building AI-enhanced workflows'
for f in ('expected-manifest.json','actual-manifest.json'):
    e=[x for x in json.load(open(b+f))['elements'] if x.get('text')==t][0]
    print(f, e['box'])"
```

**Wrong (today):** prints
`expected-manifest.json {'x': 149.546875, 'y': 2683.25, 'width': 413.234375, 'height': 24}`
against
`actual-manifest.json {'x': 150, 'y': 2683.1875, 'width': 414, 'height': 24}`.

**Right (fixed):** the actual `x` reads `149.55` and `width` reads `413.23`, and
regions #4, #9 and #10 (127.69 of the ranked score) fall out of the ranking.

---

## Issue 7 — 306.56 of the ranked score that this round cannot attribute

**Residual class:** not named — this is the honest gap.

**`defect_class: cannot-tell`.** The evidence in hand does not separate the instrument
from the engine here, and a forced choice would be noise.

Four ranked regions, **306.56 of 1043.47 = 29.4%**, have a lead on both sides, the
**same** text, boxes agreeing to within 0.25px, and **zero** values-diff deltas on the
runs underneath:

| region | bbox | score | ref box | actual box |
|---|---|---|---|---|
| #2 | `{720, 3936, 64, 16}` | 129.16 | `"Your message"` textbox `{664, 3916, 528, 146}` | same text, `{664, 3916.23, 528, 146}` |
| #3 | `{128, 3344, 64, 16}` | 116.77 | `"Our name isn't accidental…"` `{88, 3307.25, 896, 58.5}` | `{88, 3307.19, 896, 58.5}` |
| #7 | `{688, 3936, 16, 16}` | 30.32 | `"Your message"` `{664, 3916, 528, 146}` | `{664, 3916.23, 528, 146}` |
| #8 | `{128, 3504, 16, 16}` | 30.31 | `"That's what we're building…"` `{88, 3472.25, 896, 58.5}` | `{88, 3472.19, 896, 58.5}` |

The `"Your message"` control's four compared params are all `mismatch: false` in
`values-diff.json` (`name`, `nameSource`, `placeholderColor "#746f69"`, `box "(664,
3916) 528×146"`), so the value gate sees nothing, and the two runs in #3/#8 are
byte-identical on every compared axis.

**What would separate it.** A numeric readout of the two crops — a per-channel
histogram or a per-column mean over `region-N-ref.png` and `region-N-ours.png`,
emitted as JSON by the region ranker or by `1c aligned-crops --json`. That single
number would say whether the residual is a hue difference (a colour axis the comparator
does not carry — `instrument-no-axis`) or a glyph-position difference (subpixel
rasterisation, at most a sibling of issue 6). Today the only way to tell is to open the
PNG, which is the reconstruction [[DOC-19]] forbids, so this round declines to guess.
That sentence is the next round's starting point.


---

# As built — REQ-302 free-coded implementation

All seven issues are implemented. This section records what the code actually
does where it differs from the "Proposed change" written during diagnosis, so
the ticket matches the implementation rather than the plan.

## Issue 1 — `width: fit-content`, one keyword for both placement frames

**Changed:** `packages/framework/src/l1/render.ts`, `geometryRules`' `widthDecls`.

A relaxed rung now emits `width: fit-content; min-width: <captured>px` instead
of `width: auto; min-width: <captured>px`.

REQ-117 wrote `auto` when every placement was absolute, where `auto` IS
shrink-to-fit. REQ-278's flow frame emits `position: relative` on a block-level
box, and there `auto` means "fill the containing block". `fit-content` is
shrink-to-fit in BOTH frames and still grows with longer content, which is
REQ-117's whole stated purpose — so one declaration serves both and no second
code path keyed on placement was added.

**Measured on the UAT fixture, both ways:** with `auto` the flow-placed
wordmark renders **1256px** wide in a 1280px column and **1416px** in a 1440px
one — it tracks the column. With `fit-content` it renders **686px** at both,
which is its captured width.

The two pre-existing REQ-117 tests (`req117-nowrap-width-is-a-floor.test.ts`,
`reconciliation-nowrap-width-floor.test.ts`) were updated: each now reads the
relaxed keyword from a single `RELAXED` constant, so the counterfactual
stylesheet the AC-1009 test synthesises can never drift from the emitter.

## Issue 2 — the anchor is recorded at the source, not sorted out in the fold

**Changed:** `extract.ts` (`runsUnder`, `contentWithItemAnchor`, band assembly),
`types.ts` (`RawBand.itemsAt`, `Section.itemsAt`), `sections.ts`
(`sectionFromBands` re-bases the anchor onto coalesced content),
`values-diff.ts` (new exported `runsInDocumentOrder`, used by BOTH
`flattenCapture` and `flattenSignals`).

The diagnosis located this in the fold. The root cause is upstream of it:
`itemGroup` lifts a band's repeated rows out of the content walk and both
projections re-appended them after ALL of the band's content. The fix records
the emitted index the lifted subtree sat at (`itemsAt`, parallel to `items`)
and splices the rows back in there, so the fold is handed reading order rather
than asked to sort its way out of an inversion.

Both projections read the anchor, so the two sides of a diff are ordered by one
rule — reordering only one side would pair every run in the band against the
wrong one.

**Deliberately absent in two places**, both of which append, which is what
every reader did before the anchor existed:
- a bundle written before REQ-302 (no anchor recorded);
- the geometric-slice path, where a slice is a box rather than a DOM subtree,
  its runs were collected once from the flat root and then PARTITIONED by box,
  and "the index this row sits at within this slice's content" is not a
  question the walk answered.

**Measured on the UAT fixture** (`req302-item-order.html`, two cards of
different classes so the card row is not a uniform group and the walk descends
into the first card's `<ul>`): the extractor records `itemsAt: [2, 2]` — both
bullet rows anchored immediately after card A's copy, before `Second Card
Heading`. Without the anchor they projected after the SECOND card's copy.

## Issue 3 — `a11yRoleOf` resolves at the semantic ancestor

**Changed:** `extract.ts` — new `semanticOf(el)` helper
(`el.closest('[role],a[href],button,h1,h2,h3,h4,h5,h6,input,textarea,select,img,hr')`,
falling back to `el`), applied at the head of `a11yRoleOf`. This is the
resolution `hrefOf` and `headingLevelOf` already had.

**Measured on `req302-semantics.html`:** `Gigabyte Alchemy` (gradient-text span
inside `<a href="/">`) reads `a11yRole: link`; `Intentional Software` (colour
-accent span inside `<h1>`) reads `heading`; an unwrapped `<h2>` is unchanged
at `heading`; and a plain `<p>` still reads `generic` — walking up must not
invent semantics for a run that has none.

## Issue 4 — a flat gradient is a fill, composited with its alpha

**Changed:** `extract.ts` — `gradientColors` (factored out of `gradientScrim`),
new `flatGradientRgba`, and both `surfaceFillOf` and `surfaceGradientOf`.

The diagnosis proposed reporting a `{fill, gradient, overlay}` triple at run
scope plus a normalisation step in `values-diff.ts`. **What was built instead
closes the asymmetry at its source**, which removes the need for both:

A "gradient" whose every colour stop resolves to the SAME colour is not a
gradient — it is a flat fill painted as a background LAYER rather than as a
`background-color`. The two are indistinguishable on the page and were not
indistinguishable to the extractor, which is the whole defect. So:

- `surfaceFillOf` now composites a flat gradient layer at each step of the
  surface chain, above that element's own `background-color` (a background
  image paints on top of it) — **alpha included**, exactly as it already
  composited a translucent `background-color`;
- `surfaceGradientOf` no longer reports a flat gradient as a gradient. An
  OPAQUE flat gradient still ends the walk, the way a solid fill does.

This is strictly better than normalising in the comparator: the veil is
reported once, on one axis, with its alpha, and HOW THE PAGE AUTHORED IT stops
being something the instrument can see at all. No `values-diff.ts`
normalisation was added, and none is needed.

**Measured on the two UAT fixtures** — the same 30% `#030717` veil over the
same hero, authored as a sibling `<div style="background: rgba(3,7,23,.3)">`
and as `linear-gradient(#0307174d, #0307174d)` on the box itself. Both now
report `surfaceFill: #a39e9b` and `surfaceGradient: null`. `#a39e9b` is
`0.3 × #030717 + 0.7 × #e8dfd3` — the veil composited over what is behind it,
which is neither of the two wrong answers the round measured (the opaque
`#030717` from the reference side, the backstop `#e8dfd3` from the
reproduction side). A genuine multi-colour ramp — the wordmark's
`background-clip: text` treatment — is untouched.

## Issue 5 — the four axes reach `ContentRun`, and the axis table stops
declaring a gap it no longer has

**Changed:** `types.ts` (`ContentRun.paddingTopPx` / `paddingRightPx` /
`paddingBottomPx` / `textAlign`, all optional so pre-REQ-302 bundles parse),
`sections.ts` (`toContentRun` copies all four beside `paddingLeftPx`),
`value-axes.ts`.

The second half matters as much as the first: while `ContentRun` could not
answer, REQ-274's table declared the four reference-side `unsupplied`, which is
what made them reach the gate as UNMEASURED rather than passing as clean. With
the bundle recording them that declaration is **withdrawn** — `RUN_TYPE_A_GAP`
is deleted and all four rows now use `sharedRun`, so both sides read the same
way `paddingLeftPx` beside them always has. Leaving it in place would have had
the instrument reporting a gap it no longer has, and 4-of-5-unmeasured would
never have fallen.

Presence, not truthiness: a measured `0` reaches the bundle as `0`, so a page
that pads nothing is not mistaken for a page that could not be measured.

## Issue 6 — two decimals everywhere geometry is derived

**Changed:** `fold.ts` — `round2` (already present, already used for
`lineHeightPx` / `letterSpacingPx`) replaces `Math.round` for keyframe
`x`/`y`/`width`/`height` at all five sites; new `ceil2` for the one width that
must round UP. `probes.ts` — the derived-offset `round` helper goes from a
tenth of a pixel to a hundredth.

`ceil2` preserves REQ-117's constraint that a nowrap floor must CONTAIN the
measured content (`Gigabyte Alchemy` measured 685.31 and a nearest-round pinned
it at 685, reflowing the hero title onto a second line the reference never
had). The ceiling is now at two decimals rather than at whole pixels — a
smaller over-allocation, still never an under-allocation.

`probes.ts` is included because its offsets are DERIVED from the fold's
keyframes: a lead rounded to a tenth puts a run that measured 149.55 back at
149.5, and the half-pixel the fold just stopped introducing comes back one
level down.

## Issue 7 — `regionReadout`, emitted beside the crops

**Changed:** `perceptual-core.ts` (new `RegionReadout`, `PROFILE_BUCKETS`,
`regionReadout`), `perceptual.ts` (re-export; `readout` on every ranked region
of `PerceptualDiffReport`; a `ΔRGB / |Δ| / peak col` line in
`formatDiffReport`).

This is the "what would separate it" sentence from the diagnosis, built. The
discriminator is the SHAPE of the difference, not its size:

- a **colour** residual moves the whole crop together — large flat `deltaRgb`,
  broad `columnDiff`;
- a **glyph-position** residual leaves the average colour almost untouched —
  `deltaRgb` near zero — and concentrates into narrow spikes at stem edges, so
  `columnDiff` is peaky and `rowDiff` is confined to the text band.

Both profiles are bucketed to at most 64 entries so a full-width region does
not write a thousand numbers into `regions.json`; the shape survives the
bucketing, which is all that is read off it. The readout is measured off the
SAME two rasters the crops are cut from, in the same loop, so the numbers and
the PNGs can never describe different pixels.

It is emitted **beside** the PNGs, not instead of them — the point is that a
number can be read by the round that has to attribute the residual, where a PNG
can only be looked at, which is the reconstruction DOC-19 forbids.

## Both persisted fixes need a re-capture

`captureSchema` is bumped **4 → 5**, and `CAPTURE_SCHEMA_AXES` gains four
probes so a bundle written before this change is NAMED as stale rather than
read as clean:

- `paddingTopPx/paddingRightPx/paddingBottomPx` and `textAlign` on a content
  run — plain presence probes ("the key exists"), because a measured 0 is a
  measurement and an absent key is the projection dropping it;
- `a11yRole resolved at the semantic ancestor` — NOT a presence question, since
  `a11yRole` has always been written. What a pre-REQ-302 bundle carries is a
  CONTRADICTION: a run with an `href` (or a `headingLevel`) whose role is
  `generic`. A document cannot be in that state, so seeing the pair is proof
  the bundle predates the fix. Not seeing it proves nothing — which is exactly
  the asymmetry every probe in this table is documented to have: it only ever
  REMOVES the axis from a finding;
- `itemsAt` — asked the only way it can be, as "does any section that HAS items
  lack the anchor", since a section with no repeated rows records no anchor
  however new its extractor is.

Issues 1, 2 (projection half), 6 and 7 take effect on `1c refold` / `1c diff`.
Issues 3, 4 and 5 are persisted and **the operator must press recapture** for
the corresponding deltas to clear.

## Test plan — as implemented

Six UAT files, 29 tests, all named `test_UAT_FC_REQ-302_*`. Verified RED by
reverting the eleven changed source files and re-running: **23 of the 29 fail**
without the fix. The 6 that pass are the deliberate controls and
compatibility legs (an anchorless bundle still appends; a real multi-colour
gradient survives; an unwrapped element is unaffected; a plain run stays
`generic`; a current bundle is not told to re-capture).

| file | issues | browser |
|---|---|---|
| `test_UAT_FC_REQ-302_a_flow_placed_run_shrinks_to_fit.test.ts` | 1 | one leg |
| `test_UAT_FC_REQ-302_runs_in_document_order.test.ts` | 2 | no |
| `test_UAT_FC_REQ-302_the_bundle_records_what_it_measured.test.ts` | 3, 5 | no |
| `test_UAT_FC_REQ-302_fold_keeps_subpixel_geometry.test.ts` | 6 | no |
| `test_UAT_FC_REQ-302_region_readout.test.ts` | 7 | no |
| `test_UAT_FC_REQ-302_the_extractor_reads_the_page_as_it_is.test.ts` | 2, 3, 4, 5 | all |

Four fixtures under `tests/fixtures/capture/`: `req302-semantics.html`,
`req302-scrim-sibling.html`, `req302-scrim-gradient.html`,
`req302-item-order.html`.

The browser legs skip cleanly where Chromium cannot launch, matching the
repo's existing convention. In an agent sandbox they run under
`CHROMIUM_LAUNCH_ARGS=--single-process` (REQ-262 D9) — all 29 were verified
green that way, not merely skipped.


---

# As built — what closing these seven cost elsewhere

Five of the seven fixes change an answer that an EARLIER ticket's evidence had
pinned. In every case below the earlier capability is still true and still
proven; what moved is the specific number or the specific live example its test
happened to be written against. Recording it here because a reader of this
ticket should not have to discover from a diff that REQ-302 reached into six
other test files, and because one of the repairs required a small production
change of its own.

Nine tests across six files failed on the first full sweep after the seven
fixes landed. All nine are this category. None was a defect introduced by
REQ-302, and none was repaired by weakening what it tested.

## The one production consequence — `diffManifests` needed a seam (REQ-274)

**Changed:** `values-diff.ts` — new optional `DiffOptions.declaredUnmeasured`,
forwarded to the `observedUnmeasuredAxes(expected, actual, declared)` call.

Issue 5 does not merely record four axes; it withdraws the last entry in
`UNMEASURED_AXES`, so that table is now **empty**. REQ-274's capability is "a
compared axis the table can read on only ONE side is REPORTED as unmeasured
rather than passing as clean", and its evidence was necessarily written against
whatever live gap existed at the time — these four. Closing the last gap left
that test with no live example to drive the reporting path with.

The axis table's own function already took its declared list as a parameter;
`diffManifests` was the one step that did not forward it. Adding that forward
lets REQ-274 declare a synthetic one-sided axis and prove the reporting path on
it directly. **Production callers pass nothing and get the live table,
unchanged** — this adds a test seam, not a second behaviour.

The alternative was to leave a measurement gap open on purpose so that a test
about gap-REPORTING would keep having one to look at. That is backwards: the
declaration exists so a gap can be seen and then closed, and an empty
`UNMEASURED_AXES` is what "all five instances are closed" looks like. REQ-274's
assertion on the live table is now `[]` and is documented as that success
condition, with the shape of a row still pinned against whatever the table
declares if it ever declares one again.

## Issue 6's precision change moves three pinned numbers

`req265-line-box-and-placeholder-ink.test.ts`, `req88-surface-shape-and-fontface.test.ts`
(two tests). Each pinned a whole-pixel result of the geometry the fold now
writes at two decimals:

- REQ-265's line-box top moves `83` → **`82.5`**. What REQ-265 pins is the
  DISTINCTION — the line-box top rather than the content-area top — so the test
  now asserts `82.5` **and** separately asserts it is not the `79` content-area
  value it replaced, which is the invariant stated in a way the fold's precision
  cannot move again.
- REQ-88's text-leaf width goes from `Math.ceil` to ceiling-at-two-decimals. The
  invariant REQ-88 pins is the DIRECTION — a text box rounds up, never down,
  because rounding down reflows it — and the finer grid makes the
  over-allocation smaller without weakening it.
- REQ-88's box-leaf test proves a surface box rounds NEAREST where a text leaf
  ceils. Its fixture's `896.4` ceils and rounds to the same value at two
  decimals and so no longer discriminates; the fixture moves to `896.401`,
  which rounds down to `896.4` where a ceiling would give `896.41`. The
  distinction the UAT exists for is restored, one decimal place further in.

## Issue 5's schema bump un-pins a live constant (REQ-275)

`test_UAT_FC_REQ-275_capture_completeness_audit.test.ts` asserted
`CAPTURE_SCHEMA === 4`. REQ-302 stamps 5. That UAT is about REQ-275's four axes
coming out of ONE mechanical pass and sharing ONE bump — a property of the
schema-4 group, which stays true however far the stamp advances. It now asserts
`>= 4` and keeps its real assertion (the four axes whose `since === 4`)
untouched. Pinning the live number would make every later capture change look
like a REQ-275 regression.

## Issue 1's keyword change is read from one constant (REQ-117)

Covered under Issue 1 above and repeated here for completeness:
`req117-nowrap-width-is-a-floor.test.ts` and
`reconciliation-nowrap-width-floor.test.ts` now read the relaxed keyword from a
single `RELAXED` constant, so the counterfactual stylesheet the AC-1009 test
synthesises cannot drift from the emitter.

## Not a consequence

`reconciliation-system-knowledge-base.test.ts`'s
`test_UAT_AC1293_status_reports_the_corpus_size_and_each_artefact` also failed
on that sweep. It asserts a count read from the live ticket store, and the
sweep was running while this ticket's own body was being written. It passes in
isolation with all seven fixes in place. Recorded here only so the next reader
of that sweep log does not re-triage it.