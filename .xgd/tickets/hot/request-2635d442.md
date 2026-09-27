---
uid: request-2635d442
id: REQ-336
type: request
title: 'fold: a captured wrapper rotation is dropped so four collage photographs reproduce
  unturned, and a translucent border colour is flattened to opaque'
created_by: repro-console:repro-faelan-com#3
created_at: '2026-09-27T00:56:43.019398+00:00'
updated_at: '2026-09-27T21:28:40.303091+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  defect_class:
  - fold-wrong
  - capture-loses-it
  - instrument-blind
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-5365b5a4
  commits:
  - working_sha: c21c24e18f6ab886957f20ef2b1e33b4cdbd604f
    reconcile_sha: null
    main_sha: null
  - working_sha: 8b247802395751af3d1a51adc777324f0b6c00ba
    reconcile_sha: null
    main_sha: null
  version: 0.2.394
  story_points: 5
---

Loop 1, iteration 3 of `repro-faelan-com` against the stored reference bundle
`storage/references/faelan.com/index` (captured `2026-09-27T00:09:50.010Z` =
`2026-09-26 17:09:50 -0700`, `captureSchema: 7`).

`gate.json`: `verdict: "structural-failure"`, `pass: false`, `l1Pass: false`,
mean 13.99/255, 13.06% of pixels over threshold, 12 ranked regions (total score
**71051.80**), 8 value deltas, **`unmeasured 0`** (`unmeasuredAxes: []`,
`notComparableAxes: []`, `unpairedSections: 0`, `unpairedActual: 0`).

## Read this first — the verdict in this round's `gate.json` is a landed fix

**The `structural-failure` verdict and both of its `escape` findings are already
fixed. Do not work them.** They are the two 8px footer escapes at 375x768 and
375x1536 that `gate.json` reports on `section-band-1`, and they are exactly
BUG-153 item 3, whose fix (`18389b822e`, *"fix(values-diff,probes): measure the
transform, the mask and the nowrap run"*) was committed at **17:01:54** on a free
branch and reached `xgd-working` by merge at **17:23:33** (`beab9b22c1`,
`a3dc79e8a4`, `41319c63f3`). The console's artifacts are stamped **17:10** — 13
minutes before the fix arrived on the branch the round measured.

Re-run on HEAD, the whole L1 gate is clean:

```
$ 1c l1-gate --ref storage/references/faelan.com/index --json | \
    python3 -c "import json,sys; d=json.load(sys.stdin); print('pass',d['pass']); \
      [print(k,d[k]['pass'],sum(len(w['findings']) for w in d[k]['byWidth'])) \
       for k in ('sampleFidelity','offSample','contentRobustness','onSample') if 'byWidth' in d[k]]"
pass True
offSample True 0
contentRobustness True 0
onSample True 0
```

`foldResiduals: []`, `staleFold: null`, `recovery.servedFindings: 0`, exit 0.
BUG-153's item 4 (`bandPaintActual`) has landed too: `values-diff.json` in this
round carries no `bandPaintActual` key while HEAD's `values-diff.ts` emits one,
which is the same 13-minute window. **Everything below was re-measured on HEAD
and is live.**

## Summary — three issues, in the order they should be worked

| # | residual class | kind | `defect_class` | what it is worth here |
|---|---|---|---|---|
| 1 | `fold-drops-a-captured-transform-rotation` | **class 1** — engine shortfall | `fold-wrong` | 4 of the 8 deltas, all HIGH; **every one of the 12 ranked regions (100% of the 71051.80 score) is on the four rotated photographs** |
| 2 | `capture-flattens-a-translucent-colour-to-opaque` | **class 1** — engine shortfall | `capture-loses-it` | a 30%-white 4px ring paints solid white; a 90%-white paragraph paints pure white. **0 deltas — the image pass has no border axis and both sides are flattened by the same read** |
| 3 | `fold-residuals-are-silent-about-an-axis-dropped-from-an-emitted-element` | instrument | `instrument-blind` | `foldResiduals: []` while the fold drops four rotations it has the vocabulary to name — this is *why* issue 1 survived a re-capture |

**Dependencies.** 1 first: it is the whole pixel residual and it is a five-line
fold change. 3 after 1, because 1 is the instance 3 would have reported and the
cheapest way to check 3 is to confirm it *would* have named the rotation. 2 is
independent of both, but it is **capture-side**, so after it lands **the operator
must press [recapture]** before this bundle's evidence moves — `1c refold` cannot
show it. Issue 1 needs only a `1c refold`.

**Fixing issue 1 will not raise the delta count** (the axis is already compared;
the 4 deltas go to 0). **Fixing issue 2 will raise it**, because it makes the
capture record values the comparator can then disagree about — and, once the
image pass gains a border axis, it will surface a real difference that reads as
clean today.

## Two residuals found this round are NOT filed here

- The four LOW `surfaceFill` deltas (`#000000` -> `#0b101e` on `FAELAN`,
  `Artist *`, `Musician`, `* Creator`) are **REQ-302's issue 4**. Re-measured and
  appended there this round, with one finding that refines its stated mechanism.
- The `FAELAN` wordmark's **second text-shadow layer** cannot be authored in L1 at
  all (class 2 / `l1-cannot-express`). That class is **REQ-331's issue 5**
  (`l1-shadow-carries-one-layer-only`), whose fix landed for `boxShadow` and not
  for `textShadow`. Re-measured and appended to REQ-331 rather than re-filed.

Everything below is quoted out of a file on disk or is the output of a command
this round ran. Nothing is read off a screenshot.

### Paths used throughout

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/faelan.com/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-faelan-com/iteration-3
SLUG=repro-faelan-com
```

`1c` was **not on `PATH`** in this session (`which 1c` -> not found). Every command
below is written as `1c ...`; this round ran `./bin/1c ...` from the repository
root, which is the same entry point.

---

## Issue 1 — the capture now records the wrapper's rotation and the fold throws it away

**Residual class:** `fold-drops-a-captured-transform-rotation`
**`defect_class`: `fold-wrong`** — the capture carries the value, L1 accepts it
and the renderer emits it; `foldToL1` is the only stage that loses it. Defended
by the four commands in "The three questions" below, all run on HEAD.

**REQ-333's issue 1 has landed and this is the next link in the same chain.**
REQ-333 concluded *"The fold and the renderer are innocent"* — true then, because
`capture.json` recorded `transformRotateDeg: 0` for all four photographs. It no
longer does. That ticket's capture fix is confirmed landed here two ways: the
rotations are now present, and the inflated layout box is gone (`Alley scene` is
`450x599.66` on **both** sides of `values-diff.json`, where REQ-333 measured
`450x599.66` painted as `490.73x629.59`). The ranked score fell from REQ-333's
107925.69 to 71051.80 as a result. What is left is the rotation itself.

### The three questions, and what each returned

1. **Can L1 express it?** **Yes.** `l1TransformSchema.rotateDeg`
   (`packages/site-schema/src/l1/schema.ts:719-732`) and the renderer's
   `rotate(<deg>)` (`packages/framework/src/l1/render.ts:515-516`). Proved, not
   inferred — grafting the oracle's four rotations onto HEAD's own fold output
   validates and renders:

   ```
   validateL1 with transform.rotateDeg on all four images: {"ok":true}
   with transform grafted: rotate( in render: rotate(-5deg) rotate(3deg) rotate(-8deg) rotate(4deg)
   ```

   -> not class 2.
2. **Is the value in the L1 document, and is it right?** **It is absent.**
   `$ITER/page.json`: no `transform` key on any node — the four `image` nodes
   carry `axes`, `geometry`, `mask` and `stacked` and nothing else. The bundle's
   own `l1.json` is identical (`transform` occurs 0 times, `rotateDeg` 0 times).
   -> **class 1. And the stage that put the wrong value in is the FOLD, because
   the capture put the right one in** (question 3 not reached).
3. *(not reached — but the renderer was checked anyway and is innocent, see
   question 1's second line.)*

### The ground truth — the page's own stylesheet, mirrored into the bundle

`$REF/assets/index.BM9-dqc-.css`, one declaration per collage wrapper:

```
.photo-circle[data-astro-cid-j7pv25f6] { ... transform:rotate(-5deg); ... }
.photo-torn[data-astro-cid-j7pv25f6]   { ... transform:rotate(3deg);  ... }
.photo-soft-1[data-astro-cid-j7pv25f6] { ... transform:rotate(-8deg); ... }
.photo-soft-2[data-astro-cid-j7pv25f6] { ... transform:rotate(4deg);  ... }
```

`$REF/raw.html` confirms the nesting the values belong to: each is a `<div
class="photo-*">` wrapping a bare `<img>`.

### The evidence

**`$REF/capture.json` `/sections/0/fields/*` — the capture carries all four:**

| field | alt | `transformRotateDeg` | `box` | `clip` |
|---|---|---|---|---|
| 0 | Faelan | **-5** | (932.00, 68.00) 216.00x216.00 | (922.998, 58.998) 234.004x234.004 |
| 1 | Ghostship | **3** | (64.00, 40.00) 320.00x205.703 | (58.836, 31.767) 330.327x222.169 |
| 2 | Faelan with violin | **-8** | (192.00, 360.00) 260.00x259.125 | (175.234, 343.168) 293.533x292.788 |
| 3 | Alley scene | **4** | (448.00, 144.00) 450.00x599.656 | (427.633, 129.035) 490.734x629.586 |

**The `clip` box is an independent proof of the rotation, closed to 3dp.** For
field 2 at -8 degrees: `260*cos8 + 259.125*sin8 = 257.470 + 36.059 = 293.529`
against the recorded `293.533`, and `259.125*cos8 + 260*sin8 = 256.603 + 36.185 =
292.788` against the recorded `292.788`. For field 3 at 4 degrees:
`450*cos4 + 599.656*sin4 = 448.904 + 41.828 = 490.732` against `490.734`. So even
if `transformRotateDeg` were doubted, the bundle's own geometry says these
pictures are turned.

**`$ITER/diff/values-diff.json` — 4 of the 8 deltas, the only HIGH ones:**

```
{"text":"Faelan with violin","role":"img","property":"transform","expected":"rot -8°","actual":"rot 0°","tier":"HIGH","magnitude":8,"severity":3060.8888888888887}
{"text":"Faelan","role":"img","property":"transform","expected":"rot -5°","actual":"rot 0°","tier":"HIGH","magnitude":5,"severity":3060.8333333333335}
{"text":"Alley scene","role":"img","property":"transform","expected":"rot 4°", "actual":"rot 0°","tier":"HIGH","magnitude":4,"severity":3060.8}
{"text":"Ghostship","role":"img","property":"transform","expected":"rot 3°", "actual":"rot 0°","tier":"HIGH","magnitude":3,"severity":3060.75}
```

and the `objects[]` entry for each says every other compared parameter agrees —
`Alley scene`: `name` same, `objectFit` `fill`/`fill`, `aspect` `0.75:1`/`0.75:1`,
`box` `(448, 144) 450x600` / `(448, 144) 450x600`, `transform` **the only
`mismatch: true`**. The two manifests agree: `expected-manifest.json` has
`transformRotateDeg` -5/3/-8/4 on the four `img` elements and
`actual-manifest.json` has `0` on all four, with boxes agreeing to a sixteenth of
a pixel.

**`$ITER/diff/regions.json` — all 12 regions, 100% of the score, are these four
pictures.** `dims {w:1280,h:1195}`, `rankedBy: "score"`, total 71051.80:

| # | bbox | score | % | best lead, ref | best lead, ours |
|---|---|---|---|---|---|
| 1 | (304,128) 608x624 | 49475.02 | 69.6 | `Alley scene` img, box (448,144) 450x599.66, `ofRegion` 0.71 / `ofNode` 1 | **identical record** |
| 2 | (64,32) 320x208 | 11496.44 | 16.2 | `Ghostship` img, `ofRegion` 0.96 | identical |
| 3 | (928,64) 224x224 | 7512.54 | 10.6 | `Faelan` img, `ofRegion` 0.93 | identical |
| 4 | (208,496) 96x64 | 558.16 | 0.8 | `Faelan with violin`, 1.00 | identical |
| 5 | (48,208) 144x48 | 543.44 | 0.8 | `Ghostship`, 0.70 | identical |
| 6 | (352,512) 64x64 | 408.15 | 0.6 | `Faelan with violin`, 1.00 | identical |
| 7 | (192,544) 32x80 | 229.99 | 0.3 | `Faelan with violin`, 0.94 | identical |
| 8 | (272,240) 96x16 | 214.77 | 0.3 | `Ghostship`, 0.36 | identical |
| 9 | (176,384) 16x80 | 206.55 | 0.3 | **section only, `ofNode` 0** | section only |
| 10 | (656,480) 16x64 | 171.99 | 0.2 | `Alley scene`, 1.00 | identical |
| 11 | (320,32) 64x16 | 151.36 | 0.2 | `Ghostship`, 0.50 | identical |
| 12 | (208,352) 48x16 | 83.39 | 0.1 | `Faelan with violin`, 0.50 | identical |

**The asymmetry here is that there is none, and that is the finding.** Eleven of
twelve regions carry *the same node with the same box and the same overlap
fractions on both sides* — so nothing moved and nothing was dropped; the paint
inside an identical box differs, which is what a `transform` does and nothing
else in this delta set does.

**Region 9 is the rotation on its own, with no other explanation available.** Its
bbox `(176,384) 16x80` lies **entirely outside every element box in either
manifest** — both sides' `nodes` name only `section` with `ofNode: 0` — and it
starts at x=176, where the violin photo's rotated bounding box starts
(`clip.x = 175.234`) and 16px left of its layout box (`box.x = 192`). Only a
transform paints outside the layout box. A mask cannot (it only removes paint);
a colour cannot.

**The mask is NOT a competing explanation for these pixels.** REQ-333's issue 3
and 4 are confirmed landed: the served document's mask declarations are
equivalent to the reference stylesheet's, declaration for declaration —

```
$ grep -o "mask-image:[^;}]*" $ITER/site/home.html | sort -u
mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, #000 70%, transparent 100%)
mask-image: radial-gradient(ellipse 92% 92% at 50% 50%, #000 72%, transparent 100%)
mask-image: radial-gradient(ellipse 95% 95% at 50% 50%, #000 75%, transparent 100%)
$ grep -o "mask-image:radial-gradient([^)]*)[^;}]*" $REF/assets/index.BM9-dqc-.css | sort -u
mask-image:radial-gradient(ellipse 90% 90% at 50% 50%,black 70%,transparent 100%)
mask-image:radial-gradient(ellipse 92% 92% at 50% 50%,black 72%,transparent 100%)
mask-image:radial-gradient(ellipse 95% 95% at 50% 50%,black 75%,transparent 100%)
```

— and the two shadow layers, with their alpha, are present on all three
(`boxShadow` `#00000099` + `#ffffff33`), which is REQ-331's issues 4 and 5 for
box shadows. So of everything that paints those four pictures, the rotation is
the one thing left wrong.

### The hypothesis

`tools/generate/src/l1/fold.ts`, the image-leaf branch at **3237-3264**. It
builds the node and then attaches, in order, `axes` (via `imageAxes`, 1491),
`visibility`, `stacked` (3249), `mask` (3252), `link` (3256), `padding` (3258)
and `responsivePadding` (3263). **`transform` is attached nowhere**, and
`imageAxes` has no transform branch because `transform` is a node field, not an
axis — the same shape `mask` has, and its comment at 3251 already says so: *"A
node axis, beside `padding`, not one of the image axes."*

This is not image-specific. `transform` is emitted for **no** node kind: HEAD's
`foldToL1` over this bundle produces `"transform"` 0 times in the whole document.
This bundle only carries rotations on images, so images are the only evidence I
have; a text or box leaf with a wrapper rotation would be lost the same way, and
whoever fixes this should fix it where every leaf can reach it.

### The proposed change

In the image-leaf branch beside `foldMask`, and for the other leaf kinds at their
equivalent point:

```ts
const rot = widest.transformRotateDeg
const scl = widest.transformScale
const transform: L1Transform = {}
if (rot !== undefined && Number.isFinite(rot) && rot !== 0) transform.rotateDeg = rot
if (scl !== undefined && Number.isFinite(scl) && scl !== 1 && scl > 0) transform.scale = scl
if (Object.keys(transform).length) node.transform = transform
```

`rotateDeg` is bounded `[-3600, 3600]` by `L1_ENVELOPE`
(`packages/site-schema/src/l1/validate.ts:43, 391-396`), so a captured degree
value needs no clamp in practice but should be range-checked rather than trusted.
`transformScale` is 1 on all four fields in this bundle, so the scale half is
**unevidenced here** and is included only because it is the same field pair and
the same loss; do not treat it as measured.

**This will not create new layout findings.** All four photographs already carry
`stacked: true` (REQ-331's landed declaration), so the overlap scan exempts them
(`probes.ts:1380-1389`), and a rotation does not change a layout box, so no
`escape` can appear either. Re-running `1c l1-gate` after the change is the check.

### How to see it, and how to know it is fixed

```
# 1. the oracle carries the rotation
python3 -c "import json;c=json.load(open('$REF/capture.json'));\
print([(f['alt'],f['transformRotateDeg']) for f in c['sections'][0]['fields']])"
#   wrong (today) -- nothing wrong here, this is the INPUT:
#   [('Faelan', -5), ('Ghostship', 3), ('Faelan with violin', -8), ('Alley scene', 4)]

# 2. the fold drops it -- no browser needed
1c refold $REF && python3 -c "import json;\
print('transform occurrences:', json.dumps(json.load(open('$REF/l1.json'))).count('transform'))"
#   wrong (today): transform occurrences: 0
#   right:         transform occurrences: 4   (one per rotated image node)

# 3. the reproduction paints none
grep -c "rotate(" $ITER/site/home.html
#   wrong (today): 0
#   right:         4   -- rotate(-5deg), rotate(3deg), rotate(-8deg), rotate(4deg)

# 4. the gate agrees
CHROMIUM_LAUNCH_ARGS=--single-process 1c gate $SLUG --ref $REF --sandbox --json
#   wrong (today): 4 HIGH `transform` deltas (`rot -8°` vs `rot 0°`, etc),
#                  12 ranked regions, total score 71051.80, mean 13.99/255
#   right:         0 `transform` deltas; the ranked score collapses (every one of
#                  the 12 regions today is on one of these four pictures)
```

If `1c refold` is unavailable, the same check offline, which is what this round
ran:

```
node --input-type=module -e '
import { createServer } from "node_modules/.pnpm/vite@8.1.0_@types+node@26.0.1_esbuild@0.28.1_yaml@2.9.0/node_modules/vite/dist/node/index.js"
import fs from "node:fs"
const s = await createServer({ root: process.cwd(), configFile:false, server:{middlewareMode:true}, optimizeDeps:{noDiscovery:true} })
const { foldToL1 } = await s.ssrLoadModule("/tools/generate/src/l1/fold.ts")
const doc = foldToL1(JSON.parse(fs.readFileSync("storage/references/faelan.com/index/multistate.json","utf8")))
for (const n of doc.root.children[0].children) if (n.kind==="image") console.log(n.id, n.alt, JSON.stringify(n.transform))
await s.close()'
#   wrong (today): image-0 Faelan undefined  (and the same for image-1..3)
#   right:         image-0 Faelan {"rotateDeg":-5} / image-1 {"rotateDeg":3} /
#                  image-2 {"rotateDeg":-8} / image-3 {"rotateDeg":4}
```

---

## Issue 2 — the capture flattens a translucent colour to opaque, so a 30%-white ring paints solid white

**Residual class:** `capture-flattens-a-translucent-colour-to-opaque`
**`defect_class`: `capture-loses-it`** — L1 holds an 8-digit hex and the renderer
emits it verbatim (both proved below), and the alpha is already gone in
`capture.json`, so nothing downstream can recover it. There is a **second,
dependent half in the fold** which would re-flatten the value even after the
capture is fixed; it is named in the proposed change and it is `fold-wrong`,
which is why it is not a separate issue.

### The three questions, and what each returned

1. **Can L1 express it?** **Yes.** `l1HexSchema`
   (`packages/site-schema/src/l1/palette.ts:48-53`) admits `#rrggbbaa`, and
   `l1BorderSchema.color` is `l1Color` (`schema.ts:503-509`). Proved on HEAD's own
   fold output:

   ```
   validateL1 border #ffffff4d + color #ffffffe6: {"ok":true,"errors":[]}
   renderer emits border: border: 4px solid #ffffff4d
   renderer emits color #ffffffe6: true
   ```

   -> not class 2.
2. **Is the value in the L1 document, and is it right?** **It is wrong, and it was
   already wrong when it arrived.** `$ITER/page.json` `image-0`:
   `"border":{"widthPx":4,"color":"#ffffff","style":"solid"}` — and
   `$REF/capture.json` `/sections/0/fields/0/borderColor` is `"#ffffff"` too.
   -> **class 1, and the stage that put the wrong value in is the CAPTURE.**
3. *(not reached.)*

### The evidence

**The page's own stylesheet** (`$REF/assets/index.BM9-dqc-.css`):

```
.photo-circle[data-astro-cid-j7pv25f6] { ... border:4px solid rgba(255,255,255,.3); ... }
.header-text[data-astro-cid-j7pv25f6] p[data-astro-cid-j7pv25f6] { font-size:1.5rem;color:#ffffffe6; ... }
```

**What the capture recorded** — `$REF/capture.json`:

| source declaration | captured as | where |
|---|---|---|
| `border:4px solid rgba(255,255,255,.3)` (= `#ffffff4d`) | `"borderColor": "#ffffff"` | `/sections/0/fields/0/borderColor` |
| `color:#ffffffe6` (= 90% white) | `"color": "#ffffff"` | `/sections/0/content/1..3/color` |

`multistate.json`'s projection agrees: the `Faelan` img element carries
`"border": {"widthPx": 4, "color": "#ffffff", "style": "solid"}`, and `Artist *`
/ `Musician` / `* Creator` all carry `color: "#ffffff"`.

**What the reproduction paints** — `$ITER/site/home.html`:

```
$ grep -o "border:[^;}]*" $ITER/site/home.html | sort -u
border: 4px solid #ffffff
```

So a 4px ring at 30% opacity around a 216x216 photograph paints as solid white,
and a 90%-white paragraph paints pure white.

**Both of these are worth ZERO value deltas, for two different reasons, and the
gate still says `unmeasured 0`.**

- The border: `values-diff.json`'s `objects[]` entry for an `img` compares exactly
  five parameters — `name`, `objectFit`, `aspect`, `box`, `transform`. There is no
  `border`, `boxShadow`, `borderRadiusPx`, `filter`, `blendMode` or `opacity`
  axis on the image pass at all, although `capture.json` records every one of
  them per field. A wrong ring colour is structurally invisible.
- The text colour: `color` **is** compared, and both sides read `#ffffff` —
  because the same alpha-dropping helper measured the reference page and our
  reproduction. The comparison is symmetric and both sides are wrong, so the
  delta is 0 and the pixels still differ.

**No ranked region isolates either of these** — regions 2 and 3 cover the ringed
photograph and the header paragraph respectively, but both are dominated by issue
1's rotation (`Ghostship` at `ofRegion` 0.96, `Faelan` at 0.93). So this issue's
claim rests on the stylesheet against the capture, which is the stronger evidence
anyway, and **not** on any pixel attribution. I am not claiming a share of the
score for it.

### The hypothesis

`tools/generate/src/cli/capture/extract.ts:565-573`, `rgbToHex`, whose own
comment states the behaviour as a deliberate contract:

```
  // #rrggbb for a painted colour, or null when fully transparent (unpainted, e.g.
  // a background-clip:text fill). Alpha is intentionally dropped: callers that
  // care about translucency use rgbaOf + composite() instead. Contract preserved
  // for every existing caller (text/border colour resolution).
```

The two callers that lose this bundle's values are `boxBorderOf`
(**extract.ts:1089-1101**, `rgbToHex(s['border'+side+'Color'])` at 1096, reached
for an image through `frameOf` -> `fieldBorder` at **2461**) and the run colour at
**extract.ts:2295** (`var resolvedColor = rgbToHex(s.color)`).

That contract was right when nothing downstream could hold an alpha. It is not
right now: REQ-331 added `colorToHexAlpha`
(`tools/generate/src/cli/capture/color-values.ts:68-86`) for exactly this and
opted **only** `foldShadow` into it — *"Every other caller keeps today's opaque
behaviour unless it opts in."* A border colour and a text colour are the two
remaining callers the comment names, and they are the two this page loses.

The dependent fold half: `foldBorder`
(**tools/generate/src/l1/fold.ts:922-929**) and `foldBorderLeftAxis`
(**1868-1873**) call `colorToHex`, which truncates an 8-digit literal to six
(`color-values.ts:36`, `h.slice(0, 6)`). So even a capture that kept the alpha
would have it removed again at the fold. Both sites change together or neither
shows.

### The proposed change

1. `extract.ts`: add an alpha-preserving sibling of `rgbToHex` (the pixel-probe
   path in `rgbaOf` already returns the fourth channel) and use it for
   `boxBorderOf`'s colour, `outlineOf`'s colour and the run colour at 2295.
   Emitting `#rrggbb` when alpha is 255 keeps every existing value byte-identical,
   which is what `colorToHexAlpha` already does — so this is not a
   re-capture-the-world change, it only adds digits where there were digits to
   add.
2. `fold.ts`: `foldBorder` / `foldBorderLeftAxis` use `colorToHexAlpha` instead of
   `colorToHex`; the text-colour path likewise.
3. Give the image pass in `values-diff.ts` a `border` axis so the next instance is
   reported rather than found by hand. **This will raise the delta count**, and on
   this bundle it should raise it by exactly one until 1 and 2 land.

### How to see it, and how to know it is fixed

```
# the source says 30% white, the capture says opaque
grep -o "border:4px solid [^;}]*" $REF/assets/index.BM9-dqc-.css
#   4px solid rgba(255,255,255,.3)
python3 -c "import json;c=json.load(open('$REF/capture.json'));\
f=c['sections'][0]['fields'][0];print(f['alt'], f['borderWidthPx'], f['borderColor'])"
#   wrong (today): Faelan 4 #ffffff
#   right:         Faelan 4 #ffffff4d

# the same for the paragraph colour
grep -o "color:#ffffffe6" $REF/assets/index.BM9-dqc-.css
python3 -c "import json;c=json.load(open('$REF/capture.json'));\
print([(r['text'], r['color']) for r in c['sections'][0]['content'][1:4]])"
#   wrong (today): [('Artist • ', '#ffffff'), ('Musician', '#ffffff'), (' • Creator', '#ffffff')]
#   right:         the same three runs at '#ffffffe6'

# what the reproduction paints (after a re-capture and a refold)
grep -o "border:[^;}]*" $ITER/site/home.html | sort -u
#   wrong (today): border: 4px solid #ffffff
#   right:         border: 4px solid #ffffff4d
```

**This one needs a [recapture].** `1c refold` re-derives the fold from the oracle
the bundle already holds, and the oracle is where the alpha was lost, so a refold
can never show this fix. Land it, re-capture, then re-run the gate.

---

## Issue 3 — `foldResiduals` is empty while the fold drops an axis it has the vocabulary to name

**Residual class:** `fold-residuals-are-silent-about-an-axis-dropped-from-an-emitted-element`
**`defect_class`: `instrument-blind`** — `1c l1-gate --ref $REF --json` reports
`"foldResiduals": []` on HEAD, on a fold that dropped four rotations it can
already print the name of. The score is not wrong, it is empty.

This is the cheapest issue here and it is the reason issue 1 cost a round to
find. It is listed last because fixing it changes no pixel; it is listed at all
because without it the next dropped axis will cost another round the same way.

### The evidence

`capturedAxesOf` (**tools/generate/src/l1/fold.ts:1535-1557**) is the fold's
vocabulary for *"I saw this painted axis and could not carry it"*, and
`transformRotateDeg` is **already in it**:

```
  has('maskEdge', el.maskEdge)
  has('transformRotateDeg', el.transformRotateDeg)                       // fold.ts:1553
  if (el.transformScale !== undefined && el.transformScale !== 1) axes.push('transformScale')
```

But the only route to it is `signal(...)`, which is reached from the branches that
`continue` **past** an element — *"Best-effort object kind for a residual an
element that has no L1 leaf yet"* (1530), *"a structured signal for one captured
element the fold cannot yet express as an L1 leaf"* (120-119). The four
photographs were emitted as leaves, so no residual was ever considered for them,
so:

```
$ 1c l1-gate --ref $REF --json | python3 -c "import json,sys; print(json.load(sys.stdin)['foldResiduals'])"
[]
```

against a `capture.json` whose four image fields carry `transformRotateDeg` -5, 3,
-8 and 4. DOC-21 makes this list *the* completeness signal for the growth loop,
and on this bundle it reports that the fold lost nothing.

### The hypothesis

The residual is modelled per *element* (emitted / not emitted) when the thing it
describes is a per-*axis* fact. An element can be emitted faithfully in six axes
and lose the seventh, and today that is indistinguishable from losing nothing.

### The proposed change

Emit a residual for an **emitted** leaf too, listing the axes `capturedAxesOf`
found on the element that the node it produced does not carry — the set
difference, computed once, after the node is built. `FoldResidual` already has the
right shape for it (`kind`, `reason`, `capturedAxes`, `widths`); a `reason` of
`"axes dropped from an emitted image leaf"` would need no new type. Cap it to the
painted pixel-movers `capturedAxesOf` already enumerates, so it cannot become a
diff of every key.

### How to see it, and how to know it is fixed

```
1c l1-gate --ref $REF --json | python3 -c "import json,sys; print(json.load(sys.stdin)['foldResiduals'])"
#   wrong (today): []
#   right (before issue 1 lands): one residual naming kind 'image' and
#          capturedAxes including 'transformRotateDeg', for each of the four photos
#   right (after issue 1 lands):  [] again -- and for the true reason
```

The second line is the test that separates a real fix from a suppression: the
list must be non-empty **now** and empty **after** issue 1, and a change that
only ever prints `[]` passes neither.


---

## What landed — the implementation, and the decisions the filing did not state

All three issues are in one change, on one branch, in the order the summary table
asked for. What follows records the parts that are a **technical consequence** of
what was asked rather than something asked for directly, so the matrix has the
language for them.

### Issue 1 — `foldTransform`, read at every leaf branch

A single `foldTransform(el): L1Transform | undefined` beside `foldMask`, called
from all three leaf branches — **text, image and box** — because `transform` is a
node field on `nodeAxisGroupsShape`, not an image axis. The filing asked for this
(*"whoever fixes this should fix it where every leaf can reach it"*); the tests
pin a rotated run and a rotated panel alongside the four photographs.

Three decisions the filing left open:

- **The identity is not a transform.** `rotate(0deg)` / `scale(1)` move no pixel,
  and emitting one would cost a composite layer and promote the node into the
  positioned paint layer for nothing — the same reason `foldFilter` drops an
  identity function. So `rotateDeg === 0` and `scale === 1` yield no `transform`
  key at all, not a `transform` containing an identity.
- **An out-of-envelope value is DROPPED, not clamped.** `L1_ENVELOPE.rotateDeg` is
  ±3600 and `L1_ENVELOPE.transformScale` bounds the scale; `validateL1` *refuses*
  a document that breaches either, which would cost the whole fold — every element
  of it — over one absurd value on one node. A ten-turn rotation is also not a
  design that can be half-honoured, so the axis is dropped and the document still
  validates. **The drop is not silent: it is exactly what issue 3's residual
  reports**, which is how the two halves check each other.
- **Both terms are rounded to 2dp** (`round2`), on the same terms as every other
  captured length the fold carries — a computed-style rotation arrives with float
  noise and two spellings of one angle is drift.

The filing's *"will not create new layout findings"* is pinned as a measurement
rather than left as a promise: a turned photograph and an untouched one fold to
**identical geometry keyframes**, because a CSS transform paints outside the
layout box without changing it.

**One pre-existing expectation inverted.** `reconciliation-l1-fold-full-language.test.ts`
(AC-732) asserted `rotated.transform` was `undefined`, on the stated premise that
*"the pinned geometry is already post-transform, so these must NOT be folded"*.
That premise was true when it was written and is not now: **REQ-333 changed `box`
to the element's LAYOUT box, with the rotated rect recorded separately as
`clip`** — so replaying the rotation no longer applies it twice, it paints what the
page paints. The expectation moves with the premise, to `{ rotateDeg: 12, scale:
1.4 }` plus the two CSS terms. The **mask** half of that same assertion is
unchanged and still `undefined` (a feather is a box-shaped edge and a run is not
that box) — but it is no longer silent, because issue 3 now files a residual
naming `maskEdge` on that very leaf.

### Issue 2 — four stages move together, and none of them shows alone

1. **Capture** — `rgbToHexA`, an alpha-preserving sibling of `rgbToHex` inside
   `EXTRACT_SCRIPT`, used for the border colour (`boxBorderOf`), the **left-border
   accent chain** (`borderLeftColor`, which the filing did not name but is the same
   read and the same loss), the outline colour and the run colour. `rgbToHex` keeps
   its contract for the **composited** family — a colour the capture has already
   resolved against what sits behind it (a band fill, a palette sample) — which is
   what that contract was always right about.
2. **An opaque colour is still written in SIX digits**, not eight. This is what
   makes the change not a re-capture-the-world change: every value already recorded
   stays byte-identical and only gains digits where there were digits to add. It is
   also the spelling `colorToHexAlpha` already uses on the TS side — two spellings
   of one value is drift.
3. **Fold** — `foldBorder` and `foldBorderLeftAxis` use `colorToHexAlpha`. This is
   not merely a truncation fix: `colorToHex`'s hex branch takes three or six digits
   and **slices**, so it would have *re-flattened* the 8-digit literal the capture
   now writes. The **text-colour path needed no change** — `el.color` passes
   straight into the `color` axis without going through `colorToHex` — which is
   worth recording because the filing listed it as a site to change.
4. **Comparator** — the alpha is compared **beside** ΔEOK on both the `border` and
   the `color` axes. This is the consequence the filing did not state and without
   which nothing shows: `colorDistance` resolves each side through `colorToHex`, so
   ΔEOK alone reads `#ffffff4d` and `#ffffff` as the **same colour** and a
   30%-white ring reproduced solid white scores zero. REQ-331's `SHADOW_ALPHA_TOL`
   is therefore renamed `COLOR_ALPHA_TOL` and shared by all three axes — one
   tolerance because it is one question, and the alpha step is reported at the
   existing `color` / `border` axis rather than as a new axis, because it is the
   same value.
5. **Object card** — `border` is a **fixed** row on the image card, not an
   appended-on-delta one. A border delta did reach the card once one fired (the
   append pass catches any unmapped property), so the gap was never that it could
   not appear — it was that a reader could not see the ring **on either side** to
   notice the two disagreed. A fixed row says what both sides painted even when
   they agree.

**Two false-positive guards** are pinned: the same translucency on both sides is
not a delta, and an opaque colour compares exactly as it did before.

### Issue 3 — the residual becomes a per-axis fact

`signalDropped(el, node, widths)` beside the existing `signal(...)`, called at all
three leaf branches after the node is built. It reports the set difference between
what `capturedAxesOf` found on the element and what the node the fold produced
actually carries — the filing's proposed shape, with two additions it did not
state:

- **`axisCarriedBy` returns THREE answers, not two.** `false` claims a drop, and a
  false claim is worse than silence here: this list is the completeness signal the
  growth loop reads (DOC-21), so a row nobody can act on costs more than a row
  that is missing. `undefined` is therefore the honest answer wherever the axis has
  no destination **on the node** — a text run's `surfaceFill` / `surfaceGradient` /
  `border` / `borderRadiusPx` / `boxShadow` are read off the enclosing card and
  carried by the card/band boxes rebuilt *after* the fold's loop, not by the text
  node; `intrinsicAspect` is a property of the asset with no L1 field; and
  `accessibleName` is a name, not a painted axis. Judging any of them from the node
  would file a residual for every run on every page with a background colour.
- **`CapturedAxis` is a named union rather than `string`**, and `axisCarriedBy` is
  an exhaustive switch over it. Adding an axis to `capturedAxesOf` is now a
  **compile error** until somebody says whether an emitted leaf carries it. That is
  the standing guard against the instrument going blind the same way twice —
  `transformRotateDeg` was already in that vocabulary and reported on nothing.

The vocabulary being per-axis means it reports **more** than the axis that sent
it: a `maskEdge` on a text run is folded by no text branch, and that is now an
audible framework gap rather than a silent one.

**Both directions are pinned, which is what separates a fix from a suppression:**
a dropped axis on an emitted leaf is named (a live instance, via the
out-of-envelope rotation above), and the four-photograph collage that issue 1
fixes reports `[]` — empty for the true reason, because the identical shape beside
it is not.

### Evidence

`tests/test_UAT_FC_REQ-336_a_turned_photograph_and_a_translucent_ring.test.ts` —
15 UATs across the three issues. The capture leg is driven through the **real
`EXTRACT_SCRIPT` under jsdom** rather than against a recorded artifact, because
the artifact is exactly what was wrong. Every number in it is faelan.com's own,
inlined rather than read, because the reference bundle is untracked.

Regression scope run green: 48 test files / 367 tests across the fold, capture,
values-diff, gate, L1-surface/envelope and residual-consumer suites, plus
`tsc --noEmit` on `tools/generate`.

**Issue 2 still needs a [recapture]** before this bundle's evidence moves, as
filed — `1c refold` re-derives the fold from an oracle whose alpha was already
lost. Issue 1 needs only a `1c refold`.