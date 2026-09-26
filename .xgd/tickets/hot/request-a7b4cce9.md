---
uid: request-a7b4cce9
id: REQ-332
type: request
title: 'fold: a full-bleed band backdrop folds to box-N and escapes the surface exemption,
  plus a carousel L1 cannot clip and a font table that loses every weight'
created_by: repro-console:repro-joyfulculinarycreations-com#1
created_at: '2026-09-26T19:40:57.271901+00:00'
updated_at: '2026-09-26T22:04:37.864976+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  defect_class:
  - fold-wrong
  - l1-cannot-express
  - capture-loses-it
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-30133d14
  commits:
  - working_sha: 774d1ca786082134b0c9128861982e721651ee10
    reconcile_sha: null
    main_sha: null
  - working_sha: 9242212ed05d19c9790ca58e4cfe97fd2f997040
    reconcile_sha: null
    main_sha: null
  version: 0.2.382
  story_points: 13
---

# fold: a full-bleed band backdrop folds to `box-N`, so the overlap exemption written for it never fires — plus a carousel L1 cannot clip and a font table that loses every weight

Filed by `repro-console:repro-joyfulculinarycreations-com#1`, iteration 1 of the reproduction of
https://joyfulculinarycreations.com (sandbox site `repro-joyfulculinarycreations-com`).

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  (`capturedAt` `2026-09-26T19:06:28.966Z`, `captureSchema` 6; nothing has landed in the engine since,
  so every number below is measured by the instrument running now — this is **not** a stale-bundle round)
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-1/`

`gate.json`: `"verdict": "structural-failure"`, `"pass": false`, `"l1Pass": false`,
`"perceptualBreach": true`, `"valuesBreach": true`; perceptual mean 35.91/255 over 32.09% of pixels
in 12 regions; `values.deltas` 122 (`matched` 77, `unmatched` 9, `unpairedActual` 0,
`worstTier` CRITICAL); `layout.findings` 1238 — 1172 `overlap`, 56 `escape`, 10 `clip`.

`defect_class`: **`fold-wrong`**, **`l1-cannot-express`**, **`capture-loses-it`**.

**Four residuals, in dependency order.** Issue 1 is 100% of the `structural-failure` verdict and is
independent of the rest — fix it first. Issue 2 is the cause of this round's `unmeasured 10`, but by
way of a ruler defect filed separately (see "What is NOT in this ticket" below), so the two can be
worked in either order. Issues 3 and 4 are independent of both.

**Two residuals are deliberately elsewhere**, so nobody re-derives them:

- the hero heading's half-leading and the −43.2px document-wide flow shift it causes (73 of the 122
  deltas, and the two largest perceptual regions) is **REQ-265**'s class, third sighting, third
  bundle. Re-measured and appended there as a comment this round.
- the fold's negative-margin flow repair, here at **`margin-top: -7160.51px`** at 320px, is
  **REQ-302**'s issue 2. Re-measured and appended there as a comment this round.

## What is NOT in this ticket

Three instrument defects measured this round are filed separately as a `bug`, per §5 of the round
brief (the precedent is BUG-148, filed the same way beside REQ-324):

- the full-bleed band test measures against `document.documentElement.scrollWidth`, so a reproduction
  that overflows horizontally has **no bands at all** — the whole of this round's `unmeasured 10`, and
  9 CRITICAL `missing` deltas asserting band paint is absent when the served CSS demonstrably paints it;
- the element pairer matches two text-free `generic` records on the literal string `(generic)` in
  preference to geometry, producing a CRITICAL `position` delta of **+2624px** and 7 more;
- `semanticOf`'s unbounded `[role]` ancestor walk attributes a carousel slide's `role="group"` to a
  text run three ancestors down, producing 5 HIGH `a11yRole` deltas in which the **reference** side is
  the wrong one.

Issue 2 below and the first of those three are the same site fact seen from the two ends: this
ticket's half is that L1 cannot clip; the bug's half is that the instrument should not have been
measuring full-bleed against a scroll width in the first place. **Both need doing** — fixing only the
ruler leaves a reproduction that scrolls sideways 420px, and fixing only the clip leaves the ruler
one horizontal overflow away from going blind again on the next site.

---

## Issue 1 — a full-bleed section band that arrives as a capture `field` folds to `box-N`, so the exemption written for exactly that node never matches

**Class 1 — engine shortfall.** `defect_class`: **`fold-wrong`** — the capture carries all 11 band
backdrops, L1 expresses all 11 correctly, the renderer paints all 11 correctly, and the fold writes
the wrong **id** on them, which is the one field every geometry probe keys its judgement off.

### The test I ran, and what it returned

**Q1: can L1 express it?** Yes — and it does. `page.json`
(`data.page.l1.root.children[0].children[*].children[0..1]`) carries 11 full-bleed `box` leaves whose
`axes.surfaceFill` matches the capture one-for-one:

| L1 node | id | `axes` | `capture.json` `sections[1].fields[n]` |
|---|---|---|---|
| `0.0.0.0` | `box-0` | `{"surfaceFill":"#000000"}` | f0 `(0,0,1280×800)` `#000000` op 1 |
| `0.0.0.1` | `box-1` | `#000000`, op 0.49, HERO image, filter | f1 same box, op 0.49, HERO image, filter |
| `0.0.1.0` | `box-2` | `{"surfaceFill":"#ffffff"}` | f2 `(0,800,1280×535.96875)` `#ffffff` |
| `0.0.2.0` | `box-3` | `{"surfaceFill":"#7a7a7a"}` | f3 `(0,1335.96875,1280×267.5)` `#7a7a7a` |
| `0.0.2.1` | `box-4` | `#7a7a7a`, op 0.5 | f4 same box, op 0.5 |
| `0.0.3.0` | `box-5` | `{"surfaceFill":"#7a7a7a"}` | f5 `(0,1603.46875,1280×1064.046875)` `#7a7a7a` |
| `0.0.4.0` | `box-6` | `#ffffff` + `market-vegetables-produce-6329164.jpg` | f9 `(0,2667.515625,1280×267)` |
| `0.0.5.0` | `box-7` | `{"surfaceFill":"#ffffff"}` | f11 `(0,2949.515625,1280×525.015625)` |
| `0.0.6.0` | `box-8` | `{"surfaceFill":"#7a7a7a"}` | f12 `(0,3489.53125,1280×950.09375)` |
| `0.0.6.1` | `box-9` | `#7a7a7a`, op 0.98 | f13 same box, op 0.98 |
| `0.0.7.0` | `box-10` | `{"surfaceFill":"#edc251"}` | f14 `(0,4440.625,1280×302.3125)` |

**Q2: is the L1 value right?** Yes. The served document paints every one of them —
`iteration-1/site/index.html`, inline `<style>`:

```css
.l1-3   { background-color: #000000 }                                     /* box-0  */
.l1-20  { background-color: #ffffff; padding-top: 80px; … }               /* box-2  */
.l1-29  { background-color: #7a7a7a }                                     /* box-3  */
.l1-106 { background-color: #edc251; padding-top: 60px }                  /* box-10 */
```

**Q3: does the render agree with L1?** Yes — and the **probe** does not. This is not a paint defect;
it is the geometry envelope reading a correct render as 1172 collisions.

`probes.ts:1241-1246` exempts a backing surface from the overlap scan **by id prefix**:

```ts
const solid = ctx.leaves.filter(
  (l) =>
    l.kind !== 'slot' &&
    !(l.kind === 'box' && isSynthesizedSurfaceId(l.id)) &&
    …
```

and `fold.ts:1034-1038` defines that prefix set:

```ts
export const SYNTHESIZED_SURFACE_ID_PREFIXES = ['section-band-', 'section-bg-', 'card-'] as const
export function isSynthesizedSurfaceId(id: string | undefined): boolean {
  return id !== undefined && SYNTHESIZED_SURFACE_ID_PREFIXES.some((p) => id.startsWith(p))
}
```

`box-` is not in that list, so none of the 11 is exempt. In this document the only nodes carrying a
`section-band-*` id are **containers**, not boxes — `page.json` has exactly three
(`0.0.0.3 section-band-0`, `0.0.5.1 section-band-1`, `0.0.6.2 section-band-2`) and all three are
`"kind": "container"`. So the exemption fires zero times on a page with eleven section bands.

### The number

`gate.json` `layout.findings`: **1172 `overlap` findings** over the 12 (width × height) samples —
`1280×768` 111, `1440×1536` 109, `1440×768` 104, `1024×768` 100, `1280×1536` 100, `768×1536` 95,
`1024×1536` 95, `320×768` 94, `375×768` 94, `768×768` 92, `320×1536` 89, `375×1536` 89. They reduce
to **121 distinct leaf pairs**, and **120 of the 121 name one of `box-0`…`box-10`**. Verbatim, at
`1280×768`:

```json
{"kind":"overlap","detail":"at 1280px×768px: box overlaps Dreaming of healthier meals",
 "width":1280,"height":768,"paths":["0.0.0.0","0.0.0.3.0.0.0"]}
{"kind":"overlap","detail":"at 1280px×768px: box overlaps Learn More",
 "width":1280,"height":768,"paths":["0.0.0.0","0.0.0.3.0.2.0"]}
{"kind":"overlap","detail":"at 1280px×768px: box overlaps box",
 "width":1280,"height":768,"paths":["0.0.0.0","0.0.0.1"]}
```

`0.0.0.0` is `box-0`, the hero's opaque black base. It overlaps its own band's logo, its own heading,
its own button, its own nav links and its own scrim (`box-1`, which is *deliberately* stacked on it at
`y: -800`) — eleven pairs from one node, at every sample. The single pair in the 121 that does **not**
involve a band backdrop is `0.0.0.3.0.0.0` × `0.0.0.3.0.0.1`, the hero's two heading lines painting
over each other, which is REQ-265's class and is appended there.

`layout.pass` is `false` solely on these, and `"verdict": "structural-failure"` follows from
`l1Pass: false`. **The perceptual and value gates are being reported under a verdict that is 100%
this one id.**

### And the same node is *un*-asserted in the other direction

Because nothing treats `box-N` as a backing surface, no run is recorded as sitting on one. The
`backedBy` census over `page.json` is 27 runs, and **every one names a `section-band-*` or a
`card-*`**:

```
{"section-band-0":1,"section-band-1":2,"section-band-2":2,
 "card-0":1,"card-1":1,"card-2":5,"card-3":3,"card-4":4,
 "card-5":1,"card-6":1,"card-7":1,"card-8":1,"card-9":1,"card-10":1,"card-11":1,"card-12":1}
```

Zero name a `box-*`. So BUG-143's containment probe never asks whether any of the 11 bands still
covers the copy standing on it. The 11 nodes are simultaneously **over-asserted** (1172 overlaps) and
**un-asserted** (0 escapes) — the two states a surface must never be in at once, and the reason this
is a defect in the *pairing*, not a threshold to relax.

### Hypothesis

`fold.ts` — the field→`box` leaf path (`classifyElement`'s `box` case and whatever names leaves
`box-<n>`). A capture `field` that is full-bleed, childless and paints only a fill **is** a section
band backdrop, whatever route it arrived by; `foldSectionBackgrounds` is not the only producer of
one. The exemption at `probes.ts:1243` and the `backedBy` attribution both key on a name that only
one of the two producers writes.

The comment at `probes.ts:1238-1239` states the intent that is being missed:

> A genuine captured standalone surface (`box-*`) is real painted content and still participates, so
> two of them colliding is still reported.

That is right for a divider or a decorative panel. It is wrong for a 1280×1064 fill behind a whole
section, and nothing in the id tells the two apart.

### Proposed change

Either of these closes it; the first is small and the second is the one BUG-142's own comment points at.

1. **Cheap — decide the exemption from geometry, not from the id.** A `box` leaf that is full-bleed at
   every captured width, has no children, paints only `surfaceFill` (± a `backgroundImageUrl`) and
   *contains* the leaves it overlaps is a backdrop; exempt it and give it a `section-band-*` id at fold
   time so `backedBy` can name it and the containment probe can hold it to its content. That converts
   1172 false overlaps into 11 real containment assertions.
2. **Deep — make the containment structural.** Nest a band's runs inside the band `box` instead of
   painting it as a preceding sibling. Then there is no leaf-pair to report, `backedBy` is the parent
   link, and `probes.ts`'s exemption can shrink rather than grow. This is the "once a surface really
   contains its content structurally" future the `backedBy` doc comment in
   `packages/site-schema/src/l1/schema.ts` already names.

Whichever is taken, **the fix will not lower the delta count and may raise it**: exempting the 11
backdrops enables 11 containment assertions that are being skipped today, and any one of them may
fire. That is the instrument getting finer, not the reproduction getting worse.

### How to see it, and how to know it is fixed

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index \
  --sandbox
```

**Wrong now** — `"verdict": "structural-failure"`, `layout.pass: false`, 1172 findings of
`"kind": "overlap"`, of which 1160 have `paths[0]` or `paths[1]` equal to one of
`0.0.0.0 0.0.0.1 0.0.1.0 0.0.2.0 0.0.2.1 0.0.3.0 0.0.4.0 0.0.5.0 0.0.6.0 0.0.6.1 0.0.7.0`.

**Right when fixed** — at most the 12 `overlap` findings for the hero's two heading lines (and zero
once REQ-265 lands), and the verdict is decided by the perceptual and value gates rather than by the
envelope. An offline check that needs no browser:

```
1c page get repro-joyfulculinarycreations-com home --sandbox --json > /tmp/p.json
```

**Wrong now** — the 11 full-bleed fill boxes have ids `box-0`…`box-10` and no run's `backedBy` names
any of them. **Right when fixed** — each is named as a backing surface and the runs standing on it say
so.

---

## Issue 2 — L1 cannot clip, so a carousel's off-screen slides make the document 420px wider than the viewport

**Class 2 — L1 cannot express it.** `defect_class`: **`l1-cannot-express`** (leading, and this is the
**ceiling** queue), with **`capture-loses-it`** beside it because nothing upstream carries the fact
either.

### The test I ran, and what it returned

**Q1: can L1 express it?** **No.** `packages/site-schema/src/l1/schema.ts:614-623`, in
`l1TransformSchema`'s doc comment, states it as a design decision:

> TWO CONSEQUENCES THIS AXIS SETTLES, both of which fall out of the renderer emitting no `z-index` and
> no `overflow` anywhere: … **Nothing clips it.** L1 emits no `overflow`, so a node translated past its
> parent's edge paints in full rather than being cut off at the boundary. (An explicit `mask` still
> clips — that is what it is for.)

And the mask cannot stand in. `l1MaskSchema` (`schema.ts:503-512`) accepts exactly:

```ts
shape: z.enum(['circle','ellipse','parallelogram','blob','featherRadial','featherTop','featherBottom'])
```

None of those is "clip to my own rectangle". `parallelogram` with `slantPct: 0` would degenerate to
one, but that is an accident of the polygon the renderer builds, not an intent a document can state —
and DOC-24's rule is about what L1 must be able to *express*, which is the thing missing here. There
is no field, and no accepted value of the nearest field, that says "these children are cut off at my
edge". That is the whole of Q1; I did not need Q2 or Q3.

**And the capture does not carry it either.** `overflow` occurs **0 times** in the 194,391 bytes of
`capture.json` (`grep -c overflow capture.json` → 0; likewise `clip` → 0), and neither `RawRun` nor
`RawField` in `tools/generate/src/cli/capture/extract.ts` has an overflow property. So even with an
L1 axis, the fold would have nothing to write into it.

### The evidence

The reference has a testimonial carousel. `storage/references/joyfulculinarycreations.com/index/raw.html`:

```html
<div class="elementor-main-swiper swiper" role="region" aria-roledescription="carousel" aria-label="Slides">
  <div class="swiper-wrapper">
    <div class="swiper-slide" role="group" aria-roledescription="slide">
```

`.swiper` clips with `overflow: hidden`, so the slides laid out either side of the visible one never
reach the document's scroll box. **Both sides place those slides identically** —
`expected-manifest.json` `elements[44]` `box.x = -419.1875` and `elements[48]` `box.x = 1026.8125`,
both `y 3102.33`, `width 673`; `actual-manifest.json` `elements[46]` and `[47]` have the same two
x values. The difference is only what the document is:

| | reference | reproduction |
|---|---|---|
| viewport | `{"width":1280,"height":4744}` | `{"width":1280,"height":4710}` |
| body-spanning band box | `{"x":0,"y":0,"width":1280,"height":4743.9375}` | `{"x":0,"y":0,"width":1699.75,"height":4710}` |

1699.75 − 1280 = **419.75px of horizontal scroll that the reference does not have.**

`values-diff.json` reports it once, as one HIGH delta:

```json
{"text":"I cannot say enough good things about our meal. Sarah Joy…","role":"body",
 "property":"overflow","expected":"≤1280w","actual":"1700w","kind":"overflow",
 "tier":"HIGH","magnitude":420,"severity":3080.9976247030877}
```

`gate.json` `layout.findings` reports it 10 times as `clip` —

```json
{"kind":"clip","detail":"at 1280px×768px: leaf right edge 1700px exceeds viewport 1280px",
 "width":1280,"height":768,"paths":["0.0.5.3"]}
{"kind":"clip","detail":"at 1024px×768px: leaf right edge 1905px exceeds viewport 1024px",
 "width":1024,"height":768,"paths":["0.0.5.3"]}
{"kind":"clip","detail":"at 1440px×768px: leaf right edge 1462px exceeds viewport 1440px",
 "width":1440,"height":768,"paths":["0.0.5.6"]}
```

— and **56 times as `escape`**, which is every `escape` finding in the round:

```
at 768px×768px: '“So fabulous. We are planning to do this as often as possible. YUMMM “​​' is no
longer covered by its backing surface section-band-1 — 644px left of its left edge
at 1024px×768px: '“So fabulous…' … — 880px left of its left edge
at 768px×768px: 'I cannot say enough good things about our meal. …' is no longer covered by its
backing surface section-band-1 — 644px right of its right edge
```

28 findings on each of the two slides, at 14 (width × height) samples.

It also costs two value deltas, because a run outside every band falls through to the page fill:

```json
{"text":"“So fabulous. We are planning to do this as often as poss…","role":"body",
 "property":"surfaceFill","expected":"#28542d","actual":"#7a7a7a","kind":"color",
 "tier":"LOW","magnitude":0.1938833764682166,"severity":1060.1623972494212}
```

`#28542d` is `section-band-1`'s own fill (`page.json`, `0.0.5.1`); `#7a7a7a` is
`data.page.l1.background`. The slide is outside the surface that backs it, so the tightest painted box
containing it is the body.

### Hypothesis

Two changes, in this order:

1. **L1** — an axis that says "clip my children to my own box". The nearest existing shape is
   `nodeAxisGroupsShape`'s `mask`, but a clip is not a mask: it is not a decorative edge treatment and
   it needs no shape parameters. A sibling of `sizing` / `visibility` in `nodeAxisGroupsShape`
   (`schema.ts:1552`) reads better — `clip: z.literal(true).optional()`, the same
   "declared, never inferred, `true` is the only legal value" shape `stacked` already uses — compiling
   to `overflow: hidden` on that node and nothing else. The envelope's horizontal-clip check then has
   to stop at a clipping ancestor rather than at the viewport, and `escape` has to measure against the
   clip box.
2. **Capture** — record it. `RawField`/`RawRun` need the computed `overflow-x`/`overflow-y` of the
   run's nearest clipping ancestor, plus that ancestor's box, so the fold knows which synthesized
   container to put the axis on.

Both are needed: an axis with nothing to fill it in is inert, and a captured value with no axis to
write it to is lost.

### How to see it, and how to know it is fixed

Offline, no browser:

```
python3 -c "import json;m=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-1/diff/actual-manifest.json'));print(m['viewport'], m['sections'][0]['box'])"
```

**Wrong now** — `{'width': 1280, 'height': 4710} {'x': 0, 'y': 0, 'width': 1699.75, 'height': 4710}`.
**Right when fixed** — `width` 1280, matching the reference's own `1280` for the same slide geometry.

With a browser:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index \
  --sandbox
```

**Wrong now** — 10 `clip` findings, 56 `escape` findings, one HIGH `overflow` delta reading
`1700w`, and two LOW `surfaceFill` deltas reading `#7a7a7a` where the reference reads `#28542d`.
**Right when fixed** — zero `clip`, zero `escape` on `0.0.5.2`/`0.0.5.3`, no `overflow` delta, and the
two slides reading their own band's `#28542d`. And a validator check:

```
1c l1-gate repro-joyfulculinarycreations-com --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index
```

**Wrong now** — a document that sets `clip` on `0.0.5.1` is rejected by `validateL1` as an unknown
key, because `l1ContainerSchema` is `.strict()`. **Right when fixed** — accepted.

---

## Issue 3 — the capture destroys the `(font file → weight, style)` pairing, so all seven `@font-face` rules are emitted as `(normal, 400)` and the italic Karla file is declared as the normal one

**Class 1 — engine shortfall.** `defect_class`: **`capture-loses-it`** (leading — the correlation is
gone before the fold sees it), with **`fold-wrong`** beside it for the second, independent collapse in
`fontResourcesFromTheme`.

### The test I ran, and what it returned

**Q1: can L1 express it?** Yes, both fields exist.
`packages/site-schema/src/l1/schema.ts:1987-1994`:

```ts
export const l1FontFaceSchema = z
  .object({
    family: z.string().min(1),
    src: z.string().min(1),
    weight: finite.optional(),
    style: z.enum(['normal', 'italic']).optional(),
  })
  .strict()
```

And the renderer emits both — `packages/framework/src/l1/render.ts:254-257`:

```ts
if (f.weight !== undefined && Number.isFinite(f.weight)) decls.push(`font-weight: ${Math.round(f.weight)}`)
if (f.style) decls.push(`font-style: ${f.style}`)
```

**Q2: is the value in the L1 document, and is it right?** **It is absent.** All seven entries of
`page.json` `data.page.l1.resources.fonts` are `{family, src}` and nothing else:

```json
[{"family":"Lato","src":"/assets/lato-s6u9w4bmutphh7usswipgq.woff2"},
 {"family":"Lato","src":"/assets/lato-s6uyw4bmutphjx4wxg.woff2"},
 {"family":"Lato","src":"/assets/lato-s6u9w4bmutphh6uvswipgq.woff2"},
 {"family":"Oswald","src":"/assets/oswald-tk3iwkuhhaijg752gt8g.woff2"},
 {"family":"Raleway","src":"/assets/raleway-1ptug8zys_skggpnyc0itw.woff2"},
 {"family":"Karla","src":"/assets/karla-qkbvxvyc6trat7rqht6e4q.woff2"},
 {"family":"Karla","src":"/assets/karla-qkbbxvyc6trat7rvltw.woff2"}]
```

So the served document (`iteration-1/site/index.html`) carries seven descriptor-free rules:

```css
@font-face { font-family: "Karla"; src: url("assets/karla-qkbvxvyc6trat7rqht6e4q.woff2") format("woff2"); font-display: swap }
@font-face { font-family: "Karla"; src: url("assets/karla-qkbbxvyc6trat7rvltw.woff2") format("woff2"); font-display: swap }
@font-face { font-family: "Lato";  src: url("assets/lato-s6u9w4bmutphh7usswipgq.woff2") format("woff2"); font-display: swap }
@font-face { font-family: "Lato";  src: url("assets/lato-s6uyw4bmutphjx4wxg.woff2") format("woff2"); font-display: swap }
@font-face { font-family: "Lato";  src: url("assets/lato-s6u9w4bmutphh6uvswipgq.woff2") format("woff2"); font-display: swap }
```

An `@font-face` with no `font-weight` defaults to `400` and no `font-style` defaults to `normal`, so
**all five of those claim `(normal, 400)` and only one per family can win.**

**What each file actually is**, read off the reference's own mirrored stylesheets
(`iteration-1/site/assets/karla.css` and `lato.css`, byte-identical copies of the live site's):

| file | the reference declares it as |
|---|---|
| `karla-qkbvxvyc6trat7rqht6e4q.woff2` | `font-style: italic`, weights 200–800 — **the italic face** |
| `karla-qkbbxvyc6trat7rvltw.woff2` | `font-style: normal`, weights 200–800 |
| `lato-s6u9w4bmutphh7usswipgq.woff2` | `font-style: normal; font-weight: 300` |
| `lato-s6uyw4bmutphjx4wxg.woff2` | `font-style: normal; font-weight: 400` |
| `lato-s6u9w4bmutphh6uvswipgq.woff2` | `font-style: normal; font-weight: 700` |

So the reproduction declares Karla's **italic** file as a plain `(normal, 400)` Karla face beside the
normal one, and declares Lato's 300, 400 and 700 files as three identical `(normal, 400)` faces of
which two are unreachable. The page then asks for weights that no declared face provides — from
`page.json`: `axes.fontWeight` 300 on `0.0.2.7` ("Gifting our services…", Karla),
500 on `0.0.3.12` ("In-home weekly, bi-weekly or monthly service", Karla), 300 on `0.0.0.3.0.1`
("Holistic In-Home Personal Chef Services…", Lato).

### Where the pairing is lost — the whole chain

1. `tools/generate/src/cli/capture/extract.ts:2437-2444` reads each `CSSFontFaceRule` as
   `{family, srcUrls, weight}`. **`font-style` is never read**, so italic-vs-normal dies here.
2. `tools/generate/src/cli/capture/pipeline.ts:186-197` (`fontFilesByFamilyOf`) reduces every face of
   a family to one deduplicated `string[]` of local paths. **The per-face `weight` is dropped here**,
   so the `(file → weight)` correlation dies too.
3. `tools/generate/src/cli/capture/theme.ts:118-135` (`buildTheme`) then sets `weights` from the
   weights **painted runs** use, not from the weights the faces provide. On this site that is visibly
   not the same set — `capture.json` `theme.fonts[0]` is

   ```json
   {"family":"Lato, raleway","role":"body","weights":[300,400,600],
    "files":["assets/lato-s6u9w4bmutphh7usswipgq.woff2",
             "assets/lato-s6uyw4bmutphjx4wxg.woff2",
             "assets/lato-s6u9w4bmutphh6uvswipgq.woff2"]}
   ```

   — `weights` says 600, the third file is 700, and the two arrays are parallel in length by
   coincidence and in nothing else.
4. `tools/generate/src/cli/capture/theme.ts:155-169` (`fontResourcesFromTheme`) then takes the cross
   product and discards the weight unless the family uses exactly one:

   ```ts
   const weight = f.weights.length === 1 ? f.weights[0] : undefined
   for (const src of f.files) {
     const face: L1FontFace = { family: primaryFamily(f.family), src }
     if (weight !== undefined) face.weight = weight
     out.push(face)
   }
   ```

   All four families on this site list three weights, so `weight` is `undefined` for all seven faces
   and `style` is never set at all.

### Hypothesis

`RawFontFace` needs a `style` and needs to keep its `srcUrls` bound to its own `weight`; a
`ThemeFont` needs to be a list of `{src, weight, style}` faces rather than two independent arrays; and
`fontResourcesFromTheme` needs to map one captured face to one `L1FontFace` instead of taking a cross
product. The renderer already does the right thing with the result.

### Proposed change

Carry the face, not the family: `RawFontFace { family, srcUrls, weight, style }` →
`ThemeFont { family, role, faces: [{src, weight, style}] }` →
`L1FontFace { family, src, weight, style }`, one per captured `@font-face`. A variable font (Oswald
and Karla here are single files covering 200–800) is the case to be careful with: it should emit a
`font-weight: 200 800` range rather than a single value, which the current `finite.optional()` shape
cannot hold — so `l1FontFaceSchema.weight` may need to accept a `[min, max]` pair. Say so in the
ticket that does the work; do not quietly pin a variable face to one weight, which is what happens
today by accident.

### How to see it, and how to know it is fixed

Offline, no browser:

```
python3 -c "import re;h=open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-1/site/index.html').read();[print(' | '.join(x.strip() for x in b.split(';') if x.strip())) for b in re.findall(r'@font-face\s*\{([^}]*)\}', h)]"
```

**Wrong now** — seven rules, none carrying `font-weight` or `font-style`, two of them "Karla" and
three of them "Lato". **Right when fixed** — each rule carries the descriptor its source
`@font-face` had, the Karla italic file carries `font-style: italic`, and the three Lato files carry
`font-weight: 300`, `400` and `700` respectively.

Then:

```
CHROMIUM_LAUNCH_ARGS=--single-process 1c values-diff repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index \
  --sandbox
```

**Wrong now** — 11 HIGH `renderedTextBox` deltas, whose exact numbers are in the REQ-265 comment this
round left (the ink box and the wrap point differ on runs whose every compared type axis is identical
on both sides, which is what a substituted face looks like). **Right when fixed** — those 11 either
go away or narrow, and whatever remains has a cause that is not the font table. I am **not** asserting
the 11 deltas are caused by this; the descriptor loss above is proved from the served CSS on its own,
and the link to the 11 is the thing a browser-backed run would settle.

---

## Issue 4 — the L1 `filter` axis is an unordered object, so a CSS filter chain's function order cannot be reproduced

**Class 2 — L1 cannot express it.** `defect_class`: **`l1-cannot-express`**. Small, and last for that
reason; filed because the axis shape makes it unfixable at any other layer.

### The test I ran

**Q1: can L1 express it?** **No.** `packages/site-schema/src/l1/schema.ts:559-570`:

```ts
export const l1FilterSchema = z
  .object({
    grayscale: …, sepia: …, invert: …, saturate: …,
    brightness: …, contrast: …, hueRotateDeg: …, blurPx: …,
  })
  .strict()
```

Eight optional scalars on a `.strict()` object. CSS `filter` is an **ordered list** and its functions
do not commute, so the order is a value the axis cannot hold.

### The evidence

`capture.json` `sections[1].fields[1].filter` (the hero scrim):

```
brightness(0.67) contrast(0.88) saturate(1.06) blur(0px) hue-rotate(0deg)
```

`page.json` `0.0.0.1` (`box-1`) `axes.filter`:

```json
{"saturate": 1.06, "brightness": 0.67, "contrast": 0.88}
```

Served `iteration-1/site/index.html`, `.l1-4`:

```css
filter: saturate(1.06) brightness(0.67) contrast(0.88)
```

`saturate` has moved from third to first. `contrast` is affine with a +0.06 lift on every channel at
these parameters, and `saturate` is a matrix on RGB, so applying the lift before the saturation
(reference) and after it (ours) are different images. The magnitude here is small — `saturate(1.06)`
is a 6% boost — and I am not claiming it explains any of this round's regions. It is filed because the
axis cannot hold the value at all, so no later round can fix it without changing the type.

**And nothing measures it.** The two `filter` deltas in `values-diff.json` are
`expected "none" / actual "present"` and its inverse, both artifacts of the band mispairing filed in
the accompanying bug ticket. The comparator reduces `filter` to present/absent, so a reordered chain
is invisible to the score — an `instrument-no-axis` shadow of the same gap, worth one line in whatever
fixes this.

### Proposed change

Make the axis ordered: `filter: z.array(l1FilterFunctionSchema)` where each entry is a tagged
`{fn, value}`, or keep the object and add an explicit `order: z.array(z.enum([...]))`. The array is
truer to CSS and to DOC-2 §2's "the document names the intent, never the syntax" — the entries are
still typed enums and numbers, never a raw string. The capture already records the source order (it
stores the whole computed `filter` string); the fold needs to parse it in order rather than into named
slots.

### How to see it, and how to know it is fixed

Offline, no browser:

```
python3 -c "import json,re;print(json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/capture.json'))['sections'][1]['fields'][1]['filter']);h=open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-1/site/index.html').read();print(re.search(r'filter:\s*saturate[^;}]*',h).group(0))"
```

**Wrong now** — the capture says `brightness(0.67) contrast(0.88) saturate(1.06) …` and the render says
`saturate(1.06) brightness(0.67) contrast(0.88)`. **Right when fixed** — the render's function order
matches the capture's, function for function.


---

# Implementation — what was built, and the decisions taken along the way

All four issues are closed. Evidence:
`tests/test_UAT_FC_REQ-332_backdrop_clip_faces_and_filter_order.test.ts` (19 UATs, no browser,
every one driving a real entry point — `foldToL1`, `evaluateLayout` / `deriveSurfaceBacking`,
`renderL1Document`, `validateL1`, `buildTheme` / `fontResourcesFromTheme`, `diffManifests`).

## Issue 1 — the captured backdrop is named for what it is

Option 1 of the two proposed ("decide the exemption from geometry, not from the id"), with one
deliberate departure from the wording.

**A new id prefix `backdrop-`, not a reused `section-band-`.** The ticket proposed giving a
captured backdrop a `section-band-*` id. That would have been wrong in a way the ticket could not
see from the outside: `SYNTHESIZED_SURFACE_ID_PREFIXES` answers a question about **provenance** —
"did the fold invent this node, so that it has no oracle counterpart to be paired against?" — and a
captured backdrop emphatically does have one. Renaming it into that set would have removed eleven
real captured elements from the fidelity pairing queue. The two questions ("did the fold invent
this?" and "does this back content?") used to have one answer because only the fold ever made a
backdrop; a captured one separates them. So there are now two predicates:

- `isSynthesizedSurfaceId` — unchanged, and still the answer to the provenance question.
- `isBackingSurfaceId` — the new one, true for a fold-synthesized surface **or** a captured
  `backdrop-*`. It is what every *geometric* judgement about surfaces asks.

Three call sites move to the new predicate, and only three: the overlap exemption
(`probes.ts` `evaluateLayout`), the `backedBy` attribution (`deriveSurfaceBacking`), and the
content-perturbation height rule in `layoutInFlow` (BUG-143 — a backing surface does not grow with
the perturbation because the renderer pins its height from keyframes; that is true of a captured
backdrop on identical terms, and has to be, or the containment assertions this ticket enables
would be graded against a band that grew and a run that grew by a different amount).

**The naming test is containment, not size.** `isBackdrop`'s existing 0.9-of-viewport full-bleed
test decides which *paint layer* a fill belongs in, and for that it is exactly right — a 1200×4
divider spanning the page is painted behind the content as surely as a 1280×1064 section band is.
It is far too loose to decide whether a fill is a *backing surface*, which is a claim about the
copy standing on it. So a captured backdrop is named `backdrop-N` when it **covers at least one
content leaf**, and keeps an ordinary `box-N` when it covers nothing. A decorative divider is
therefore still a full participant in the overlap scan, which is the property that keeps the
exemption honest.

**The test runs at the widest width only**, unlike `nestBackingSurfaces`, which demands containment
at every width before it will restructure the tree. The two need opposite defaults: nesting a band
around copy it does not hold at 320px would give the band a content extent it never had, whereas
*naming* a band that has slid off its copy at 320px is the only way the containment probe can ever
report that it has. A stricter test here would silently un-name exactly the broken cases the probe
exists to catch.

**Naming happens after the fold loop, not inside it.** Whether a fill backs anything is not
knowable until every leaf exists, so `foldToL1` leaves a backdrop unnamed in the loop and
`nameCapturedBackdrops` assigns every id in one pass afterwards.

`keepsAbsolute` (flow recovery) was deliberately **not** moved to the new predicate. It is about
which nodes recovery leaves pinned, not about a geometric judgement, and changing it would alter
recovery behaviour beyond this ticket's scope.

As the ticket predicted, this does not lower the delta count and may raise it: it converts false
overlaps into real containment assertions, any one of which may fire.

## Issue 2 — L1 can clip

All three layers, as the ticket's hypothesis ordered them.

**L1: `clip: z.literal(true).optional()`**, a sibling of `sizing` / `visibility` in
`nodeAxisGroupsShape` — exactly the shape proposed, and the same "declared, never inferred, `true`
is the only legal value" form `stacked` already uses. The renderer compiles it to
`overflow: hidden` on that node and nothing else; it is the renderer's only `overflow` emitter.

**One axis, not two.** CSS has `overflow-x` and `overflow-y` and a document could in principle clip
one and not the other, but `overflow: hidden` on a single axis promotes the other to `auto` in
every browser — a scrollbar the document never asked for. One flag that cuts at the box is the
intent every clipping composition actually has.

**Capture: `ClipAncestor { id, x, y, width, height }` on `RawGeometry`** (so both `RawRun` and
`RawField` carry it), read by a new `clipOf` walk in the page script: the nearest ancestor-or-self
whose computed `overflow-x`/`overflow-y` is not `visible`, as its document-coordinate box. The
**id** is the load-bearing part and is why this is more than a rectangle: it is a document-wide
sequence assigned on first sight, so two runs cut off by the same ancestor say so — which is how
the fold knows they belong inside one container rather than two coincidentally-similar ones. It is
optional, so a pre-REQ-332 bundle parses and folds exactly as before. It is persisted into the
bundle (`sections.ts`) and declared as a `carried` axis in `value-axes.ts`, so both sides of the
diff read it through the one declaration site.

**Fold: `nestClipRegions`** groups leaves by clip id and wraps each group in a
`container { layout: 'stack', clip: true }` whose geometry is the clip box per width, children
rebased into it. It runs before `nestBackingSurfaces`, because a clip region is content like any
other and a band that holds it should own the region rather than its individual slides.

**Only where the clip actually cuts.** A group whose every member sits wholly inside its clip box at
every captured width is not clipped in any observable sense, and no node is built for it. That is
not an optimisation: a page-builder site declares `overflow: hidden` on dozens of wrappers that
never clip anything, and building a container for each would restructure documents with no clipping
defect, for no pixel. The reconstruction earns its place exactly where the reference's own geometry
says content is being cut off.

**Probes: the clip is applied once, before any probe reads a leaf.** After layout,
`evaluateLayout` intersects every leaf box with each clipping ancestor's box, and drops a leaf the
clip removes entirely. Every envelope probe asks a question about where a leaf is *painted*;
answering that separately in the horizontal-clip check, the overlap scan and the containment probe
would be three answers to one question, and the three would drift. Answering it once means all
three read the painted extent by construction — which is what closes this round's 10 `clip`
findings and all 56 `escape` findings together.

## Issue 3 — the font table keeps its descriptors

The chain the ticket specified, end to end:

- **`RawFontFace`** gains `style` (`oblique` normalised to `italic`) and `weightMax` (the upper
  bound of a variable face's `font-weight: 200 800`). Both the in-page CSSOM path and BUG-12's
  byte-parsed cross-origin path read them, so a cross-origin italic is not a second-class face.
- **`ThemeFont.files: string[]` is replaced by `faces: ThemeFontFace[]`**, one record per captured
  `@font-face` carrying `{ src, weight?, style? }`. The flattening to a bare path list was the step
  that destroyed the pairing, so it is gone rather than supplemented. `ThemeFont.weights` stays and
  is now explicitly the weights the page's **runs** paint — a fact about the copy, not about the
  files; the two were parallel arrays that agreed by coincidence.
- **`fontResourcesFromTheme` maps one captured face to one `L1FontFace`**, descriptors and all. The
  cross product of files × painted weights is gone, and `f.weights` takes no part in it.
- **`l1FontFaceSchema.weight` accepts a `[min, max]` pair**, as the ticket asked be decided
  explicitly rather than pinned by accident. A variable face is one file answering every weight
  between two bounds; pinned to a single number the browser synthesises the rest, which is a
  different set of glyphs from the ones the reference painted. The renderer emits the two-value
  `font-weight: 200 800` descriptor CSS defines for exactly this.
- **The envelope validator range-checks both ends and requires the pair to ascend.** An unordered
  pair is not a narrower range, it is a rule no browser applies: `font-weight: 800 200` is invalid
  and the whole descriptor is dropped, silently taking the face's weight coverage with it.
- **The editor's weight control** (`edit.ts` `weightChoices`) offers a variable face's range at the
  hundreds CSS names, rather than as two endpoints (which would hide the 400 and 700 a 200–800 face
  serves) or as 601 options (a slider pretending to be a menu).

Two existing UATs were updated to the new theme shape — `bug12-cross-origin-face-bytes-populate-theme-files`
and `req88_a_face_file_table_joins_a_run_stack_on_its_primary_token` — asserting the same substance
through `faces[].src`.

## Issue 4 — the filter chain keeps its order

Of the two forms the ticket offered, **the object keeps its eight named scalars and gains an
explicit `order: L1FilterFunction[]`**, rather than becoming an array of tagged `{fn, value}` pairs.

The array form is the truer transcription of CSS, and it was rejected for two concrete reasons.
First, the editor's percentage controls (`edit.ts` `FILTER_CONTROLS`) are a projection over exactly
those eight named axes; a list of pairs moves every one of them behind a search, for no gain in what
an operator can express. Second, a list of pairs newly admits the same function twice — a filter no
capture produces and no control can express, so it is a widening of the envelope with no
corresponding intent. Order is a **separate fact about the same eight values**, so it is a separate
field, and the values stay where every reader already looks for them.

- **Absent means "the document has not chosen"**, and the renderer's own fixed order applies — so no
  document written before this axis existed renders differently.
- **A partial order can never silently drop paint**: functions named in `order` emit first, then any
  function carrying a value that `order` omits, in the renderer's fixed order.
- **The fold writes `order` only when it differs from canonical**, so an already-canonical chain
  folds byte-identically to what it did before.
- **The comparator now compares the chain, not its presence.** The ticket noted this as an
  `instrument-no-axis` shadow "worth one line": `treatments.ts` gains `filterChain`, the painting
  form of a filter string (identities dropped, percentages folded to ratios, source order kept), and
  `compareTreatment` reports a delta when two painting chains differ. Without it a reordered chain
  scored `present` on both sides and this residual would have survived every future round.

## Not done here, and why

The three instrument defects named under "What is NOT in this ticket" are untouched; they are the
accompanying `bug`'s. In particular the full-bleed band test still measures against
`document.documentElement.scrollWidth` — this ticket's clip axis removes the horizontal overflow
that blinded it on *this* site, but the ruler is still one horizontal overflow away from going blind
on the next.