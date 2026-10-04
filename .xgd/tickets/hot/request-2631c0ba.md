---
uid: request-2631c0ba
id: REQ-334
type: request
title: 'capture: a variable font face collapses to its lowest declared weight, and
  a whole-page wrapper is captured as one band'
created_by: repro-console:repro-joyfulculinarycreations-com#2
created_at: '2026-09-27T00:01:14.275133+00:00'
updated_at: '2026-10-04T04:54:48.054665+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - capture-loses-it
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-0b5dcaae
  commits:
  - working_sha: 757a4c168654620f8eee4c59ace4af1262ad7f06
    reconcile_sha: null
    main_sha: null
  - working_sha: 5335f3a39b1a68ca9230fe62b309f00825310f9d
    reconcile_sha: null
    main_sha: null
  version: 0.2.388
  story_points: 3
---

# capture: a variable font face collapses to its lowest declared weight, and a whole-page wrapper is captured as one band

Filed by the reproduction console, iteration 2 of
`repro-joyfulculinarycreations-com`, measured against
`/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
(captured `2026-09-26T22:09:36.409Z`, `captureSchema: 7` — current; nothing has
landed in the engine since, so nothing here is a landed fix waiting on a
re-capture).

Gate: `verdict: structural-failure` · mean 27.53/255 · 25.58% of pixels over
threshold · 12 regions · **unmeasured 12** · 65 value deltas.

Two issues, in dependency order. **Both are capture-side, so both need the
operator to press re-capture after they land** — `1c refold` cannot pick either
up, because the axis each is about is not in an oracle the current extractor
wrote.

Evidence from one bundle only (`joyfulculinarycreations.com`) unless a line says
otherwise. Issue 1's control is internal to that bundle and is strong; issue 2's
shape (an Elementor/WordPress page: `<header>` + one full-page `<div>` +
`<footer>` as the body's children) is the commonest shape on the web and will
recur.

Three further residuals measured this round were **appended to the tickets that
already own their class**, not re-filed — see §3.

---

## Issue 1 — the capture collapses a variable font face to one weight, so 59 of the 65 value deltas are one wrong `@font-face`

**Class: 1, engine shortfall. `defect_class: capture-loses-it`.**

*Defence of the class, in one line:* L1 can already express it —
`l1FontFaceSchema.weight` is `z.union([finite, z.tuple([finite, finite])])`
(`packages/site-schema/src/l1/schema.ts:2312`, comment added by REQ-332 naming
this very page) — and the renderer already emits the pair
(`packages/framework/src/l1/render.ts:270`, `font-weight: ${min} ${max}`); the
value that reaches them is a scalar `200` written by the capture, so the capture
is the only link that loses it.

**Test I ran, in the order §5 prescribes.**

1. *Can L1 express it?* Yes — the schema above takes `[min, max]`, and
   `ThemeFontFace.weight` is `number | [number, number]`
   (`tools/generate/src/cli/capture/types.ts:214-216`). **Not class 2.**
2. *Is the value in the document, and is it right?* No. `capture.json`
   `theme.fonts[]` records, for Oswald:

   ```json
   { "family": "Oswald, raleway", "role": "heading",
     "weights": [200, 300, 500],
     "faces": [ { "src": "assets/oswald-tk3iwkuhhaijg752gt8g.woff2",
                  "weight": 200, "style": "normal" } ] }
   ```

   The capture already knows the page paints Oswald at 300 and 500
   (`weights`), and records exactly one face, at 200. Raleway: `weights
   [300,400,500]`, one face at **100**. Karla: `weights [300,400,500]`, two
   faces both at **200**. **Class 1.**

**Why the single weight is wrong.** The bundle's own mirrored stylesheet says
the file is a variable face. `assets/oswald.css` declares
`oswald-tk3iwkuhhaijg752gt8g.woff2` in **six** `@font-face` blocks, at
`font-weight` 200, 300, 400, 500, 600 and 700 — the Google-Fonts shape for a
variable family, where one latin-subset file answers the whole range and each
weight gets its own block. Same for Raleway (`raleway-1ptug8zys_skggpnyc0itw.woff2`,
nine blocks, 100–900) and Karla (each of the two mirrored files, seven blocks,
200–800). Lato on the same page is a *static* family — one file per weight — and
the capture gets it exactly right: three faces at 300, 400, 700.

**Where it is lost.** `fontFacesByFamilyOf`
(`tools/generate/src/cli/capture/pipeline.ts:206-232`) deduplicates by `src` and
keeps the first declaration:

```ts
if (merged.some((f) => f.src === src)) continue
```

with the comment *"the same file declared twice is one face — and the FIRST
declaration wins, which is the CSS cascade's own answer."* For a variable
family that is not the cascade's answer: the six blocks are not a redeclaration,
they are six weights of one file, and the first is the lowest. The `[min,max]`
branch immediately below it only fires when a **single** declaration carries two
numbers (`font-weight: 200 700`), which Google's per-weight CSS never emits.

**What the served document then says.** The reproduction's `home.html` carries
exactly one Oswald face:

```
@font-face { font-family: "Oswald"; src: url("assets/oswald-tk3iwkuhhaijg752gt8g.woff2")
             format("woff2"); font-weight: 200; font-style: normal; font-display: swap }
```

so every Oswald run asking for 300 or 500 resolves to the 200 face and paints
lighter and narrower.

**What it costs — 59 of the 65 deltas (90.8%).**

*The control, inside this one bundle.* Pairing every reference run to its
reproduction counterpart and asking only whether the rendered width agrees:

| family | face(s) declared | requested | widths agree | widths differ |
|---|---|---|---|---|
| Oswald | 200 | **200** | **7** | **0** |
| Oswald | 200 | 300 | 0 | 8 |
| Oswald | 200 | 500 | 0 | 2 |
| Karla | 200 | 300 / 400 / 500 | 3 | 36 |
| Raleway | 100 | 300 / 500 | 0 | 3 |
| **Lato** | **300, 400, 700** | 300 / 400 / 600 | **9** | **1** |

Every Oswald run requested at the one weight we declare matches; every Oswald
run requested at any other weight does not. Lato — the one static family, whose
faces the capture gets right — is 9/10 clean and contributes **zero** deltas.

*The 48 `renderedTextBox` deltas.* All 48 are Oswald, Karla or Raleway; none is
Lato. The shortfall scales with how far the requested weight is above the
declared one (mean `actual/expected` width):

- Oswald 500 → **0.9051** (`Dreaming of healthier meals`, expected `text 815×97`,
  actual `text 734×97`; `on your dinner table?`, `631×97` → `574×97`)
- Oswald 300 → 0.9644 (the six footer nav links, e.g. `Meet the Chef`
  `108×32` → `104×32`)
- Karla 500 → 0.9745 · Karla 400 → 0.9766 · Raleway 500 → 0.9710

*The 11 CRITICAL `position` deltas.* Eleven of the fourteen are **exactly half
the width shortfall** — a centred run recentring around a narrower glyph box,
not an independent placement error. Checked one by one (`dx` vs
`(expectedWidth − actualWidth)/2`):

```
+25 vs 25.0   "It's not just about eating your veggies…"   (295,2714) → (320,2714)
+22 vs 21.5   “So fabulous. We are planning to do this…”   (-367,3105) → (-345,3105)
 +9 vs 10.0   Weekly meals are prepared in your home…      (152,3646) → (161,3646)
 +4 vs  4.0   Follow us for our latest updates             (528,4518) → (532,4518)
 +3 vs  3.0   I cannot say enough good things…             (1027,3105) → (1030,3105)
 +3 vs  3.0   WHO USES OUR SERVICES                        (492,1341) → (495,1341)
 +2 vs  2.0   Meet the Chef / Get in Touch / Our Services   … → (413/846/544, 4673)
 +1 vs  1.5   Sample Menus    +1 vs 1.0  Learn More
```

The clearest single record is the footer nav, where the fold pinned the box
correctly and only the glyphs moved: `Meet the Chef`, Oswald 300 22px, reference
box `410.78 × 108.09` and glyph box `410.78 × 108.09`; ours box `410.77 ×
108.09` (identical) and glyph box `412.75 × 104.11` — the run is 3.98px narrower
and sits 1.97px to the right inside an unchanged box.

The remaining 6 deltas are not this issue: 3 are the half-leading class
(REQ-265, §3.2), 3 are REQ-332's issue 2 carousel (1 `overflow` + 2 `surfaceFill`).

**Hypothesis.** `fontFacesByFamilyOf`, `tools/generate/src/cli/capture/pipeline.ts:206-232`.

**Proposed change.** When the same mirrored `src` is declared by more than one
`@font-face` block of the same family and style, do not discard the later
blocks — widen the face to the `[min, max]` of every weight declared for that
file, which is precisely the shape `ThemeFontFace.weight` and
`l1FontFaceSchema.weight` already accept and `render.ts:270` already emits. Keep
the first-wins rule for `style` and for genuinely repeated identical
declarations. Both the CSSOM path (`extract.ts:2564-2596`) and the
byte-parsed path (`pipeline.ts:148-190`) already read the per-block weight
correctly, so nothing upstream of the merge needs to change.

**This will raise the delta count on some bundles and that is fine** — it makes
a face resolvable that currently silently falls back, so runs that were
uniformly wrong start being compared against the right glyphs.

**How to see it.**

```bash
# 1. what the capture recorded for a variable family
python3 -c "import json;print(json.dumps([f for f in json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/capture.json'))['theme']['fonts'] if f['family'].startswith('Oswald')],indent=1))"
```
WRONG (now): `"weights": [200, 300, 500]` beside `"faces": [{"src": "assets/oswald-tk3iwkuhhaijg752gt8g.woff2", "weight": 200, "style": "normal"}]`
RIGHT: `"faces": [{"src": "assets/oswald-tk3iwkuhhaijg752gt8g.woff2", "weight": [200, 700], "style": "normal"}]`

```bash
# 2. the source of truth in the bundle's own mirrored stylesheet
grep -c 'oswald-tk3iwkuhhaijg752gt8g.woff2' /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/assets/oswald.css
```
Prints `6` — six `@font-face` blocks name the one file, at `font-weight` 200…700.

```bash
# 3. what the reproduction serves
grep -o '@font-face { font-family: "Oswald"[^}]*}' /Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-2/site/home.html
```
WRONG (now): `font-weight: 200`.  RIGHT: `font-weight: 200 700`.

```bash
# 4. the whole thing, after a re-capture
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index --sandbox
```
WRONG (now): 65 deltas, of which 48 `renderedTextBox` and 11 `position`.
RIGHT: those 59 gone; `Dreaming of healthier meals` measures `text 815×97` on
both sides.

---

## Issue 2 — the capture emits a whole-page wrapper as one band, so every section axis on this page is unmeasured

**Class: 1, engine shortfall. `defect_class: capture-loses-it`, with
`instrument-blind` for what it does to the section pass.**

*Defence of `capture-loses-it`:* `capture.json` `sections` has **two** entries,
one of them `{x:0, y:0, width:1280, height:4743.9375}` with
`background: {"kind":"none"}`, for a page that paints a photographic hero, three
grey bands, a white band and a `#edc251` footer — the band structure is simply
not in the capture's section list, so nothing downstream can compare it.
*Defence of `instrument-blind`:* with that list on one side and the fold's
recovered bands on the other, `values-diff` reports `unpairedActualSections: 10`
and `nonSurfaceSections: 2` and **zero** section deltas — the section pass on
this page compared nothing at all, and that silence is 10 of the 12 unmeasured.

**Test I ran.** `capture.json` → 2 sections:

```
{x:0, y:50,  w:1280, h:106.28125}  background {"kind":"none"}  fields 1   content 5
{x:0, y:0,   w:1280, h:4743.9375}  background {"kind":"none"}  fields 15  content 61
```

The reference's own multistate projection at 1280×800 has three, and all three
carry `"surfaceFill": null`:

```
§0 {x:0, y:50,       w:1280, h:106.28125}   surfaceFill null
§1 {x:0, y:0,        w:1280, h:4440.625}    surfaceFill null
§2 {x:0, y:4440.625, w:1280, h:303.3125}    surfaceFill null
```

`expected-manifest.json` carries the coalesced pair (§1 = 4743.9375). Meanwhile
`actual-manifest.json` has **10** sections with real paint — `#000000` +
`HERO-AdobeStock_254767116-scaled.jpeg`, `#ffffff`, `#7a7a7a` ×4, `#ffffff` +
`market-vegetables-produce-6329164.jpg`, `#edc251` — so:

- `values-diff.json` `unpairedActualSections`: all 10 · `nonSurfaceSections`: both
  reference bands, each with the reason *"this reference band paints NOTHING …
  no reproduction band could ever be its counterpart"* · `unpairedSections`: 0.
- `gate.json` `coverage.findings` fires `section-density`: *"the capture
  segmented 4843px into 3 section(s) (1614 px/section) — a band this long is
  usually under-segmentation rather than a uniformly-styled page."*
- the 2 remaining unmeasured (`values.unpairedActual`) are the fold's own
  `section-band-0` box `{x:0,y:156,w:1280,h:644}` and `section-band-2` box
  `{x:0,y:3490,w:1280,h:262.9375}`, which pair with nothing because the
  reference side has no band element there either.

**All 12 of the unmeasured 12 trace to this one cause.**

**The information is not missing from the bundle — it is on the wrong record.**
The whole-page section's 15 `fields[]` are exactly the bands, each with its own
box and its own paint:

```
field  1  {0, 0,       1280, 800}      surfaceFill #000000  backgroundImageUrl HERO-AdobeStock…
field  2  {0, 800,     1280, 535.97}   surfaceFill #ffffff
field  3  {0, 1335.97, 1280, 267.5}    surfaceFill #7a7a7a
field  5  {0, 1603.47, 1280, 1064.05}  surfaceFill #7a7a7a
field  9  {0, 2667.52, 1280, 267}      surfaceFill #ffffff  backgroundImageUrl market-vegetables…
field 11  {0, 2949.52, 1280, 525.02}   surfaceFill #ffffff
field 12  {0, 3489.53, 1280, 950.09}   surfaceFill #7a7a7a
field 14  {0, 4440.63, 1280, 302.31}   surfaceFill #edc251
```

The fold already reconstructs its 10 bands from these, and their geometry agrees
to 2dp with the fields. So the *bands* are known; it is the capture's
`sections[]` — the list the comparator reads — that does not have them.

**Hypothesis.** `tools/generate/src/cli/capture/extract.ts:2440-2444`. REQ-269
added a geometric fallback (`bandSlices`) for exactly this shape, but gated it
on the top-level scan degenerating to **one** band:

```js
var geometricBands =
  bandRoots.length === 1 &&
  bandRoots[0].box.height >= docH - 2 &&
  bandRoots[0].box.width  >= layoutW - 2
    ? bandSlices() : [];
```

This page's `<body>` has three qualifying children — `<header
class="elementor-location-header">`, `<div data-elementor-type="wp-page"
class="elementor elementor-4401">` and `<footer
class="elementor-location-footer">` (read out of `raw.html`) — so
`bandRoots.length === 3`, the guard fails, and the 4440px page wrapper goes down
the `else` branch at `:2492` and is emitted whole, with its own
`getComputedStyle().backgroundColor` (none) as the band's fill. One body child
being a whole-page wrapper is the common case, not the degenerate one: it is
what every Elementor / Divi / Gutenberg theme emits.

**Proposed change.** Make the test per-root rather than whole-document: any
single `bandRoot` whose painted extent covers most of the document height and
the full layout width should be replaced by its geometric slices, with the other
roots (the header, the footer) left as they are. `bandSlices()` already returns
`[]` for a root that genuinely is one band, so the change cannot invent
segmentation where there is none. Guard against the header's absolute extent
overlapping the wrapper's slices when re-assembling.

**Dependency.** Issue 1 and issue 2 both change `capture.json` and both need the
same single re-capture, so land them together. Issue 2 also unblocks a fold
residual that is 97.6% of this round's ranked pixel score — see §3.1: with a
per-band `sections[]` in hand, `bandBaseFill` (`fold.ts:2003-2022`) finally has
a measured band fill to prefer over the one inferred from the runs.

**How to see it.**

```bash
python3 -c "
import json;c=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index/capture.json'))
print(len(c['sections']))
[print(s['box'], s['background'], 'fields', len(s['fields'])) for s in c['sections']]"
```
WRONG (now):
```
2
{'x': 0, 'y': 50, 'width': 1280, 'height': 106.28125} {'kind': 'none'} fields 1
{'x': 0, 'y': 0, 'width': 1280, 'height': 4743.9375} {'kind': 'none'} fields 15
```
RIGHT: ~10 sections whose boxes are the field boxes listed above, each carrying
its own `background` (`{"kind":"color", …}` / `{"kind":"image", …}`) rather than
`none`, and no single section spanning the document.

```bash
python3 -c "
import json;v=json.load(open('/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-2/diff/values-diff.json'))
print('unpairedActualSections',len(v['unpairedActualSections']),'nonSurfaceSections',len(v['nonSurfaceSections']),'unpairedSections',len(v['unpairedSections']))"
```
WRONG (now): `unpairedActualSections 10 nonSurfaceSections 2 unpairedSections 0`.
RIGHT: bands pair, so those counts drop to ~0 and the gate's `unmeasured 12`
drops to ~0 — while the delta count **rises**, because 10 bands' `overlay`,
`contentAnchor`, `textAlign` and (once REQ-271 lands its axis) `surfaceFill`
become real measurements for the first time on this page.

```bash
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate repro-joyfulculinarycreations-com \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index --sandbox
```
WRONG (now): `coverage.findings` contains `section-density`, "3 section(s), 1614
px/section". RIGHT: no `section-density` finding.

---

## §3 — measured this round, appended to the ticket that owns the class rather than re-filed

### 3.1 `values-diff-has-no-band-surface-fill-axis` → REQ-271 (frozen, comment)

Both of this round's top two pixel regions — **97.6% of the 580,737.87 ranked
score** — are a `section-band-N.surfaceFill` the capture contradicts, and
`values-diff` reports **zero** `surfaceFill` deltas for either. Region 1
(61.46%, mean 136.48): `section-band-1` folds with `surfaceFill: #28542d` over
`{0, 2950, 1280, 525}` where capture `fields[11]` at the same rectangle measured
`#ffffff` — and the fold's own `backdrop-7` already carries `#ffffff` there, so
the band is a second, later, opaque plate over a correct one. Region 2 (36.13%,
mean 67.28): `section-band-0`, `surfaceFill: #000000`, `{0, 156, 1280, 644}`,
painted over `backdrop-0` (`#000000`) *and* `backdrop-1` (the hero photograph at
`opacity 0.49`), blacking out the lower 644px of the hero. `bandBaseFill`
(`fold.ts:2003-2022`) cannot catch either: it only overrides the runs' inferred
fill when the matched section carries an `overlay` of the same colour, and this
bundle's two degenerate sections (issue 2) carry no overlay at all.

### 3.2 `fold-drops-half-leading-on-inline-boxed-text-runs` → REQ-265 (frozen, comment)

3 of the remaining 6 deltas. Re-measured at −11px on both hero heading lines
(captured box `h 97`, folded `h 75.40625` = `lineHeightPx`; `(97 − 75.4)/2 =
10.8`), and — new — a **full**-line-box instance: `<h2 …><br>What people are
saying </h2>`, captured box `h 92.8125` (= 2 × `lineHeightPx` 46.40625) with the
glyphs on the second line, folded to `h 46.40625` with the glyphs on the first,
which is the CRITICAL `position` delta `(455,3009) → (455,2963)`, −46.40625. The
two together say the fix cannot be a top-only correction: the fold must carry
the captured box height, and `l1KeyframeSchema.height` is already optional and
available (`packages/site-schema/src/l1/schema.ts:44`) — every one of the 73
text nodes in this reproduction omits it. It is also 9 of the 27 gate overlaps:
`0.17.0` over `0.17.1` at all 8 sampled viewports, two adjacent lines of one
heading whose 97px glyph boxes overflow their 75.4px line boxes.

### 3.3 `a section band and a card are pinned siblings of the content they back` → BUG-142 (frozen, comment)

The structural-failure verdict. BUG-142 measured the asymmetry one way round
(*"13 of the 14 panels carry `viewportResponse: {yFactor: 1}`. No text node
carries one, and none structurally can"*). On this reproduction it is
**inverted**: 47 of the 73 text nodes now carry a `viewportResponse`, and six
containers with a fixed keyframe `height` carry **none** — `section-band-0`,
`section-band-1`, `section-band-2` and three unnamed containers, every one of
them holding children that do. Arithmetic closes to the pixel: `section-band-0`
at 320px, `y 88`, `height 265`, bottom 353; child `0.17.2` `y 132.39` with
`viewportResponse {yFactor: 0.5}`, so at viewport height 1536 it sits at
`132.39 + 0.5 × 736 = 500.39` and, two 19.8px lines tall, ends at
`88 + 500.39 + 39.6 = 627.99` — **274.99px** below the band, and the probe
reports "275px below its bottom edge". `section-band-2` the same way gives 688px
against a reported 688. 163 of the 371 escape findings are those three bands,
and 18 of the 27 overlaps are a `yFactor: 1` run landing on the footer nav
container, which has none.

---

## What I did not find

No `1c` defect worth a bug this round: every derived figure in the console's
digest re-read correctly out of the file it names, the region records carry the
geometry and both sides' leads, and the `nonSurfaceSections` reason text
correctly declines to charge the reproduction for a partner the comparison
itself cannot supply.

---

## Implementation — what landed

Both fixes are capture-side, in the two places the ticket names. Nothing
downstream of the capture changed: `l1FontFaceSchema.weight`, `render.ts`'s
`font-weight: ${min} ${max}`, `buildSections` and the comparator are all
untouched and already accepted the shapes the capture now writes.

### Issue 1 — `fontFacesByFamilyOf` (`tools/generate/src/cli/capture/pipeline.ts`)

Repeated `@font-face` declarations of the **same mirrored `src`, by the same
family and the same style**, no longer discard the later blocks. The kept face's
weight widens to the `[min, max]` of every weight declared for that file, so
Oswald's six Google-Fonts blocks (200…700) become one face at `[200, 700]`
instead of one face at 200.

Three consequences of that rule, each pinned by a UAT:

- **First-wins still governs `style`.** A file redeclared under a *different*
  style is a genuine redeclaration and is dropped exactly as before, so an
  italic block can never stretch the normal face's range. An absent
  `font-style` compares equal to `normal`, which is what CSS means by it —
  otherwise a sheet that states the style on some blocks and not others would
  read as two faces of one file.
- **A block declaring no weight contributes no bound.** CSS's default 400 is not
  something the sheet said, and using it would widen a measured range with a
  fabricated edge; such a block is ignored for the range, as it is today.
- **A static family is untouched.** Lato — one file per weight — still yields
  three faces at 300 / 400 / 700. It is the control inside the same bundle and
  the regression test for the whole change.

### Issue 2 — the band gate and `bandSlices` (`tools/generate/src/cli/capture/extract.ts`)

The geometric fallback is now asked **per band root** instead of once per
document. A root qualifies when it spans the full layout width and is
**at least 60% of the document height** (`PAGE_ROOT_HEIGHT_RATIO`) — "most of
the document", stated as a constant. That is the line between a wrapper standing
in for the body and an ordinary full-bleed band: a hero, a testimonial strip or a
footer is full-bleed too, and slicing one of those would report its inner cards
as sections.

`bandSlices()` became `bandSlicesIn(rootEl, rootBox)` and is bounded by that root
in both senses:

- **Only the root's own subtree is a candidate.** This is the header guard the
  ticket asks for, applied at selection rather than at re-assembly: a page
  builder's `<header>` is a *sibling* of the wrapper, absolutely positioned over
  the wrapper's first slice, so without the subtree test it would be admitted as
  a band of the wrapper *and* remain a band in its own right, and the two copies
  would overlap. The root element itself is excluded for the same reason it
  always was implicitly — its own paint is the page the slices sit on, and
  admitting it would give the outermost-wins rule one candidate containing every
  other, collapsing the lot back to a single band.
- **The slices tile the root's box, not the page.** The gap-filling cursor runs
  from the root's top to its bottom and slices are clamped there, and a gap that
  paints no backdrop of its own is attributed to **the root element** rather than
  to `document.body` — on a wrapper it is the wrapper's background showing
  through, which is a different fact from the body's.

The two emit paths (geometric / DOM) are now one loop over the band roots rather
than an either-or over the whole document, so a page can have both: on the
Elementor shape the wrapper is sliced while the `<header>` and `<footer>` stay
exactly the bands the top-level scan found.

Nothing is invented where there is nothing to find. `bandSlicesIn` still returns
`[]` when it cannot find at least two slices, so a page-tall root that genuinely
is one band is emitted whole, and a conventionally segmented page — where no root
is page-tall — is byte-identical to before. Both are UATs.

### Evidence

`tests/test_UAT_FC_REQ-334_variable_face_range_and_page_wrapper_bands.test.ts`,
nine UATs, no mocks of anything we own:

- The face tests drive the real `runCapturePipeline` over an **injected driver** —
  the browser is the one external boundary — so the byte parsing, asset
  mirroring, face merge, `buildTheme`, `fontResourcesFromTheme` and
  `renderL1Document` are all real. One of them asserts on the served document:
  `font-weight: 200 700`, with the whole-range block the *only* Oswald face.
- The band tests drive the real `EXTRACT_SCRIPT` under jsdom and the real
  `buildSections` — the harness BUG-15 and BUG-22 already use — over the
  `<header>` + full-page wrapper + `<footer>` shape, and assert the recovered
  bands' boxes and their own measured paint (`image` / `color`, not `none`).

Six of the nine fail on the pre-change tree; the three that pass either way are
the controls (static family, conventional page, single-band wrapper) and are
there to pin what must *not* change.

### Re-capture is still required

As the ticket says: both fixes change what `capture.json` records, and `1c refold`
cannot pick either up. The stored references need a re-capture before the gate
figures move.


---

# Re-measurement — `repro-console:repro-gigabytealchemy-ai#9`

Iteration **9** of `repro-gigabytealchemy-ai` against
`storage/references/gigabytealchemy.ai/index`, re-captured this round at
`capturedAt: 2026-09-26T23:35:01.861Z` (`captureSchema: 7`).

**This ticket's class on a second bundle, with a before-and-after that prices
it — and confirmation that the fix already committed here is the right one and
is waiting on a re-capture, not on more work.**

## The class, on gigabytealchemy.ai — Cinzel, one file, three declared weights

`assets/css2` in the bundle is the mirrored Google Fonts stylesheet, and it
declares the **one mirrored file** three times, same family, same style:

```css
@font-face { font-family: 'Cinzel'; font-style: normal; font-weight: 400; font-display: swap;
  src: url(https://fonts.gstatic.com/s/cinzel/v26/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2) format('woff2'); … }
@font-face { font-family: 'Cinzel'; font-style: normal; font-weight: 600; …
  src: url(…/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2) format('woff2'); … }
@font-face { font-family: 'Cinzel'; font-style: normal; font-weight: 700; …
  src: url(…/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2) format('woff2'); … }
```

(`assets[].src` for it is
`https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap`
— the family is requested at three weights and answered with one variable file,
exactly the Oswald/Raleway/Karla shape this ticket describes.)

`capture.json` — `theme.fonts[0]`, first-wins:

```json
{ "family": "Cinzel, serif", "role": "body",
  "weights": [ 600 ],
  "faces": [ { "src": "assets/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2", "weight": 400, "style": "normal" } ] }
```

`weights: [600]` is the only weight the page's copy actually paints. The one
kept face says **400**. The two numbers in the same object disagree, and the
face is the one the renderer emits from.

## What it costs, priced against the previous iteration

The reproduction's L1 is byte-identical to iteration 8's apart from one width
(`169.94` → `169.91` on the wordmark at 320px). The served document differs in
exactly one meaningful line:

```
iteration 8:  @font-face { font-family: "Cinzel"; src: url("assets/8vIJ…woff2") format("woff2"); font-weight: 600; font-display: swap }
iteration 9:  @font-face { font-family: "Cinzel"; src: url("assets/8vIJ…woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap }
```

The wordmark run asks for `fontWeight: 600` at `fontFamily: "Cinzel, serif"`, so
at 400 the browser synthesises the weight instead of using the face. The
perceptual cost, `gate.json` to `gate.json`:

| | iteration 8 | iteration 9 |
|---|---|---|
| perceptual mean | **0.22**/255 | **0.62**/255 |
| pixels over threshold | **0.00%** | **0.22%** |
| ranked regions | **0** | **7** |
| `values.deltas` | 4 | 4 (identical — the same four hero `surfaceFill`) |

All 7 regions, **8402.53 of 8402.53 of the ranked score, 100%**, sit inside
`'Gigabyte Alchemy'` — `regions.json` names it on both sides of every one of
them at `ofRegion: 1`. Diffing the two iterations' `actual.png` directly: 13,905
pixels differ by more than 8/255, and their bounding box is
`(91, 94) → (772, 152)` — the wordmark's ink and nothing else on a 1280×4376
page.

The region readout is the signature of a substituted face rather than a moved or
recoloured one. Region 1 (`(272, 96) 496×64`, score 7622.77, mean 71.91):

```
readout.meanRgb   ref [73.24, 56.30, 40.07]   actual [67.78, 52.32, 37.62]
readout.deltaRgb      [-5.46, -3.98, -2.45]
readout.meanAbsDiff  47.39      readout.peakColumnDiff  144.36
```

Mean colour agrees to ~5/255 while individual columns disagree by up to 144 —
same ink, different glyph outlines. And the element box is identical on both
sides (`{x: 88, y: 82.5, w: 685.31, h: 90}`), so nothing moved.

**`values-diff` cannot see it, and that is within tolerance rather than a
defect.** `renderedTextBox` is `685.3125` wide on the reference and `679.40625`
on ours — a real 5.90625px of accumulated advance-width error from the
synthesised weight — but `relW = 5.90625 / 685.3125 = 0.862%`, under
`renderedTextBoxToleranceRatio`'s exact default of `0.012`
(`values-diff.ts:2371, 2537-2539`). So a wrong typeface costs 0 value deltas and
100% of the pixel score. Worth knowing when reading a future `pass` on this
bundle; not an argument for tightening the ratio on this evidence alone.

## The fix here is the right fix, and it needs a re-capture

Reading `fontFacesByFamilyOf` (`tools/generate/src/cli/capture/pipeline.ts:220-266`)
against the css2 above: three declarations, one `src`, one family, one style, so
the first builds `{src, weight: 400}` with `span = {min: 400, max: 400}` and the
second and third take the `kept` branch and widen it to
`{min: 400, max: 700}` → `weight: [400, 700]`. The wordmark's 600 then falls
inside the declared range and resolves to the face instead of a synthesised
bold. **This bundle needs nothing added to this ticket's change.**

What it needs is a **re-capture**. The bundle was captured at **16:35:01 −07:00**
and `757a4c1686` ("widen a variable face's weight range") landed at **17:32:57
−07:00**, 58 minutes later. `1c refold` cannot close that window — it re-derives
the fold from the oracle the bundle already holds and never re-runs the extractor
— and `theme.fonts[].faces[].weight` is written by the capture. So the operator
pressing **recapture** is the only thing that will move this bundle's `400` to
`[400, 700]`.

### How to confirm it once re-captured

```
python3 -c "
import json; c=json.load(open('storage/references/gigabytealchemy.ai/index/capture.json'))
print(c['capturedAt']); print(c['theme']['fonts'][0])"
```

- **wrong, today:** `2026-09-26T23:35:01.861Z` and
  `faces: [{'src': 'assets/8vIJ…woff2', 'weight': 400, 'style': 'normal'}]`
  beside `weights: [600]`.
- **right, after a re-capture on or after `757a4c1686`:** `'weight': [400, 700]`.

Then the render should carry it:

```
node tools/generate/bin/1c.mjs render repro-gigabytealchemy-ai --out /tmp/r
grep -o '@font-face { font-family: "Cinzel"[^}]*}' /tmp/r/home.html
```

- **wrong, today:** `… font-weight: 400; font-style: normal; font-display: swap }`
- **right:** `… font-weight: 400 700; …` — and the 7 wordmark regions and the
  mean go back to iteration 8's `0.22 / 0.00% / 0 regions`.

(`1c` is not on `PATH` in an agent session; `node tools/generate/bin/1c.mjs` from
the repo root is the same binary. Neither command above drives a browser.)

## The round's other two tickets

Filed this round and unrelated to this ticket, named so they are not re-derived: **REQ-337** (`recovery: a content-derived bottom-padding track carries no segments` — 12 of 12 `responsivePadding.bottomPx` tracks interpolate through a snapped reflow window) and **BUG-160** (the probe's measured-height ladder does the same, which is what the `structural-failure` verdict is made of).

## A control inside this bundle

The page's other family is the UA stack
`ui-sans-serif, system-ui, sans-serif, …`, which mirrors no file at all
(`faces: []`) and paints five weights (`300, 400, 500, 600, 700`) from system
faces. `values-diff` matches `fontFamily`, `fontSizePx` and `fontWeight` on all
59 paired runs and reports **0** typography deltas — so on this bundle the entire
typographic residual is the one mis-declared Cinzel face, with no other font
effect to separate it from.


---

## Iteration 3 re-measurement — `repro-console:repro-joyfulculinarycreations-com#3`

**Both issues in this ticket are CONFIRMED FIXED, end to end, including the re-capture they needed.**

The bundle has been re-captured since this ticket was filed:
`/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
now reads `capturedAt 2026-09-27T00:47:21.132Z`, `captureSchema 7` (iteration 2 measured
`2026-09-26T22:09:36.409Z`). Artifacts:
`/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-3/`.

### Issue 1 — the variable font face collapsed to one weight

Fixed. `page.json` `data.page.l1.resources.fonts` now declares **seven** faces with the variable
ranges intact and the italic file declared italic:

```json
[ {"family":"Lato","src":"/assets/lato-s6u9w4bmutphh7usswipgq.woff2","weight":300,"style":"normal"},
  {"family":"Lato","src":"/assets/lato-s6uyw4bmutphjx4wxg.woff2","weight":400,"style":"normal"},
  {"family":"Lato","src":"/assets/lato-s6u9w4bmutphh6uvswipgq.woff2","weight":700,"style":"normal"},
  {"family":"Oswald","src":"/assets/oswald-tk3iwkuhhaijg752gt8g.woff2","weight":[200,700],"style":"normal"},
  {"family":"Raleway","src":"/assets/raleway-1ptug8zys_skggpnyc0itw.woff2","weight":[100,900],"style":"normal"},
  {"family":"Karla","src":"/assets/karla-qkbvxvyc6trat7rqht6e4q.woff2","weight":[200,800],"style":"italic"},
  {"family":"Karla","src":"/assets/karla-qkbbxvyc6trat7rvltw.woff2","weight":[200,800],"style":"normal"} ]
```

Lato — the static family this ticket named as the zero-delta control — is still three separate files
at 300/400/700, so the dedupe-by-file change did not flatten the case it was supposed to leave alone.

The measurement confirms it rather than just the declaration. `values-diff.json` is down from
**65 deltas to 14**, and **none of the 14 is a typography axis** — no `fontWeight`, no `fontFamily`,
no `color`, no `letterSpacing`. The strongest single check is glyph advance: `renderedTextBox`
**widths** now agree to 4dp across all four families, e.g.

| run | family / weight | ref width | ours width |
|---|---|---|---|
| "In-home weekly, bi-weekly or monthly service" | Karla 500 | 134.796875 | 134.796875 |
| "In home service or delivery" | Karla 500 | 152.578125 | 152.578125 |
| "For expecting mothers, and small groups for kids and adults." | Karla 500 | 162.828125 | 162.828125 |
| "What people are saying" | Oswald 200 | 369.921875 | 369.921875 |

The three `renderedTextBox` deltas that remain on those runs are **height** only, and they are a
different defect — the capture recording the run's own `line-height` (18) rather than the containing
block's 24px strut. Filed this round as REQ-338 issue 7, not here.

### Issue 2 — the geometric band slicer gated on `bandRoots.length === 1`

Fixed. The Elementor full-page wrapper is no longer captured as one 4744px band with
`background: 'none'`:

- `capture.json` `sections` is **10** entries with real per-band boxes and backgrounds — e.g.
  `sections[6]` is `{"box":{"x":0,"y":2949.515625,"width":1280,"height":525.015625},"background":{"kind":"color","color":"#ffffff"}}`;
- `multistate.json` carries **11** bands in every one of the 7 projections;
- `gate.json` `values.sectionPairing` has 10 entries, 9 of them paired with `overlap` ≥ 0.8 and one
  reference band unpaired for a reason the instrument itself explains (`§0`, the transparent absolute
  header, "paints NOTHING … no reproduction band could ever be its counterpart").

And the number this issue was measured by moved the right way: **`unmeasured 12 → 4`**, with
`unmeasuredAxes: []` — the 12 axes are gone. The 4 that remain are 1 band (the transparent header
above), 2 populations and 1 probe (`§1.contentAnchor`, declined because the header sits inside the
hero band), none of which is this issue.

### What this round found instead

The round's gap is **REQ-338** — the fold paints each band two or three times (`backdrop-N`,
`section-bg-N`, `section-band-N`) and the least faithful copy is emitted last, so the hero photograph
is buried under an opaque black plate and the testimonial band is flooded with a scrim colour that
belongs to a panel 255px in. That is 75.6% of this page's pixel disagreement and 98.7% of its ranked
region score, at **zero value deltas**. Three instrument defects went to **BUG-161**; iteration 3's
re-measurement of REQ-332's four issues went there as a comment.