---
uid: request-922b1e4e
id: REQ-347
type: request
title: 'capture: a page''s declared z-index is read off the leaf and lost, so the
  hero headline paints under a collage photo — and a ringed photo''s border box is
  lost with it'
created_by: repro-console:repro-faelan-com#4
created_at: '2026-09-29T04:02:15.717339+00:00'
updated_at: '2026-09-29T04:02:15.717339+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - capture-loses-it
  - l1-cannot-express
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# The hero headline is painted underneath a collage photograph, and a ringed photo wears its ring inside its own box

Round: `repro-console:repro-faelan-com#4` · bundle `/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index` (captured 2026-09-28T23:05:24.839Z, capture schema 7).

The gate is `pass` at mean 2.87/255, 1.66% over threshold, `l1Pass: true`,
`layout.findings: []`, `unmeasured 0`, and 4 LOW deltas that are all
REQ-302's issue 4 (see §4). It is nonetheless serving a page whose 64px
`<h1>` and whose entire tagline are **not visible at all**, and whose one
ringed photograph is 8px too small with its ring 4px inside where the
reference paints it.

Two engine issues, in dependency order. Together they are **100% of the
ranked region score (10203.76 of 10203.76)** and **zero value deltas**.

The instrument half — why every gate stayed quiet — is filed separately as
BUG-162, not folded in here.

---

## Issue 1 — the capture reads `z-index` off the leaf, so the fold has nothing to order by and every collage photo paints over the hero type

`capture-loses-it` (leading), with a dependent `l1-cannot-express`.

### What the reference does

`raw.html` puts the hero copy and the four collage photos in one
`.photo-layer`, in this DOM order: `.header-text` (the `<h1>` and the `<p>`),
`.photo-circle`, `.photo-torn`, `.photo-soft-1`, `.photo-soft-2`.

The mirrored stylesheet `assets/index.BM9-dqc-.css` orders them explicitly:

```
.header-text[data-astro-cid-j7pv25f6]{position:absolute;top:8%;left:8%;z-index:20}
.photo-circle[data-astro-cid-j7pv25f6]{position:absolute;...;z-index:15}
.photo-torn [data-astro-cid-j7pv25f6]{position:absolute;top:5%;left:5%;width:320px;z-index:5;transform:rotate(3deg)}
.photo-layer[data-astro-cid-j7pv25f6]{position:relative;z-index:10;padding:2rem;min-height:100vh}
```

So the hero type (20) paints **over** the torn photo (5). `screenshot.full.png`
shows exactly that: white `FAELAN` and `Artist • Musician • Creator` sitting on
the ghostship photograph in the top-left corner.

### What the capture records

Every `zIndex` in `capture.json` is `0`:

```
$ python3 -c "import re;r=open('storage/references/faelan.com/index/capture.json').read();
print(len(re.findall(r'\"zIndex\"',r)), sorted(set(re.findall(r'\"zIndex\":\s*(-?\d+)',r))))"
11 ['0']
```

Eleven records — four content runs in §0, two in §1, one in §2, four fields —
and a single distinct value. The page's four declared stacking values
(`z-index:10/15/5/20`, present verbatim in the mirrored CSS) are in none of them.

The reason is one line. `extract.ts:1398`:

```js
function zIndexOf(s) {
  var z = parseInt(s.zIndex, 10);
  return isNaN(z) ? 0 : z;
}
```

`s` is the computed style of the **leaf** — the `<h1>`, the `<p>` fragment, the
`<img>`. Its own `z-index` is `auto` → `NaN` → `0`. The element that carries the
declaration is two levels up. Call sites: `extract.ts:2406` (content runs) and
`extract.ts:2508` (fields).

**The machinery to fix it is already in the same two records.** `transformRotateDeg`
is read by `accTransformOf`, which walks the ancestor chain (REQ-333/REQ-336) — and
it is right: `-5 / 3 / -8 / 4` on the four fields, matching the four wrapper
`transform:rotate(...)` declarations exactly. `zIndex` is the one axis on those
records still read off the leaf alone. The comment above `zIndexOf` even states
the stakes: *"This is the only field that separates a correctly-placed-but-wrongly-
stacked layer from its reference."*

### What the fold then emits, and what it paints

The fold is not the culprit and should not be changed here: it emits the section's
children in the capture's order, and for this section that order *is* source DOM
order (`.header-text`, `.photo-circle`, `.photo-torn`, `.photo-soft-1`,
`.photo-soft-2`). A browser paints positioned siblings with `z-index: auto` in
exactly that order, so the reproduction is behaving correctly for the document it
was given — what the reference adds, and what was lost, is the `z-index: 20` that
lifts the type back above the torn photo. (The capture's section model does flatten
the interleaving in principle: `sections.ts:271` builds `content` and `sections.ts:287`
builds `fields` as two separate lists, so a page that puts a photo *between* two text
runs would lose their relative order too — not this page.)

`page.json` → `l1.root.children[0]` (`section-bg-0`) is:

```
text  "FAELAN"
text  [ "Artist • ", "Musician"(link), " • Creator" ]
image image-0  /assets/faelan-stramash.jpeg   transform.rotateDeg -5   stacked true
image image-1  /assets/ghostship-eyes.jpg     transform.rotateDeg  3   stacked true
image image-2  /assets/faelan-violin-bw.jpg   transform.rotateDeg -8   stacked true
image image-3  /assets/heal-click-alley.jpeg  transform.rotateDeg  4   stacked true
```

No node carries any paint-order field. The served document
(`iteration-4/site/home.html`) is `<h1 class="l1-2">…<p class="l1-3">…<img class="l1-4">…<img class="l1-7">`,
all four images `position: absolute`, and **the string `z-index` does not occur in
`home.html` at all**. DOM order decides, so every photo paints over the type.

Geometry, from `actual-manifest.json` (element 0 vs element 6):

```
h1 "FAELAN"        box (102.375, 64)     267.640625 × 96
image-1 ghostship  box ( 64.00007, 40.00005) 319.99984 × 205.68739
```

The `<h1>` box is **entirely contained** in the ghostship photo's box, as are the
link fragment `(179.15625, 168) 92.703 × 36` and `(271.859, 172) 98.156 × 28`.
The photograph is opaque there. Nothing of the hero copy survives.

`diff/region-1-ref.png` is white `FAELAN` on a dark photo; `diff/region-1-ours.png`
is the photo with no glyphs on it.

### Cost

Ranked regions #1, #4, #5, #6 — the h1 and the three tagline fragments —
**6541.95 of 10203.76 = 64.1%** of the ranked region score, region #1 alone at
mean 80.74/255. **Zero value deltas**: `values-diff.json` pairs "FAELAN" and
matches `a11yRole / fontFamily / fontSizePx / fontWeight / color / letterSpacingPx /
lineHeightPx / renderedTextBox / box` — 9 of 10 params identical, the 10th being
the unrelated `surfaceFill` of §4.

### The second half: L1 cannot express it either

Fixing the capture is necessary and not sufficient. `values-diff.ts:1434/1532/2745`
already has the axis (`zIndex`, kind `zOrder`, Type A), so the comparator is ready.
L1 is not:

- `stacked: true` is **explicitly not a paint axis** — BUG-154's diagnosis says so
  in as many words ("it is documented as **not a paint axis** and the renderer emits
  nothing for it"), and it is a marker for the envelope evaluator only.
- the only thing in L1 that compiles to `z-index` is `sticky.lift` (REQ-328,
  `z-index: 1`), which is a field of the pin and unavailable to a non-sticky node.

So there is today no way to author "this absolutely-placed text sits above that
absolutely-placed photograph" in L1 at all. Whatever the capture recovers needs a
node-level paint-order field (an integer beside `transform`/`mask`/`stacked` reads
naturally) and a renderer that emits it.

### Reproduce / wrong / right

```
# WRONG — 11 zIndex records, one distinct value, against four declared in the source CSS
python3 -c "import re;r=open('storage/references/faelan.com/index/capture.json').read();print(sorted(set(re.findall(r'\"zIndex\":\s*(-?\d+)',r))))"      # ['0']
grep -o 'z-index:[0-9]*' storage/references/faelan.com/index/assets/index.BM9-dqc-.css       # z-index:10 z-index:15 z-index:5 z-index:20

# WRONG — the fold, offline, from this bundle's own oracle: text then images, no order field
./bin/1c refold --ref storage/references/faelan.com/index      # 13 nodes, 0 residuals
python3 -c "import json;d=json.load(open('storage/references/faelan.com/index/l1.json'));print([ (c['kind'],c.get('id','')) for c in d['root']['children'][0]['children'] ])"

# WRONG — nothing orders them in the served document
grep -c 'z-index' storage/tmp/repro-console/repro-faelan-com/iteration-4/site/home.html      # 0

# RIGHT — the reference paints the type on top
open storage/references/faelan.com/index/screenshot.full.png   # white FAELAN over the ghostship photo
open storage/tmp/repro-console/repro-faelan-com/iteration-4/diff/actual.png   # no FAELAN anywhere
```

### Defending the class

`capture-loses-it`: the page declares `z-index:20/15/5/10` in the mirrored
stylesheet and `capture.json` holds 11 `zIndex` records all equal to 0 — the
information is destroyed at `extract.ts:1398` before any fold or renderer sees it.
`l1-cannot-express` for the dependent half: `stacked` is documented as not a paint
axis (BUG-154) and `sticky.lift` is a pin field, so even a correct capture has
nowhere to land.

### Note on order of work

The capture fix is **capture-side**, so this bundle needs a **[recapture]** before
the fold change can be measured here. The L1/renderer axis can land first and be
exercised by hand-authoring a paint-order value.

---

## Issue 2 — `frameOf` hoists a wrapper's ring onto the image's *content* box, so the 224px border box is nowhere in the capture and the ring paints 4px inward

`capture-loses-it`. Needs the same **[recapture]**.

### What the reference does

```
.photo-circle[data-astro-cid-j7pv25f6]{position:absolute;top:8%;right:10%;width:224px;height:224px;
  border-radius:50%;overflow:hidden;box-shadow:0 20px 60px #0009,0 0 40px #fff3;
  border:4px solid rgba(255,255,255,.3);transform:rotate(-5deg);transition:transform .3s ease;z-index:15}
.photo-circle[data-astro-cid-j7pv25f6] img[data-astro-cid-j7pv25f6]{width:100%;height:100%;object-fit:cover}
```

and, in the same stylesheet, `@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}}`.

So: the ringed element's **border box** is `(928, 64) 224 × 224`, its content box
is `(932, 68) 216 × 216`, the ring's outer radius is 50% of 224 = **112**, and the
`<img>` runs `object-fit: cover` over the full **216 × 216**.

### What the capture records

`capture.json` → `sections[0].fields[0]`:

```json
"box": { "x": 932.0000431436988, "y": 68.00002559466203,
         "width": 215.99991371260234, "height": 215.999964069465 },
"borderRadiusPx": 108, "borderWidthPx": 4, "borderColor": "#ffffff4d", "borderStyle": "solid",
"clip": { "id": 1, "x": 922.998, "y": 58.998, "width": 234.0037, "height": 234.0037 }
```

That is the **img's content box** wearing the **wrapper's** ring. The number 224
does not occur anywhere in `capture.json` (`grep -c '\b224\b'` → 0), and the
recorded radius `108` is 50% of 216, not 50% of 224. `clip` 234.0037 = 216 × 1.08335
— the rotated AABB of the 216 box, not of the 224 one (which would be 242.67).

`extract.ts:2484-2488`:

```js
// REQ-333 -- the painted transform (ancestors included) and the layout box it
// inflated, then the FRAME this image is cropped and ringed by. Order matters:
// the frame's percentage radius resolves against the box it is attributed to.
var fieldTf  = accTransformOf(el);
var fieldBox = layoutBoxOf(el, fieldTf);          // <- the <img>'s box
var frame    = isImg ? frameOf(el, fieldBox) : null;
var fieldBorder = frame ? { width: frame.borderWidthPx, ... } : boxBorderOf(s);
```

`frameOf` (`extract.ts:1615`) reads `border`, `border-radius`, `box-shadow` and
`mask` off the parent and hands them back to be written onto `fieldBox`. The
parent's own rect is never taken. REQ-333 fixed *which properties* are attributed;
it did not fix *which box* they are attributed to. The comment quoted above names
the substitution out loud.

### What it paints

`iteration-4/site/home.html`:

```
*, *::before, *::after { box-sizing: border-box }
.l1-4 { position: absolute; ... width: 216px; height: 216px }
.l1-4 { object-fit: cover; border-radius: 108px; border: 4px solid #ffffff4d;
        box-shadow: 0px 20px 60px #00000099, 0px 0px 40px #ffffff33;
        display: block; transform: rotate(-5deg) }
```

A 216px border box with a 4px border under `box-sizing: border-box` leaves a
**208 × 208** content area at `(936, 72)`, and `object-fit: cover` then reframes
the 1.25:1 source into that smaller, offset box.

Measured on the two screenshots, scanline `y = 176` (the circle's centre row):

| | ring, left | ring, right | ring outer span | photo |
|---|---|---|---|---|
| reference | x 928–931 `(147,152,157)` | x 1148–1151 `(143,149,154)` | **224px** | 216px |
| reproduction | x 932–935 `(146,151,156)` | x 1144–1147 `(143,149,154)` | **216px** | 208px |

Everything inside the circle is 4px right, 4px down and 3.8% differently scaled.
`diff/region-2-ref.png` vs `diff/region-2-ours.png` shows the face shifted.

### Cost

Ranked regions #2, #3, #7, #8, #9, #10, #11 — the seven that trace the circle's
rim — **3661.81 of 10203.76 = 35.9%**.

**Zero value deltas, and the comparator cannot ever produce one.** Both manifests
report the *same* rectangle to the last decimal:

```
expected-manifest.json[4].box  = {932.0000431436988, 68.00002559466203, 215.99991371260234, 215.999964069465}
actual-manifest.json  [5].box  = {932.0000431436988, 68.00002559466203, 215.99991371260234, 215.999964069465}
both .border = { widthPx: 4, color: "#ffffff4d", style: "solid" }
```

— but on the reference side `box` is the rect of an element with **no** border
(the border lives on its parent), and on our side it is the rect of an element
that **has** the border inside it. The same field name is two different rectangles,
so the pair `(box, border)` reads as a perfect match across a 4px/8px error. This
is a consequence of the hoist, not an independent comparator defect: recording the
wrapper's 224 border box makes the delta fire on its own.

### Reproduce / wrong / right

```
# WRONG — the 224px border box is not in the capture, and the radius is 50% of the wrong box
grep -c '\b224\b' storage/references/faelan.com/index/capture.json                 # 0
python3 -c "import json;f=json.load(open('storage/references/faelan.com/index/capture.json'))['sections'][0]['fields'][0];print(f['box'],f['borderRadiusPx'],f['borderWidthPx'])"

# RIGHT — what the page declares
grep -o '\.photo-circle\[[^]]*\]{[^}]*}' storage/references/faelan.com/index/assets/index.BM9-dqc-.css | head -1
grep -o 'box-sizing:border-box' storage/references/faelan.com/index/assets/index.BM9-dqc-.css | head -1

# WRONG — the ring paints 4px in, measured, at the circle's centre row
python3 - <<'PY'
from PIL import Image
ref=Image.open('storage/references/faelan.com/index/screenshot.full.png').convert('RGB')
act=Image.open('storage/tmp/repro-console/repro-faelan-com/iteration-4/diff/actual.png').convert('RGB')
for x in range(926,938): print(x, ref.getpixel((x,176)), act.getpixel((x,176)))
PY
```

### Defending the class

`capture-loses-it`: the mirrored stylesheet declares `width:224px;height:224px;border:4px`
under a global `box-sizing:border-box`, and `224` occurs zero times in `capture.json`
while the ring is written onto a 216px box — the border box is destroyed at
`extract.ts:2486-2488`, so no fold or renderer can recover where the ring goes.

---

## 3. What I confirmed LANDED on this bundle (previously filed, no longer residual)

Re-measured this round against this iteration's files, not carried from memory:

- **REQ-336 (wrapper rotation)** — `capture.json` fields carry `transformRotateDeg`
  `-5 / 3 / -8 / 4`, `page.json` carries `transform.rotateDeg` on all four images,
  and `home.html` emits `transform: rotate(-5deg)` … `rotate(4deg)`. All four
  collage photos are turned. **Fixed end to end.**
- **REQ-331 issue 1 (link-only inline flow unrejoined)** — the tagline is one
  `text` node with three segments (`"Artist • "`, `"Musician"`+link, `" • Creator"`),
  rendered as one `<p>` with an inline `<a>`. **Fixed.**
- **REQ-331 issue 2 (`stacked` never emitted)** — all four images carry
  `stacked: true`. **Fixed** (and see BUG-162 for what that now costs).
- **REQ-333 issue 3 (mask feather in the wrong units)** — `home.html` emits
  `mask-image: radial-gradient(ellipse 92% 92% at 50% 50%, #000 72%, transparent 100%)`,
  character-for-character the source's `radial-gradient(ellipse 92% 92% at 50% 50%,black 72%,transparent 100%)`,
  and likewise 90%/70% and 95%/75%. **Fixed.**
- **`1c l1-gate --ref` on this bundle** returns `pass: true` with zero findings at
  every width — no structural residual this round.

## 4. Deltas and residuals that belong to OTHER open tickets — not re-filed

- **The 4 LOW `surfaceFill` deltas** (`#000000` expected, `#0b101e` actual, on
  "FAELAN", "Artist •", "Musician", "• Creator") are **REQ-302's issue 4**.
  Arithmetic re-confirmed here: `#0f172b` = (15,23,43); × 0.7 → (10.5,16.1,30.1) →
  round → (11,16,30) = `#0b101e`; both manifests report `bodyBackground: #0f172b`.
  Re-measured and appended to REQ-302 as a comment rather than re-filed.
- **The h1's second text-shadow layer is dropped.** `capture.json` records
  `'rgba(0, 0, 0, 0.9) 4px 4px 20px, rgba(255, 255, 255, 0.3) 0px 0px 40px'`;
  `page.json` carries one layer and `home.html` emits `text-shadow: 4px 4px 20px #000000e6`.
  `packages/site-schema/src/l1/schema.ts:1931` is still `textShadow: l1ShadowSchema.optional()`
  (single) where `:500 l1BoxShadowSchema` already accepts `z.array(l1ShadowSchema).min(2).max(4)`.
  This is **REQ-331's issue 5**, half-landed; appended there as a comment.
- **`background-attachment: fixed`** on `.montage-container` is dropped, and the
  hero background carries a diffuse high-frequency residual (meanAbs 3.4–3.6 over
  background-only patches below y≈450, 0.23 above). I could **not** attribute the
  residual to the dropped attachment with the artifacts in hand — both sides fit
  `cover` into 1280×800 to within my own resampler's error, and the best integer
  shift between them is (0,0). `background-attachment` is already recorded as a
  known `not-expressible` item in `capture/coverage.ts:474` (BUG-13 / REQ-136
  phase 2), so this is named here and not filed.

## 5. Order of work

1. Issue 2 (`frameOf`'s box) — self-contained, capture-side.
2. Issue 1's capture half (`zIndexOf` over the ancestor chain, the way
   `accTransformOf` already does).
3. **[recapture]** this bundle — 1 and 2 are both capture-side and invisible to
   `1c refold`.
4. Issue 1's L1/renderer half: a node-level paint-order field, the renderer
   emitting it as `z-index`, and the fold writing the captured value onto the node.
   The fold's *child order* needs no change.

Note that step 3 will make `values-diff`'s existing `zIndex` axis start firing on
this bundle — reference records at 20/15/5/10 against a reproduction that stays
all-zero until step 4 lands. A rising delta count there is the instrument
sharpening, not a regression.
