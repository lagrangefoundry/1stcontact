---
uid: request-d24fa90c
id: REQ-366
type: request
title: 'fold: a run present at only some widths is stitched to a same-text run elsewhere,
  and its clip container hides it'
created_by: repro-console:repro-joyfulculinarycreations-com#5
created_at: '2026-10-03T01:13:42.639404+00:00'
updated_at: '2026-10-03T01:13:42.639404+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  defect_class:
  - fold-wrong
  - capture-loses-it
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-e8d759ce
---

# fold: a run present at only some widths is stitched to a same-text run elsewhere on the page, and the clip container it lands in hides it

Filed by `repro-console:repro-joyfulculinarycreations-com#5`, iteration 5 of the reproduction of
https://joyfulculinarycreations.com (sandbox `repro-joyfulculinarycreations-com`).

- reference bundle: `/Users/martin/lagrangefoundry/1stcontact/storage/references/joyfulculinarycreations.com/index`
  (`capturedAt 2026-10-02T23:18:22.456Z`, `captureSchema 12`). The one commit after it
  (`b830e3e80e feat(builder): a plan panel…`) touches no part of the engine. **This is not a stale-bundle round.**
- artifacts: `/Users/martin/lagrangefoundry/1stcontact/storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-5/`
- `gate.json`: `verdict "structural-failure"`, perceptual mean **2.6/255**, 2.4% over threshold, 12 regions;
  `values.deltas 23`, unmeasured 2; `layout.findings` 206 (184 escape, 12 overlap, 10 clip).

`defect_class`: **`fold-wrong`**, `capture-loses-it`.

## Summary

| # | residual class | kind | `defect_class` | cost |
|---|---|---|---|---|
| 1 | `fold-stitches-a-width-gated-run-to-a-same-text-run-elsewhere` | class 1 | `fold-wrong` | **the whole primary navigation is invisible at 1280 and 1440**: 5 links, 2.43% of page diff mass, 0.94% of ranked score, **0 value deltas** |
| 2 | `capture-records-no-element-for-pseudo-or-border-only-ink` | class 1 | `capture-loses-it` | 6 icon-box icons, 3 social icons, 1 divider **not drawn**; 7.29% of ranked score, **0 deltas, 0 unmeasured** |

**Both are content losses**, which is why they lead despite a smaller pixel share than REQ-265 (still
91.78% of the ranked score, re-measured and appended there). Independent of each other; work 1 first.
Issue 1 is fold-only and a `1c refold` shows it. Issue 2 is capture-side, so it needs a **re-capture**
after it lands.

What the structural-failure verdict is made of. All of it already has a ticket, and I re-measured it:
12/12 overlaps are REQ-265 (hero `<br><br>` h1); 10 clips + 60 left/right escapes on `section-band-1` are REQ-332 issue 2
(carousel); 32 escapes on `section-band-2` are REQ-338 issue 4 (`buildSolidBands` drops the band's
viewport response); 92 below-escapes on `card-2`/`backdrop-2..9` are the `contentRobustness` probe
(text lengthened ~2.5x) against pinned-height surfaces (REQ-337 / BUG-160 class). I confirmed on-sample
by running `bin/1c l1-gate` myself: `onSample` = 12 overlap, 10 clip, 23 escape. Every one of those 23 is
`section-band-1` or `section-band-2`.

---

## Issue 1. The header nav is folded into the footer nav's clip container and clipped away

**Class 1 (engine shortfall), `fold-wrong`.** Test: *is the value in L1 and is it right?* L1 carries
the 5 header links, but with geometry that is **wrong at every width below 1280**, inside a parent that is
wrong at 1280+. *Defence:* the capture has the header link at `(642.2, 70)` at 1280 and **no header link at all**
at 320–1024. The fold wrote one node whose 320–1024 keyframes are the *footer* link's.

**Reference** (`multistate.json`, every `"text":"Meet the Chef"` per projection):

```
320x800   [(105.8, 7478.8)]                      <- footer only
375x800   [(88.8, 6688.6)]
768x1024  [(228.7, 6474.0)]
1024x768  [(282.8, 4188.4)]
1280x800  [(642.2, 70), (410.8, 4677.4)]          <- header + footer
1440x900  [(802.2, 70), (490.8, 4777.4)]
```

Below 1280 the header nav collapses (hamburger), so the text occurs once below 1280 and twice from 1280.

**L1** (`iteration-5/page.json`, root child `0.65`, a `container` with **`clip: true`**, keyframe
1280 `x 250, y 4642.42, 780x95.52`; children `(at, x, y)`):

```
0.65.0 Home          (320,55.97,35) … (1280,94.06,35)                        backedBy card-6
0.65.1 Meet the Chef (320,100.78,35) (375,…,35) (768,…,35) (1024,277.78,35) (1280,392.2,-4572.42) (1440,472.2,-4672.42)
0.65.2 Meet the Chef (1280,160.78,35) (1440,160.78,35)                        backedBy card-7
0.65.3 Our Services  … (1024,408.88,35) (1280,534.39,-4572.42) …
0.65.5 Sample Menus  … (1280,665.63,-4572.42) …
0.65.7 FAQ           … (1280,809.7,-4572.42) …
0.65.9 Get in Touch  … (1280,881.27,-4572.42) …   href /get-in-touch-2/  (0.65.10, the footer's, is /get-in-touch/)
```

`4642.42 − 4572.42 = 70`: the five odd-numbered nodes are the **header** links at 1280/1440, rebased 4572px
above a clipping container that sits in the footer. The served CSS confirms it:
`.l1-93 { … overflow: hidden }`, `.l1-93 { top: 7443.8px; … height: 105.09px }`, and the header link
`.l1-95 { position: absolute; top: 35px; … z-index: 2 }` is its child.

**Pixels** (`diff/actual.png` vs the bundle's `screenshot.full.png`, nav text rows y 83–102):

| link | ref pixels with R+G+B > 700 | ours |
|---|---|---|
| Meet the Chef | 291 | **0** |
| Our Services | 215 | **0** |
| Sample Menus | 264 | **0** |
| FAQ | 112 | **0** |
| Get in Touch | 251 | **0** |

The brightest pixel anywhere in `x 642–1260, y 83–102` is `(255,255,255)` on the reference and **`(80,80,81)`** on ours.
The background at `(900,75)` is `(77,77,60)` on both, so what shows is the hero photograph with no text over it.
The logo next to them (`zIndex 1000`, not in the container) is identical on both sides (mean `(70,74,70)`).

**Regions/deltas:** only region **#10** `{x 928, y 80, w 112, h 32}` `score 283.79` `meanDiff 35.47`
catches it. Its `nodes` are `ref: "Sample Menus" (link, index 2)` and `actual: "Sample Menus" (link, index 6)`, the same
text on both sides with the same box. The value deltas say nothing: `expected-manifest.json[2]` and `actual-manifest.json[6]`
agree on `color #ffffff`, `box (915.625, 70) 144.08x46` and `renderedTextBox (935.625, 83) 104.08x19`, because a
box measured by `getBoundingClientRect` does not know an ancestor clips it away. That ruler gap is filed
separately (see the bug ticket named in this round's report).

**Hypothesis: two links, both in the fold.**

1. `tools/generate/src/cli/responsive-table.ts:103-139`, `buildResponsiveTable`. Rows are aligned
   across widths by **FIFO queue per `elementKey`** (`text:<normalised text>`) in document order. At 1024
   the `text:meet the chef` queue is `[footer]`; at 1280 it is `[header, footer]`. Occurrence 0 therefore
   pairs **header@1280 with footer@320–1024**, and occurrence 1 (the real footer link at 1280) becomes
   a 1280/1440-only row. That is exactly `0.65.1` and `0.65.2` above. Any page whose nav collapses below a
   breakpoint and repeats its labels in a footer will do this.
2. `tools/generate/src/l1/fold.ts` `nestClipRegions` (≈3162–3275). The stitched row's clip ancestor at
   320–1024 is the footer menu, so it joins that group. `agreeing()` treats a width a row has no frame for as
   agreement (`if (!theirs) return true`), the container takes the footer box at 1280, and `rebaseInto` puts
   the header link at `y −4572.42` inside `clip: true`. I have not checked this link independently. It follows
   from the L1 above, and it is what turns a wrong track into an invisible one.

**Proposed change.**

- In `buildResponsiveTable`, do not let a FIFO pair two occurrences whose boxes are far apart when the
  key's occurrence count differs between the two widths. When the count changes, pair by
  geometric continuity (nearest normalised `y`, or same section index) rather than document order. The run that has
  no counterpart becomes a presence-flip row, which is what it is.
- In `nestClipRegions`, a row should join a clip group only at widths where it actually recorded that
  ancestor. At a width with no frame, it should not be rebased into the container.

**How to see it.** From the repo root (no browser needed):

```
bin/1c page get repro-joyfulculinarycreations-com home --sandbox --json > /tmp/p.json
python3 -c "import json;r=json.load(open('/tmp/p.json'))['data']['page']['l1']['root']
for i,c in enumerate(r['children']):
  if c.get('kind')=='container' and any(k.get('text')=='Meet the Chef' for k in c.get('children',[])):
    print(i,c.get('clip'),[(k.get('text'),[(f['at'],f['y']) for f in k['geometry']['keyframes']]) for k in c['children']])"
```

- **Wrong (now):** one container with `clip True`, holding 5 children with keyframe `y −4572.42` at 1280.
  Header links have keyframes at 320–1024.
- **Right:** no child of a clip container has a keyframe outside it. The header links carry keyframes only at 1280 and
  1440, at `y 70`, and are not in the footer container. The footer links carry the full ladder.
- **Pixel check:** `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox`,
  then count pixels with `R+G+B>700` in `actual.png` at `x 642–1260, y 83–102`. **Wrong:** 0. **Right:** about 1100 (ref: 1133).

---

## Issue 2. An element whose only ink is a `::before` glyph or a border is never recorded, so it is never drawn

**Class 1 (engine shortfall), `capture-loses-it`.** Test: *does the capture carry it?* No.
`capture.json` contains 0 occurrences of `fa-laptop` and 0 of `fa-instagram`, and no record in the divider's or the icons' boxes. `pseudo` is `null` on all 87
records that carry it. *Defence:* the fold and the renderer never receive anything to draw. The font files
*are* mirrored (`assets/fa-solid-900.woff2`, `fa-brands-400.woff2`, `fa-regular-400.woff2`), so the ink is reachable.
L1 can express all three: an icon as a `text` node in the mirrored icon face, or an `image`, and the divider as a `box`.

**Reference markup (`raw.html`):**

- icon boxes (6 in `raw.html`): `<div class="elementor-icon-box-icon"><a … class="elementor-icon …"><i aria-hidden="true" class="fas fa-laptop"></i></a></div>`
- social icons (Instagram/Facebook/Yelp): `<a class="elementor-icon elementor-social-icon …"><span class="elementor-screen-only">Instagram</span><i aria-hidden="true" class="fab fa-instagram"></i></a>`
- divider: `<span class="elementor-divider-separator"></span>`, styled in `post-4401.css` by
  `.elementor-element-ca8e26b{--divider-border-style:solid;--divider-color:var(--e-global-color-primary);--divider-border-width:2.5px}` and `…-separator{width:41%…}`

All three are empty elements whose ink is generated content or a border.

**Regions.** Every one has **only section leads on both sides**, so no manifest record describes the ink:

| region | bbox | score | ref pixels | ours |
|---|---|---|---|---|
| #4 | `{560,4576,160,48}` | 879.70 | 810 px `#ffffff` over `#edc251` (social icons) | 7680 px, all `#edc251` (1 colour) |
| #6 | `{224,496,304,16}` | 556.36 | 608 px `#ffffff` (the 2.5px divider) | none |
| #9 | `{256,4016,48,48}` | 288.20 | 938 px `#cc9955` | 2304 px, all `#7a7a7a` |
| #11 | `{512,3744,48,48}` | 252.64 | 826 px `#cc9955` | all `#7a7a7a` |
| #12 | `{256,3744,48,48}` | 234.54 | 833 px `#cc9955` | all `#7a7a7a` |

Together that is **2211.44 of 30337.47 = 7.29%** of the ranked score. Page-wide, `#cc9955` (±30) covers
**4742 px on the reference and 459 on ours**, in six clusters: row y≈3744 at x≈240/480/768 and row y≈4016.

**Hypothesis.** The capture's record selection (the element walk feeding `RawRun`/fields in
`tools/generate/src/cli/capture/extract.ts`) admits text runs, images and controls. An element with no text
node and no `<img>` is skipped before `pseudoOf` (`extract.ts:1265`) or any border read is reached, so REQ-63's
`pseudo` axis only ever describes elements that were already records for another reason.

**Proposed change.** Admit as a record any element with a painted box (≥ 4x4 px) whose computed
`::before`/`::after` `content` is painted (`pseudoContentPainted`), or whose only paint is a visible
border. Record the glyph (codepoint, `font-family`, `font-size`, `color`, box) or the border (side,
width, style, colour). Fold the glyph to a `text` node in the mirrored face and the border-only element
to a `box`. **This will add deltas**: about 10 currently-invisible elements become comparable, and the
instrument will see them for the first time.

**How to see it.**

```
python3 -c "import json;s=open('storage/references/joyfulculinarycreations.com/index/capture.json').read();print(s.count('fa-laptop'),s.count('fa-instagram'),s.count('divider-separator'))"
```

- **Wrong (now):** `0 0 0`, and the five regions above have section-only `nodes` in `diff/regions.json`.
- **Right (after a re-capture):** a record exists at each icon box and at the divider box. `actual.png` has
  more than 4000 `#cc9955` pixels, and regions #4/#6/#9/#11/#12 are gone or carry a node lead on both sides.
  Re-run with `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox`.