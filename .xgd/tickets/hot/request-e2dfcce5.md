---
uid: request-e2dfcce5
id: REQ-270
type: request
title: 'capture/values-diff: the reference bundle predates the extractor measuring
  against it, and the reproduction''s own section paint is read from the wrong box'
created_by: repro-console:repro-gigabytealchemy-ai#2
created_at: '2026-09-18T00:55:41.446590+00:00'
updated_at: '2026-09-18T02:31:53.193776+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cdb69fd6
---


Loop 1, iteration **2** of `repro-gigabytealchemy-ai` against the stored bundle
`storage/references/gigabytealchemy.ai/index`.

`gate.json` verdict: **`pass`** — mean 0.31/255, 0.1% of pixels over threshold,
10 ranked regions, `l1Pass: true`, **1 value delta**, coverage findings `[]`.

**Two facts frame everything below.**

1. **The one delta this round reports is FALSE.** `values-diff.json` says the
   hero section's overlay is `#030717 @ 0.3` in the reference and `none` in the
   reproduction. The reproduction paints it: the emitted CSS carries
   `linear-gradient(#0307174d, #0307174d)` over the hero image (`0x4d/255 =
   0.302`), and the two screenshots agree across the whole 1280x800 hero to
   within 1/255. What is wrong is the *measurement of our own render*, in three
   independent places.
2. **Nothing moved between iteration 1 and iteration 2, and it could not have.**
   The ranked region score is `1051.13` in both iterations, region for region,
   bbox for bbox — while REQ-269's five fixes landed in between (`c3c747fa1d`,
   17:11 −0700; iteration 2 ran at 17:39). They could not take effect, because
   the bundle they read from was captured at 16:01 −0700, **seventy minutes
   before the commit**, and the console reuses a stored capture by design. The
   fold re-ran with the new code (`forms.json` and `l1.json` in the bundle are
   stamped 17:39) and produced the identical impoverished L1, because its input
   cannot express what the fix now reads.

So `pass · mean 0.31 · 1 delta` is: one false delta, and 100% of a frozen pixel
residual whose fixes have already landed and cannot be seen.

## Summary — four residual classes, in the order to work them

| # | residual class | kind | what it costs |
|---|---|---|---|
| 1 | `reference-bundle-predates-its-own-extractor` | **class 1** — engine shortfall | 100% of the 1051.13 ranked region score, frozen; five landed fixes unverifiable |
| 2 | `repro-band-paint-read-from-the-fill-box-not-the-image-layer` | **class 1** — engine shortfall | the reproduction's hero image is absent from its own manifest; a repro that dropped the hero entirely would still diff clean |
| 3 | `repro-scrim-invisible-when-painted-as-a-background-image-gradient` | **class 1** — engine shortfall | the only delta on the board, and it is false |
| 4 | `section-content-anchor-measured-over-two-different-populations` | **class 1** — engine shortfall | a 0.14 phantom anchor gap on identical geometry — 0.01 under the tolerance that would have made it a second false delta |

**Order and dependencies.** Issue 1 is independent of 2–4 and unblocks the most:
until the bundle is re-taken, no pixel residual on this site can move and
REQ-269's five landed fixes cannot be verified at all. Issues 2, 3 and 4 are all
defects in how the *reproduction side* is measured; they share a root (the
geometric band record built by `extract.ts`) but have three separate fixes.
**Issue 3 depends on issue 2** if it is fixed in `flattenSignals` — the gradient
only reaches that function if the band record carries the image layer's paint —
and is independent of it if fixed in `overlayInBox`, which is the recommendation
below. Issue 4 depends on nothing.

Landing 1 and 2 is a good outcome. 3 and 4 will still be visible to a later
round, and 3 will keep reporting itself as a delta until it is fixed.

Everything below is quoted out of a file on disk or is the output of a command
this round ran. Nothing is read off a screenshot.

### Paths used throughout

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2
SLUG=repro-gigabytealchemy-ai
```

---

## Issue 1 — the bundle the gate measures against predates the extractor doing the measuring, so a landed capture fix is silently inert

**Residual class:** `reference-bundle-predates-its-own-extractor`

**Class: 1 — engine shortfall.** The capture is the input to everything; a
capture taken by an older extractor puts values into the fold that the current
code would not put there, and nothing anywhere notices.

### The three questions, and what each returned

1. **Can L1 express it?** Yes — every axis involved exists and REQ-269 landed the
   reads for them. Not class 2.
2. **Is the value in the L1 document, and is it right?** **It is absent**, and it
   is absent for a reason that is not the fold's: its input has no such value. →
   **class 1, stop here.**

### Evidence

**The bundle is older than the commit that fixed what it is missing.**

```
$ python3 -c "import json;print(json.load(open('$REF/capture.json'))['capturedAt'])"
2026-09-17T23:01:30.421Z            # = 2026-09-17 16:01:30 -0700

$ git log -1 --format='%h %ad %s' --date=iso -- tools/generate/src/cli/capture/extract.ts
c3c747fa1d 2026-09-17 17:11:30 -0700 fix(capture/fold): five residuals a passing gate could not see [FREE-CODED]
```

`c3c747fa1d` is REQ-269's implementation commit (it is the first entry in
REQ-269's `commits` field). It landed **70 minutes after** the bundle was taken.

**The bundle carries none of what that commit reads.** From `$REF/capture.json`,
the full key list of `/sections[6]/fields[0]` (the `Your email address` input):

```
a11yRole accessibleName alt arrangement backdropFilter backgroundImageUrl
blendMode borderColor borderRadiusPx borderStyle borderWidthPx box boxShadow
controlType filter formAction intrinsicAspect maskEdge motion nameSource
objectFit objectPosition opacity outline placeholderColor pseudo src surfaceFill
textShadow transformRotateDeg transformScale zIndex
```

— **no `padding*Px` key at all**, and across all 55 content runs: `href` appears
**0** times and `headingLevel` appears **0** times.

**The current extractor records all three, unconditionally.**
`tools/generate/src/cli/capture/extract.ts:1820–1823`:

```js
paddingTopPx: Math.round(parseFloat(s.paddingTop)) || 0,
paddingRightPx: Math.round(parseFloat(s.paddingRight)) || 0,
paddingBottomPx: Math.round(parseFloat(s.paddingBottom)) || 0,
paddingLeftPx: Math.round(parseFloat(s.paddingLeft)) || 0,
```

and `:1647` now keeps line-height to two decimals
(`lineHeightPx: isNaN(lh) ? null : Math.round(lh * 100) / 100`), where the stored
bundle carries the pre-fix whole number.

**The fold re-ran with the new code and produced the same thing.** `$REF/forms.json`
and `$REF/l1.json` are both stamped `Sep 17 17:39` — rewritten during *this*
iteration, after the fix. They still say:

```
form-0-your-name           padding = null
form-0-your-email          padding = null
form-0-your-message        padding = null
form-1-your-email-address  padding = null
form-0-submit              padding = {"topPx":12,"rightPx":32,"bottomPx":12,"leftPx":32}
```

(the two submits keep their padding because it was folded from the *text-run*
path, which recorded padding all along) and `$REF/l1.json` contains `"heading"`
x0, `"link"` x0, `href` x0.

**So the residual is frozen, and it is the whole residual.** Both iterations'
`regions.json`:

```
iteration-1 total score 1051.13  [(704,3920,80,32,246.4) (672,3872,80,16,154.0) (96,3920,64,16,133.4)
                                  (176,3920,64,16,121.7) (128,3344,64,16,116.8) (96,512,48,16,115.7)
                                  (688,3808,48,16,80.0)  (128,3504,16,16,30.3)  (672,3920,16,16,28.1)
                                  (688,3936,16,16,24.7)]
iteration-2 total score 1051.13  [identical, region for region]
```

and both halves are exactly REQ-269 issues 1 and 2, still measurable today:

- **the 16px padding, measured in the pixels.** Column ink profiles inside the
  `Your name` field (box `x 664, y 3784, w 528, h 50`), rows 3795–3825, ink
  threshold 60: the reference's first glyph column is **x = 681**; ours is **x ≤
  668**. Aligning the two profiles (`ref[x=685..] = 9,8,4,4,3,5,7,8,4,4,4,8,7`
  against `act[x=669..] = 9,8,5,4,3,5,7,8,4,4,4,9,7`) gives a shift of **exactly
  16px** — the `px-4` the reference authors and the capture did not record.
  7 of the 10 regions, 788.33 of 1051.13 (**75%**).
- **the quarter-pixel line-height.** `$ITER/diff/expected-manifest.json`
  element 43 records `lineHeightPx: 29` while its own `box.height` for the same
  two-line paragraph is `58.5` and its `renderedTextBox.height` is `50.25` —
  the record contradicts itself, and 58.5/2 = **29.25**. Ours renders `58`, and
  the three remaining regions (`(128,3344)`, `(96,512)`, `(128,3504)`, 262.80 of
  the score, **25%**) are each a **second-or-later line** of a paragraph: the
  reference's line 2 of element 43 starts at 3307.25+29.25 = 3336.5, ours at
  3307+29 = 3336, and region 5 sits at y 3344 in that line.

788.33 + 262.80 = 1051.13. **100% of the ranked residual is inert fixes waiting
on a fresh capture.**

### Why this is an engine gap and not "someone forgot to press recapture"

The reuse is deliberate and the reasoning is sound —
`tools/repro-console/src/console.ts:438–450`:

> A CAPTURE ALREADY ON DISK IS REUSED, NOT RE-TAKEN (requirement 29). …
> Re-capturing re-rolls the acceptance oracle, so the reference moves at the same
> instant the fold does and the two become inseparable.

The gap is that **a bundle carries no record of the code that produced it**.
`capture.json`'s top-level keys are `url host path title capturedAt viewport
theme sections assets` — there is no capture-schema version and no extractor
fingerprint, so nothing can tell a stale bundle from a current one, and the two
sides of every diff can be measured by different instruments without a word of
warning. The loop can then iterate indefinitely against an oracle that cannot
express the values the fold now knows how to place.

### Hypothesis

- `tools/generate/src/cli/capture/*` — a bundle is written with no schema/version
  stamp (`capture.json` has no such key).
- `tools/generate/src/cli/gate-core.ts:268 referenceCoverage` — the one place
  that already refuses a bundle for being too old (`No multistate.json in bundle
  … re-capture with 1c capture page <url>`, `:271–274`) proves the check belongs
  here; it just has no notion of *axis-level* staleness.
- `tools/repro-console/src/console.ts:450` — reuse is unconditional.

### Proposed change

1. Stamp every bundle: `capture.json.captureSchema` = a version the extractor
   bumps whenever it starts recording a new axis (or a hash of the recorded key
   set).
2. Have `1c gate` / `referenceCoverage` compare the bundle's stamp to the current
   one and emit a **coverage finding** when the bundle is behind, naming the axes
   the current extractor records and this bundle does not: *"this bundle was
   taken by an older capture (schema 4 vs 7); `paddingLeftPx`, `href`,
   `headingLevel` are recorded today and absent here — re-capture before trusting
   a residual."* A finding, not a hard failure, and **not** an automatic
   re-capture: requirement 29's stability argument stands.
3. Surface the same line in the console's round context so a round is told its
   oracle is behind before it spends itself diagnosing a frozen residual.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
python3 - <<'PY'
import json
c = json.load(open('storage/references/gigabytealchemy.ai/index/capture.json'))
f = [x for s in c['sections'] for x in (s.get('fields') or []) if x.get('controlType')][0]
print('capturedAt   ', c['capturedAt'])
print('schema stamp ', [k for k in c if 'schema' in k or 'version' in k])
print('padding keys ', [k for k in f if 'padding' in k])
print('hrefs        ', sum(1 for s in c['sections'] for r in s['content'] if 'href' in r))
print('headingLevels', sum(1 for s in c['sections'] for r in s['content'] if 'headingLevel' in r))
PY
git log -1 --format='%h %ad' --date=iso c3c747fa1d
```

**Wrong (now):**

```
capturedAt    2026-09-17T23:01:30.421Z
schema stamp  []
padding keys  []
hrefs         0
headingLevels 0
c3c747fa1d 2026-09-17 17:11:30 -0700     <-- the bundle is 70 minutes older than the fix
```

**Right (fixed):** `schema stamp` names a version; `1c gate` prints a coverage
finding saying the bundle is behind the extractor. And after an explicit
re-capture —

```bash
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c capture page https://gigabytealchemy.ai
```

— `padding keys` is `['paddingTopPx','paddingRightPx','paddingBottomPx','paddingLeftPx']`
with `paddingLeftPx: 16`, `hrefs` and `headingLevels` are non-zero, and a rerun
of the reproduction drops the ranked region score below 1051.13 for the first
time in two iterations.

---

## Issue 2 — the reproduction's band paint is read from the opaque fill box, so its own hero image never reaches its manifest

**Residual class:** `repro-band-paint-read-from-the-fill-box-not-the-image-layer`

**Class: 1 — engine shortfall.** L1 carries the image, the renderer paints it,
and the capture path that measures our own render records neither the image nor
the scrim that rides on it.

### The three questions, and what each returned

1. **Can L1 express it?** **Yes** — `$ITER/page.json`
   `.data.page.l1.root.children[6]` is `section-bg-0` with
   `axes.backgroundImageUrl = "/assets/AlchemistLabWithTech.png"`. Not class 2.
2. **Is the value in the L1 document, and is it right?** **Yes.** It matches the
   reference: `$REF/capture.json` `/sections[1]/background` is
   `{"kind":"image","color":"#ffffff","image":"assets/AlchemistLabWithTech.png","overlay":{"color":"#030717","opacity":0.3}}`.
3. **Does the render agree with L1?** **Yes** — `$ITER/site/index.html:31`:
   `.l1-7 { background-image: linear-gradient(#0307174d, #0307174d), url("assets/AlchemistLabWithTech.png"); background-size: cover; … }`,
   and the pixels confirm it (see issue 3). So the render is right and **the
   measurement is wrong** — which is class 1 in the capture, not class 3.

### Evidence

`$ITER/diff/actual-manifest.json`, section 0 — the reproduction's hero band, in
full:

```json
{"index":0,"overlay":null,"contentAnchorRatio":0.39,"paddingTopPx":0,
 "paddingBottomPx":0,"textAlign":"left","box":{"x":0,"y":0,"width":1280,"height":800}}
```

No `backgroundImageUrl`. The reference side, `expected-manifest.json` section 1:

```json
{"index":1,"overlay":{"color":"#030717","opacity":0.3},"contentAnchorRatio":0.53,
 "textAlign":"left","box":{"x":0,"y":0,"width":1280,"height":800},
 "backgroundImageUrl":"assets/AlchemistLabWithTech.png"}
```

`flattenSignals` sets `backgroundImageUrl` from *any* `url(` in the band's own
`backgroundImage` (`values-diff.ts:1109–1110`, `bandBackgroundImageUrl` at
`:1010`). Its absence therefore proves the band element the extractor read is
**not** `.l1-7`.

**Why it is not.** The renderer emits the hero as two full-bleed sibling boxes at
the same vertical range — `$ITER/site/index.html:18–19` and `:30–31`:

```
.l1-1 { position:absolute; top:0; left:0; width:…; height: calc(800px + (100vh - 800px)) }
.l1-1 { background-color: #030717 }
.l1-7 { position:absolute; top:0; left:0; width:…; height: 800px }
.l1-7 { background-image: linear-gradient(#0307174d, #0307174d), url("assets/AlchemistLabWithTech.png") }
```

Both qualify as backdrops (`extract.ts:683 backdropBoxes` — `.l1-1` is an opaque
full-bleed fill, `.l1-7` has a painted url). The extraction viewport is 800 tall
(the actual band box is exactly `800`), so the two have an identical vertical
range, and `bandSlices` drops one — `extract.ts:1388–1406`:

```js
// Outermost wins: a backdrop whose vertical range sits inside one already kept
// is a layer OF that band (a hero photograph over its fill), not a band of its
// own -- emitting both would report the same slice twice.
```

`.l1-1` sorts first (same `y`, same height, earlier in document order), is kept,
and `.l1-7` is dropped as "a layer of that band". Nothing then ever reads the
dropped layer: `extract.ts:1940–1951` takes the band's paint from `br.el` alone —
`backgroundImage: s.backgroundImage || 'none'` — which for `.l1-1` is `none`.

**The cost is bigger than one missing field.** Section-level comparison
(`values-diff.ts:2850–2886`) compares `overlay`, `contentAnchor` and `textAlign`
and **never compares `backgroundImageUrl`** — so a reproduction that dropped the
hero photograph entirely would produce zero deltas and a clean gate. The only
gate that would notice is the coverage proxy, and BUG-100 had to be fixed for it
to see a background image at all.

### Hypothesis

`tools/generate/src/cli/capture/extract.ts` — `bandSlices()` (`:1379–1428`)
selects the band element, and the band record at `:1939–1956` reads all paint
from that one element. The comment at `:1388` is right that an inner layer is not
its own band; the error is discarding its paint rather than folding it into the
band it is a layer of.

### Proposed change

In `bandSlices()` keep the dropped inner backdrops with the slice that swallowed
them (e.g. `{ el, box, layers: [...] }`), and in the band record at `:1945` take
`backgroundImage` from the topmost painted layer of the slice rather than from
the outermost element alone. This is symmetric with the reference path, where the
band element is the thing that paints because the page nests.

Separately (and cheaply): add `backgroundImageUrl` to the section axes compared
at `values-diff.ts:2863–2886`, so a lost hero is a delta rather than a silence.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
python3 -c "import json;print(json.dumps(json.load(open('storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/diff/actual-manifest.json'))['sections'][0]))"
grep -n 'l1-7 {' storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/site/index.html
```

**Wrong (now):** the section prints with no `backgroundImageUrl`, while the very
next command shows `.l1-7` painting `url("assets/AlchemistLabWithTech.png")` at
that band's coordinates.

**Right (fixed):** section 0 carries
`"backgroundImageUrl": ".../assets/AlchemistLabWithTech.png"`. To regenerate:

```bash
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-gigabytealchemy-ai \
  --ref /Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index \
  --sandbox --out /tmp/gate-check --json
```

---

## Issue 3 — a scrim painted as a gradient layer is invisible to the reproduction-side extractor, and that is the only delta this round reports

**Residual class:** `repro-scrim-invisible-when-painted-as-a-background-image-gradient`

**Class: 1 — engine shortfall.** Same three answers as issue 2: L1 carries it,
the value is right, the render is right. The measurement is wrong.

### Evidence — the delta

`$ITER/diff/values-diff.json`, the whole `deltas` array:

```json
[{"text":"§1","role":"section","property":"overlay","expected":"#030717 @ 0.3",
  "actual":"none","kind":"overlay","tier":"LOW","magnitude":0,"severity":1050,
  "valueType":"A"}]
```

### Evidence — that the reproduction paints it

- **L1:** `$ITER/page.json` `.data.page.l1.root.children[6].axes.overlay` =
  `{"color":"#030717","opacity":0.3}` — identical to the reference's
  `/sections[1]/background/overlay` in `$REF/capture.json`.
- **CSS:** `$ITER/site/index.html:31` —
  `background-image: linear-gradient(#0307174d, #0307174d), url("assets/AlchemistLabWithTech.png")`.
  `0x4d = 77`, `77/255 = 0.302`.
- **Pixels** (`$REF/screenshot.full.png` vs `$ITER/diff/actual.png`, both
  1280x4376, DPR 1), mean over the whole hero `0,0,1280,800`:

  ```
  ref (28.05, 21.44, 19.56)      act (28.44, 22.05, 19.97)
  (640,80)  ref (12, 8, 9)   act (12, 9, 9)
  (200,700) ref (34,22,17)   act (34,22,17)
  (1100,300)ref (28,42,57)   act (28,42,57)
  (640,760) ref  (8, 4, 7)   act  (8, 4, 7)
  ```

  And `regions.json.bands[0..2] = 0.75, 0.83, 0.70` — the three 273px bands
  covering the hero are the *quietest* part of the page.

  A genuinely missing `#030717 @ 0.3` veil would unveil each pixel to
  `(p − 0.3c)/0.7`: at the sampled `(34,22,17)` that is `(47,28,14)` — a 13/255
  red error over an 800px-tall band. The hero would be the top-ranked region.
  It is not in the list at all.

### Evidence — the two sides are read by two different procedures

**Reference side** (`sections.ts:39–64 backgroundOf`) has **two** routes to an
overlay:

```js
if (hasUrl) {
  …
  if (hasGradient) { const overlay = firstOverlay(img); if (overlay) bg.overlay = overlay }   // route A
}
if (band.overlay) bg.overlay = band.overlay                                                   // route B
```

`firstOverlay` (`sections.ts:25`) reads the first `rgba(...)` out of the computed
`background-image`.

**Reproduction side** (`values-diff.ts:1091`) has **one**:

```js
overlay: band.overlay ?? null,
```

and `band.overlay` on the geometric path is `overlayInBox()`
(`extract.ts:1441–1462`), which considers **only** `getComputedStyle(el).backgroundColor`
with `0 < alpha < 1`. A scrim expressed as a gradient layer inside
`background-image` — which is exactly and only how `render.ts` emits an L1
`overlay` axis — matches nothing there. Route A has no counterpart on this side.

So the axis can be measured on the reference and cannot be measured on the
reproduction, and the difference is reported as a defect in the reproduction.

### Hypothesis

`tools/generate/src/cli/capture/extract.ts:1441 overlayInBox` (and its
descendant-walking twin `overlayOf`, `:1306`) — scrim detection is
`backgroundColor`-only. `tools/generate/src/cli/capture/values-diff.ts:1091
flattenSignals` — no gradient route, unlike `flattenCapture`'s source.

### Proposed change

Extend `overlayInBox` (and `overlayOf`) so a painted surface blanketing the box
contributes a scrim from **either** a translucent `background-color` **or** the
first translucent colour stop of its `background-image` — the `firstOverlay`
rule `sections.ts:25` already applies on the other side. Doing it there rather
than in `flattenSignals` makes this fix independent of issue 2; doing it in
`flattenSignals` instead would require issue 2 to land first, because the
gradient does not currently reach the band record at all.

Then make the symmetry explicit: both manifests should derive `overlay` through
one shared helper, so a future scrim syntax cannot be readable on one side only.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
python3 -c "import json;print(json.load(open('storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/diff/values-diff.json'))['deltas'])"
grep -n 'l1-7 {' storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/site/index.html
python3 - <<'PY'
from PIL import Image
ref = Image.open('storage/references/gigabytealchemy.ai/index/screenshot.full.png').convert('RGB')
act = Image.open('storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/diff/actual.png').convert('RGB')
for pt in [(640,80),(200,700),(1100,300),(640,760)]:
    print(pt, 'ref', ref.getpixel(pt), 'act', act.getpixel(pt))
PY
```

**Wrong (now):** the first command prints one delta claiming `overlay … "actual":
"none"`, while the second shows the overlay in the emitted CSS and the third
shows the two images agreeing pixel for pixel across the veiled hero.

**Right (fixed):** `deltas` is `[]`, and
`actual-manifest.json.sections[0].overlay` reads
`{"color":"#030717","opacity":0.3}`. Regenerate with the `1c gate` command in
issue 2.

---

## Issue 4 — the content anchor is measured over two different populations, and only a 0.01 margin keeps it from being a second false delta

**Residual class:** `section-content-anchor-measured-over-two-different-populations`

**Class: 1 — engine shortfall.** Identical geometry on both sides, two different
numbers, because the two sides count different runs.

### Evidence

`expected-manifest.json` §1 says `contentAnchorRatio: 0.53`;
`actual-manifest.json` §0 says `0.39`. Both bands are `{x:0, y:0, w:1280, h:800}`.
`values-diff.ts:2188–2189` sets `anchorTol = 0.15`; `|0.53 − 0.39| = 0.14`, so it
is **93% of the tolerance** and reports nothing.

**The content is in the same place on both sides.** Every text run whose centre
falls in `0..800`, from the two manifests:

```
ref   82.5 h90    'Gigabyte Alchemy'      act    83 h90    'Gigabyte Alchemy'
ref  319.5 h40    'Intentional Software'  act   320 h40    'Intentional Software'
ref    384 h32    'Tools for clarity…'    act   384 h32    'Tools for clarity…'
ref    448 h87.75 "We're a software…"     act   448 h87    "We're a software…"
```

**The difference is which runs each side counted.** Ours is
`anchorRatioInBox(box, runs)` (`extract.ts:1466`), over every run whose centre
falls in the slice: `top 82.5, bottom 535.75, centre 309.1 → 0.386 → 0.39`. The
reference's is `anchorRatioOf(band, bbox)` (`extract.ts:1336`), a DOM
**descendant** walk of the hero element — which excludes the wordmark, because
`Gigabyte Alchemy` lives in the reference's *header*, its own section
(`expected-manifest.json` §0, `{x:0,y:0,w:1280,h:192}`, which `sectionPairing`
records as unpaired with `overlap: 0`). Excluding it:
`top 319.5, bottom 535.75, centre 427.6 → 0.5345 → 0.53`. Exactly the recorded
value.

So the reference's sections **overlap** (§0 sits inside §1) and ours cannot,
because a geometric slice partitions the page. Every run of an overlapped
reference section is double-counted on our side and single-counted on theirs.

### Hypothesis

`tools/generate/src/cli/capture/extract.ts:1466 anchorRatioInBox` vs `:1336
anchorRatioOf` — two definitions of the same axis, applied one per side. The
comment at `:1354–1373` states the geometric definition is "identical on a
conventionally nested page"; this is the case where it is not, because the
reference's own segmentation is not a partition.

### Proposed change

Make the populations agree rather than tightening the tolerance. When pairing
sections (`values-diff.ts:2841–2845`), exclude from a reproduction band's anchor
any run whose centre falls inside a *different, smaller* reference section that
overlaps the paired one — or, more simply, skip the `contentAnchor` comparison
for a reference section that another reference section overlaps, and say so in
`sectionPairing` rather than comparing two numbers that do not mean the same
thing. Either way the comparison should not depend on a 0.01 margin.

### How to see it

```bash
cd /Users/martin/lagrangefoundry/1stcontact
python3 - <<'PY'
import json
d = 'storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/diff/'
e = json.load(open(d + 'expected-manifest.json')); a = json.load(open(d + 'actual-manifest.json'))
print('ref §1 anchor', e['sections'][1]['contentAnchorRatio'], e['sections'][1]['box'])
print('act §0 anchor', a['sections'][0]['contentAnchorRatio'], a['sections'][0]['box'])
print('ref §0 overlaps §1:', e['sections'][0]['box'])
for m, name in ((e, 'ref'), (a, 'act')):
    runs = [x for x in m['elements']
            if x.get('box') and x.get('text') and x['text'] != '(generic)'
            and 0 <= x['box']['y'] + x['box']['height'] / 2 < 800]
    top = min(r['box']['y'] for r in runs); bot = max(r['box']['y'] + r['box']['height'] for r in runs)
    print(name, 'runs', len(runs), 'top', top, 'bot', bot, 'ratio', round((top + bot) / 2 / 800, 3))
PY
```

**Wrong (now):** `ref §1 anchor 0.53` / `act §0 anchor 0.39` on the same
`{x:0,y:0,w:1280,h:800}` box, with both sides' runs at the same coordinates —
a phantom 112px content shift, silent because `0.14 < 0.15`.

**Right (fixed):** the two anchors agree (both `0.53`, the wordmark excluded on
both sides), or `values-diff.json.sectionPairing` records the anchor as not
comparable for `§1` and gives the reason.

---

## What I checked and found clean

- **Content completeness.** `gate.json.coverage`: `mirroredImages 1`,
  `referencedImages 1`, `unreferencedImages []`, `findings []` — BUG-100's
  miscount is gone. `values-diff.json`: `matched 59, unmatched 0, suppressed 0` —
  every reference element found a partner. `unpairedActual` is **not** empty: it
  holds 7 entries, all `{"label":"(generic)","role":"generic","kind":"control"}`.
  Those are the reproduction's own band machinery — the six `section-band-*`
  fill boxes plus `section-bg-0` that `render.ts` emits as absolutely-positioned
  siblings, which the reference paints on its section elements instead. Not
  invented content, and not a finding; worth knowing that `gate.json`'s
  `unmatched: 0` counts the reference side only and says nothing about this list.
- **`coverage.pageHeightPx = 4428` is not a defect.** It comes from
  `widestRestProjection` (`gate-core.ts:276`), i.e. the 1440 projection in
  `multistate.json`, whose element bottom is 4428; the 1280 projection's is 4328.
  Verified against `multistate.json` directly.
- **Placeholder colour is fixed.** Both manifests carry
  `placeholderColor: "#746f69"` on all four controls — REQ-265's class-2 residual
  no longer appears.
- **Section pairing is correct.** `sectionPairing` joins §1..§7 to §0..§6 with
  overlaps of 0.9990–1.0; only the reference's §0 (the 192px header, which
  overlaps §1) is unpaired, which is issue 4's subject and not a pairing bug.
- **The ranked regions are shift regions, not dropped content.** All 10 carry a
  leading node on *both* sides with identical verbatim `text` (the manifest
  indices differ — e.g. region 5 is ref `43` / actual `48` — because the
  reproduction's element list includes the band boxes above). Nothing in
  `regions.json` is one-sided, so nothing here is content the reproduction
  failed to draw.

## Related

- **REQ-269** — the five residuals whose fixes landed in `c3c747fa1d` and which
  issue 1 explains the survival of. Issues 2–4 are defects in the section-band
  measurement that REQ-269's issue 5
  (`repro-l1-render-has-no-section-bands`) created the conditions to see: before
  it landed, `values-diff` refused to compare section values at all
  (`flatRepro`, `values-diff.ts:2827–2839`) and iteration 1 reported `deltas: 0`.
  The fix is right; these are the first three things it exposed.
- **REQ-265** — the half-leading class. Not seen this round.
- **BUG-100** — the coverage image miscount. Clean this round.
---

# Implementation (free-coded)

All four issues are fixed. Where the implementation made a choice the diagnosis
left open, the choice and its reason are stated here — this section is the spec
the UATs are written against.

## Issue 1 — a bundle records which extractor took it

`capture.json` gains **`captureSchema`**, an integer the extractor stamps into
every bundle it writes (`tools/generate/src/cli/capture/schema.ts`,
`CAPTURE_SCHEMA`). It is **optional on read and always will be**: a bundle
written before the stamp existed parses unchanged and reads as **schema 1** —
"no stamp" and "the oldest schema we know about" are the same fact.

**Why a version and not a hash of the recorded key set.** A hash answers "is this
bundle different" and cannot answer "different how". The operator needs the
second question answered, so the version is paired with a declared **axis
inventory** (`CAPTURE_SCHEMA_AXES`) naming each axis and the version that
introduced it. Schema 2 is REQ-269's four: per-side padding on a form field,
`href` and `headingLevel` on a content run, and `lineHeightPx` kept to two
decimals. The inventory grows; nothing in it is ever revised.

**The finding names only absence it can see.** A version comparison proves a
bundle is behind, but not which axes it actually lacks — a bundle may carry one
the stamp says predates it (re-extracted, hand-repaired). So each axis carries a
`present` probe over the bundle, and an axis the bundle demonstrably holds is
dropped from the finding even when the version says it should be absent: the
finding claims absence, so it may only claim what it can see. The converse is
deliberately **not** symmetric — a page with no links records no `href` however
new its extractor is, so "not observed" can never prove "not recordable", which
is exactly why the version gate comes first and the probe can only ever *remove*
an axis from the list.

`referenceCoverage` emits a **`stale-capture` coverage finding** naming both
versions, the axes, and the re-capture command. It is a finding, **not** a hard
failure and **not** an automatic re-capture: requirement 29's stability argument
stands and the finding says so in as many words.

The console's round context prints every coverage finding **verbatim** rather
than counting them, beside the verdict. A finding is a statement about the
*oracle*, which is the one thing a round cannot re-derive from the evidence —
every file it is about to read was produced against that oracle.

## Issue 2 — a band's paint comes from the layer that paints it

`bandSlices()` still refuses to emit an inner backdrop as its own band, and now
**keeps it as a layer of the slice that swallowed it** (`{ el, box, layers }`)
instead of discarding it. The band record takes `backgroundImage` from the
**topmost painted layer** of the slice (`sliceBackgroundImage`), falling back to
the slice element's own.

`backgroundColor` is deliberately **not** taken from the layer: the fill is what
the outermost box paints, and an image layer's own colour is usually transparent.
So the hero reads as the photograph over the fill, which is what it is.

`backgroundImageUrl` is added to the section axes compared in `values-diff`,
**by mirrored basename** — the same rule the element-level handle already uses,
because the two sides legitimately spell the same bytes differently (the
reference a site-local `assets/…` mirror, our render an absolute origin URL).
A reproduction that loses the hero is now a delta instead of a silence.

## Issue 3 — a scrim is a scrim however it is painted

`overlayOf` and `overlayInBox` now share **one** definition, `scrimOf(el)`: a
translucent `background-color` first, then a translucent colour stop of the
element's `background-image`. Fixing it here rather than in `flattenSignals`
keeps this independent of issue 2, as the diagnosis recommends.

**The gradient rule is "the first TRANSLUCENT stop", not "the first stop"** —
one widening of `sections.ts`'s `firstOverlay`. A fade-to-black scrim opens at
alpha 0, and reading the first stop would report no scrim at all.

The coverage rule is unchanged (a scrim must blanket ≥60% of the band), and an
opaque gradient is still not a scrim.

## Issue 4 — an anchor is only comparable over the same population

`values-diff` skips the `contentAnchor` comparison for a reference section that
another, **smaller** reference section overlaps, and records
`anchorComparable: false` plus `anchorReason` (naming the overlapping section) on
that `sectionPairing` entry. "Overlaps" means smaller and substantially
contained — half of the inner section's own height inside the outer one — so two
bands that merely abut are not an overlap and are still compared.

Taking the simpler of the two options the diagnosis offers: the alternative
(excluding those runs from the reproduction band's anchor) reconstructs one
side's population from the other's segmentation, which is a second definition of
the axis rather than a fix to the first. **Widening the tolerance was never an
option** — one that absorbs 0.14 absorbs a real 100px shift too, so the guard
fires on the overlap, whatever the two numbers are.

## What this does not do

**It does not re-capture `storage/references/gigabytealchemy.ai/index`.** That is
the operator's call by design (requirement 29), and until it is taken the
1051.13 ranked residual stays frozen and REQ-269's five fixes stay unverifiable.
What changes is that the gate and the round now *say so* instead of reporting a
clean `pass` over a stale oracle.

## Test plan

`tests/test_UAT_FC_REQ-270_capture_oracle_and_band_measurement.test.ts` — 12
UATs, all passing.

Five browser UATs drive a **real headless Chromium** against the committed
fixture `tests/fixtures/capture/req270-hero-layers.html` (an opaque full-bleed
fill with the photograph + gradient scrim sitting exactly inside it — the shape
`render.ts` emits and the shape the gigabytealchemy reproduction paints) served
over an ephemeral loopback server. They measure it **both ways**: the reference
projection (`1c capture page`) and the reproduction path
(`EXTRACT_SCRIPT` → `flattenSignals`), because the whole class of defect here is
the two disagreeing. They skip cleanly where no browser can launch.

Seven UATs need no browser: the schema stamp and its axis probe, the
`stale-capture` coverage finding against bundles written to disk (stale and
current), the round-context prompt, the lost-hero section delta, and both anchor
legs.

**RED evidence.** With `extract.ts` and `values-diff.ts` reverted to their
pre-fix state, 6 of the 6 UATs covering issues 2–4 fail, each in the way the
diagnosis describes: `overlay` reads `null`, the section carries no
`backgroundImageUrl` on either side, a dropped hero produces no delta, and the
anchor pairing carries no comparability record.

Regression scope run green: `bug13`, `bug15`, `bug19`, `bug22`, `bug23`,
`bug24`, `bug27`, `req31`, `req35`, `req47`, `req48`, `req53`, `req61`, `req86`,
`req88`, `req94`, `BUG-100`, `BUG-102`, `BUG-103` (×2), `BUG-106`, `REQ-254`,
`REQ-256`, `REQ-269`, the three `reconciliation-*-gate` suites and
`reconciliation-size-aware-diff`.

Six synthetic capture fixtures across five existing suites (`BUG-100`,
`BUG-106`, `req94`, `reconciliation-cross-gate-reconciliation`) now carry
`captureSchema: CAPTURE_SCHEMA`. Each stands in for a bundle taken by the
current extractor, so without the stamp coverage correctly reported
`stale-capture` and those suites would have been asserting against a bundle no
live capture produces. No assertion was changed.

Two pre-existing failures are unrelated and reproduce on an untouched checkout:
`capture.test.ts` (`REQ-12_style_segmentation`, `REQ-12_offline_reextraction`)
and `req83-capture-to-l1-fold.ts` (`REQ-83_hints`), all three throwing
`driverFactory was not supplied` from the test itself.
