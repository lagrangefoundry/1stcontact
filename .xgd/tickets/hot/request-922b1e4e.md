---
uid: request-922b1e4e
id: REQ-347
type: request
title: 'capture: a page''s declared z-index is read off the leaf and lost, so the
  hero headline paints under a collage photo — and a ringed photo''s border box is
  lost with it'
created_by: repro-console:repro-faelan-com#4
created_at: '2026-09-29T04:02:15.717339+00:00'
updated_at: '2026-09-30T00:03:17.695951+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - capture-loses-it
  - l1-cannot-express
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-7ed87692
  commits:
  - working_sha: 0165c872deec6646447cb9eff147e1e17693c34a
    reconcile_sha: null
    main_sha: null
  - working_sha: 77a8fb9d650603819e7fb25c4ed0238454e77592
    reconcile_sha: null
    main_sha: null
  version: 0.2.411
  story_points: 8
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


---

## 6. Implementation — what landed, and the decisions taken inside it

Free-coded on `free-REQ-347`. The four steps of §5 in order, with the
consequential changes each one forced.

### 6.1 Capture — `zIndexOf` walks the chain (§5 step 2)

`zIndexOf` now takes the ELEMENT rather than its computed style and walks the
ancestor chain, the way `accTransformOf` already does. Three rules decide where
the walk stops, and each is load-bearing:

1. **Only a box the property applies to answers.** `z-index` applies to a
   positioned box and to a flex/grid item; a static ancestor's declared value is
   inert and must not be read. A new `zIndexApplies(el, cs)` says which.
2. **The FIRST such box owns the answer.** It is the box that carries this leaf
   through the paint order of the layer above, which is what a flat reproduction
   needs to know.
3. **A stacking context that declares no level seals its subtree at 0.**
   `.photo-soft-1` is `position:absolute; transform:rotate(-8deg)` with no
   z-index: the transform makes it a stacking context, so it and everything in it
   paint as ONE unit at level 0 of the layer above — **below** `.photo-torn`'s
   declared 5. Walking past it to `.photo-layer`'s 10 would lift it over two
   photographs the reference paints on top of it and re-order the collage. A new
   `establishesStackingContext(el, cs)` reads the painted subset of the CSS rule
   (`position:fixed/sticky`, `opacity<1`, transform, filter, backdrop-filter,
   perspective, `mix-blend-mode`, `isolation:isolate`, mask/clip-path,
   `will-change`, `contain`).

Measured on the fixture: `20 / 15 / 5 / 0`, plus `3` for a leaf that declares its
own level (the reading that always worked, unchanged) and `0` for a page that
stacks nothing.

**A single integer cannot be exact, and the bound is deliberate.** Paint order is
really the lexicographic order of the whole chain of levels, and two leaves in
different stacking contexts are not comparable on one scale at all. The number is
right for the shape this measures — positioned siblings stacked inside one
container, which is what every montage, hero overlay and badge actually is — and
is strictly better than the constant `0` it replaces everywhere else. Widening it
to a path would change the `zIndex` axis's type and the comparator with it; that
is a separate intent, not this one.

### 6.2 Capture — `frameOf` returns the frame's own box (§5 step 1)

`frameOf(el, box)` becomes `frameOf(el)` and computes the frame's **own** layout
box, un-inflated through the frame's **own** accumulated transform
(`layoutBoxOf(p, accTransformOf(p))` — the image's only while the image adds no
rotation of its own). It returns `{ el, box, … }`; the field record reads
`frame.box` as its `box` and resolves the percentage radius against it, so 50% of
224 is the 112 that draws the disc.

**The border box is the right box because it is where the paint is.** The frame is
the composite the reader sees — ring, crop, shadow and picture as one object — and
its extent is the wrapper's border box. An L1 leaf renders under the same
`box-sizing: border-box` reset, so a 224px box with a 4px border reconstructs the
216px of picture exactly, without `box` ever having to carry two numbers.

**`clip` moves with it** — a technical consequence rather than a separate finding,
and it has to move or the fix regresses something else. `clipOf` is now read at
the frame when there is one: the wrapper is the element that crops (`overflow:
hidden` is on it), and a clip box left measured on the picture inside it is
*smaller* than the box now recorded — which `nestClipRegions` would read as a leaf
escaping a region that in fact contains it, and would wrap the photograph in a
clipping container that the reference has no counterpart for.

### 6.3 The capture schema stamp — 8 → 9

Both capture fixes are invisible to `1c refold`: a stored bundle keeps its wrong
values until it is **re-captured**. `CAPTURE_SCHEMA` is bumped to 9 with an entry
per fix, so `1c capture audit` says "this bundle is behind" out loud instead of
leaving the next round to re-measure a residual whose fix has already shipped.

Both new entries carry `present: () => false`. Nothing in a bundle can prove
either one present — a pre-9 extractor records a non-zero `zIndex` perfectly well
for the rare page that declares one on the leaf itself, and both schemas record a
rectangle and a ring with only the page's own stylesheet saying which element they
were measured on. The probe exists to REMOVE an axis from a finding it can see is
already carried; here it can see nothing, so the version gate decides alone.

### 6.4 L1 — a node-level `paintOrder` (§5 step 4)

A new axis on `nodeAxisGroupsShape`, so every kind carries it — `transform` and
`mask`'s neighbour, and read at all three leaf branches of the fold for the same
reason: the loss that named this was a HEADLINE painted under a photograph, not an
image axis.

- **An integer, because that is what the thing is.** Every other spelling
  considered (an ordinal, a `front`/`back` enum, a sibling permutation) is a rank
  the renderer would have to turn back into a `z-index` anyway, and none can
  express the gaps a page leaves between its levels (20 over 15 over 5) that make
  room for a later insertion.
- **Zero is not a level, it is the absence of one.** `z-index: 0` and `z-index:
  auto` differ only in whether a stacking context is created, which L1 does not
  model, and admitting `0` would be the second spelling of absent this schema
  refuses everywhere else. The schema rejects it; absent keeps meaning "document
  order decides", which is the default the renderer already has.
- **Bounded ±1000** (`L1_ENVELOPE.paintOrder`), checked in `validate.ts` beside
  the transform ranges. A rank, not a length, so the bound is about how many
  distinct layers one composition can name.
- **Orthogonal to `stacked`, and deliberately not merged with it.** `stacked` says
  an overlap is intended; `paintOrder` says how it resolves. A node can carry
  either alone.

### 6.5 The renderer emits it

`z-index: <n>` in the node's base declaration list. Every node the substrate emits
is already positioned (`position: relative` in flow, `absolute` on a pinned
keyframe), so the property applies wherever the document states it and nothing has
to be invented to make it take effect.

**One declaration, never two**, which is the rule `sticky.lift`/`stacked` already
had. On a pinned node the PIN emits the level instead (`stickyDecls` takes
`paintOrder` and prefers it over the generic `STICKY_LIFT_Z_INDEX`), so a
width-gated pin's level is confined to the band the pin is held in, and a node
carrying both spellings still emits a single `z-index`.

### 6.6 The fold writes it, and can now name it when it cannot

`foldPaintOrder(el)` reads the captured `zIndex` onto the node. **Clamped, not
dropped** at the envelope bound — the opposite of `foldTransform`'s rule, and for
a reason about what the axis IS: a rotation past ten turns is not a design that
can be half-honoured, but a rank has no such property. `z-index: 2147483647` (the
cookie-banner idiom) means "above everything"; clamping to 1000 still means
"above everything" relative to every other level on the page, where dropping it
would silently return the node to document order — which is the defect, not a safe
default.

`zIndex` also joins the `CapturedAxis` union, so `foldResiduals` can report a
declared level the fold could not carry. That union is an exhaustive switch by
construction (REQ-336), so adding it forced the answer to be given.

### 6.7 Supersession — REQ-333's two box assertions

REQ-333 pinned a framed photograph's `box` at the `<img>`'s 216px content box and
its radius at 108. Both are re-pinned here at 224 and 112. This is issue 2's whole
substance and is called out in place in
`test_UAT_FC_REQ-333_the_capture_reads_the_frame_and_the_rotation.test.ts`: the
un-inflation REQ-333 proved is unchanged and is still what those assertions
measure — what changed is WHOSE rect is un-inflated.

### 6.8 What was NOT changed

- **The fold's child ORDER.** §1 says it and it holds: the fold emits the
  section's children in the capture's order, which for this section is source DOM
  order. What was missing was the level, not the sequence.
- **`stacked`.** It stays a declaration for the envelope evaluator, and the fold
  still marks only pictures with it. The two axes are orthogonal (§6.4).
- **The comparator.** `values-diff`'s `zIndex` axis (kind `zOrder`, Type A) was
  already there and already right; it simply had two zeroes to compare.

### 6.9 Evidence

`tests/test_UAT_FC_REQ-347_the_paint_order_a_page_declares.test.ts` — eleven
tests over the real `EXTRACT_SCRIPT` (jsdom, supplied rects), the real `foldToL1`
and the real `renderL1Document`:

- a wrapper's `z-index` is attributed to the leaf it stacks (20 / 15 / 5), and the
  headline is above the photograph it was painted under;
- a stacking context that declares no level seals its subtree at 0, below the
  declared 5 beside it;
- a leaf's own level still wins, and a page that stacks nothing records nothing;
- a framed image's box is the frame's 224px border box at radius 112;
- an image that frames itself keeps its own box (the rail that bounds the rule);
- a framed image's `clip` is the frame's clip;
- the bundle stamp says a stored capture is behind;
- a captured level folds onto the node and reaches the CSS, headline above photo;
- level zero is the absence of a level — absent on the node, no `z-index` in the
  CSS, and refused by the schema as a value;
- a run and a panel carry a level too;
- an out-of-envelope level clamps rather than dropping.

### 6.10 Still outstanding on this bundle

§5 step 3 — **[recapture]** `storage/references/faelan.com/index` — is an operator
step and has not been run here. Until it is, that bundle's `capture.json` keeps
its eleven zeroes and its 216px ring, and `1c refold` cannot show either fix. The
note in §5 stands: after the recapture, `values-diff`'s `zIndex` axis starts
firing on this bundle against a reproduction that is now able to answer it.


---

## 7. One further consequence, found while testing: a backdrop keeps the fold's layer

The fold must NOT write a captured level onto a **backdrop** (a full-bleed fill or
an element-level background photograph, `isBackdrop`). Found by reasoning about
`foldToL1`'s own output rather than by a round, and it is a regression the rest of
this change would otherwise have introduced.

The background layer is built by putting the content-free surfaces FIRST in
document order — that ordering **is** what makes them backgrounds — and every node
in it is a sibling of the content under one root box, not the child of a separate
stacking context. A `z-index` written onto a backdrop therefore competes directly
with the content it is the ground for. A page whose hero wrapper declares
`z-index: 10` and whose copy declares nothing (the common shape, and faelan.com's
own) would fold to a backdrop at 10 over content at auto — hiding its own words
behind its own photograph, which is the exact defect this ticket exists to fix,
reintroduced from the other side.

So `paintOrder` is written in the box branch only after `isBackdrop` has answered
no. Where a backdrop paints is already stated, by where the fold puts it.

Covered by `test_UAT_FC_REQ-347_a_backdrops_layer_stays_the_folds_decision`.