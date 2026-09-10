---
uid: report-7f31793a
id: REPORT-3748
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T14:58:53.662206+00:00'
updated_at: '2026-09-10T14:58:53.662206+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: uat
  violations: 10
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: uat

**Result**: FAIL
**Violations**: 10
**Warnings**: 4
**Needs review**: 0

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories. STORY-84
(`story-8acc338d`, the fold) now carries **24** ACs — up from 18 at the last uat
cycle — and STORY-86 (`story-24098299`, the 3-probe gate + cross-gate
reconciliation) carries **17**, up from 16. **Seven of the 41 are `status:
pending`** (AC-1625, AC-1626, AC-1627, AC-1628, AC-1629, AC-1631 under STORY-84;
AC-1630 under STORY-86); the other 34 are `active`. None is `deprecated`.

**Working reference.** The ac-level cycle ran today and **passed** (REPORT-3747 /
`report-645376b9`, 0 violations / 0 warnings / 0 needs_review), as did the
story-level cycle (REPORT-3744 / `report-421de5ec`). Per the level cascade the AC
body is my working reference throughout. I did not need to escalate to intent
history for any finding: every AC body I graded against is internally coherent and
its Verification section is unambiguous about what a UAT owes it.

**Method — and it is stronger than last cycle's.** Unlike REPORT-2090
(2026-08-16), which had to grade statically because execution was denied, **the
tests were executed this run**. All seven AC-traced test files for this capability
were run in this worktree via `npm test -- <files>`:
`reconciliation-l1-fold.test.ts`, `…-full-language.test.ts`,
`…-framing-and-adjustment.test.ts`, `…-seams-and-refold.test.ts`,
`reconciliation-3probe-gate.test.ts`, `…-gate-evaluator.test.ts` and
`reconciliation-cross-gate-reconciliation.test.ts` — **7 files, 34 tests, all
green** (1.08s + 0.99s). So **no finding below is a failing test**. Every finding
is a *silence*: a criterion clause that no assertion closes, or a criterion with no
AC-traced test at all. That is the harder class to catch and the whole point of
this level.

**The headline, in two parts.**

1. **Seven ACs authored since the last uat cycle have zero AC-traced UATs.** A
   repo-wide grep for `test_UAT_AC1625|1626|1627|1628|1629|1630|1631` returns
   **nothing** — not in `tests/`, not anywhere. Six of the seven do have adjacent
   free-coded (`test_UAT_FC_*`) evidence for the underlying behaviour, which makes
   their repair cheap; **AC-1630 has none, in any test, anywhere in the
   repository.**
2. **The two long-running violations on `tests/reconciliation-l1-fold.test.ts` are
   now on their FIFTH consecutive report and the file has still never been
   touched** — `git log -1` on it returns `f0367940d3`, **2026-07-22**. And a
   third violation has joined them on a *different* file this cycle, freshly
   created by today's ac-level repair of AC-710.

**On grading `pending` ACs as violations.** These seven are not retired and not
speculative — they are authored criteria whose behaviour is *shipped* (I read the
production code for each). REPORT-3747's own finding 3 settles the reading:
"`pending` is authorship state, not retirement … Their UAT status is a uat-level
question, and the two authored this cycle (AC-1630, AC-1631) will arrive at that
level with no tests, **which is the expected next gate**." This is that gate.
Recording them as `info` would let a capability whose `uat_coverage` is `fail`
pass a coverage check with seven unproven criteria, so they are filed as
`uat-add` violations. The distinction is legible in the table below and the fix
can be sequenced however the editor prefers.

## Cumulative Intent Considered

At `uat` level intent is consulted only where an AC is itself suspicious. No AC was
this run — the ac-level cycle closed every stale body it had been re-raising
(AC-691's widest-sample sentence vs BUG-18, AC-731's per-run model vs BUG-14, the
AC-731/AC-812 page-base contradiction), all of which I re-read live and confirmed
repaired. The ledger below is therefore carried from REPORT-3747 / REPORT-2090
rather than re-derived, with the intents behind the seven new ACs identified from
the source that implements them.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Both stories' `intent_uid` | YES |
| BUG-14 | free_and_reconciled | 2026-07-23 | Band → card surface reconstruction | YES — AC-731 now matches it |
| BUG-17 | free_and_reconciled | 2026-07-23 | Per-side padding folds and insets | YES — behind **AC-1626** |
| BUG-18 | free_and_reconciled | 2026-07-23 | Responsive text axes keyframed per width | YES — behind **AC-1625**; AC-691 now matches it |
| BUG-23 | free_and_reconciled | 2026-07-2x | Reproduction assets localized to the mirror | YES — behind **AC-1628** |
| BUG-24 | free_and_reconciled | 2026-07-2x | Band scrim alpha folds onto the section-bg box | YES — behind **AC-1629** |
| BUNDLE-8 / BUNDLE-10 | free_and_reconciled | 2026-07-29 | The full-language fold — source of the clause violation 9 leaves unexercised | YES |
| REQ-88 | free_and_reconciled | — | Viewport-height probe + nowrap threshold + column anchoring | YES — behind **AC-1627** and **AC-1631** |
| BUNDLE-11 (`bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | STORY-86's `updated_by` | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Typed framing + colour adjustment; AC-1133/AC-1134, widened AC-729 | YES |

REQ-114 and REQ-154 owe this capability nothing (REPORT-3747 finding 5, re-read and
concurred). REQ-82/84/85 are CAP-70's per this capability's own "Out of scope".

## Alignment Ledger

### STORY-84 (fold) — 24 ACs

| AC | UAT | Outcome |
|---|---|---|
| AC-689 | `reconciliation-l1-fold.test.ts:207` | **drift** — bundle artifact / `validateL1` / ladder widths / root kind / empty-ladder throw proven; the BUNDLE-8 full-language clause unexercised (**violation 9**) |
| AC-690 | `…l1-fold.test.ts:233` | aligned — `multistate.json` retained, oracle widths equal folded `widths` |
| AC-691 | `…l1-fold.test.ts:256` | **drift, worsened** — both height clauses unasserted, and today's AC rewrite added a constant-axis/no-track clause the varying fixture cannot exercise (**violation 8**) |
| AC-692 | `…l1-fold.test.ts:292` | aligned — fluid → `['interpolate']`, reflow → `['snap']` |
| AC-693 | `…l1-fold.test.ts:319` | aligned — bounded `fromPx: 1024`, `undefined` on the always-present node |
| AC-694 | `…l1-fold.test.ts:345` | **weak** — three sidecar dimensions asserted on neither path; both named Verification dims engine-gated (**warning 1**) |
| AC-695 | `…l1-fold.test.ts:392` | aligned — renders from the folded doc alone |
| AC-696 | `…l1-fold.test.ts:413` | aligned — unknown-command + exit 1 + dead symbols absent |
| AC-729 | `…full-language.test.ts:83` | **narrowed** — union-on-one-leaf unproven (**warning 3**); tail now duplicates AC-733 (**warning 4**) |
| AC-730 | `…full-language.test.ts:214` | aligned |
| AC-731 | `…full-language.test.ts:303` | **now aligned** — the AC body was rewritten today to the shipped BUG-14 band+card model the UAT already asserted; REPORT-2090's info 5 closes |
| AC-732 | `…full-language.test.ts:384` | aligned |
| AC-733 | `…full-language.test.ts:502` | aligned |
| AC-1133 | `…framing-and-adjustment.test.ts:92` | aligned — every Criterion rule covered, closes on negative space (`:157`) |
| AC-1134 | `…framing-and-adjustment.test.ts:164` | aligned — spellings, no-ops, both clamps, negative space (`:261`) |
| AC-812 | `…seams-and-refold.test.ts:101` | aligned with a gap — layering half proven twice, peer half unasserted (**warning 2**) |
| AC-813 | `…seams-and-refold.test.ts:229` | aligned |
| AC-814 | `…seams-and-refold.test.ts:498` | aligned |
| **AC-1625** *(pending)* | **none** | **gap — no AC-traced UAT** (**violation 2**) |
| **AC-1626** *(pending)* | **none** | **gap — no AC-traced UAT** (**violation 3**) |
| **AC-1627** *(pending)* | **none** | **gap — no AC-traced UAT** (**violation 4**) |
| **AC-1628** *(pending)* | **none** | **gap — no AC-traced UAT** (**violation 5**) |
| **AC-1629** *(pending)* | **none** | **gap — no AC-traced UAT** (**violation 6**) |
| **AC-1631** *(pending)* | **none** | **gap — no AC-traced UAT** (**violation 7**) |

### STORY-86 (gate + cross-gate) — 17 ACs

| AC | UAT | Outcome |
|---|---|---|
| AC-705, AC-706, AC-707, AC-708, AC-709, AC-724 | `…3probe-gate.test.ts:299…673` | aligned to their own Verification sections (see info 3 on AC-706/AC-707) |
| AC-710 | `…3probe-gate.test.ts:636` | **drift, new this cycle** — Verification now demands three forced violations; the UAT forces two (**violation 10**) |
| AC-734, AC-735, AC-736, AC-737 | `…gate-evaluator.test.ts:114…591` | aligned; AC-736's body was tightened this cycle and its UAT already matched (REPORT-2090 info 10 closes) |
| AC-852…AC-856 | `…cross-gate-reconciliation.test.ts:250…659` | aligned (unchanged; file untouched since 2026-08-05) |
| **AC-1630** *(pending)* | **none** | **gap — no UAT of any kind, AC-traced or free-coded** (**violation 1**) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1630 (`acceptance_criterion-2c02ca04`) | uat-add | **The only criterion in this capability with no executable evidence anywhere in the repository.** AC-1630 states the evaluator reports a **third** envelope violation — a pinned box whose flow interior outgrows its keyframe height — with `kind: 'clip'`, a detail naming content-height-vs-pinned-height, and the offending node's index path, raised under both the off-sample and content-robustness probes, epsilon-tolerant, setting `pass = false`. The behaviour is live and specific: `tools/generate/src/l1/probes.ts:407-415`, `detail: \`content height ${...}px exceeds pinned box height ${pinnedH}px\``. **No test asserts it.** A repo-wide grep of `tests/` for `exceeds pinned` returns zero hits; every one of the eight `kind === 'clip'` assertions in `tests/` is the *horizontal viewport clip* — `…gate-evaluator.test.ts:183` and `:448` both close on `/exceeds viewport …px/`, and `…3probe-gate.test.ts:668` accepts any `/\d+px/`, which the viewport-clip detail already satisfies. So the branch at `probes.ts:410` could be deleted and all 34 UATs in this capability would stay green. This is also the last unclosed item of REPORT-2090's info 9 chain: the gap was first filed 2026-08-05, the AC was authored today to receive it, and the test is the remaining half. | New `test_UAT_AC1630_pinned_box_content_overflow_is_reported`: build a doc whose pinned box's stacked flow children exceed its keyframe height, `evaluateLayout` it, assert **exactly one** `clip` finding whose `detail` matches both magnitudes (`/content height \d+px exceeds pinned box height \d+px/`) and whose `paths` equal that box's index path; then raise the keyframe height above the content and assert the finding is gone; add a sub-epsilon overrun raising nothing, and a height-less node raising nothing by construction; finally assert the same violation surfaces through `offSampleProbe` and `contentRobustnessProbe` with `pass = false` |
| 2 | violation | coverage | AC-1625 (`acceptance_criterion-ee8ba69f`) | uat-add | No `test_UAT_AC1625_*` exists. AC-1625 owns the responsive-track rule — a numeric type axis (font size, line height, letter spacing) or a padding side that differs across the ladder folds to a per-width keyframe track; one holding a single value stays a scalar; the widest keyframe equals the scalar; segments omitted so the default is `interpolate`. **The behaviour is well evidenced but untraceable to the matrix**: `tests/bug18-responsive-text-axes.test.ts` carries six `test_UAT_FC_BUG-18_*` tests covering the varying axis (`:91`), the static-axis-stays-scalar rule (`:110`), per-width render (`:132`), narrow ≠ desktop (`:152`) and envelope robustness (`:187`), and `req88-viewport-relative-and-nowrap.test.ts:532` covers the padding-track half. Those trace to BUG-18/REQ-88, not to AC-1625, so the AC has no UAT by the naming convention that links tests to the matrix. | Author `test_UAT_AC1625_varying_axis_folds_to_a_track_and_a_constant_one_stays_scalar` in `tests/reconciliation-l1-fold.test.ts` (or a sibling reconciliation file), lifting the assertion shapes from `bug18-responsive-text-axes.test.ts:91-131` and `req88-…:532`; cover in one fixture the varying font size, the varying-vs-constant padding side on one element, the constant run emitting no track, the widest-keyframe-equals-scalar identity, `validateL1`, and the narrow-width render |
| 3 | violation | coverage | AC-1626 (`acceptance_criterion-1e5570ac`) | uat-add | No `test_UAT_AC1626_*` exists. AC-1626 owns per-side padding folding onto a text/image/box leaf as the typed `padding` axis and — the load-bearing half — **insetting content within the pinned border box rather than inflating it**, with zero/absent/out-of-range sides dropped and no axis at all when nothing is positive. Adjacent evidence: `tests/bug17-fold-padding.test.ts` carries six `test_UAT_FC_BUG-17_*` tests including `…_padding_insets_within_border_box_geometry` (`:94`) and `…_partial_padding_omits_absent_sides` (`:85`). Traces to BUG-17, not to AC-1626. | Author `test_UAT_AC1626_per_side_padding_folds_and_insets_within_the_pinned_box` covering AC-1626's Verification: an asymmetric four-side element and a padding-free one, geometry keyframes **unchanged** by the padding fold, the no-axis cases, `validateL1`, and a render asserting the inset |
| 4 | violation | coverage | AC-1627 (`acceptance_criterion-96ccb3ce`) | uat-add | No `test_UAT_AC1627_*` exists. AC-1627 owns the viewport-**height** sampling axis: a height probe yields a measured `{yFactor, heightFactor}` finite difference per node; no probe → no response invented; **a probe is never a keyframe** (partitioned off the ladder, adding no cell and no duplicate comparison width); each response applied against its own keyframe's captured viewport height; a reconstructed surface inherits its representative row's response. Adjacent evidence: `req88-viewport-relative-and-nowrap.test.ts:331` (hero tracks the viewport), `:350` (content below is pushed down), `:363` (no probe → nothing invented), `:590` (probe partitioned out of the ladder), `:609` (fidelity probe does not count it as a coverage gap). Traces to REQ-88. | Author `test_UAT_AC1627_height_probe_yields_a_measured_response_and_is_never_a_keyframe`, consolidating those five REQ-88 shapes against AC-1627's Verification, and adding the clause none of them closes: a node *unaffected* by viewport height carrying **no** response |
| 5 | violation | coverage | AC-1628 (`acceptance_criterion-3bce83ba`) | uat-add | No `test_UAT_AC1628_*` exists. AC-1628 owns bundle → servable site materialization: the document copied verbatim, idempotent re-import, **every media handle rebound to the bundle mirror before write**, an unmirrored handle failing the import outright with a re-capture instruction, unreferenced mirrored assets reported as a fold gap, and a seam/binding-disagreeing bundle rejected. Adjacent evidence: `req88-l1-repro-pipeline.test.ts:101` (import renders the L1 page), `:123` (idempotent rebuild), `:159` (gate requires a recaptured bundle); `bug23-repro-local-assets.test.ts:88,106,127,149,158,167` covers the mirror-rebinding half including `…_unmirrored_handle_fails_the_import_rather_than_hotlinking` and `…_unreferenced_mirrored_assets_are_reported_as_a_fold_gap`. Traces to REQ-88/BUG-23. | Author `test_UAT_AC1628_bundle_materializes_as_a_servable_site_with_localized_assets` following AC-1628's Verification end to end — node-count parity, localized-handle count equals handles rewritten, no captured origin in the written document, idempotence, the throwing unmirrored case naming the handle, and the unreferenced-asset report |
| 6 | violation | coverage | AC-1629 (`acceptance_criterion-e8bcef98`) | uat-add | No `test_UAT_AC1629_*` exists. AC-1629 owns the band scrim: a translucent veil folds onto the **same** section-background box that carries the band's background image as a second axis, never as its own node; a section folds when it paints an image **or** a scrim; each axis read from the widest sampled width carrying it; the scrim's alpha not confused with element opacity. Adjacent evidence is an almost exact match: `tests/bug24-scrim-alpha.test.ts` carries four `test_UAT_FC_BUG-24_*` tests — `…_hero_scrim_folds_onto_the_section_background_box` (`:82`), `…_scrim_over_image_renders_as_a_translucent_layer_above_it` (`:102`), `…_scrim_without_a_background_image_still_folds` (`:126`), `…_a_section_with_neither_image_nor_scrim_folds_no_box` (`:145`) — one per Verification clause. Traces to BUG-24, not AC-1629. | Cheapest of the seven: author `test_UAT_AC1629_band_scrim_folds_onto_the_section_background_box` consolidating the four BUG-24 shapes, and add the one clause they do not close — each axis read from the **widest sampled width that carries it** (a band painting an image at some rungs and only a scrim at others) |
| 7 | violation | coverage | AC-1631 (`acceptance_criterion-12581128`) | uat-add | No `test_UAT_AC1631_*` exists. AC-1631 owns the nowrap threshold as a **width, not a flag**, derived from the ladder's single-line **suffix** — never the first single-line width found — with an unmeasurable line count **breaking** the suffix rather than counting as one line, and no axis at all when the widest sample wrapped. Adjacent evidence: `req88-viewport-relative-and-nowrap.test.ts:188` (single-line runs fold unbreakable), `:215` (gated by that width), `:240` (`…_the_pin_starts_only_where_every_wider_sample_is_single_line` — the suffix rule), `:261` (wraps anywhere → stays breakable), `:282` (`…_an_unmeasurable_line_count_is_not_read_as_one_line`). Traces to REQ-88. Note the boundary AC-1631 draws: what the *renderer* spends the threshold on is CAP-70/STORY-83's wrapping floor (`reconciliation-nowrap-width-floor.test.ts`), so a UAT here must assert the **fold's** derivation and carrying only. | Author `test_UAT_AC1631_nowrap_threshold_is_the_ladders_single_line_suffix` covering AC-1631's Verification: single-line-everywhere → the **narrowest** rung; single-line at narrow and wide but wrapping between → the rung **above** the wrapping one; unmeasurable width breaking the suffix; wrapped-at-widest → no axis, document still valid |
| 8 | violation | consistency | AC-691 (`acceptance_criterion-304cae4c`) / `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | uat-edit | **Fifth consecutive report** (REPORT-1320 v1, REPORT-1662 v1, REPORT-1731 v1, REPORT-2090 v1); `git log -1 -- tests/reconciliation-l1-fold.test.ts` still returns `f0367940d3`, **2026-07-22 — no repair has ever been attempted**. Two distinct gaps, both in the same test at `:256-290`. **(a) The height rule, unchanged.** AC-691: "A box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height", with Verification naming both halves. The UAT asserts `at` (`:278`), x/y/width (`:283-285`) and `fontSizePx` (`:288`) and makes **no height assertion at all**. The text-leaf no-height invariant has zero executable evidence repo-wide — I re-grepped `height).toBeUndefined`, `height === undefined` and `toHaveProperty('height')` across `tests/` and the only hits remain fixture construction in `reconciliation-copy-edit-form-presentation.test.ts:140,142`. The distinction is live at `tools/generate/src/l1/fold.ts:1786` `buildGeometry(withHeight)` (guard at `:1799`), called `false` for text (`:1849`), `true` for image (`:1980`) and box (`:2023`). It is load-bearing for **AC-707**, whose robustness probe grows text runs and expects flow to absorb them (`probes.ts:305-307`) — meaningful only because text height is natural. A regression that started pinning text heights would leave all 34 UATs green. **(b) New this cycle: the fixture now exercises the wrong branch.** Today's ac-level repair rewrote AC-691's authored-axis clause to "An authored axis whose value is **identical at every sampled width** is taken from the node's widest present sample … an axis the page varies across the ladder … folds to a per-width track instead", and its Verification correspondingly asks: "For a node whose typography is **constant** across the ladder, assert its axes match the widest sampled cell **and that no responsive track was emitted for them**." The UAT's fixture deliberately **varies** `fontSizePx` (24/32/44 at 320/768/1280, `:263`) and then asserts `node.axes.fontSizePx === 44` under the comment "taken from the widest present sample" (`:287-288`). That assertion still *passes* — AC-1625 guarantees the widest keyframe equals the retained scalar, which I confirmed by running the file — but it now proves the constant-axis rule on a varying node, and the "no responsive track was emitted" half is absent entirely. | In `test_UAT_AC691`: (a) assert `kfs.every((k) => k.height === undefined)` for the `Headline` text leaf, and extend the fixture with one media element and one painted panel, asserting each keyframe carries `height` equal to the captured box height; (b) add a **second, constant-typography** run to the same fixture and move the widest-sample assertion onto it, adding `expect(constantLeaf.responsiveTracks).toBeUndefined()` (or the equivalent negative), leaving the varying run's track behaviour to AC-1625's new UAT from violation 2 |
| 9 | violation | consistency | AC-689 (`acceptance_criterion-7785b92a`) / `test_UAT_AC689_capture_emits_one_validated_l1_document` | uat-edit | **Fifth consecutive report** (REPORT-1320 v2, REPORT-1662 v2, REPORT-1731 v2, REPORT-2090 v2) — same untouched file, same 2026-07-22 commit. AC-689: the document "is emitted in the **full** L1 language, not text alone: it may carry text leaves, image leaves, box leaves and backing-surface leaves", Verification: "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind." The UAT (`:207-231`) drives the real `cmdCapturePage` with `FakeDriver`, whose `signalsFor()` (`:103-133`) carries exactly **one** text run (`:120`) and `items: []`, `fields: []` (`:122-123`), `images: []` (`:131`) — so the folded document *cannot* hold more than one leaf kind, and the clause BUNDLE-8 added is structurally unexercisable by this fixture. The five assertions present (`:220-230`) cover only the REQ-83-era criterion: artifact exists, `validateL1` ok, `widths` = ladder, root kind, empty-ladder throw. The nearest coverage in the repo is `…full-language.test.ts:330`'s kind-set check, but that is AC-731's UAT and runs `foldToL1` directly — **not** the `cmdCapturePage` bundle path AC-689 is entirely about. | Add a media element (an `images` entry / a textless `src`-bearing element) and a painted panel (`surfaceFill`) to `signalsFor()`, then assert on the `l1.json` read back from the bundle: `expect(new Set(leaves.map((n) => n.kind)).size).toBeGreaterThan(1)`. Shares its fixture work with violation 8's media/panel additions |
| 10 | violation | consistency | AC-710 (`acceptance_criterion-beb4d907`) / `test_UAT_AC710_probe_findings_are_diagnostic` | uat-edit | **New this cycle, created by today's ac-level repair.** AC-710 now explicitly owns the envelope-finding diagnostic contract for all three violation shapes — "`clip` both for a leaf crossing the viewport edge **and for a pinned box whose flow interior outgrows its keyframe height**" and a detail naming "the overlapping extent, the distance past the viewport edge, **or the measured content height against the pinned box height**" — and its Verification was rewritten to demand all three: "**Force an overlap, a viewport-edge clip and a pinned-box content overflow**, and assert each finding names its kind, a detail string carrying the offending magnitude, and the index paths of the leaves involved — two paths for the overlap, the offending node's for each clip." The UAT (`tests/reconciliation-3probe-gate.test.ts:636-671`) forces a fidelity residual (`:641-650`), an overlap (`:654-660`) and **one** clip (`:664-670`) — and that clip comes from `evaluateLayout(narrow, 500)`, which is the *viewport-edge* variety. The pinned-box overflow is not forced, and the assertion that would catch its absence is `expect(clip.detail).toMatch(/\d+px/)` (`:668`) — satisfied by either detail string, so it cannot discriminate. Distinct from violation 1: that one is the *behaviour's* missing UAT under AC-1630; this one is AC-710's own *diagnostic contract* clause going unexercised. | Extend `test_UAT_AC710` with a third forced violation: build the pinned-box overflow document, and assert its `clip` finding's `detail` matches `/content height \d+px exceeds pinned box height \d+px/` and its `paths` name the offending box — keeping AC-1630's new UAT (violation 1) as the rule-by-rule proof and AC-710's as the contract proof, exactly the AC-729 ↔ AC-1133/1134 division that already works in this capability |
| 11 | warning | consistency | AC-694 (`acceptance_criterion-c8dd43d2`) / `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` | uat-edit | **Re-raise of REPORT-1320 w3 / REPORT-1662 w3 / REPORT-1731 w3 / REPORT-2090 w4 — fifth.** AC-694's criterion enumerates six sidecar dimensions (ancestry/`parentId`, parent computed layout, authored sizing unit per axis, position mode, sibling-repetition count, ascending `@media` breakpoints). Three — `parentId`, `position`, `repeatCount` — are asserted on **neither** path: they appear in the file only at `:141`, `:144`, `:149`, inside the `CANNED_HINTS` literal, never in an `expect`. Both dimensions AC-694's *Verification* names explicitly (parent layout mode + `justify-content`) sit only inside the engine-gated branch — `if (!(await chromiumAvailable())) return` at `:363`, assertions at `:384-387`. The two always-run assertions (`:358` breakpoints ascending, `:359` some node `widthUnit === 'percent'`) are satisfied by the test's own `CANNED_HINTS` returned verbatim by `FakeDriver.query` (`:165`), so they prove the sidecar round-trips to disk, not that extraction computes anything; and `CANNED_HINTS.parentLayout` is `null` (`:146`), so an enriched canned path needs new fixture data first. **Execution note:** the file ran green this session, which confirms the gated branch is skipped here as REPORT-1731 found by direct invocation — 13 tests passed across two files with no Chromium launch. | Enrich `CANNED_HINTS` with a non-null `parentLayout` and a second child node, then move the *contract* assertions (per-node `parentId`, `position`, `repeatCount`, non-null `parentLayout`) onto the always-run canned path, leaving only extraction *accuracy* engine-gated. **Do not repair by deleting the skip** |
| 12 | warning | consistency | AC-812 (`acceptance_criterion-fd94d9ab`) / `test_UAT_AC812_backdrop_folds_behind_content_bounds_bands_and_feeds_the_page_base` | uat-edit | **Re-raise of REPORT-1662 w4 / REPORT-1731 w4 / REPORT-2090 w5 — fourth.** AC-812's layering clause has two halves: the backdrop sits "behind the text runs of the band it sits under, **and after the section-background boxes it is a peer of**". The UAT proves the first half twice (`…seams-and-refold.test.ts:144-147` leaf index before the first text leaf; `:150-152` `id=` before `Nested Hero` in the rendered HTML) and asserts **nothing** about the backdrop's position relative to the band/section-background boxes — though the same fixture already materialises them as `heroBands` (`:160-163`) and then only checks their vertical clamp (`:164-169`). The rule is live in `fold.ts` (`children: [...bandNodes, ...sectionBgNodes, ...backdropNodes, …]`) and load-bearing: absolutely-positioned siblings with no z-index paint in source order, so a backdrop emitted *before* its band would have the band's opaque fill paint over the hero photograph — the mirror image of the defect the asserted half guards. Warning not violation, because AC-812's *Verification* stops at the first half. | One assertion on node sets the fixture already builds: `expect(leaves.indexOf(backdrop)).toBeGreaterThan(Math.max(...heroBands.map((b) => leaves.indexOf(b))))` |
| 13 | warning | consistency | AC-729 (`acceptance_criterion-39597704`) / `test_UAT_AC729_media_folds_to_image_leaf_with_src_alt_and_axes` | uat-edit | **Re-raise of REPORT-2090 w3.** AC-729's claim is "how the picture is *seen*" — the **union** on one leaf of framing (fit + which part of itself its box shows), adjustment (the colour-adjustment stack) and finishing (radius, opacity, blend, border, shadow), "omitting any axis the element does not paint". The fully-painted `hero-media` fixture (`…full-language.test.ts:93-105`) paints the six finishing axes and neither `objectPosition` nor `filter`, and the closed assertion `expect(hero.axes).toEqual({ objectFit, borderRadiusPx, opacity, blendMode, border, boxShadow })` (`:154-161`) omits both; the test says so at `:84-88`, deferring to `test_UAT_AC1133_*` / `test_UAT_AC1134_*`. Still a warning rather than a violation: the Verification's clause is conditional ("where the element paints them") and the siblings do prove framing and adjustment on real image leaves — but **no fixture in the repo paints all three families on a single image element**, so the union claim itself is unproven. | Add `objectPosition: '30% 70%'` and `filter: 'saturate(0.6)'` to the `hero-media` fixture and extend the `toEqual` with `objectPosition: { xPct: 30, yPct: 70 }` and `filter: { saturate: 0.6 }` — one fixture edit, no new test, keeping AC-1133/AC-1134 as the rule-by-rule proofs |
| 14 | warning | exclusivity | AC-729 + AC-733 (`acceptance_criterion-39597704`, `acceptance_criterion-0d993a36`) | uat-edit | **New this cycle, created by today's AC-729 rewrite.** AC-729's body now explicitly cedes the negative case: "The opposite outcome — a media element with no resolvable source … which emits no leaf and takes the residual channel instead — **is owned and verified by AC-733**." But `test_UAT_AC729`'s tail (`…full-language.test.ts:188-207`) still folds a `src: null` media element and asserts the residual's `kind`, `reason` matching `/src/i` and `widths` — the same scenario, in the same shape (`foldToL1` + residual collector), that `test_UAT_AC733` proves at `:515` via `byKind('image', /src/i)`. Two tests now verify one behaviour the matrix assigns to one AC. Low-harm duplication, so a warning: the cost is that a change to the residual contract fails two tests and reads as two defects, and AC-729's UAT grows past the boundary its own body draws. | Delete `…full-language.test.ts:188-207` from `test_UAT_AC729`, leaving the src-less residual to `test_UAT_AC733`. Pairs naturally with finding 13, which edits the same test's fixture |
| 15 | info | — | all 34 AC-traced UATs | — | **Executed this run, all green** — `npm test --` over the seven files: `reconciliation-l1-fold.test.ts` + `…-full-language.test.ts` (13 tests) and `…-framing-and-adjustment.test.ts` + `…-seams-and-refold.test.ts` + `reconciliation-3probe-gate.test.ts` + `…-gate-evaluator.test.ts` + `…-cross-gate-reconciliation.test.ts` (21 tests). No finding above is a failing test; every one is an unclosed criterion clause or a missing test. Symbol map re-verified: exactly one `test_UAT_AC<n>_*` per active AC, no orphans, no duplicate AC numbers (`test_UAT_AC1133_`/`AC1134_` appear in `…full-language.test.ts:86` only inside a comment). | none |
| 16 | info | — | AC-691, AC-731, AC-736 | — | Three items REPORT-2090 filed as `info` because their resolution was `ac-edit` are **closed** by today's ac-level repair, and I verified each against the live AC body: AC-691's widest-sample sentence is now scoped to constant axes (info 7 closes — though it opens violation 8b); AC-731's body now states the shipped BUG-14 band+card model its UAT already asserted (info 5 closes, no uat work follows); AC-736's body now reads "positioned behind the content it backs", matching the code's rule that its UAT already asserted (info 10 closes, no uat work follows). REPORT-2090's info 9 is the only one still open, and it is now violation 1. | none |
| 17 | info | consistency | AC-706 + AC-707 (`acceptance_criterion-83e8a724`, `acceptance_criterion-415d7f85`) | — | Both criteria were widened today to name the third envelope violation — AC-706: "no pinned box's flow interior outgrows its keyframe height (AC-1630, which owns that third violation)"; AC-707: the same, adding "for which this probe's perturbation is the usual trigger". Neither Verification section was extended, both explicitly delegating the proof to AC-1630, so **their UATs remain aligned to their own working reference** and I file no uat work against them. Recorded because the delegation only pays off once violation 1 lands: until AC-1630 has a UAT, the clause is unexercised under all three ACs at once. Once it does land, AC-1630's UAT should assert the violation surfaces **through both probes** (its own Verification asks for this), which closes AC-706's and AC-707's delegated halves in the same stroke. | none |
| 18 | info | exclusivity | AC-1625 ↔ AC-691; AC-1631 ↔ CAP-70/STORY-83; AC-1630 ↔ AC-710 | — | The three new adjacencies were checked and none is a duplicate, but each has a boundary a UAT author can cross by accident. **AC-1625 vs AC-691**: AC-691 owns geometry keyframes and the constant-axis scalar; AC-1625 owns the varying-axis track — violation 8's repair must put the track assertions in AC-1625's test, not AC-691's. **AC-1631 vs CAP-70**: AC-1631 owns the fold's *derivation and carrying* of the nowrap width; what the renderer spends it on is STORY-83/AC-1010's wrapping floor, already tested in `reconciliation-nowrap-width-floor.test.ts` — a UAT here must not re-prove the floor. **AC-1630 vs AC-710**: rule-by-rule proof vs diagnostic-contract proof, the same split that already keeps AC-729 and AC-1133/AC-1134 disjoint. Across all 41 ACs, no genuine duplicate. | none |

## Notes for the Editor

**There are two independent workstreams here; they do not block each other.**

*Workstream A — the seven missing UATs (violations 1-7).* Six are consolidation
jobs, not authorship jobs: the behaviour is already tested under a
`test_UAT_FC_*` name traced to its intent, and the repair is to write an
AC-traced UAT that covers the AC's Verification, lifting assertion shapes from
the free-coded file named in each finding. **AC-1629 is the cheapest** (four
BUG-24 tests map one-to-one onto four Verification clauses); AC-1625, AC-1626,
AC-1627, AC-1628 and AC-1631 are each a consolidation plus one or two clauses the
FC tests do not close, named individually in the findings. **AC-1630 is the
exception and the priority**: it is the only criterion in this capability with no
executable evidence of any kind, and `probes.ts:410`'s branch could be deleted
today without reddening a single test in the repository.

*Workstream B — the untouched file (violations 8 and 9).* Both live in
`tests/reconciliation-l1-fold.test.ts`, both are **fifth** offences, and
`git log -1` on that file still returns `f0367940d3`, 2026-07-22. They share their
fixture work — AC-689 needs a media element and a painted panel added to
`signalsFor()`, AC-691 needs the same two element kinds in its own fixture — so
one sitting closes both. Neither blocks anything or is blocked by anything. **If
this cycle repairs only one thing, repair this file**; it has now been named in
five consecutive reports with no attempt recorded against it.

**Violation 10 is the cheapest violation on the board** and is a direct
consequence of work that landed today: AC-710's Verification grew a third forced
violation this morning and its UAT did not follow. It shares its fixture with
violation 1 — build the pinned-box overflow document once, assert the rules under
AC-1630 and the diagnostic contract under AC-710.

**Do not repair violation 8 by pointing at AC-1625.** The two halves are
deliberately split (info 18): AC-691 keeps the geometry keyframes and the
constant-axis scalar; the per-width track belongs in AC-1625's new UAT. Repairing
8(b) by asserting the track inside `test_UAT_AC691` would create exactly the
duplicate this level is meant to prevent.

**The standard to copy is unchanged.** `test_UAT_AC1133_*` and `test_UAT_AC1134_*`
in `tests/reconciliation-l1-fold-framing-and-adjustment.test.ts` remain the
strongest tests in this capability: every Criterion rule gets a fixture, and each
closes by pinning the **negative space** in the rendered output (the exact
`object-position` set at `:157`; `filter` count exactly 6 at `:261`). That move is
what turns "the axis folded" into "and nothing else defaulted one in" — and it is
precisely the shape violations 1, 8 and 9 are missing. AC-1630's UAT in
particular should close on `toHaveLength(1)` rather than `.some(…)`, or it will
not discriminate the third violation from the viewport clip that already fires in
the same documents.

**Method boundary.** Verified this session in this worktree
(`regression-800a17f7`, HEAD `a132f52c89`): the live bodies of all seven pending
ACs and of AC-689, AC-691, AC-706, AC-707, AC-710, AC-729, AC-731, AC-736, AC-812
from the ticket store; the AC status/`story_uid` map for all 41 via
`xgd ticket list --json`; the full `test_UAT_AC*` symbol set across `tests/`; the
sources of the four regions named in violations 8-10 and warnings 11-14; the
`clip`-raising surface of `probes.ts:395-420` and every `kind === 'clip'`
assertion in `tests/`; repo-wide greps for each pending AC's behaviour and for
every no-height assertion form; `git log` on all seven AC-traced test files; and
**an actual execution of all seven files (34 tests, all passing)**. Not performed:
the free-coded suites named as adjacent evidence were read, not run.
