---
uid: report-a396efca
id: REPORT-984
type: report
title: 'Reconciliation Review: commits — BUG-5 sample-fidelity pairing by occurrence
  identity'
created_by: xgd
created_at: '2026-07-27T20:52:02.414782+00:00'
updated_at: '2026-07-27T20:52:02.414782+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bug-5b7153d2
  anchor_uid: bug-5b7153d2
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: bug-5b7153d2 (BUG-5)
**Stories Reviewed**: 1 (story-24098299 / STORY-86)

## Step 1 — Intent (ticket body; no comments exist on BUG-5)

Declared scope, from the body plus its own "Implementation (free-coded, 2026-07-22)" note:

1. Pair oracle↔reproduced leaves by a **stable identity**, not raw text (body proposes "index path / node id carried through the fold"; the implementation note supersedes this with **occurrence index within a text key**, explicitly recording that no new node-id field was added).
2. Handle duplicate text **deterministically** (positional match within a width).
3. **Distinguish genuine coverage gaps from mispairing** in the report.
4. Add an **idempotency suite** — `value-render(value-render(X)) == value-render(X)` — over a fold with repeated text.
5. Add a **regression fixture** with duplicated runs that previously mispaired.
6. Acceptance: repeated-text fixture gates clean; idempotency tests pass; no phantom deltas at sampled widths.

## Step 2 — Behavior Inventory (read independently from the code)

Source commit `4ce94a35e` (working `d893b318`) touches exactly two files: `tools/generate/src/l1/probes.ts` (+31/−3) and a test file. Verified by `git show --stat`.

The production change is confined to the per-width pairing block of `sampleFidelityProbe` (probes.ts:391–437) plus its docstring:

1. Per captured width, reproduced text leaves are bucketed into **FIFO queues keyed by `normText`**, in `evaluateLayout` leaf order (`leafQueues`), replacing `const byText = new Map<string, EvalBox>()` whose `.set` retained only the last leaf's box.
2. The oracle table for that width is walked with a **per-key cursor** (`cursor`), so oracle occurrence *i* of a key pairs with reproduced leaf *i* of that key.
3. `leafQueues.get(k)?.[idx]` miss (queue exhausted before the oracle's occurrences) → one `unmatched {text, width}` entry, `pass = false` — no re-pair against an already-consumed box.
4. Paired box exceeding tolerance on any axis → one residual `{text, width, dx, dy, dw}`, attributed to that specific occurrence (no nearest-box / last-writer fallback).
5. Unchanged: tolerance default 2px, `maxDelta`, `pass = residuals.empty && unmatched.empty`.
6. Implied identity (now under test): `evaluateLayout` of the absolute-base fold is a pure function of (doc, width), and a capture with N same-text elements folds to N distinct leaves each reproducing its own oracle box.

No change to the fold, renderer, evaluator geometry, report shape, or the other two probes — consistent with the plan's Case-1 finding.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Occurrence-index pairing (k-th oracle ↔ k-th reproduced, document order, per width) | Covered | story-24098299 | AC-705 states the rule explicitly; story Description carries it too |
| 2 | Repeated labels/CTAs each compare against their own box → no phantom deltas at sampled widths | Covered | story-24098299 | AC-705 consequence (a) |
| 3 | Surplus oracle occurrence → exactly one `unmatched` entry, other occurrences still clean | Covered | story-24098299 | AC-705 consequence (b) — the coverage-gap vs mispairing distinction |
| 4 | Drift on one occurrence of a repeated key → exactly one residual naming that occurrence's width + per-axis deltas | Covered | story-24098299 | AC-705 consequence (c); tightens AC-710's diagnostic requirement |
| 5 | Pairing order-defined on both sides → verdict reproducible run to run | Covered | story-24098299 | AC-705 final bullet + AC-724 determinism clause |
| 6 | Unchanged report shape (tolerance 2px, dx/dy/dw, maxDelta, pass rule) | Covered | story-24098299 | AC-705 "Report shape" section |
| 7 | Analytic value-render deterministic and per-occurrence faithful (idempotence identity) | Covered | story-24098299 | AC-724 (new), the plan's added AC |

## Intent Fidelity

| Intent element | Verdict | Evidence |
|---|---|---|
| Stable identity, not raw text | Faithful (divergence **flagged, not absorbed**) | The body's "index path / node id" was narrowed to occurrence-index. STORY-86's Technical Context names the narrowing, states no node-id field was added, cites the intent ticket's own implementation note as the supersession, and records the resulting load-bearing coupling to the fold's FIFO per-key row order (CAP-71 → CAP-73). This is the one divergence in the change set and the matrix declares it rather than presenting occurrence-index pairing as the original ask. |
| Duplicate text handled deterministically (positional within a width) | Faithful | AC-705 pairing rule + AC-724 determinism clause |
| Distinguish genuine coverage gaps from mispairing | Faithful | AC-705 consequence (b) |
| Idempotency suite over a repeated-text fold | Faithful | AC-724, with the identity written out |
| Regression fixture with duplicated runs | Faithful | `repeatedTextOracle()` (3× "Learn more" at y=100/500/900 across all six ladder widths) |
| Not to be conflated with STORY-75 / CAP-72 values-diff duplicate-text pairing | Faithful | Called out in both AC-705 and the story's Technical Context |

Intent phrasing "text may remain a tiebreaker" is inverted by the implementation (text is the primary key, occurrence the tiebreaker). This is a restatement of the same narrowing already flagged above and is behaviourally equivalent for the declared acceptance; no additional discrepancy.

## Ungrounded Stories

None. Every claim in STORY-86's sample-fidelity bullet, its idempotence paragraph, and its Technical Context traces to either the intent body or the code read in Step 2.

## Step 5b — Evidence Sufficiency

UATs live in `tests/reconciliation-3probe-gate.test.ts`; the FC file `tests/bug5-fidelity-pairing.test.ts` was migrated (deleted in `41ca17f26`, +103 lines into the AC-named file) — no orphan, no duplicate.

Executed in this worktree after `pnpm --filter @1stcontact/site-schema build`:
`npx vitest run tests/reconciliation-3probe-gate.test.ts` → **1 file, 7 tests passed** (930ms).

| AC | UAT | Sufficient? | Discriminating scenario |
|---|---|---|---|
| AC-705 | `test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance` | Yes | Four independent negative controls. (a) repeated-text fixture gates clean — the pre-fix text map collapses all three CTAs onto y=900, so occurrences 0/1 would report dy 800/400 and `pass=false`. (b) 4th oracle CTA at 768 asserts `unmatched === [{CTA,768}]` **and** `residuals === []` — the map would instead re-pair against the consumed box and emit a residual (dy=200), failing both assertions. (c) middle CTA shifted +30px at 1440 asserts exactly **one** residual with dy≈30 — the map yields two. Plus the pre-existing single-run perturbation (dx=10 at the last width, proving all widths are iterated) and dropped-run → unmatched. A broken pairing strategy cannot pass this set. |
| AC-724 | `test_UAT_AC724_value_render_deterministic_and_per_occurrence_faithful` | Yes | Loops all six ladder widths: double-evaluation identity, `reproCtas` length asserted equal to the 3 oracle elements (a collapsing fold yields 1 → fails), and each k-th run's x/y asserted within 2px of the k-th oracle element's own box. The per-occurrence half is the substantive discriminator; it independently verifies the fold-ordering coupling AC-705 depends on. |
| AC-706 | `test_UAT_AC706_off_sample_envelope_holds_at_unsampled_widths` | Yes | Pass/fail pair: `narrowOracle()` clips at 500 while 900 stays clean — non-vacuous on both sides. |
| AC-707 | `test_UAT_AC707_content_robustness_under_grown_content` | Yes | Pinned base fails at 2.5× (overlap findings present); the flow-promoted equivalent passes with empty findings. |
| AC-708 | `test_UAT_AC708_combined_gate_non_vacuous_over_base_overlay_split` | Yes | Explicit non-vacuity: gate false without the overlay (driven by content-robustness) with fidelity still true on the absolute base; true with it. |
| AC-709 | `test_UAT_AC709_demand_driven_recovery_promotes_only_failing_groups` | Yes | Failing region promoted (index path `'0'`) and envelope restored; `roomyOracle()` — which already survives perturbation — asserts `promoted === []`, proving "only failing groups". Result additionally asserted `validateL1(...).ok`. |
| AC-710 | `test_UAT_AC710_probe_findings_are_diagnostic` | Yes | Residual dy≈7 at width 1280 with per-axis fields; overlap/clip findings assert kind, non-empty detail, magnitude in px, and ≥1–2 index paths matching `^\\d+(\\.\\d+)*$`. |

Validity checks: all seven enter through the public module boundary (`tools/generate/src` exports — `foldToL1`, `evaluateLayout`, the three probes, `threeProbeGate`, `promoteToFlow`) and `packages/site-schema` (`validateL1`). No repository-owned code is mocked; the only constructed inputs are `MultiStateCapture` fixtures, which are the pipeline's genuine external input, not stand-ins for internal components. No test asserts by inspecting source text. No "which function is called" invariant is guarded without an observable-outcome scenario.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Sample-fidelity probe (3-probe reproduction gate) — upgrade, 2 pts | story-24098299 (STORY-86) | ✓ |

The item's declared mutations were all delivered: AC-705 (`acceptance_criterion-330b48e4`) **modified** — "the corresponding oracle box" replaced by the explicit pairing rule with consequences (a)/(b)/(c) and an extended Verification section; one AC **added** — AC-724 (`acceptance_criterion-9727d55f`, `story_uid=story-24098299`), the idempotence identity; no removals. Story `story_kind=upgrade`, `updated_by=bug-5b7153d2`, `uat_coverage=pass`. Nothing silently dropped; no story was created for what the plan scoped as an in-place upgrade.

## Judgment Calls

- **Occurrence-index vs node-id narrowing — not a silent divergence.** This was the one place a FAIL could have been warranted. The matrix does not present occurrence-index pairing as the original ask: STORY-86's Technical Context names the narrowing, its justification, and its cost (a cross-story coupling to the fold's FIFO ordering). Passing.
- **AC-724's determinism clause is weak on its own** (a pure function trivially satisfies double-evaluation identity). Not material: the AC's substantive claim is per-occurrence faithfulness, which the same UAT discriminates sharply, and the determinism clause is the vocabulary DOC-27 names. Acceptable.
- **Docstring rewrite in probes.ts uncovered by any AC** — internal implementation commentary, not user-visible behaviour. Acceptable omission under the materiality test.
- **`normText` normalisation semantics uncovered** — pre-existing, unchanged by this commit, and an internal detail of a key whose externally visible behaviour (pairing) is fully specified. Acceptable.
- **STORY-75 / CAP-72 duplicate-text pairing** correctly excluded as a reuse target: different subsystem (`1c values-diff` CLI), different mechanism (positional/geometric), untouched by this commit. Both ACs state which pipeline they govern, so the conflation risk the plan flagged is closed.

## Verdict

**PASS** — Stories accurately and completely document the behavior surface. A developer reading STORY-86 would have a correct mental model of what BUG-5 changed, would know the pairing rule and its three observable consequences, would know the idempotence identity the verdict rests on, and would be told that the implemented identity is the fold's occurrence index rather than the node-id the intent body first proposed — including the cross-story coupling that narrowing creates. Every active AC is backed by a passing UAT that enters through the real module boundary with no internal mocking, and each carries a negative control that the pre-fix text-keyed map would fail. The single plan item produced its intended upgrade.
