---
uid: comment-22cb4305
id: COMMENT-1058
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T03:41:04.296984+00:00'
updated_at: '2026-08-16T03:41:04.296984+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b8a37c51
  kind: note
---

**UAT coverage: PASS** — CAP-92 (Site Control Surface). REPORT-2059 (`report-b8a37c51`): 0 violations, 0 needs_review, 2 warnings.

**Verdicts written**: 13 ACs (AC-1071…AC-1082, AC-1142) all `pass`; STORY-105 `pass`; capability `pass`.

**Intent ledger**: STORY-105 hangs off BUNDLE-17 (`free_and_reconciled`, merged at `0198704b`). REQ-126 built the surface; REQ-127/129/130 extended the same declaration; REQ-125 (`legacy_done`) is the design predecessor. Nothing in the ledger retires behavior this tree claims, so no AC is deprecated and no story body is stale. REQ-146, which would change the withheld-publish posture, is `draft` and does not count.

**What I verified.** I hand-checked every assertion in all 13 tests against the shipped `l1-surface.json` and `instances.json`: the 8 groups partition all 21 operations exactly and are effect-homogeneous; AC-1073's hard-coded 12-name write set matches; AC-1081's structural filter (`params.module && params.slot`) yields exactly `[get_l1, set_l1]`, both typed `l1_address` with no per-op description; AC-1142's `ungranted` resolves to exactly `['Publish deliberately']`, so its anchor bites. All consistent. Two story-body clauses no AC names directly — "what comes back" and "how it can fail" — I chased to DOC-30, which records that shapes document rather than validate, and that per-op `errors` are typed against a closed `ErrorCode` by the format check AC-1071 runs. Neither is a gap.

**Two things you should know, both in the report.**

The tests have now gone three rounds without being executed. `npx vitest run`, `./node_modules/.bin/vitest run`, and any path outside the worktree were all refused by this session's permission mode — the same refusals the prior fix (REPORT-2057) recorded. My verdict is static: consistent with the shipped data, but *no test in this file has been observed to pass*. Compounding it, `@lagrangefoundry/ai` is absent from this worktree entirely — not in `node_modules`, not in any workspace package, not in `pnpm-lock.yaml`. Ten of the 13 tests call `aiCore()` or `createL1Toolbox()` and would fail at resolution without it. The file's docstring anticipates this as an environment failure, so it isn't a bug, but it's worth confirming the regression runner has the shared store installed before treating green here as meaningful.

Separately: `.xgd/uat_index.json` is empty (`acs: {}`) while 110 AC tickets and a full set of `test_UAT_AC*` functions exist. This prompt's own lookup snippet reads that index, so it returns `MISSING` for every AC — I fell back to grepping the source tree. Any assessment that trusts the index over the tree will report a total coverage gap that doesn't exist, on every capability, until it's rebuilt. That's an XGD-tooling defect rather than a CAP-92 finding, so I left it in the report's notes rather than filing it.
