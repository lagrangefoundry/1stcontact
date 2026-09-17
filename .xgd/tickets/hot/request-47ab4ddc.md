---
uid: request-47ab4ddc
id: REQ-265
type: request
title: 'fold: inline-boxed text runs lose their half-leading, so the glyphs paint
  above the reference'
created_by: martin-github@westhead.me
created_at: '2026-09-17T02:59:21.692738+00:00'
updated_at: '2026-09-17T22:15:06.583501+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cc9456bc
  commits:
  - working_sha: f4e70654d9b768bfb8370b84c9b049088036a0c1
    reconcile_sha: null
    main_sha: null
  version: 0.2.238
---

Loop 1, iteration 2 of `repro-gigabytealchemy-ai` against the stored reference
bundle `storage/references/gigabytealchemy.ai/index`.

`gate.json` verdict: **`pass`** — mean 0.69/255, 0.31% of pixels over threshold,
12 ranked regions, 2 value deltas, `l1Pass: true`.

A `pass` is not "nothing to find". **82% of the ranked pixel residual and the
only HIGH value delta have one cause, and it is in the fold.** A second,
independent residual accounts for another 17%.

## Summary

| # | residual class | kind | share of the 8025.02 total ranked region score |
|---|---|---|---|
| 1 | `fold-drops-half-leading-on-inline-boxed-text-runs` | **class 1** — engine shortfall | 6559.71 (82%), plus the only HIGH `values-diff` delta |
| 2 | `l1-has-no-placeholder-colour-axis` | **class 2** — L1 cannot express it | 1348.54 (17%) |

Issue 3 below is **not independent**: it is issue 1 seen through `values-diff`
instead of through pixels. It is listed so a later round does not re-file it, and
it must not be worked separately.

The two issues are independent of each other and can land in either order, but
issue 1 is worth roughly five times as much. The remaining ranked region (#12,
score 116.77 — 1.5% of the total) is explained in "What I checked and found
clean" and is not a defect.

Everything below is quoted out of a file on disk or is the output of a command
this round ran. Nothing is read off a screenshot.

### Paths used throughout

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2
SLUG=repro-gigabytealchemy-ai
```

---

## Issue 1 — the fold writes an inline run's *content-area* top as its L1 *line-box* top, so the glyphs paint half a leading too high

**Residual class:** `fold-drops-half-leading-on-inline-boxed-text-runs`

**Class: 1 — engine shortfall.** L1 can carry the value (a text leaf's geometry
`y` is a plain number) and the renderer honours it exactly. The fold puts the
wrong number in.

### The three questions, and what each returned

1. **Can L1 express it?** Yes. `l1GeometrySchema` keyframes carry `y` as a
   finite number; no new axis is needed. → not class 2.
2. **Is the value in the L1 document, and is it right?** It is in the document
   and it is **wrong**. → **class 1, stop here.**
   ```
   ./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json > /tmp/l1.json
   ```
   (redirect to a **file**, not a pipe — a pipe truncates it, see the companion
   `1c` bug filed this round.)

   The `Gigabyte Alchemy` text node's keyframe at width 1280 is
   `{"at":1280,"x":88,"y":79,"width":686,"atHeight":800}`, and the
   `Intentional Software` node's is `{"at":1280,"x":88,"y":318,...}`.

   `capture.json` `/sections[0]/content[0]` (`Gigabyte Alchemy`):
   ```json
   "box":             { "x": 88, "y": 79, "width": 685.3125, "height": 97 },
   "renderedTextBox": { "x": 88, "y": 79, "width": 685.3125, "height": 97 },
   "lineHeightPx": 90, "fontSizePx": 72, "fontFamily": "Cinzel, serif"
   ```
   `capture.json` `/sections[1]/content[0]` (`Intentional Software`):
   ```json
   "box":             { "x": 88, "y": 318, "width": ..., "height": 43 },
   "renderedTextBox": { "x": 88, "y": 318, "width": ..., "height": 43 },
   "lineHeightPx": 40, "fontSizePx": 36
   ```
   In **both** cases `box` is byte-identical to `renderedTextBox` and
   `box.height` is **not** a multiple of `lineHeightPx` (97 vs 90; 43 vs 40).
   That is the signature of an **inline** element: `getBoundingClientRect` on an
   inline box returns the *content area* (the font's ascent+descent at that
   size), not the line box. In `raw.html` both are exactly that — a wordmark
   inside `<a …><span style="background: linear-gradient(90deg,…); …">Gigabyte
   Alchemy</span></a>`, and a hero heading inside `<h1 …><span style="color:
   #FBBA72;">Intentional Software</span></h1>`.

   These are the **only two** of the 41 captured runs with that signature.
   Every other run's `box` is the block border box and differs from its
   `renderedTextBox` — e.g. `A Different Approach` has
   `box.y = 896, box.height = 40` but `renderedTextBox.y = 894, height = 43`.
   The fold takes `box.y = 896` there and is **right**.

### The named evidence

`values-diff.json`, the only HIGH delta:
```json
{ "text": "Gigabyte Alchemy → Intentional Software", "role": "gap",
  "property": "gap", "expected": "142px", "actual": "149px",
  "kind": "gap", "tier": "HIGH", "magnitude": 7, "severity": 3090.875 }
```
`149 - 142 = 7`, and `97 - 90 = 7`. The reproduction's wordmark box is its line
box (90 tall); the reference's is the inline content area (97 tall). The row
below it starts at the same absolute y on both sides — the gap differs only
because the box above it is 7px shorter.

`regions.json`, the five highest-ranked regions, all inside
`x ∈ [96, 784], y ∈ [80, 160]` — the wordmark:

| id | bbox | score | meanDiff |
|---|---|---|---|
| 1 | `(448, 96) 272×64` | 2194.43 | 48.77 |
| 2 | `(160, 96) 176×64` | 1224.71 | 48.99 |
| 3 | `(96, 80) 112×80` | 874.96 | 54.69 |
| 5 | `(336, 96) 96×64` | 725.38 | 60.45 |
| 9 | `(720, 96) 64×32` | 310.13 | 51.69 |

and two more at `y = 320` — the hero heading:

| id | bbox | score | meanDiff |
|---|---|---|---|
| 4 | `(224, 320) 192×32` | 789.03 | 39.45 |
| 8 | `(96, 320) 128×32` | 441.07 | 33.93 |

**These are pure vertical displacement, measured — not inferred.** Running a
±6px integer shift search of each stored `ours` crop against its `ref` crop:

| region | mean\|Δ\| as stored | best shift | mean\|Δ\| after |
|---|---|---|---|
| 1 | 27.21 | dx 0, **dy +4** | 1.54 |
| 2 | 34.05 | dx 0, **dy +4** | 2.47 |
| 3 | 30.15 | dx 0, **dy +4** | 2.98 |
| 5 | 30.86 | dx 0, **dy +4** | 2.57 |
| 9 | 21.86 | dx 0, **dy +4** | 2.20 |
| 4 | 26.16 | dx 0, **dy +2** | 1.94 |
| 8 | 23.04 | dx 0, **dy +2** | 0.86 |

A positive `dy` means the reproduction's glyphs must move **down** to align. No
colour, weight, family or letter-spacing difference survives the shift — the
residual collapses to ~1–3/255, i.e. anti-aliasing.

**The predicted offset matches the measured one exactly.** The renderer places
the line box at `y` and CSS centres the content area inside it with a half-leading
of `(lineHeight − contentHeight) / 2`:

| run | predicted `(lineHeight − box.height)/2` | measured |
|---|---|---|
| `Gigabyte Alchemy` | `(90 − 97)/2 = −3.5` | −4 (ours is 4px high) |
| `Intentional Software` | `(40 − 43)/2 = −1.5` | −2 (ours is 2px high) |

The rendered CSS confirms the renderer did exactly what L1 told it to:
```
.l1-16 { top: 79px;  width: auto; min-width: 686px }   /* <p class="l1-16">Gigabyte Alchemy */
.l1-16 { font-size: 72px }
.l1-16 { line-height: 90px }

.l1-17 { top: 318px; width: auto; min-width: 321px }   /* <p class="l1-17">Intentional Software */
.l1-17 { font-size: 36px }
.l1-17 { line-height: 40px }
```
(from `$ITER/site/home.html`)

Glyph content top, reproduction: `79 + (90 − 97)/2 = 75.5` against the
reference's `79`. Renderer: correct. L1: wrong number.

### Hypothesis — where it is

`tools/generate/src/l1/fold.ts`, `buildGeometry` (the keyframe builder at
~line 1886–1910):

```ts
const box = (useFlowBox ? c.element!.inlineBox : undefined) ?? c.element!.box!
const width = withHeight ? Math.round(box.width) : Math.ceil(box.width)
const kf: L1Keyframe = { at: c.width, x: Math.round(box.x), y: Math.round(box.y), width }
```

`box.y` is transcribed verbatim. For a block-level run that is the line-box top
and is correct; for an inline-boxed run it is the content-area top and is
half a leading away from the number the renderer needs. There is no correction
anywhere on the path, and `inlineBox` is not it — that is REQ-211's *flow-root*
rect for rejoining multi-fragment sentences, and the string `inlineBox` occurs
**0 times** in this bundle's `capture.json` and `multistate.json` (both runs
here are single-run flows).

This is precisely the failure mode `fold.ts`'s own header predicts of itself,
and which [[DOC-53]] §1.2 quotes: *"Any residual delta is a serializer bug or a
missing L1 axis — a framework fix, not a per-site one."* This one is the
serializer bug.

### Proposed change

For a text leaf whose captured `box` is an inline **content-area** rect rather
than a line box, convert it before writing the keyframe:

```
y = box.y + (box.height − lineCount × lineHeightPx) / 2
```

which for the two single-line runs here gives `79 + 3.5 = 82.5 → 83` and
`318 + 1.5 = 319.5 → 320`.

**How the fold should know the box is inline** — two options, and I would take
the second:

- *Cheap:* `box` deep-equals `renderedTextBox` **and** `box.height` is not a
  multiple of `lineHeightPx`. True for exactly the 2 affected runs and false for
  the other 39 in this bundle, so it is correct here — but it is the fold
  inferring a layout mode from a coincidence of two rects, and it will
  mis-fire on a block run whose single line happens to make the two rects equal.
- *Durable:* have the capture record it. `extract.ts` already reads computed
  styles per element; a boolean (`inlineContentBox`, set when the computed
  `display` begins with `inline`) or the raw `display` string makes this a fact
  the fold reads instead of a guess. Optional on the type so pre-existing
  bundles still parse, with the fold falling back to today's behaviour when the
  field is absent.

Note the reproduction's box will still be 90px tall where the reference's is 97
— a box-model difference, invisible to the pixels, that the `gap` axis measures
(see issue 3).

### How to see it

```
REF=/Users/martin/lagrangefoundry/1stcontact/storage/references/gigabytealchemy.ai/index

# 1. The wrong number, straight out of L1 (redirect to a FILE, never a pipe):
./bin/1c page get repro-gigabytealchemy-ai home --sandbox --json > /tmp/l1.json
python3 -c "import json;d=json.load(open('/tmp/l1.json'))['data']['page']['l1'];
n=[x for x in d['root']['children'] if x.get('text')=='Gigabyte Alchemy'][0];
print([k for k in n['geometry']['keyframes'] if k['at']==1280])"
```
**Wrong result (now):** `[{'at': 1280, 'x': 88, 'y': 79, 'width': 686, 'atHeight': 800}]`
**Right result (fixed):** the same keyframe with `'y': 83` (`Intentional
Software` likewise moves `318 → 320`).

```
# 2. The pixels. `1c gate` drives Chromium; an agent sandbox denies Chromium's
#    Mach port registration, so the --single-process prefix is required or it
#    dies with `bootstrap_check_in … Permission denied (1100)` before the first frame.
CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-gigabytealchemy-ai \
  --ref $REF --sandbox --out /tmp/gate-check --json
```
**Wrong result (now):** `regions.json` ranks five regions in `y ∈ [80,160]`
(scores 2194.43, 1224.71, 874.96, 725.38, 310.13) and two at `y = 320`
(789.03, 441.07), each with `meanDiff` between 33 and 61.
**Right result (fixed):** those seven regions leave the ranked list, or their
`meanDiff` collapses from ~33–61 to ~1–3. Total ranked score should fall from
8025.02 to roughly 1465 (issue 2's four regions plus region 12).

```
# 3. The offline measurement, reproducible on the stored crops (needs numpy+PIL):
python3 - <<'EOF'
import numpy as np
from PIL import Image
D='/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/diff'
for r in (1,2,3,5,9,4,8):
    a=np.asarray(Image.open(f'{D}/region-{r}-ref.png').convert('RGB')).astype(int)
    b=np.asarray(Image.open(f'{D}/region-{r}-ours.png').convert('RGB')).astype(int)
    h,w,_=a.shape; m=6 if min(h,w)>12 else 1
    best=min(((np.abs(a[m:h-m,m:w-m]-np.roll(np.roll(b,dy,0),dx,1)[m:h-m,m:w-m]).mean(),dx,dy)
              for dy in range(-6,7) for dx in range(-6,7)))
    print(r, 'as-stored', round(np.abs(a-b).mean(),2), '-> best', best)
EOF
```
**Wrong result (now):** every region's best alignment is `dy = +4` (regions
1,2,3,5,9) or `dy = +2` (regions 4,8), residual 0.86–2.98.
**Right result (fixed):** re-shoot the crops after the fix; the best alignment
is `dy = 0` and the as-stored mean is already ~1–3.

After a fold change, re-derive and re-import before re-gating:
```
./bin/1c refold --ref $REF
./bin/1c repro repro-gigabytealchemy-ai --ref $REF --sandbox
```

---

## Issue 2 — L1 has no way to author a control's placeholder colour, so every placeholder paints at the field's full text colour

**Residual class:** `l1-has-no-placeholder-colour-axis`

**Class: 2 — L1 cannot express it.** There is no axis for it, and the renderer
hard-codes a value in its place.

### The three questions

1. **Can L1 express it?** **No — stop here, class 2.**
   `packages/site-schema/src/l1/schema.ts`: `l1ControlSchema` takes
   `axes: l1TextAxesSchema.optional()` (line 1356, *"a control is a styled
   text-bearing leaf (a placeholder, a button label)"*). `l1TextAxesSchema`
   (lines 1057–1127) declares `color`, `fontFamily`, `fontSizePx`, `fontWeight`,
   `lineHeightPx`, `letterSpacingPx`, `textAlign`, `textTransform`, `fontStyle`,
   `nowrapFromPx`, `gradientFill`, `textDecoration`, `textShadow`,
   `fontVariantCaps`, `listMarker`, and the surface axes — **no placeholder
   field of any kind**. The bag closes with `.strict()` (line 1127), so
   `validateL1` refuses an unknown `placeholderColor` outright rather than
   ignoring it.

   Setting the control's `color` is not an escape: it is the colour of the
   *typed* text as well, so authoring the reference's grey placeholder would
   make typed input grey too. There is no pair of L1 values that produces the
   reference.

### The named evidence

`gate.json` verdict `pass`; the four lowest-ranked substantive regions in
`regions.json` all sit inside a form control:

| id | bbox | score | meanDiff | control (`values-diff.json` `objects[].params.box`) |
|---|---|---|---|---|
| 6 | `(672, 3920) 112×32` | 469.17 | 42.65 | `Your message` textarea `(664, 3916) 528×146` |
| 7 | `(96, 3920) 144×16` | 453.14 | 50.35 | `Your email address` `(88, 3900) 313×50` |
| 10 | `(672, 3872) 80×16` | 240.32 | 48.06 | `Your email` `(664, 3850) 528×50` |
| 11 | `(672, 3808) 80×16` | 185.91 | 37.18 | `Your name` `(664, 3784) 528×50` |

Unlike issue 1's regions, **no integer shift explains these**: the ±6px search
above bottoms out at 18.69 (region 6) and 40.14 (region 7) against an as-stored
27–48. It is a colour difference.

Colour histogram of the stored crops (every pixel counted, not eyeballed):

| region | reference top two colours | reproduction top two colours |
|---|---|---|
| 6 | `#e8dfd3` ×2927, **`#746f69` ×143** | `#e8dfd3` ×2970, **`#000000` ×131** |
| 7 | `#e8dfd3` ×1451, **`#746f69` ×211** | `#e8dfd3` ×1476, **`#000000` ×203** |
| 10 | `#e8dfd3` ×872, **`#746f69` ×100** | `#e8dfd3` ×877, **`#000000` ×100** |
| 11 | `#e8dfd3` ×990, **`#746f69` ×79** | `#e8dfd3` ×974, **`#000000` ×82** |

The glyph pixel counts match almost exactly (143/131, 211/203, 100/100, 79/82) —
same text, same position, same size. Only the ink colour differs:
**`#746f69` in the reference, `#000000` in the reproduction.**

`#746f69` is `(116, 111, 105)`, which is exactly 50% of the band colour
`#e8dfd3` = `(232, 223, 211)` — i.e. the reference's fields carry no
`::placeholder` rule at all (`raw.html`: `<input type="email"
placeholder="Your email address" class="flex-1 px-4 py-3 border rounded-lg …">`)
and keep the UA default, which paints at ~half alpha over the transparent
field's backdrop.

The reproduction overrides it. `$ITER/site/home.html` emits, four times:
```css
…::placeholder { color: inherit; opacity: 1 }
```

**`values-diff` is blind to this.** All four controls report `"deltaCount": 0`
and compare only `name`, `nameSource` and `box`. The perceptual eye is the only
instrument that saw it.

### Hypothesis — where it is

`packages/framework/src/l1/render.ts:3050–3057`:

```ts
// A placeholder is painted by a UA pseudo-element that does NOT inherit
// `color`, so an L1 subtree that set a field's text colour would still get
// the browser's grey inside the box. Re-point it at the element's own
// colour — the reference's placeholder-labelled field then paints from L1
// like every other run.
if (el.tag === 'input' || el.tag === 'textarea') {
  state.rules.push({ selector: `${selector}::placeholder`, decls: ['color: inherit', 'opacity: 1'] })
}
```

This is deliberate and it is pinned by three UATs
(`tests/reconciliation-l1-control-and-texture.test.ts:226–231`,
`tests/req96-control-composition.test.ts:241–245`). The reasoning is sound for a
*designed* site: an author who sets a field's colour expects the placeholder to
follow. It is wrong for a *reproduction*, where the reference deliberately left
the UA default in place and there is no L1 value that can say so.

The capture side is empty too: `forms.json` records only
`{name, label, type, labelMode}` per field, and neither `capture.json` nor
`multistate.json` records any placeholder colour. Even with an axis, the fold
would have nothing to write until the capture reads it.

### Proposed change

Three parts, in order — each is useful on its own:

1. **Capture** — record the control's placeholder colour.
   `getComputedStyle(el, '::placeholder').color` resolves in Chromium; store it
   as an optional field alongside the existing field descriptors so pre-existing
   bundles still parse. (A `1c refold --ref <bundle>` is not enough here: this
   needs a re-capture, because the value is not in `multistate.json` at all.)
2. **L1** — add an optional `placeholderColor: l1Color.optional()` to the
   control's axes. Optional keeps every existing document valid; `.strict()`
   then accepts it.
3. **Renderer** — at `render.ts:3056`, emit `color: <placeholderColor>` when the
   axis is present and keep today's `color: inherit; opacity: 1` when it is
   absent. The three existing UATs continue to describe the no-axis case; add
   one for the axis-present case.

Worth doing at the same time, and cheap: teach `values-diff`'s control
comparison to carry the placeholder colour as a param, so the next occurrence
is caught by the sharp instrument rather than by the pixel eye.

### How to see it

```
ITER=/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2

# 1. The hard-coded override in the rendered output:
grep -o '::placeholder[^}]*}' $ITER/site/home.html | head -1
```
**Wrong result (now):** `::placeholder { color: inherit; opacity: 1 }`
**Right result (fixed):** `::placeholder { color: #746f69 }` — the captured value.

```
# 2. The measured colours, from the stored crops:
python3 - <<'EOF'
import numpy as np
from PIL import Image
from collections import Counter
D='/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-2/diff'
for r in (6,7,10,11):
    for w in ('ref','ours'):
        a=np.asarray(Image.open(f'{D}/region-{r}-{w}.png').convert('RGB'))
        print(r, w, [(f'#{x:02x}{y:02x}{z:02x}',n) for (x,y,z),n in
                     Counter(map(tuple,a.reshape(-1,3))).most_common(2)])
EOF
```
**Wrong result (now):** the reproduction's second-commonest colour is
`#000000` in all four regions.
**Right result (fixed):** it is `#746f69`, matching the reference, and the four
regions leave `regions.json` (−1348.54 from the total ranked score).

```
# 3. That no L1 document can say it today:
grep -n "placeholder" packages/site-schema/src/l1/schema.ts
```
**Wrong result (now):** three hits, all in prose comments — no schema field.
**Right result (fixed):** a `placeholderColor` entry inside `l1TextAxesSchema`
(or the control's own axis bag).

---

## Issue 3 — the HIGH `gap` delta is issue 1, not a separate defect

**Do not work this separately. It closes when issue 1 closes.**

`values-diff.json`:
```json
{ "text": "Gigabyte Alchemy → Intentional Software", "property": "gap",
  "expected": "142px", "actual": "149px", "tier": "HIGH", "magnitude": 7 }
```

The 7px is `box.height − lineHeightPx = 97 − 90` for the wordmark, exactly as
in issue 1. Reference: wordmark box bottom `79 + 97 = 176`, next row top `318`,
gap `142`. Reproduction: wordmark box bottom `79 + 90 = 169`, next row top
`318`, gap `149`. The row below starts at the same absolute y on both sides.

Once issue 1 moves the wordmark to `y = 83` and the hero heading to `y = 320`,
the reproduction's gap becomes `320 − (83 + 90) = 147` against the reference's
`142` — a residual 5px, inside the default `gapTolerancePx` of 6
(`values-diff.ts:1991`), so the delta should disappear from `deltas`.

It will **not** reach exactly 142, and that is expected rather than a further
defect: the reproduction's wordmark box is its line box (90px) where the
reference's is the inline content area (97px). That difference is real in the
box model and invisible in the pixels. If a later change makes the `gap` axis
stricter, the right fix is to compare glyph rects rather than to move the
wordmark further.

---

## What I checked and found clean — so a later round need not re-derive it

- **The wordmark's text-fill gradient is correct end to end.** This was REQ-31's
  headline residual on this exact site ("vertical vs horizontal wordmark
  gradient"); it is fixed and it stayed fixed.
  `raw.html`: `background: linear-gradient(90deg, #F5E6A3 0%, #F5E6A3 60%,
  #FF8C42 90%, #FF6B35 100%)` → `capture.json` `gradient.angleDeg: 90` with four
  stops at 0/60/90/100 → L1 `axes.gradientFill` with the same angle and stops →
  rendered `.l1-16 { background-image: linear-gradient(90deg, #f5e6a3 0%,
  #f5e6a3 60%, #ff8c42 90%, #ff6b35 100%); -webkit-background-clip: text;
  background-clip: text; -webkit-text-fill-color: transparent }`. The ±6px shift
  search bears this out: after alignment the wordmark residual is 1.54–2.98/255,
  so nothing about its *paint* is wrong.
- **The hero background image is carried, not dropped.** `gate.json`'s
  `unreferenced-image` coverage finding on `assets/AlchemistLabWithTech.png` is a
  **false positive of the gate**, already filed as **BUG-100**
  (`coverage-check-misses-section-background-images`) from iteration 1; this
  round's evidence has been appended there rather than re-filed. The L1 carries
  it as `section-bg-0` with
  `{"backgroundImageUrl": "/assets/AlchemistLabWithTech.png", "overlay":
  {"color": "#030717", "opacity": 0.3}}`, and the render emits
  `.l1-7 { background-image: linear-gradient(#0307174d, #0307174d),
  url("assets/AlchemistLabWithTech.png"); background-size: cover; … }`.
  **Note:** `ai/evidence-digest.md` states *"the reproduction's own L1 names it
  at: **nowhere**"*. That is false, and it is a console defect, filed separately
  this round — the digest read a `page.json` that had been truncated to exactly
  65536 bytes and was not parseable JSON.
- **Region #12** (`(128, 3344) 64×16`, score 116.77, 1.5% of the total) aligns
  at `dy = +1` with a residual of **0.00** — a one-pixel rounding difference with
  a perfect match after the shift. Not a defect.
- **Fonts are right.** Only one `.woff2` is mirrored, which looks like a
  shortfall and is not: `assets/css2` declares Cinzel 400, 600 and 700 all
  pointing at the same two URLs (a latin / latin-ext subset pair), and the
  mirrored file `8vIJ7ww63mVu7gt79mT7PkRXMw.woff2` is the latin one the wordmark
  uses. The render emits `@font-face { font-family: "Cinzel"; src:
  url("assets/8vIJ7ww63mVu7gt79mT7PkRXMw.woff2") format("woff2");
  font-weight: 600; font-display: swap }`, and `values-diff` matches
  `fontFamily`, `fontSizePx` and `fontWeight` on all 59 paired runs.
- **The `§0 contentAnchor` LOW delta (`bottom (0.66)` → `center (0.50)`) is
  most likely an artifact of the instrument, not an engine residual**, and is
  filed as a separate `1c` bug this round: `values-diff` joins section-level
  values by ordinal index, the reference manifest has **8** sections while the
  reproduction's L1 has **6** `section-band-*` nodes, and the reference's `§0`
  is the 192px-tall absolutely-positioned header strip that overlaps its `§1`
  hero. I could not close this conclusively from the stored evidence because
  `values-diff.json` does not persist the actual side's section manifest and
  there is no CLI flag to dump it — which is the second half of that bug.

## Related

[[DOC-53]] §1.2 (the fold and its own thesis), §1.6 (background imagery is
`backgroundImageUrl`, never `src`) · [[DOC-19]] · [[DOC-23]] · [[DOC-27]] ·
[[DOC-30]] · [[EPIC-12]] §7.1

## Companion tickets filed by the same round

- **BUG-101** — `1c`'s `process.exit` truncates piped stdout at 64 KiB. **Read
  this before you start.** It is why every command in this ticket redirects
  `1c page get` to a file rather than piping it, and it is why the round's
  `ai/evidence-digest.md` says the hero background image is in the L1
  "nowhere".
- **BUG-100** — the gate's `unreferenced-image` coverage finding on
  `assets/AlchemistLabWithTech.png` is a false positive. This round's evidence
  is appended there.
- **BUG-102** — `values-diff` joins section-level values by ordinal index; the
  `§0 contentAnchor` delta is its artifact.
- **BUG-103** — no flag writes the reproduction-side value manifest, which is
  why BUG-102 could not be closed conclusively from stored evidence.


---

# What landed

Both issues are closed. Issue 3 closes with issue 1, as predicted. Three things
below differ from the "Proposed change" sections above; each is stated with the
reason, because the difference is the design decision.

## Issue 1 — the conversion happens at CAPTURE, not in the fold

**This is a deviation from both options the ticket proposed, and it is
deliberate.** Both proposals put the correction in `fold.ts`; neither is what
landed.

What landed instead: **a text run's captured `box` IS the line box it occupies.**
The normalisation is one function, `lineBoxOf`, in the page-scope extract script,
applied where the run's box is chosen. A block element's rect already is a line
box top, so it is returned untouched; an inline element's rect is its content
area, so it is converted by the half-leading the computed style has in hand.

Three reasons for moving it:

- **The resolving value only exists in the page.** The half-leading is
  `(lineHeight − contentHeight) / 2`, and `contentHeight` is a fragment rect that
  no serialised bundle carries. Converting downstream means re-deriving it from
  values that were never captured.
- **Every downstream consumer already meant "line box".** The fold pins `box.y`
  as the L1 leaf's `y`; `values-diff` measures `position` and the inter-row `gap`
  from the same rect. Converting once at the source is one edit; converting per
  consumer is three, each inferring a layout mode it cannot see.
- **It closes the ticket's own objection to option A.** The cheap heuristic
  (`box` deep-equals `renderedTextBox` and `box.height` is not a multiple of
  `lineHeightPx`) is the fold inferring a layout mode from a coincidence of two
  rects. `lineBoxOf` reads `display` and `line-height` directly — a fact, not a
  coincidence.

The content area is **not lost**: it remains `renderedTextBox`, which for the two
affected gigabytealchemy runs is exactly the rect this replaces.

**Guards, each of which leaves today's rect untouched rather than guessing:** a
`display` that is not `inline`; a `line-height: normal`, whose used value is a
font metric no computed style exposes; a zero-size or fragment-less rect. The
element's own vertical padding and border come off the fragment rect before what
is left is called a content area (a fragment's rect is its *border* box). A
wrapped inline run gets `rects.length` line boxes, not one.

**Both signs are proved, not just the reference's.** The reference showed the
negative half-leading (content area *taller* than the line box, glyphs painting
high). A line box roomier than its content area corrects the other way, and the
fixture carries one of each.

### Consequence for stored bundles — a re-capture, not a `refold`

The ticket's "How to see it" says `1c refold --ref $REF`. **That is not enough
for issue 1.** `cmdRefold` replays the retained `multistate.json` oracle — "a
refold changes what we DERIVE, never what we OBSERVED" — and the old content-area
rects are in that oracle. Applying this needs `1c capture page <url>` (or an
offline `reextractFromBundle`, which re-runs the extract script against the
bundle's own mirrored bytes). The issue-2 half needs a re-capture for the same
reason the ticket already states.

### Documentation moved with the meaning

`RawGeometry.box` and `ElementGeometry.box` now say what they hold. A field whose
meaning silently depended on a layout mode is the defect; leaving the doc comment
saying `getBoundingClientRect()` would leave the defect in place with the
arithmetic corrected.

## Issue 2 — the axis is a control-specific extension, and the capture resolves and composites

### The axis: `l1ControlAxesSchema`, not a member of `l1TextAxesSchema`

**Deviation.** The ticket proposed `placeholderColor` inside `l1TextAxesSchema`.
It landed as `l1ControlAxesSchema = l1TextAxesSchema.extend({ placeholderColor })`,
carried by `l1ControlSchema` only, because a text run has no placeholder: on the
text bag the axis would be inert in every document ever written, and would still
have to be read, documented and validated there. The bag is still `.strict()` —
it gained one name, not permission.

### The capture: two failure modes the ticket's one-liner does not survive

`getComputedStyle(el, '::placeholder').color` is the right read, and taking its
value as it stands loses the measurement in two measured ways:

- **It is not always an `rgb()` string.** Tailwind v4's preflight paints a
  placeholder with `color-mix(in oklab, currentColor 50%, transparent)`, whose
  computed value serialises as `oklab(… / 0.5)`. The existing `rgbaOf` regex
  reads nothing there and the value is dropped silently — REQ-52's lesson
  arriving in a second place. A 1×1 canvas is the resolver: Chromium hands the
  oklab token straight back from both `getComputedStyle` and `ctx.fillStyle`, but
  *painting* it and reading the pixel back gives exact sRGB bytes for every space
  the engine understands. Reached only when the cheap regex fails, so the common
  case pays nothing.
- **It is sometimes translucent.** Both shapes are real and measured — Chromium's
  own default computes *opaque* (`rgb(117, 117, 117)`), while the Tailwind rule
  above is half-alpha — so neither compositing unconditionally nor taking the
  declared value unconditionally is right. A translucent ink is composited over
  what the field sits on, for the reason `surfaceFillOf` already composites: a
  half-alpha ink over a backdrop is not the colour the eye reads.

Null when the control has no placeholder to paint, and for every non-control
element. Optional on `RawField`, `Field` and `ValueElement`, so a pre-REQ-265
bundle still parses.

### The fold authors it

Not named in the ticket, and required for the chain to close: `foldToL1`'s
control branch writes the captured `placeholderColor` onto the control's axes
alongside the chip axes it already writes. Without it the capture reads a value
that reaches no document.

### The renderer

`color: <placeholderColor>` when the axis is present; the pre-REQ-265
`color: inherit` when it is absent, so every existing document renders exactly as
it did — which is what the three UATs that pin that default continue to describe.
`opacity: 1` is kept in **both** branches: an authored ink is the composited
colour the reference paints, not a value to fade again.

### `values-diff` can finally see it

As the ticket suggested, and slightly further: `placeholderColor` is a
`DeltaProperty` of kind `color`, compared by ΔE against the same tolerance as any
other ink, and a param of the `control` object so it is visible in the object
table rather than only in a delta. Compared **only when both sides recorded one**,
so a reference captured before this value existed stays inert rather than
reporting every reproduction's placeholder as wrong.

## Evidence

`tests/req265-line-box-and-placeholder-ink.test.ts` — nine UATs against
`tests/fixtures/capture/req265-line-box-and-placeholder.html`, a committed
fixture served over an ephemeral loopback server (no third-party site is hit).
The four browser UATs drive a real headless Chromium and are gated on
`chromiumAvailable()`; the rest pin the downstream consequences with no browser.

| UAT | pins |
|---|---|
| `inline_run_box_is_its_line_box` | an inline run's `box` is one line-height tall, `renderedTextBox` still holds the content area, and the two share a centre line — the conversion stated as the invariant it is |
| `inline_run_line_box_is_corrected_in_both_directions` | the roomier line box, so the correction is proved with the other sign |
| `block_run_box_is_still_its_border_box` | a block run's box is still the border box, padding intact — the conversion did not leak onto the block path |
| `fold_pins_the_line_box_the_capture_recorded` | the ticket's stated right answer: the gigabytealchemy wordmark folds to `y = 83`, not `79` |
| `capture_records_the_placeholder_ink` | an authored opaque ink verbatim; the engine's own default; the oklab half-alpha ink resolved *and* composited, bracketed strictly between the ink and the band; and nothing invented for a control with no placeholder |
| `l1_accepts_a_placeholder_colour_on_a_control` | the axis validates, and the bag is still closed |
| `renderer_paints_the_authored_placeholder_ink` | the authored ink is painted, the typed text keeps its own colour, and the absent case is unchanged |
| `fold_authors_the_captured_placeholder_ink` | the capture's value reaches the control's axes |
| `values_diff_reports_a_placeholder_ink_difference` | the gigabytealchemy shape is reported; agreement is silent; a pre-REQ-265 reference stays inert |

## Files

| file | change |
|---|---|
| `tools/generate/src/cli/capture/extract.ts` | `lineBoxOf`; `resolvedRgba`; `placeholderColorOf`; `RawField.placeholderColor`; `RawGeometry.box` doc |
| `tools/generate/src/cli/capture/types.ts` | `Field.placeholderColor`; `ElementGeometry.box` doc |
| `tools/generate/src/cli/capture/sections.ts` | carry `placeholderColor` onto `Field` |
| `tools/generate/src/cli/capture/values-diff.ts` | `ValueElement.placeholderColor`; the `placeholderColor` delta property, its kind, its type, its control param, and the comparison |
| `packages/site-schema/src/l1/schema.ts` | `l1ControlAxesSchema`; `l1ControlSchema.axes` reads it |
| `packages/site-schema/src/l1/types.ts` | `L1ControlAxes` |
| `packages/framework/src/l1/render.ts` | paint the authored placeholder ink, default unchanged |
| `tools/generate/src/l1/fold.ts` | author `placeholderColor` onto a folded control |

## Regression scope run

Typecheck clean across `packages/site-schema`, `packages/framework` and
`tools/generate`. Green: the new file (9/9), the control/texture and
`req96-control-composition` UATs that pin the placeholder default, `bug21`/`bug22`
control surfaces, the fold suites, the seven `values-diff` suites, the L1
substrate and authoring-envelope suites, the behavior-module and contact-form
suites, and the edit-render channel suites.

Four failures are **pre-existing on a clean `xgd-working` tree** and were
confirmed there, not introduced here — all one class, `driverFactory was not
supplied`: `capture.test.ts` (`REQ-12_style_segmentation`,
`REQ-12_offline_reextraction`), `reconciliation-l1-fold.test.ts` and
`req83-capture-to-l1-fold.test.ts` (both `_hints`).