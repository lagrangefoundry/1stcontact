---
uid: report-2606a5ba
id: REPORT-2454
type: report
title: 'UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate'
created_by: xgd
created_at: '2026-08-20T14:41:23.358694+00:00'
updated_at: '2026-08-20T14:41:23.358694+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 2
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Result**: FAIL
**AC verdicts**: 40 pass, 2 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 0 pass, 2 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

CAP-71 (`capability-2049c9ec`) holds two `upgrade` stories: STORY-84
(`story-8acc338d`, the fold) with **26** ACs and STORY-86 (`story-24098299`, the
3-probe gate + cross-gate reconciliation) with **16** — **42** in total, all
`status: active`, `kind: behavior`. No intent in the ledger retires any of them,
so there are no `deprecated` verdicts and no `needs_review`. This is attempt **9**.

## Method — executed, not inferred

Unlike attempt 7 (REPORT-2091), **command execution was available this session**.
Every verdict below rests on three readings taken here:

1. **The suite was run.** All nine AC-named test files, together:

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-l1-seam-config-and-repro.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
→ Test Files 9 passed (9) · Tests 42 passed (42) · Duration 1.40s (tests 670ms)
```

2. **The AC↔UAT index was rebuilt from source.** `.xgd/uat_index.json` in this
   worktree is **empty** (`{"acs": {}}`, 67 bytes) — the prompt's `uat_index.json`
   lookup returns nothing for every AC and must not be trusted here. The mapping
   was instead rebuilt by walking `tests/` for every `test_UAT_AC(\d+)_` symbol and
   joining it to the 42 AC numbers read from the ticket store. All 42 resolve, each
   to exactly one dedicated test.

3. **Each test body was read against its AC's Criterion and Verification**, and each
   uncovered clause was checked against production code and against the whole of
   `tests/` (including the free-coded `test_UAT_FC_*` suites) before being called a
   gap.

## Cumulative Intent Considered

Statuses were re-read from the live store this session.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) — REQ-63/79/82/83/84 +2 | `free_and_reconciled` | 2026-07-22, main @ `edeb1c2c` | Originating intent for both stories: capture → fold → render → gate; oracle retention; hint sidecar; dissolves `adopt-values` | YES |
| BUNDLE-11 (`bundle-ee56a66e`) — BUG-27/REQ-94/96/97/98 +10 | `free_and_reconciled` | 2026-08-05 | Widened STORY-86: cross-gate verdict, perceptual floor, reference coverage, named causes; `control` composition | YES |
| REQ-136 (`request-8a132869`) | `free_and_reconciled` | 2026-08-12 | Widened STORY-84: non-destructive framing + colour adjustment as typed L1 axes (AC-1133 / AC-1134) | YES |
| REQ-88 (free-coded, reconciled) | reconciled | — | nowrap threshold, viewport-height probe, content column + per-axis anchors, padding tracks, surface attribution, form labelling | YES |
| REQ-92 / REQ-96 (free-coded, reconciled) | reconciled | — | full L1 language; a captured control binds to its module seam instead of taking the residual channel | YES |
| BUG-6/7/8/9 (free-coded, reconciled) | reconciled | — | typed residuals; row tiling; half-open intervals; recursive region-aware promotion | YES |
| BUG-13/14/17/18/19/20/21/23/24 (free-coded, reconciled) | reconciled | — | section background; band→card hierarchy; fold padding; responsive text axes; full-bleed bar; pill + padded-control self-painting run; repro local assets; scrim alpha | YES |

**No intent retires any AC or clause of this capability.** Attempt 7's two
`ac-edit` warnings (BUG-18 retiring AC-691's widest-sample clause, BUG-14 retiring
AC-731's per-run model) have both been applied — AC-691 now scopes the
widest-sample rule to the *base* value with the varying axis earning a track, and
AC-731 now states the band→card model. Neither is stale any more.

## What changed since attempt 7 (REPORT-2091, 8 violations)

| Attempt-7 finding | State now |
|---|---|
| 1 — AC-689's full-language clause had no evidence on the `cmdCapturePage` path | **Closed.** `test_UAT_AC689_*` (`tests/reconciliation-l1-fold.test.ts:267-296`) now folds a capture carrying a run, a media element and a painted panel and asserts `new Set(leafKinds(...)).size > 1` plus `text` and `image` membership |
| 2 — AC-691 made no height assertion at all | **Closed as a violation, downgraded to a warning.** The text half (`kf.height` undefined, `:364`) and the varying/uniform track pair (`:371-384`) are now asserted; the image/box positive half is asserted with bite by AC-729 (`:166-172`) and AC-730 (`:276-280`) — see warning 1 |
| 3 — AC-694 near-vacuous offline, silently skipped online | **Still open** — violation 1 below |
| 4 — pinned-box content overflow: live branch, zero evidence, four cycles | **Closed.** AC-706, AC-707 and AC-710 were each widened to state it, and all three UATs now assert it: off-sample at an unsampled width only (`3probe-gate.test.ts:538-551`), grown-vs-unpinned with both magnitudes (`:589-624`), and the diagnostic detail naming the container's own path (`:803-826`) |
| 5 — padding fold carried by no AC | **Closed.** AC-1346 added; `measured-axes.test.ts:249-360` asserts the four sides, the all-zero omission, the varying-side track and the unvarying-side scalar |
| 6 — responsive text tracks carried by no AC | **Closed.** Folded into AC-691's body and asserted at `reconciliation-l1-fold.test.ts:371-384` |
| 7 — viewport-height response carried by no AC | **Closed.** AC-1352 added; `measured-axes.test.ts:504-622` asserts ladder-skips-probe, both attribution rules, band disagreement, inert response, eighth-snapping and both missing-pair cases |
| 8 — self-painting run carried by no AC | **Closed.** Folded into AC-731's body; proven by `bug20-chip-self-surface.test.ts` (12 tests) and `bug21-control-surface-outset.test.ts` (8) — see warning 2 |

Six of the eight are genuinely repaired. Finding 3 survives, and one clause that
previous cycles carried forward without re-deriving turns out to be uncovered
(violation 2).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-84 (fold) | BUNDLE-7, REQ-88, REQ-92, REQ-96, REQ-136, BUG-6, BUG-13, BUG-14, BUG-17…BUG-21, BUG-23, BUG-24 | **fail** (aligned body, one coverage gap) | Body is faithful — attempt 7's four unstated behaviours (padding, responsive text track, viewport-height response, self-painting run) are all now described and all now carried by an AC. The single gap is AC-694's evidence |
| STORY-86 (gate + cross-gate) | BUNDLE-7, BUNDLE-11 (REQ-94), REQ-88, REQ-96, BUG-5, BUG-7, BUG-8, BUG-9 | **fail** (aligned body, one coverage gap) | Body is faithful and the third envelope violation it names is now both stated by ACs and asserted. The gap is the body's own **third fidelity channel** — `mounted` — which no test in the repository reaches |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-694 | uat-edit | `test_UAT_AC694_*` (`tests/reconciliation-l1-fold.test.ts:440-485`) does not substantively cover its Criterion **on either path**. *Offline* (`:450-454`) it asserts only that `hints.mediaBreakpoints` is sorted and that some node has `widthUnit === 'percent'` — both read straight back out of `CANNED_HINTS` (`:135-153`), a constant the test itself hands `FakeDriver.query`, so it proves the fixture, not the extractor. *Online* (`:459-484`) it asserts three things — breakpoint 600, `parentLayout.justifyContent`, a percent child — behind a silent `if (!(await chromiumAvailable())) return`. Chromium is **not** available here: the file's 8 tests execute in 198ms (two of them writing whole capture bundles), which no Playwright launch fits inside, and the independent alignment cycle (report-2eb82c27) measured `chromiumAvailable() === false` in this same worktree. Crucially, **five of the Criterion's dimensions are asserted on neither path even with a browser**: ancestry (`parentId`), position mode, sibling-repetition count, the parent's `gap`, `flex-direction` and grid template columns. The only other consumer, `tests/req83-capture-to-l1-fold.test.ts:257-286`, is the same shape with the same silent skip. This has now survived four cycles | Assert the remaining Criterion dimensions on the real-engine path (`parentId` chains to the section, `position`, `repeatCount ≥ 2` for the two `.col` siblings, `parentLayout.gap` / `flexDirection` / `gridTemplateColumns`), and replace the early `return` with `it.skipIf(!browserOk)` — the idiom already used in `tests/capture.test.ts`, `bug25-*` and `bug27-*` — so a browserless run reports the gap instead of reading green |
| 2 | violation | ac | AC-705 | uat-edit | AC-705 spends its "**three** channels, not two" paragraph and a whole Verification paragraph on the **mounted** channel: oracle text whose box *centre* falls inside a behaviour slot's rect is diverted out of `unmatched` into `mounted`, counted and surfaced but never graded. The behaviour is live — `tools/generate/src/l1/probes.ts:584` (the field), `:621`, `:629` (`insideSlot`), `:656` (the diversion), `:710` (the return) — and the CLI prints it at `tools/generate/src/cli/index.ts:639-640`. **No test in the repository touches it.** `grep -rn "mounted" tests/reconciliation-3probe-gate*.test.ts` returns nothing, and `grep -rn "\.mounted" tests/` returns nothing across all 90+ suites. A regression that deleted the diversion — sending every mounted submit-button word to `unmatched` and failing a correct reproduction — would leave all 42 UATs green. (The other two clauses attempt 7 left unexamined here *are* covered: the width-ladder-only oracle by `tests/req88-viewport-relative-and-nowrap.test.ts:609-619`, and the synthesized-surface exclusion by `tests/reconciliation-3probe-gate-evaluator.test.ts:562-567` and `tests/bug13-fold-section-background.test.ts:231-232`) | Extend `test_UAT_AC705_*` with the Verification's own fixture: fold a capture whose form seam contains a submit button whose words the oracle also carries as a text sample; assert that text appears exactly once in `report.mounted` with its width, never in `residuals` or `unmatched`, and `pass === true`. Then move the same oracle text outside every slot rect and assert it moves to `unmatched` with `pass === false` — the pair is what proves the diversion is keyed on the slot rect rather than on the text |
| 3 | warning | ac | AC-691 | uat-edit | AC-691's Verification names "For a folded image leaf and a folded box leaf, assert every keyframe carries a height equal to the captured box height", but its own UAT's fixture is text-only, so it asserts only the negative half (`kf.height` undefined, `tests/reconciliation-l1-fold.test.ts:364`). The positive half is asserted with bite by neighbouring UATs of the same capability — AC-729 pins `kf.height === 300` at every ladder width (`…full-language.test.ts:166-172`), AC-730 pins `kf.height === 120` (`:276-280`). Graded `pass`: the behaviour is protected and a regression goes red; only the attribution is off | Add one image or box leaf to AC-691's fixture and assert `kf.height` equals the captured height — or, if the split is deliberate, trim AC-691's Verification to the text-leaf clause and let AC-729/AC-730 own the height-pinning half |
| 4 | warning | ac | AC-731 | uat-edit | The `ac` cycle widened AC-731 with two clauses its own UAT does not reach: the **full-bleed bar** as a second band-seeding path, and the **self-painting run** in all four directions the Verification enumerates (pill, padded control, contributes-no-evidence, not-over-applied). `test_UAT_AC731_*` (`…full-language.test.ts:303-563`) covers band/card reconstruction, the adopted rect, the band guard, the accent-bearer fallback and grouping identity — but not those two. Both are proven, with bite, by the free-coded suites the clauses came from: `bug19-fold-bar-band-fill.test.ts` (4 tests, incl. `_evenly_tiled_card_grid_stays_cards_not_a_band` as the discriminator), `bug20-chip-self-surface.test.ts` (12) and `bug21-control-surface-outset.test.ts` (8, incl. `_a_padded_run_carrying_an_ancestor_accent_stays_on_the_card_path`). Graded `pass` on that evidence | Either re-attribute — add a thin `test_UAT_AC731_*` clause over the same fixtures — or leave as is and accept that AC-731's evidence spans three files. Prefer re-attribution only if the matrix convention requires the AC's own UAT to be self-sufficient; do **not** copy the fixtures, per the one-authoritative-location rule |

## Notes for the Editor

**The two violations are unrelated and neither is expensive.** Finding 1 is one
test in `tests/reconciliation-l1-fold.test.ts`; finding 2 is one test in
`tests/reconciliation-3probe-gate.test.ts`. Both AC bodies already spell out the
fixture to build — neither needs a design decision.

**Finding 2 is the one to prioritise.** It is the same shape as attempt 7's
finding 4 (the pinned-box overflow) which took four cycles to close: a live,
production-consumed branch of the acceptance gate with zero executable evidence,
carried forward as `pass` by cycles that re-read the *verdict* rather than the
*test*. AC-705 was graded `aligned (carried from a prior line-by-line pass)` by
the alignment cycle this morning; the carry is where it slipped. Note also the
asymmetry it protects against: `mounted` can neither fail a run nor rescue one, so
a regression here is silent by construction — the number simply stops being
reported, or a correct reproduction starts failing on markup L1 never emitted.

**On finding 1 and the two prior blessings.** Two earlier uat cycles graded AC-694
`pass` and the alignment cycle graded it a warning, all on the reasoning that "the
AC's Verification inherently requires a real engine and the test gates on it
honestly". That reasoning covers the *skip*, but not the *scope*: even with
Chromium present, the test asserts three of the Criterion's eight dimensions.
Ancestry, position mode and sibling-repetition count are the sidecar's whole
reason to exist (they are the relationships the painted-geometry fold deliberately
omits), and nothing anywhere asserts them. That is why this is filed as a
violation rather than an environment note. Making the skip explicit is worth doing
too, but it is the smaller half of the fix.

**Do not trust `.xgd/uat_index.json` in this worktree.** It is empty
(`{"updated_at": …, "acs": {}}`), so the lookup this prompt prescribes returns `[]`
for all 42 ACs. Any future cycle that reads it without checking will conclude every
AC is uncovered. Rebuild the map by grepping `tests/` for `test_UAT_AC(\d+)_`.

**Evidence quality outside the two gaps is high.** The 40 passing ACs drive real
entry points throughout — `foldToL1`, `cmdCapturePage`, `cmdRepro`, `cmdL1Gate`,
`cmdGate`, `evaluateLayout`, `promoteToFlow`, the three probes, `renderL1Document`
and the `1c` CLI itself. No internal component is mocked anywhere in the nine
files; the only stub is `vi.spyOn(globalThis, 'fetch')` in AC-814's offline re-fold
(an external boundary, and the assertion is that it is *never called*). Several
tests carry an explicit counterfactual — AC-735 re-implements the closed-upper-bound
resolver locally to prove the guard bites, AC-736 contrasts synthesized vs captured
ids at identical geometry, AC-1351 contrasts one-extent against two-extent fits.
That is the standard the two gaps should be repaired to.
