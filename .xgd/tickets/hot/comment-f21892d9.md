---
uid: comment-f21892d9
id: COMMENT-1086
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T07:25:50.901711+00:00'
updated_at: '2026-08-16T07:25:50.901711+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0ec59b50
  kind: note
---

**PASS** — REPORT-2087 (`report-0ec59b50`), 0 violations, 0 warnings, 0 needs_review.

## What I assessed

36 ACs across 3 stories, each AC body read in full and matched against the test that claims it.

**Intent ledger.** The tree traces to REQ-110 (deploy), REQ-111 (serving), REQ-113 (clean URLs) and BUG-31 (store-tree scoping, which added AC-924/925/926/927) — all `free_and_reconciled`. I also walked the four intents raised *after* those bundles, which the prior alignment reports did not consider: REQ-141 (`ready_to_reconcile`) is test infrastructure and explicitly preserves every existing test; REQ-142 (`free_coded`) claims no behaviour change; REQ-143 and REQ-145–148 are `draft`; REQ-144 (`free_coded`) is additive. All three `free_coded`/imminent tickets carry `main_sha: null` and their artifacts are absent from this branch. **Nothing retires any behaviour here**, and no AC is unsupported.

**Coverage.** All 36 pass. Evidence drives real entry points throughout — `cmdDeploy`/`cmdPublish` for the operator half, `worker.fetch(Request, Env, ExecutionContext)` for the visitor half, and `startServe` over its real loopback address plus a raw socket where a traversing request must survive client-side normalisation. The only fakes are `MemoryR2Client` and `FakeBucket`, both genuine external boundaries; no internal component is mocked and no test is structural. The two tests that assert partly below HTTP (AC-914's reserved-segment gate, AC-907/923's `parseRoute` checks) do so because their AC bodies prescribe it, and both also carry boundary assertions.

## Three things worth your attention

1. **`.xgd/uat_index.json` is empty project-wide** — `updated_at: 2026-08-16T00:03:30Z` but `acs: {}`. The prescribed index lookup returned MISSING for all 36 ACs; I rebuilt the mapping by grepping the `test_UAT_AC<n>_*` convention. Nothing was lost here, but any workflow that trusts that index will see zero coverage everywhere.

2. **A clause to trim when REQ-144 reconciles.** STORY-95's body records that the live-bucket smoke check "was never run in session." That's accurate today, but REQ-144's `bin/smoke` asserts exactly this capability's surfaces against the live origin. Left as a note, not a finding — nothing needs editing until reconcile.

3. **I could not run the suite.** `npx vitest` and `pnpm vitest` were both denied by the session's permission mode, so these verdicts rest on reading the ACs and test bodies, not on a green run. That is the right scope for a coverage check, but I'm not claiming the tests pass — the regression workflow's test stage owns that.
