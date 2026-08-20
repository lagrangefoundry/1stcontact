---
uid: comment-acfc974c
id: COMMENT-1263
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T05:35:56.735709+00:00'
updated_at: '2026-08-20T05:35:56.735709+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1afb79c6
  kind: note
---

Second call of attempt 7 complete — 7 more findings closed, report `report-1afb79c6` filed. Three remain.

## What I did

Closed the entire **report-surface cluster** (STORY-116: AC-1286/1287/1288/1289), both **REQ-73 spacing** ACs (AC-1312/1313), and the **CLI boolean-flag** AC (AC-1290). All seven are browser-independent, so all are verified passing here.

Porting turned out not to be rename-only work. Each AC asks for more than its FC ancestor asserted, so every port carries the missing clauses — 11 renames plus **14 newly authored UATs**. The substantive additions:

- **AC-1312** — the drift-free claim itself was untested: four rows, one wrong gap, everything below displaced → exactly one delta. Plus the 6px/16px tolerance band and overlapping-rows suppression.
- **AC-1286** — constant folds to a scalar, fluid folds to a `36 .. 60` range, systemic rollups produce no row, and the header states both the unique count and the raw total.
- **AC-1288** — all five classification cases in one cell set, and the report's flat → structural → emergent print order.
- **AC-1289** — unmapped property falls through to its own `review` cause; disjoint-width members report both widths rather than the whole run.
- **AC-1290** — the AC's own "confirm the assertion is load-bearing" clause: drop any registered flag and the source-derivation must go red.

**119 passed, 12 skipped, 0 failed** across the six touched files plus six adjacent ones.

## Three things worth your attention

**I did not run the full suite.** `vitest run tests/` didn't finish in 10 minutes, so I stopped it rather than leave it hanging; vitest buffers, so there was no partial output to read. The slowness isn't in anything I touched — my twelve files run in 2.3s — but my verification is targeted, not full-suite.

**One AC clause remains unproven.** AC-1289's `--clusters` beats `--collapse` precedence lives in the dispatcher and is only reachable through `--multi-viewport`, which needs a real render. I covered what's honestly reachable (flags parse as independent booleans; the two documents are observably different shapes) and left the branch itself uncovered rather than faking it.

**A possibly-dead classifier rule.** AC-1288's "section spacing → structural" rule keys on `§`-prefixed padding rows — but AC-1313 retired exactly that comparison, so it looks unreachable through `diffManifests` now. I tested it by constructing the delta directly and flagged it for the assessor; deciding whether it's dead code or a contract for an axis that may return is above this level's remit.

The three remaining findings (AC-1310/1314/1316) are the ones warning W1 flagged as browser-gated. AC-1316 is the awkward one — both its capture-side tests are browser-only, so it needs a headless case authored rather than ported.
