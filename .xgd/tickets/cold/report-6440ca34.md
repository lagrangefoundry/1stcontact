---
uid: report-6440ca34
id: REPORT-1320
type: report
title: 'Capability-Intent Alignment: l1_reproduction_pipeline (level=uat)'
created_by: xgd
created_at: '2026-08-05T22:16:31.395783+00:00'
updated_at: '2026-08-05T22:16:31.395783+00:00'
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

# Capability-Intent Alignment: l1_reproduction_pipeline
# Level: uat

**Result**: FAIL
**Violations**: 2
**Warnings**: 2
**Needs review**: 0

Capability CAP-71 (`capability-2049c9ec`), stories STORY-84 (`story-8acc338d`,
fold — 13 ACs) and STORY-86 (`story-24098299`, 3-probe gate — 11 ACs). All 24
ACs are `status: active`, `kind: behavior`; AC-696 is `regression_only: true`.

**Level-cascade note.** The story-level (REPORT-1318, `report-0cb0a92d`) and
ac-level (REPORT-1319, `report-4c0d7532`) cycles both ran earlier today and both
FAILED. Per the cascade rule this check takes the **AC bodies** as its working
reference and does not re-derive their open findings as UAT findings; those are
carried below as info 1 and info 2. Both violations here are confined to the
UAT layer and are repairable on this branch independently of that cascade.

**Evidence executed.** All 24 matrix UATs were run this session:
`npx vitest run tests/reconciliation-l1-fold.test.ts
tests/reconciliation-l1-fold-full-language.test.ts
tests/reconciliation-3probe-gate.test.ts
tests/reconciliation-3probe-gate-evaluator.test.ts`
→ **4 files passed, 24 tests passed, 1.58s.** No test is skipped at the `it()`
level; one in-test branch skips (warning 1).

## Cumulative Intent Considered

Both stories carry `intent_uid: bundle-31e474b9` (BUNDLE-7) and
`updated_by: bundle-cceaba25` (BUNDLE-8); both verified `free_and_reconciled`
this session (BUNDLE-7 merged at `edeb1c2c`, BUNDLE-8 at `b1bd5b6b`). The
per-intent decomposition below is carried forward from REPORT-1319, which derived
it from the bundle contents and the per-AC creation dates; it is restated only
as far as the UAT layer needs it.

| Intent ID | Status | When | Asked / changed | Counts? | UAT cohort |
|---|---|---|---|---|---|
| REQ-79 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | Absolute-base D1 reproduction model | YES | AC689/691 UATs |
| REQ-83 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | capture→L1 fold + retained oracle + hint sidecar | YES | AC689–696 UATs |
| REQ-86 (BUNDLE-7) | free_and_reconciled | 2026-07-20 | End-to-end 3-probe gate | YES | AC705–710 UATs |
| BUG-5 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Occurrence-identity pairing + idempotence identity | YES | AC724 UAT, AC705 UAT (b)(c)(d)(e) |
| BUG-6 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Typed residual instead of silent drop | YES | AC733 UAT |
| BUG-7 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Evaluator row-tiling vs stack flow | YES | AC734 UAT |
| BUG-8 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Half-open breakpoint intervals | YES | AC735 UAT |
| BUG-9 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Region-aware recursive promotion | YES | AC709 UAT, AC706/707 UAT multi-region spans |
| BUG-11 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Fold recovers composited surface fill/gradient | YES | AC731/736 UATs |
| REQ-90 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Font table populated from painted families | YES | AC732 UAT |
| REQ-92 (BUNDLE-8) | free_and_reconciled | 2026-07-23 | Rebuild `foldToL1` to the full L1 language + residuals | YES | AC729–733/737 UATs; **AC689's full-language clause unexercised (violation 2)** |
| REQ-88 (BUNDLE-10) | free_and_reconciled | 2026-07-21 | `1c repro` / `1c l1-gate` surface | YES | no story/AC of its own; incidentally driven by the AC737 UAT (info 2) |
| BUG-13/14/17/18/19/20/23 (BUNDLE-10) | free_and_reconciled | 2026-07-23/24 | Band→card→text hierarchy, padding, responsive flat axes | YES | code absent from this branch (info 2) |
| REQ-94 (BUNDLE-11) | bundled | 2026-07-25 | Cross-gate calibration | imminent | none yet — correct today |

## Alignment Ledger

Every active AC has at least one substantive UAT named by the
`test_UAT_AC<number>_*` convention, driving real entry points (`cmdCapturePage`,
`foldToL1`, `renderL1Document`, `validateL1`, `evaluateLayout`, the three probes,
`promoteToFlow`, `threeProbeGate`, `cmdL1Gate`, `run(argv)`). No AST-only or
structural-only test stands in for behaviour. Coverage is therefore complete at
the "has a UAT" level; the two violations are **consistency** failures — a UAT
that does not exercise a named clause of its own AC.

### STORY-84 (fold) — 13 ACs

| AC | UAT | Intents | Outcome |
|---|---|---|---|
| AC-689 | `reconciliation-l1-fold.test.ts:207` | REQ-83, REQ-92 | **drift** — validated doc / ladder widths / root / explicit empty-ladder error all proven, but the capture is text-only so the full-language clause is unexercised (violation 2); root-kind wording mismatch (warning 2) |
| AC-690 | `reconciliation-l1-fold.test.ts:233` | REQ-83 | aligned — oracle artifact present, widths equal the folded document's |
| AC-691 | `reconciliation-l1-fold.test.ts:256` | REQ-79, REQ-92 | **drift** — keyframe widths / x / y / width / widest-sample typography proven; both height clauses unasserted (violation 1) |
| AC-692 | `reconciliation-l1-fold.test.ts:292` | REQ-83 | aligned — fluid → `interpolate`, reflow → `snap` |
| AC-693 | `reconciliation-l1-fold.test.ts:319` | REQ-83 | aligned — bounded `fromPx` on the subrange node, `undefined` on the always-present node |
| AC-694 | `reconciliation-l1-fold.test.ts:345` | REQ-83 | **weak** — substantive dimensions gated behind a browser branch that skips here (warning 1) |
| AC-695 | `reconciliation-l1-fold.test.ts:392` | REQ-83 | aligned — renders from the folded doc alone, no sidecar in scope |
| AC-696 | `reconciliation-l1-fold.test.ts:413` | REQ-83 | aligned — unknown-command + exit 1 + no surviving symbol + `adopt-gaps` carve-out |
| AC-729 | `reconciliation-l1-fold-full-language.test.ts:82` | REQ-92 | aligned — src/alt/fallback, omitted-axis discipline, four-side pinning, visibility, render, src-less → residual |
| AC-730 | `…full-language.test.ts:208` | REQ-92 | aligned — full surface axes, single-axis divider proves omission, height-bearing track, CSS paints |
| AC-731 | `…full-language.test.ts:294` | BUG-11 | aligned — dominant fill → band, differing + gradient runs each back one box, ordering ahead of content, render |
| AC-732 | `…full-language.test.ts:363` | REQ-90, REQ-92 | aligned — five treatments fold + render, transform/mask deliberately absent, re-fold identity, painted-only font table |
| AC-733 | `…full-language.test.ts:481` | BUG-6, REQ-92 | aligned — five typed residuals with kind/reason/axes/widths, control never a leaf, clean capture empty, opt-in channel identity |

### STORY-86 (3-probe gate) — 11 ACs

| AC | UAT | Intents | Outcome |
|---|---|---|---|
| AC-705 | `reconciliation-3probe-gate.test.ts:299` | REQ-86, BUG-5 | aligned — clean base, residual with dx/dy/dw at the last width, unmatched, repeated-text occurrence pairing (a–c), kind-keyed non-text pairing and measured-scope exclusion (d–e) |
| AC-706 | `…3probe-gate.test.ts:446` | REQ-86, BUG-9 | aligned — pass at 500/900, `narrowOracle` degradation at 500 only, multi-region overlay holds |
| AC-707 | `…3probe-gate.test.ts:479` | REQ-86, BUG-9 | aligned — pinned base fails, flowed passes, multi-region collisions span >2 children then clear |
| AC-708 | `…3probe-gate.test.ts:522` | REQ-86 | aligned — both non-vacuity arms, fidelity on base, sub-reports carried |
| AC-709 | `…3probe-gate.test.ts:549` | BUG-9 | aligned — own-path single region, three nested paths, per-region gaps `[60,90,60]`, zero pinned descendants, validity, byte-identical base fidelity, roomy page unpromoted |
| AC-710 | `…3probe-gate.test.ts:634` | REQ-86 | aligned to its (text-only) AC body — residual names run/width/deltas, overlap and clip findings name kind/detail/paths (see info 5) |
| AC-724 | `…3probe-gate.test.ts:671` | BUG-5 | aligned — double evaluation identity at every ladder width, 3 uncollapsed runs, per-occurrence y/x within 2px |
| AC-734 | `…gate-evaluator.test.ts:114` | BUG-7 | aligned — 280px tiling at ascending x, row height = tallest child via the marker's y, fixed-width mix, genuine clip, stack and grid |
| AC-735 | `…gate-evaluator.test.ts:303` | BUG-8 | aligned — keyframe at the breakpoint, `snap` precondition, post-reflow boxes at exactly 768, closed-bound counterfactual, clean fidelity, ladder ends |
| AC-736 | `…gate-evaluator.test.ts:382` | BUG-11 | aligned — intersection proven non-vacuous, finding-signature equality with the surface-free fold across 8 widths × 2 scales, `sawGenuineOverlap` guard, surface clip, slot exclusion, fidelity unchanged |
| AC-737 | `…gate-evaluator.test.ts:590` | REQ-92, REQ-86 | aligned — three channels distinct, per-residual kind/reason/axes/widths, human-readable line, itemisation, JSON form, passing gate still reports residuals |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-691 (`acceptance_criterion-304cae4c`) / `test_UAT_AC691_each_node_carries_keyframe_per_width_matching_box` | uat-edit | AC-691's criterion turns on a **height** distinction — "A box, image or backing-surface leaf additionally pins its height at every keyframe … a text leaf's keyframes carry no height, leaving its height natural from flow" — and its Verification names both halves ("and no keyframe carries a height"; "For a folded image leaf and a folded box leaf, assert every keyframe carries a height"). The UAT (`tests/reconciliation-l1-fold.test.ts:256-290`) asserts keyframe widths, x/y/width and widest-sample typography, and makes **no height assertion at all**. A grep of the whole `tests/` tree finds keyframe-height assertions only at `reconciliation-l1-fold-full-language.test.ts:162,272,342` — all on image/box leaves under AC-729/730/731 — so the text-leaf "no height" invariant has **zero executable evidence anywhere in the repo**, including the free-coded sibling `req83-capture-to-l1-fold.test.ts:214`. The distinction is live in code (`tools/generate/src/l1/fold.ts:543-551`, `buildGeometry(withHeight)`) and is load-bearing downstream: AC-707's content-robustness probe grows text runs, which is only meaningful because text height is natural rather than pinned | In `test_UAT_AC691`, assert `kfs.every((k) => k.height === undefined)` for the `Headline` text leaf, and extend the same UAT's capture with one media element and one painted panel, asserting each of their keyframes carries `height` equal to the captured box height |
| 2 | violation | consistency | AC-689 (`acceptance_criterion-7785b92a`) / `test_UAT_AC689_capture_emits_one_validated_l1_document` | uat-edit | AC-689 states the document "is emitted in the **full** L1 language, not text alone: it may carry text leaves, image leaves, box leaves and backing-surface leaves", and its Verification asks to "Fold a capture containing runs, media and painted panels and assert the document contains leaves of more than one kind". The UAT (`tests/reconciliation-l1-fold.test.ts:207-231`) drives `cmdCapturePage` with `FakeDriver`, whose signals (`:103-133`) carry exactly one text run and `images: []` — so the folded document has exactly one leaf kind and the full-language clause (the clause REQ-92/BUNDLE-8 added to this AC) is never exercised. The four assertions present cover only the REQ-83-era criterion (artifact exists, validates, `widths` = ladder, root kind, explicit empty-ladder throw). Nearest coverage is `…full-language.test.ts:326` (`new Set(kinds).size > 1`) but that is AC-731's UAT and runs on `foldToL1` directly, not the capture path AC-689 governs | Add a media element and a painted panel to `signalsFor()`/`FakeDriver`, then assert the `l1.json` read back from the bundle carries leaves of more than one kind (e.g. `new Set(children.map(n => n.kind)).size > 1`) |
| 3 | warning | consistency | AC-694 (`acceptance_criterion-c8dd43d2`) / `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` | uat-edit | AC-694 enumerates six sidecar dimensions (ancestry, parent computed layout, authored sizing unit, position mode, sibling-repetition count, ascending `@media` breakpoints). The UAT's substantive assertions — parent layout mode, `justify-content`, real percent unit, real breakpoint 600 — sit behind `if (!(await chromiumAvailable())) return` (`tests/reconciliation-l1-fold.test.ts:364`). **Verified skipped on this runner**: playwright resolves chromium build 1228 while the cache holds 1234 (`browserType.launch: Executable doesn't exist …/chromium_headless_shell-1228/…`), and the UAT completed in 23ms. On the always-run path the two remaining assertions (`:358` breakpoints ascending, `:359` some node `widthUnit === 'percent'`) are satisfied by the test's own `CANNED_HINTS` (`:135-153`), so they prove the sidecar round-trips to disk, not that extraction computes those values. Ancestry (`parentId`), position mode and `repeatCount` are asserted on **neither** path, and `CANNED_HINTS.parentLayout` is `null`. The pre-existing free-coded sibling `req83-capture-to-l1-fold.test.ts:257-286` skips wholesale, so it adds no fallback evidence | Assert the always-run path's per-node `parentId`, `position` and `repeatCount` (and a non-null `parentLayout`, which requires enriching `CANNED_HINTS`), keeping the browser branch for extraction fidelity — so the sidecar contract has unconditional evidence and only extraction accuracy is engine-gated |
| 4 | warning | consistency | AC-689 (`acceptance_criterion-7785b92a`) | ac-edit | AC-689 says the emitted document's "root is a **container** node", but `container` is a distinct L1 kind in this schema (used at `tests/reconciliation-3probe-gate-evaluator.test.ts:121`), and both the fold and its UAT use a `box` root (`tests/reconciliation-l1-fold.test.ts:226`, `expect(l1!.root.kind).toBe('box')`; `leavesOf()` at `…full-language.test.ts:76` reads `doc.root.kind === 'box'`). The UAT is correct against the code; the AC's wording is the loose term | Reword AC-689 to "whose root is a node that carries children (the fold emits a `box` root)", so the AC and its UAT name the same kind |
| 5 | info | coverage | pinned-box content overflow | — | REPORT-1319 finding 1 (ac-level, open) records that no AC covers the third envelope violation the evaluator raises (`tools/generate/src/l1/probes.ts:296-307`). With no AC to hang it on, no UAT can exist for it either; `test_UAT_AC710` exercises only the viewport-edge clip (`…3probe-gate.test.ts:662-668`). The repair is `ac-add` at ac level, not `uat-add` here — a UAT authored now would have no matrix element to trace to | none at this level; a `uat-add` follows once the AC lands |
| 6 | info | coverage | REQ-88 surface / BUNDLE-10 | — | REPORT-1318 finding 1 records that REQ-88's `cmdRepro` / `cmdL1Gate` operator surface has no story. It is nonetheless exercised at the UAT layer: `test_UAT_AC737` drives `cmdL1Gate` directly (`…gate-evaluator.test.ts:592`) and the `1c l1-gate` CLI in both human and `--json` forms (`:633`, `:653`). BUNDLE-10's fold rework is absent from this branch, so no UAT should be authored against it here | none at this level; cascades from REPORT-1318 |
| 7 | info | exclusivity | matrix UATs vs `test_UAT_FC_*` siblings | — | The free-coded intent UATs (`req83-capture-to-l1-fold`, `bug6-signal-not-drop`, `bug7-row-layout`, `bug8-reflow-breakpoint`, `bug9-region-aware-promote`, `bug11-fold-surface-fill`) cover much of the same ground; `req83-capture-to-l1-fold.test.ts` is a near-copy of `reconciliation-l1-fold.test.ts` (same `CANNED_HINTS`, same browser fixture, same `adopt-values` strip check). They occupy the intent-evidence namespace, not the matrix (`test_UAT_AC*`), so this is not a matrix exclusivity violation — but note that repairing findings 1–3 in the reconciliation files leaves the req83 copy behind | none |
| 8 | info | exclusivity | AC-705 + AC-724; AC-707 + AC-709 | — | Re-checked at uat level. AC-705's and AC-724's UATs share the `repeatedTextOracle` fixture but assert orthogonal things (probe pairing + report shape vs value-render determinism and per-occurrence faithfulness). AC-707's and AC-709's UATs share `multiRegionOracle(GRID_AND_FOOTER)` but assert the probe verdict vs the recovery's promoted paths / gaps / pinned-descendant emptiness. Neither pair is a duplicate | none |
| 9 | info | consistency | AC-710 (`acceptance_criterion-beb4d907`) | — | `test_UAT_AC710` asserts only text-run fidelity residuals, which is exactly what AC-710's (text-only) body specifies — the test is consistent with its AC. The staleness is at the AC layer, already recorded as REPORT-1319 findings 2 and 3; when AC-710 is narrowed/reworded, this UAT will need a matching edit | none at this level |

## Notes for the Editor

**Both violations are the same shape and both are cheap.** Each is a UAT that
proves its AC's REQ-83-era clauses but not the clause a later BUNDLE-8 intent
added — AC-691's height split (REQ-92's box/image pinning vs text natural flow)
and AC-689's full-language emission (REQ-92). Neither needs new fixtures beyond a
few lines: AC-691 needs one `toBeUndefined`-style assertion plus a media/panel
fold in the same test; AC-689 needs `FakeDriver`'s signals to carry a media
element and a painted panel. Both live in `tests/reconciliation-l1-fold.test.ts`
and can land in one edit.

**Finding 1 is the more important of the two.** The image/box half of AC-691's
height rule is at least proven elsewhere in the suite (AC-729/730/731 UATs); the
text-leaf half is proven nowhere. That invariant is what makes the
content-robustness probe (AC-707) meaningful — if a regression started pinning
text heights, every UAT in this capability would still pass.

**Do not repair finding 3 by deleting the skip.** Chromium genuinely cannot
launch on this runner (build mismatch, not a missing install), so a hard failure
would break the suite. The fix is to move the *contract* assertions
(ancestry / position / repeatCount / non-null parentLayout) onto the canned-driver
path so they always run, leaving only extraction *accuracy* engine-gated.

**Do not author UATs for findings 5 and 6.** Both cascade from open story- and
ac-level violations whose repairs must land first; a UAT written now would trace
to no matrix element (finding 5) or to behaviour absent from this branch
(finding 6).
