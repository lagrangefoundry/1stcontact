---
uid: report-f0be6abc
id: REPORT-988
type: report
title: 'Code Review: bug-5b7153d2'
created_by: xgd
created_at: '2026-07-27T21:00:46.963100+00:00'
updated_at: '2026-07-27T21:00:46.963100+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bug-5b7153d2
  anchor_uid: bug-5b7153d2
---

# Code Review

**Result**: PASS

## Summary
BUG-5 replaces the `Map<normText, box>` pairing in `sampleFidelityProbe` with per-key FIFO
queues plus a per-key cursor, so oracle occurrence *i* of a text key pairs with reproduced
leaf *i* (document order) instead of every duplicate collapsing onto the last leaf's box.
The change is 31 lines confined to one function plus its docstring, correctly mirrors the
occurrence indexing `buildResponsiveTable` already assigns, and is proven by UATs that fail
under the old pairing. Typecheck is clean across all five packages, the full 578-test suite
passes, and the fix was smoke-tested end-to-end through the real `1c l1-gate` CLI on a
repeated-text bundle. One latent robustness gap is recorded as a warning; it is not
reachable from any current production caller and does not block.

## Scope Reviewed
Anchor commit `4ce94a35e` (working `d893b3188`) — `tools/generate/src/l1/probes.ts` (+31/-3)
and `tests/bug5-fidelity-pairing.test.ts`. The test file was subsequently superseded by
`tests/reconciliation-3probe-gate.test.ts` in `41ca17f26` (reconciliation UAT generation);
the BUG-5 coverage was carried over and is reviewed in its reconciled form.

The branch also carries `ae35f6605` (REQ-88 L1 repro pipeline), a **separate anchor** —
not reviewed here except where BUG-5's probe is reached through its `1c l1-gate` entry point.

## Quality Gates
| Gate | Source | Result |
|------|--------|--------|
| Lint | REPORT-982 | success, 0 errors / 0 warnings (see Warning 2 — vacuous) |
| Build | REPORT-982 | success |
| Tests (scoped) | REPORT-982 | 7 passed / 0 failed |
| Coverage | REPORT-982 | 93.2% (threshold 60%) — see Warning 3 |
| Typecheck (verified in review) | `tsc --noEmit` x5 packages | clean, exit 0 |
| Full suite (verified in review) | `npx vitest run` | 82 files, 578 tests, 0 failed |

The scoped quality run deselected 571 tests, so the full suite was re-run in review to confirm
no regression outside the scoped filter. It is green.

## External Interface Accessibility
Wired in: **yes**, no gaps. `sampleFidelityProbe` was already exported
(`tools/generate/src/l1/index.ts:19`) and reached via `threeProbeGate`
(`probes.ts:523`) -> `cmdL1Gate` (`tools/generate/src/cli/repro.ts:135`) -> the registered
`1c l1-gate` command (`tools/generate/src/cli/index.ts:138-145`). BUG-5 changes the internals
of an already-integrated function; no new surface was added, so nothing could be left dangling.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| tools/generate/src/l1/probes.ts:405-425 | Pairing logic is correct and minimal. `leafQueues` is built from `evaluateLayout` leaf order; `cursor` counts oracle occurrences per key. The cursor increments even when the queue is exhausted, so a surplus oracle occurrence cannot shift a later occurrence onto an already-consumed box — the right call. | none |
| tools/generate/src/l1/probes.ts:379-389 | Docstring explains *why* occurrence identity is the stable key and cross-references `buildResponsiveTable` as the invariant's source. Above the surrounding standard. | none |
| tools/generate/src/l1/probes.ts:405-412 | The FIFO-queue-by-key construction duplicates the same ~8-line pattern in `buildResponsiveTable` (`cli/responsive-diff.ts:102-113`). Different modules, different key functions (`normText` vs `elementKey`), and the docstring names the relationship — extracting a shared helper would couple a probe to a CLI module for little gain. Acceptable as-is. | info |
| tools/generate/src/l1/probes.ts:417 | `table.filter((t) => t.width === width)` re-scans the whole oracle table per width (O(n*w)). Pre-existing, unchanged by this commit. Not a finding against BUG-5. | info |
| — | No debug code, no commented-out blocks, no TODO stubs, no new magic numbers (tolerance remains an option defaulting to 2). | none |

## Evidence Validity
The UATs are valid evidence, not tautologies:
- `test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance` uses `repeatedTextOracle()`
  — the same CTA at y=100/500/900 at every ladder width. Under the old text-map pairing this
  fixture produces phantom dy of 400 and 800px; it gates clean only because of the fix. It then
  asserts (a) clean pass, (b) a surplus occurrence yields **exactly one** `unmatched` entry and
  zero residuals — a genuine coverage gap, not a re-pair, and (c) drift on the *middle*
  occurrence is attributed to that occurrence alone (one residual, dy=30) rather than absorbed
  by a nearest-box match. (c) is the test that would catch a naive "pair to closest box" fix.
- `test_UAT_AC724_value_render_deterministic_and_per_occurrence_faithful` covers the ticket's
  idempotency requirement: repeated evaluation is identical, and N oracle elements sharing a
  key yield N distinct runs whose k-th box matches the k-th oracle box within 2px.
- Real components throughout (`foldToL1` -> `evaluateLayout` -> `sampleFidelityProbe`); no
  internal mocking. Fixtures are hand-built capture data, an external-boundary substitute.

## Acceptance Criteria (from the anchor ticket)
| Criterion | Status | Evidence |
|-----------|--------|----------|
| Pair by stable identity, not raw text | met | probes.ts:405-421 — occurrence index within a text key. Ticket body proposed a node-id/index-path; the implementation note supersedes it with occurrence index and states why no node-id field was added. The substitution is sound: `buildResponsiveTable` already assigns exactly that index, so the identity is genuinely stable rather than re-derived. |
| Duplicate text handled deterministically | met | test AC705 block (a); positional match within a width |
| Distinguish coverage gaps from mispairing | met | test AC705 block (b) — surplus occurrence -> `unmatched`, not a stale map hit |
| Idempotency suite over repeated text | met | test AC724 |
| Regression fixture with duplicated runs | met | `repeatedTextOracle()`, tests/reconciliation-3probe-gate.test.ts:132-152 |
| Repeated-text fixture gates clean; no phantom deltas | met | verified in review end-to-end through the CLI (see Smoke Test) |

## Checklist Compliance
No `architecture_checklist`, `security_checklist`, or `design_checklist` report exists for this
project (all three queries returned empty). Sections omitted per the review contract.

Noted for completeness: the change is inert with respect to DOC-2 (structured-only). It touches
a measurement probe, not the site-definition -> render path; no value it handles reaches a
browser sink, and it introduces no new schema surface or string interpolation.

## Smoke Test
Entry points tested (BUG-5's probe is reached through the `1c l1-gate` command):
1. `node tools/generate/bin/1c.mjs` — usage renders, exit 0.
2. `1c l1-gate --ref <missing-bundle>` — clean actionable error ("No multistate.json in
   bundle ... re-capture with `1c capture page <url>`"), no stack trace.
3. `1c l1-gate --ref <synthetic bundle> --json` on a 3-width ladder carrying the same CTA
   **three times per width** — the exact BUG-5 collision case. Result: gate `pass=true`,
   `sampleFidelity.pass=true`, `maxDelta=0`, 0 residuals, 0 unmatched, exit 0. This is the
   ticket's headline acceptance criterion confirmed through the user-facing entry point.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix — none blocking, none introduced defects in the anchor's scope)**:

1. **`oracleBoxes` does not dedupe projections by width, so a multi-engine bundle now hard-fails
   the fidelity probe** (`tools/generate/src/l1/probes.ts:335-346`). `foldToL1` defends against
   this — `restingByWidth` (`fold.ts:41-51`) keeps exactly one projection per width, preferring
   the requested engine — but `oracleBoxes` filters only on `state !== 'rest'` and emits every
   projection's elements. With `engines: ['chromium','webkit']`, every `(text, width)` appears
   twice while the fold produced one leaf, so the second engine's occurrences exhaust each queue
   and land in `unmatched`.

   Verified empirically during review (scratch script, not committed): a two-engine capture with
   **byte-identical geometry** returns `pass=false` with one spurious `unmatched` per
   `(text, width)`; the single-engine control returns `pass=true`. Under the previous text-map
   pairing that same input passed, so this is a behaviour regression in the latent case — and a
   *false* coverage gap, which cuts against the ticket's own "distinguish genuine coverage gaps
   from mispairing" goal.

   **Not reachable today**: the only production writer of `multistate.json` is `cmdCapturePage`
   (`cli/capture/capture.ts:45`), which calls `runMultiStateCapture` without `engines`, taking
   the `['chromium']` default. `engines` is public API on an exported function
   (`cli/capture/index.ts:8`) but has no non-test caller. Hence a warning, not a failure.

   **Remediation** (single-site, ~4 lines): in `oracleBoxes`, keep one projection per viewport
   width before flattening — mirroring `restingByWidth`'s dedupe — or add `engine?: string` to
   `OracleSource` and filter on it. Worth a follow-up ticket rather than a fix-loop iteration.

2. **The reported lint gate is vacuous** (project-level, pre-existing — not a BUG-5 defect).
   `.xgd/quality.yaml` declares `lint.tools: [eslint]`, but the repo has no
   `eslint.config.(js|mjs|cjs)`; running `npx eslint .` fails with "couldn't find an eslint
   config file". REPORT-982's "lint: success, 0 errors, 0 warnings, duration 0.0001s" therefore
   measures nothing. The real static gate on this change is TypeScript, which I ran directly and
   which is clean across all five packages.

3. **Coverage does not measure the changed file** (project-level, pre-existing — not a BUG-5
   defect). `.xgd/quality.yaml` `source_dirs` lists only `apps/control-app/src`,
   `apps/public-site/src`, `packages/framework/src`, `packages/site-schema/src` — it omits
   `tools/generate/src`, where every line of this change lives. The reported 93.2% is real but
   is not evidence about `probes.ts`. The direct UATs are, and they are strong.

Warnings 2 and 3 are project quality-configuration gaps that predate this ticket and apply to the
whole `tools/generate` tree. They should be raised against the quality config, not against BUG-5.

## Fix-It Prompt
N/A — result is PASS.
