---
uid: comment-40e8c1cd
id: COMMENT-2407
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T00:35:55.735347+00:00'
updated_at: '2026-09-10T00:35:55.735347+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e2c8368a
  kind: note
---

Report filed as `report-e2c8368a`.

## What I did this call

Took the two remaining findings that were achievable and browser-free.

**Finding 7 — AC-631's missing capture leg.** New file `tests/reconciliation-capture-surface-fill.test.ts`: 3 tests running the real `EXTRACT_SCRIPT` under jsdom, in the shape of AC-711's capture leg. This replaces evidence that only existed behind a browser gate.

**Finding 10 (first slice) — 2 of the 13 pending ACs.** New file `tests/reconciliation-values-diff-spacing-axes.test.ts`: 6 tests driving the real `diffManifests` for AC-1609 and AC-1610, asserting only the clauses the FC siblings don't (row-pair naming, `--tolerant` widening, non-stacked rows, the band-padding mirror).

Both proven load-bearing by mutation:

| Mutant | Result |
|---|---|
| `surfaceFillOf` stops at the first fill instead of compositing | New AC-631 leg red with `expected '#ffffff'` — the historical symptom. The existing compare-leg test **stayed green**, confirming it owned only half the AC |
| `gapTol` tolerant band 16 → 6 | **30 passed, 1 failed** — all 25 FC siblings green, only the new AC-1609 leg caught it |

That second one is the direct answer to "do these add anything the free-coded tests don't."

`Test Files 10 passed | Tests 71 passed | 11 skipped`. Production code untouched — `git status` shows only the two new files.

## Two things worth your attention

**AC-1610's Verification overreaches its own Criterion.** It says "assert *exactly one* delta is reported, on the `gap` axis." That isn't satisfiable: shifting a row also moves the element absolutely, firing an independent `position` delta. I verified this empirically rather than assuming it. The Criterion — which is only about band padding vs the gap axis — *is* satisfiable, so that's what I asserted, with the gap documented at the assertion. It needs an `ac-edit` at the next ac-level pass; I'm at level=uat so I didn't touch the AC body.

**Findings 3 and 4 are unchanged, and I don't think another iteration helps.** Finding 3 (AC-720) needs a choice between a browser-gated leg and dropping the AC's end-to-end clause — removing an assertion from an AC is your call, not mine. Finding 4 (AC-815) is authored but cannot execute without Chromium. Both are now on their sixth consecutive filing; neither is a scoping failure on the fix step's part, and neither will clear in this environment.

One incidental finding worth recording: AC-711's jsdom harness stubs one identical box for every element, which silently breaks any *surface* axis test — `surfaceChain` sorts tightest-first by area, so equal areas tie and the opaque band wins. The new file gives each element a real box via `data-box`. Any future jsdom capture test touching a surface axis will need the same.
