---
uid: request-c750b120
id: REQ-351
type: request
title: 'fold: the page canvas, a band backdrop and the height response are each taken
  from the wrong evidence'
created_by: repro-console:repro-joyfulculinarycreations-com#4
created_at: '2026-09-29T20:57:54.723815+00:00'
updated_at: '2026-09-30T02:33:32.502686+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - fold-wrong
  - capture-loses-it
  - l1-cannot-express
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-4fdc129a
  commits:
  - working_sha: 799bde400f29eb1dc22a7e53a179da3c9b211f71
    reconcile_sha: null
    main_sha: null
  - working_sha: b9bc30bd5514a6df90ef33a4d8624812a71f0649
    reconcile_sha: null
    main_sha: null
  version: 0.2.415
---

# fold: the page canvas, a band's composited backdrop and the height response are each taken from the wrong evidence

Filed by `repro-console:repro-joyfulculinarycreations-com#4`, iteration 4 of the reproduction of
https://joyfulculinarycreations.com (sandbox site `repro-joyfulculinarycreations-com`).

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  — `capturedAt` **2026-09-29T19:46:13.536Z**, `captureSchema` **8**. One commit has landed since
  (`b14a67f78c fix(l1): hold the tracks the recovery invents, not just the fold's`, REQ-337); it
  touches none of the five residuals below, all of which I re-derived from this bundle and from the
  source on HEAD. **This is not a stale-bundle round.**
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-4/`

`gate.json`: `"verdict": "structural-failure"`, `pass false`, `l1Pass false`, `perceptualBreach false`,
`valuesBreach true`; perceptual mean **4.28/255** over **4.39%** of pixels in 12 regions;
`values.deltas` 20 (`matched` 86, `unmatched` 1, `unpairedActual` 1, `bandPaintActual` 3,
`worstTier` CRITICAL); `layout.findings` **296** — 259 `escape`, 27 `overlap`, 10 `clip`.
**unmeasured 4** (0 axes, 1 band, 2 populations, 1 probe).

`defect_class`: **`fold-wrong`**, `capture-loses-it`, `l1-cannot-express`, `instrument-blind`.

## The one sentence

Three separate places in the fold answer a question from the wrong evidence: the page's canvas colour
is taken from the *tallest band* rather than from the `<body>` background the bundle actually records
(**22.3% of the page's pixel disagreement, 0 deltas**); a run's *composited* backdrop — the photograph
plus its scrim, resolved by the browser — is promoted to an opaque card fill and painted back over
that photograph (**18.3%, 0 deltas**); and a viewport-height response measured at one width is applied
across the whole ladder, collapsing the hero to 49.5px (**36 of 259 escapes, 0 pixels**). A fourth
residual is the ceiling item the third one hits, and a fifth drops a run outright.

## Summary — five residuals, in the order to work them

| # | residual class | kind | `defect_class` | cost |
|---|---|---|---|---|
| 1 | `fold-takes-the-page-canvas-from-the-tallest-band-not-the-recorded-body-background` | class 1 | `fold-wrong` (+ `capture-loses-it`, `instrument-blind`) | 22.34% of page diff mass; 27.63% of the ranked region score; **0 deltas** |
| 2 | `fold-turns-a-run-s-composited-band-backdrop-into-an-opaque-card-plate` | class 1 | `fold-wrong` | 18.34% of page diff mass; 28.57% of the ranked region score; **0 deltas** |
| 3 | `fold-applies-a-single-width-height-probe-across-the-whole-ladder` | class 1 | `fold-wrong` | 36 of 259 escapes; **0 pixels** |
| 4 | `l1-viewport-height-response-is-node-level-and-unclamped` | **class 2** | `l1-cannot-express` | bounds the fix for 3 |
| 5 | `fold-drops-a-whitespace-only-run-that-reserves-a-line` | class 1 | `fold-wrong` | the round's highest-severity delta (CRITICAL, 4060) |

**Order and dependencies.**

- **1 and 2 are independent of each other and of everything else**, and together they are **40.7% of
  the page's total pixel disagreement at zero value deltas**. Land them first. They are the whole of
  this round's perceptual finding.
- **3 and 4 are one problem in two layers.** 3 can be *half*-fixed alone (stop emitting a response at
  widths no probe measured — that returns the hero to a pinned height, which is wrong differently but
  never absurd). Doing it properly needs 4, because L1 as it stands cannot say "100vh at ≥1024 and
  content height below", nor "never shorter than the content". Land 3's suppression first; 4 is the
  real fix and is a schema change.
- **5 is independent and small.**

Landing 1 and 2 alone is a success.

## Deliberately elsewhere, so nobody re-derives them

- The hero heading's **−11px half-leading** and the **−46.40625px dropped leading `<br>`** on
  "What people are saying" are **REQ-265**'s class, already carrying this exact bundle's arithmetic in
  `COMMENT-4021`. Re-measured byte-identically on this re-capture and appended there as a short note
  with the new mass attribution (**30.55%** of the page's diff mass, and 12 of the 27 gate overlaps).
  Not re-filed.
- The **1700px-wide document**, the `overflow` HIGH delta (`≤1280w` → `1700w`), the **10 `clip`
  findings** and all **56 `section-band-1` escapes** (the testimonial carousel's off-screen slides at
  `x −643.8 / −880.41 / −419.25` and `+760.2 / +1009.59`) are **REQ-332**'s issue 2. Re-measured and
  appended there.
- **`section-band-2` carrying no `viewportResponse` while both its children carry `{"yFactor": 1}`**
  — 57 of the 259 escapes — is **REQ-338**'s issue 4, whose `foldSectionBackgrounds` half has landed
  and whose `buildSolidBands` half has not. Re-measured and appended there, with the exact line that
  drops it.
- The remaining **110 escapes** (`card-2` 22, `backdrop-2` 20, `backdrop-3` 14, `backdrop-4` 14,
  `backdrop-5` 12, `backdrop-8` 8, `backdrop-9` 8, `card-3` 8, `card-6` 4) are copy reflowing taller
  than a surface whose height was measured on the ladder and interpolated off it — **REQ-337** /
  **BUG-160**'s class. Not re-filed.
- The instrument half of issue 1 — the comparator deriving the *reference's* `bodyBackground` from the
  same wrong evidence, so 22.34% of the page's diff mass is worth zero deltas — is filed separately as
  a `bug`, per §5 of the round brief.

## Paths used throughout

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-4
SLUG=repro-joyfulculinarycreations-com
```

The "page diff mass" figures are my own arithmetic over the two screenshots. It reproduces exactly:

```
python3 - <<'EOF'
from PIL import Image
import numpy as np
R=np.asarray(Image.open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/screenshot.full.png').convert('RGB')).astype(np.int32)
A=np.asarray(Image.open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-4/diff/actual.png').convert('RGB')).astype(np.int32)
h=min(R.shape[0],A.shape[0]); R=R[:h,:1280]; A=A[:h,:1280]
D=np.abs(R-A).mean(axis=2); T=D.sum()
def m(x0,y0,x1,y1,l): s=D[y0:y1,x0:x1]; print(f'{l:44s} {100*s.sum()/T:6.2f}%  mean {s.mean():7.2f}')
print(f'total abs-diff mass {T:,.0f}')
m(0,2934,1280,2950,'canvas strip 1              -> issue 1')
m(0,3474,1280,3490,'canvas strip 2              -> issue 1')
m(0,4440,1280,4441,'canvas strip 3              -> issue 1')
m(290,2713,979,2866,'veggie plate                -> issue 2')
m(0,311,1280,465,'hero headings               -> REQ-265')
m(255,2962,1025,3060,'"What people are saying"    -> REQ-265')
EOF
```

```
total abs-diff mass 23,626,948
canvas strip 1              -> issue 1   10.81%  mean  133.00
canvas strip 2              -> issue 1   10.81%  mean  133.00
canvas strip 3              -> issue 1    0.72%  mean  133.00
veggie plate                -> issue 2   18.34%  mean   41.11
```

---

## Issue 1 — the page canvas is taken from the tallest band, so two 15px strips the reference paints white paint `#7a7a7a`

**Residual class:** `fold-takes-the-page-canvas-from-the-tallest-band-not-the-recorded-body-background`

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`** (leading), with `capture-loses-it` and
`instrument-blind` beside it — each defended below from the test that found it.

### The test I ran, and what came back

*Question 2 of the brief's three: is the value in the L1 document, and is it right?*

```
python3 -c "import json;p=json.load(open('$ITER/page.json'));print(p['data']['page']['l1']['background'])"
```

→ `#7a7a7a`. The served document agrees (`$ITER/site/home.html`):

```css
html, body { margin: 0; padding: 0 } body { background-color: #7a7a7a }
```

The reference's own bundle says otherwise, at **every one of its seven projections**:

```
python3 -c "import json;m=json.load(open('$REF/multistate.json'));
print([ (p['viewport'], p['manifest']['bodyBackground']) for p in m['projections'] ])"
```

```
(320x800, '#ffffff') (375x800, '#ffffff') (768x1024, '#ffffff') (1024x768, '#ffffff')
(1280x800, '#ffffff') (1440x900, '#ffffff') (1280x1000, '#ffffff')
```

and the page's own mirrored stylesheet has it in one line — `$REF/assets/reset.css`:

```css
body{background-color:#fff;color:#333;font-family:…}
```

`capture.json` carries **no `bodyBackground` key at all** (its top level is
`url, host, path, title, capturedAt, captureSchema, viewport, theme, sections, assets`). That is the
`capture-loses-it` line: the extractor computes the value (`extract.ts:3068`, `bodyBackground: bodyBg`)
and writes it into `multistate.json`, and the bundle's *primary* record drops it.

### Where the wrong value comes from

`tools/generate/src/l1/fold.ts:3941-3974`. The canvas is the fill with the greatest **total band
height**, and the recorded `<body>` background is reached only if that search finds nothing:

```ts
const bandHeightByFill = new Map<string, number>()
for (const b of [...bandNodes, ...backdropNodes]) { … bandHeightByFill.set(fill, … + (kf.height ?? 0)) }
let band: string | undefined
let bandExtent = 0
for (const [fill, h] of bandHeightByFill) { if (h > bandExtent) { bandExtent = h; band = fill } }
if (!band) { /* most common run fill */ }
if (!band) { band = projections.map((p) => p.manifest.bodyBackground).find(…) }   // never reached here
```

On this page, from `capture.json`'s own section boxes:

| fill | bands | total height |
|---|---|---|
| `#7a7a7a` | §3 (1331.546875) + §8 (950.09375) | **2281.640625** |
| `#ffffff` | §2 (535.96875) + §6 (525.015625) | 1060.984375 |
| `#000000` | §1 (800) | 800 |

`#7a7a7a` wins, and `p.manifest.bodyBackground` — the literal answer, present seven times over — is
never consulted. The comment above the fallback ("the dominant band reads truer than the canvas hiding
behind them") is the design decision; this page is the counterexample.

### Where it costs

The page has three places where no band paints and the canvas shows through — `capture.json`
`sections[5]` and `sections[7]`, both `{"kind": "none"}`, and the 1px gap between §8 and §9. They are
the `margin-top:15px; margin-bottom:15px` of the testimonials section (`$REF/assets/post-4401.css`:
`.elementor-4401 .elementor-element.elementor-element-e1fc299{…margin-top:15px;margin-bottom:15px;}`),
so what shows there is the canvas and nothing else.

| document y | ref pixel at x=640 | ours |
|---|---|---|
| 2936, 2940, 2946 | `(255, 255, 255)` | `(122, 122, 122)` |
| 3476, 3480, 3486 | `(255, 255, 255)` | `(122, 122, 122)` |
| 4440 | `(255, 255, 255)` | `(122, 122, 122)` |

`|255 − 122| = 133`, and the mean over each strip is **exactly 133.00/255** — the highest mean anywhere
on this page, over 31 of 4743 rows. **22.34% of the page's total absolute difference mass.**

`regions.json` ranks the same two strips at the top of what it can see:

- region #3 — `bbox {x:0, y:2928, w:1280, h:32}`, `score 10004.23`, `meanDiff 62.53`, `area 40960`;
  `nodes.ref[0]` = `{kind: "section", index: 5, role: "section", box: {0, 2934.52, 1280, 15}, overlap {ofRegion 0.47, ofNode 1}}`,
  and `nodes.actual[0]` is the identical record. Both sides name the same band; **neither side names a
  run**, which is exactly right — the disagreement is the paint behind everything.
- region #4 — `bbox {x:0, y:3472, w:1280, h:16}`, `score 8645`, `meanDiff **108.06**` (the highest
  `meanDiff` of the twelve), `nodes.ref[0]` / `nodes.actual[0]` both `{kind: "section", index: 7, box: {0, 3474.53, 1280, 15/14.98}}`.

Together **18649.23 of the 67497.33 ranked region total = 27.63%**.

**Zero value deltas.** `values-diff.json` contains no `bodyBackground` delta and no `surfaceFill`
delta on §5 or §7, because both manifests report `"bodyBackground": "#7a7a7a"` — see the accompanying
`bug` for why the reference side is wrong too. That is the `instrument-blind` line.

### The proposed change

1. **Capture** — write `bodyBackground` into `capture.json` (the extractor already computes it; this is
   a schema bump and needs a re-capture to take effect on existing bundles).
2. **Fold** — invert the precedence in `fold.ts:3951-3974`: the recorded canvas is the *first* answer,
   not the last. Fall back to the tallest band only when no projection recorded one. A band that is
   merely the tallest is evidence about bands, not about `<body>`.

Until the capture half lands, the fold can read `projections[].manifest.bodyBackground` first — it is
already in scope at that line and already correct on this bundle, so this residual is closeable by a
`1c refold` alone.

### How to see it, and how to know it is fixed

```
1c refold --ref $REF
python3 -c "import json;l=json.load(open('$REF/l1.json'));print('l1 background:', l['background'])"
python3 -c "import json;m=json.load(open('$REF/multistate.json'));print('recorded  :', {p['manifest']['bodyBackground'] for p in m['projections']})"
```

- **wrong now**: `l1 background: #7a7a7a` against `recorded : {'#ffffff'}`.
- **right when fixed**: `l1 background: #ffffff`.

Then, end to end:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref $REF --sandbox --out /tmp/gate-after
python3 - <<'EOF'
from PIL import Image
import numpy as np
A=np.asarray(Image.open('/tmp/gate-after/actual.png').convert('RGB'))
print('y=2940 x=640 ->', tuple(A[2940,640]))
print('y=3480 x=640 ->', tuple(A[3480,640]))
EOF
```

- **wrong now**: `(122, 122, 122)` at both.
- **right when fixed**: `(255, 255, 255)` at both, and `regions.json` loses regions #3 and #4
  (18649.23 of its 67497.33 ranked score).

---

## Issue 2 — a run's composited backdrop is promoted to an opaque card fill and painted back over the photograph it was sampled from

**Residual class:** `fold-turns-a-run-s-composited-band-backdrop-into-an-opaque-card-plate`

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`** — the capture carries the band's
image and overlay correctly (they are already in L1, on `backdrop-6`), L1 can express both, the
renderer honours what it is given, and the fold invents a second opaque box on top.

### The test I ran, and what came back

*Question 2 again: is the value in the L1 document, and is it right?*

`$ITER/page.json`, node `0.20` (`section-bg-2`) and its three children:

```json
{ "kind": "box", "id": "backdrop-6",
  "axes": { "surfaceFill": "#ffffff",
            "backgroundImageUrl": "/assets/market-vegetables-produce-6329164.jpg",
            "overlay": { "color": "#141e14", "opacity": 0.67, "blendMode": "darken" } },
  "geometry": { "keyframes": [ …, { "at": 1280, "x": 0, "y": 0, "width": 1280, "height": 267 } ] } }

{ "kind": "container", "id": "card-3",
  "axes": { "surfaceFill": "#636a63" },
  "geometry": { "keyframes": [ …, { "at": 1280, "x": 290, "y": 45, "width": 689, "height": 153.69 } ] },
  "children": [ "\"It's not just about eating your veggies…\"", "Chef Sarah Joy", "Owner" ] }
```

`backdrop-6` is **exactly right** — it is the section's own record, `capture.json` `sections[4].background`
= `{"kind":"image","color":"#ffffff","image":"assets/market-vegetables-produce-6329164.jpg","overlay":{"color":"#141e14","opacity":0.67,"blendMode":"darken"}}`, to the digit.

`card-3` is a 689×153.69 opaque plate, emitted after it, served as:

```css
.l1-24 { position: absolute; top: 45px; left: 290px; width: 689px; height: 153.69px }
.l1-24 { display: flex; flex-direction: column; background-color: #636a63 }
```

**`#636a63` is not a colour this page declares anywhere.** It is the composite the browser paints:
`darken(#141e14)` at 0.67 over `#ffffff` = `(0.33·255 + 0.67·20, 0.33·255 + 0.67·30, 0.33·255 + 0.67·20)`
= `(97.6, 104.3, 97.6)` — and `#636a63` is `(99, 106, 99)`. The capture records it as such and says so:
`$ITER/diff/expected-manifest.json`, the run `"It's not just about eating your veggies…"`:

```json
{ "surfaceFill": "#636a63",
  "surface": { "self": false, "box": { "x": 0, "y": 2667.515625, "width": 1280, "height": 267 }, … },
  "box": { "x": 290, "y": 2712.515625, "width": 689, "height": 78 } }
```

**`"self": false`** — the run paints no surface of its own — and the painting ancestor's box is
**1280 wide**, i.e. the band. The reproduction's own manifest gives the same run
`"surface": {"self": false, "box": {"x": 290, "y": 2712.52, "width": 689, "height": 153.69}}` — a
689-wide surface where the reference has a 1280-wide one. That difference *is* the plate.

### Where the wrong value comes from — three lines, in order

`tools/generate/src/l1/fold.ts`:

```ts
// 3652
const surfFill = (widest.surfaceFill ? colorToHex(widest.surfaceFill) : null) ?? undefined
```

The run's *composited* fill is taken unconditionally. `widest.surface?.self` is never read — `grep -n
"surface\.self" tools/generate/src/l1/fold.ts` returns nothing.

```ts
// 3677
const shapeBoxAt = (el, at) => { const shape = el.surface?.box; return shape && shape.width < at ? shape : undefined }
```

The band-wide surface box is deliberately discarded at the width it spans (`1280 < 1280` is false), per
the comment above it — "A surface that spans the whole viewport is the *band*, not a card". Correct
intent, but it drops the band's **rect** while keeping the band's **fill**.

```ts
// 3862-3866, 3876-3883
const pageContentWidth = Math.max(1, ...surfaceRows.map((r) => r.widest.width))   // 1280
const isFullWidth = (r) => r.widest.width >= 0.7 * pageContentWidth                // >= 896
…
else if (r.fill || r.gradient || hasCardTreatment(r)) cardRows.push(r)
```

`r.widest` is now the **run's** box, 689px wide. `689 < 896`, so the band/card decision is made on the
run instead of on the surface, the row becomes a card row, and `buildCards` (`fold.ts:2721`,
`if (rep.fill) axes.surfaceFill = rep.fill`) gives it the opaque `#636a63`.

### The pixels

An exactly rectangular flat region, measured off the two screenshots:

```
python3 - <<'EOF'
from PIL import Image
import numpy as np
R=np.asarray(Image.open('…/screenshot.full.png').convert('RGB')).astype(int)
A=np.asarray(Image.open('…/iteration-4/diff/actual.png').convert('RGB')).astype(int)
for x in (289, 290, 300, 600, 970, 978, 979):
    print(x, 'ref', tuple(R[2800,x]), 'ours', tuple(A[2800,x]))
EOF
```

| x at y=2800 | reference | reproduction |
|---|---|---|
| 289 | `(32, 34, 13)` | `(32, 35, 13)` |
| **290** | `(31, 33, 9)` | **`(99, 106, 99)`** |
| 300 | `(28, 34, 3)` | `(99, 106, 99)` |
| 600 | `(78, 46, 42)` | `(99, 106, 99)` |
| 970 | `(69, 77, 71)` | `(99, 106, 99)` |
| 978 | `(45, 59, 42)` | `(99, 106, 99)` |
| **979** | `(47, 61, 45)` | `(47, 62, 44)` |

Flat `#636a63` from x=290 to x=978 inclusive (689px) and y=2713 to y=2865 (153px), agreeing to 1/255
on either side of it. **18.34% of the page's total diff mass**, mean 41.11/255.

`regions.json` region #2 — `bbox {x:288, y:2704, w:688, h:160}`, `score 19281.6` (**28.57% of the
67497.33 ranked total**, the second-ranked region), `meanDiff 50.61`, `area 110080`. Both `nodes`
sides name the same run at 49% of the region and the same `{kind: "section", index: 4}` at 100% — the
plate is not in either manifest's element list at all, which is why the region ranker can see it and
`values-diff` cannot.

**Zero value deltas on the plate.** Worse than zero: the comparator confirms it. Both manifests report
that run's `surfaceFill` as `#636a63` — the reference because the browser composited the photograph and
the scrim, the reproduction because the fold painted an opaque box of exactly that colour. The mistake
reproduces the measurement.

### The proposed change

Gate the fill on ownership, which the capture already records:

```ts
const surfFill = widest.surface?.self ? (colorToHex(widest.surfaceFill) ?? undefined) : undefined
```

A run whose painting ancestor is the band contributes **no** card fill. It may still contribute a card
*rect* and *treatments* (border, radius, shadow) — those are measured on the wrapper and are not
composited values.

If that is too blunt for other sites, the narrower form is: when `shapeBoxAt` declines a surface for
being band-wide, drop that row's `fill` along with its rect, because the two came from the same
element and keeping one without the other is what produces an opaque copy of a backdrop.

### How to see it, and how to know it is fixed

```
1c refold --ref $REF
python3 -c "import json;l=json.load(open('$REF/l1.json'));
n=[c for c in l['root']['children'] if c.get('id')=='section-bg-2'][0];
print([(c['id'], c.get('axes')) for c in n.get('children',[])])"
```

- **wrong now**: includes `('card-3', {'surfaceFill': '#636a63'})` beside
  `('backdrop-6', {'surfaceFill': '#ffffff', 'backgroundImageUrl': …, 'overlay': …})`.
- **right when fixed**: `card-3` carries no `surfaceFill` (it may keep its geometry and its children,
  and may disappear entirely if it has no other treatment).

Then, end to end:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref $REF --sandbox --out /tmp/gate-after
python3 -c "from PIL import Image;import numpy as np;
A=np.asarray(Image.open('/tmp/gate-after/actual.png').convert('RGB'));print(tuple(A[2800,600]))"
```

- **wrong now**: `(99, 106, 99)`.
- **right when fixed**: about `(78, 46, 42)` — the photograph under its scrim, as at x=289 and x=979
  today. `regions.json` should lose region #2 (`score 19281.6`).

---

## Issue 3 — a viewport-height response measured at one width is applied at every width, and the hero collapses to 49.5px

**Residual class:** `fold-applies-a-single-width-height-probe-across-the-whole-ladder`

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`** — the capture measured a response at
one width and nothing anywhere claims it holds at the others; the fold asserts it at all six. No
perceptual average can see this: the page is exact at the captured viewport heights.

### The test I ran, and what came back

*Question 3 of the brief's three: does the render agree with L1? Yes — the render is doing exactly
what L1 says, and L1 says something the reference never did. So question 2: is the L1 value right?*

`$ITER/page.json`, node `0.21` (`section-bg-0`, the hero):

```json
{ "kind": "container", "id": "section-bg-0",
  "geometry": {
    "keyframes": [
      { "at": 320,  "x": 0, "y": 0, "width": 320,  "height": 353.38, "atHeight": 800 },
      { "at": 375,  "x": 0, "y": 0, "width": 375,  "height": 325.3,  "atHeight": 800 },
      { "at": 768,  "x": 0, "y": 0, "width": 768,  "height": 305.5,  "atHeight": 1024 },
      { "at": 1024, "x": 0, "y": 0, "width": 1024, "height": 768,    "atHeight": 768 },
      { "at": 1280, "x": 0, "y": 0, "width": 1280, "height": 800,    "atHeight": 800 },
      { "at": 1440, "x": 0, "y": 0, "width": 1440, "height": 900,    "atHeight": 900 } ],
    "viewportResponse": { "heightFactor": 1 } } }
```

`heightFactor: 1` is a **single node-level scalar**, so the renderer applies it to every keyframe
(`$ITER/site/home.html`):

```css
.l1-28 { top: 0px; left: 0px; width: 320px;  height: calc(353.38px + (100vh - 800px)) }
.l1-28 { top: 0px; left: 0px; width: 768px;  height: calc(305.5px  + (100vh - 1024px)) }
.l1-28 { top: 0px; left: 0px; width: 1024px; height: calc(768px    + (100vh - 768px)) }
```

At 768px wide and 768px tall that is `305.5 + (768 − 1024)` = **49.5px**, and the gate measured exactly
that — `gate.json` `layout.findings`:

```json
{ "kind": "escape", "width": 768, "height": 768,
  "detail": "at 768px×768px: 'Learn More' is no longer covered by its backing surface backdrop-1 — 95px below its bottom edge",
  "paths": ["0.21.5.0", "0.21.1"],
  "boxes": [ {"x":346.83,"y":131.5,"width":69.35,"height":13},
             {"x":0,"y":0,"width":768,"height":49.5} ] }
```

**36 of the 259 escapes** are this — `section-bg-0` 12, `backdrop-0` 12, `backdrop-1` 12, every one of
them at viewport height 768 and none at 1536. (`backdrop-0` and `backdrop-1` are the hero's own
children and carry the same `{"heightFactor": 1}`.)

### Why `heightFactor: 1` is wrong below 1024

The reference's hero height at every projection, from `$REF/multistate.json` `sections[1].box.height`:

| projection | hero height | is it `100vh`? |
|---|---|---|
| 320×800 | 353.375 | no |
| 375×800 | 325.296875 | no |
| **768×1024** | **305.5** | **no** |
| 1024×768 | 768 | yes |
| 1280×800 | 800 | yes |
| 1440×900 | 900 | yes |
| 1280×1000 | 1000 | yes |

The page's own rule is `.elementor-section.elementor-section-height-full{height:100vh}`
(`$REF/assets/custom-frontend.min.css`) and the hero carries that class
(`<section class="… elementor-section-height-full …" data-id="8d3c33b">` in `raw.html`) — but something
in the ≤768 media block overrides it, and the measurement says so at three widths. The hero tracks the
viewport at ≥1024 and does not at ≤768.

The fold cannot know that, because **there is exactly one height probe**:

```
tools/generate/src/cli/capture/values-diff.ts:1128
export const HEIGHT_PROBE_VIEWPORTS: readonly Viewport[] = [{ width: 1280, height: 1000 }]
```

`heightProbesFor` (`fold.ts:225-236`) therefore returns one pair, at width 1280, and `responseFrom`
(`fold.ts:283-292`) turns it into one `{yFactor, heightFactor}` that is attached to the node and
applied everywhere. On this page the whole ladder inherits a rule identified at one width, and at 768
it produces a band shorter than one line of its own copy.

Note this is a **new** failure mode created by a correct fix: before REQ-338 issue 4 landed,
`section-bg-0` had no response at all and escaped 79 times at height 1536. It now escapes 12 times at
height 768 instead. Net better; the remaining 12 are this.

### The proposed change

Two halves, either of which removes the absurdity, both of which are wanted:

1. **Do not assert a response at a width nothing measured.** Emit `viewportResponse` only for the
   widths a height probe covers — which, with issue 4 below unresolved, means emitting it only when
   *every* ladder width has a probe, or not at all. That returns the hero to a pinned height: wrong in
   a different way (REQ-338 issue 4's old failure), but never shorter than its content.
2. **Probe more widths.** `HEIGHT_PROBE_VIEWPORTS` costs one projection each. Adding `{320, 1000}` and
   `{768, 768}` would have measured `heightFactor: 0` at those widths directly. This is capture-side:
   it needs a re-capture to take effect.

The real fix is issue 4.

### How to see it, and how to know it is fixed

```
1c l1-gate repro-joyfulculinarycreations-com --ref $REF
python3 -c "import json;l=json.load(open('$REF/l1.json'));
n=[c for c in l['root']['children'] if c.get('id')=='section-bg-0'][0];g=n['geometry'];
print(g.get('viewportResponse'));
print([(k['at'],k.get('height'),k.get('atHeight')) for k in g['keyframes']])"
```

- **wrong now**: `{'heightFactor': 1}` with `[(320, 353.38, 800), (375, 325.3, 800), (768, 305.5, 1024), (1024, 768, 768), (1280, 800, 800), (1440, 900, 900)]`
  — one factor over keyframes that plainly do not share one rule.
- **right when fixed**: the 768 keyframe resolves to `305.5` at *any* viewport height. Check it
  directly in the served CSS rather than in L1, since either fix changes L1 differently:

```
grep -o 'height: calc(305.5px[^)]*)[^}]*' $ITER/site/home.html   # after a re-render
```

- **wrong now**: `height: calc(305.5px + (100vh - 1024px))`.
- **right when fixed**: `height: 305.5px`, or a form whose value at `100vh: 768` is `305.5`, not `49.5`.
- and `1c l1-gate` loses the 36 escapes on `section-bg-0` / `backdrop-0` / `backdrop-1`
  (259 → 223).

---

## Issue 4 — L1's viewport-height response is one node-level scalar with no per-width variant and no floor

**Residual class:** `l1-viewport-height-response-is-node-level-and-unclamped`

**Class 2 — L1 cannot express it.** `defect_class`: **`l1-cannot-express`** — this is the ceiling item
issue 3 runs into. Even a fold that had measured the truth could not write it down.

### The test I ran, and what came back

*Question 1 of the brief's three: can L1 express it? Look for the axis in the L1 types.*

`packages/site-schema/src/l1/schema.ts:145-150`:

```ts
export const l1ViewportResponseSchema = z
  .object({
    yFactor: finite.min(-10).max(10).optional(),
    heightFactor: finite.min(-10).max(10).optional(),
  })
  .strict()
```

and it hangs off the **geometry**, not off a keyframe — `L1Geometry` is
`{ keyframes: L1Keyframe[], segments?, anchor?, viewportResponse? }`, while `atHeight` *is* per
keyframe (`l1KeyframeSchema`). So the two things this page needs are both unauthorable:

1. **A response that differs by width.** "`heightFactor: 1` at ≥1024 and `0` below" has no
   representation: `viewportResponse` is one object for the whole node, `.strict()` refuses any extra
   key, and there is no `viewportResponse` field inside `l1KeyframeSchema`. The only workaround is to
   split the node into two with `visibility` ranges, which duplicates the paint and the content.
2. **A floor.** The documented semantics (schema.ts:135-143) are pure linear extrapolation —
   `height = keyframe.height + heightFactor × (100vh − keyframe.atHeight)` — with no `min`/`max`.
   `min-height: 100vh` (a *max* of content and viewport, which is what most full-height heroes
   actually are) cannot be said; nor can "never shorter than the content it backs", which would have
   turned issue 3's 49.5px into 305.5px on its own.

I confirmed the renderer honours exactly this and nothing more:
`packages/framework/src/l1/render.ts:2928-2929`
`const yF = geo.viewportResponse?.yFactor ?? 0; const hF = geo.viewportResponse?.heightFactor ?? 0` —
one pair of scalars for all keyframes, emitted as a bare `calc()` with no clamp.

### The proposed change

Either (or both):

- **per-keyframe response** — move `viewportResponse` onto `l1KeyframeSchema` (keeping the geometry-level
  one as the default), so a node can respond at one width and not at another. This is the smaller
  change and it is what the measurement naturally produces, since every probe is at a width.
- **a floor** — add `heightFloor?: 'content' | number` (or express the whole thing as
  `max(<keyframe form>, <floor>)`), so `min-height: 100vh` and "never shorter than my content" are both
  sayable. The renderer already emits `calc()`; `max()` is the same shape.

This will **raise** the delta count if anything, not lower it: it makes a height rule the gate
currently cannot compare into one it can.

### How to see it, and how to know it is fixed

```
python3 -c "
import json
from pathlib import Path
print(Path('packages/site-schema/src/l1/schema.ts').read_text().split('l1ViewportResponseSchema')[1][:200])"
```

- **wrong now**: `= z.object({ yFactor: …, heightFactor: … }).strict()` on `L1Geometry`, and
  `grep -n 'viewportResponse' packages/site-schema/src/l1/schema.ts` shows it nowhere inside
  `l1KeyframeSchema`.
- **right when fixed**: a document that says "this node's height tracks the viewport at 1024 and above
  and is fixed below" validates. The acceptance test is the one issue 3 names: the served CSS for
  `section-bg-0` at width 768 must resolve to `305.5px` at `100vh: 768`, without splitting the node.

---

## Issue 5 — a whitespace-only run that reserves a line is dropped, because `String.trim()` eats U+00A0

**Residual class:** `fold-drops-a-whitespace-only-run-that-reserves-a-line`

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`** — the capture carries the run
(REQ-338's issue 6 landed: `capture.json` now holds 35 U+00A0), L1 can express a text leaf, and the
fold throws it away.

### The test I ran, and what came back

`values-diff.json`'s highest-severity delta of the round:

```json
{ "text": "\u00a0", "role": "body", "property": "missing",
  "expected": "present", "actual": "absent",
  "kind": "presence", "tier": "CRITICAL", "magnitude": 0, "severity": 4060 }
```

and it is the round's only `unmatched`. The reference record
(`$ITER/diff/expected-manifest.json`):

```json
{ "text": "\u00a0", "role": "body", "a11yRole": "generic",
  "box": { "x": 674.71875, "y": 2274.625, "width": 162.0625, "height": 21.59375 },
  "fontSizePx": 18, "lineHeightPx": 21.6, "color": "#ffffff", "fontFamily": "Karla, raleway",
  "renderedTextBox": { "x": 674.71875, "y": 2273.625, "width": 4.28125, "height": 22 } }
```

A deliberate `&nbsp;` spacer holding a 21.59px line open. `actual-manifest.json` has **no element whose
text is whitespace-only** — `[e for e in actual['elements'] if (e.get('text') or '').strip()=='']` is
empty.

The line that drops it, `tools/generate/src/l1/fold.ts:3546`:

```ts
if (!sample.textless && sample.text.trim() !== '') {
```

`'\u00a0'.trim() === ''` in JavaScript — `String.prototype.trim` strips the full Unicode whitespace
set, U+00A0 included. So a run whose *entire content* is the non-breaking space the page author put
there on purpose fails the "never had substance" test three lines later
(`fold.ts:3723-3726`, `signal(sample, 'empty text run — no leaf emitted', …)`).

### The proposed change

Test for substance with a predicate that does not treat U+00A0 as whitespace. The narrowest form is
to trim only the ASCII whitespace class here — `sample.text.replace(/[ \t\r\n\f\v]+/g, "") !== ""` —
so U+00A0, U+2007, U+202F, U+2060 and U+200B all count as content. A run that occupies a line box
occupies a line box.

This will **lower** the unmatched count by one and **raise** `matched` by one — it makes a run that is
currently compared to nothing into one that is compared.

### How to see it, and how to know it is fixed

```
1c refold --ref $REF
python3 -c "import json;l=json.load(open('$REF/l1.json'));
def walk(n):
    yield n
    for c in n.get('children') or []: yield from walk(c)
print([n.get('text') for n in walk(l['root']) if isinstance(n.get('text'),str) and n['text'].strip()==''])"
```

- **wrong now**: `[]`.
- **right when fixed**: `['\xa0']` (one U+00A0) — one text leaf whose keyframe at 1280 is
  `{x: 674.72, y: 2274.63, width: 162.06}`.
- and `values-diff.json` loses its single `unmatched` and its CRITICAL `missing` delta.

---

## A note on the delta count ([[REQ-277]])

Issues 1 and 2 are **40.68% of this page's total pixel disagreement and 56.20% of the ranked region
score, and between them they produce zero value deltas.** Fixing them will not move `values.deltas`
from 20, because 20 never counted them — and in issue 2's case the comparator actively *agrees* with
the defect, because the plate is painted in exactly the colour the measurement samples.

What should move is the **unmeasured set** and the ranked score. Issue 5's fix raises `matched` by one
and clears the round's only `unmatched`. Issue 4's fix makes a height rule comparable that is currently
not compared at all. None of the five is a case where closing a gap should lower a count.


---

# What landed

All five residuals are addressed. The shape of the fix, issue by issue, and where each is proven.

## Issue 1 — the page canvas is the recorded `<body>` background

**`tools/generate/src/l1/fold.ts`** — the precedence is inverted. `projections[].manifest.bodyBackground`
is now the *first* answer; the tallest-band search is the fallback, reached only when no projection
recorded a canvas at all (a pre-schema-10 bundle, or a page that paints nothing on `<body>`); the
most-common-run-fill guess is the last resort as before. A band that is merely the tallest is evidence
about bands, not about `<body>`.

**`tools/generate/src/cli/capture/{pipeline,types,schema}.ts`** — the capture half. `capture.json`'s top
level now carries `bodyBackground` (optional: omitted when the page paints nothing on `<body>`, so an
absent key stays *not measured* rather than asserting a colour nobody saw). `CAPTURE_SCHEMA` **9 → 10**
with both new axes listed, so an older bundle is *told* it cannot answer the question instead of
silently returning the wrong colour. (REQ-347 landed schema 9 while this was in flight; hence 10.)

**`tools/generate/src/cli/capture/value-axes.ts`** — the comparator's reference side now reads
`recorded?.bodyBackground ?? capture.bodyBackground ?? pageBaseOf(capture.sections)`. BUG-169 (landed
separately) closed the first inference; the primary record closes the second, so the widest-band guess
is reached only for a bundle whose primary record *and* projection ladder are both silent.

## Issue 2 — a composited band backdrop never becomes a card plate

**`tools/generate/src/l1/fold.ts`** — a new `SurfaceRow.bandSurface` keeps the surface rect that
`shapeBoxAt` declines for spanning the viewport. Declined as a card *rect*, retained as evidence about
the *fill* — because dropping the rect silently while keeping the fill from the same element is exactly
what produced an opaque copy of a backdrop. `compositedBandRows` then asks the question the capture can
answer: does this row's fill come from a band whose own section record says it paints a photograph or a
veil? If so the colour is a composite the browser resolved, not a value the page declares, and the row
contributes **no fill**. It may still become a card for `hasOwnCardTreatment` — border, accent rule,
shadow, radius, all measured on the run's own element and nobody else's.

Deliberately **not** the blunter rules, and the test file records why:

- *"a run whose painting ancestor is not itself contributes no fill"* — on a conventional page a card's
  runs are all `surface.self: false`; that is what a card *is*. It would delete every card fill on every
  site.
- *"any band-wide surface contributes no fill"* — a full-width run on a plain solid band is band-wide
  too, and its fill is the only evidence `buildSolidBands` has for that band.

What makes this case different is that the section record names something the run's colour is a
composite **of**, so the section record is strictly better evidence and the composite is not evidence at
all. This is the card-side twin of REQ-338's `bandBaseFill` scrim guard.

## Issues 3 + 4 — the height response is per keyframe, and probed at every width

These are one problem in two layers and landed as one change.

**`packages/site-schema/src/l1/schema.ts` (issue 4, a schema change)** — `viewportResponse` moves off
`l1GeometrySchema` and onto `l1KeyframeSchema`, beside the `atHeight` it is measured from. Per keyframe:

```
y      = keyframe.y      + keyframe.viewportResponse.yFactor      * (100vh - keyframe.atHeight)
height = keyframe.height + keyframe.viewportResponse.heightFactor * (100vh - keyframe.atHeight)
```

A keyframe at a width no height probe measured carries no response at all — pinned at what the capture
saw, wrong only off the captured heights and **never absurd**. There is deliberately **no** node-level
default left to inherit from: two ways to say the same thing is two things to keep in agreement, and the
one that held a single rule for a whole ladder is the defect. The envelope's `.strict()` therefore
refuses the old form outright rather than quietly honouring it.

The ticket offered *per-keyframe response* or *a floor* (`heightFloor: 'content' | number`) or both.
**Per-keyframe landed; the floor did not.** Per keyframe is the smaller change, is what the measurement
naturally produces (every probe is at a width), and on its own removes the absurdity issue 3 names —
49.5px becomes 305.5px because the 768 keyframe simply states no response. A floor would additionally
let `min-height: 100vh` and "never shorter than my content" be said; nothing in this round needs it, and
it is a separate axis with its own renderer work (`max()` beside `calc()`). Left unfiled — raise it when
a page needs it.

**`packages/site-schema/src/l1/validate.ts`** — `responseNeedsAtHeight` (a new named structural rule):
a keyframe stating a response must also state `atHeight`, or the factor would be applied against an
assumed 0 and `100vh` would become `y + 100vh`. `flowPlacementHasNoYResponse` is now asked per keyframe
for the same reason.

**`packages/framework/src/l1/render.ts`** — the response is read per keyframe. Across an interpolated
segment the **lower** keyframe's response governs, for the same reason its `atHeight` does: the segment's
rules are the ones that took effect at `a.at`. A segment whose lower keyframe was never probed asserts
nothing.

**`tools/generate/src/l1/fold.ts`** — `sectionBoxFactors` / `sectionViewportResponses` are keyed by the
width the probe measured rather than collapsed to one pair per section. The old collapse was not a
considered average: because `HEIGHT_PROBE_VIEWPORTS` held one entry, the last probe read simply
overwrote the others. `buildSolidBands` loses its "every width must agree, or the band is not
describable as one height rule" gate — that gate existed only because one field had to serve the whole
ladder, so a band that grew at the two widest widths and not below was described as growing nowhere.
`buildCards` and `rebaseInto` compose per keyframe, at the same width on both sides.

**`tools/generate/src/l1/probes.ts`** — `evalGeometry` (the L1 oracle) resolves the governing response
the same way it resolves geometry, so the oracle and the renderer agree at every width by construction.
`heightBelongsToContent` now refuses a node whose height is a viewport function at **any** width.

**`tools/generate/src/cli/capture/values-diff.ts` (issue 3's capture half)** —
`HEIGHT_PROBE_VIEWPORTS` is **derived from `RESPONSIVE_VIEWPORTS`** (`height + 200` at each ladder
width) so the two cannot drift. With the response per keyframe, an unprobed width asserts nothing —
honest, but silent; so the number of probed widths is exactly the number of widths at which the axis is
measurable at all. Cost: one extra projection per width, on a capture the operator takes once.

## Issue 5 — a run that occupies a line box occupies a line box

**`tools/generate/src/l1/fold.ts`** — `hasTextSubstance(text)` strips only the ASCII whitespace class
(`[ \t\r\n\f\v]`), so U+00A0, U+2007, U+202F, U+2060 and U+200B all count as content. Exported and read
by every stage that has to agree about which runs exist — the fold's leaf decision
(`classifyElement`, the text-leaf gate), the L1 oracle's reference-side run list (`oracleBoxes`) and the
round-trip projection (`expectedTextManifest`) — so a run one stage keeps cannot be a run another
silently drops.

# Test plan

New: **`tests/test_UAT_FC_REQ-351_the_fold_reads_the_evidence_it_has.test.ts`** — 13 UATs.

| UAT | proves |
|---|---|
| `the_page_canvas_is_the_recorded_body_background_not_the_tallest_band` | grey bands totalling 2280px lose to the recorded `#ffffff`; the canvas reaches the served CSS; the grey bands still paint themselves |
| `a_bundle_that_recorded_no_canvas_still_falls_back_to_the_tallest_band` | inverting the precedence does not make an older bundle worse |
| `the_bundles_primary_record_carries_the_canvas_and_says_so_when_it_does_not` | `CAPTURE_SCHEMA ≥ 10`; a schema-9 bundle is told `bodyBackground` is missing; one that carries it is not |
| `a_run_standing_on_a_photographic_band_contributes_no_card_plate` | the band keeps its photograph and scrim; `#636a63` appears in no node and in no stylesheet |
| `a_run_on_a_photographic_band_keeps_a_treatment_it_measured_on_itself` | the accent rule survives as a card; that card carries no fill |
| `a_run_on_a_plain_solid_band_still_reports_that_bands_fill` | the negative control — the rule is narrow, not blunt |
| `the_height_axis_is_probed_at_every_ladder_width` | probe widths ≡ ladder widths, each differing from its ladder height |
| `a_height_rule_measured_at_one_width_is_not_applied_at_another` | the filed defect end to end: 768 pinned at 305.5px with no `100vh` term, 1280 tracking the viewport, in L1 *and* in the served CSS |
| `l1_states_a_height_response_at_one_width_and_not_at_another` | the document issue 4 says was unauthorable now validates and renders |
| `a_keyframe_response_without_the_height_it_was_measured_from_is_refused` | `responseNeedsAtHeight` |
| `a_node_level_response_is_no_longer_a_place_to_put_one` | the old form is refused, not quietly honoured |
| `a_run_whose_whole_content_is_a_non_breaking_space_keeps_its_line` | the U+00A0 spacer is a text leaf with the geometry it reserved |
| `substance_is_ascii_whitespace_only_and_is_decided_in_one_place` | the predicate itself, over blanks and over five space characters that occupy space |

Updated for the schema change — the behaviour each pins is preserved, restated at the width it was
measured at:

- `tests/req88-viewport-relative-and-nowrap.test.ts` — the hero's response is asserted on the 1280
  keyframe (the fixture's only probe) and its absence on the other five; the CSS assertion now checks
  that **exactly one** height rule answers the viewport.
- `tests/test_UAT_FC_BUG-142_a_backing_surface_owns_its_content.test.ts` — same, at 1280.
- `tests/test_UAT_FC_REQ-278_flow_recovery_preserves_geometry.test.ts` and
  `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` — the refusals are stated where the
  document can now state them; BUG-48 gains a refusal case for `responseNeedsAtHeight`.
- `tests/fixtures/l1-corpus/.../gigabytealchemy/draft/pages/home.json` — the stored corpus document is
  migrated: the old node-level response meant *at every width*, so it is replicated onto every keyframe.
  The document's meaning is unchanged.

Regression scope: the whole `node` vitest project.


## Two more fixtures migrated, found by the full regression pass

Both hand-authored the response at the geometry level, which `.strict()` now refuses and
`evaluateLayout` no longer reads. Neither is a behaviour change — the node-level field meant *at every
width*, so restating it on each keyframe says the same thing:

- `tests/test_UAT_FC_BUG-143_surface_containment_height_axis.test.ts` — a new `withResponse` helper puts
  the rule on every keyframe of a track (`frames()` already stamps `atHeight` on each, so
  `responseNeedsAtHeight` is satisfied). Restores `height_response_resolves_against_the_sampled_height`
  and `probes_sample_more_than_one_height_per_width`.
- `tests/test_UAT_FC_REQ-338_the_fold_paints_each_band_once.test.ts` — issue 4's two height UATs read the
  response per keyframe. The fixture probes the height at **every** ladder width, so the assertion is now
  *every keyframe states the rule*, which is strictly stronger than the single node-level object it
  replaced. The below-hero section deliberately asserts no keyframe count: it is not present at every
  rung, and REQ-351's point is that a keyframe speaks only for its own width.

# Regression result

`vitest --project node`, all 744 node test files, run in seven + four chunks.

**26 failures, all 26 present on the clean `xgd-working` baseline.** Verified by stashing this branch's
work and re-running the same file sets: the counts reconcile file-for-file. Zero regressions.

Two of the pre-existing failures are in code this ticket touches and are worth naming, since a future
round will otherwise re-derive them:

- `tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` — 4 failures, all from
  `zoomGroupChromeAgrees`. Commit `8d97f66acf` ("a zoom may name a set, so several plates share one
  overlay") added that rule to `L1_STRUCTURAL_RULES` without the refusal case BUG-48's coverage check
  requires, so the rule has no definition to project. **Not this ticket's** — REQ-351 adds its own rule
  (`responseNeedsAtHeight`) *with* its refusal case, which is why the count did not grow.
- `tests/req51-object-grouped-report.test.ts` — an image object now carries a `border` param the test
  does not list, from REQ-333/REQ-347's framed-image attribution.

The remaining 24 are environment-dependent suites this change cannot reach (webui install, fonts over
real repo trees, the builder origin worker, the KB corpus, the filing service, session texts). Note also
that `tests/test_UAT_FC_REQ-343_the_consultant_stops_writing_l1.workers.test.ts` is a `workers` project
suite and was **not** run: workerd binds a listener, which this role cannot do.

Typechecks clean across all six packages (`site-schema`, `framework`, `generate`, `public-site`,
`control-app`, `repro-console`).

## One cleanup taken along the way

`responseAt` (fold) and `responseGoverning` (probes) were the same half-open keyframe walk written twice.
Consolidated to one exported definition in `fold.ts`, imported by `probes.ts` — the resolution rule has
to agree with the renderer's stacked `min-width` cascade, and a second copy is a second thing to keep in
agreement with it.