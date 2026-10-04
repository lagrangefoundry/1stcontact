---
uid: request-a868beb0
id: REQ-385
type: request
title: 'fold: content is nested under a surface absent at widths where the content
  is present, so the testimonial section is display:none on phones (+ footer per-run
  plates, escapes cannot-tell)'
created_by: repro-console:repro-joyfulculinarycreations-com#9
created_at: '2026-10-04T17:18:58.353036+00:00'
updated_at: '2026-10-04T18:41:29.176715+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  defect_class:
  - fold-wrong
  - cannot-tell
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-7bf45402
---

Filed by `repro-console:repro-joyfulculinarycreations-com#9`, the reproduction of https://joyfulculinarycreations.com. The evidence comes from **one bundle**: `storage/references/joyfulculinarycreations.com/index` (capturedAt 2026-10-04T15:41:29.029Z, captureSchema 19). Every issue below is still present on HEAD (892f14aa37, which includes c5c06e0060 / REQ-383). I checked this by refolding a **copy** of the bundle (`cp -R … /tmp/jcc9-bundle && 1c refold --ref /tmp/jcc9-bundle`) and gating the copy. All three issues are on the fold side, so a re-capture is not needed.

## Summary

The gate verdict is `structural-failure`. Its diagnosis names only 92 content-robustness escapes. It does not mention that **the whole visible testimonial section is `display: none` at 320 and 375**: the heading "What people are saying", the visible testimonial, "Dan H.", "Parent / CFO" and both carousel arrows. The reference paints all of them at both widths. No value delta can see this, because values-diff compares at 1280 only. No pixel region can see it either, because the perceptual diff is shot at 1280. The only probe that sees it is `sampleFidelity` in `1c l1-gate`, and gate.json does not mention that probe (filed separately as a bug). Measured by the content-completeness rule, this is the round's worst defect.

Issues in dependency order:

1. **fold-wrong**: `nestBackingSurfaces` parents content under a surface that is absent at widths where the content is present, so the parent's `visibility` gate hides the content there. *(This is the content loss above.)*
2. **fold-wrong**: band membership is decided from the runs' own geometry, and the captured `surface.box` is ignored. A centred footer stack therefore becomes 7 run-sized `#edc251` plates. Issue 1 does not block this one.
3. **cannot-tell**: the 92 content-robustness escapes. The base document is pinned, and the flow recovery is not served because it scores worse (`recoveredFindings` 1642 vs `servedFindings` 892). The artefacts do not show why.

---

## Issue 1: fold nests content under a surface whose visibility is narrower than the content's own presence

**Residual class:** `fold-nests-content-under-a-surface-absent-where-the-content-is-present`
**defect_class:** `fold-wrong`. The capture carries every one of these runs at 320 and 375, and L1 can express a child that is present at more widths than its parent's band (by not nesting it). The fold chose the parent, and so wrote the wrong tree.

**Test run (the three questions):**
- *Can L1 express it?* Yes. The runs are present at all six widths in L1 (`0.50.0.0`–`0.50.0.4.1`, keyframes at 320/375/768/1024/1280/1440, no own `visibility`).
- *Is the L1 value right?* **No.** The runs' ancestor `section-band-1` (root child `0.50`) carries `visibility: {"fromPx": 768}`, with keyframes only at 768/1024/1280/1440. The renderer honours that exactly: `iteration-9/site/home.html:1869-1872` is `@media (max-width: 767px) { … .l1-74 { display: none } }`, and `.l1-74` is `#section-band-1`. Its descendant `.l1-75` (`#card-4`) holds `.l1-76` "What people are saying" through `.l1-87`. So the renderer is correct, and the L1 tree is wrong.

**Reference (oracle) at 320 and 375, from `multistate.json`, with opacity 1 at both:**

| width | "What people are saying" box | "Dan H." box |
|---|---|---|
| 320×800 | (20, 4509.83) 280×119.34 | (119.20, 5076.67) 81.58×18.20 |
| 375×800 | (20, 4058.48) 335×79.56 | (146.58, 4509.05) 81.58×18.20 |

**How it happens.** The evidence is in `l1.json`. You can read it with the commands under "How to see it".
- `section-band-1` is built by `buildSolidBands` from exactly two band rows. They are the off-screen carousel slides "“So fabulous. We are planning…" and "I cannot say enough good things…" (`backedBy: section-band-1`, keyframes 768–1440 only). These are the same slides that produce the `overflow` delta `≤1280w` → `1700w` (REQ-381's carousel class). The band therefore exists only where those slides were recorded.
- `nestBackingSurfaces` then gives `card-4` (present at 320–1440) to that band. `card-4` holds the six runs that are visible at every width. The ownership test is `containsEverywhere`, `tools/generate/src/l1/fold.ts:3934-3944`:
  ```ts
  for (const at of widths) {
    const parent = rectAt(surface, at)
    const child = rectAt(node, at)
    if (!parent || !child) continue   // ← a width where the parent is ABSENT is skipped
    shared++
    if (!contains(parent, child)) return false
  }
  return shared > 0
  ```
  A width where the child is present and the parent is absent is skipped, so it counts as agreement rather than as disqualification. The docblock above it says "Containment at EVERY width both are captured at". That is precisely the hole: the test looks only at widths where *both* exist, but a child of a gated parent is gated with it.
- The backdrops already paint that section at every width: `backdrop-7` `#ffffff` at (0, 4490) 320×863.55, (0, 4038) 375×696.27 … (0, 2950) 1280×525.02. A correct ownership choice was available.

**Proposed change.** In `containsEverywhere`, a width where the child has a rect and the parent has none must return `false`. A surface cannot own content it does not exist beside. This should be a general invariant of `nestBackingSurfaces`, and probably also of any other place in the fold that rebases a node into a container: never adopt a child whose presence widths are not a subset of the parent's. If the second form is cheaper, a post-fold assertion that rejects such a tree would turn every future instance into a loud failure instead of silent content loss.

Whether `section-band-1` should exist at all is a separate question (it is a band made from two off-screen slides). It is REQ-381 territory and is not needed to close this issue.

**How to see it (no browser needed):**
```
cd /Users/martin/lagrangefoundry/1stcontact
./bin/1c l1-gate --ref storage/references/joyfulculinarycreations.com/index --json \
  | python3 -c "import json,sys,collections; g=json.load(sys.stdin); print(collections.Counter(u['width'] for u in g['sampleFidelity']['unmatched'])); print([u['text'][:25] for u in g['sampleFidelity']['unmatched'] if u['width']==320])"
grep -n -A4 'max-width: 767px' storage/tmp/repro-console/repro-joyfulculinarycreations-com/iteration-9/site/home.html
```
- **Wrong (now):** `Counter({320: 6, 375: 6, 1440: 5, 768: 2, 1024: 2, 1280: 2})`. The 320 list is `['What people are saying', "We've really enjoyed havi", 'Dan H.', 'Parent / CFO', '', '']`, and the CSS block contains `.l1-74 { display: none }`.
- **Right:** no unmatched entries at 320 or 375 for those six texts, and no `display: none` on any ancestor of `card-4` below 768. The remaining unmatched entries at 768–1440 are the off-screen slides (REQ-381) and are not this issue.
- The same check on HEAD's fold, without touching the stored bundle: `rm -rf /tmp/jcc9-bundle && cp -R storage/references/joyfulculinarycreations.com/index /tmp/jcc9-bundle && ./bin/1c refold --ref /tmp/jcc9-bundle && ./bin/1c l1-gate --ref /tmp/jcc9-bundle --json`. Today, root child `0.48` (`section-band-1`, `fromPx: 768`) still holds 11 text runs.

**This will move the ruler in the right direction.** Six runs per narrow width that are unmatched today become matched, so the `sampleFidelity` residual list gets *more* entries (real position comparisons) and fewer unmatched entries.

---

## Issue 2: band membership ignores the captured surface rect, so a centred footer stack becomes 7 run-sized plates

**Residual class:** `fold-classifies-band-membership-from-run-geometry-not-the-captured-surface-rect`
**defect_class:** `fold-wrong`. capture.json records the right surface for every footer run (`surface.self: false`, `surface.box` (0, 4440.625) 1280×302.3125). The fold writes `card-N` containers with that fill and the run's own box.

**Test run:**
- *Can L1 express it?* Yes. A band row that owns no box is the existing "a narrow run on the band paints nothing of its own" path (`fold.ts:4713`).
- *Is the L1 value right?* **No.** The served L1 (`iteration-9/page.json`) has `card-6` `{"surfaceFill":"#edc251"}` 748×23.2 around "Follow us for our latest updates", and `card-10`…`card-15` `{"surfaceFill":"#edc251"}` sized to each nav link (`card-10` "Home" at 1280 = (344.06, 4677.42) 43.72×25.52). capture.json `.sections[9].content[1]` ("Home"): `surfaceFill "#edc251"`, `surface {"self": false, "box": {"x":0,"y":4440.625,"width":1280,"height":302.3125}}`, `paddingTopPx 0`, `border null`.

**Evidence, from `values-diff.json`.** There are 9 HIGH `surfaceBox` deltas, and all of them have the expected value `(0, 4441) 1280×302`:
`Home` → `(344, 4677) 44×26` · `Get in Touch` → `(844, 4677) 92×26` · `FAQ` → `(791, 4677) 30×26` · `Meet the Chef` → `(411, 4677) 108×26` · `Sample Menus` → `(660, 4677) 108×26` · `Our Services` → `(542, 4677) 95×26` · `Follow us for our latest updates` → `(266, 4522) 748×23`, plus three social glyphs ``/``/`` → `42×42`. In `actual-manifest.json`, "Home" has `surface.box` = its own 43.72×25.52 box with `self: false`. This is the fabricated plate the walk stops at.

There are 0 pixel regions, because the plate colour equals the band colour at rest. That is why it has survived. The same plate over a photograph is REQ-372's black-plate defect.

**Mechanism.** The fold's code path is `fold.ts:4690-4720`. A row with a fill and no own treatment is treated as a band row only if (a) it is ≥ 0.7 × page content width itself, or (b) `barBandFills` (`fold.ts:2695`) finds a same-fill row spanning ≥ 0.7 × width with a central gap ≥ 0.2 × width. This footer is a **centred** stack. The widest run is 748px (< 896), and the nav row spans x 344 → 936 = 592px with small gaps. Neither rule fires, so every run falls through to `cardRows` (`fold.ts:4719`). `shapeBoxAt` (`fold.ts:4458-4462`) declines the 1280-wide `surface.box` as a card rect, so `buildCards` (`fold.ts:3169-3170`) falls back to the run's own box. This is BUG-19's described failure ("each run would wrongly become a tiny card") returning on a layout BUG-19's heuristic does not cover. REQ-382 closed the gradient half of it (`bandWideGradient`), not the solid-fill half.

**Proposed change.** The row already carries the direct measurement as `bandSurface` (`fold.ts:4477-4479`: `widestShape.width >= widestAt`). A solid-fill row whose `bandSurface` is set, and which has no own treatment, should be treated as on-band (`continue`, paint nothing) whatever its own width. That makes the geometric heuristics a fallback for rows whose surface the capture did not resolve, rather than an override of one it did. `card-7`…`card-9` (the social rings) keep their card for the `border` 3px `#ffffff` they really own. Their fill should be dropped on the same terms (REQ-351's `hasOwnCardTreatment` route).

**How to see it:**
```
cd /Users/martin/lagrangefoundry/1stcontact
python3 -c "import json; d=json.load(open('storage/references/joyfulculinarycreations.com/index/l1.json')); r=d.get('root',d); print([(c['id'],c['geometry']['keyframes'][-2]['width']) for c in r['children'] if str(c.get('id','')).startswith('card-') and c.get('axes',{}).get('surfaceFill')=='#edc251'])"
```
- **Wrong (now):** 10 entries: `card-6` 748, `card-7..9` 41.59, `card-10..15` 43.72 / 108.09 / 94.64 / 108.44 / 29.8 / 92.19.
- **Right:** none of `card-6`, `card-10..15`, and no `#edc251` fill on the ring cards. After a re-gate (`CHROMIUM_LAUNCH_ARGS=--single-process ./bin/1c gate repro-joyfulculinarycreations-com --ref storage/references/joyfulculinarycreations.com/index --sandbox`), the 9 `surfaceBox` deltas should be gone.

---

## Issue 3: the 92 content-robustness escapes: base pinned, recovery not served (cannot-tell)

**defect_class:** `cannot-tell`. The evidence in hand does not separate a recovery defect (the fold) from a probe-model defect (BUG-188's "layout model diverges from the browser").

These are the whole of the gate's diagnosis: card-3 22, backdrop-2 20, backdrop-3 12, backdrop-4 12, backdrop-5 10, backdrop-8 8, backdrop-9 8 (from `gate.json` `layout.findings`). They are identical in count on HEAD. Example at 1280×768, copy ×2.5: the run `0.19.3` at (275, 1115.19) 714×208 is a **child** of `card-3` (257, 848) 750×439.97, and it ends 35px below the card. In the base document a container's height is a pinned constant, so this escape is expected there. The document that would fix it is the flow recovery, and it is not served: `1c l1-gate --json` → `recovery: {served: false, servedFindings: 892, recoveredFindings: 1642, fidelityResiduals: 35}` on the served fold. On HEAD it is `recoveredFindings: 1205, fidelityMaxDeltaPx: 80.02, fidelityResiduals: 215`, so recovery got better on findings and worse on fidelity. Earlier rounds attributed this population to REQ-337 / BUG-160. REQ-337 is at `ready_to_reconcile` and the counts have not moved.

**What I would need to tell.** The recovered document's own finding list. l1-gate reports only its count, so nobody can say which surfaces make recovery worse than the pinned base (filed as part of the bug that accompanies this ticket). With that list, the first step is to diff the recovered findings against the base findings by surface id.

---

## Also measured this round (existing classes, not re-filed)

- Pixel score: regions #1/#2/#4 ((16,320) 640×144 score 21567.59; (672,320) 160×80 score 3495.09; (304,320) 64×48 score 827.18) are 88.1% of the 29384.07 ranked total. They lie under "Dreaming of healthier meals" / "on your dinner table?" on both sides. The CRITICAL position deltas are `(20, 311)` → `(20, 300)` and `(20, 387)` → `(20, 376)`, plus "What people are saying" `(455, 3009)` → `(455, 2963)`. This is REQ-265's half-leading class, unchanged.
- The `overflow` delta (`≤1280w` vs `1700w`) and the 2 `a11yRole` button → generic deltas belong to REQ-381 (carousel). The 3 icon `size` deltas (40×40 vs 50×40 / 45×40) and 3 icon `position` deltas belong to BUG-190 / REQ-372 issue 2. The testimonial `surfaceFill` deltas (#28542d vs #7a957d) belong to REQ-302 issue 4's class.
- HEAD only (c5c06e0060, landed 09:44, after this gate ran at 08:43): `backdrop-9` is now nested under `backdrop-8`. The off-sample probe flags it at every off-sample width ≤1195 and at 1920 ("was full-bleed at every captured width and stops 480px short of the viewport's right edge"), which adds 18 escapes the served document did not have. Recorded as a comment on REQ-383.



---
Companion bug (instrument side of issue 1 and the recovery readout for issue 3): **BUG-201**. REQ-383 HEAD-regression note: COMMENT on REQ-383 from this round.