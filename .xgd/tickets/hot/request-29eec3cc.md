---
uid: request-29eec3cc
id: REQ-382
type: request
title: 'fold: a full-width bar gradient is painted on a card the size of its text
  run, and a clipped cover photo is rescaled by resizing its box'
created_by: repro-console:repro-www-hearingzone510-com#3
created_at: '2026-10-04T15:05:17.764524+00:00'
updated_at: '2026-10-04T15:29:52.497928+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  defect_class:
  - fold-wrong
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-40f22c9b
  commits:
  - working_sha: fafea067de6700447df792c01efbd7dd428b8d5f
    reconcile_sha: null
    main_sha: null
  - working_sha: e493348dfc14ef88a342f665f0a25ac615bdf385
    reconcile_sha: null
    main_sha: null
  version: 0.2.480
---

Filed by `repro-console:repro-www-hearingzone510-com#3` (reproduction console, loop 1, iteration 3).

**Leading residual class:** `fold-shrinks-a-band-wide-gradient-to-its-run-box`

**Stored reference:** `storage/references/www.hearingzone510.com/index` (Zyro), captured 2026-10-04T12:31:57.996Z at schema 17. Only one commit has landed since then (302d79e26b, chat heartbeat), and it touches neither capture nor fold. All evidence comes from this one bundle.
**Evidence dir:** `storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-3/` (`$ITER` below). `$REF` = the bundle path above.
**Gate:** `structural-failure`. Mean 4.4/255, 3.9% over threshold, 12 regions with a total ranked score of **36000.28**, 25 deltas, **unmeasured 14** (14 populations = 12 `unpairedActual` + 2 `unmatched`).

## Summary, in dependency order

| # | residual class | class (§5) | `defect_class` | cost on this bundle |
|---|---|---|---|---|
| 1 | `fold-shrinks-a-band-wide-gradient-to-its-run-box` | 1 engine shortfall | `fold-wrong` | region #1: **17408.12 of 36000.28 (48.36%)**, 0 deltas |
| 2 | `fold-clips-a-cover-image-by-resizing-it` | 1 engine shortfall | `fold-wrong` | regions #3/#4/#5/#6/#10: **8676.50 (24.10%)** proven, plus most of region #2 (5706.66). 1 HIGH `size` delta |

The two issues are independent. Both are fold-only, so `1c refold` picks them up and **no re-capture is needed**.

**Not re-filed (known classes), re-measured this round:**
- **The structural-failure verdict is REQ-380's class**, seen here on a second bundle. 820 of the 886 escapes, all 214 `onSample` escapes, and 11 of the 14 unmeasured are section-band slices. I appended this as a comment on REQ-380 (`fold-groups-band-rows-by-stream-adjacency-not-by-section`). The remaining 66 escapes are `contentRobustness` on pinned surfaces, which is the REQ-337/BUG-160 class.
- 1 unmeasured is `section-band-2` `{0, 2087, 1280×1620}`. It duplicates `backdrop-2` `{2086, 874}` + `backdrop-3` `{2959, 749}` over the same section. That is the REQ-338 "band painted more than once" class.
- 2 unmeasured, which are also the 2 CRITICAL `missing` deltas, are an instrument asymmetry. The reproduction paints both panels. These are filed as a bug (see the end).

---

## Issue 1: a gradient painted by a full-width bar is folded onto a card the size of the text run on it

**Class 1 (engine shortfall). `defect_class: fold-wrong`.** Defence: the capture records both the gradient and the full-width box that paints it. L1 can express the right thing, because `card-0` is a `box` carrying exactly that `surfaceGradient`. The fold gives `card-0` the run's box instead of the surface's box.

**Test run.** Q1: can L1 express it? Yes. `card-0.axes.surfaceGradient` = `{angleDeg 0, stops [#f2b374, #f0dac4]}` validates and renders. Q2: is the L1 value right? The gradient is right and the **geometry is wrong**:

- `$REF/capture.json` `sections[0]` is `box {0,0,1280×40}`, `background {kind:"none"}`. Its only content run, "Learn to train your brain to hear better.", has `box {463.80, 7.60, 352.41×23.4}`, `surface {self:false, box {x 0, y 0, width 1280, height 40}}`, `surfaceFill null`, `surfaceGradient {angleDeg 0, stops [#f2b374, #f0dac4]}`, and `sticky {x 0, y 0, 1280×40, topPx 0}`. `raw.html`'s Zyro `stickyBar` block declares `background.current:"gradient"`, angle 0, `rgb(242,179,116)` → `rgb(240,218,196)`, `minHeight 40`.
- `$ITER/page.json` has `pin-0` (sticky, 1280×40, **no fill**) → `card-0` `{x 463.8, y 7.6, 352.41×23.4}` at 1280 carrying the gradient → the text run (`backedBy: card-0`). At every width `card-0` has the run's box: 320 `{31.61, -0.9, 256.78×41.6}`, 375 `{30.88, 8.69, 313.25×20.8}`, and so on.

**Pixels**, read from `$REF/screenshot-1280.png` and `$ITER/diff/actual.png`, as (ref) / (ours):

| x \ y | 2 | 8 | 20 | 30 | 37 |
|---|---|---|---|---|---|
| 300 | (240,215,191) / **(255,255,255)** | (240,209,179) / **white** | (241,198,155) / **white** | (241,188,135) / **white** | (242,181,121) / **white** |
| 470 | (240,215,191) / **white** | (240,209,179) / (240,217,194) | (241,198,155) / (241,197,152) | (241,188,135) / (242,179,117) | (242,182,121) / **white** |
| 1000 | (240,215,191) / **white** | … / white | … / white | … / white | … / white |

Outside x 463.8–816.2 the bar is white in ours (the body canvas). Inside, the whole 40px sweep is compressed into 23.4px, so the bottom stop is reached at y≈30 instead of y 40.

**What it costs.** `regions.json` region #1 `{x 0, y 0, w 1280, h 48}`, score **17408.12**, meanDiff 72.53, area 61440. `readout.meanRgb` is ref (213.68,176.16,139.33) against ours (224.17,216.32,208.91). `columnDiff` is ~82.6 everywhere except columns 23–40 (x≈460–820, under the card), where it is ~45. `nodes.ref` and `nodes.actual` are identical: section #0 (83% of region) and the run (13%). This is **0 deltas** because the run's object in `values-diff.json` compares no surface axis. `expected-manifest.json` #0 has `surface.box` 1280×40 and `actual-manifest.json` #0 has `surface.box` `{463.80, 7.59, 352.41×23.39}`, but nothing compares them (filed as an instrument item in the bug below).

**Mechanism.** `tools/generate/src/l1/fold.ts`:
1. `shapeBoxAt` (`:4241-4245`) declines a surface whose width is not `< at`, so `surfaceFrames` is **empty** for this row. That rule exists so a band-wide rect is not adopted as a card. The rect is kept only as `bandSurface` (`:4260-4262`), which is consulted solely by `compositedBandRows`, and that function returns false when `!r.fill` (`:2537`).
2. `hasCardTreatment` (`:2483-2487`) counts `gradient` as a card treatment. So the row is never a band row (`:4492-4493`), and it lands in `cardRows` via `r.fill || r.gradient` (`:4502`).
3. `buildCards` (`:3023-3024`) then falls back to `r.frames`, which is **the run's own box**: "only a row whose surface the capture missed falls back to its run box". This capture did not miss the surface. The fold discarded it in step 1.

`buildSolidBands` only handles solid fills, so a full-width **gradient** has no route to a band-wide surface anywhere in the fold.

**Proposed change.**
- When a surface row carries a `gradient` and its resolved surface is band-wide (`bandSurface` set, so `shapeBoxAt` declined it), emit the surface at the **captured surface rect per width**. Do not use the run box. Concretely, keep per-width `surface.box` frames for band-wide shapes, used only when the row has no own card treatment (`hasOwnCardTreatment` false). Then either let `buildCards` use them, or route the row to a band-wide gradient box (one per distinct surface rect).
- Keep the run-box fallback only for rows whose capture genuinely has no `surface.box`.
- Here, the sticky bar's surface should be `{0,0,W×40}` at every W ≥ 375 (`{0,0,320×41.59}` at 320, per the `multistate.json` section #0 boxes). It is sticky, so it belongs inside `pin-0`. `pin-0` already has exactly that box, so writing the gradient onto `pin-0` itself is a valid alternative.

**How to see it (no browser needed).**
```
python3 -c "
import json;p=json.load(open('storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-3/page.json'))
n=p['data']['page']['l1']['root']['children'][0]['children'][0]['children'][0]
print(n['id'],n['axes'],[ (k['at'],k['x'],k['width'],k['height']) for k in n['geometry']['keyframes']])"
```
**Wrong (now):** `card-0 {'surfaceGradient': …} [(320, 31.61, 256.78, 41.6), (375, 30.88, 313.25, 20.8), …, (1280, 463.8, 352.41, 23.4), (1440, 543.8, 352.41, 23.4)]`. **Right:** after `bin/1c refold --ref storage/references/www.hearingzone510.com/index` (offline; it rewrites the bundle's own `l1.json` from `multistate.json`), the node carrying the `#f2b374`→`#f0dac4` gradient in `storage/references/www.hearingzone510.com/index/l1.json` is `x 0`, full width, height 40 (41.59 at 320). To serve it, re-import the bundle as the sandbox site (`1c repro`) and check `bin/1c page get repro-www-hearingzone510-com home --sandbox --json`.

Pixels: `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox`. **Wrong:** region #1 `{0,0,1280×48}` score 17408.12. **Right:** no region over y 0–40, and pixel (300,20) is ≈(241,198,155) rather than (255,255,255).

---

## Issue 2: `clipGroundTo` crops a cover-fit hero photograph by shrinking its box, which rescales the photograph

**Class 1 (engine shortfall). `defect_class: fold-wrong`.** Defence: the capture records the image's real box (taller than its band). L1 can express "this box, clipped by that one" (REQ-332's clipping `container`). The fold writes a different box, and under `object-fit: cover` a different box is a different scale.

**Test run.** Q2: is the L1 value right? No.
- `$REF/multistate.json`: the hero `<img>` ("black and white bed linen", `objectFit cover`, `objectPosition "50% 41%"`, `intrinsicAspect 1.4`) has height **1168.5625** at 1280/1440. Its section #1 is **1157**. The other widths are 1021.27 vs 1011.16 (1024), 317.13 vs 314 (375/768), and 350.64 vs 347.17 (320). The `clip` recorded on the image is its own box. `$REF/capture.json` agrees: `box {0, 40, 1280×1168.5625}`.
- `$ITER/page.json` `image-1` keyframes: 320 h 347.17, 375/768 h 314, 1024 h 1011.16, **1280 h 1157**, 1440 h 1157. That is exactly `backdrop-0`'s height at every width.
- `values-diff.json`: HIGH `size` on "black and white bed linen", expected `1280×1169`, actual `1280×1157` (severity 3030.92).

**Mechanism.** `fold.ts:3292-3315` `clipGroundTo` (landed with REQ-370) intersects the ground's keyframes with its backdrop's, which rewrites `kf.height`. Its own comment says this was done so the overhang does not "hand the band a content extent the reference never shows". That goal is right, but intersecting the box is the wrong way to reach it. Under `object-fit: cover` with a height-bound fit (1280/1168.56 = 1.095 < 1.4), the rendered scale is proportional to the box height. A 1157px box paints the photograph at 1157/1168.5625 = **0.99010** of the reference's scale.

**The test that proves it.** I resampled ours through the inverse of that scale, about the cover anchor (x 640, y 40): ref(x,y) ↔ ours(640+(x−640)/s, 40+(y−40)/s) with s = 1168.5625/1157. Mean |ref−ours| per channel:

| region | bbox | score | as-is | after remap |
|---|---|---|---|---|
| #3 | 800,1024 400×144 | 2787.89 | 16.94 | **1.08** |
| #4 | 832,848 192×176 | 1878.12 | 18.50 | **1.26** |
| #5 | 240,1040 256×112 | 1790.43 | 21.60 | **2.25** |
| #6 | 144,1088 256×64 | 1415.26 | 22.44 | **0.89** |
| #10 | 368,672 128×96 | 804.80 | 18.48 | **1.06** |

That is 8676.50 of 36000.28 (24.10%). In each of these, `nodes.ref` leads with the image ("black and white bed linen", 100% of region) and `nodes.actual` leads with `section` (100%). Region #2 `{240,896 512×176}` (5706.66) is the same photograph under the "Hear what matters." headline. The headline does not scale, so the remap test cannot separate it (15.63 after remap vs 19.69), and I do not claim it as proven.

**Proposed change.** Keep the ground's **captured** geometry (1168.5625 at 1280) and express the crop as a clip. Either parent the ground in a clip container whose box is the backdrop (REQ-332's `clip: true` container, which `nestClipRegions` already builds from the capture's `clip` ids), or have the backdrop container that owns the ground clip its overflow. Do not change the ground's box. The content-extent concern in the comment is answered by the clip: the clipped overhang paints nothing and lays nothing out.

**How to see it (no browser needed).**
```
python3 -c "
import json;p=json.load(open('storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-3/page.json'))
def w(n):
  yield n
  for c in n.get('children') or []: yield from w(c)
n=[n for n in w(p['data']['page']['l1']['root']) if n.get('id')=='image-1'][0]
print([(k['at'],k['height']) for k in n['geometry']['keyframes']])"
```
**Wrong (now):** `[(320, 347.17), (375, 314), (768, 314), (1024, 1011.16), (1280, 1157), (1440, 1157)]`. **Right** (same snippet pointed at `storage/references/www.hearingzone510.com/index/l1.json` after `bin/1c refold --ref storage/references/www.hearingzone510.com/index`, adjusting the root path to that file's shape): `[(320, 350.64), (375, 317.13), (768, 317.13), (1024, 1021.27), (1280, 1168.56), (1440, 1168.56)]`, with a clip ancestor at the backdrop's box. Then `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox`. **Wrong:** HIGH `size` 1280×1169 vs 1280×1157 and regions #3/#4/#5/#6/#10. **Right:** neither, and the photograph's regions at mean ≲2/255.

---

## Not attributed (evidence in hand does not separate them)

- 5 CRITICAL `arrangement` deltas in the footer ("Hours" ×2, "9 am - 5 pm", "Services ": expected beside, actual below; "FAX (510) 865-811": the reverse). The footer's root-level child order in `page.json` interleaves the location section's slices with the footer's (`0.14` band-6 → `0.15` band-11 → … → `0.24` band-9 → `0.25` band-10). That is REQ-380's mechanism, so these will probably move with it. I did not prove it.
- HIGH `zIndex` "(generic) #1d1e20 expected above image, actual below". Region #2's photograph tone matches (ref meanRgb (107.01,86.37,67.65) vs ours (110.42,90.05,71.12)), so the scrim is visibly applied. This looks like BUG-187 item 1's raw-level comparison, and I have not re-proved it.
- Regions #7, #11, #12 (1014.49 + 716.47 + 704.06 = 6.75%) are single text lines in the services section, with the same text on both sides. I did not diagnose them.


---

## Implementation (what landed)

Both issues are fixed in `tools/generate/src/l1/fold.ts`. They are fold-only, so `1c refold` picks them up with no re-capture.

**Issue 1: a band-wide gradient takes the captured surface rect.** In the surface-row builder, `shapeBoxAt` used to decline every surface rect at least as wide as the viewport. It now **accepts** that rect when the row carries a `gradient` and none of the run's own card treatments (`borderLeft`, `border`, `boxShadow`, `borderRadiusPx > 0`). The row's `surfaceFrames` are then the captured surface box at every width, and `buildCards` uses them instead of the run box.
- The REQ-88 rule still holds for any row whose run element has its own treatment, so an accent rule is never stretched across a band. That row keeps its run/accent box.
- The run-box fallback remains only for rows whose capture recorded no `surface.box`.
- On the stored hearingzone510 bundle, `card-0` (the `#f2b374`→`#f0dac4` gradient) refolds to `x 0, y 0`, full width, height 40 at 375–1440 and 41.59 at 320.

**Issue 2: an overhanging ground is clipped, not resized.** `clipGroundTo` no longer intersects the ground's keyframes with the backdrop's. If the ground overhangs its backdrop at any captured width (beyond `FOLD_CONTAINS_EPS`), it keeps its **captured** geometry and is wrapped in a `{kind:'container', layout:'stack', clip:true}` node. That node takes a copy of the backdrop's geometry (and its visibility, if set), and the ground is rebased into it. A ground already inside its backdrop at every width is returned unchanged, so no container is added. The container takes the ground's place in the backdrop layer, immediately before the backdrop. `groundImagesUnder` now returns `{grounds, grounded}` so the original image is still removed from the content.
- On the stored bundle, the "black and white bed linen" image refolds to heights `320 350.64, 375/768 317.13, 1024 1021.27, 1280/1440 1168.56`, and its clip parent is at the backdrop's `347.17 / 314 / 1011.16 / 1157`.

**Explicit supersession:** this replaces REQ-370 issue 1's "clipped to its box" by resizing. That intent (photo under its scrim, cropped to the backdrop) is preserved, but the crop is now expressed as a clip. `test_UAT_FC_REQ-370_the_hero_photo_precedes_its_scrim_in_paint_order_and_is_clipped_to_it` was updated to match: the photo stands in a `clip` container, that container is the veil's sibling and precedes it, and the container's height equals the veil's at every width.

## Test plan

`tests/test_UAT_FC_REQ-382_band_gradient_and_clipped_cover_ground.test.ts`:
- `a_band_wide_gradient_takes_the_captured_surface_rect`: a sticky-bar run (352×23.4) on a 40px full-width gradient surface folds to one gradient-painting node at `x 0`, width = viewport, height 40.
- `a_gradient_row_with_its_own_accent_rule_keeps_its_run_box`: with a `borderLeft` on the run, the gradient node stays narrower than the viewport.
- `the_ground_keeps_its_captured_box_inside_a_clip_at_the_backdrop`: the 1168.56 hero photo keeps height 1168.56 inside a `clip: true` container whose height equals the 1157 veil's.
- `a_ground_inside_its_backdrop_gets_no_clip`: a ground that fits its backdrop has no clip ancestor.

Regression: all 83 suites that call `foldToL1`/`refold` pass (737 tests), and `tools/generate` typecheck is clean. The pixel gate (`1c gate … --sandbox`) needs Chromium and was not run in this session.