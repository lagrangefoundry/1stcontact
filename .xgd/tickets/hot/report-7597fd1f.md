---
uid: report-7597fd1f
id: REPORT-7228
type: report
title: 'Report: fix_plan for STORY-103'
created_by: xgd
created_at: '2026-11-01T02:53:40.045029+00:00'
updated_at: '2026-11-01T02:59:17.327713+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: STORY-103
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - STORY-103 — a conversation stays whole across a live turn test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live
    - the conversation is stored with the workspace test_UAT_AC1057_losing_the_host_mid_turn_costs_that_turn_and_not_the_conversation
    dependency_tests:
    - test_UAT_AC1404_
    - test_UAT_AC1405_
    - test_UAT_AC1408_
    - test_UAT_AC1409_
    - test_UAT_FC_BUG-46_
    - test_UAT_FC_BUG-38_
    hypothesis: storedTranscript in tools/generate/src/cli/ai/host-core.ts:788 computes
      live as deps.lib.closedPrefix(records).length !== records.length, but closedPrefix
      returns a number, so .length is undefined and live is always true (BUG-64);
      upstream manager.transcript() already returns the correct live.
    instructions: 'test_UAT_AC2088 is correct and the code is wrong. In tools/generate/src/cli/ai/host-core.ts,
      storedTranscript (lines 766-790) derives live from a second read of the junction
      log: deps.lib.closedPrefix(records).length !== records.length. closedPrefix
      returns a COUNT, not an array; see the library''s components/ai/js/src/manager.js:963-983,
      where transcript() itself returns live: closedPrefix(records) < records.length.
      So .length is undefined, and live is true for every session with records. This
      is why the reopen after a completed turn reports live:true and the reattach
      from that cursor hangs. Fix it the way the reference state does: take live from
      the result of manager.transcript(sessionId) (widen the local read type to include
      live and return live: read.live === true), and drop the second logFor/readFrom
      read and the closedPrefix comparison. Do not reinterpret the trailing-record
      theory from iteration 1; it was wrong. Do not change test_UAT_AC2088 or AC-2088.
      Keep test_UAT_AC1057 (fixed last iteration) and the dependency tests green,
      especially the mid-turn half of AC2088 and BUG-46''s reload-mid-turn case, which
      need live:true while a turn is genuinely open.'
    test_scope: test_UAT_AC2088_ or test_UAT_AC1057_ or test_UAT_AC1404_ or test_UAT_AC1405_
      or test_UAT_AC1408_ or test_UAT_AC1409_ or test_UAT_FC_BUG-46_ or test_UAT_FC_BUG-38_
    override:
      rule: code_frozen
      rung: 2
      justification: The reference state takes live from upstream manager.transcript()
        (host-core.ts:4794-4832) and documents the closedPrefix .length derivation
        as the BUG-64 defect (host-core.ts:4742-4760); AC-2088 requires live:false
        after the turn ends, and the frozen code always reports true, hanging the
        client.
      files:
      - tools/generate/src/cli/ai/host-core.ts
      tip_evidence:
      - file: tools/generate/src/cli/ai/host-core.ts
        lines: 4742-4760
      - file: tools/generate/src/cli/ai/host-core.ts
        lines: 4794-4832
      trust_boundary: false
    ladder:
      rung1: Intents in scope (STORY-103/AC-2088, BUG-46) require live:false once
        the turn ends but do not address how live is derived, so rung 1 does not decide.
      rung2: 'Decided: reference storedTranscript returns live: read.live === true
        from manager.transcript() (host-core.ts:4794-4832) and names the closedPrefix
        .length comparison as BUG-64 (4742-4760).'
      rung3: test_UAT_AC2088 stands as written; the code changes.
  batches_pending: false
---

# Fix Plan — Iteration 2

## Hypothesis
`storedTranscript` in `tools/generate/src/cli/ai/host-core.ts:788` computes `live` as `deps.lib.closedPrefix(records).length !== records.length`. But `closedPrefix` returns a COUNT, so `.length` is `undefined` and `live` is true for every session that has any records. This is BUG-64, which the reference state fixes by taking `live` from upstream's `manager.transcript()` result.

## Analysis
- Iteration 1 was a mechanical plan with no diagnosis (report-81630d74, empty instructions).
- The builder's assessment (report-3a67792b) found two things:
  - **AC-1057: fixed.** The test and AC were outdated. The in-flight turn now persists in a file junction (`host.ts:216`, REQ-452). The test and AC-1057 were rewritten, and all 13 tests in `tests/reconciliation-assistant-conversation.test.ts` passed. The test is kept in this batch as blast radius so it stays green.
  - **AC-2088: blocked by `code_frozen`** (blocked_by handoff report-58d86d51). After the turn completes, `/api/ai/session` returns `live: true`. A reattach from the returned cursor then yields no frames, so the client hangs. AC-2088 correctly requires `live: false`.
- **The builder's open question is now answered.** They could not read the library. The resolved `@lagrangefoundry/ai` `components/ai/js/src/manager.js:963-983` shows that `transcript()` returns `{session, cursor, live}` with `live: closedPrefix(records) < records.length`. So `closedPrefix` is a number, and `.length` on it is `undefined`. "Some trailing record keeps the prefix short" was not the cause.
- **Reference state at `reconcile-src-BUNDLE-34`:**
  - `tools/generate/src/cli/ai/host-core.ts:4742-4760` documents exactly this defect as BUG-64. That includes the symptom of the panel reattaching to a quiet junction and hanging.
  - Lines 4794-4832 use `live: read.live === true` taken from `manager.transcript(sessionId)`, with no second log read.
- No isolation or contamination pattern: this is a deterministic code defect.

## Spec Changes Made
none. AC-2088 stands; the builder already updated AC-1057 in iteration 1.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_UAT_FC_BUG-46_reload_during_a_turn.workers.test.ts` — weak-observation — The file mentions `live` only twice and never asserts that `live` is false after a turn completes, which is how BUG-64 got past it. Add a post-turn `live === false` check where it naturally fits.
- `tests/test_UAT_FC_BUG-38_chat_session_survives_isolate_churn.workers.test.ts` — weak-observation — Same gap: reopening after a finished turn does not assert `live: false`.

## Batches
- **Batch 0** (single batch): AC-2088, the real failure, plus AC-1057 as blast radius.
  - Both tests share the same file and the same `storedTranscript` path.
  - Dependency tests are the other consumers of `/api/ai/session`'s `live`: the deployed-conversation ACs 1404, 1405, 1408 and 1409, plus the BUG-46 and BUG-38 FC suites.

## Mode overrides (REQ-892)
- Batch 0:
  - **Rule:** `code_frozen`.
  - **Files:** `tools/generate/src/cli/ai/host-core.ts`.
  - **Rung:** 2.
  - **Justification:** The reference state takes `live` from upstream `manager.transcript()` (`host-core.ts:4794-4832`) and documents the closedPrefix `.length` derivation as the BUG-64 defect (`host-core.ts:4742-4760`). AC-2088 requires `live: false` after the turn ends, and the frozen code always reports `true`, which hangs the client.
  - **Trust boundary:** false.

## Resolution ladder (REQ-938)
- **Batch 0:**
  - **Rung 1 did not decide.** The intents in scope (STORY-103 / AC-2088, BUG-46) require a reopened conversation to report `live: false` once the turn has ended, but no later intent in scope addresses how `live` is derived.
  - **Rung 2 decided.** The reference `storedTranscript` returns `live: read.live === true` from `manager.transcript()`, and its doc comment names the closedPrefix `.length` comparison as BUG-64.
  - **Rung 3: the test stands.** test_UAT_AC2088 is correct as written and the code changes.