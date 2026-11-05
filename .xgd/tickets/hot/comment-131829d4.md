---
uid: comment-131829d4
id: COMMENT-3961
type: comment
title: Comment on request REQ-265
created_by: xgd
created_at: '2026-09-26T19:50:42.604788+00:00'
updated_at: '2026-09-26T19:50:42.604788+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-47ab4ddc
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#1` — iteration 1 re-measurement of the half-leading class on a third bundle (joyfulculinarycreations.com), where its cost is not the 11px ink lift but a **−43.2px shift of every element on the page below the hero**.

Third sighting, third bundle. The mechanism is exactly the one this ticket describes; what is new is
the magnitude and, more importantly, **which half of it is expensive**. REQ-331's append already
warned that the proposed fix corrects only the top and not the height. On this bundle the height is
essentially all of the cost, so a fix that only moves the glyphs down 11px would close 1 delta and
leave 73.

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  (`capturedAt` `2026-09-26T19:06:28.966Z`, `captureSchema` 6; nothing has landed in the engine since,
  so this is a live measurement, not a stale-bundle artifact)
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-1/`
- `gate.json`: `"verdict": "structural-failure"`, perceptual mean 35.91/255 over 32.09% of pixels,
  `values.deltas` 122

## The source element

`storage/references/joyfulculinarycreations.com/index/raw.html` — the hero heading is **one** `<h1>`
with four line boxes, two of them empty:

```html
<h1 class="elementor-heading-title elementor-size-small"><br><br>Dreaming of healthier meals <br>on your dinner table?</h1>
```

so the extractor records it as two per-line runs, and each run's `box` is the **ink box**, not the
line box:

| | `fontSizePx` | `lineHeightPx` | `box` | `renderedTextBox` |
|---|---|---|---|---|
| ref `elements[6]` | 65 | **75.4** | `{20, 311.296875, 815.203125, **97**}` | identical to `box` |
| ref `elements[7]` | 65 | **75.4** | `{20, 386.703125, 631.21875, **97**}` | identical to `box` |

97 / 75.4 = 1.286. **These two runs are the only ones in either manifest whose single-line box height
differs from its own line-height.** I checked all 71 texted runs on both sides: every other one has
`box.height == lineHeightPx × lines` exactly, on both sides. So this is not a systemic units mismatch;
it is specifically an inline box whose content area exceeds its line box, which is the case this
ticket is about.

## What the fold did with it, and what the renderer gave back

The fold computes the inter-line lead in the reference's ink coordinates:

```
386.703125 − (311.296875 + 97) = −21.59375
```

and writes it verbatim. `page.json`, `0.0.0.3.0.0.1` geometry keyframe at 1280:

```json
{"at": 1280, "x": 20, "y": -21.6, "width": 631.22, "atHeight": 800}
```

served as, `iteration-1/site/index.html`:

```css
.l1-10 { margin-top: calc(-21.6px + (0 * (100vw - 1280px) / 160)); … }
.l1-10 { line-height: calc(75.4px + (0 * (100vw - 1280px) / 160)) }
```

But **no text keyframe carries a height** — all six keyframes of both runs are
`{at, x, y, width, atHeight}` and nothing else — so the rendered box is the *line* box:

| | `box` | `renderedTextBox` |
|---|---|---|
| act `elements[0]` | `{20, 311.28125, 815.203125, **75.40625**}` | `{20, **300.28125**, 815.203125, **97**}` |
| act `elements[1]` | `{20, 365.09375, 631.21875, **75.40625**}` | `{20, 354.09375, 631.21875, **97**}` |

Two separate errors fall out of the one cause:

1. **The ink lift this ticket names.** `311.296875 − 300.28125 = 11.015625px` — half of
   (97 − 75.4). On gigabytealchemy this was −4px on the 72px wordmark and −2px on the hero heading;
   at 65px Oswald it is **−11.02px**.
2. **The height, which is new.** A lead of −21.6 computed against a 97-tall predecessor is applied to
   a 75.4-tall one: `311.28125 + 75.40625 − 21.6 = 365.088`, against the reference's `386.703125`.
   Line 2 lands **21.6px high**, and because it is `place: "flow"`, so does everything after it.

The fold has no way to say otherwise today. `l1KeyframeSchema`'s own comment
(`packages/site-schema/src/l1/schema.ts:33-37`) makes the height optional "*a text leaf's height is
natural (from flow), so its keyframes pin only `x`/`y`/`width`*", and `probes.ts:344-353` states the
consequence in as many words:

> This is the one number the fold cannot put in the document. Geometry keyframes carry x / y / width
> for a text leaf and deliberately NOT height — the renderer lets the glyph box size itself … so the
> analytic evaluator had to estimate it.

The evaluator got the measurement (BUG-113's `MeasuredTextHeights`, from the oracle — 97). **The
renderer never did.** The lead is computed in oracle-ink units and applied in rendered-line-box units,
and the two differ by exactly (contentArea − lineHeight) per affected run.

## The cost — 73 of 74 CRITICAL `position` deltas

Every `position` delta in the round is purely vertical (`dx = 0` in all 74) and the census of `dy` is:

```
27 × −43    18 × −44    16 × −33    6 × −32    4 × −61    1 × −89    1 × −22    1 × +2624
```

The `+2624` is a textless-pairing artifact (filed as BUG-151 issue 2). The other 73 are this defect.
The decomposition is exact:

| `dy` | where | why |
|---|---|---|
| −22 | `on your dinner table?` at y 387 | the run itself: −21.59375 |
| −43 / −44 | **everything from y 523 to y 2970** | 2 × −21.59375 = −43.19 |
| −61 / −89 | the testimonial band at y 3102–3288 | −43.19 plus the band's own internal geometry |
| −33 / −32 | **everything from y 3590 to y 4677** | −61.3 + 28.5, where +28.5 is one extra wrapped line in `We've really enjoyed…` (ref `box` 673×142.5 = 5 lines at 28.5; ours 673×171 = 6) |

**The discriminator that this is a text-height error and not a global offset**: at y = 70 the five nav
links read `dy = −43` while the logo, at the *same* y = 70, reads `dy = 0` — `expected-manifest`
`elements[5]` `box {20, 70, 232, 66.28125}` and `actual-manifest` `elements[71]` identical. An image
leaf carries its own keyframe height, so it is placed correctly; every text leaf below the hero is
not.

It also costs two more CRITICAL deltas that are not `position`:

- **an `overlap` finding, and the only one in the round that is not a band backdrop.** The two heading
  lines now intersect by 21.6px — 311.28…386.69 against 365.09…440.50 — reported at all 12
  (width × height) samples: 12 of the 1172 `overlap` findings, and 1 of the 121 distinct leaf pairs.
  The other 120 pairs are REQ-332 issue 1.

  ```json
  {"kind":"overlap","detail":"at 1280px×768px: box overlaps on your dinner table?",
   "paths":["0.0.0.3.0.0.0","0.0.0.3.0.0.1"]}
  ```

- **a CRITICAL `arrangement` delta at severity 4040** on `Dreaming of healthier meals`
  (`expected "beside (right-of prev)"`, `actual "below prev"`). `arrangement` is read from the
  predecessor in a (y, x) sort; the nav moved from y 70 to y 26.78, so it now sorts *before* the logo,
  and the h1's predecessor changes from `link@(1131,70)` on the reference to `img@(20,70)` on ours.

And it is where the pixels are. `regions.json`, `rankedBy: "score"`, total 746,976.82:

- **#1** `bbox {"x":0,"y":2496,"w":1280,"h":992}` `score 367069.76` (**49.1%**) `meanDiff 119.68`
- **#2** `bbox {"x":0,"y":160,"w":1280,"h":640}` `score 246045.30` (**32.9%**) `meanDiff 78.61`

= **82.0% of the ranked score in two regions**, both of which are where the shift moves runs *and band
edges*: region #2's ref lead is the hero band `generic@(0,0,1280x800)` at 100% of the region and its
best actual leads are the two headings at `h 75.41` where the reference has `h 97`; region #1 spans
the quote band and the testimonials, whose ref band tops are 2667.52 and 2949.52 against ours 43–61px
higher. I am not claiming a per-pixel attribution — the region ranker points, it does not measure —
but the 16 perceptual `bands` back it: the three worst are 78.60, 93.97, 76.62 at y 2648–3532 and the
next two 76.98, 65.33 at y 294–883.

## What the fix has to do

Correcting the ink top alone leaves all 73 `position` deltas, the overlap and the arrangement delta,
because those follow from the box **height**, not from where the glyphs sit inside it. Two routes:

1. **Write the height.** `l1KeyframeSchema.height` is already optional-and-allowed on a text leaf, and
   `render.ts:2601-2604` already emits it for a flow-placed node that declares one:

   ```ts
   if (kf.height !== undefined) {
     const h = kf.atHeight
     d.push(`height: ${h ? viewportResponsive(`${kf.height}px`, hF, h) : `${kf.height}px`}`)
   }
   ```

   So the fold could pin 97 on exactly the runs whose oracle box height exceeds their line box, and
   leave every other run's height natural. This is narrow and it needs no type change. The cost is the
   thing `probes.ts:348-350` warns about — "the renderer lets the glyph box size itself, which is what
   makes the reproduction survive a different font stack" — so it should be conditional on the
   mismatch, not unconditional.
2. **Compute the lead in line-box units.** Convert the oracle's ink boxes to line boxes before
   differencing them: `lead = next.inkTop − (prev.inkTop + prev.lineHeight × prev.lines)`. This keeps
   every height natural and needs no new L1 value, but it needs the fold to know each run's line count
   at each width, which is the same measurement `measuredTextHeights` already provides.

Route 2 is the truer one if the line count is reliable; route 1 is the one that can be landed without
trusting it.

## A possibly-related sub-finding I could not resolve offline

11 HIGH `renderedTextBox` deltas (severity 3030.55–3030.99) remain after all of the above, and they
have the same *shape* as this ticket — an ink box measured differently on the two sides — but I cannot
prove they are the same cause without a browser. Recorded here so the next round does not re-derive it.

Three of them are **height** deltas, and they are exactly the three runs whose reference element is an
inline `<span class="elementor-heading-title">` with `lineHeightPx == fontSizePx == 18`:

| run | lines | ref `rtb.h` | act `rtb.h` | ref − act |
|---|---|---|---|---|
| `In home service or delivery` | 2 | 46 | 40 | 6 |
| `In-home weekly, bi-weekly or monthly service` | 3 | 70 | 58 | 12 |
| `For expecting mothers, and small groups for kids and adults.` | 4 | 94 | 76 | 18 |

**+6px per line gap, exactly.** Every compared axis is identical on both sides (`fontFamily`
`"Karla, raleway"`, `fontSizePx` 18, `fontWeight` 500, `lineHeightPx` 18, `letterSpacingPx` 0, all four
paddings 0, and the same `box` to the sub-pixel), and `box.height` agrees exactly (36 / 54 / 72). So
the *line* boxes match and the *ink* boxes do not: the reference's content area is 34 for an 18px font
and ours is 22.

The other five are **width** deltas — a different wrap point at the same box width. The cleanest:
`Gifting our services to friends or family in need of nourishing support.`, `box` 484.15625 wide,
`paddingLeftPx` 5, Karla 17px/300 on both sides; ref `renderedTextBox.width` **373.078125**, ours
**460.375**. Ours fits the word `nourishing` onto line 1 in 87px of the 106px available; the reference
does not, so the reference's glyphs are at least ~22% wider for that word. A weight difference does not
account for 22%.

Two candidate causes, and I could separate them with a browser and not from the artifacts:

- **the same inline-vs-block asymmetry as this ticket** — the reference measures an inline `<span>`'s
  Range rects and the reproduction measures a block `<p>`'s, which is what this ticket is about seen
  on a second family of runs; or
- **a substituted font face** — REQ-332 issue 3, filed this round: the reproduction's seven
  `@font-face` rules carry **no `font-weight` and no `font-style`** descriptor, so Karla's italic file
  is declared as a `(normal, 400)` face beside its normal one and Lato's 300/400/700 files collapse to
  three identical `(normal, 400)` faces. The page then asks for Karla 300 and Karla 500 and cannot get
  either.

**What would separate them**, in one browser-backed step:
`CHROMIUM_LAUNCH_ARGS=--single-process 1c shot repro-joyfulculinarycreations-com --sandbox` with
`document.fonts.check('300 17px Karla')` and `document.fonts.check('500 18px Karla')` evaluated on the
served page. If either returns `false`, it is REQ-332 issue 3 and not this ticket. If both return
`true`, it is this one.
