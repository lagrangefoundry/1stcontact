---
uid: request-f30f4176
id: REQ-370
type: request
title: 'fold: a band''s hero <img> is painted over the band''s own scrim (and five
  further Zyro residuals)'
created_by: repro-console:repro-www-hearingzone510-com#1
created_at: '2026-10-03T19:22:40.995134+00:00'
updated_at: '2026-10-03T19:22:40.995134+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - fold-wrong
  - capture-loses-it
  - l1-cannot-express
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-5711e554
---

# fold: a band's hero `<img>` is painted over the band's own scrim — and five further residuals on a Zyro page

Round: `repro-console:repro-www-hearingzone510-com#1` · bundle
`/Users/martin/lagrangefoundry/1stcontact/storage/references/www.hearingzone510.com/index`
(captured 2026-10-03T18:26:44.170Z, capture schema 14; nothing has landed since). Sandbox site
`repro-www-hearingzone510-com`, page `home`. **All evidence is from this one bundle.**

Gate: `structural-failure`, mean 20.98/255, 20.89% over threshold, 12 regions, ranked score
**539996.59**, 64 deltas, unmeasured 2. The structural verdict is almost entirely instrument
(filed separately, see "Not in this ticket"). The pixels are not: **two regions are 95.81% of the
ranked score and carry zero value deltas between them.**

| # | residual class | defect_class | share |
|---|---|---|---|
| 1 | `fold-paints-a-band-image-over-its-own-scrim` | `fold-wrong` | region 1, 50.91% of score |
| 2 | `capture-drops-an-inline-svg-panel-fill` | `capture-loses-it` | region 2, 44.90% of score, 0 deltas |
| 3 | `l1-has-no-preserved-whitespace-axis` | `l1-cannot-express` (+ `capture-loses-it`) | 25 of 26 `renderedTextBox` deltas, ~15 position deltas, regions 3/4/5/6/8 (3.29%) |
| 4 | `fold-places-a-self-surface-run-at-the-border-box-top-uncentred` | `fold-wrong` | 3 CRITICAL position deltas, region 7 |
| 5 | `capture-drops-tel-and-mailto-hrefs` | `capture-loses-it` | 3 HIGH `a11yRole` deltas |
| 6 | `capture-never-reveals-zyro-scroll-reveal-images` | `capture-loses-it` | 3 photographs missing from BOTH sides, 0 pixels, 0 deltas |

Issues 1, 3(fold half) and 4 are fold/L1 changes `1c refold` will pick up. **Issues 2, 3(capture
half), 5 and 6 are capture-side and need a re-capture of this bundle after they land.** No
dependency between 1 and 2; do 1 first (biggest, cheapest). 3 needs its L1 axis before its
capture/fold halves mean anything. 4 is independent. 5 and 6 are independent capture changes.

---

## Issue 1 — the hero photograph is emitted after the band whose scrim should cover it

**Class 1, engine shortfall → `fold-wrong`.** Test: does L1 carry it, is it right, does the render
match? L1 carries both layers with the right values (scrim `#1d1e20` at `opacity: 0.45`, photo with
the right src/box) but in the wrong **order**: the capture recorded the order (scrim `zIndex: 2`,
photo `zIndex: 0`) and the fold inverted it. *Defended:* the capture has it (expected-manifest
element 12 `z 2 op 0.45 fill #1d1e20`, element 11 photo `z 0`), L1 can express it (child order /
`paintOrder`), and the fold's output puts the photo last — so it is the fold.

### What the reference does
`raw.html` (hero `<section id="home">`):
```
<div class="block-background" style="...--v3f9ca25a:0.45;">
  <img ... class="block-background__image">     (hero-image-3-UgnNfNZfCdgEZ8ox.png)
  <div class="block-background__overlay"></div>
</div>
```
mirrored stylesheet `assets/_..Bf-H_B6P.css`:
```
.block-background{z-index:13;...;position:absolute;inset:0;overflow:hidden}
.block-background__image{z-index:0;object-fit:cover;...;position:absolute}
.block-background__overlay{z-index:2;...;opacity:var(--v3f9ca25a);background-color:#1d1e20;position:absolute}
```
So: photo, then a 45% `#1d1e20` veil **over** it.

### What the fold writes (`1c page get repro-www-hearingzone510-com home --sandbox --json`)
Root children in order: `backdrop-1, backdrop-2, backdrop-4, backdrop-6, card-0, section-band-0,
image-1, section-band-1, …`. `section-band-0` (`surfaceFill #1d1e20`, opaque) holds `backdrop-0`
(`surfaceFill #1d1e20`, `opacity 0.45`) as its first child. `image-1` (the hero photo,
`stacked: true`, no `paintOrder`) is the **next root sibling**. Served CSS: `.l1-7`
(section-band-0) and `.l1-8` (backdrop-0) are `position:absolute` with no `z-index`; `.l1-21`
(image-1) is `position:absolute` with no `z-index` and later in the DOM — so the photo paints over
the band's fill **and over its scrim**. The hero copy survives only because the runs carry
`z-index: 1`/`3`.

### The pixels — arithmetic, not impression
Region 1: `bbox {x:0,y:0,w:1280,h:1200}`, score 274912.84, meanDiff 59.01. `nodes.ref[0]` and
`nodes.actual[0]` are the same photo (`black and white bed linen`, box 0,40,1280×1168.56) —
same element, same box, different colour: a recolour. Readout meanRgb ref `[91.93,74.52,57.4]`,
ours `[133.76,106.16,79.47]`.

Measured from `screenshot.full.png` vs `actual.png` over two text-free patches, against the
prediction "ours composited under 45% #1d1e20" = `0.55·ours + 0.45·(29,30,32)`:

| patch | ref | ours | prediction |
|---|---|---|---|
| (600,200)-(1200,700) | (80.98, 66.86, 52.04) | (124.34, 96.86, 69.96) | (81.44, 66.77, 52.88) |
| (100,300)-(500,700) | (91.42, 75.94, 61.74) | (143.29, 113.37, 87.57) | (91.86, 75.85, 62.56) |

Within 1/255 on every channel: the reproduction is exactly the reference with the veil removed.

Value deltas touching it (`values-diff.json`): `zIndex` on "(generic)" expected `z:2`, actual
`z:0` (HIGH, 3050.67) — the scrim; `opacity` on "(generic)" expected `0.45` actual `1` (LOW,
1040.35). Neither says "the photo is above the veil"; the comparator has no relative-order axis.

### Hypothesis
`tools/generate/src/l1/fold.ts`: the box-leaf branch (~4040-4070) routes a full-bleed fill to
`backdropNodes` (`isBackdrop`, fold.ts:1576) — the background layer, painted first, deliberately
with no `paintOrder` ("A BACKDROP'S LAYER IS THE FOLD'S DECISION"). The `<img>` takes the image-leaf
branch (~3935-3990), is pushed to `children` as content, and `foldPaintOrder` returns `undefined`
for its `zIndex: 0`. Nothing compares the two: a full-bleed **image** that a backdrop scrim was
captured *above* is placed above the scrim. The comment at fold.ts:4040 already names the hazard
for background-image boxes ("would lay the hero image OVER the hero's own headline"); an `<img>`
backdrop is not routed through the same layer.

### Proposed change
When an image leaf is a band ground (full-bleed, contains the band's runs) and a captured backdrop
fill with a higher captured `zIndex` covers the same box, emit the image **before** that backdrop in
the same layer (or inside the band ahead of `backdrop-N`), keeping `section-band-N`'s opaque fill
beneath both. Ordering, not a level: do not give the scrim a `paintOrder` that lifts it over the
runs (they are `z 1`/`z 3` in the reference, inside `.block-layout`, above `.block-background`'s
z13 context as a whole).

### How to see it / how to know it is fixed
```
bin/1c page get repro-www-hearingzone510-com home --sandbox --json \
 | python3 -c "import json,sys;d=json.load(sys.stdin)
for k in ['data','page','l1']: d=d.get(k,d)
print([c.get('id') for c in d['root']['children']][:8])"
```
- **wrong now:** `[..., 'section-band-0', 'image-1', 'section-band-1', ...]` with `backdrop-0`
  inside `section-band-0` — photo after its veil.
- **right:** the hero photo precedes `backdrop-0` in paint order. After refold + gate
  (`CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-www-hearingzone510-com --ref
  storage/references/www.hearingzone510.com/index --sandbox`), region 1's meanRgb ours ≈ ref
  (≈ [92,75,57]) and region 1 drops out of the top of `regions.json` (it is 50.91% of the score now).

---

## Issue 2 — the testimonial cards' blue panels are inline SVG fills, and the capture records nothing for them

**Class 1 → `capture-loses-it`.** Test 1 (can L1 express it?): yes — a solid rectangle is an
`L1Box` with `surfaceFill`; this page's own fold already emits `backdrop-2` with
`surfaceFill: "#224e7a"`. Test 2 (is the value in the capture?): no — I walked `capture.json` for
any record 606px wide: **none**; `"svg"` occurs 0 times in it; `multistate.json` has no
`"width": 606` anywhere. *Defended:* the page has it, the capture does not, so nothing downstream can
recover it — the fold and renderer are innocent.

### What the reference does
`raw.html`, Customer Reviews section, twice (`id="zp5fL9"` and `id="zBvYR8"`):
```
<div class="grid-shape layout-element__component layout-element__component--GridShape"
     style="--shape-height:296px;...;--shape-color:rgb(34, 78, 122);..." id="zp5fL9">
  <svg preserveAspectRatio="none" viewBox="0 0 80 80" fill="none" stroke="none">
    <path d="M0 0H80V80H0V0Z"></path></svg></div>
```
`assets/_..Bf-H_B6P.css`: `.grid-shape{width:100%;height:var(--shape-height,100%);color:var(--shape-color);display:flex;position:relative;overflow:hidden}`
and `.grid-shape svg{width:100%;height:100%;fill:var(--shape-color)}`. The div has **no
background**; the paint is the path's `fill`. Builder JSON for zp5fL9: `desktop {top:171,
left:618, width:606, height:296}` in a section at y 3708 → 3879..4175.

### Evidence
Region 2: `bbox {x:16,y:3872,w:1248,h:304}`, score 242448.61, meanDiff 163.71. Both `nodes`
sides list the same section and the same four runs (the two reviews and two ★★★★★ rows) with
identical boxes — same words, same place, different ground. Readout meanRgb ref
`[52.61,92.05,131.6]`, ours `[216.22,215.78,215.47]`. Sampled pixels: ref `(34,78,122)` = `#224e7a`
at (700..1200, 3890..3900), (30..560, 3885..3895), ≈(37.65,80.75,123.86) at (620..1220,4150..4170);
ours `(214,214,214)` = `#d6d6d6` at all three. The review copy is `color: rgb(255,255,255)`
(raw.html), so on the reproduction it is **white text on #d6d6d6** — effectively unreadable. That is
a content loss, not a tint.

**Zero deltas, and why:** every run in the band carries `surfaceFill: "#d6d6d6"` on **both** sides
(expected-manifest elements 48–56, actual 51–59) because the capture's surface walk reads background
colours, and the SVG fill is not one. The instrument agrees with itself about a ground the page never
shows. Worth stating in the implementer's tests: fixing this capture **will add surfaceFill deltas**
until the fold emits the panels, because it makes the runs' real ground measurable.

`tools/generate/src/cli/capture/coverage.ts:498-511` already registers `fill`/`stroke` as
`not-expressible` ("the capture models no vector leaf: `<svg>` is not in the field selector and L1
has no vector kind"). That is right for an icon. It is wrong for this case: a single-path rectangle
covering its own viewBox with a solid fill **is** a box, and L1 can express it today.

### Proposed change
In the extractor's surface pass (`extract.ts`, the `paintedSurfaces` / `backdropBoxes` sweep ~915-960),
treat an `<svg>` whose rendered geometry is a single axis-aligned rect covering its viewBox
(`preserveAspectRatio="none"`, path `M0 0H{w}V{h}H0V0Z` or a `<rect>` at 0,0,100%,100%) with a solid
computed `fill` as a painted surface: record its box and `fill` as `surfaceFill`, with its
`zIndex`. Anything else stays a residual, as coverage.ts says. Then re-capture.

### How to see it / how to know it is fixed
```
python3 -c "import json;c=json.load(open('storage/references/www.hearingzone510.com/index/capture.json'))
def w(o):
  if isinstance(o,dict):
    b=o.get('box')
    if isinstance(b,dict) and abs(b.get('width',0)-606)<3: print(o.get('surfaceFill'),b)
    [w(v) for v in o.values()]
  elif isinstance(o,list): [w(v) for v in o]
w(c)"
```
- **wrong now:** prints nothing.
- **right (after re-capture):** two records with `surfaceFill #224e7a` at ≈(618,3879,606,296) and
  its left-hand twin; after refold + gate, region 2 (44.90% of the score) disappears.

---

## Issue 3 — `white-space: break-spaces` keeps spaces that take width; the capture trims them and L1 cannot say "keep them"

**Class 2 → `l1-cannot-express`** (leading), with a `capture-loses-it` half. Test 1 (can L1 express
it?): the only white-space control on a text run is `nowrapFromPx`
(`packages/site-schema/src/l1/schema.ts:2040`); the renderer's only `white-space` emission is
`nowrap` (`packages/framework/src/l1/render.ts:4556`). There is no way to author a run whose
trailing / wrap-point spaces occupy width. *Defended for `l1-cannot-express`:* no axis. *Defended for
`capture-loses-it`:* the captured texts end without the space (`"Where To Find Us"` in both
manifests, raw has `Where To Find Us </h3>`), and `coverage.ts:403-415` files `white-space` as
`declined` on the grounds that wrapping is measured — but a preserved space changes the run's
**width and centring**, which `nowrapFromPx` cannot carry.

### What the reference does
`assets/_..Bf-H_B6P.css`: `.text-box{...;white-space:var(--white-space-preview,var(--v2b806092));...}`,
and every Zyro text box sets `--v2b806092:break-spaces`. Under `break-spaces` a trailing space, and the
space at a soft wrap, is not hung: it takes width.

### Evidence
Of the 26 `renderedTextBox` deltas (all HIGH), 25 are the reference wider by exactly one space of
that font (the 26th is the `F` asymmetry, in the instrument bug). I read the character after each run
in raw.html:

| run | expected → actual width | after the run in raw.html |
|---|---|---|
| Our Hearing Care Services (Prata 56) | 737 → 724 (−13) | `" </h2>"` |
| Hear what matters. (48) | 451 → 439 (−12) | `" </h3>"` |
| Where To Find Us (48) | 429 → 417 (−12) | `" </h3>"` |
| Customized Solutions for Every Lifestyle | 470 → 464 (−6) | `" </h6>"` |
| Dr. A Harleman (Montserrat 16) | 127 → 123 (−4) | `" </span>"` |
| ALBANY / ALAMEDA / 3346 Lakeshore Ave / 1660 Solano Ave / 2314 Central Ave / Friday 10 am to 4 pm | −4/−5 each | trailing `" "` |
| Monday & Wednesday / Tuesday & Thursday | −4 (and −8 for one) | `" <br>"` |
| 7 multi-line paragraphs (Reconnect…, Hearing stimulates…, Adjustments…, …) | −4/−5 each | no trailing space — the space at a soft wrap point |

And the centred runs move by half that: `position` "Our Hearing Care Services" x 271 → 278
(13/2), "Where To Find Us" 426 → 431, "Comprehensive Hearing Testing" 111 → 114, "Learn to train…"
464 → 466, "1660 Solano Ave" 1009 → 1011, and the other 2px x-shifts in the CRITICAL list. Regions 3,
4, 5, 6 and 8 are these headings (8841.68 + 3522.3 + 2314.75 + 1821.12 + 1252.75 = 3.29% of the score).

### Proposed change, in order
1. L1: a text-run axis for preserved white space (e.g. `whiteSpace: 'break-spaces' | 'pre-wrap'`), in
   the strict axes beside `nowrapFromPx`, and the renderer emitting it. (Type + envelope change.)
2. Capture: stop trimming run text where the computed `white-space` preserves spaces; record the
   computed `white-space` value; move `white-space` out of coverage.ts's `declined` rows for the
   preserving values.
3. Fold: carry it onto the run.
Expect these deltas to **close**, not grow; but the change makes text width comparable where today a
correct reproduction cannot reach it.

### How to see it / how to know it is fixed
```
python3 -c "import json;v=json.load(open('storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-1/diff/values-diff.json'))
print(sum(1 for d in v['deltas'] if d['property']=='renderedTextBox'))"
```
- **wrong now:** `26`.  **right (after re-capture + refold + gate):** `1` (only the `F` asymmetry,
  which is an instrument item).

---

## Issue 4 — a run that IS its own surface (a button) is placed at the surface's border-box top and not centred

**Class 1 → `fold-wrong`.** Test 1: L1 can express it — a container has `distribution`
(`l1DistributionSchema`, schema.ts:399-400, `center` ⇒ `justify-content:center`, the vertical axis of a
`stack`) and `padding`. Test 2: the value in L1 is wrong — the run sits at `y: -3` / `y: -6`
(the border-box origin) with no height and no centring. *Defended:* the capture has the centred
glyphs (below), the axis exists, and the fold did not write it.

### Evidence (expected-manifest vs actual-manifest, 1280)
| run | surface (both sides) | expected `renderedTextBox.y` | actual | Δ |
|---|---|---|---|---|
| SCHEDULE AN APPOINTMENT (`<a>`, border 3, h 52) | 471.9,1076.6,336×52 | 1091.5 | 1077.6 | 13.9 = 3 border + (46−24.3)/2 |
| EXPLORE MORE SERVICES (h 50, no border) | 498.1,3602.0,283×50 | 3617.2 | 3602.9 | 14.3 = (50−21.6)/2 |
| 510-865-8113 (border 6, padding 10/34) | 1046.2,61.8,189.8×56.3 | 78.8 | 72.8 | 6.0 = 6 border |

These are the CRITICAL `position` deltas "SCHEDULE AN APPOINTMENT" (500,1091)→(500,1078),
"EXPLORE MORE SERVICES" (532,3617)→(532,3603), "510-865-8113" (1086,79)→(1086,73); region 7
(`bbox 528,3600,224×32`, score 1356.33, `nodes.ref` covers 94% of region, `nodes.actual` only 67% —
the glyphs moved up out of it). L1 (`1c page get … --json`): `card-1` keyframe 1280
`{y:1036.61,height:52}`, run `{x:-3,y:-3}` with no height; `card-6` run `{x:-6,y:-6}` with
`padding {topPx:10,…}`; `card-2` run `{x:0,y:0}`. In the reference each `<a>` is a flex box centring
one line (`--align:center;--justify:center`).

Adjacent to REQ-324 (flow lead measured from the wrong box), which landed for panels with a
`borderLeft`; this is the self-surface case on the vertical axis, and the sign is the opposite
(the run lands **on** the border, not past it).

### Proposed change
Where a run's captured surface is `self: true` (the run's element is the surface), write the card as
`layout: stack, distribution: center` and inset the run by the surface's border (not just its
padding), instead of pinning the line box at the border-box origin.

### How to see it / how to know it is fixed
```
python3 -c "import json
for f in ['expected','actual']:
  m=json.load(open(f'storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-1/diff/{f}-manifest.json'))
  print(f,[(e['text'],round(e['renderedTextBox']['y'],1)) for e in m['elements'] if e.get('text') in ('SCHEDULE AN APPOINTMENT','EXPLORE MORE SERVICES','510-865-8113')])"
```
- **wrong now:** expected 1091.5 / 3617.2 / 78.8, actual 1077.6 / 3602.9 / 72.8.
- **right (refold + gate):** equal within 1px.

---

## Issue 5 — the capture still throws away `tel:` / `mailto:` hrefs after REQ-359 taught L1 to accept them

**Class 1 → `capture-loses-it`.** Test 2: `"tel:"` and `"mailto:"` each occur **0** times in
`capture.json`; the three link runs record `{'role':'link','a11yRole':'link','href':None}`.
REQ-359's commit `22b2c55` ("links accept tel: and mailto: hrefs", in HEAD) changed `validateL1`, the
renderer and `foldLink` — not the extractor. *Defended:* L1 can express it now, the capture never
carries the value, so the fold has nothing to write.

`tools/generate/src/cli/capture/extract.ts:1942-1954` (`hrefOf`): `if (u.protocol !== 'http:' &&
u.protocol !== 'https:') return null;` under a comment that is now false ("mailto:/tel:/javascript:
are all refused by the L1 URL allowlist").

Reference: `<a href="tel:5108658113" … class="grid-button …">SCHEDULE AN APPOINTMENT</a>`, the
header button `tel:510-865-8113`, and `info@hearingzone510.com`. Deltas: three HIGH `a11yRole`
expected `link` actual `generic` (3100 each). Served HTML: `<div class="l1-14" id="card-6"><p
class="l1-15">510-865-8113</p></div>` — a phone number that cannot be tapped.

**Proposed change:** in `hrefOf`, accept `tel:`/`mailto:` with the same body rule as REQ-359's
`isSafeHref`, keep refusing everything else; re-capture.
**See / fixed:** `grep -c 'tel:' storage/references/www.hearingzone510.com/index/capture.json` →
**now `0`**; after re-capture ≥ 2, and the three `a11yRole` deltas close.

---

## Issue 6 — Zyro scroll-reveal images are never revealed, so three location photographs are missing from the oracle itself

**Class 1 → `capture-loses-it`.** Test: does the oracle carry it? No — and the reference **screenshot**
does not paint it either, so neither side shows it, the pixel diff is zero, and there are zero deltas.
Only `coverage.unreferencedImages` notices (6 of 21 mirrored, i.e. these three × 2 variants).
*Defended:* the page has the photos, the capture's settled state hides them, nothing downstream can
recover them.

`raw.html`, section `zR34sX` ("Where To Find Us"): three `<a>`-wrapped
`<img loading="lazy" class="image__image">` — `oakland-office-1-…png` (328×438),
`hearing-zone-alameda-…png`, `img_1958-…jpg` (331×436) — each under
`<div class="layout-element … transition transition--slide transition--root-hidden">` with
`data-animation-role="image"`. CSS: `.transition.transition--slide.transition--root-hidden
[data-animation-role=image]{opacity:0;…;transform:translateY(20%)}`, cleared only by
`[data-animation-state=active].loaded`. `screenshot.full.png` is exactly `(34,78,122)` at every one
of 77 samples over x∈{100..1150}, y 4380..4980 — no photograph anywhere in the band.

`tools/generate/src/cli/capture/page-scripts.ts:77-83`: `SETTLE_CSS` neutralises transitions and
Elementor's `.elementor-invisible` only. Zyro's root-hidden state is not neutralised, and
`SETTLE_SCROLL`'s 120ms-per-step scroll did not leave these in the active+loaded state.

**Proposed change:** generalise the settle: after `SETTLE_SCROLL`/`IMAGES_DECODED`, find media with
a decoded `currentSrc`, a non-zero box and computed `opacity: 0` on itself or an ancestor whose opacity
rule is a reveal pre-state, and force the revealed state (for Zyro specifically,
`.transition--root-hidden [data-animation-role]{opacity:1!important;transform:none!important}`); and
report any such element as a capture finding rather than silently omitting it. Re-capture.
**See / fixed:** the console digest's "multistate.json names it at: **nowhere**" for
`oakland-office-1-8RJjneyWoQhR5y3E.png`, `hearing-zone-alameda-…`, `img_1958-…` → **now**; after
re-capture, each is named at `projections[].manifest.elements[].src` and `coverage.unreferencedImages`
is empty (or holds only the `-1` srcset duplicates).

---

## Seen and not separated (cannot-tell, so stated rather than dropped)
- 8 CRITICAL `position` deltas of +2px in y in the Where To Find Us band ("Oakland, CA 94610"
  4898→4900, "Hours" 4922→4924, "9 am - 5 pm" ×2 4970→4972, "Friday" 4946→4948, "10 am - 4 pm",
  "Monday & Wednesday" 4946→4948, "Tuesday & Thursday") and 2 CRITICAL `arrangement` deltas ("Hours",
  "Monday & Wednesday": expected `beside (right-of prev)`, actual `below prev`). These runs end in
  `" <br>"` under break-spaces, so issue 3 may own them; I could not show it. To tell: re-gate after
  issue 3 and see whether they survive.

## Not in this ticket
- The structural-failure verdict: all 42 on-sample `overlap` findings (21 distinct pairs) and the
  `buried` findings are pairs the reference's own boxes make identically, and `sampleFidelity`'s 42
  residuals are an off-by-one pairing — filed as an instrument bug this round.
- The 74 `escape` findings (content-robustness): REQ-324's single-run-surface class; its recovery
  promoted the surfaces but `chooseRecovery` declined to serve it — appended to REQ-324 as a comment.
- values-diff false deltas (6 `zIndex` z:13, 3 `mask`, the `F` box) — filed as a second instrument bug.