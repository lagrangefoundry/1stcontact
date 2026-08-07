---
uid: acceptance_criterion-9727d55f
id: AC-724
type: acceptance_criterion
title: Analytic value-render of the absolute-base fold is deterministic and per-occurrence
  faithful with repeated text
created_by: xgd
created_at: '2026-07-27T20:38:34.691691+00:00'
updated_at: '2026-08-07T23:54:15.698706+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The fidelity verdict rests on an idempotence identity that the reproduction pipeline
must satisfy: `value-render(value-render(X)) == value-render(X)`.

- **Deterministic.** Evaluating the same reproduced document at the same width twice
  yields identical leaves — same runs, same order, same boxes. The analytic
  value-render is a pure function of the document and the width, so a fidelity verdict
  is reproducible run to run rather than dependent on evaluation order or state.
- **Per-occurrence faithful.** Where a capture carries N elements sharing the same text
  at a width, the document folded from it yields N distinct reproduced runs for that
  text — not one collapsed run — and the k-th reproduced run's box matches the k-th
  oracle element's box within tolerance (default 2px), at every captured width in the
  ladder.

Together these make a clean sample-fidelity report meaningful: the reproduction
genuinely reproduces every occurrence's own box, so a pass cannot be an artefact of
collapsed or re-ordered runs.

## Verification
Fold a multi-width capture whose every ladder width carries the same label three times
at distinct y positions (plus a unique heading). At each ladder width: evaluate the
reproduced document twice and assert the two leaf lists are identical; assert exactly
three reproduced runs exist for the repeated label (matching the three oracle
elements); and assert each repeated occurrence's y matches its own oracle element's y
within 2px.