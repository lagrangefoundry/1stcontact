---
uid: request-d3eb602b
id: REQ-333
type: request
title: 'capture: an ancestor rotation and an image wrapper''s framing are lost, so
  four collage photos reproduce square, unrotated and stretched'
created_by: repro-console:repro-faelan-com#2
created_at: '2026-09-26T21:30:29.327185+00:00'
updated_at: '2026-09-26T21:30:29.327185+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - capture-loses-it
  - fold-wrong
  - renderer-wrong
  - l1-cannot-express
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Loop 1, iteration 2 of `repro-faelan-com` against the stored reference bundle
`storage/references/faelan.com/index` (captured `2026-09-26T20:18:42.340Z`,
`captureSchema: 6`).

`gate.json`: `verdict: "structural-failure"`, `pass: false`, `l1Pass: false`,
mean 20.1/255, 20.01% of pixels over threshold, 12 ranked regions (total score
**107925.69**), 12 value deltas, **`unmeasured 0`** (`unmeasuredAxes: []`,
`notComparableAxes: []`, `unpairedSections: 0`, `unpairedActual: 0`).

**The re-capture window is closed for everything below.** Two commits landed
since this capture (`b12355bbcb`, `9c12202fa5`). Neither touches
`tools/generate/src/cli/capture/extract.ts` — `git show --stat --format=
b12355bbcb 9c12202fa5 | grep -c capture/extract.ts` returns `0` for both, and
`git log --all --since=2026-09-26 -- tools/generate/src/cli/capture/extract.ts`
is empty — so the extractor that wrote this oracle is the one running now and no
capture-side fix is waiting on a re-capture. The commits DO carry
`fold.ts`, `inline-runs.ts`, `l1/render.ts`, `values-diff.ts` and `probes.ts`,
and this iteration was built at 13:23 local against them: REQ-331's issues 1
(rejoin), 2 (`stacked`), 3 (mask emitted at all), 4/5 (two shadow layers with
alpha) and 9 (no-op filter) are all **confirmed landed** in this round's output.
Issues 1 and 2 below are themselves capture-side, so **after they land the
operator must press [recapture] before this bundle's evidence moves** — a
`1c refold` cannot show them.

## Summary — seven issues, in the order they should be worked

| # | residual class | kind | `defect_class` | what it is worth here |
|---|---|---|---|---|
| 1 | `capture-attributes-an-image-to-the-leaf-and-loses-its-wrapper-s-rotation` | **class 1** — engine shortfall | `capture-loses-it` | **91.76% of the ranked score (99037.85 of 107925.69) and ZERO value deltas** |
| 2 | `capture-loses-a-wrapper-s-clip-border-and-shadow` | **class 1** — engine shortfall | `capture-loses-it` | a circular photo with a white ring reproduces as a bare square; 0 deltas |
| 3 | `fold-reads-a-radial-mask-feather-in-the-source-s-radius-units` | **class 1** — engine shortfall | `fold-wrong` | 21.5% of each of three photographs erased outright; 0 deltas |
| 4 | `l1-feather-mask-has-no-extent-or-inner-stop` | **class 2** — L1 cannot express it | `l1-cannot-express` | the ceiling under issue 3 |
| 5 | `renderer-emits-a-bare-parenthesised-column-extent` | **class 3** — renderer bug | `renderer-wrong` | 3 CRITICAL `position` deltas; 8.24% of the ranked score (8887.84); centred copy left-aligns |
| 6 | `fold-anchors-a-rejoined-inline-run-at-its-last-fragment` | **class 1** — engine shortfall | `fold-wrong` | 3 CRITICAL `position` deltas, +169.48px each |
| 7 | `renderer-lets-the-ua-anchor-rule-beat-an-inherited-run-colour` | **class 3** — renderer bug | `renderer-wrong` | 1 LOW `color` delta, `#ffffff` → `#0000ee` |

That is 6 of the 12 deltas (issues 5, 6 and 7). **The other 6 — one MEDIUM
`surfaceFill` aggregate over ⟨5 elements⟩ and 5 LOW `surfaceFill` rows,
`#000000` → `#0b101e` — are REQ-302's issue 4** (the reference side reports the
hero scrim's colour with its alpha dropped; ours reports it composited over the
page background: `0.7 × #0f172b = #0b101e` exactly). REQ-331 already appended
this bundle's arithmetic to REQ-302 at iteration 1; re-appending the identical
numbers from the identical bundle would add nothing, so it is named here and not
re-filed.

**Dependencies.** 2 shares issue 1's root (both are "read the leaf, ignore the
wrapper that frames it") and its fix should follow the same attribution change,
so 1 before 2. 4 after 3: fixing 3 alone forces the fold to emit *no* mask for
these gradients, which is much closer to the reference than what it emits today
but still loses the corner softness — 4 is what makes the remainder
expressible. **5, 6 and 7 are independent of 1–4 and of each other**; 5 is a
one-line renderer fix worth 8.24% of the score and is the cheapest thing on this
list. Landing 1 and 3 alone would take the ranked score from 107925.69 to under
9000.

**Issues 1, 2 and 3 currently generate no value delta at all.** The instrument
reads `transformRotateDeg: 0` on BOTH sides and compares the mask by *presence*
only, so 91.76% of the pixel score is invisible to `values-diff` while
`unmeasured` reads `0`. That blindness is filed separately as the round's bug
ticket; it is named here because it is why this ticket's lead issue does not
appear in the delta list at all.

Everything below is quoted out of a file on disk or is the output of a command
this round ran. Nothing is read off a screenshot.

### Paths used throughout

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-2
SLUG=repro-faelan-com
```

`1c` was **not on `PATH`** in this session (`which 1c` → not found). Every
command below is written as `1c …`; if it is not on yours, prefix
`node tools/generate/bin/1c.mjs` instead of `1c`, which is what this round ran.

---

## Issue 1 — the capture reads an image's transform off the `<img>` and never sees the wrapper that rotates it, then records the rotated bounding box as the layout box

**Residual class:** `capture-attributes-an-image-to-the-leaf-and-loses-its-wrapper-s-rotation`
**`defect_class`: `capture-loses-it`** — L1 can express the rotation
(`l1TransformSchema.rotateDeg`, `packages/site-schema/src/l1/schema.ts:665`) and
the renderer emits it (`packages/framework/src/l1/render.ts:503-504`,
`transform: rotate(<deg>)`), but `capture.json` records
`transformRotateDeg: 0` for all four rotated photographs, so there is nothing
downstream for the fold or the renderer to carry. The fold and the renderer are
innocent.

### The three questions, and what each returned

1. **Can L1 express it?** Yes — `rotateDeg: finite.optional()` in
   `l1TransformSchema` (`packages/site-schema/src/l1/schema.ts:655-668`), emitted
   by `transformCss()` (`packages/framework/src/l1/render.ts:498-508`). → not
   class 2.
2. **Is the value in the L1 document, and is it right?** It is absent, because
   the capture never recorded it. `$REF/capture.json` `/sections/0/fields/*`:
   `"transformRotateDeg": 0` on all four image fields. → **class 1, and the
   wrong value is put in by the CAPTURE, stop here.**
3. *(not reached)*

### The ground truth — the page's own stylesheet, mirrored into the bundle

`$REF/raw.html` links `/_astro/index.BM9-dqc-.css`, and the mirror has it at
`$REF/assets/index.BM9-dqc-.css`. Each photograph is an `<img>` inside a wrapper
div, and **the wrapper carries the rotation**:

```css
.photo-circle[data-astro-cid-j7pv25f6]{position:absolute;top:8%;right:10%;width:224px;height:224px;
  border-radius:50%;overflow:hidden;box-shadow:0 20px 60px #0009,0 0 40px #fff3;
  border:4px solid rgba(255,255,255,.3);transform:rotate(-5deg);transition:transform .3s ease;z-index:15}
.photo-circle img{width:100%;height:100%;object-fit:cover}

.photo-torn{position:absolute;top:5%;left:5%;width:320px;z-index:5;transform:rotate(3deg);…}
.photo-soft-1{position:absolute;top:45%;left:15%;width:260px;transform:rotate(-8deg);…}
.photo-soft-2{position:absolute;top:18%;left:35%;width:450px;transform:rotate(4deg);…}
```

`$REF/raw.html`:

```html
<div class="photo-circle"><img src="/images/faelan-stramash.jpeg" alt="Faelan"></div>
<div class="photo-torn"><img src="/images/ghostship-eyes.jpg" alt="Ghostship"></div>
<div class="photo-soft-1"><img src="/images/faelan-violin-bw.jpg" alt="Faelan with violin"></div>
<div class="photo-soft-2"><img src="/images/heal-click-alley.jpg" alt="Alley scene"></div>
```

`transform` is not inherited, so `getComputedStyle(img).transform` is `none` and
`transformOf()` returns `{rotate: 0, scale: 1}` — correctly, for the `<img>`, and
wrongly for the painted result.

### The second half: the recorded `box` is the rotated bounding box

`absBox()` (`tools/generate/src/cli/capture/extract.ts:642-645`) is
`el.getBoundingClientRect()`, which for a rotated element returns the
**axis-aligned bounding box of the rotated element**, not its layout box.
Everything downstream treats it as the layout box. The arithmetic closes to four
decimal places on all four photographs — layout box from the stylesheet's
`width` and the capture's own `intrinsicAspect`, rotated by the wrapper's angle:

| field | stylesheet width × derived height | angle | AABB that predicts | `capture.json` `box` |
|---|---|---|---|---|
| `ghostship-eyes.jpg` | 320 × 205.70 | 3° | 330.3271 × 222.1692 | **330.3271 × 222.1687** |
| `faelan-violin-bw.jpg` | 260 × 259.12 | −8° | 293.5329 × 292.7880 | **293.5329 × 292.7882** |
| `heal-click-alley.jpg` | 450 × 599.66 | 4° | 490.7337 × 629.5860 | **490.7337 × 629.5859** |
| `faelan-stramash.jpeg` | 216 × 216 (224 border-box − 2×4px border) | −5° | 234.0037 × 234.0033 | **234.0037 × 234.0037** |

(`216 × (cos5° + sin5°) = 216 × 1.0833504 = 234.0037`. The captured value is
`234.003662109375`.)

So the reproduction draws each photograph **unrotated** and **into the inflated
box** — for `heal-click-alley.jpg` that is 490.73 × 629.59 where the page paints
450 × 599.66, with `objectFit: fill`, i.e. a 9% horizontal stretch on top of the
lost rotation.

### What it is worth

`$ITER/diff/regions.json`, total score 107925.69:

| id | bbox | score | share | `nodes` both sides |
|---|---|---|---|---|
| 1 | `(176,48) 992×704` | **78227.84** | 72.48% | ref/actual identical: `section 0` (`ofRegion` 1.00), `Alley scene` (`ofRegion` 0.44, `ofNode` 0.99), `Faelan with violin` (`ofRegion` 0.12, `ofNode` 1.00); boxes agree to 0.01px |
| 2 | `(48,32) 400×224` | **20810.01** | 19.28% | ref/actual identical: `Ghostship` (`ofRegion` 0.82, `ofNode` 1.00), `FAELAN`, `section 0` |
| | | **99037.85** | **91.76%** | |

Region 1's `readout`: `meanAbsDiff 27.81` with `deltaRgb [2.29,-5.41,-3.84]` —
the average colour agrees within 6/255 and every edge disagrees. Region 2's:
`meanAbsDiff 52.49`, `deltaRgb [10.59,18.44,22.3]`, `columnDiff` non-zero from
its 3rd 6.25px column to its 54th, i.e. across the whole photograph rather than
at its rim.

**No delta describes any of this.** `$ITER/diff/values-diff.json`'s `objects`
entry for each image compares exactly four params — `name`, `objectFit`,
`aspect`, `box` — and all four match on all four images (`"deltaCount": 0,
"worstTier": null` on every one). `expected-manifest.json` and
`actual-manifest.json` both record `transformRotateDeg: 0` on every element.

### The pixel readout that rules out displacement

Ranking a (dx,dy) shift of `actual.png` against `screenshot.full.png` over each
photograph's box, mean-absolute-grey, ±10px: the best shift is (0,0) or within
2px of it for every one, and it improves the mean by under 2/255
(alley `(0,0)=32.00`; violin `(0,0)=36.12`; stramash best `(-2,7)=34.36` vs
`(0,0)=36.21`; ghostship best `(1,-2)=63.74` vs `(0,0)=64.79`). A 200×180 patch
of the *background* photograph with no `<img>` over it scores `(0,0)=3.30`. So
the background asset reproduces to 3/255 and every collage photograph disagrees
by 32–65/255 with no translation that helps — which is what a rotation about the
centre looks like. Four point samples on `faelan-stramash.jpeg`, which carries
no mask on either side and whose box matches exactly, read:

| point in the 234×234 box | `screenshot.full.png` | `actual.png` |
|---|---|---|
| centre `+(117,117)` | `[218,165,145]` | `[219,167,147]` |
| `+(117,20)` (top centre) | `[53,36,28]` | `[229,197,129]` |
| `+(230,117)` (right centre) | `[81,86,91]` | `[43,32,26]` |
| `+(4,4)` | `[103,109,111]` | `[79,47,27]` |

The centre agrees to 5/255 and the periphery does not — the reference paints
background where we paint photograph, in the shape of a rotated circle inside an
inflated square (issues 1 and 2 together).

### Hypothesis — where it is

- `tools/generate/src/cli/capture/extract.ts:1299-1311` `transformOf(s)` — reads
  `s.transform` (`getComputedStyle` of the element itself). Its own comment at
  1296-1298 reasons about the translate components already being folded into
  `getBoundingClientRect()`; nothing reasons about rotation inflating `width`
  and `height`, or about the transform living on an ancestor.
- `tools/generate/src/cli/capture/extract.ts:642-645` `absBox(el)` — the
  rotated AABB, recorded as `box`.
- the field records that consume both: `extract.ts:2076` and `:2168`
  (`transformRotateDeg: transformOf(s).rotate`).

### Proposed change

1. **Accumulate the transform from the element up to the nearest containing
   block**, not just the element's own: multiply the `matrix()` of each ancestor
   with a non-`none` `transform` and decompose the product. On this page that
   recovers `rotate(3°)`, `rotate(-8°)`, `rotate(4°)`, `rotate(-5°)` from the
   four wrappers.
2. **Record the UNROTATED layout box** whenever the accumulated rotation or
   scale is not the identity. `offsetWidth`/`offsetHeight` and `offsetLeft`/
   `offsetTop` are transform-independent and already available; alternatively
   apply the inverse matrix to the rect. `box` must mean the same thing for a
   rotated node as for an upright one, because the fold, `probes.ts` and
   `values-diff` all read it as the layout box.
3. Note that (2) is needed **even for the case the capture already sees**: an
   element with its own `transform: rotate(3deg)` records a non-zero
   `transformRotateDeg` *and* an inflated `box` today, so the fold would place a
   rotated node inside an already-inflated rectangle and double-count. (Not
   exercised by this bundle — every rotation here is on a wrapper — so this part
   is reasoning about the code, not a measurement.)

### How to see it, and how to know it is fixed

```
grep -o 'transform:rotate([^)]*)' \
  storage/references/faelan.com/index/assets/index.BM9-dqc-.css
node -e 'const c=require("/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index/capture.json");
  for (const f of c.sections[0].fields) console.log(f.alt, f.transformRotateDeg, JSON.stringify(f.box))'
```

**Wrong (today):** the stylesheet prints
`transform:rotate(-5deg)  transform:rotate(3deg)  transform:rotate(-8deg)  transform:rotate(4deg)`,
and the capture prints

```
Faelan 0 {"x":922.998…,"y":58.998…,"width":234.003662109375,"height":234.0037078857422}
Ghostship 0 {"x":58.836…,"y":31.767…,"width":330.3271484375,"height":222.16873168945312}
Faelan with violin 0 {"x":175.233…,"y":343.168…,"width":293.53289794921875,"height":292.7882080078125}
Alley scene 0 {"x":427.633…,"y":129.035…,"width":490.7337341308594,"height":629.5859375}
```

**Right (fixed):** `transformRotateDeg` reads `-5`, `3`, `-8`, `4`, and the
`width`/`height` read `216×216`, `320×205.7`, `260×259.1`, `450×599.7`.

Then, after a **re-capture** (this is capture-side; `1c refold` cannot reach it):

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-faelan-com \
  --ref storage/references/faelan.com/index --sandbox --out /tmp/faelan-gate --json
```

**Wrong:** `regions[0].score` 78227.84 and `regions[1].score` 20810.01, total
107925.69; `values.deltas` 12 with no `transform` row.
**Right:** regions 1 and 2 fall by an order of magnitude. Expect the delta count
to **rise** first: a `transform` row appears as soon as one side reads a non-zero
angle, which is the instrument becoming able to see this at all.

---

## Issue 2 — the capture reads an image's framing off the `<img>` too, so a circular photo with a white ring reproduces as a bare square

**Residual class:** `capture-loses-a-wrapper-s-clip-border-and-shadow`
**`defect_class`: `capture-loses-it`** — L1 can express every one of the three
lost properties (`l1MaskSchema` `shape: 'circle'` →
`packages/framework/src/l1/render.ts:607-608` `clip-path: circle(50%)`; a border
axis → `render.ts:758`; `boxShadow`, which this same bundle carries correctly on
the other three photographs), and `capture.json` records `borderRadiusPx: 0`,
`borderWidthPx: 0`, `borderColor: null`, `borderStyle: null`, `boxShadow: null`
for the one whose framing is on the wrapper.

### The three questions

1. **Can L1 express it?** Yes, all three — see above. → not class 2.
2. **Is the value in the L1 document?** No, and the capture is why.
   `$REF/capture.json` `/sections/0/fields/0` (`alt: "Faelan"`):
   `"borderRadiusPx": 0, "borderWidthPx": 0, "borderColor": null,
   "borderStyle": null, "boxShadow": null, "maskEdge": null`.
   `$REF/assets/index.BM9-dqc-.css` `.photo-circle`:
   `border-radius:50%; overflow:hidden; border:4px solid rgba(255,255,255,.3);
   box-shadow:0 20px 60px #0009,0 0 40px #fff3`.
   → **class 1, capture side.**
3. *(not reached)*

The contrast inside one page is the proof that it is an attribution bug and not a
missing axis: the other three photographs put `border-radius`, `box-shadow` and
`mask-image` on the `<img>` itself, and the capture records all three correctly
(`borderRadiusPx: 8`, `boxShadow: "rgba(0, 0, 0, 0.6) 0px 15px 50px 0px,
rgba(255, 255, 255, 0.15) 0px 0px 30px 0px"`, `maskEdge:
"radial-gradient(92% 92%, …)"`). Only the one whose styles sit on the wrapper
comes back blank.

### What it is worth

`$ITER/page.json` — the reproduction's `image-0` carries
`"axes":{"objectFit":"cover"}` and nothing else: no `mask`, no border, no
`boxShadow`. `$ITER/site/home.html` `.l1-4` is `object-fit: cover` alone, where
`.l1-5`/`.l1-6`/`.l1-7` all carry `border-radius` and `box-shadow`. So the
reproduction paints a hard-edged 234×234 square, and the page paints a 216px
circle with a 4px translucent ring and two shadows. It is inside region 1
(`(176,48) 992×704`, 72.48% of the score) and the artifacts cannot separate its
share from issue 1's; the point samples in issue 1 at `+(117,20)` and
`+(230,117)` are the corner of the square we paint and the reference does not.
**0 value deltas**: `borderRadiusPx` and `boxShadow` read `0`/`null` on both
sides of the manifest, so the comparator sees two agreeing blanks.

### Hypothesis

The same attribution decision as issue 1 — `extract.ts`'s field record is built
from one element's computed style (`:2140-2200`), and for an image inside a
presentational wrapper the framing is one level up. `overflow: hidden` +
`border-radius: 50%` on the parent is the idiomatic way to crop an image on the
web, so this is not a one-site shape.

### Proposed change

When an image's parent exists only to frame it — a single-element wrapper with no
text of its own — attribute the wrapper's `border-radius` (with
`overflow: hidden` → a clip, which is what `L1Mask.shape: 'circle'`/`'ellipse'`
name), `border-*` and `box-shadow` to the image field. A `border-radius: 50%`
clip on a square box is `shape: 'circle'`; the 4px ring is the border axis; the
shadow is the axis this bundle already proves works.

### How to see it, and how to know it is fixed

```
node -e 'const f=require("/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index/capture.json").sections[0].fields[0];
  console.log(f.alt, {borderRadiusPx:f.borderRadiusPx, borderWidthPx:f.borderWidthPx, borderColor:f.borderColor, boxShadow:f.boxShadow, maskEdge:f.maskEdge})'
grep -o '\.photo-circle\[[^]]*\]{[^}]*}' \
  storage/references/faelan.com/index/assets/index.BM9-dqc-.css
```

**Wrong (today):**
`Faelan { borderRadiusPx: 0, borderWidthPx: 0, borderColor: null, boxShadow: null, maskEdge: null }`
against a stylesheet that says `border-radius:50%;overflow:hidden;box-shadow:0 20px 60px #0009,0 0 40px #fff3;border:4px solid rgba(255,255,255,.3)`.
**Right (fixed):** `borderRadiusPx` reads the wrapper's radius (or the field
gains a clip naming a circle), `borderWidthPx: 4` with
`borderColor: "rgba(255, 255, 255, 0.3)"`, and `boxShadow` reads the wrapper's
two layers. Then `1c page get repro-faelan-com home --sandbox --json | grep -o
'"mask":{[^}]*}'` names a `circle` on `image-0`.

---

## Issue 3 — the fold measures a radial mask's feather in the source gradient's radius units and the renderer re-emits it in `closest-side` units, erasing a fifth of each photograph

**Residual class:** `fold-reads-a-radial-mask-feather-in-the-source-s-radius-units`
**`defect_class`: `fold-wrong`** — the capture carries the whole gradient string,
L1 can carry a `featherRadial` mask with a `featherPx`, and the fold writes a
value that means something different under the renderer's ending shape than it
did under the source's.

### The three questions

1. **Can L1 express it?** A feather mask, yes — `l1MaskSchema`
   (`packages/site-schema/src/l1/schema.ts:525-536`) has
   `shape: 'featherRadial'` and `featherPx`. *This particular* gradient, no —
   that is issue 4, and it is a separate, dependent residual. The axis exists and
   accepts a value, so this issue is not class 2.
2. **Is the value in the L1 document, and is it right?** In the document, and
   **wrong**. → **class 1, stop here.** `$ITER/page.json`:
   `"mask":{"shape":"featherRadial","featherPx":62}` on `image-1`, `88` on
   `image-2`, `123` on `image-3`.
3. *(not reached — but the renderer does exactly what L1 says, see below.)*

### The two gradients, side by side

`$REF/assets/index.BM9-dqc-.css` (the page's own):

```css
.photo-torn   img { mask-image: radial-gradient(ellipse 92% 92% at 50% 50%, black 72%, transparent 100%) }
.photo-soft-1 img { mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 70%, transparent 100%) }
.photo-soft-2 img { mask-image: radial-gradient(ellipse 95% 95% at 50% 50%, black 75%, transparent 100%) }
```

`$REF/capture.json` records the resolved form faithfully —
`"maskEdge": "radial-gradient(92% 92%, rgb(0, 0, 0) 72%, rgba(0, 0, 0, 0) 100%)"`
— and `$ITER/diff/expected-manifest.json` element 5 carries the same string.
`$ITER/site/home.html` `.l1-5`:

```css
-webkit-mask-image: radial-gradient(closest-side, #000 calc(100% - 62px), transparent 100%);
        mask-image: radial-gradient(closest-side, #000 calc(100% - 62px), transparent 100%)
```

**The ending shape is different, and the stop is a fraction of it.** The source's
ending ellipse has radii `92%` of each box dimension — for the 330.33 × 222.17
box that is 303.9 × 204.4, so the box's own corner sits at normalised radius
`t = hypot(165.16/303.9, 111.08/204.4) = 0.769`, barely past the `0.72` opaque
stop: the whole photograph is opaque except the extreme corners, which reach
`alpha 0.826` at the very point `border-radius: 8px` has already rounded off. For
`heal-click-alley.jpg` the box corner is at `t = 0.744` against an opaque stop of
`0.75` — **the reference's mask does not attenuate one pixel of that
photograph.**

Ours re-emits with `closest-side`: radii 165.16 × 111.08, opaque only to
`t = (165.16 − 62)/165.16 = 0.625`, fully transparent at `t ≥ 1`:

| photograph | `featherPx` | fully opaque over | erased outright (outside `t = 1`) | reference's alpha at the box corner |
|---|---|---|---|---|
| `ghostship-eyes.jpg` | 62 | 30.6% of the box | **21.5%** | 0.826 |
| `faelan-violin-bw.jpg` | 88 | 12.6% of the box | **21.5%** | 0.714 |
| `heal-click-alley.jpg` | 123 | 19.5% of the box | **21.5%** | 1.000 |

### Why the fold got it wrong

`tools/generate/src/l1/fold.ts:1014-1047` `foldMask()`:

```ts
const featherPx = Math.round(run(lastOpaque.at, outer.at) * Math.min(box.width, box.height))
```

`run(72, 100) = 0.28` is a fraction **of the source gradient's own extent**, and
it is multiplied by `Math.min(box.width, box.height)` — a fraction of the box.
The two are the same thing only when the ending shape is `closest-side`, and here
it is `92% 92%`, about 1.84× the half-extent. The parse never looks at the size
component of the gradient at all: the regex at 1022 matches colour stops only, so
`92% 92%`, `ellipse` and `at 50% 50%` are all discarded. Checked against the
numbers: `0.28 × min(330.33, 222.17) = 62.2 → 62`, `0.30 × 292.79 = 87.8 → 88`,
`0.25 × 490.73 = 122.7 → 123` — all three reproduce the emitted values exactly,
so this is the line.

The renderer is correct and consistent with what L1 says:
`packages/framework/src/l1/render.ts:616-620` turns `featherPx` into
`radial-gradient(closest-side, #000 calc(100% - Npx), transparent 100%)`, which
is a faithful reading of "the feather band is N px wide, measured in from the
edge". The defect is that the fold's N is not that number.

### What it is worth

It sits inside regions 1 and 2 with issue 1 and **the artifacts in hand cannot
separate the two** — both act on the same three photographs over the same
pixels. Its own separable evidence is the two gradient strings and the arithmetic
above, which need no browser. It generates **0 value deltas**, because
`values-diff` compares `maskEdge` by presence only
(`tools/generate/src/cli/capture/values-diff.ts:2623-2628`: *"compare
*presence*: … exact value strings (blur radii, mask gradients) drift across
engines and would be noise"*) — and at iteration 1, when the fold emitted no
mask at all, the same axis reported **3 MEDIUM `mask` deltas**. Landing REQ-331's
issue 3 therefore took the mask from *reported and wrong* to *unreported and
wrong*. That is the round's bug ticket, not this issue.

### Proposed change

Read the gradient's **size component** and convert the stop into the renderer's
frame before writing `featherPx`:

- parse `<length-percentage>{2}` / `closest-side` / `farthest-corner` etc. from
  the gradient's size slot and resolve it to `(rx, ry)` in px against the box;
- the feather band in px along the shorter axis is
  `(outerStop − lastOpaqueStop) × min(rx, ry)`, and the **opaque radius** is
  `lastOpaqueStop × min(rx, ry)` — if that already reaches or exceeds the box's
  own half-extent, the mask attenuates nothing inside the box and the fold should
  emit **no mask** rather than a feather;
- `heal-click-alley.jpg` is exactly that case (`alpha 1.000` at the box corner),
  and the other two are within 0.29/0.29 of it.

That alone takes these three photographs from "a fifth erased" to "hard edges",
which is where they were before REQ-331's issue 3 and much closer to the
reference. Closing the remaining corner softness needs issue 4.

### How to see it, and how to know it is fixed

```
grep -o 'mask-image:radial-gradient([^)]*)[^;}]*' \
  storage/references/faelan.com/index/assets/index.BM9-dqc-.css
1c refold repro-faelan-com --ref storage/references/faelan.com/index --sandbox
1c page get repro-faelan-com home --sandbox --json | grep -o '"mask":{[^}]*}'
```

(`1c refold` and `1c page get` need no Chromium flag.)

**Wrong (today):** `{"shape":"featherRadial","featherPx":62}`,
`{"shape":"featherRadial","featherPx":88}`,
`{"shape":"featherRadial","featherPx":123}` against source gradients whose
opaque stop already covers the whole box.
**Right (fixed):** no `mask` on `image-3` at all (its reference mask attenuates
nothing), and `featherPx` on `image-1`/`image-2` reduced to the few px that
actually fall inside the box — under the current one-parameter axis, to `0`,
i.e. omitted. Then
`CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-faelan-com --ref
storage/references/faelan.com/index --sandbox --out /tmp/faelan-gate --json`
should drop `regions[1].score` from 20810.01; region 1 will not clear until
issue 1 lands too.

---

## Issue 4 — `L1Mask`'s `featherRadial` has one parameter where the reference needs three

**Residual class:** `l1-feather-mask-has-no-extent-or-inner-stop`
**`defect_class`: `l1-cannot-express`** — the property is authorable but the
**variant is not**: there is no parameter for the mask's ending-shape extent and
none for where the opaque core ends, so a gradient whose ending shape is larger
than the box cannot be written down.

### The question, and what it returned

**Can L1 express it?** **No.**
`packages/site-schema/src/l1/schema.ts:525-536`:

```ts
export const l1MaskSchema = z.object({
  shape: z.enum(['circle','ellipse','parallelogram','blob','featherRadial','featherTop','featherBottom']),
  featherPx: finite.nonnegative().optional(),
  …
}).strict()
```

`featherRadial` takes exactly one numeric parameter, `featherPx`, and the schema
is `.strict()` — so `{shape:'featherRadial', extentPct: 92, opaqueStopPct: 72}`
is refused by `validateL1` before it reaches the renderer. The reference needs
three numbers: the ending ellipse's radii as a share of the box (`92% 92%`), the
last opaque stop (`72%`) and the transparent stop (`100%`). The renderer's
emitter hard-codes the first (`closest-side`,
`packages/framework/src/l1/render.ts:617-618`). → **class 2.**

### Why it matters beyond this bundle

`radial-gradient(ellipse <p>% <p>% at 50% 50%, black <q>%, transparent 100%)` is
the common "soft-edged photo" idiom, and its two parameters are what decide
whether the softness is a whisper at the corners or a vignette over half the
frame. Today the substrate can only say "feather N px in from the closest side",
which cannot express an ending shape larger than the box — and an ending shape
larger than the box is exactly how the idiom gets a *subtle* edge. With issue 3
fixed and issue 4 not, all three of these photographs fold to **no mask**, which
is right to within a few px but is the substrate declining to carry a real
property of the page.

### Proposed change

Give `featherRadial` (and, for symmetry, `featherTop`/`featherBottom`) the two
missing parameters, defaulted so that every existing document keeps its meaning:

```ts
featherRadial: {
  featherPx?: number          // unchanged; the band width, in the ending shape's units
  extentPct?: number          // default 100 === closest-side; 92 reproduces this page
  opaqueStopPct?: number      // default derived from featherPx, as today
}
```

and have `maskDecls()` emit `radial-gradient(ellipse <extentPct>% <extentPct>% at
50% 50%, #000 <opaqueStopPct>%, transparent 100%)` when the new parameters are
present, falling through to today's `closest-side` form when they are not. Then
`foldMask()` can transcribe the source's own three numbers instead of projecting
them onto one.

### How to see it, and how to know it is fixed

```
grep -n "l1MaskSchema = " -A 14 packages/site-schema/src/l1/schema.ts
grep -n "case 'featherRadial'" -A 5 packages/framework/src/l1/render.ts
```

**Wrong (today):** the schema shows `shape` + `featherPx` and `.strict()`; the
renderer shows `radial-gradient(closest-side, #000 calc(100% - ${featherPx}px),
transparent 100%)` with the ending shape hard-coded.
**Right (fixed):** the schema accepts an extent and an opaque stop, and after a
`1c refold`, `1c page get repro-faelan-com home --sandbox --json | grep -o
'"mask":{[^}]*}'` prints
`{"shape":"featherRadial","extentPct":92,"opaqueStopPct":72}` for `image-1`,
`90`/`70` for `image-2` and `95`/`75` for `image-3` — the page's own numbers.

---

## Issue 5 — the renderer emits a bare parenthesised column extent, the browser drops the declaration, and every centred run collapses to shrink-to-fit

**Residual class:** `renderer-emits-a-bare-parenthesised-column-extent`
**`defect_class`: `renderer-wrong`** — L1 carries the right width and the right
alignment; the CSS the renderer emits for it is invalid.

### The three questions

1. **Can L1 express it?** Yes — `geometry.anchor.width: {px: 0, fraction: 1}`
   plus `axes.textAlign: "center"`.
2. **Is the value in the L1 document, and is it right?** **Right.**
   `$ITER/page.json`, the `section-band-0` and `section-band-1` children:
   ```json
   "axes":{…,"textAlign":"center"},
   "geometry":{"keyframes":[…,{"at":1280,"x":216,"y":96,"width":848,"atHeight":800},…],
               "anchor":{"x":{"px":0,"fraction":0},"width":{"px":0,"fraction":1}}}
   ```
   `848 = min(896, 1280) − 48`, and the reference agrees:
   `$ITER/diff/expected-manifest.json` elements 8/9/10 have
   `box.width` **848** at x 216.
3. **Does the render agree with L1?** **No.** → **class 3, stop here.**
   `$ITER/diff/actual-manifest.json` elements 9/10/12 have `box.width`
   **146**, **598**, **293** — each exactly its own text width — at the same
   x 216.

### The invalid declaration, quoted

`$ITER/site/home.html`:

```css
.l1-9  { position: absolute; left: calc(max(0px, (100vw - 896px) / 2) + 24px);
         min-width: (min(896px, 100vw) - 48px); top: 96px }
.l1-10 { position: absolute; left: calc(max(0px, (100vw - 896px) / 2) + 24px);
         width: (min(896px, 100vw) - 48px); top: 168px }
.l1-12 { position: absolute; left: calc(max(0px, (100vw - 896px) / 2) + 24px);
         width: (min(896px, 100vw) - 48px); top: 32px }
```

`(min(896px, 100vw) - 48px)` is a bare parenthesised calculation. A parenthesised
math sub-expression is legal only **inside** a math function, so the browser
drops the whole declaration; the runs keep `position: absolute` with no width and
shrink to fit, and `text-align: center` — which is emitted, and which the same
rules carry — becomes a no-op.

### Where it is

`packages/framework/src/l1/render.ts:1962-1965`:

```ts
function columnExtentCss(col: L1Column): string {
  const inner = `(min(${num(col.containerPx)}px, 100vw) - ${num(col.insetPx * 2)}px)`
  return col.maxWidthPx === undefined ? inner : `min(${num(col.maxWidthPx)}px, ${inner})`
}
```

`inner` is only ever legal wrapped — in the `min(...)` of the second branch, or in
a `calc(...)` at a call site. `anchorDecls()` (`:2479-2494`) decides that with
`needsCalc`:

```ts
const needsCalc = parts.length > 1 || Boolean(lead)
const sum = needsCalc ? `calc(${parts.join(' + ')})` : parts[0]
```

For `anchor.width = {px: 0, fraction: 1}` there is no `lead` and `parts` is
`[extent]` — one element — so `needsCalc` is false and `extent` is emitted raw.
The comment immediately above it, at `:2474-2477`, describes this exact failure
mode for `left` (*"Emitting it bare produces an invalid declaration that the
browser DROPS"*), and the guard it introduces misses the case where the single
part is itself a compound expression. The width path has no `lead`, so it is the
only one that can reach it — which is why `left` is correct on the same three
rules and `width` is not. `tests/req88-viewport-relative-and-nowrap.test.ts:484`
asserts `width: min(896px, (min(1152px, 100vw) - 48px))` — the `maxWidthPx`
branch, where `inner` *is* wrapped — so the suite never exercises the broken one.

### What it is worth

3 of the 12 deltas, all CRITICAL, all of them the centring that did not happen —
`$ITER/diff/values-diff.json`:

```json
{"text":"Faelan","role":"heading","property":"position","expected":"text @ (567, 892)","actual":"text @ (216, 892)","tier":"CRITICAL","magnitude":351.0625}
{"text":"© 2025 Faelan Westhead. All rights reserved.","property":"position","expected":"text @ (494, 1144)","actual":"text @ (216, 1144)","tier":"CRITICAL","magnitude":277.59375}
{"text":"Worlds End Studio founder, DJ, Producer and Fiddle Player","property":"position","expected":"text @ (341, 981)","actual":"text @ (216, 981)","tier":"CRITICAL","magnitude":125.203125}
```

`216 + (848 − 146)/2 = 567` — the expected x is the reference's centred text and
the actual is the left edge of the column, on all three.

And **8.24% of the ranked score, 8887.84 of 107925.69** — all ten of
`regions.json`'s remaining regions, `$ITER/diff/regions.json`:

| id | bbox | score | `nodes.ref` → `nodes.actual` |
|---|---|---|---|
| 3 | `(208,976) 736×32` | 3382.66 | same body run both sides, `w: 848` → `w: 597.59`; `rowDiff` is `0` for its first 10 rows then 15.9→100.22 |
| 4 | `(560,896) 160×48` | 2395.12 | ref `"Faelan"` (`ofRegion` 1.00) → **actual: `section` only** |
| 5 | `(208,896) 160×48` | 2374.39 | `"Faelan"` on both sides |
| 6, 9, 10, 12 | four 16px bands on row 1152 | 428.0 | ref `"© 2025 …"` (`ofRegion` 0.69) → **actual: `section` only** |
| 7, 8, 11 | three more on row 1152 | 307.63 | `"© 2025 …"` on both sides |

The asymmetry is the finding: where the reference has a lead and we have only the
band, that is glyphs the reference paints to the right of x≈500 and we paint
further left.

### Proposed change

One line. Either make `columnExtentCss` return a self-contained value —
`calc(min(${containerPx}px, 100vw) - ${insetPx*2}px)` — or make `needsCalc` true
whenever a part is not a plain length:

```ts
const needsCalc = parts.length > 1 || Boolean(lead) || parts[0].startsWith('(')
```

The first is preferable: it makes the helper safe at every call site rather than
correct only at the ones that remember to wrap it. Both `min(...)` branches
remain valid with a `calc()` inside.

### How to see it, and how to know it is fixed

```
1c render repro-faelan-com --sandbox --out /tmp/faelan-site
grep -o '\.l1-1[02] { position: absolute[^}]*}' /tmp/faelan-site/home.html
```

**Wrong (today):**
`.l1-10 { position: absolute; left: calc(max(0px, (100vw - 896px) / 2) + 24px); width: (min(896px, 100vw) - 48px); top: 168px }`
— a value with an unwrapped parenthesis.
**Right (fixed):** `width: calc(min(896px, 100vw) - 48px)`, and then

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c values-diff repro-faelan-com \
  --ref storage/references/faelan.com/index --sandbox --json
```

**Wrong:** the three CRITICAL `position` rows above, and
`actual-manifest.json` widths 146 / 598 / 293.
**Right:** those three rows gone, and all three actual widths **848**.

---

## Issue 6 — the fold anchors a rejoined inline run at its LAST fragment, so a linked sentence lands 169.48px to the right of where L1 says it is

**Residual class:** `fold-anchors-a-rejoined-inline-run-at-its-last-fragment`
**`defect_class`: `fold-wrong`** — the sequel to REQ-331's issue 1, which has
landed: `$ITER/page.json` now holds the hero sentence as ONE `text` node with a
three-entry run list (`"Artist • "`, `"Musician"` with
`axes.textDecoration: "underline"` and a `link.href`, `" • Creator"`), the
spaces are back, and `renderedTextBox` matches on both sides. What the rejoin
left behind is the anchor.

### The three questions

1. **Can L1 express it?** Yes — the node's own `geometry.keyframes[].x` is
   already correct.
2. **Is the value in the L1 document, and is it right?** The document holds
   **two values for the same x, and they disagree.** → **class 1, stop here.**
   `$ITER/page.json`, the rejoined node at `at: 1280`:
   - `geometry.keyframes` → `"x": 102.39` — correct;
     `$ITER/diff/expected-manifest.json` element 1 is `box.x` **102**, and
     `$REF/assets/index.BM9-dqc-.css` `.header-text{left:8%}` → `0.08 × 1280 =
     102.4`.
   - `geometry.anchor.x.pxTrack` at 1280 → **`55.88`** — wrong.

   Every other node in the document satisfies `pxTrack = x − columnLeft`, where
   `columnLeft = (1280 − 896)/2 + 24 = 216`:

   | node | `x` at 1280 | `x − 216` | `anchor.x.pxTrack` at 1280 |
   |---|---|---|---|
   | `FAELAN` | 102.39 | −113.61 | −113.61 ✓ |
   | `image-0` | 923 | 707 | 707 ✓ |
   | `image-1` | 58.84 | −157.16 | −157.16 ✓ |
   | `image-2` | 175.23 | −40.77 | −40.77 ✓ |
   | `image-3` | 427.63 | 211.63 | 211.63 ✓ |
   | **the rejoined sentence** | **102.39** | **−113.61** | **55.88 ✗** |

   `55.88 − (−113.61) = 169.49`, and the same excess appears at **every**
   breakpoint in the track (`320`: `130.36 − 1.59 = 128.77`; `375`:
   `134.77 − 6 = 128.77`; `768`: `166.2 − 37.44 = 128.76`; `1024`:
   `163.39 − (−6.09) = 169.48`; `1440`: `−11.33 − (−180.81) = 169.48`) — the
   desktop figure is the width of the first two runs at 24px
   (`77 + 93 = 170`, reference boxes), and the 320–768 figure is the same at
   18px (`170 × 18/24 = 127.5`). So the anchor was measured from the LAST run's
   left edge: the reference's own box for `• Creator` is x **272**, and
   `216 + 55.88 = 271.88`.
3. *(not reached — the renderer honours the anchor, as it should.)*

### What the renderer does with it

`$ITER/site/home.html`:

```css
@media (min-width: 1280px) {
  .l1-2 { left: calc(max(0px, (100vw - 896px) / 2) + 24px + calc(-113.61px + …)) }  /* FAELAN  → 102.39 */
  .l1-3 { left: calc(max(0px, (100vw - 896px) / 2) + 24px + calc(55.88px + …)) }    /* sentence → 271.88 */
}
```

and the whole sentence lands there — 3 of the 12 deltas,
`$ITER/diff/values-diff.json`:

```json
{"text":"Artist •","property":"position","expected":"@ (102, 172)","actual":"@ (272, 172)","tier":"CRITICAL","magnitude":169.484375}
{"text":"Musician","property":"position","expected":"@ (179, 168)","actual":"@ (349, 168)","tier":"CRITICAL","magnitude":169.484375}
{"text":"• Creator","property":"position","expected":"@ (272, 172)","actual":"@ (441, 172)","tier":"CRITICAL","magnitude":169.484375}
```

Every one is pure x with y identical, and the three fragments keep their correct
relative spacing — the sentence is intact and in the wrong place. Its pixels sit
inside regions 1 and 2 and cannot be separated there from issue 1.

### Hypothesis

The rejoin path added by REQ-331 — `tools/generate/src/l1/inline-runs.ts`
(`flowText`/`rejoinableFlows`) and `tools/generate/src/l1/fold.ts`'s
`buildGeometry(withHeight, useFlowBox)` around `:2422-2440`. `geometry.x` is
taken from the flow root's `inlineBox` (x 102.39, correct), while the column
anchor track is derived from a per-run box — and after rejoining, the run the
loop is standing on is the last one. The two derivations need to read the same
rect.

### Proposed change

Derive `anchor.x.pxTrack` from the same rect `geometry.keyframes[].x` came from —
the flow root's `inlineBox` — so the invariant `pxTrack = x − columnOrigin(width)`
holds for a rejoined node as it does for every other node. A cheap regression
guard: assert that invariant across every node of every folded document, since it
held for 6 of the 7 nodes here and one violation was enough to move a sentence
170px.

### How to see it, and how to know it is fixed

```
1c refold repro-faelan-com --ref storage/references/faelan.com/index --sandbox
1c page get repro-faelan-com home --sandbox --json | python3 -c "
import json,sys
d=json.load(sys.stdin)['data']['page']['l1']
for n in d['root']['children'][0]['children'][:2]:
    g=n['geometry']
    print(repr(n['text'])[:40],
          'x@1280', [k['x'] for k in g['keyframes'] if k['at']==1280],
          'pxTrack@1280', [k['value'] for k in g['anchor']['x']['pxTrack']['keyframes'] if k['at']==1280])"
```

**Wrong (today):** `'FAELAN' x@1280 [102.39] pxTrack@1280 [-113.61]` followed by
the sentence at `x@1280 [102.39] pxTrack@1280 [55.88]` — the same x, two
different anchors.
**Right (fixed):** the sentence reads `pxTrack@1280 [-113.61]`, and
`CHROMIUM_LAUNCH_ARGS=--single-process 1c values-diff repro-faelan-com --ref
storage/references/faelan.com/index --sandbox --json` no longer lists
`Artist •`, `Musician` or `• Creator` under `position`.

---

## Issue 7 — the renderer emits a link run with no colour, so the UA anchor rule paints it `#0000ee`

**Residual class:** `renderer-lets-the-ua-anchor-rule-beat-an-inherited-run-colour`
**`defect_class`: `renderer-wrong`** — L1 says "this run overrides nothing", which
means inherit, and the render paints the browser's default link blue.

### The three questions

1. **Can L1 express it?** The parent's colour is on the node
   (`axes.color: "#ffffff"`) and the run carries no override, which is the
   correct way to say "same colour as the sentence". → not class 2.
2. **Is the value in the L1 document, and is it right?** **Right.**
   `$ITER/page.json`: the sentence node has `"axes":{"color":"#ffffff",…}` and
   the link run has `"axes":{"textDecoration":"underline"}` with no `color`.
   `$REF/raw.html` agrees that inherit is what the page does — the anchor's own
   inline style is `style="color: inherit; text-decoration: underline;
   text-underline-offset: 4px; …"` — and so does the mirrored stylesheet's
   Tailwind base, `a{color:inherit;…}`.
   `$ITER/diff/expected-manifest.json` element 2 (`role: "link"`) is
   `color: "#ffffff"`.
3. **Does the render agree with L1?** **No.** → **class 3, stop here.**
   `$ITER/site/home.html`:
   ```html
   <p class="l1-3">Artist • <a class="l1-3-r1" href="https://open.spotify.com/…">Musician</a> • Creator</p>
   ```
   ```css
   .l1-3-r1 { text-decoration: underline }
   .l1-3 { color: #ffffff; … }
   ```
   Nothing sets a colour on the anchor, and the UA sheet's
   `a:-webkit-any-link { color: -webkit-link }` is a rule on the element, which
   beats the parent's inherited value. `$ITER/site/theme.css` carries no
   `a { color: inherit }` reset.

### What it is worth

1 of the 12 deltas — `$ITER/diff/values-diff.json`:

```json
{"text":"Musician","role":"link","property":"color","expected":"#ffffff","actual":"#0000ee","kind":"color","tier":"LOW","magnitude":0.6437375670606492,"severity":1060.3916303794235,"valueType":"A"}
```

Tiered LOW, and it is the most visible single thing on the hero after the
photographs: `#0000ee` on a dark photograph, where the page paints white. The
pixels are inside region 2 and cannot be separated there from issue 1.

This is the mirror image of REQ-265's second residual, where the renderer's
hard-coded `::placeholder { color: inherit; opacity: 1 }` forced a colour the
reference did not paint. Same root question — which UA defaults the emitter must
neutralise — opposite direction.

### Proposed change

Emit `color: inherit` on a link run that carries no `color` of its own (and
`text-decoration` only when L1 asks for it, which it already does). More
generally: a run element the renderer synthesises to carry an `href` must not
inherit UA link styling it was not asked for — the same reset the page's own
Tailwind base applies with `a{color:inherit}`.

### How to see it, and how to know it is fixed

```
1c render repro-faelan-com --sandbox --out /tmp/faelan-site
grep -o '\.l1-3-r1 {[^}]*}' /tmp/faelan-site/home.html
```

**Wrong (today):** `.l1-3-r1 { text-decoration: underline }` — no colour, so the
UA paints `#0000ee`.
**Right (fixed):** `.l1-3-r1 { color: inherit; text-decoration: underline }`,
and `CHROMIUM_LAUNCH_ARGS=--single-process 1c values-diff repro-faelan-com --ref
storage/references/faelan.com/index --sandbox --json` reports no `color` row for
`Musician`.

---

## What this ticket does NOT claim

- **The `structural-failure` verdict is not in this ticket.** `gate.json`'s
  `layout.findings` is two `escape` entries on the footer copy at
  375×768 and 375×1536, and `1c l1-gate` reports 18 content-robustness findings
  in total. Every one of them is a run the reproduction paints
  `white-space: nowrap` that the probe's own height model wraps anyway: the
  escape arithmetic closes exactly (`44 chars × 2.5 = 110`;
  `floor(327 / (14 × 0.5)) = 46` per line; `ceil(110/46) = 3` lines ×20px = 60;
  `32 + 60 = 92`, and `92 − 84 = 8` — the reported 8px), and it fires at 375,
  where `nowrapFromPx: 375` makes the run nowrap, and NOT at 320, where the run
  genuinely wraps and the band is 104 tall rather than 84. That is the
  instrument, and it is in the round's bug ticket.
- **The 5 `surfaceFill` deltas** (`#000000` → `#0b101e`) are REQ-302's issue 4,
  already carrying this bundle's arithmetic from iteration 1.
- **The pixel share of issues 2, 3, 6 and 7 is not separated from issue 1's.**
  All four act inside regions 1 and 2, whose readouts describe the sum. The
  readout that would separate them is a per-element perceptual score — the
  region ranker gives `nodes` with overlap fractions but one `meanAbsDiff` for
  the whole region — so the honest attribution is: 91.76% of the score is
  regions 1+2, every defect that acts on the four photographs is inside it, and
  issue 1 is the only one of them that moves geometry.
