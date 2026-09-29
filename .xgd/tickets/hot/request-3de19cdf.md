---
uid: request-3de19cdf
id: REQ-338
type: request
title: 'fold: every band is painted two or three times over and the least faithful
  copy is on top'
created_by: repro-console:repro-joyfulculinarycreations-com#3
created_at: '2026-09-27T01:18:16.240133+00:00'
updated_at: '2026-09-29T04:39:46.084455+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  defect_class:
  - fold-wrong
  - capture-loses-it
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-91b35ccf
---

# fold: every band is painted two or three times over and the least faithful copy is on top

Filed by `repro-console:repro-joyfulculinarycreations-com#3`, iteration 3 of the reproduction of
https://joyfulculinarycreations.com (sandbox site `repro-joyfulculinarycreations-com`).

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  (`capturedAt` `2026-09-27T00:47:21.132Z`, `captureSchema` 7; nothing has landed in the engine since,
  so every number below is measured by the instrument running now — this is **not** a stale-bundle round)
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-3/`

`gate.json`: `"verdict": "structural-failure"`, `"pass": false`, `"l1Pass": false`,
`"perceptualBreach": true`, `"valuesBreach": true`; perceptual mean 30.53/255 over 27.35% of pixels in
12 regions; `values.deltas` 14 (`matched` 86, `unmatched` 0, `unpairedActual` 2, `bandPaintActual` 3,
`worstTier` CRITICAL); `layout.findings` 400 — 367 `escape`, 27 `overlap`, 6 `clip`.
**unmeasured 4** (0 axes, 1 band, 2 populations, 1 probe).

`defect_class`: **`fold-wrong`**, **`capture-loses-it`**, **`instrument-blind`**.

## The one sentence

The reference paints each band once. The fold paints it **two or three times** — a `backdrop-N` pair
from the treatments probe, a `section-bg-N` box from the section-background probe, and a
`section-band-N` plate from the run-surface builder — and because they are emitted in that order as
absolutely-positioned siblings, **the copy that carries the least information is the one the browser
paints last**. The hero's photograph is buried under an opaque black plate; the testimonial band is
flooded with a scrim colour that belongs to a panel 255px in. Between them that is **75.6% of the
page's total pixel disagreement**, and it produces **zero value deltas**.

### Where the pixels actually disagree

Everything in this ticket is quoted from the artifacts. The mass figures are my own arithmetic over
the two screenshots — run it yourself and it reproduces exactly:

```
python3 - <<'EOF'
from PIL import Image
import numpy as np
A=np.asarray(Image.open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-3/diff/actual.png').convert('RGB')).astype(np.int32)
R=np.asarray(Image.open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/screenshot.full.png').convert('RGB')).astype(np.int32)
h=min(A.shape[0],R.shape[0]); A=A[:h,:1280]; R=R[:h,:1280]
D=np.abs(A-R).mean(axis=2)
def m(x0,y0,x1,y1,l): s=D[y0:y1,x0:x1]; print(f'{l:46s} {s.sum()/1e6:8.2f}M ({100*s.sum()/D.sum():5.2f}%) mean {s.mean():6.2f}')
m(0,0,1280,156,'hero above the black plate      -> issue 2')
m(0,156,1280,800,'hero under the black plate      -> issue 1')
m(0,2949,255,3475,'testimonial band left gutter    -> issue 3')
m(1025,2949,1280,3475,'testimonial band right gutter   -> issue 3')
m(255,2949,1025,3475,'testimonial PANEL (nearly right)')
m(0,2667,1280,2935,'vegetable band                  -> issue 5')
m(672,1648,848,1824,'the photograph that never paints-> issue 8')
EOF
```

| band / region | share of page diff mass | mean/255 | issue |
|---|---|---|---|
| hero, y 156–800 (under the black plate) | **25.96%** | 51.78 | 1 |
| hero, y 0–156 (untreated image copy) | **17.30%** | 142.45 | 2 |
| testimonial band, x 0–255 | **16.08%** | 197.07 | 3 |
| testimonial band, x 1025–1280 | **16.20%** | 198.54 | 3 |
| vegetable band, y 2667–2935 | **13.96%** | 66.89 | 5 |
| testimonial **panel**, x 255–1025 | 3.28% | 13.33 | — (nearly right) |
| the photograph that never paints | 0.47% | 24.68 | 8 |

and `regions.json` ranks the same thing: region 1 `362246.62` (52.57% of the 689109.90 ranked total)
over the testimonial/vegetable bands, region 2 `317820.49` (46.12%) over the hero. **Those two regions
are 98.7% of the ranked score and neither of them produces a single value delta.**

## Summary — eight residuals, in the order to work them

| # | residual class | kind | `defect_class` | cost |
|---|---|---|---|---|
| 1 | `band-base-plate-nests-inside-the-band-image-box-and-paints-over-it` | class 1 | `fold-wrong` | 25.96% of diff mass |
| 2 | `section-bg-re-paints-the-band-image-without-the-backdrop-s-opacity-and-filter` | class 1 | `fold-wrong` | 17.30% |
| 3 | `band-base-fill-scrim-guard-reads-only-the-widest-projection` | class 1 | `fold-wrong` | 32.28% |
| 4 | `section-bg-boxes-get-no-viewport-height-response` | class 1 | `fold-wrong` | 161 of 367 escapes; the verdict |
| 5 | `capture-reads-the-band-s-own-background-colour-as-its-overlay` | class 1 | `capture-loses-it` | 13.96% |
| 6 | `capture-normalises-nbsp-to-a-breaking-space` | class 1 | `capture-loses-it` | 1 HIGH delta |
| 7 | `capture-records-the-run-s-line-height-not-the-line-box-strut` | class 1 | `capture-loses-it` | 3 HIGH deltas |
| 8 | `fold-parents-an-image-under-an-unrelated-clipping-container` | class 1 | `fold-wrong` | a whole photograph, 0 deltas |

**Order and dependencies.**

- **1 and 2 are the same band and must land together.** Fixing 1 alone exposes the untreated image
  copy of issue 2 across the whole 800px hero instead of only its top 156px, so the hero gets
  *brighter* and the measured residual there goes UP before it goes down. Fixing 2 alone leaves the
  black plate covering 644 of the 800 rows, so nothing visibly changes.
- **3 is independent** and is the single largest self-contained win.
- **4 is independent of 1–3 and is the whole `structural-failure` verdict.** It is also the only one
  of the eight that no perceptual average will ever see, because the page is exact at the captured
  viewport heights and comes apart at every other one.
- **5, 6 and 7 are capture-side**, so a **re-capture is required after they land** — `1c refold`
  re-derives the fold from the oracle the bundle already holds and can never pick up a capture change.
  5 must precede 3 in the sense that once 5 is right the vegetable band's overlay is a *dark* scrim,
  not a 9% white veil; but neither blocks the other.
- **8 is independent.**

Landing 1+2 and 3 is ~75% of this page's pixel disagreement and a good outcome on its own.

**Deliberately elsewhere, so nobody re-derives them:**

- The hero heading's half-leading (−11px on both hero lines) and the dropped leading `<br>` on
  "What people are saying" (−46.40625px, this round's largest CRITICAL delta) are **REQ-265**'s class.
  Iteration 2 appended exactly these numbers as `COMMENT-4021`; iteration 3 measures them **byte for
  byte unchanged** (`values-diff.json` deltas 1–3), so there is nothing new to append and they are not
  re-filed here.
- The 1720px-wide document, the `overflow` HIGH delta (`≤1280w` → `1700w`) and the 6 `clip` findings
  are **REQ-332**'s issue 2. Re-measured and appended there as a comment this round.
- Three instrument defects are filed separately as a `bug` (see "What is NOT in this ticket").

## What is NOT in this ticket

Per §5 of the round brief, defects in the ruler are filed separately as a `bug`:

- `values-diff` compares the actual side's band fill against a box that something opaque is painted
  over, so §6 compares `#ffffff` against `#ffffff` while the reproduction paints `#28542d` across
  32.28% of the page's diff mass — **0 deltas**;
- the box that *does* paint it is lifted into `values.bandPaintActual`, which
  `tools/repro-console/src/unmeasured.ts` counts in **none** of its four parts, so it is neither
  compared nor counted as unmeasured;
- `gate.json.coverage` reports `referencedImages: 7, unreferencedImages: []` while one of those seven
  paints zero pixels (issue 8) — the coverage proxy counts L1 *references*, not paint.

---

## Issue 1 — the band's opaque base plate is emitted as a CHILD of the band's background-image box, so it paints over the image

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`** — the capture carries the hero
correctly, L1 can express it (it already does, twice), the renderer honours what it is given, and the
fold puts the opaque plate on top of the photograph.

### The test I ran, and what came back

*Question 2 of the brief's three: is the value in the L1 document, and is it right?*

```
1c page get repro-joyfulculinarycreations-com home --sandbox --json > /tmp/p.json
```

`page.json` node `0.19` and its only child `0.19.0`:

```json
{ "kind": "container", "id": "section-bg-0",
  "axes": { "backgroundImageUrl": "/assets/HERO-AdobeStock_254767116-scaled.jpeg" },
  "geometry": { "keyframes": [ ..., { "at": 1280, "x": 0, "y": 0, "width": 1280, "height": 800 } ] },
  "children": [
    { "kind": "container", "id": "section-band-0",
      "axes": { "surfaceFill": "#000000" },
      "geometry": { "keyframes": [ ..., { "at": 1280, "x": 0, "y": 156, "width": 1280, "height": 644, "atHeight": 800 } ],
                    "viewportResponse": { "heightFactor": 1 } } } ] }
```

The served document agrees (`iteration-3/site/home.html`):

```css
.l1-28 { display: flex; flex-direction: column;
         background-image: url("assets/HERO-AdobeStock_254767116-scaled.jpeg");
         background-size: cover; background-position: center; background-repeat: no-repeat }
.l1-29 { display: flex; flex-direction: column; background-color: #000000 }
```

`<div class="l1-28" id="section-bg-0"><div class="l1-29" id="section-band-0"> …`

So an opaque `background-color: #000000` box sits **inside** the box that carries the photograph, and
a child paints over its parent.

### What the reference actually does

From the bundle's own mirrored stylesheet, `assets/post-4401.css` — this is the hero section
(`data-id="8d3c33b"`, the section wrapping `Dreaming of healthier meals` in `raw.html`):

```css
.elementor-element-8d3c33b { background-color:#000000; overflow:hidden }
.elementor-element-8d3c33b > .elementor-background-overlay {
    background-color:#000000;
    background-image:url("…/HERO-AdobeStock_254767116-scaled.jpeg");
    background-position:center center; background-size:cover;
    opacity:0.49 }
.elementor-element-8d3c33b .elementor-background-overlay {
    filter:brightness( 67% ) contrast( 88% ) saturate( 106% ) blur( 0px ) hue-rotate( 0deg ) }
```

The black is the **base**; the photograph is painted **over** it at `opacity: 0.49` under a
brightness/contrast/saturate filter. In CSS a band's `background-color` is always under its
`background-image`. The fold inverts that.

### The pixels

`actual.png` versus `screenshot.full.png`, sampled directly:

| (x, y) | reference | reproduction |
|---|---|---|
| (5, 500) | `(78, 80, 81)` | `(0, 0, 0)` |
| (500, 500) | `(58, 31, 11)` | `(0, 0, 0)` |
| (900, 700) | `(36, 28, 20)` | `(0, 0, 0)` |
| (1270, 790) | `(62, 67, 68)` | `(0, 0, 0)` |

Every pixel of the reproduction's hero from y=156 to y=800 is `(0, 0, 0)`. `regions.json` region 2,
`bbox {x:0, y:0, w:1280, h:800}`, `score 317820.49`, `meanDiff 81.33`, `readout.meanRgb`
`ref [66.67, 60.55, 51.97]` vs `actual [53.8, 54.38, 50.78]`. Its `nodes.actual[]` names the culprit
at index 13 — `"Dreaming of healthier meals…"`, `role generic`, `box {x:0, y:156, w:1280, h:644}`,
81% of the region — and the `nodes.ref[]` side has no counterpart for it, because the reference has
no such box.

That element is also `values-diff.json`'s `unpairedActual[0]`: **the opaque plate over 644×1280 px of
the hero photograph produces zero value deltas.**

### Hypothesis

`buildSolidBands` (`tools/generate/src/l1/fold.ts:2040`) emits `section-band-N` from the run-surface
rows, and whatever assembles the tree afterwards nests it under the `section-bg-N` box that
`foldSectionBackgrounds` (`fold.ts:1778`) emitted for the same band, because the band's box is
geometrically contained by the section-background box. Containment is the right parent for *content*
and the wrong parent for *paint*: a band's own fill belongs underneath the band's image, not on top
of it.

### The proposed change

A band's solid base must paint **below** its `section-bg-N`, not above it — either by emitting
`section-band-N` as a sibling ordered before the `section-bg-N` box, or (better) by folding the two
into one box that carries `surfaceFill` and `backgroundImageUrl` together, which is what the renderer
already does within a single box and what CSS itself does.

### How to see it, and how to know it is fixed

```
1c refold --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index
python3 -c "import json;l=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/l1.json'));\
n=l['root']['children'][19];print(n['id'],n['axes']);print([c['id'] for c in n.get('children',[])])"
```

- **wrong now**: `section-bg-0 {'backgroundImageUrl': '…HERO…jpeg'}` then `['section-band-0']` — the
  `#000000` plate is a child of the image box.
- **right when fixed**: `section-band-0` is not a child of `section-bg-0`; either it is an earlier
  sibling, or the two are one box whose axes carry both `surfaceFill: "#000000"` and the image URL.

Then, end to end:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index \
  --sandbox --out /tmp/gate-after
```

- **wrong now**: `regions.json` region 2 `score 317820.49` at `bbox {0,0,1280,800}`; `actual.png` is
  `(0,0,0)` everywhere in y 156–800.
- **right when fixed**: the hero photograph is visible for the full 800px. With issue 2 also fixed,
  region 2's score should fall by at least an order of magnitude (the reference's hero mean is
  `[66.67, 60.55, 51.97]` and the treated backdrop already reproduces it — see issue 2).

---

## Issue 2 — `section-bg-N` re-paints the band's image stripped of the `opacity` and `filter` the `backdrop-N` layer already carries, and paints it later

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`** — the correct value is in L1 already;
the fold emits a second, impoverished copy and orders it on top.

### The test I ran, and what came back

Same `page.json`. Two nodes describe the same 1280×800 rectangle:

```json
// root child 3
{ "kind": "box", "id": "backdrop-1",
  "axes": { "surfaceFill": "#000000", "opacity": 0.49,
            "backgroundImageUrl": "/assets/HERO-AdobeStock_254767116-scaled.jpeg",
            "filter": { "saturate": 1.06, "brightness": 0.67, "contrast": 0.88,
                        "order": ["brightness","contrast","saturate"] } },
  "geometry": { "keyframes": [ …, { "at": 1280, "x": 0, "y": 0, "width": 1280, "height": 800, "atHeight": 800 } ],
                "viewportResponse": { "heightFactor": 1 } } }

// root child 19
{ "kind": "container", "id": "section-bg-0",
  "axes": { "backgroundImageUrl": "/assets/HERO-AdobeStock_254767116-scaled.jpeg" },
  "geometry": { "keyframes": [ …, { "at": 1280, "x": 0, "y": 0, "width": 1280, "height": 800 } ] } }
```

`backdrop-1` is **exactly right** — compare it line for line with the mirrored CSS quoted in issue 1:
`opacity: 0.49` and `filter: brightness(67%) contrast(88%) saturate(106%)` are the page's own values,
to the digit. `section-bg-0` is the same image with **neither**.

The served document puts them 24 absolutely-positioned siblings apart, so `section-bg-0` wins:

```html
<div class="l1-4" id="backdrop-1"></div> … <div class="l1-28" id="section-bg-0"> …
```
```css
.l1-4  { background-color:#000000; opacity:0.49; background-image:url("assets/HERO-…jpeg");
         background-size:cover; background-position:center; background-repeat:no-repeat;
         filter: brightness(0.67) contrast(0.88) saturate(1.06) }
.l1-28 { display:flex; flex-direction:column; background-image:url("assets/HERO-…jpeg");
         background-size:cover; background-position:center; background-repeat:no-repeat }
```

### The pixels — and the arithmetic that proves which layer is winning

Above y=156 the black plate of issue 1 has not started yet, so what shows is `section-bg-0`'s
untreated image:

| (x, y) | reference | reproduction | ref/ours |
|---|---|---|---|
| (5, 10) | `(77, 79, 80)` | `(243, 248, 251)` | 0.317 / 0.319 / 0.319 |
| (200, 60) | `(52, 59, 54)` | `(160, 180, 167)` | 0.325 / 0.328 / 0.323 |
| (500, 120) | `(46, 45, 30)` | `(133, 130, 82)` | 0.346 / 0.346 / 0.366 |
| (900, 120) | `(49, 60, 8)` | `(144, 182, 14)` | 0.340 / 0.330 / 0.571 |

`backdrop-1`'s own axes predict the ratio: `opacity 0.49 × brightness 0.67 = 0.328`. **The reference
IS `backdrop-1`.** The reproduction is painting the untreated duplicate over the top of it.

That strip is 17.30% of the page's diff mass at mean 142.45/255 — the highest mean anywhere on the
page — over only 156 of 4743 rows.

### Why the capture cannot be blamed

`capture.json` `sections[1].background` is
`{"kind":"image","color":"#000000","image":"assets/HERO-AdobeStock_254767116-scaled.jpeg"}` — no
opacity, no filter. That *is* a capture shortfall in the section-background probe, but it is not the
actionable one, because the treatments probe read the same DOM subtree and got all of it. The fold
has both records in front of it and picks the poorer one to paint last.

### Hypothesis

`foldSectionBackgrounds` (`fold.ts:1778-1820`) emits a box for every section carrying
`backgroundImageUrl || overlay`, with no awareness of whether a `backdrop-N` already describes the
same rectangle with strictly more axes. Its output is appended after the backdrops.

### The proposed change

Before emitting a `section-bg-N`, check whether a `backdrop-N` already covers the same box at the same
widths carrying the same `backgroundImageUrl`. If one does, the backdrop is strictly better informed
(it has `opacity` and `filter`) — merge the section record's `overlay` into it and emit no second box.

### How to see it, and how to know it is fixed

```
1c refold --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index
python3 -c "import json;l=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/l1.json'));\
print([(c['id'],c.get('axes')) for c in l['root']['children'] if c.get('id') in ('backdrop-1','section-bg-0')])"
```

- **wrong now**: two entries for the same 1280×800 box — `backdrop-1` with `opacity`+`filter`, and
  `section-bg-0` with the bare URL.
- **right when fixed**: one entry for that rectangle. If a `section-bg-0` survives it must carry the
  `opacity: 0.49` and the `filter`, or be ordered before `backdrop-1`.
- **the pixel check**: `actual.png` at (5, 10) should read about `(77, 79, 80)`, not `(243, 248, 251)`.

---

## Issue 3 — `bandBaseFill`'s scrim guard reads only the widest projection, so a scrim that stops being band-wide at the widest width is promoted to an opaque band base

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`**. This is REQ-271 issue 3's failure
mode returning through a hole in the guard REQ-271 installed for it — quoted below from the current
source, so it is a new defect in a landed fix rather than a re-filing.

### The test I ran, and what came back

`multistate.json`, band §7 (the testimonials band), `overlay` and `surfaceFill` at every projection:

| projection | overlay | surfaceFill |
|---|---|---|
| 320×800 | `{"color":"#28542d","opacity":0.62}` | `#ffffff` |
| 375×800 | `{"color":"#28542d","opacity":0.62}` | `#ffffff` |
| 768×1024 | `{"color":"#28542d","opacity":0.62}` | `#ffffff` |
| 1024×768 | `{"color":"#28542d","opacity":0.62}` | `#ffffff` |
| **1280×800** | **`null`** | `#ffffff` |
| **1440×900** | **`null`** | `#ffffff` |
| 1280×1000 | `null` | `#ffffff` |

The scrim stops being *band-wide* at ≥1280 because the panel it belongs to narrows to 770 of 1280px.
Now `fold.ts:3394`:

```ts
const sectionsAtWidest =
  projections.find((p) => p.viewport.width === Math.max(...widths))?.manifest.sections ?? []
const bandNodes = buildSolidBands(bandRows, widths, sectionEdges, heightAt, edgeResponses, sectionsAtWidest)
```

and `bandBaseFill` (`fold.ts:2003-2021`):

```ts
if (!best?.overlay) return fill
if (best.overlay.color.toLowerCase() !== fill.toLowerCase()) return fill
return typeof best.surfaceFill === 'string' ? best.surfaceFill : null
```

At 1440 `best.overlay` is `null`, so the guard returns on the first line and `fill` — `#28542d`, which
is the flattened composite the capture wrote onto every run standing on the panel — becomes the band's
**opaque base, at every width**:

```json
{ "kind": "container", "id": "section-band-1", "layout": "stack",
  "axes": { "surfaceFill": "#28542d" },
  "geometry": { "keyframes": [ …, { "at": 1280, "x": 0, "y": 2950, "width": 1280, "height": 525, "atHeight": 800 } ] },
  "visibility": { "fromPx": 768 } }
```

Had the guard looked at *any* of the four narrower projections it would have matched
(`#28542d` == `#28542d`) and returned `best.surfaceFill` = `#ffffff` — the band's own, correct fill.

**And the scrim is already carried correctly elsewhere**, which is what makes the plate pure damage:

```json
{ "kind": "box", "id": "section-bg-3",
  "axes": { "overlay": { "color": "#28542d", "opacity": 0.62 } },
  "geometry": { "keyframes": [ {"at":320,…}, {"at":375,…}, {"at":768,…}, {"at":1024,…} ] },
  "visibility": { "untilPx": 1280 } }
```

— served as `.l1-2 { background-image: linear-gradient(#28542d9e, #28542d9e) }` with
`display: none` from 1280px up. Exactly right. The plate is a second, opaque, full-width copy of the same
colour that never goes away.

### The pixels

Row y=3104, inside the testimonials band:

| x | reference | reproduction |
|---|---|---|
| 0, 80, 160, 240 | `(255, 255, 255)` | `(40, 84, 45)` |
| 320 … 960 | `(122, 149, 125)` | `(122, 149, 125)` |
| 1040, 1120, 1200 | `(255, 255, 255)` | `(40, 84, 45)` |

`(40,84,45)` is `#28542d` at full opacity. `(122,149,125)` is `#28542d` composited at 0.619 over
white — the panel, which both sides get right to the byte. The band around it should be white and is
flooded instead: **16.08% + 16.20% = 32.28% of the page's diff mass**, at mean 197/255 — the two
highest-mean areas on the page after the hero strip. `regions.json` region 1 (`score 362246.62`,
52.57% of the ranked total) sits on top of it.

The band-level value comparison reports **nothing**: `expected-manifest.json` `sections[6].surfaceFill`
is `"#ffffff"` and `actual-manifest.json` `sections[6].surfaceFill` is `"#ffffff"` too, because the
actual-side slicer reads the fill off `backdrop-7` underneath instead of `section-band-1` on top. That
half is the `bug` filed alongside this ticket.

### The proposed change

In `fold.ts:3394`, stop pre-selecting the widest projection. Pass every projection's sections and have
`bandBaseFill` treat the band as scrim-carrying if **any** sampled width recorded an overlay whose
colour equals the run-derived fill. A scrim the capture saw at four of seven widths is a scrim.

A one-line variant that fixes this bundle without changing the shape of the call: keep
`sectionsAtWidest` as the geometric reference but, when `best.overlay` is absent, look the same band's
`index` up in the other projections before giving up.

### How to see it, and how to know it is fixed

```
1c refold --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index
python3 -c "import json;l=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/l1.json'));\
print([(c['id'],c['axes']) for c in l['root']['children'] if c.get('id')=='section-band-1'])"
```

- **wrong now**: `[('section-band-1', {'surfaceFill': '#28542d'})]`
- **right when fixed**: `[('section-band-1', {'surfaceFill': '#ffffff'})]` — or no `section-band-1` at
  all, since `backdrop-7` already paints `#ffffff` over that box and a duplicate white plate is
  harmless but pointless.
- **the pixel check**: `actual.png` at (0, 3104) should read `(255, 255, 255)`.

---

## Issue 4 — `foldSectionBackgrounds` emits no `viewportResponse`, so every `section-bg-N` is pinned while everything it backs moves with the viewport height

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`**. This is 100% of the
`structural-failure` verdict and the only residual in this ticket that no perceptual average can see:
the page is exact at the captured viewport heights and comes apart at every other one.

### The test I ran, and what came back

`gate.json` `layout.findings`: 367 `escape`, split by the viewport height the probe used —

| viewport height | escapes |
|---|---|
| 1536 | **239** |
| 768 | 128 |

and by the surface the content left:

| backing surface | escapes | its `viewportResponse` in L1 |
|---|---|---|
| `section-bg-2` | 82 | **absent** |
| `section-bg-0` | 79 | **absent** |
| `section-band-2` | 57 | **absent** |
| `card-2` | 22 | `{"yFactor": 1}` |
| `backdrop-2` | 20 | `{"yFactor": 1}` |
| `section-band-1` | 17 | `{"yFactor": 1}` (its child `card-4` has **none**) |
| 9 more | 90 | mixed |

**161 of 367 escapes (43.9%) are on the four `section-bg-N` boxes, and all four have no viewport-height
response at all.** Their content does:

```
0.19  container section-bg-0      viewportResponse null
0.19.0  container section-band-0  viewportResponse {"heightFactor": 1}
0.19.0.2  text "Holistic In-Home…" viewportResponse {"yFactor": 0.5}

0.18  container section-bg-2      viewportResponse null
0.18.0  image image-4             viewportResponse {"yFactor": 1}
0.18.1  container card-3          viewportResponse {"yFactor": 1}

0.48  container section-band-2    viewportResponse null
0.48.0  text "How it works"       viewportResponse {"yFactor": 1}
0.48.1  text "Weekly meals…"      viewportResponse {"yFactor": 1}
```

(Of the page's 73 text runs, 44 carry `{"yFactor": 1}`, 3 carry `{"yFactor": 0.5}` and 26 carry
none. `yFactor: 1` is *correct* for the runs that have it — the hero above them is `100vh`, so the
whole document really does move down 1px per extra pixel of viewport height, and the capture proves
it: it sampled 1280×800 and 1280×1000 and every band below the hero sits exactly 200px lower in the
second. The defect is that the boxes those runs stand on were never asked the same question.)

At the captured heights the two agree by construction. At 1536 the content has moved 736px and the
`section-bg-N` box has not, which is what `gate.json`'s diagnosis is reporting:

> at 320px×1536px: 'Holistic In-Home Personal Chef Services for the busy family' is no longer covered
> by its backing surface section-bg-0 — 275px below its bottom edge

The cause is visible in the source. `foldSectionBackgrounds` (`fold.ts:1778-1820`) builds its
keyframes as

```ts
const keyframes: L1Keyframe[] = entries.map((e) => ({
  at: e.width, x: round2(e.sv.box!.x), y: round2(e.sv.box!.y),
  width: round2(e.sv.box!.width), height: round2(e.sv.box!.height),
}))
const geometry: L1Geometry = { keyframes }
if (keyframes.length > 1) geometry.segments = …
```

— no `atHeight` on any keyframe and **no `viewportResponse` branch anywhere in the function**, while
`buildSolidBands` a few hundred lines below computes one from `responseSamples` and `edgeResponses`.
The section-background path was never given the machinery.

Note the same hole one level down: `card-4` (the testimonial panel) has no `viewportResponse` inside a
`section-band-1` that has `{"yFactor": 1}`, and `container 0.47` (the testimonial slide) has none while
all four of its runs have `{"yFactor": 1}`. Whatever fixes `section-bg-N` should be applied wherever a
container is emitted without sampling the second height.

### The proposed change

`foldSectionBackgrounds` already receives every projection. Group its entries by `(width, height)`
instead of by width alone, keep `atHeight` on the keyframes, and derive `viewportResponse` from the
two same-width samples exactly as `buildSolidBands` does — a band whose box tracks `100vh` gets
`heightFactor: 1`, a band below one that does gets `yFactor: 1`, and a band that does neither gets
nothing.

### How to see it, and how to know it is fixed

```
1c l1-gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index
python3 -c "import json;l=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/l1.json'));\
print([(c['id'], (c.get('geometry') or {}).get('viewportResponse')) for c in l['root']['children'] if str(c.get('id')).startswith('section-bg')])"
```

- **wrong now**: `[('section-bg-1', None), ('section-bg-3', None), ('section-bg-2', None), ('section-bg-0', None)]`,
  and `gate.json` `layout.findings` has 367 `escape`, 239 of them at height 1536.
- **right when fixed**: `section-bg-0` carries `{'heightFactor': 1}` (its box is the `100vh` hero:
  its own keyframes are `height 768` at 1024×768, `800` at 1280×800 and `900` at 1440×900 — the
  viewport height, every time), `section-bg-2` and `section-bg-3` carry `{'yFactor': 1}`, and the
  escape count at height 1536 drops by at least the 161 attributed to these four boxes.

---

## Issue 5 — the capture records the band's own `background-color` as its `overlay` and never sees the `.elementor-background-overlay` child

**Class 1 — engine shortfall.** `defect_class`: **`capture-loses-it`** — the page paints a near-opaque
dark scrim with `mix-blend-mode: darken`; the bundle records a 9% white veil; nothing downstream can
recover the difference. **Needs a re-capture after the fix.**

### The test I ran, and what came back

`capture.json` `sections[4].background`:

```json
{ "kind": "image", "color": "#ffffff",
  "image": "assets/market-vegetables-produce-6329164.jpg",
  "overlay": { "color": "#ffffff", "opacity": 0.09 } }
```

The bundle's own mirrored stylesheet, for that section (`data-id="18fe737"` in `raw.html`, the
section wrapping *"It's not just about eating your veggies…"*):

```css
.elementor-element-18fe737:not(.elementor-motion-effects-element-type-background), … {
    background-color:#FFFFFF17;
    background-image:url("…/market-vegetables-produce-6329164.jpg");
    background-position:center center }
.elementor-element-18fe737 > .elementor-background-overlay {
    background-color:#141E14BA;
    opacity:0.92;
    mix-blend-mode:darken }
```

`#FFFFFF17` — alpha `0x17` = 23/255 = **0.0902**. The captured overlay `{#ffffff, 0.09}` is, to the
digit, **the section's own `background-color`**. The `.elementor-background-overlay` child —
`#141E14` at alpha `0xBA`/255 = 0.729, times `opacity: 0.92`, effective ≈ 0.67, blended `darken` — is
recorded **nowhere in the bundle**: `capture.json`, `multistate.json` and `l1.json` contain no
`#141E14`, no `0.92`, and no `darken`.

The same probe made the same mistake on the hero in the other direction (issue 2): there the
`.elementor-background-overlay` child held `opacity: 0.49` and a `filter`, and
`sections[1].background` recorded neither.

### The pixels

Row samples in the vegetable band:

| (x, y) | reference | reproduction |
|---|---|---|
| (20, 2720) | `(41, 50, 44)` | `(96, 105, 106)` |
| (20, 2784) | `(29, 40, 5)` | `(63, 77, 27)` |
| (20, 2848) | `(37, 61, 43)` | `(85, 135, 102)` |
| (20, 2912) | `(29, 46, 30)` | `(64, 94, 66)` |

`darken` at effective alpha 0.67 over `(96,105,106)` predicts
`0.33·(96,105,106) + 0.67·min((96,105,106),(20,30,20)) = (45, 55, 48)`; measured `(41, 50, 44)`. The
reproduction is painting the raw photograph plus a 9% white veil where the reference paints it under a
near-opaque dark green. 13.96% of the page's diff mass, mean 66.89/255, and part of `regions.json`
region 1.

### The proposed change

The band-background probe must read Elementor's (and any framework's) dedicated overlay child, not
just the band element's own `background-color`. Concretely: when a band's first child is a
zero-content, absolutely-positioned box covering the band, its `background-color × opacity` is the
band's overlay and the band element's own `background-color` is the band's fill — which is also the
fix for issue 2's missing `opacity`/`filter`. `mix-blend-mode: darken` needs carrying too; L1's
`blendMode` axis already exists and the capture already has a `blendMode` field, it is just `null`
here.

### How to see it, and how to know it is fixed

```
python3 -c "import json;c=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/capture.json'));\
print(json.dumps(c['sections'][4]['background']))"
```

- **wrong now**: `{"kind":"image","color":"#ffffff","image":"assets/market-vegetables-produce-6329164.jpg","overlay":{"color":"#ffffff","opacity":0.09}}`
- **right when fixed** (after a re-capture): the overlay reads approximately
  `{"color":"#141e14","opacity":0.67,"blendMode":"darken"}`, and the band's own fill stays `#ffffff`
  at 0.09.
- **the pixel check**: `actual.png` at (20, 2720) should read about `(41, 50, 44)`, not `(96, 105, 106)`.

**This is capture-side: `1c refold` cannot pick it up. The operator must press re-capture after it
lands.**

---

## Issue 6 — the capture normalises U+00A0 to an ordinary space, so text wraps where the reference cannot break

**Class 1 — engine shortfall.** `defect_class`: **`capture-loses-it`**. **Needs a re-capture.**

### The test I ran, and what came back

`raw.html`:

```
<span class="elementor-icon-list-text">Gifting our services to\xa0friends or family\xa0in need of nourishing\xa0support.</span>
```

`capture.json` `sections[3].content[5].text`:

```
'Gifting our services to friends or family in need of nourishing support.'
```

— three U+00A0 replaced by U+0020. And across the whole bundle:

```
raw.html                                 : 15 occurrences of U+00A0
multistate.json manifest elements with one:  0
```

### The cost

`values-diff.json`, the highest-severity of the six `renderedTextBox` deltas:

```json
{ "text": "Gifting our services to friends or family in need of nour…",
  "role": "body", "property": "renderedTextBox",
  "expected": "text 373×44", "actual": "text 460×44",
  "kind": "size", "tier": "HIGH", "magnitude": 87.296875, "severity": 3030.9886745708723 }
```

Both manifests give the run the same `box` (`x 409.15625, y 1545.875, w 484.15625, h 47.59375`), the
same `fontSizePx 17`, `fontWeight 300`, `lineHeightPx 23.8` and the same two-line height (43.796875).
Only the *break point* differs — 373.08px of first-line text in the reference, 460.38px in the
reproduction, because the reproduction is allowed to break after "to", "family" and "nourishing" and
the reference is not.

### The proposed change

Whatever normalises run text in `tools/generate/src/cli/capture/extract.ts` must collapse runs of
U+0020/U+0009/U+000A but preserve U+00A0 (and, for the same reason, U+2011, U+200B and U+2060).
Non-breaking whitespace is layout, not formatting.

### How to see it, and how to know it is fixed

```
python3 -c "import json;c=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/capture.json'));\
t=c['sections'][3]['content'][5]['text'];print(repr(t)); print('nbsp:', t.count(' '))"
```

- **wrong now**: `'Gifting our services to friends or family in need of nourishing support.'`, `nbsp: 0`
- **right when fixed** (after a re-capture): `'Gifting our services to\xa0friends or family\xa0in need of nourishing\xa0support.'`, `nbsp: 3`
- and the `renderedTextBox` delta for that run disappears (373×44 on both sides).

**Capture-side: needs a re-capture, not a refold.**

---

## Issue 7 — the capture records the run's own computed `line-height`, not the line box the glyphs actually sit on

**Class 1 — engine shortfall.** `defect_class`: **`capture-loses-it`**. **Needs a re-capture.**

### The test I ran, and what came back

Three of the six `renderedTextBox` deltas are the same shape — identical box, identical font, identical
width, and a *shorter* glyph union on the reproduction side:

| run | `lineHeightPx` | ref `renderedTextBox` h | ours | lines |
|---|---|---|---|---|
| "For expecting mothers, and small groups for kids and adults." | 18 | **94** | 76 | 4 |
| "In-home weekly, bi-weekly or monthly service" | 18 | **70** | 58 | 3 |
| "In home service or delivery" | 18 | **46** | 40 | 2 |

Both sides report `fontSizePx 18`, `lineHeightPx 18`, the same `fontFamily "Karla, raleway"`, the same
`fontWeight`, and the same `renderedTextBox` **width** to 4dp — so the font and the wrap points agree
and only the vertical pitch differs. Solve for it: ours is `(n−1)·18 + 22`, the reference is
`(n−1)·24 + 22`. The reference's line boxes are **24px apart**, not 18.

I confirmed that against the screenshots rather than inferring it. Ink-row profile of the run
"For expecting mothers…" (`box x 856.78, y 1933.45, w 162.83`), rows y 1925–2034:

```
REF        .################.      .############..         #################.      ..###########
ACT        .###############################.   ##################.############.
```

Four ink rows in both. In the reference their tops are at y≈1936 / 1960 / 1984 / 2008 — **24px apart**.
In the reproduction they run together, 18px apart, and the paragraph ends 15px higher.

The page's CSS explains it. `assets/post-4401.css` for that widget:

```css
.elementor-4401 .elementor-element.elementor-element-3987a1d8 .elementor-heading-title {
    font-family:"Karla", raleway; font-size:18px; font-weight:500; color:… }
```

— no `line-height` on the run at all. The run is an inline `<span>`; its own computed line-height
resolves to 18px, but the line box it sits on is the max of that and the **containing block's strut**,
which is 24px. The capture records the former.

### The proposed change

Where the capture writes `lineHeightPx`, take the line-box pitch rather than the run's own computed
`line-height` — the two are already both available to the extractor: the pitch is
`(renderedTextBox.height − contentAreaHeight) / (lines − 1)` for any run the capture can count lines
on, and for a single-line run the two values are indistinguishable and it does not matter. Failing
that, record the containing block's strut alongside the run's own line-height and let the fold take
the max, which is what CSS does.

### How to see it, and how to know it is fixed

```
python3 -c "import json;m=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-3/diff/expected-manifest.json'));\
e=[x for x in m['elements'] if (x.get('text') or '').startswith('For expecting mothers')][0];\
print(e['lineHeightPx'], e['renderedTextBox'])"
```

- **wrong now**: `18 {'x': 856.78125, 'y': 1931.453125, 'width': 162.828125, 'height': 94}` — a
  line-height of 18 that cannot produce a 94px four-line union.
- **right when fixed** (after a re-capture): `lineHeightPx` reads `24`, and `94 = 3×24 + 22` closes.
- and the three `renderedTextBox` deltas above go to zero. `regions.json` regions 4 (`score 1155.14`)
  and 7 (`score 756.52`) sit on two of these three runs.

**Capture-side: needs a re-capture.**

---

## Issue 8 — a photograph is parented under an unrelated clipping container and paints nothing, while every coverage proxy reports it present

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`**. Content completeness: a whole
photograph is missing from the page.

### The test I ran, and what came back

`page.json`, node `0.16.0`:

```json
{ "kind": "image", "id": "image-2", "src": "/assets/10.jpg",
  "geometry": { "keyframes": [ …, { "at": 1280, "x": -332.03, "y": -1423.86, "width": 162.06, "height": 162.06, "atHeight": 800 } ] } }
```

Its parent `0.16`:

```json
{ "kind": "container", "layout": "stack",
  "geometry": { "keyframes": [ …, { "at": 1280, "x": 1006.75, "y": 3082.33, "width": 713, "height": 332.2, "atHeight": 800 } ] },
  "clip": true }
```

The absolute position is *correct* — `1006.75 − 332.03 = 674.72`, `3082.33 − 1423.86 = 1658.47`,
which is exactly where the reference has it. But the fold put the image inside the **carousel slide**
container at `(1006.75, 3082.33, 713, 332.2)` with `clip: true`, and `(-332, -1424, 162, 162)` lies
entirely outside that rectangle. It is clipped away completely.

### The pixels

The reference has the photograph; the reproduction has flat page background:

| (x, y) | reference | reproduction |
|---|---|---|
| (680, 1690) | `(115, 82, 66)` | `(122, 122, 122)` |
| (720, 1750) | `(70, 46, 36)` | `(122, 122, 122)` |
| (800, 1780) | `(135, 115, 108)` | `(122, 122, 122)` |
| (840, 1810) | `(79, 79, 79)` | `(122, 122, 122)` |

Every sampled pixel of the reproduction inside the image box is `(122, 122, 122)` = `#7a7a7a` = the
page's `bodyBackground`.

`regions.json` region 3 — `bbox {x:672, y:1648, w:176, h:176}`, `score 3380.65`, `meanDiff 41.74`,
`readout.meanRgb` `ref [117.62, 103.77, 97.44]` vs `actual [122, 122, 122]` (three identical channels
over 30976 px: nothing is painted there at all). Both `nodes` sides name the same element —
`ref` index 47 `"Joyful Culinary Creations"` `role img` `src …/10.jpg` `box {674.72, 1658.47, 162.06, 162.06}`
at 85% of the region, `actual` index 49 the same box with `src http://localhost:57344/assets/10.jpg`.
**The element is laid out in the right place on both sides and one of them paints nothing** — which is
exactly why the region ranker can see it and `values-diff` cannot (0 deltas on this run).

The asset is present and 845 KB (`iteration-3/site/assets/10.jpg`), so this is not a mirroring failure.

### Hypothesis

Whatever assigns a leaf to a parent is using geometric containment against the *clip* container's box
rather than the reference DOM's ancestry, and the carousel slide's box at 1280 (x 1006.75 … 1719.75)
happens to be the nearest candidate. Once REQ-332's `clip` axis landed, a mis-parenting that used to
be merely a wrong coordinate space became total erasure.

### The proposed change

Two things, either of which closes it:

1. an image whose keyframe places it wholly outside a `clip: true` ancestor is a fold bug, not an
   authoring intent — reject it in the envelope validator, which turns a silent erasure into a loud
   one on every site;
2. parent by the capture's own DOM ancestry rather than by geometric containment, so a leaf that is
   not a descendant of the carousel never lands inside it.

### How to see it, and how to know it is fixed

```
1c page get repro-joyfulculinarycreations-com home --sandbox --json > /tmp/p.json
python3 -c "import json;p=json.load(open('/tmp/p.json'));r=p['data']['page']['l1']['root'];\
c=r['children'][16];i=c['children'][0];\
print('parent clip',c.get('clip'),[k for k in c['geometry']['keyframes'] if k['at']==1280]);\
print('image      ',i['id'],[k for k in i['geometry']['keyframes'] if k['at']==1280])"
```

- **wrong now**: parent `clip True [{'at':1280,'x':1006.75,'y':3082.33,'width':713,'height':332.2,…}]`
  and image `image-2 [{'at':1280,'x':-332.03,'y':-1423.86,…}]` — negative coordinates far outside a
  clipping parent.
- **right when fixed**: `image-2`'s keyframe coordinates are non-negative and inside its parent's box,
  or `image-2` is not a child of that container at all. Its absolute position must stay
  `(674.72, 1658.47, 162.06, 162.06)`.
- **the pixel check**: `actual.png` at (720, 1750) stops reading `(122, 122, 122)`.

---

## A note on the delta count ([[REQ-277]])

Issues 1, 2, 3 and 8 together are **75.6% of this page's pixel disagreement and 98.7% of the ranked
region score, and they produce zero value deltas between them.** Fixing them will not lower
`values.deltas` from 14, because 14 never counted them. What *should* move is the unmeasured set:
issue 1's plate is `unpairedActual[0]` (1 of the 2 "populations"), and issues 2 and 3 are two of the
three `bandPaintActual` entries the console counts nowhere at all — see the accompanying `bug`.
Fixing issue 5 will *raise* the delta count, because a band overlay the comparator can finally read on
both sides is a comparison that starts happening.


---

## What changed (free-coded implementation)

All eight residuals are closed. Verified by refolding the reference bundle this ticket was filed
from: `section-band-0` is gone, `section-bg-0` carries `surfaceFill: #000000` with the treated
`backdrop-1` nested inside it, `section-band-1` is `#ffffff` rather than `#28542d`, every
`section-bg-N` carries a `viewportResponse` and an `atHeight` on every keyframe, and `image-2`
moved from `(-332.03, -1423.86)` inside a foreign clipping container back to `(674.72, 1658.47,
162.06, 162.06)` at the top level — the position this ticket states it must hold.

### Issue 1 — one box carries the fill, and the duplicate plate is not emitted

The fold now takes the **second** of the two options offered above: `foldSectionBackgrounds` reads
the section's own measured `surfaceFill` and emits it on the `section-bg-N` box alongside the image
and the scrim, and `bandBaseFill` then declines to emit the reconstructed `section-band-N` plate at
all. One box, painting fill → image → scrim in CSS's own order, instead of two boxes with the
poorer one nested inside the richer one.

**The plate is dropped only where the section box provably replaces it.** This is a condition the
proposal above does not state, and without it the fix trades one defect for another: a section
whose scrim is recorded at four widths of seven emits a `section-bg` box that `visibility` gates off
above 1024, so a band that stopped painting there would paint *nothing* at those widths. The plate
is therefore suppressed only when the section is recorded at **every** sampled width, carries a box
at each, carries an image or a scrim at each (the exact condition under which `section-bg-N` is
emitted ungated), paints the same colour, and geometrically contains the band. Anything weaker
leaves the plate alone.

**Consequence for [[REQ-271]].** REQ-271's AC "a band fill that is not the scrim is kept" is
unchanged in intent — the scrim guard must never eat a band's own colour — but its **carrier moves**.
The fill now rides on the `section-bg` box, under its own scrim, rather than on a separate
`section-band` plate over it. REQ-271's UAT 11 was updated to assert the fill is still present and
now names the box that carries it; the test's intent is preserved, not superseded.

### Issue 2 — the informed copy of an image is the only copy

`mergeSectionBackgroundsIntoBackdrops` deduplicates each `section-bg-N` against the captured
backdrops: where a backdrop paints the same image over the same rectangle at every shared width, the
section box drops `backgroundImageUrl` and the backdrop keeps it, because the backdrop is the copy
that knows the `opacity: 0.49` and the `brightness/contrast/saturate` chain. A section box left with
no axis at all is dropped entirely. The scrim **moves onto** the backdrop, since a scrim paints over
the image it veils and the backdrop paints after the section box; a backdrop that recorded its own
scrim keeps that one.

Backdrops are now **owned but never owning**: they are passed to `nestBackingSurfaces` as
ownable-but-never-parenting nodes, ordered between the surfaces and the content. Only nesting can put
a section's overlay element between the section's own fill and the copy standing on it, which is
CSS's order for the element it was read from. Left at the top level a backdrop painted in the
background layer, beneath every surface that holds content — which is how the hero's photograph ended
up under the plate carrying the black it is composited on.

### Issue 3 — a scrim is looked for at every sampled width

`bandBaseFill` still identifies the band's section geometrically at the widest width (the grouping
frame every other band decision uses), then looks that section's `index` up across **every**
projection and treats the band as scrim-carrying if any sampled width recorded an overlay of the
matching colour. The band's own fill is read from the widest sample that measured the axis *at all*,
so a sample that measured `null` (paints nothing) is authoritative rather than skipped over in favour
of a narrower width's colour.

### Issue 4 — a section background answers a taller viewport

`sectionEdgeResponses`'s per-width, per-`y` factor map is refactored into a shared
`sectionBoxFactors`, and a new `sectionViewportResponses` re-expresses the same already-measured
probe pair as the section box's own `viewportResponse`: `yFactor` from its top edge, `heightFactor`
from the difference of its two edges. Every `section-bg-N` keyframe also now carries the `atHeight`
it was measured at, so the response is read against a stated baseline rather than an assumed one.
The measurement was always in hand; only the emission was missing.

### Issues 5, 6, 7 — the capture-side reads, and `CAPTURE_SCHEMA` 7 → 8

- **5.** `overlayInBox` now skips any painted surface that **contains** the band: a box containing the
  band paints behind it and can never be its overlay. On equal cover the **later** layer wins in both
  `overlayOf` and `overlayInBox`, since document order is paint order and the veil the eye reads is
  the one painted last — strict `>` kept the parent's own fill. `scrimOf` folds the element's own
  `opacity` into the veil's effective alpha and carries `mix-blend-mode`, reading
  `background-blend-mode` off the first layer as the second spelling of the same fact (a reference
  veils with a blended overlay *element*; our renderer has no such element, so it blends the gradient
  *layer* instead — comparing one spelling only would report a delta on every page we render
  correctly).

  **The L1 `overlay` axis did not in fact already carry `blendMode`.** The `l1BlendModeSchema` enum
  existed, but `l1OverlaySchema` did not admit the field, the renderer emitted no
  `background-blend-mode`, and the comparator read only colour and alpha — so a `darken` veil and a
  `normal` one at the same colour and alpha compared clean. Three changes close that: the axis is
  added to `l1OverlaySchema` (validated against the existing enum, so an unknown mode is refused);
  the renderer emits `background-blend-mode` positionally on the scrim's own layer, and emits the
  declaration **only** when some layer asks for a non-`normal` mode, so a normally-compositing box
  keeps the CSS default and gains no declaration; and `diffManifests` includes the mode in the
  overlay comparison with `undefined` reading as `normal`, with the mode shown in the delta label so
  a reader can see which veil arrived.

- **6.** HTML collapses five characters — space, tab, LF, CR, FF — and JavaScript's `\s` is not that
  set. Run-text normalisation now uses an explicit HTML-whitespace class for both collapsing and
  trimming, so U+00A0 and the other non-breaking and zero-width characters survive. Non-breaking
  whitespace is layout, not formatting: it makes wrap decisions.

- **7.** `lineHeightPx` is now the **measured** pitch of the line boxes the glyphs sit on — a Range
  over the run yields one rect per line fragment, and the pitch is the modal difference between
  successive fragment tops, so one stray fragment cannot set it. A single-line run, where there is no
  pitch to measure, falls back to its own computed `line-height` as before. `lineBoxOf` is fed the
  same measured pitch, because the half-leading it computes is half of that same line box and
  reading the two from different places would put the glyphs and their spacing into disagreement.

`CAPTURE_SCHEMA` is bumped **7 → 8**. This bump carries more weight than one that merely adds an
axis: a pre-8 bundle holds a plausible **wrong** value where a current one holds the right one, and
no reader can tell without the stamp. Four `CAPTURE_SCHEMA_AXES` entries make the staleness
legible, each catching the defect by its own contradiction where it can — an overlay whose colour
*is* the band's own fill, a multi-line run taller than its line count allows, a numeric rather than
path-shaped clip id — and deferring to the version gate where a clean page is indistinguishable from
a stale one.

**Issues 5, 6, 7 and issue 8's capture half require a re-capture.** `1c refold` re-derives the fold
from the retained oracle and can never pick up a capture change.

### Issue 8 — the clip ancestor's identity, and the agreement that was assumed

Neither of the two options above is what landed; both treat the symptom. The cause is that a clip
ancestor's **identity** was wrong: `clip.id` was a document-wide sequence number assigned on first
sight, per page evaluation, so it numbered clipping ancestors in the order that viewport happened to
reach them. A phone shows one carousel slide where a desktop shows three, so the numbering shifted
between widths of the same document — `id: 5` was a photograph's own rounded crop at 320px and a
slide 1400px away at 1280px. The fold read one width's id and another width's box.

`clip.id` is now the ancestor's **place in the document** — a `.`-joined chain of child indices —
which is the same string at every width by construction, since the DOM is the same tree at every
viewport. `ClipAncestor.id` changes type from `number` to `string` accordingly.

And `nestClipRegions` no longer takes the members' agreement on trust. It had stated that every
member of a group names the same ancestor and therefore records the same box "by construction" — but
it was the id that had to hold that, and it did not. A group is now split into runs of members that
actually agree: a row joins the first subgroup whose boxes match its own at every width both
recorded. Members of one real ancestor still land together; a row that agrees with nobody gets its
own subgroup, where the worst it can do is describe its own clip box — which is the truth about it.
On the reference bundle this collapses two bogus containers 1446px apart at the same `y` into
nothing, and `image-2` is restored to the top level.

## Test plan

Three new UAT files, 29 tests, plus one updated REQ-271 assertion:

- `tests/test_UAT_FC_REQ-338_the_fold_paints_each_band_once.test.ts` — issues 1–4 over the real
  `foldToL1` entry point with synthetic multi-state captures: the fill is not reconstructed a second
  time over its image; a band the section box does not cover everywhere **keeps** its plate; a
  section the capture could not box at every width leaves the plate alone; the image is painted once
  and by the node that knows its treatments; the photograph paints over the section's own fill, not
  under it; a scrim that stops being band-wide is not promoted to an opaque base; the scrim is still
  carried where the capture recorded it; a full-height section box grows with the viewport; a box
  below one travels with it; every keyframe states the height it was measured at.
- `tests/test_UAT_FC_REQ-338_the_capture_reads_the_veil_and_the_line_box.test.ts` — issues 5–8 under
  jsdom against the **real** `EXTRACT_SCRIPT`: the overlay is the veil child, not the band's own
  translucent fill; effective alpha is colour-alpha × element opacity; the blend mode travels; a
  non-breaking space survives normalisation while ordinary whitespace is still collapsed and
  trimmed; a run reports the measured pitch of its line boxes and a single-line run falls back; a
  clip id is the ancestor's document path, does not change when an earlier clipper is not reached,
  and is not shared by runs cut off by different ancestors. Plus the two `CAPTURE_SCHEMA` 8
  staleness probes: a bundle whose overlay colour is the band's own fill is reported as owed a
  re-capture, and a current bundle is not.
- `tests/test_UAT_FC_REQ-338_a_veil_carries_how_it_composites.test.ts` — the new L1 axis end to end:
  the validator accepts a blend mode on an overlay and rejects one that is not in the enum; the
  renderer emits `background-blend-mode` on the veil's own layer and emits **no** declaration at all
  when the veil composites normally; the comparator reports two differently-compositing veils as a
  delta and a faithfully-reproduced one as clean.

Regression scope: the full `vitest run` suite. 15 files / 26 tests fail, identical to the clean
baseline for every file that can reach the changed modules (`fold.ts`, the four capture modules,
`render.ts`, `schema.ts`) — baselined file by file; the remaining failures import none of them.