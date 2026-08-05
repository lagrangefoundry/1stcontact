---
uid: report-ec51a235
id: REPORT-1321
type: report
title: 'UAT Coverage: l1_reproduction_pipeline'
created_by: xgd
created_at: '2026-08-05T22:28:47.872746+00:00'
updated_at: '2026-08-05T22:28:47.872746+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-2049c9ec
  violations: 0
  warnings: 0
  needs_review_count: 1
---

# UAT Coverage Assessment: l1_reproduction_pipeline

**Result**: FAIL (needs_review, not a coverage violation)
**AC verdicts**: 24 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 1 needs_review
**Capability verdict**: fail

Every AC in this capability is backed by a substantive UAT that exercises a real
entry point and passes. The single reason this is not a PASS is a story-level
intent/code/matrix divergence that the assessor cannot resolve without an
operator decision (detailed below).

## Evidence base

All 24 named UATs exist and pass:

```
vitest run tests/reconciliation-3probe-gate.test.ts \
           tests/reconciliation-3probe-gate-evaluator.test.ts \
           tests/reconciliation-l1-fold.test.ts \
           tests/reconciliation-l1-fold-full-language.test.ts
→ Test Files 4 passed (4);  Tests 24 passed (24)
```

Note: `.xgd/uat_index.json` reports `status: "missing"` for all 24. That is a
stale run-status, not absence — every test is present and green. (The index keys
ACs lowercase, e.g. `ac705`; the prompt's `.upper()` lookup returns nothing and
should not be read as "no tests".)

Evidence quality: the UATs drive `foldToL1`, `sampleFidelityProbe`,
`offSampleProbe`, `contentRobustnessProbe`, `threeProbeGate`, `promoteToFlow`,
`evaluateLayout`, `validateL1`, `renderL1Document`, `cmdCapturePage`, `cmdL1Gate`
and the `1c` CLI via `run(argv)`. No internal component is mocked; the only
synthetic inputs are capture fixtures and a fake browser driver at the true
external boundary (Playwright), which is the sanctioned thin-mock seam. Several
UATs encode explicit discriminators (e.g. AC-705 proves occurrence-index pairing
by showing a kind-keyed or text-keyed map would report phantom deltas; AC-735
runs a local closed-upper-bound counterfactual to prove the guard bites; AC-736
asserts the surface exception is load-bearing rather than vacuous).

## Cumulative Intent Considered

| Intent | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot: L1 substrate + modules | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | B2: capture→L1 fold (keyframes + oracle) + hint extractor | YES |
| REQ-86 | free_and_reconciled | 2026-07-20 | E: reproduce a site end-to-end (3-probe gate) | YES |
| REQ-88 | free_and_reconciled | 2026-07-21 | L1 reproduction pipeline: capture bundle → gate-able site | YES |
| BUG-5 | free_and_reconciled | 2026-07-23 | Fidelity pairing by string → occurrence identity | YES |
| BUG-6 | free_and_reconciled | 2026-07-23 | Unexpressed elements → signalled typed residual | YES |
| BUG-7 | free_and_reconciled | 2026-07-23 | evaluateLayout row tiling (no false overflow) | YES |
| BUG-8 | free_and_reconciled | 2026-07-23 | Half-open breakpoint intervals (no stale cascade) | YES |
| BUG-9 | free_and_reconciled | 2026-07-23 | promoteToFlow recurses into nested regions | YES |
| BUG-11 | free_and_reconciled | 2026-07-23 | Fold carries surfaceFill/surfaceGradient | YES |
| REQ-90/91/92 | free_and_reconciled | 2026-07-23 | Resource table; extended axes; rebuild foldToL1 | YES |
| **BUG-14** | free_and_reconciled | 2026-07-23 | Full-bleed band tiling, card grouping, `borderLeft` axis | YES — see finding 1 |
| **BUG-17** | free_and_reconciled | 2026-07-23 | Fold carries element padding onto leaves | YES — see finding 1 |
| **BUG-18** | free_and_reconciled | 2026-07-23 | Per-width responsive scalar tracks for text axes | YES — see finding 1 |
| **BUG-20** | free_and_reconciled | 2026-07-23 | Box treatments (borderLeft/radius+shadow/gradient) on runs | YES — see finding 1 |

Bundles: BUNDLE-7 (`bundle-31e474b9`) and BUNDLE-8 (`bundle-cceaba25`) are both
`free_and_reconciled` and are what both stories were last `updated_by`.
**BUNDLE-10 (`bundle-4ff83a8b`) is also `free_and_reconciled`** (BUG-12…BUG-25,
REQ-88, REQ-93) and neither story was updated against it. That is the origin of
finding 1.

Out of scope for this capability and excluded deliberately: BUG-13, BUG-16,
BUG-24, BUG-25 (capture-side manifest/value-set axes → capture & diff fidelity),
BUG-15/BUG-22 (values-diff), and the L1 axis vocabulary itself (→ CAP-70).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-86 (gate) | REQ-86, REQ-88, BUG-5, BUG-7, BUG-8, BUG-9 | aligned | Body matches code and tests exactly, including the BUNDLE-8 additions (row model, half-open intervals, backing-surface exception, fold-residual channel). 11/11 ACs covered. |
| STORY-84 (fold) | REQ-83, REQ-92, REQ-90, BUG-6, BUG-11 | needs_review | Aligned with everything through BUNDLE-8. Does not describe the BUNDLE-10 fold behaviors — which are also absent from the code on this branch. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | needs_review | story | STORY-84 | — | BUNDLE-10 (`free_and_reconciled`) records fold-side behaviors — BUG-17 padding folding, BUG-18 per-width responsive text tracks, BUG-14 full-bleed band tiling + card grouping + `borderLeft`, BUG-20 box treatments on runs. The story body describes none of them and no AC in the matrix covers them. **They are also absent from the code on this branch.** | Operator decision required — see below. Do NOT author UATs for these until it is resolved. |

No violations and no warnings. Finding 1 is not counted as a coverage violation
because the behavior is not present in the code under test; authoring UATs for it
now would produce failing tests against absent implementation.

## Notes for the Editor

**Finding 1 is a reconcile-integrity question, not a UAT-authoring task.** The
matrix and the code agree with each other; both disagree with the ticket store.
Verified facts:

- `bundle-4ff83a8b` (BUNDLE-10) is `free_and_reconciled`, tagged
  `xgd/merged/BUNDLE-10` at `2d59a3b6`.
- That commit **is** an ancestor of this branch, but does **not** contain the
  BUNDLE-10 fold content.
- `borderLeft` in `packages/site-schema/src/l1/schema.ts`:
  `reconcile-BUNDLE-10` = 1 hit, `xgd-working` = 2 hits,
  **`main` = 0, `regression-6667f6e1` = 0.**
- `padding` in `tools/generate/src/l1/fold.ts`: 0 on every ref, including
  `xgd-working` — the BUG-17 commits (`23c4235de` et al.) are contained in
  `xgd-working` history but their content no longer survives in the file.
- No AC anywhere in the store (87 unique ACs swept) mentions padding, a
  responsive scalar track, or multi-line run splitting.

Two readings, and the operator must pick:

1. **Reconcile content was lost** — BUNDLE-10 was marked merged but its fold
   payload never reached `main`. Then the fix is a code/reconcile repair, after
   which STORY-84 gains a body edit plus ac-add + uat-add for each behavior.
2. **The BUNDLE-10 fold work was deliberately superseded** (e.g. by the REQ-92
   fold rebuild or a later resync) and the bug tickets' status is stale. Then the
   fix is ticket-status hygiene, and STORY-84 is already correct as written.

Reading 1 is the more likely of the two given `reconcile-BUNDLE-10` still carries
the `borderLeft` axis that `main` lacks, but the assessor will not guess.

**Secondary detail, contingent on the above** — if reading 1 holds, two existing
ACs also need editing rather than just supplementing:

- **AC-691** asserts "typography axes are taken from the widest present sample"
  (test pins `fontSizePx === 44` on a fixture whose font size varies 24/32/44
  across widths). BUG-18 changes exactly this: a varying axis becomes a per-width
  track and only a static axis stays a scalar. Under reading 1 this clause
  becomes incomplete and the AC needs an ac-edit plus a track assertion.
- **AC-731** describes *flat, per-run* surface reconstruction (band + one backing
  box per differing run). BUG-14's stated fix replaces flat per-run
  reconstruction with a section-band → card → text hierarchy (grouping by
  signature + x-overlap + vertical adjacency, full-bleed band tiling). Under
  reading 1, AC-731 describes the superseded behavior and is stale.

Under reading 2, both ACs are correct exactly as they stand and no edit is needed.

**STORY-86 needs no action.** Its body, its 11 ACs and its two test files are
mutually consistent and fully green, including every BUNDLE-8 addition.
