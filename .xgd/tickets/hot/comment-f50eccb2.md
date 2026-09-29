---
uid: comment-f50eccb2
id: COMMENT-4481
type: comment
title: Comment on request REQ-338
created_by: xgd
created_at: '2026-09-29T20:59:01.134111+00:00'
updated_at: '2026-09-29T20:59:01.134111+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-3de19cdf
  kind: note
---

`repro-console:repro-joyfulculinarycreations-com#4` — iteration 4 re-measurement of all eight residuals against a **fresh capture** of the same site.

Bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`,
now `capturedAt 2026-09-29T19:46:13.536Z`, `captureSchema 8` — a *different* bundle from the one this
ticket was filed against (`2026-09-27T00:47:21.132Z`, schema 7), so the capture-side items are testable.

Headline: gate `structural-failure` both rounds, but perceptual mean **30.53 → 4.28/255** and pixels
over threshold **27.35% → 4.39%**; `layout.findings` **400 → 296** (escape 367 → 259, overlap 27 → 27,
clip 6 → 10).

## Seven of the eight are confirmed closed, end to end

| # | check I ran | result |
|---|---|---|
| 1 + 2 | hero pixels at (5,10), (200,60), (500,120), (5,500), (500,500), (900,700), (1270,790) | ref/ours agree to **≤1/255 at all seven**. (5,10) is `(77,79,80)` on both, where it was `(77,79,80)` vs `(243,248,251)`. The black plate is gone and the treated backdrop is what paints. |
| 3 | `y=3104`, x ∈ {0, 80, 160, 320, 640, 1040, 1200} | `(255,255,255)` outside the panel and `(122,149,125)` inside it, **identical on both sides**. Was `(40,84,45)` in the gutters. |
| 5 | `capture.json sections[4].background` | `{"kind":"image","color":"#ffffff","image":"assets/market-vegetables-produce-6329164.jpg","overlay":{"color":"#141e14","opacity":0.67,"blendMode":"darken"}}` — the `.elementor-background-overlay` child is read. Band pixels at (20,2720)/(20,2784)/(20,2848)/(20,2912) now agree to 1/255. |
| 6 | `capture.json` U+00A0 count | **35** (was 0); `sections[3].content[5].text` is `'Gifting our services to\xa0friends or family\xa0in need of nourishing\xa0support.'`. The `renderedTextBox` delta on that run is gone. |
| 7 | `expected-manifest.json` for the three runs | `lineHeightPx` now **24** on all three; `'For expecting mothers…'` is `24` with `renderedTextBox h 94` (`94 = 3×24 + 22` closes). Was 18. |
| 8 | pixels at (680,1690), (720,1750), (800,1780), (840,1810) | `(115,82,66)`, `(70,46,36)`, `(135,115,108)`, `(79,79,79)` — **identical on both sides**. The photograph paints. |

## Issue 4 has landed for `section-bg-N` and has NOT landed for `section-band-N`

The `foldSectionBackgrounds` half is done. All four now carry a response:

```
python3 -c "import json;p=json.load(open('…/iteration-4/page.json'));r=p['data']['page']['l1']['root'];
print([(c['id'],(c.get('geometry') or {}).get('viewportResponse')) for c in r['children'] if str(c.get('id')).startswith('section-')])"
```

```
[('section-bg-1', {'yFactor': 1}), ('section-bg-3', {'yFactor': 1}), ('section-bg-2', {'yFactor': 1}),
 ('section-bg-0', {'heightFactor': 1}), ('section-band-1', {'yFactor': 1}), ('section-band-2', None)]
```

`section-bg-0`'s 79 escapes and `section-bg-2`'s 82 are gone. **`section-band-2` still has none, and
still escapes 57 times** — 44 at height 1536, 13 at height 768 — the identical count this ticket
reported. Its two children both carry `{"yFactor": 1}` (`page.json` `0.49.0` `'How it works'`,
`0.49.1` `'Weekly meals are prepared…'`), so the pair is exactly the shape issue 4 named:

```json
{ "kind": "escape", "width": 320, "height": 1536,
  "detail": "at 320px×1536px: 'How it works' is no longer covered by its backing surface section-band-2 — 506px below its bottom edge",
  "paths": ["0.49.0", "0.49"],
  "boxes": [ {"x":32,"y":6176.38,"width":256,"height":39.78125},
             {"x":0,"y":5368,"width":320,"height":342.16} ] }
```

`6176.38 = 5368 + 72.38 + (1536 − 800)` — the child's `(100vh − 800px)` term, served as
`.l1-75 { top: calc(72.38px + (100vh - 800px)) }`, resolves correctly in *absolute* terms only because
its parent contributes nothing. `.l1-74 { top: 5368px; … height: 342.16px }` has no `vh` term at all.

### Why it is dropped — the exact line

`tools/generate/src/l1/fold.ts:2578-2586`, in `buildSolidBands`:

```ts
// Every width must agree, or the band is not describable as one height rule.
const first = responseSamples[0]
if (first && responseSamples.every((s) => s.y === first.y && s.height === first.height)) {
  … geometry.viewportResponse = r
}
```

and `responseSamples` is only appended to when **both** of the band's edges are found in
`edgeResponses` (`fold.ts:2568-2573`):

```ts
const fTop = edges.get(Math.round(top))
const fBottom = edges.get(Math.round(bottom))
if (fTop !== undefined && fBottom !== undefined) responseSamples.push({ y: fTop, height: fBottom - fTop })
```

`section-band-2` at 1280 is `y 3490, height 262.94` → bottom **3752.94 → 3753**. The reference's
section edges at 1280 (`multistate.json sections[].box`) are
`0, 50, 156.28, 800, 1335.97, 1603.47, 2667.52, 2934.52, 2949.52, 3474.53, 3489.53, 4439.63, 4440.63, 4743.94`.
The top rounds onto 3490 (= §8's 3489.53); **3753 is not a section edge**, so `fBottom` is `undefined`,
`responseSamples` stays empty, `first` is `undefined`, and the `if` never fires. The band silently
asserts `yFactor: 0` — not "unknown", but "does not move" — which is the one reading the evidence
rules out.

The band is shorter than the section it sits in because it is built from the runs it contains
(262.94 against §8's 950.09), so its bottom edge will never be a section edge. A band whose *top* is a
known edge should take that edge's response and leave the height alone, rather than dropping both.

## What the remaining 259 escapes are made of

| mechanism | escapes | where |
|---|---|---|
| this ticket's issue 4, `buildSolidBands` half | **57** | `section-band-2` |
| REQ-332 issue 2 — the carousel's off-screen slides at `x −643.8 / −880.41 / −419.25` | **56** | `section-band-1` |
| a one-width height probe applied across the ladder (hero collapses to 49.5px at vh 768) | **36** | `section-bg-0` 12, `backdrop-0` 12, `backdrop-1` 12 — filed this round as **REQ-351** issue 3 |
| copy reflowing taller than a surface measured on the ladder — REQ-337 / BUG-160 | **110** | `card-2` 22, `backdrop-2` 20, `backdrop-3` 14, `backdrop-4` 14, `backdrop-5` 12, `backdrop-8` 8, `backdrop-9` 8, `card-3` 8, `card-6` 4 |

## Two new fold residuals on this bundle, filed as REQ-351 rather than here

They are neighbours of this ticket's issues 1–3 and it is worth saying they are *not* them:

- the page canvas is taken from the tallest band (`#7a7a7a`) rather than the `<body>` background the
  bundle records seven times (`#ffffff`), so the two 15px transparent strips at y 2934.52 and y 3474.53
  paint grey — **22.34% of the page's diff mass at mean 133.00/255**, and 0 deltas;
- `card-3` carries `surfaceFill: "#636a63"` — the *composited* colour of the vegetable photograph under
  its `darken` scrim — and paints it as a 689×153 opaque plate over `backdrop-6`, which already holds
  the image and the overlay correctly: **18.34% of the page's diff mass**, and 0 deltas.

Together they are the 40.7% of this page's residual that issues 1–3's fix did not touch.
