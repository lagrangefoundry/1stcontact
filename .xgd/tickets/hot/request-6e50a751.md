---
uid: request-6e50a751
id: REQ-380
type: request
title: 'fold: band rows are grouped by row-stream adjacency, so two same-fill sections
  shred into ten slices that miss their own runs and bury the logo (+2 capture losses:
  interior break-spaces collapsed, SVG icon links unrecorded)'
created_by: repro-console:repro-www-bluelotusintegralhealing-com#2
created_at: '2026-10-04T12:43:34.428986+00:00'
updated_at: '2026-10-04T15:13:45.147498+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  defect_class:
  - fold-wrong
  - capture-loses-it
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d2d77144
---

Filed by `repro-console:repro-www-bluelotusintegralhealing-com#2` (reproduction console, loop 1, iteration 2).

**Leading residual class:** `fold-groups-band-rows-by-stream-adjacency-not-by-section`

**Stored reference:** `storage/references/www.bluelotusintegralhealing.com/index` (Zyro/Astro), captured 2026-10-04T01:00:36.679Z at schema 17. This is the re-capture after REQ-371 landed, and the contact and footer sections are now present. All evidence below comes from this one bundle.
**Evidence dir:** `storage/tmp/repro-console/repro-www-bluelotusintegralhealing-com/iteration-2/` (`$ITER` below). `$REF` = the bundle path above.
**Gate:** `structural-failure`. Mean 2.08/255, 1.92% over threshold, 12 regions with a total ranked score of 5499.68, 18 deltas, **unmeasured 9** (9 populations).
**Landed since capture:** 6 commits, all consultant/plan/builder. None touches `tools/generate/src/cli/capture` or `l1/fold.ts`, so nothing below is a landed fix waiting on a re-capture.

## Summary, in dependency order

| # | residual class | class (§5) | `defect_class` | cost on this bundle |
|---|---|---|---|---|
| 1 | `fold-groups-band-rows-by-stream-adjacency-not-by-section` | 1 engine shortfall | `fold-wrong` | **212 of 282** escape findings (the whole on-sample failure). **9 of 9** unmeasured. Regions #4+#5, the logo's ink buried under band slices: 342.32 (6.2%) |
| 2 | `capture-collapses-interior-spaces-of-a-break-spaces-run` | 1 engine shortfall | `capture-loses-it` | regions #1+#2: **4097.32 of 5499.68 (74.5%)** of the ranked score, and the round's only CRITICAL delta |
| 3 | `capture-records-no-inline-svg-icon-link` | 1 engine shortfall | `capture-loses-it` | 4 social links (Facebook/Instagram/TikTok/Pinterest) lost from the footer. Region #3: 781.93 (14.2%). 0 deltas, 0 unmeasured, 0 coverage findings |

Issues 1, 2 and 3 are independent. Issue 1 is first because it is the verdict, all of the unmeasured set, and a content loss (the logo mark is painted over). Issues 2 and 3 are capture-side, so each **needs a re-capture after it lands** (`1c refold` cannot pick them up). Issue 3 will **add** comparisons: 4 elements the oracle has never seen will become real measurements.

**Not re-filed (known classes):**
- The other 70 escapes are all `contentRobustness` on `section-band-2`/`-3`, `backdrop-1`/`-2` and `section-bg-0`: pinned-height surfaces under 2.5× copy. That is the REQ-337/BUG-160 class.
- The 7 `surfaceFill` #30499c→#4359a5 deltas on the hero runs are REQ-302 issue 4's scrim asymmetry.
- The 8 `padding*` and 4 "surface band vs own plate" LOW deltas on the four CTA pills are an instrument asymmetry introduced by REQ-371 issue 3's (correct) encoding. They are filed separately as a bug (see the closing note).

---

## Issue 1: the fold groups band rows by adjacency in the row stream, so two same-fill two-column sections shred into ten slices

**Class 1 (engine shortfall). `defect_class: fold-wrong`.** Defence: the capture carries the right answer (one white section and one blue section, each with an exact box). L1 can express it: `backdrop-3`/`backdrop-4` already express exactly those two boxes in this very document. The fold writes ten slice bands and points every run at the wrong one.

**Test run.** Q1: L1 can express a band (`box` with `surfaceFill`). Q2: is the L1 value right? No.

`$REF/capture.json` `sections[4]` = `{y:1994, h:560, background #ffffff}` and `sections[5]` = `{y:2554, h:392, background #249ed3}`, at 1280. `$ITER/page.json` folds those two sections into **ten** `section-band-N` nodes (1280 keyframes, `y`/`height`):

| band | fill | y | h | runs that declare `backedBy` it | first run's y |
|---|---|---|---|---|---|
| section-band-4 | #ffffff | 1994 | 95 | Get in Touch, Connect with me…, Contact | 2080.27 / 2168.92 / **2241.29** |
| section-band-5 | #ffffff | 2089 | 92 | Your Name* (child), Support, support@… | **2306.55**, 2330.72 |
| section-band-6 | #ffffff | 2181 | 83.19 | Your Email Address* (child) | |
| section-band-7 | #ffffff | 2264.19 | **8.81** | troystengel@… (contact) | 2264.19 |
| section-band-8 | #ffffff | 2273 | 280 | Your Message* (child) | |
| section-band-9 | #249ed3 | 2554 | 86.5 | Blue Lotus…, Transformative…, ©, Connect | 2586 / 2647 / **2824.52** |
| section-band-10 | #249ed3 | 2640.5 | 66.16 | Your Name* (footer) | |
| section-band-11 | #249ed3 | 2706.66 | 22.84 | contact | |
| section-band-12 | #249ed3 | 2729.5 | **2.44** | Your Email Address* (footer) | 2729.5 |
| section-band-13 | #249ed3 | 2731.94 | 72 | troystengel@… (footer) | |

The heights sum to 559 and 249.94. The document **already** carries the right two surfaces: `backdrop-3` `{y 1993, h 561, #ffffff}` and `backdrop-4` `{y 2553, h 393, #249ed3}`. So every slice is a duplicate of a backdrop of the same fill, and each run's `backedBy` points at a slice that does not cover it **at rest, at the captured 1280 width**. For example, "Contact" sits at 2241.29 and its band ends at 2089.

**Mechanism.** `buildSolidBands` (`tools/generate/src/l1/fold.ts:2797`) groups `bandRows` into "maximal consecutive-same-fill runs in **document order**" (`:2806-2812`). It then sorts groups by top and tiles each band "from its own top to the next band's top" (`:2865-2871`). Tiling is only correct if the groups occupy disjoint y-intervals. Here the row stream alternates between the contact section (white) and the footer (blue), so 2 sections become 10 groups. The L1 root's child order shows the interleave: `0.14` "Contact" (white) → `0.15` "contact" (footer, blue) → `0.16` troystengel (white) → `0.17` troystengel (blue) → … → `0.20`/`0.21` "Your Name*" ×2 → `0.22`/`0.23` "Your Email Address*" ×2. Each pair is the same text, once per section. That is consistent with `table.rows` (`fold.ts:4016`, from the responsive table) adjoining same-text rows. I did not trace that ordering, and the fix below does not depend on it. Both sections are two columns (copy left, form right). So the fragments interleave in y as well, and each band is cut off at the next fragment's top while its own copy continues below.

**What it costs.**
- `$ITER/diff/gate.json` `layout.findings`: 282 escapes, of which **212** name a slice: band-9 ×74, band-4 ×66, band-5 ×44, band-7 ×14, band-12 ×14. Every one of the 58 `onSample` escapes is in this set, at every width including 1280. Example: `'© 2025. All rights reserved.' is no longer covered by its backing surface section-band-9 — 202px below its bottom edge` at 1280×768.
- **Unmeasured 9 = 9 of these slices.** `values-diff.json` `unpairedActual` lists exactly nine 1280-wide `generic` boxes: `{y 1994 h 95}`, `{y 2264.19 h 8.80}`, `{y 2089 h 92}`, `{y 2181 h 83.19}`, `{y 2273 h 280}`, `{y 2706.66 h 22.83}`, `{y 2731.94 h 72}`, `{y 2640.5 h 66.16}`, `{y 2554 h 86.5}`. The reference has no counterpart for any of them, because it paints one surface per section.
- **Content buried.** Seven slices were promoted to flow `container`s owning one run (`l1-gate` `recovery.promoted` includes `0.15, 0.17, 0.20, 0.21, 0.22, 0.24, 0.27`). That puts them in content order **after** `image-1` (`0.10`, the footer logo, 1280 `{x 504.94, y 2617, 270×254.5}`), so the blue slices band-10/11/12/13 (2640.5–2803.94) paint over it. Measured from `$ITER/diff/actual.png` against `$REF/screenshot-1280.png`, over x 505–775 in 10px rows: from y 2690 to 2790, ours is **96.9–100% flat #249ed3** where the reference is 73.9–96% (the logo mark's ink). Diff pixels are 1.4–15.9% per row, and 0.0% in every row outside 2690–2790. That is regions #4 `{x 624, y 2720, 80×48}` (score 244.4) and #5 `{x 576, y 2752, 48×16}` (97.92), with `(img)` on both sides' `nodes`.

**Hypothesis.** `buildSolidBands`' grouping key is stream adjacency. It should be the surface the rows actually sit on.

**Proposed change (in order).**
1. Group band rows by **(fill, captured section)**: the `sections[].box` (or captured backdrop box) containing the row at the widest width. Do not group by stream adjacency. Alternatively, as a minimum, merge any same-fill groups whose widest-width y-extents overlap or touch before tiling. Either way, this bundle should yield one white and one blue group.
2. When a captured backdrop of the same fill already covers a group's rows at every width (here `backdrop-3`, `backdrop-4`), emit **no** `section-band-N` for the group. Write `backedBy` = that backdrop's id instead. REQ-332 already makes a `backdrop-*` a backing surface for the probes.
3. A band must never be promoted into content order where it can paint over an earlier content leaf. If promotion stays, it must keep the band beneath every non-band sibling.

This will **remove** findings rather than add deltas: the 212 escapes and all 9 unmeasured populations should go to 0.

**How to see it (no browser needed).**
```
bin/1c l1-gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox --json > /tmp/g.json
python3 -c "
import json,re,collections as C
g=json.load(open('/tmp/g.json'));c=C.Counter()
for bw in g['onSample']['byWidth']:
  for f in bw['findings']:
    m=re.search(r'backing surface (\S+)',f['detail']);c[m.group(1) if m else f['kind']]+=1
print(sum(c.values()),dict(c))"
```
**Wrong (now, verified on HEAD):** `58 {'section-band-9': 20, 'section-band-4': 18, 'section-band-5': 12, 'section-band-7': 4, 'section-band-12': 4}`. **Right:** `0 {}`.

To see the fold directly after a re-fold, list the `section-band-*` nodes in `1c page get repro-www-bluelotusintegralhealing-com <pageId> --sandbox --json`. **Wrong:** ten bands between y 1994 and 2804 at 1280, including heights 8.81 and 2.44. **Right:** none (or exactly two, `{1994, 560}` and `{2554, 392}`). Every run in those sections should have `backedBy` naming a surface whose 1280 box contains it.

Pixels: `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox`. Regions #4/#5 over the logo should disappear, and `unmeasured` should read 0 populations.

---

## Issue 2: the capture collapses interior whitespace in a run whose computed `white-space` preserves it

**Class 1 (engine shortfall). `defect_class: capture-loses-it`.** Defence: the source has two spaces and the capture's own `whiteSpace` field says they are preserved, yet `capture.json` and `multistate.json` carry one. Nothing downstream can recover a space the oracle does not hold. L1 carries `whiteSpace: "break-spaces"` correctly, and the renderer honours it.

**Test run.** Q1: L1 expresses it (`whiteSpace` text axis, REQ-370). Q2: is the L1 value right? The axis is right, but the `text` is one space short, and the cause is upstream:

```
grep -c 'begin?  Please'      $REF/rendered.html   -> 1   (visible <p>, also 2 in raw.html)
grep -c 'together.  Through'  $REF/rendered.html   -> 2
grep -c 'together.  Through'  $REF/capture.json $REF/multistate.json -> 0 / 0
grep -c 'together. Through'   $REF/capture.json $REF/multistate.json -> 1 / 12
```
`multistate.json` records `whiteSpace: "break-spaces"` for "Ready to begin?…" at all 6 widths. Under `break-spaces` interior spaces are preserved and take width.

**What it costs.**
- Region #1 `{x 240, y 576, 800×16}`, score **2433.05**, meanDiff 48.66. `nodes.ref[0]` and `nodes.actual[0]` are both "Ready to begin? Please complete…", box `{233.98, 572, 811.83×24}` on both sides. The run is centred, and `renderedTextBox` is `{x 236.05, w 807.69}` on ref against `{x 237.59, w 804.59}` on ours (`expected-manifest.json` #9 / `actual-manifest.json` #10). The width is **3.09px** short, which is consistent with one U+0020 advance in Lato at 16px. Half of that is the CRITICAL `position` delta: `text @ (236, 574)` → `(238, 574)`, magnitude 1.539.
- Region #2 `{x 288, y 1296, 432×32}`, score **1664.27**. "Welcome to my Beyond Quantum Healing…" contains "together.  Through" in the source. It is left-aligned, so only the remainder of that one line shifts: `rowDiff` is 0 except rows 12–23 of the region. Its box and `renderedTextBox` width (600.81) are identical on both sides. The **instrument sees nothing here**, because `values-diff.ts:1044` compares text through `collapse()`, so this 30% of the score has 0 deltas.

Every other text run I paired by text (36 of them, at 1280) has an identical `renderedTextBox.width` on both sides, so the font is not the cause.

**Hypothesis.** `tools/generate/src/cli/capture/extract.ts:2792`: `var kept = preservedWhiteSpaceOf(getComputedStyle(owner)) ? collapseWs(n.nodeValue) : t;`. Even on the preserved branch, `collapseWs` (`:1238`, `/[ \t\n\r\f]+/g → ' '`) folds every whitespace run to one space. REQ-370 issue 3's landing note says this was deliberate for edge spaces ("collapsed to one, not trimmed"). It is wrong for interior runs under `break-spaces`/`pre-wrap`, where the browser keeps all of them.

**Proposed change.** On the preserved branch, keep `n.nodeValue` verbatim for spaces and tabs (both values preserve them). For `pre-wrap`/`break-spaces`, also keep segment breaks, or map `\n` to an explicit line break the fold can carry. Then check that the fold and renderer pass the run's text through unmodified (the renderer already emits `white-space: break-spaces`). Bump the capture schema. **Needs a re-capture.**

**How to see it / know it is fixed.** After the fix and a re-capture (`CHROMIUM_LAUNCH_ARGS=--single-process bin/1c capture page http://www.bluelotusintegralhealing.com`, or the console's **recapture**):
- **Wrong (now):** `grep -c 'together.  Through' $REF/capture.json` prints `0`. **Right:** `1`.
- Then `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox`. **Wrong:** the CRITICAL `position` delta on "Ready to begin?…" (236 vs 238), and regions #1/#2. **Right:** neither.

---

## Issue 3: the capture records no element for an inline-SVG icon link, so the footer's four social links vanish

**Class 1 (engine shortfall). `defect_class: capture-loses-it`.** Defence: `$REF/rendered.html` has four `<a class="social-icons__link" href="https://www.facebook.com/…|instagram|tiktok|pinterest…"><svg …24×24…>` inside a `GridSocialIcons`. `capture.json` contains 0 occurrences of `facebook`, `instagram` or `social`. The 1280 projection of `multistate.json` has no element in `x<200, 2770<y<2830` except the © line. The fold and renderer never saw them.

**What it costs.** Region #3 `{x 48, y 2784, 128×32}`, score **781.93** (14.2%). `nodes.ref` is only `section` #5. `nodes.actual` is section-band-13's slice (62% of region). `readout.meanRgb` ref `(88.03, 181.05, 221.46)` against ours `(36, 158, 211)`, which is #249ed3 exactly. The pixel at (100, 2800) is (255,255,255) on ref and (36,158,211) on ours. Four links and their hrefs are lost, with 0 deltas, 0 unmeasured and no coverage finding.

**Relation to existing tickets.** REQ-366 issue 2 covers elements whose only ink is a `::before` glyph or a border. REQ-370 issue 2 records full-viewBox SVG *panels* and states that "Icons and every other SVG stay unrecorded". This is that remaining case: a link whose only ink is a small inline SVG.

**Proposed change.** Record a link (or any interactive element) whose only painted descendant is an inline `<svg>` as an icon field: its box, href, title/aria label, and the SVG's serialized markup (or a rasterized asset, as images are mirrored). That lets the fold emit an image leaf with a link. **Needs a re-capture**, and it **will add** comparisons (4 currently invisible elements).

**How to see it.**
```
grep -c facebook storage/references/www.bluelotusintegralhealing.com/index/capture.json      # wrong: 0
grep -o 'social-icons__link' storage/references/www.bluelotusintegralhealing.com/index/rendered.html | wc -l   # 4 in the page
```
**Right:** after the fix and a re-capture, the first command is ≥1, and region #3 is gone from `CHROMIUM_LAUNCH_ARGS=--single-process bin/1c gate repro-www-bluelotusintegralhealing-com --ref storage/references/www.bluelotusintegralhealing.com/index --sandbox`.

---

## Not attributed

- HIGH `zIndex` on the footer logo: "expected above ©, actual below". The logo box `{504.94, 2617, 270×254.5}` overlaps the © box `{57.98, 2824.52, 503×18.19}` only over x 505–561, where the © glyphs (`renderedTextBox` width 166.73) do not reach. I found no visible consequence. It is the same document-order mechanism as issue 1's burial, and may clear with it.


## Related tickets filed this round

- **BUG-197** (`instrument-blind`, `instrument-asymmetric`): (1) the containment probe asserts a fold-declared `backedBy` without checking that it holds at rest, and then diagnoses this issue 1 as "exact at rest, comes apart when the viewport moves"; (2) the 12 LOW pill deltas compare padding on one side against min-height on the other.
- Issue 2 continues REQ-370 issue 3, whose landing kept edge spaces "collapsed to one". REQ-370 is frozen at `ready_to_reconcile`, so the residual is filed here.


---

## Appended by `repro-console:repro-www-hearingzone510-com#3`: second bundle, same class

`repro-console:repro-www-hearingzone510-com#3` is the iteration 3 re-measurement of `fold-groups-band-rows-by-stream-adjacency-not-by-section`, on a **second** Zyro bundle: `storage/references/www.hearingzone510.com/index` (captured 2026-10-04T12:31:57.996Z, schema 17). Evidence is in `storage/tmp/repro-console/repro-www-hearingzone510-com/iteration-3/`. Here this class is **the whole structural-failure verdict**.

**The capture is right.** `capture.json` `sections[5]` = `{y 4279, h 757, #224e7a}` (Where To Find Us: three location columns) and `sections[6]` = `{y 5036, h 614, #757575}` (footer). The fold already emits the matching backdrops: `backdrop-5` `{4279, 757, #224e7a}` and `backdrop-6` `{5036, 614, #757575}` at 1280.

**The fold shreds them into 12 slices.** At 1280, from `page.json`, as (path, id, y, h):

| blue #224e7a (section 5) | grey #757575 (section 6) |
|---|---|
| `0.9` section-band-4: 4279, **584.41** | `0.25` section-band-10: 5036, 108.8 |
| `0.14` section-band-6: 4863.91, 82 | `0.15` section-band-11: 5144.8, **20.8** |
| `0.14.0` section-band-5: −0.5 (relative), **0.5** | `0.19` section-band-12: 5165.59, **20.8** |
| `0.18` section-band-7: 4945.91, **24** | `0.16` section-band-13: 5186.39, 122.59 |
| `0.20` section-band-8: 4969.91, 66.09 | `0.17` section-band-14: 5308.98, 120.19 |
| `0.24` section-band-9: 4969.91, 66.09 (**identical to band-8**) | `0.23` section-band-15: 5429.17, 67 |

The root child order interleaves the two fills: `0.14` blue → `0.15`/`0.16`/`0.17` grey → `0.18` blue → `0.19` grey → `0.20` blue → `0.23` grey → `0.24` blue → `0.25` grey. That is the stream adjacency your issue 1 describes. Both sections repeat the same texts: "Hours" and "9 am - 5 pm" appear in the location columns and again in the footer's location list. That supports your same-text-row interleave hypothesis.

**Cost.**
- `gate.json` `layout.findings`: **820 of 886** escapes name one of these slices: band-10 ×444, band-4 ×134, band-11 ×92, band-5 ×66, band-13 ×46, band-6 ×22, band-7 ×8, band-12 ×8. **All 214 `onSample`** findings are in this set, including 27 at the captured 1280×768. One example is `'© 2026 Hearing Zone Audiology All rights reserved.' is no longer covered by its backing surface section-band-10 — 372px below its bottom edge`, with the run at y 5499 and band-10 at 5036–5145. The other 66 are `contentRobustness` on pinned surfaces (REQ-337/BUG-160).
- **11 of the 14 unmeasured**: `values-diff.json` `unpairedActual` indices 78, 82, 83, 84, 85, 117–122 are exactly these slices (e.g. `{y 4863.90625, h 82}`, `{y 5144.796875, h 20.796875}`).
- The 5 CRITICAL footer `arrangement` deltas ("Hours" ×2, "9 am - 5 pm", "Services ", "FAX (510) 865-811": beside↔below) are probably the same interleave seen through document order. I did not prove this.

**Re-verified on HEAD** (no browser):
```
bin/1c l1-gate repro-www-hearingzone510-com --ref storage/references/www.hearingzone510.com/index --sandbox --json > /tmp/g.json
python3 -c "
import json,re,collections as C
g=json.load(open('/tmp/g.json'));c=C.Counter()
for bw in g['onSample']['byWidth']:
  for f in bw['findings']:
    m=re.search(r'backing surface (\S+)',f['detail']);c[m.group(1) if m else f['kind']]+=1
print(sum(c.values()),dict(c))"
```
**Wrong (now):** `214 {'section-band-4': 36, 'section-band-11': 24, 'section-band-10': 118, 'section-band-13': 12, 'section-band-5': 18, 'section-band-6': 6}`. **Right:** `0 {}`.

**For the implementer.** Your proposed fix 1 (group by fill + captured section) and fix 2 (defer to a same-fill backdrop that already covers the rows) both close this bundle too. `backdrop-5` and `backdrop-6` are exact. This bundle also contains a 0.5px slice nested *inside* another slice (`section-band-5` under `section-band-6`) and two byte-identical slices (`-8`/`-9`), so add it to the fixture set. `defect_class` for this re-measurement: `fold-wrong`. The capture's two section records are exact, and L1 already expresses them as `backdrop-5`/`-6`.


---

## Implementation (free-coded, REQ-380)

Why free-coded: three bounded engine fixes with exact evidence on one bundle, no design phase needed.

### Issue 1 — fold: band rows grouped by section, not stream adjacency (`tools/generate/src/l1/fold.ts`, `buildSolidBands`)

What a user sees: two same-fill sections fold to one surface each, every run's `backedBy` names a surface whose box contains it at rest, and no band paints over the footer logo.

- **Grouping.** Band rows are ordered top-to-bottom at the widest width (page order, not row-stream order) and grouped into maximal runs of the same **fill AND the same captured section** (the `sections[].box` with the greatest vertical overlap at the widest width). A row absent at the widest width has no comparable coordinate, so it keeps the position of the stream row before it. Same-fill content in one section split by a different-fill band still forms separate groups, so a single-wrapper page with white/dark/white bands still tiles correctly.
- **No duplicate of a captured backdrop.** If a captured backdrop already paints the group's fill (same `surfaceFill`, opaque, no background image) and contains every row's frame at every width, the fold emits **no** `section-band-N` for that group. Those runs get `backedBy` = the backdrop's id, written once `nameCapturedBackdrops` has named it (only if it was named a `backdrop-*`). The check runs *after* tiling, so neighbouring bands keep exactly the geometry they would have had.
- **Burial (step 3).** No separate guard was added. With section grouping, a band that still exists contains its section's leaves (the logo included) and owns them, and a band a backdrop replaces no longer exists. A UAT pins that no band ever paints over a content leaf under it.
- **Measured on a copy of the stored bundle** (`1c refold` on a copy, then `1c l1-gate`; the shared reference was not touched): onSample escapes 58 → **0**; offSample 100 → 4 (the 4 left are pre-existing `overlap`s); contentRobustness 600 → 512 (all 88 `section-band-*` findings gone, nothing new). On this bundle every reconstructed band is gone. Ten were the slices; the other three (`section-band-0/2/3`) were duplicates of `backdrop-0/1/2`. Runs in the contact section name `backdrop-3`, footer runs name `backdrop-4`, and the logo (`image-1`) now paints after every surface.

### Issue 2 — capture keeps every preserved space (`tools/generate/src/cli/capture/extract.ts`)

What a user sees: a `break-spaces`/`pre-wrap` run keeps every space it lays out, so "together.  Through" keeps both spaces.

- On the preserving branch the run's `text` (and its `textFlow`) is the text node verbatim. Space runs, tabs and segment breaks are kept, and only CRLF is normalised to LF, as the HTML parser does. Collapsing runs are unchanged. The fold and renderer already carried text through untouched, and the renderer emits `white-space: break-spaces`.
- **Needs a re-capture** (`1c refold` cannot pick it up).

### Issue 3 — capture records an inline-SVG icon link (`extract.ts`, `pipeline.ts`)

What a user sees: a link (or button) whose only ink is one inline `<svg>` reaches the reproduction as a linked image with its href and accessible name. The four footer social links are the case here.

- The extractor picks a host with `a[href], button, [role=button], [role=link]` above the `<svg>`. The host must hold exactly one `<svg>`, no `<img>`, and no text outside the svg; otherwise the svg is decoration beside copy and stays unrecorded, as before. The `<svg>` is recorded as a **media field**: `objectFit: 'contain'`, `intrinsicAspect` from its box, `alt` from the host's `aria-label`, then `title`, then the svg `<title>`, plus `href`/`newTab` from the existing helpers.
- The field carries `svgMarkup`: a clone with each node's computed paint (`fill`, `stroke`, opacity and so on) written as presentation attributes, page classes removed, and the root's computed `color`. That way `fill: currentColor` paints correctly with no stylesheet present. `src` = `assets/inline-svg-<fnv1a(markup)>.svg`, so every width that sees the same icon names the same file.
- The pipeline (`addInlineSvgAssets`) writes each markup into the bundle as an ordinary `image` asset whose origin **is** that path, so `localizeAssets` resolves it like any mirrored image. `svgMarkup` is raw-only: it is never projected into `capture.json` or a manifest. The fold needed no change, because it already turns a media field with an `href` into a linked `image` leaf.
- Icon links are exempt from the "fields inside the band's repeated-item group are skipped" rule. A row of identical icon links is usually that item group itself, and an item records only text runs, so the icons would otherwise be lost by construction.
- **Needs a re-capture.** It **adds** comparisons: elements the oracle never held before.

### Capture schema 17 → 18 (`schema.ts`)

Two axes were added: preserved spaces in a preserving run, and the inline-SVG icon field. `test_UAT_FC_REQ-377_a_schema_16_bundle_names_the_scroll_and_sticky_axes_as_missing` no longer pins 17 as current. It now asserts that a 17 bundle names neither scroll nor sticky, the same adjustment BUG-187 made to REQ-370's test.

### Test plan

`tests/test_UAT_FC_REQ-380_bands_by_section_spaces_and_icon_links.test.ts` (12 UATs):
- Issue 1 (real `foldToL1` over a synthetic ladder shaped like the bundle: two sections, interleaved stream, logo): one band per section covering it and runs backed inside; no band paints over the logo; with same-fill backdrops, no band and every run names a containing `backdrop-*`.
- Issue 2 (real `EXTRACT_SCRIPT` under jsdom): `break-spaces` keeps the double space; `pre-wrap` keeps its space run and newline; a collapsing run still collapses; the kept spaces survive fold and render; schema ≥ 18.
- Issue 3 (jsdom, then `runCapturePipeline` with a fake driver, then fold, then `localizeAssets`): each icon link is a media field with href, name, box and a unique asset path; the markup is self-contained; an svg beside its link's own copy stays unrecorded; the bundle carries the asset bytes at the field's path, `capture.json` does not carry the markup, the fold emits a linked image, and the mirror resolves it with nothing unmirrored.

Regression scope: the fold/band suites (bug14, bug19, REQ-271/332/338/350, BUG-112/142/143/153/158/160/161/173/179, reconciliation-l1-*) and the capture suites (capture, bug12/16/27, REQ-211/269/270/275/302/333/338/366/370/377, BUG-187, coverage). `test_UAT_FC_BUG-48_*` (4) and `test_UAT_FC_REQ-349_a_control_matches_a_page_that_names_no_face` also fail on a clean xgd-working, so they predate this work.