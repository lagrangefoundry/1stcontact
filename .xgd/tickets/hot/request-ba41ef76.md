---
uid: request-ba41ef76
id: REQ-372
type: request
title: 'fold: a padded run takes its ancestor band fill as its own chip, painting
  a transparent nav as opaque plates'
created_by: repro-console:repro-joyfulculinarycreations-com#7
created_at: '2026-10-03T19:41:51.098837+00:00'
updated_at: '2026-10-03T22:44:27.706434+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  defect_class:
  - fold-wrong
  - renderer-wrong
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-3350b5a4
  commits:
  - working_sha: f3a5eb11da8bd336a12949421258640d6b56574e
    reconcile_sha: null
    main_sha: null
  - working_sha: 6509681ff5ffa992ebb5cc5e5823658457cff2ea
    reconcile_sha: null
    main_sha: null
  version: 0.2.457
  story_points: 3
---

# fold: a padded run takes its ancestor band's fill as its own chip, so a transparent nav paints five opaque black plates

Filed by `repro-console:repro-joyfulculinarycreations-com#7`, iteration 7 of the reproduction of
https://joyfulculinarycreations.com (sandbox `repro-joyfulculinarycreations-com`, page `home`).

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  (`capturedAt 2026-10-03T18:55:59.928Z`, `captureSchema 14`). No engine commit after it, so this
  **is not a stale-bundle round**.
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-7/`
- `gate.json`: `verdict "structural-failure"`, perceptual mean 2.81/255, 2.73% over threshold, 12 regions
  (ranked total score **36140.73**); `values.deltas` 56; unmeasured 2; `layout.findings` 210
  (184 escape, 16 overlap, 10 clip).
- Evidence for both issues comes from **this one bundle only**.

`defect_class`: **`fold-wrong`**, `renderer-wrong`.

## Summary

| # | residual class | kind | `defect_class` | cost |
|---|---|---|---|---|
| 1 | `fold-promotes-an-ancestor-fill-to-a-padded-run-s-own-chip` | class 1 | `fold-wrong` | the header nav paints as **five opaque black plates** over the hero photograph at 1280/1440: region #2, **6883.91 of 36140.73 = 19.05%** of the ranked score, **0 value deltas** |
| 2 | `renderer-grows-a-relaxed-centred-run-from-its-left-edge` | class 3 | `renderer-wrong` | a `textAlign: center` run whose glyphs are wider than its L1 box grows rightward, not about its centre: 3 icon glyphs drawn +5px / +2px / +2px right of the reference. Below the region ranker's cut, 0 true deltas |

The two are independent. Work issue 1 first: it is the larger one and needs only a fold change, which
`1c refold` shows offline.

What the rest of this round's evidence is, so nobody re-derives it. All of it already has a ticket.
- Regions #1/#3/#5 (71.64% of score, hero h1 at −11px) and #4/#7/#8/#11/#12 (6.32%, "What people are
  saying" at −46px) are **REQ-265**. I've re-measured them and added a comment there.
- Regions #6/#9/#10 (3.00%) are the hero divider and the three social-icon rings. Neither is drawn.
  That is **REQ-366 issue 2**, which landed for `::before` glyphs and not for these two shapes. I've added
  a comment there with the exact cause.
- All **16 of 16** overlap findings are pairs the reference's own boxes make identically. That is
  **BUG-186 item 1**, and I've appended this second bundle to it.
- 31 of the 56 deltas come from how pseudo-glyph runs are measured on each side. That is filed separately
  as a `1c` bug (see the closing block of this round), not here.

---

## Issue 1. A padded run takes its ancestor band's fill as its own chip surface

**Class 1 (engine shortfall), `fold-wrong`.** The three tests, in order:
1. *Can L1 express it?* Yes: a text run with no `surfaceFill` is the default shape.
2. *Is the L1 value right?* **No.** All five header links carry `axes.surfaceFill: "#000000"` in the
   L1, and the capture says that fill is not theirs.

*Why `fold-wrong`:* capture.json records the fill with `surface.self: false` and a 1280×800 surface box,
so the capture has the right information and the fold wrote it onto the wrong node.

### Evidence

Capture, `capture.json`, the "Meet the Chef" record. The other four links are the same shape:
```
{"paddingTopPx":13,"paddingBottomPx":13,"paddingLeftPx":20,"surfaceFill":"#000000",
 "surface":{"self":false,"box":{"x":0,"y":0,"width":1280,"height":800},...},"borderRadiusPx":0,
 "a11yRole":"link","box":{"x":642.203125,"y":70,"width":142.1875,"height":46}}
```

L1, from `1c page get repro-joyfulculinarycreations-com home --sandbox --json`. These are the only five
text runs in the document carrying a `surfaceFill`:
```
["Meet the Chef","#000000"] ["Our Services","#000000"] ["Sample Menus","#000000"] ["FAQ","#000000"] ["Get in Touch","#000000"]
```
Each one is `paintOrder: 2`, `visibility.fromPx: 1280`. The bundle's own `l1.json` carries the same
five fills, so this is the current fold and not a stale document.

Served CSS: the run is painted with that background over the hero. I measured the screenshots row by row
across the region: ours is near-black (mean RGB (1,1,1)) for x 642–1259, y 70–115. That is exactly the
union of the five link boxes (642.2 → 1131.27 + 128.73 = 1260; 70 + 46 = 116). At pixel (700, 80) the
reference is `(77,78,79)` (the hero photograph through its 0.49-opacity layer over #000000) and ours is
`(0,0,0)`.

`regions.json` entry #2: `bbox {x:640,y:64,w:624,h:48}`, `score 6883.91`, `meanDiff 58.84`,
`area 29952`. `nodes.ref` and `nodes.actual` hold **the same five link texts at the same boxes**
(e.g. ref "Meet the Chef" `{x:642.2,y:70,w:142.19,h:46}`, ours `{x:642.19,y:70,w:142.19,h:46}`). Per
the brief, "same text, same box" means the element is right and its paint is wrong.

**0 value deltas.** Both manifests report `surfaceFill "#000000"` for these runs. The reference's value
is the ancestor band's and ours is the run's own plate, and only `surface.self` tells them apart
(`false` vs `true`). The comparator does not compare that mismatch in this direction (filed as the
secondary bug).

### Hypothesis

`tools/generate/src/l1/fold.ts:1659` `isPaddedControlRun` (BUG-21) returns true for any run with
`paddingTopPx + paddingBottomPx > 0` and a truthy `el.surfaceFill`. Its own docblock (fold.ts:1619-1621)
says `surfaceFill` "walk[s] ancestors to find the enclosing card", so the test cannot tell a button that
paints itself from a padded link standing on a band. `isSelfPaintingRun` (fold.ts:1633) then sends the
run down the chip path at fold.ts:3740-3741, and `chipAxes` (fold.ts:1674) copies the ancestor fill onto
the text leaf. Elementor nav links are `padding: 13px 20px` anchors on a transparent `<nav>`, which is a
common shape.

### Proposed change

In `isPaddedControlRun`, require the fill to be the run's own: `el.surface?.self === true`. Keep today's
behaviour only where the capture recorded no `surface` record at all. BUG-21's buttons are self-painting
(`self: true`), so they keep the chip path, while a padded link on a band falls back to a bare text leaf.
This is the same evidence REQ-351's `compositedBandRows` already reads (fold.ts:2428-2446). Add a fold
test: a padded `<a>` whose `surface` is `{self:false, box: <band>}` folds with no `surfaceFill`, and a
padded `<button>` with `{self:true}` still does.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact
bin/1c refold --ref storage/references/joyfulculinarycreations.com/index
jq -c '.. | objects | select(.kind=="text" and .axes.surfaceFill != null) | [.text, .axes.surfaceFill]' \
  storage/references/joyfulculinarycreations.com/index/l1.json
```
- **Wrong (now):** five lines, `["Meet the Chef","#000000"]` … `["Get in Touch","#000000"]`.
- **Right:** no output. The nav runs carry type axes only.

Pixel check, after re-rendering the sandbox:
```
CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox
```
- **Wrong:** `regions.json` contains `bbox {x:640,y:64,w:624,h:48}` at score ≈6884, and `actual.png`
  pixel (700,80) = `(0,0,0)`.
- **Right:** no ranked region over y 64–112 at x ≥ 640, and (700,80) ≈ `(77,78,79)`.

---

## Issue 2. A relaxed (`nowrapFromPx`) centred run grows from its left edge, not about its centre

**Class 3 (renderer bug), `renderer-wrong`.** The three tests, in order:
1. *Can L1 express it?* Yes.
2. *Is the L1 value right?* **Yes.** The FAQ icon run (the `U+F109` laptop glyph, served as `<a class="l1-86">`)
   is `textAlign: "center"`, `fontSizePx 40`, keyframe at 1280 `{x:255, width:40}`. That matches the
   reference's 1em box: expected manifest `box {x:255,y:3746.94,width:40,height:40}`. The mirrored
   stylesheet centres the glyph on that box: `custom-frontend.min.css`
   `.elementor-icon i{…width:1em}` and `.elementor-icon i:before{left:50%;position:absolute;transform:translateX(-50%)}`.
3. *Does the render match L1?* **No.** The centre L1 implies is x = 275, and the glyph is painted centred
   on x = 279.5.

*Why `renderer-wrong`:* the L1 box and alignment are the reference's, and the served CSS moves the glyph.

### Evidence

Served CSS (`iteration-7/site/index.html`), 1280 rung:
```
.l1-86 { … left: calc(255px + …); width: fit-content; min-width: calc(40px + …) }
.l1-86 { … font-size: 40px; … text-align: center; white-space: nowrap }
```
The glyph's advance is 50px, so `fit-content` grows the box to 50 **from `left: 255`**. Actual manifest
for this run: `box {x:255,width:50}`, `renderedTextBox {x:255,width:50}`.

Ink extents I measured in both screenshots (gold `#cc9955`, ±90 RGB sum):

| run (L1 box at 1280) | glyph advance | reference ink x | ours ink x | shift |
|---|---|---|---|---|
| `U+F109` @255 w40 | 50 | 250–299 | 255–304 | **+5** |
| `U+E065` @255 w40 | 45 | 253–296 | 255–299 | **+2** |
| `U+F086` @518.33 w40 | 45 | 516–560 | 518–563 | **+2** |
| `U+F46D` @518.33 w40 | 30 | 523–552 | 523–553 | 0 (fits, centred correctly) |
| `U+F879` @781.66 w40 | 40 | 782–821 | 781–821 | 0 |
| `U+F581` @781.66 w40 | 38.75 | 782–820 | 782–820 | 0 |

Only the glyphs **wider than their box** move, and each moves by about half its overflow. Below the box
width, `text-align: center` centres correctly. Above it, CSS start-aligns overflowing inline content, and
the `fit-content` box has already grown rightward anyway. These shifts are under the region ranker's cut,
and **no true value delta sees them**. The `position` delta on `U+F109` reads clean (both sides
`x 255`). One of this round's two CRITICAL `position` deltas, (518,3747) → (523,3747), is on `U+F46D`, whose
ink *matches* (523–552 vs 523–553). That inversion is the secondary bug.

### Hypothesis

`packages/framework/src/l1/render.ts:3031-3032` `widthDecls` emits
`width: fit-content; min-width: <w>` once `nowrapFromPx` applies (REQ-117/REQ-302), and render.ts:3038
pins `left: <x>`. The relaxation keeps the left edge fixed whatever the run's `textAlign`, so a centred
(or right-aligned) run whose content outgrows the captured width moves its visual centre. This is not
specific to icon fonts. A centred heading that renders 10px wider (font metrics, an edit, a fallback
face) drifts 5px right in the same way.

### Proposed change

When `relaxed(atPx)` and the run's `textAlign` is `center`, keep the captured centre fixed rather than
the left edge. For example, emit `left: calc(<x> + <w>/2)` with `transform: translateX(-50%)` (or
`margin-left: calc(-1 * (fit-content-width) / 2)` via a wrapper). For `right`, mirror it about the right
edge. `left` keeps today's behaviour. Add a renderer test: a centred nowrap run, L1 `{x:255,width:40}`,
content 50px wide, paints from 250 to 300.

### How to see it, and how to know it is fixed

```
cd /Users/martin/lagrangefoundry/1stcontact
bin/1c render repro-joyfulculinarycreations-com --sandbox --out /tmp/jcc7-render
grep -o '\.l1-86 {[^}]*}' /tmp/jcc7-render/index.html | head -3
CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox
jq -c '.elements[] | select((.text|explode)==[61705]) | .renderedTextBox' storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-7/diff/actual-manifest.json
```
(Re-point the last path at the new run's `actual-manifest.json`. `l1-86` is this render's class name for
the FAQ icon link; if the class numbering moves, find the `<a href="faq-2/">` whose text is `U+F109`.)
- **Wrong (now):** `left: …255px…; width: fit-content; min-width: …40px…`, and the glyph's
  `renderedTextBox` is `{x:255, width:50}`.
- **Right:** `renderedTextBox` `{x:250, width:50}`, i.e. centred on 275. Reference ink x 250–299.

---

## Not filed, and why

- Carousel prev/next `a11yRole button → generic` (2 HIGH): the reference elements are swiper
  `<div role="button">` controls (raw.html lines 999/1001). That is the carousel behaviour REQ-332
  issue 2 already owns.
- Logo `zIndex 9999 → 1000`: no ranked region over the logo, and BUG-187 item 1 already owns
  cross-stacking-context `zIndex` comparison.
- `surfaceFill ×6` (`#636a63`/`#28542d` → `#ffffff`) and `backgroundImage ×2`: present and identical in
  iteration 5, owned by REQ-302 issue 4 / REQ-351 / BUG-179.


---

## What landed (free-coded)

**Issue 1 — fold.** `isPaddedControlRun` (`tools/generate/src/l1/fold.ts`) now also requires the fill to
be the run's own wherever the capture recorded whose it is: a run whose `surface.self` is `false` is not
a padded control, so it takes no chip axes and folds to a bare text leaf. A capture with no `surface`
record at all keeps the BUG-21 vertical-inset reading. A padded control whose `surface.self` is `true`
(BUG-21's buttons) keeps the chip path. Offline check: `1c refold` on a copy of the joyfulculinarycreations
bundle now emits no text run with a `surfaceFill`, and no `#000000` card plate appears at the link
widths in their place (the only `#000000` boxes are the full-bleed hero layers, as before).

**Issue 2 — renderer.** `geometryRules` (`packages/framework/src/l1/render.ts`) now takes the run's
`textAlign`. On every rung where the run is relaxed (`nowrapFromPx` applies, width becomes
`fit-content` with the captured width as `min-width`) and its left edge is not column-anchored:
- `center`: `left: calc(<x> + <w> / 2)` with `translate: -50% 0`, so the captured centre stays fixed
  as the box grows;
- `right`: `left: calc(<x> + <w>)` with `translate: -100% 0`, so the captured right edge stays fixed;
- `left` / `justify` / unset: unchanged, byte for byte.
The same applies to the flow frame's `margin-left`. Rungs below the wrap threshold of a centred or
right-aligned relaxed run emit the plain left edge plus `translate: none`, because each rung overrides
the ones beneath it. While the content still fits, the box is exactly the captured width, so the result
equals the captured box.

`translate`, not `transform`, so a node's authored `transform` composes with it. Known limitation: an
entrance or scroll animation that animates `translate` on the same node replaces the centring offset
while it runs, and the node settles back to the centred position afterwards.

## Test plan

`tests/test_UAT_FC_REQ-372_padded_run_ancestor_fill_and_centred_relaxed_run.test.ts`:
- `test_UAT_FC_REQ-372_padded_link_on_a_band_folds_with_no_surface_fill`: a padded link with
  `surface.self: false` and a band-wide surface box folds with no `surfaceFill`, and no `#000000` plate
  is painted at the link's width. Fails without the fold change.
- `test_UAT_FC_REQ-372_self_painting_padded_button_keeps_its_chip`: a padded button with
  `surface.self: true` keeps its fill and radius.
- `test_UAT_FC_REQ-372_centred_relaxed_run_is_pinned_by_its_captured_centre`: emitted CSS for a centred,
  a right-aligned and a left-aligned relaxed run at L1 `{x:255, width:40}`.
- `test_UAT_FC_REQ-372_centred_overflowing_run_paints_centred_on_its_captured_box` (Chromium, runs only
  where an engine launches): the overflowing centred run's rendered box centres on 275, the right-aligned
  one ends at 295, and the left-aligned one starts at 255.

Regression scope: every `tests/*.test.ts` that drives `foldToL1` or `renderL1Document` (121 files). All
pass except `reconciliation-colour-palette-overlay` AC931, which fails the same way on clean xgd-working
(font-family difference, unrelated to this change).