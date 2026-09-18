---
uid: request-caa17b9d
id: REQ-271
type: request
title: 'capture/fold/values-diff: a band background is fabricated when transparent,
  compared by nothing, and wrong on the hero'
created_by: repro-console:repro-gigabytealchemy-ai#3
created_at: '2026-09-18T02:07:55.647301+00:00'
updated_at: '2026-09-18T03:03:26.791286+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-307fc4a8
---


Loop 1, iteration **3** of `repro-gigabytealchemy-ai` against the stored bundle
`storage/references/gigabytealchemy.ai/index`.

`gate.json` verdict: **`pass`** — mean 0.31/255, 0.1% of pixels over threshold,
10 ranked regions, `l1Pass: true`, **14 value deltas**, `unpairedActual: 7`,
`coverage.findings: []`.

## What moved since iteration 2, and what did not

Two of the residuals filed last round have **landed** and this round confirms
them fixed, from the artifacts:

- REQ-270 issue 2 (`repro-band-paint-read-from-the-fill-box-not-the-image-layer`)
  — the reproduction's hero image is now **in** its own manifest:
  `$ITER/diff/actual-manifest.json` element `[5]` carries
  `"backgroundImageUrl": "http://localhost:59880/assets/AlchemistLabWithTech.png"`.
- REQ-269 issue 5 (an L1 render has no section bands) — the reproduction side now
  segments into **7** bands carrying `overlay` / `contentAnchorRatio` /
  `textAlign`, so `sectionsNotComparable` is absent from `gate.json` and the
  section pass really ran.

Two are **unchanged and cannot change**:

- REQ-270 issue 1 (`reference-bundle-predates-its-own-extractor`) still holds.
  `$REF/capture.json` `.capturedAt` is still `2026-09-17T23:01:30.421Z`
  (16:01 −0700), while `$REF/forms.json` and `$REF/l1.json` are stamped
  `Sep 17 18:56` — the fold re-ran, the capture did not. The ranked region score
  is again **1051.13**, region for region.
- REQ-269 issues 3 and 4 (no `href`, no heading level in the capture) are now
  *visible* for the first time, because BUG-107's `a11yRole` comparison landed:
  13 of this round's 14 deltas are `a11yRole` at tier **HIGH**, severity 3100 —
  11 headings and 2 links reproducing as `generic`. **Those 13 are REQ-269's
  residuals seen through a newly-sharpened instrument, and they are frozen by
  REQ-270 issue 1.** They are not re-filed here.

The 14th delta (`§1` `overlay` `#030717 @ 0.3` → `none`) is REQ-270 issue 3,
still false, still the only delta the section pass produces.

**So every delta and every ranked pixel on this run is already ticketed.** What
follows is what this round found that is *not* on the board: a chain of three
residuals about the one property the value gate has never been able to see —
**the background colour of a band**.

## Summary — three residual classes, in the order to work them

| # | residual class | kind | what it costs |
|---|---|---|---|
| 1 | `capture-records-transparent-band-fill-as-body-background` | **class 1** — engine shortfall | the bundle asserts an opaque `#ffffff` fill for two bands the page paints nothing on; nothing marks the value as inferred |
| 2 | `values-diff-has-no-band-surface-fill-axis` | **class 1** — engine shortfall (measurement) | a band's fill and background image are compared **nowhere**; the reproduction's 6 band fills land in `unpairedActual` with no geometry |
| 3 | `fold-paints-opaque-scrim-colour-as-the-hero-band-base` | **class 1** — engine shortfall | L1 paints an opaque `#030717` plate under the hero where the reference paints nothing — and issue 2 is why no gate has ever reported it |

**Order and dependencies.**

- **Issue 1 must be fixed before issue 2.** If a band-fill axis is added while
  the capture still fabricates `#ffffff` for a transparent band, the reference
  side will assert white for the header band *and* for the hero band, and the
  new axis fires two false deltas on this very bundle before it finds anything
  real.
- **Issue 3 is found by issue 2, not before it.** It is quoted here as the
  proof that issue 2 is not hypothetical: a wrong band fill is sitting in L1
  right now and the value gate reports `0` deltas for it.
- Issue 3's root cause (alpha dropped from a translucent scrim) is already
  **BUG-24**; what is new here is the *fold* consequence, which BUG-24 does not
  describe.

Landing 1 and 2 is a good outcome. 3 will still be visible to a later round.

Two further findings this round are defects in how the gate *reports* what it
already measured, rather than gaps in what the engine can do, and are filed
separately as bugs to keep that line clean:
**`gate-verdict-ignores-values-diff-severity`** and
**`unpaired-reference-section-is-reported-nowhere-the-gate-reads`**.

Everything below is quoted out of a file on disk or is the output of a command
this round ran. Nothing is read off a screenshot.

### Paths used throughout

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3
SLUG=repro-gigabytealchemy-ai
```

---

## Issue 1 — a band with no background at all is recorded as an opaque fill of the body's background colour, and nothing says it was inferred

**Residual class:** `capture-records-transparent-band-fill-as-body-background`

**Class: 1 — engine shortfall.** The capture is the fold's input. It puts a
colour into the bundle that the page does not paint, and the value is
indistinguishable from a measured one.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(evidence from this one bundle only).

### The three questions, and what each returned

1. **Can L1 express it?** Yes — `surfaceFill` is an existing box axis, and "no
   fill" is expressible by omitting it (`section-bg-0` in this page's own L1
   carries `backgroundImageUrl` + `overlay` and no `surfaceFill`). Not class 2.
2. **Is the value in the L1 document, and is it right?** The value is in the
   *capture*, which is upstream of L1, and it is wrong there. → **class 1, stop
   here.**

### Evidence

**The page declares no background on either band.** From `$REF/raw.html`, the
ground truth:

```html
<header class="absolute top-0 left-0 right-0 z-40">
<section class="relative min-h-screen bg-cover bg-center bg-no-repeat" style="background-image: url('/images/AlchemistLabWithTech.png');">
<body class="overflow-x-hidden">
```

The `<header>` has no `bg-*` class and no inline background. The hero
`<section>` declares a `background-image` and no background-colour. The `<body>`
declares neither.

**The capture records both as opaque white.** From `$REF/capture.json`:

```json
{"box":{"x":0,"y":0,"width":1280,"height":192},"background":{"kind":"color","color":"#ffffff"}}
{"box":{"x":0,"y":0,"width":1280,"height":800},"background":{"kind":"image","color":"#ffffff","image":"assets/AlchemistLabWithTech.png","overlay":{"color":"#030717","opacity":0.3}}}
```

`#ffffff` is not measured from anything. It is a two-step fallback.

### Hypothesis — where it comes from, by file and line

`tools/generate/src/cli/capture/extract.ts`:

```js
418:  function rgbToHex(str) {
419:    var c = rgbaOf(str);
420:    if (!c || c[3] === 0) return null;          // fully transparent -> null
421:    return '#' + h2(c[0]) + h2(c[1]) + h2(c[2]);
422:  }
...
1882:    var bodyBg = rgbToHex(getComputedStyle(document.body).backgroundColor) || '#ffffff';
...
1941:      var bg = rgbToHex(s.backgroundColor) || bodyBg;   // geometric-band path
1962:    var bg = rgbToHex(s.backgroundColor) || bodyBg;     // band-root path
```

`rgbToHex` correctly returns `null` for `rgba(0,0,0,0)`. Both band paths then
launder that `null` into `bodyBg`, and on this page `document.body` is itself
transparent, so `bodyBg` is the literal `'#ffffff'` on line 1882. A band that
paints nothing and a band that paints white produce byte-identical records.

The same laundered value is then used for a second decision on the next line of
each band record:

```js
1943/1964:  colorScheme: luminance(bg) < 0.5 ? 'dark' : 'light',
```

so the header band — whose only run sits over a dark hero photograph under a
30 % navy scrim — is classified `light` on the strength of a fabricated white.

### Proposed change

Keep the `null` from `rgbToHex` distinguishable end to end:

- emit `background: { kind: 'none' }` (or `{ kind: 'color', color: <fallback>,
  colorInferred: true }`, matching the existing `colorInferred` convention on
  content runs) when `rgbToHex(s.backgroundColor)` returned `null`;
- derive `colorScheme` from what actually paints behind the band (the nearest
  ancestor or underlying band with a real fill, or the resolved scrim), not from
  the fallback.

### How to see it, and how to know it is fixed

```
jq -c '.sections[0:2][] | {box, background}' \
  /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index/capture.json

grep -o '<header class="[^"]*">' \
  /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index/raw.html
```

**Wrong (today):** the first command prints
`"background":{"kind":"color","color":"#ffffff"}` for the 1280x192 band and
`"color":"#ffffff"` inside the image band; the second prints
`<header class="absolute top-0 left-0 right-0 z-40">` — a band with no
background declaration at all.

**Right (fixed):** the 1280x192 band's background is `{"kind":"none"}`, or
carries an explicit inferred marker; the hero band's `color` is likewise marked
inferred rather than asserted. A fresh capture is required to see it:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c capture page https://gigabytealchemy.ai --json
```

---

## Issue 2 — a band's background colour and background image are compared by nothing, so a wrong band fill is a silent pass

**Residual class:** `values-diff-has-no-band-surface-fill-axis`

**Class: 1 — engine shortfall (measurement).** The value gate is the sharp
instrument this loop is told to work in, and it has no axis at all for the
single most visually dominant property of a page. This is the same shape as
REQ-269 issue 5 (section values unmeasured), one level down: there the bands did
not exist, here they exist and the property does not.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(this is a property of the code, not of the bundle — it holds for every
reference).

### The three questions, and what each returned

1. **Can L1 express it?** Yes — `surfaceFill` on a box; this page's L1 carries
   six of them. Not class 2.
2. **Is the value in the L1 document, and is it right?** For five of six bands,
   yes (see the table below); for the hero band, no — that is issue 3. The
   finding here is that **neither answer is reachable through the gate.**

### Evidence

**The reference side has no field for it.** `SectionValues`,
`tools/generate/src/cli/capture/values-diff.ts:257–287`, is the whole
reference-side section record:

```ts
export interface SectionValues {
  index: number
  overlay: { color: string; opacity: number } | null
  contentAnchorRatio: number | null
  paddingTopPx?: number
  paddingBottomPx?: number
  textAlign?: 'left' | 'center' | 'right'
  backgroundImageUrl?: string
  box?: Box
}
```

No fill. Confirmed in the written artifact — every section record on the
reference side of this run:

```
$ jq -c '[.sections[]|keys]|unique' $ITER/diff/expected-manifest.json
[["backgroundImageUrl","box","contentAnchorRatio","index","overlay","textAlign"],
 ["box","contentAnchorRatio","index","overlay","textAlign"]]
```

**The comparison pass reads exactly three properties.** `values-diff.ts:2973–3008`
— per paired section it compares `overlay`, then `contentAnchorRatio`, then
`textAlign`, and nothing else. `backgroundImageUrl` is *carried* (the type
comment at :272–281 says it exists so the fold can place the image box) and is
never compared, so an image folded onto the wrong band is not a delta either.

**The reproduction side puts band paint somewhere the diff cannot pair it.** An
L1 render paints bands as real boxes, so they arrive as `role: "generic"`
elements in the actual manifest:

```
$ jq -c '[.elements[]|select(.role=="generic" and .surfaceFill!=null)|{y:.box.y,surfaceFill}]' \
    $ITER/diff/actual-manifest.json
[{"y":0,"surfaceFill":"#030717"},{"y":800,"surfaceFill":"#e8dfd3"},
 {"y":1288,"surfaceFill":"#d9ccba"},{"y":1882,"surfaceFill":"#e8dfd3"},
 {"y":3139,"surfaceFill":"#d9ccba"},{"y":4260,"surfaceFill":"#0f172b"}]
```

The reference side has **zero** textless/`generic` elements (same jq against
`expected-manifest.json` returns `[]`), because its extractor keeps band paint
on the band record. So all six, plus the hero image box, fall out as unpaired:

```
$ jq -c '{n:(.unpairedActual|length), first:.unpairedActual[0]}' $ITER/diff/values-diff.json
{"n":7,"first":{"label":"(generic)","role":"generic","kind":"box"}}
```

`gate.json` reports this as `"unpairedActual": 7` and the pass rung's prose
names the count — but an `UnpairedObject` is `{label, role, kind}` with **no
box and no manifest index**, so the seven cannot be located, and the six colours
they carry cannot be checked against anything.

**The net effect, stated as a number:**

```
$ jq '[.deltas[]|select(.property=="surfaceFill" or .property=="backgroundImageUrl")]|length' \
    $ITER/diff/values-diff.json
0
```

Zero — on a run where one of the six band fills is demonstrably wrong (issue 3).

### Hypothesis

`tools/generate/src/cli/capture/values-diff.ts` — `SectionValues` (:257) has no
fill member; the per-section comparison (:2973–3008) therefore cannot compare
one; and `toUnpaired` / `UnpairedObject` discard the geometry that would let a
reader find the seven repro-only boxes. The reference-side projection that
builds `SectionValues` never reads `capture.json`'s `sections[].background`,
which is where the reference's own fill already sits.

### Proposed change

1. Add `surfaceFill: string | null` to `SectionValues`, projected on the
   reference side from `capture.json` `sections[].background.color` **once issue
   1 makes "no fill" expressible** (a `kind: 'none'` band projects `null`), and
   on the reproduction side from the band box the extractor already finds.
2. Compare it in the per-section pass alongside `overlay`, and compare
   `backgroundImageUrl` there too — a hero image on the wrong band is currently
   undetectable by any gate.
3. Reconcile the two shapes so an L1 render's band boxes are recognised as band
   paint and stop arriving as `unpairedActual`; failing that, carry `box` and
   `index` on `UnpairedObject` so the seven are at least locatable.

### How to see it, and how to know it is fixed

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3

jq '[.deltas[]|select(.property=="surfaceFill" or .property=="backgroundImageUrl")]|length' $ITER/diff/values-diff.json
jq -c '[.sections[]|keys]|unique' $ITER/diff/expected-manifest.json
jq -c '{n:(.unpairedActual|length), first:.unpairedActual[0]}' $ITER/diff/values-diff.json
```

**Wrong (today):** `0`; the reference section keys contain no fill member; and
`{"n":7,"first":{"label":"(generic)","role":"generic","kind":"box"}}` — seven
objects with no geometry.

**Right (fixed):** the reference section keys include `surfaceFill`; the diff
reports **one** `surfaceFill` delta on this bundle — `§1 surfaceFill` expected
(no fill) vs actual `#030717`, which is issue 3 — and `unpairedActual` drops
from 7 to 0 (or its records carry `box` and `index`).

To regenerate the artifacts after a change:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c values-diff repro-gigabytealchemy-ai \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index --sandbox --json
```

---

## Issue 3 — the fold paints the hero scrim's flattened colour as the hero band's base fill, where the reference paints nothing

**Residual class:** `fold-paints-opaque-scrim-colour-as-the-hero-band-base`

**Class: 1 — engine shortfall.** L1 carries a `surfaceFill` for the hero band
and the value is wrong.

**Stored reference exhibiting it:** `storage/references/gigabytealchemy.ai/index`
(evidence from this one bundle only).

**This issue is quoted here as the demonstration for issue 2.** Its own pixel
cost on this bundle is **zero** — `section-bg-0`'s `bg-cover` image covers
exactly the same box at every captured width (320/375/768/1024/1280/1440), so
the plate never shows. It matters because (a) the base fill of the page's
largest band is a value nobody chose, (b) an image that fails to load or a later
change to band geometry turns the hero solid navy, and (c) **no gate in the
project can currently report it** — which is issue 2's point, made with a live
example rather than a hypothetical.

### The three questions, and what each returned

1. **Can L1 express it?** Yes — `surfaceFill`, and "no fill" by omission. Not
   class 2.
2. **Is the value in the L1 document, and is it right?** It is present and
   **wrong**. → **class 1, stop here.**

### Evidence

**What L1 says:**

```
$ jq -c '.data.page.l1.root.children[] | select(.id=="section-band-0") | .axes' $ITER/page.json
{"surfaceFill":"#030717"}
```

with geometry keyframes `(0,0,w,800)` at 1280 — the whole hero band.

**What the reference paints there:** nothing. From `$REF/raw.html`:

```html
<section class="relative min-h-screen bg-cover bg-center bg-no-repeat" style="background-image: url('/images/AlchemistLabWithTech.png');">
  <div class="absolute inset-0 bg-slate-950/30"></div>
```

The hero `<section>` has a background *image* and no background-colour.
`#030717` is the **scrim** — `bg-slate-950/30`, a 30 %-alpha overlay — which
`capture.json` correctly records as an overlay on the band:
`"overlay":{"color":"#030717","opacity":0.3}`.

**How the scrim colour became a band fill.** The capture flattens the
translucent scrim into every run's opaque `surfaceFill`:

```
$ jq -c '.sections[1].content[]? | {t:(.text//""|.[0:24]), surfaceFill}' $REF/capture.json
{"t":"Intentional Software","surfaceFill":"#030717"}
{"t":"Tools for clarity, prese","surfaceFill":"#030717"}
{"t":"We're a software studio ","surfaceFill":"#030717"}
```

(the alpha loss itself is **BUG-24**), and the fold's band builder takes each
band's fill straight from the run group it was derived from —
`tools/generate/src/l1/fold.ts:1707`:

```ts
const node: L1Box = { kind: 'box', id: `section-band-${oi}`, geometry, axes: { surfaceFill: entry.g.fill } }
```

So the scrim's flattened colour is promoted to the band's base, and the band is
then emitted *under* `section-bg-0`, which re-applies the same scrim properly as
an `overlay` axis. The page ends up painting `#030717` twice: once opaque as a
plate, once at 0.3 as the overlay it actually is.

### Proposed change

In `fold.ts`'s band builder, do not adopt a run-group fill as a band's base
`surfaceFill` when that fill is the band's own detected overlay colour —
`capture.json` already carries `sections[].background.overlay` alongside
`sections[].background.color`, so the two are distinguishable at fold time. For
an image band, the base fill should come from `background.color` (once issue 1
makes a transparent one expressible) or be omitted.

Fixing BUG-24 (carrying alpha through the captured value set) would remove the
ambiguity at the source and is the better order if both are worked.

### How to see it, and how to know it is fixed

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-3

jq -c '.data.page.l1.root.children[] | select(.id=="section-band-0") | .axes' $ITER/page.json
jq -c '.sections[1].background' $REF/capture.json
```

**Wrong (today):** the first prints `{"surfaceFill":"#030717"}`; the second
prints `{"kind":"image","color":"#ffffff","image":"assets/AlchemistLabWithTech.png","overlay":{"color":"#030717","opacity":0.3}}`
— the `#030717` in L1 is the overlay colour, not any base the page declares.

**Right (fixed):** `section-band-0` carries no `surfaceFill` (or carries the
band's real, non-overlay base colour), while `section-bg-0` keeps
`"overlay":{"color":"#030717","opacity":0.3}` unchanged. Re-fold to check
without touching the capture:

```
1c refold --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
jq -c '.root.children[] | select(.id=="section-band-0") | .axes' \
  /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index/l1.json
```

The perceptual gate must not move: mean stays at 0.31/255 and the region count
at 10, because the plate was never visible.

---

# What landed

All three issues are implemented. Everything below is behaviour this ticket now
asserts, including the parts that are a technical consequence of what was asked
rather than asked for directly.

## Issue 1 — a band that paints nothing is recorded as painting nothing

**`tools/generate/src/cli/capture/extract.ts`** — neither band path launders
`rgbToHex`'s `null` into `bodyBg` any more. `RawBand.backgroundColor` is the
band's **own** painted fill, or `null` when it paints none. A band that paints
nothing and a band that paints white are now different records.

**`colorScheme` is read off the backdrop, not off the fabrication.** The scheme
was decided from the same laundered value, so a `<header>` whose only runs sit
over a dark photograph under a 30 % navy scrim came out `light`. It is now
`surfaceFillOf(bandElement) || bodyBg` — the existing helper that composites
down the *geometric* surface chain, so a sibling that merely sits behind the
band counts (exactly the header-over-hero shape) and a band that paints its own
fill still reads that fill first. `bodyBg` survives only as the last resort: a
page that paints nothing anywhere is read against the UA's own canvas.

**`background.kind: 'none'` is the projection.** `{ kind: 'color' }` with no
colour would read as a value the bundle *lost*; `none` is the positive assertion
that the absence was measured. This is the option the ticket offered above, and
it is the one that makes "no fill" mean something to the fold and to the diff.
An image band with no base colour keeps `kind: 'image'` and simply carries no
`color`.

### A capture-schema bump, and why this ticket needs one

The stored bundles in this project were all taken before the fix and every one
of them asserts an opaque fill for bands that paint nothing. Reading those
values as measurements is exactly the false-delta trap the ordering note above
warns about — so the honest band fill is registered as **capture schema 3**
(REQ-270's existing mechanism), with an entry in `CAPTURE_SCHEMA_AXES` naming
`background.kind: "none"` as an axis today's extractor records. A bundle behind
schema 3 is named in `staleCaptureDetail` like any other stale axis, and its
band colours are treated as **unmeasured** rather than as measurements
(see issue 2). This is a technical consequence of issue 1, not a separate
intent: without it, landing issue 2 fires a false delta for every transparent
band in every retained bundle.

## Issue 2 — a band's fill is compared

**`SectionValues.surfaceFill?: string | null`** — the band's base fill.
Three-valued on purpose:

- a hex — the band paints this;
- `null` — the band paints nothing, measured;
- `undefined` — **unmeasured**, which is the honest answer for a bundle older
  than capture schema 3. An unmeasured axis is skipped rather than compared
  against a stand-in, exactly as an unpaired section is.

Projected on the reference side from `capture.json` `sections[].background.color`
(schema-gated as above) and on the reproduction side from
`RawBand.backgroundColor`, which the live extractor had measured all along and
nothing had ever projected.

**Compared in the per-section pass**, next to `overlay`, reusing the existing
element-level `surfaceFill` delta property — a wrong band fill reads as the
colour defect it is, with `colorDistance` against `colorTolerance` when both
sides paint, and an unconditional delta when one paints and the other does not.

`backgroundImageUrl` needed no work here: REQ-270's `backgroundImage` section
comparison had already landed by the time this was implemented.

**Repro-only band paint stops being noise.** An L1 render paints each band as a
real full-bleed box, so the same fact arrived twice on the reproduction side —
once on the band record and once as a `role: "generic"` element that could never
pair, because the reference side has nothing for it to pair with. A textless
element that is full-bleed, coincides with a band's own box to within a pixel of
layout noise, and carries no treatment of its own (no border, shadow, radius,
ghosting, or media `src`) is recognised as band paint and not emitted as a
second copy. A box that merely *sits on* a band, or a layer with its own
geometry (the hero photograph inside a taller fill), keeps its place.

**And whatever is left unpaired can be found.** `UnpairedObject` carries `box`
and the actual-manifest `index`. `{label, role, kind}` reduced an untexted box
to `(generic)/generic/box`: a count, not a finding.

## Issue 3 — the fold never adopts a scrim colour as a band base

**`tools/generate/src/l1/fold.ts`** — `buildSolidBands` no longer takes a run
group's fill as the band's base when that fill *is* the scrim over the band.
The two are distinguishable at fold time because the capture carries them
separately (`overlay` beside the band's own fill). When the group fill equals
the overlapping section's overlay colour, the base is whatever the band itself
paints:

- a measured colour → carry it;
- measured as nothing (`null`) → the band paints nothing, so **no band node is
  emitted at all**. A box with no fill paints nothing; emitting one carrying no
  `surfaceFill` would be dead weight in the document and in the page-base
  calculation. This is the ticket's "carries no `surfaceFill`", taken to its
  conclusion.
- unmeasured (`undefined` — a pre-schema-3 bundle) → also omitted. An unmeasured
  fill is not a licence to keep the scrim colour.

Verified against the retained bundle by re-folding a copy of it: `section-band-0`
(`{"surfaceFill":"#030717"}`, the whole 800px hero) is gone, `section-bg-0` keeps
`"overlay":{"color":"#030717","opacity":0.3}` unchanged, the document's own
`background` stays `#e8dfd3`, and that band node is the *only* difference in the
folded L1 (70 nodes → 69).

## Test plan

`tests/test_UAT_FC_REQ-271_band_surface_fill.test.ts`, with
`tests/fixtures/capture/req271-transparent-bands.html` — a reference-shaped page
with a transparent `<body>`, a transparent absolutely-positioned `<header>` over
a hero `<section>` that paints a photograph under a separate 30 %-alpha scrim
element, and a cream section below.

Browser legs drive a real headless Chromium over an ephemeral loopback server
and skip cleanly where no browser can launch:

- a transparent band records `kind: 'none'` with no colour, the hero records
  `kind: 'image'` with no base colour and its scrim intact, a band that really
  paints a fill still records it, and `#ffffff` is asserted nowhere;
- the transparent header's `backgroundColor` is `null` and its `colorScheme` is
  `dark`, while the cream band below still reads `light`;
- an L1 render's band boxes (`req270-hero-layers.html`) reach `sections[].surfaceFill`
  and are not also emitted as manifest elements, while the inner photograph layer
  — which has its own geometry — keeps its place.

Browser-free legs drive the real projection / diff / fold entry points:

- a `null` band fill projects as `kind: 'none'`; a real white still projects as
  `color`; an image band drops only the invented colour;
- a pre-schema-3 bundle is named as unable to express the axis, and one that
  demonstrably carries it is not;
- both sides project `surfaceFill`, and a stale bundle leaves it `undefined`;
- a wrong band fill is exactly one `§n surfaceFill` delta ( `(none)` → `#030717`,
  the gigabytealchemy case), agreement is none, and an unmeasured side is skipped;
- an unpaired object carries its box and manifest index;
- a band whose only fill is its scrim emits no band node while the
  `section-bg` box keeps the overlay at its real opacity; a band with a fill of
  its own under a *different* scrim keeps that fill;
- the retained gigabytealchemy ladder folds with no `#030717` plate (skipped in
  a checkout that does not retain the bundle).

Regression scope: the capture / fold / values-diff suites (`capture`, `bug13`,
`bug14`, `bug15`, `bug19`, `bug24`, `bug27`, `req31`, `req35`, `req47`, `req53`,
`req63`, `req83`, `req88-l1-repro-pipeline`, `req92-fold-full-language`,
`reconciliation-l1-fold*`, `BUG-102`, `BUG-107`, `REQ-269`, `REQ-270`) plus the
whole `node` vitest project.
