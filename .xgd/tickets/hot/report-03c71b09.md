---
uid: report-03c71b09
id: REPORT-1731
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-08-09T07:43:49.269888+00:00'
updated_at: '2026-08-09T07:43:49.269888+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 2
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 2
**Needs review**: 0

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories with **16 ACs each** —
STORY-84 (`story-8acc338d`, the fold) and STORY-86 (`story-24098299`, the 3-probe
gate + cross-gate reconciliation). All 32 ACs are `kind: behavior` and `status:
active`.

**Evidence executed this session** (not carried forward from a prior report):

```
npx vitest run tests/reconciliation-l1-fold.test.ts \
  tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-3probe-gate.test.ts \
  tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts --reporter=verbose
```

→ **6 files passed, 32 tests passed, 1.15s.** No `it()` is skipped. One in-test
branch skips (warning 1) — re-confirmed by direct `playwright.chromium.launch()`
in this worktree, which fails with `Executable doesn't exist at
…/chromium_headless_shell-1228/…`; `test_UAT_AC694` completes in 190ms with only
its pre-branch assertions running.

**Coverage at a glance.** Every one of the 32 ACs has **exactly one**
`test_UAT_AC<n>_*` test (verified by enumerating all 342 `test_UAT_AC*` symbols
under `tests/` and counting per AC number: 32 ACs, count 1 each). Every one drives
a real entry point — `foldToL1`, `cmdCapturePage`, `cli.run`, `renderL1Document`,
`validateL1`, the probe/evaluator/cross-gate APIs. No AC is covered only by a
structural or AST check. **Coverage is therefore not the failing property; two
consistency gaps are.**

**Working reference and its caveat.** At `uat` level the AC body is the working
reference. That holds for 29 of the 32 ACs. It does **not** hold for AC-691,
AC-731 and AC-736 — the ac-level cycle (REPORT-1658 / `report-f3b0654d`,
2026-08-07, 5 violations / 3 warnings) closed without repair, and no AC body in
this tree has been edited since 2026-08-06 (the 2026-08-07 `updated_at` on all six
ACs I sampled is the `uat_coverage` field write, not a body edit — AC-691 still
carries the sentence BUG-18 retired, AC-731 still carries the per-run model BUG-14
retired, both verified by reading the live bodies this session). For those three I
escalated to intent + code rather than grading a test against a body known to be
stale; the outcome is recorded as info 1–3 below, **not** as UAT violations,
because their resolution category is `ac-edit` and no uat editor can act on them.

**Story-level cascade.** REPORT-1729 (`report-d52afd90`, level=story, 2026-08-09,
FAIL — 3 violations) landed earlier in this same regression cycle and is
unrepaired. Its findings 1 and 2 (`1c repro` + BUG-23 self-containment unowned by
any story; BUG-18's responsive scalar text tracks unexpressed in STORY-84) are
`story-body-edit` → `ac-add` → `uat-add` chains. They are recorded as info 4–5
here, not as uat findings: a UAT authored now would trace to no matrix element.

## Cumulative Intent Considered

Verified directly this session (status read from the live tickets):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + REQ-85 + REQ-86 — recorded as both stories' `intent_uid` | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Reflowed cell across a breakpoint keeps its keyframe | YES → AC-735 |
| BUG-9 | free_and_reconciled | 2026-07-23 | Structure recovery must recurse into nested regions | YES → AC-709 |
| BUG-11 | free_and_reconciled | 2026-07-23 | Fold must carry `surfaceFill` / `surfaceGradient` | YES → AC-730/731/736 |
| BUG-12 | free_and_reconciled | 2026-07-23 | Captured font faces must reach the resource table | YES → AC-732 |
| BUG-13 | free_and_reconciled | 2026-07-23 | Section/CSS background-images are foldable nodes | YES → AC-812 |
| **BUG-14** | free_and_reconciled | 2026-07-23 | Surface reconstruction is band → card, **not** per-run | YES (retires per-run) → **info 1** |
| BUG-17 | free_and_reconciled | 2026-07-23 | Fold must carry element padding | YES (no AC — story-level warning 4 of REPORT-1729) |
| **BUG-18** | free_and_reconciled | 2026-07-23 | Flat text axes must be keyframed per width, not taken at desktop | YES (retires widest-sample) → **info 2**, **info 5** |
| BUG-23 | free_and_reconciled | 2026-07-24 | Reproduction must be self-contained (mirrored assets) | YES (unowned) → **info 4** |
| BUG-27 | free_and_reconciled | 2026-07-25 | CSS background images / lazy media are captured | YES → AC-812 |
| REQ-94 | free_and_reconciled | 2026-07-25 | Cross-gate reconciliation, perceptual floor, coverage, named causes | YES → AC-852…856 |
| REQ-96 | free_and_reconciled | 2026-07-26 | L1 `control` node; controls bind to module seams | YES → AC-733/AC-813 |
| BUNDLE-8 (`bundle-…`) | free_and_reconciled | 2026-07-29 | BUG-7 + REQ-89/90/91/92 + 5 more — the full-language fold | YES → AC-689/729/730/732/733/737 |
| BUNDLE-10 | free_and_reconciled | 2026-07-29 | BUG-12…BUG-16 + 11 more | YES |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | BUG-27 + REQ-94 + REQ-96 + REQ-97/98 + 10 more — recorded as both stories' `updated_by` | YES |

Carried forward from the ledgers of REPORT-1729 (story, today) and REPORT-1662
(uat, 2026-08-07), whose individual member tickets now resolve through the bundles
above and are outside the paginated ticket window: REQ-79, REQ-83, REQ-86, REQ-88,
REQ-90, REQ-92, REQ-66 (retired `adopt-values`), BUG-5, BUG-6, BUG-7 — all
`free_and_reconciled`. REQ-114 and REQ-82/84/85/97-107 are out of scope (CAP-70 /
CAP-63) per this capability's own "Out of scope" statement.

## Alignment Ledger

### STORY-84 (fold) — 16 ACs

| AC | UAT | Outcome |
|---|---|---|
| AC-689 | `reconciliation-l1-fold.test.ts:207` | **drift** — validated doc / ladder widths / root kind / explicit empty-ladder throw proven; the capture fixture is still text-only so the full-language clause is unexercised (**violation 2**) |
| AC-690 | `…l1-fold.test.ts:233` | aligned — `multistate.json` present, oracle widths equal the folded document's `widths` |
| AC-691 | `…l1-fold.test.ts:256` | **drift** — keyframe widths / x / y / width / widest-sample `fontSizePx` proven; **both height clauses unasserted** (**violation 1**). Body itself stale vs BUG-18 (info 2) |
| AC-692 | `…l1-fold.test.ts:292` | aligned — fluid → `['interpolate']`, reflow → `['snap']` |
| AC-693 | `…l1-fold.test.ts:319` | aligned — bounded `fromPx: 1024` on the subrange node, `undefined` on the always-present node |
| AC-694 | `…l1-fold.test.ts:345` | **weak** — four of six sidecar dimensions gated behind a chromium branch that skips on this runner (**warning 1**) |
| AC-695 | `…l1-fold.test.ts:392` | aligned — `renderL1Document` from the folded doc alone; no sidecar in scope |
| AC-696 | `…l1-fold.test.ts:413` | aligned — unknown-command + exit 1 + four dead symbols absent + the `adopt-gaps` carve-out still recognized |
| AC-729 | `…full-language.test.ts:83` | aligned — src/alt/fallback, omitted-axis discipline, four-side pinning, visibility, render, src-less → residual |
| AC-730 | `…full-language.test.ts:209` | aligned — full surface axes, single-axis divider proves omission, height-bearing track, CSS paints |
| AC-731 | `…full-language.test.ts:298` | **test right / AC stale** — the UAT asserts the shipped BUG-14 model (1 `section-band-*` + 2 `card-*` for 5 runs); AC-731's body still says "runs sitting on the band get no backing box" (info 1) |
| AC-732 | `…full-language.test.ts:379` | aligned — five treatments fold + render, re-fold identity, painted-only font table |
| AC-733 | `…full-language.test.ts:497` | aligned — five typed residuals with kind/reason/axes/widths; REQ-96-updated (geometry-bearing control binds, geometry-less one is the residual); opt-in channel |
| AC-812 | `…seams-and-refold.test.ts:101` | aligned with a gap — image handle + fill + four-side track, ordering ahead of the headline proven in the leaf list **and** the rendered HTML, band clamp proven by counterfactual; the "after the section-background boxes it is a peer of" half is unasserted (**warning 2**) |
| AC-813 | `…seams-and-refold.test.ts:229` | aligned — one seam per form at the union rect at all six widths, three `control` leaves, per-width rebase checked against the retained oracle |
| AC-814 | `…seams-and-refold.test.ts:498` | aligned — real `cli.run(['refold'])`, `fetch` spy proves offline, sha256 over every bundle file proves only derived artifacts are rewritten, ladderless bundle rejected |

### STORY-86 (gate + cross-gate) — 16 ACs

| AC | UAT | Outcome |
|---|---|---|
| AC-705 | `…3probe-gate.test.ts:299` | aligned — clean base, residual with dx/dy/dw at the last width, unmatched, repeated-text occurrence pairing, kind-keyed non-text pairing |
| AC-706 | `…3probe-gate.test.ts:448` | aligned — pass at 500/900, `narrowOracle` degradation at 500 only, multi-region overlay holds |
| AC-707 | `…3probe-gate.test.ts:481` | aligned — pinned base fails, flowed passes, multi-region collisions span >2 children then clear |
| AC-708 | `…3probe-gate.test.ts:524` | aligned — both non-vacuity arms, fidelity on base, sub-reports carried |
| AC-709 | `…3probe-gate.test.ts:551` | aligned — own-path single region, three nested paths, per-region gaps, zero pinned descendants, validity, byte-identical base fidelity |
| AC-710 | `…3probe-gate.test.ts:636` | aligned **to its AC body** — residual names run/width/deltas; overlap and clip findings name kind/detail/paths. Pinned-box overflow uncovered because no AC states it (info 3) |
| AC-724 | `…3probe-gate.test.ts:673` | aligned — double-evaluation identity at every ladder width, 3 uncollapsed runs, per-occurrence x/y within 2px |
| AC-734 | `…gate-evaluator.test.ts:114` | aligned — main-axis tiling at ascending x, row height = tallest child, fixed-width mix, genuine clip, stack and grid |
| AC-735 | `…gate-evaluator.test.ts:303` | aligned — keyframe at the breakpoint, `snap` precondition, post-reflow boxes at exactly 768, closed-bound counterfactual |
| AC-736 | `…gate-evaluator.test.ts:382` | aligned to code — finding-signature equality across 8 widths × 2 scales, `sawGenuineOverlap` guard, surface clip, slot exclusion. AC wording broader than the code's fold-synthesized-only rule (info 6) |
| AC-737 | `…gate-evaluator.test.ts:591` | aligned — three channels distinct, per-residual kind/reason/axes/widths, human-readable and JSON forms, passing gate still reports residuals |
| AC-852 | `…cross-gate-reconciliation.test.ts:250` | aligned — four signals in one report + verdict/diagnosis/nextStep, `neverDriver` proves browser-free ordering on both paths, artifacts written, CLI exit 0/1 |
| AC-853 | `…cross-gate.test.ts:343` | aligned — mean-only and pct-only breaches, floor echoed in report and formatted output, per-run tightening flips a pass to a fail, non-numeric `--mean-floor` refused |
| AC-854 | `…cross-gate.test.ts:425` | aligned — media counts + unreferenced paths + truncation, page-height density finding, clean bundle still reports counts, three-way narrow/wide/wrong-engine fixture proves the widest-resting-projection clause |
| AC-855 | `…cross-gate.test.ts:557` | aligned — five named causes with distinct verdicts **and** distinct next steps (`size === 5` on both), plus coverage-before-deltas precedence |
| AC-856 | `…cross-gate.test.ts:659` | aligned — passing verdict with non-zero deltas via API and CLI (exit 0), manifest-less and empty-manifest bundles both hard-error |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-691 (`acceptance_criterion-304cae4c`) / `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | uat-edit | AC-691's criterion turns on a **height** distinction — "A box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height, leaving its height natural from flow" — and its Verification names both halves ("and no keyframe carries a height"; "For a folded image leaf and a folded box leaf, assert every keyframe carries a height"). The UAT (`tests/reconciliation-l1-fold.test.ts:256-290`) asserts keyframe `at` values, x/y/width and widest-sample `fontSizePx`, and makes **no height assertion at all** (`:280-288`). Keyframe-height assertions exist elsewhere only on image/box leaves (`…full-language.test.ts:163,272,358` under AC-729/730/731), so the **text-leaf "no height" invariant has zero executable evidence anywhere in the repo**. The distinction is live and load-bearing in code — `tools/generate/src/l1/fold.ts:1678` `buildGeometry(withHeight)`, called `false` for the text leaf at `:1741` and `true` for image/box at `:1872`/`:1915`; `:1691` is the guard that omits the height. AC-707's content-robustness probe grows text runs, which is only meaningful because text height is natural rather than pinned: if a regression started pinning text heights, all 32 UATs in this capability would still pass (re-verified — 32/32 green this session). **Third offence: filed as REPORT-1320 violation 1 (2026-08-05) and REPORT-1662 violation 1 (2026-08-07); `tests/reconciliation-l1-fold.test.ts` has not been touched since `f0367940d`, 2026-07-22.** | In `test_UAT_AC691`, assert `kfs.every((k) => k.height === undefined)` for the `Headline` text leaf, and extend the same fixture with one media element and one painted panel, asserting each of their keyframes carries `height` equal to the captured box height |
| 2 | violation | consistency | AC-689 (`acceptance_criterion-7785b92a`) / `test_UAT_AC689_capture_emits_one_validated_l1_document` | uat-edit | AC-689 states the document "is emitted in the **full** L1 language, not text alone: it may carry text leaves, image leaves, box leaves and backing-surface leaves", and its Verification asks to "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind". The UAT (`tests/reconciliation-l1-fold.test.ts:207-231`) drives `cmdCapturePage` with `FakeDriver`, whose `signalsFor()` (`:103-133`) carries exactly **one** text run and `items: []`, `fields: []`, `images: []` — so the folded document has exactly one leaf kind and the clause REQ-92/BUNDLE-8 added to this AC is never exercised. The four assertions present cover only the REQ-83-era criterion (artifact exists, `validateL1` ok, `widths` = ladder, root kind, explicit empty-ladder throw). Nearest coverage is `…full-language.test.ts:330` (`new Set(kinds).size > 1`), but that is AC-731's UAT and runs on `foldToL1` directly, **not** the `cmdCapturePage` bundle path AC-689 governs. **Third offence: filed as REPORT-1320 violation 2 (2026-08-05) and REPORT-1662 violation 2 (2026-08-07), never repaired.** | Add a media element and a painted panel to `signalsFor()`, then assert the `l1.json` read back from the bundle carries leaves of more than one kind (e.g. `new Set(children.map((n) => n.kind)).size > 1`) |
| 3 | warning | consistency | AC-694 (`acceptance_criterion-c8dd43d2`) / `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` | uat-edit | AC-694 enumerates six sidecar dimensions (ancestry/`parentId`, parent computed layout, authored sizing unit per axis, position mode, sibling-repetition count, ascending `@media` breakpoints). The substantive assertions — parent layout mode, `justify-content`, real percent unit, real breakpoint 600 — sit behind `if (!(await chromiumAvailable())) return` (`tests/reconciliation-l1-fold.test.ts:364`). **Re-verified skipped on this runner this session**: `playwright.chromium.launch()` fails with `Executable doesn't exist at …/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`, and the UAT completes in 190ms. On the always-run path the two remaining assertions (`:358` breakpoints ascending, `:359` some node `widthUnit === 'percent'`) are satisfied by the test's own `CANNED_HINTS` (`:135-153`, returned verbatim by `FakeDriver.query` at `:164-167`), so they prove the sidecar round-trips to disk, not that extraction computes those values. Ancestry, position mode and `repeatCount` are asserted on **neither** path, and `CANNED_HINTS.parentLayout` is `null`. **Re-raise of REPORT-1320 warning 3 / REPORT-1662 warning 3.** | Move the *contract* assertions (per-node `parentId`, `position`, `repeatCount`, and a non-null `parentLayout` — which needs `CANNED_HINTS` enriched) onto the canned-driver path so they always run, leaving only extraction *accuracy* engine-gated. Do **not** repair by deleting the skip: chromium genuinely cannot launch here |
| 4 | warning | consistency | AC-812 (`acceptance_criterion-fd94d9ab`) / `test_UAT_AC812_backdrop_folds_behind_content_bounds_bands_and_feeds_the_page_base` | uat-edit | AC-812's layering clause has two halves — the backdrop is placed behind the text runs of the band it sits under, **and after the section-background boxes it is a peer of**. The UAT proves the first half twice over (`…seams-and-refold.test.ts:140-150`: leaf index before the first text leaf, and `id=` before `Nested Hero` in the rendered HTML) but asserts **nothing** about the backdrop's position relative to the band/section-bg boxes, even though the same fixture materialises them as `heroBands` (`:158-161`) and only checks their vertical clamp. The rule is live in code (`fold.ts`, `children: [...bandNodes, ...sectionBgNodes, ...backdropNodes, ...cardNodes, ...body, ...slotNodes]`) and load-bearing: absolutely-positioned siblings with no z-index paint in source order, so a backdrop emitted *before* its band would have the band's opaque fill paint over the hero photograph — the mirror image of the defect the asserted half guards against. **Re-raise of REPORT-1662 warning 4.** | Add one assertion to `test_UAT_AC812`: `expect(leaves.indexOf(backdrop)).toBeGreaterThan(Math.max(...heroBands.map((b) => leaves.indexOf(b))))` — the fixture already produces both node sets |
| 5 | info | consistency | AC-731 (`acceptance_criterion-6a5e0eec`) | — | The UAT asserts the shipped BUG-14 model — three band runs coalesce into **one** `section-band-*` box and the two surface-differing runs fold **two** `card-*` boxes, three boxes for five runs (`…full-language.test.ts:333-351`), with an in-test comment naming BUG-14. AC-731's body (read live this session) still specifies the retired per-run model ("Every run whose composited surface differs … folds an additional backing box leaf carrying that fill/gradient **and the run's geometry**") and its Verification clause "runs on that fill emit no backing box" is **not assertable as worded** — the band runs do produce a shared full-bleed band box. Test right, AC stale. Resolution is `ac-edit`, filed as REPORT-1658 finding 3 and unrepaired. | none at this level; a `uat-edit` follows once AC-731 is rewritten |
| 6 | info | consistency | AC-691 / BUG-18 | — | Separate from finding 1: AC-691's closing sentence ("A node's authored typography axes are taken from its widest present sample") is the behaviour BUG-18 (free_and_reconciled, 2026-07-23) was filed to remove. `responsiveTextTracks()` now emits a per-width keyframe track for `fontSizePx`/`lineHeightPx`/`letterSpacingPx` whenever the axis varies across the ladder. The AC-691 fixture varies `fontSizePx` (24/32/44 at 320/768/1280), so the folded leaf **does** carry such a track — and the UAT asserts only `axes.fontSizePx === 44` (`…l1-fold.test.ts:288`), which still holds because the widest keyframe equals the scalar. The UAT is consistent with its stale AC while silent on BUG-18's shipped behaviour. Resolution is `ac-edit` (REPORT-1658 finding 2, unrepaired) — and now also STORY-84 `story-body-edit` (REPORT-1729 violation 2, filed today). | none at this level; a `uat-edit` adding the track assertion follows the AC rewrite |
| 7 | info | coverage | pinned-box content overflow | — | The evaluator raises **three** envelope violations (`probes.ts` — sibling overlap, horizontal clip beyond the viewport, pinned-box content overflow). `test_UAT_AC710` exercises only overlap (`…3probe-gate.test.ts:654-660`) and the viewport-edge clip (`:664-670`), because **no AC states the third**. First filed as REPORT-1319 finding 1 (2026-08-05), re-filed as REPORT-1658 finding 1 (2026-08-07); it has now survived two ac-level cycles unrepaired. The repair is `ac-add` at ac level; a UAT written now would trace to no matrix element. | none at this level; a `uat-add` follows once the AC lands |
| 8 | info | coverage | `1c repro` / BUG-23 self-containment | — | REPORT-1729 violation 1 (level=story, today) found that REQ-88's `cmdRepro` and BUG-23's `localizeAssets` self-containment rule are expressed in **no** story in the matrix, though both shipped with free-coded UATs (`tests/req88-l1-repro-pipeline.test.ts`, `tests/bug23-repro-local-assets.test.ts`). Their sibling verb `cmdRefold` **is** owned here (AC-814). The chain is `story-body-edit` → `ac-add` → `uat-add`; nothing is actionable at uat level until the story and AC land. Recorded so the next uat cycle expects the follow-on. | none |
| 9 | info | consistency | AC-736 (`acceptance_criterion-76d9ee68`) | — | AC-736 excludes "a painted surface leaf — a childless box carrying a card/panel/section fill" from the sibling-overlap check. The code is narrower: only **fold-synthesized** surfaces are excluded (`section-band-*` / `section-bg-*` / `card-*`), while a captured standalone `box-*` still participates. `test_UAT_AC736` asserts the code's narrower rule and passes. Recorded so the AC editor knows the UAT needs no change once AC-736 is tightened. Cascades from REPORT-1658 finding 10. | none |
| 10 | info | exclusivity | AC-733 + AC-813; AC-731 + AC-812; AC-705 + AC-724; AC-707 + AC-709 | — | Checked for duplication at uat level. AC-733's and AC-813's UATs both fold a geometry-bearing form control but assert disjoint things — "binding is not dropping" (empty `field` residuals, one slot, control names) vs. the seam union rect, the per-width origin rebase against the oracle, preserved field heights and the submit's inline-vs-stacked reproduction. AC-731's and AC-812's UATs both touch page-base inference, but from dominant-run-fill and from a captured backdrop respectively. AC-705/AC-724 share the `repeatedTextOracle` fixture and AC-707/AC-709 share `multiRegionOracle`, in each case asserting probe verdict vs. determinism/recovery. **No duplicates across all 32.** | none |
| 11 | info | coverage | AC-812, AC-813, AC-814, AC-852–AC-856 | — | These eight ACs (added 2026-08-06) each have a substantive UAT and all eight pass. STORY-84's and CAP-71's `uat_coverage: fail`, and the `fail` flags on AC-689/AC-691/AC-694 specifically, are explained by findings 1–3 — not by these eight. The remaining 29 ACs carry `uat_coverage: pass` and this check concurs with every one of them. | none |

## Notes for the Editor

**Both violations are the same shape, both are cheap, and both are now third
offences.** Each is a UAT that proves its AC's REQ-83-era clauses but not the
clause a later BUNDLE-8 intent (REQ-92) added — AC-691's height split and AC-689's
full-language emission. They were filed on 2026-08-05 (REPORT-1320) and again on
2026-08-07 (REPORT-1662). `tests/reconciliation-l1-fold.test.ts` has not been
touched since 2026-07-22 (`f0367940d`, confirmed by `git log` this session), so no
repair has ever been attempted. Both live in that one file and can land in a
single edit: AC-691 needs one `height === undefined` assertion plus a media/panel
element in the existing fixture; AC-689 needs `signalsFor()` to carry a media
element and a painted panel. **If the next cycle repairs only one thing, repair
this file.**

**Finding 1 is the more important of the two.** The image/box half of AC-691's
height rule is at least proven elsewhere in the suite (AC-729/730/731 UATs); the
text-leaf half is proven nowhere in the repo. That invariant is what makes AC-707's
content-robustness probe meaningful — the probe grows text and expects the layout
to absorb it, which is only true because `buildGeometry(false)` omits the height.

**Do not repair finding 3 by deleting the skip.** Chromium cannot launch on this
runner — playwright resolves build 1228 while the cache holds a different build,
verified again this session by invoking `chromium.launch()` directly. Move the
contract assertions onto the canned-driver path and leave only extraction accuracy
engine-gated.

**Findings 5–9 are deliberately not filed as UAT work.** All five are ac-level or
story-level repairs already filed (REPORT-1658 findings 1/2/3/10; REPORT-1729
violations 1/2) and left unrepaired when those cycles closed. Authoring or editing
UATs for them now would either encode a fixed bug (AC-691's widest-sample sentence,
AC-731's per-run model) or trace to no matrix element (pinned-box overflow, `1c
repro`). Findings 6, 7 and 8 each carry a follow-on `uat-edit`/`uat-add` that
becomes actionable the moment the AC lands — the next uat cycle should expect
three new items, not zero.

**Verification performed.** Every claim above was checked in this worktree
(`regression-50f23d80`): all 32 UATs executed with `--reporter=verbose` (6 files,
32 passed, 1.15s) and per-test timings taken to confirm AC-694's branch skips;
`playwright.chromium.launch()` invoked directly to confirm the build mismatch;
`fold.ts:1670-1730` (`buildGeometry` and its three call sites) read directly to
establish the text/box height split; the live bodies of AC-689, AC-691, AC-694,
AC-731, AC-736, AC-812 read from the ticket store; `git log` run on each of the six
test files to establish which UATs have moved since REPORT-1662; and the
`test_UAT_AC*` symbol set enumerated across `tests/` to confirm one-test-per-AC
with no duplicates and no orphans.
