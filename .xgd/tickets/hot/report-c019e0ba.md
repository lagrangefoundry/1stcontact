---
uid: report-c019e0ba
id: REPORT-7540
type: report
title: 'Report: fix_plan for story-a58a0974'
created_by: xgd
created_at: '2026-11-01T09:41:51.953609+00:00'
updated_at: '2026-11-01T09:48:03.820445+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-a58a0974
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart
    - tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1405_a_transcript_is_the_neutral_session_file_byte_for_byte_and_is_portable
    - tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1408_a_credential_survives_neither_an_error_envelope_nor_a_failing_turns_stream
    - tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record
    - tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store
    - tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts::test_UAT_AC1651_the_deployed_assistant_answers_from_a_design_document_names_it_and_ranks_it
    - tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts::test_UAT_AC1652_the_deployed_session_is_primed_with_the_map_and_granted_the_read_set_on_both_axes
    - tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts::test_UAT_AC1653_an_absent_embedding_model_degrades_to_no_knowledge_operations
    - tests/reconciliation-assistant-conversation-ticket-archive.workers.test.ts::test_UAT_AC1792_the_session_file_is_a_transcript_comment_on_one_chat_ticket_with_an_untouched_body
    - tests/reconciliation-assistant-conversation-ticket-archive.workers.test.ts::test_UAT_AC1793_the_losing_fold_is_refused_on_the_compare_and_set_and_the_winner_survives_intact
    - tests/reconciliation-assistant-conversation-ticket-archive.workers.test.ts::test_UAT_AC1794_the_corpus_boundary_is_one_field_on_the_conversations_own_chat_ticket
    - tests/reconciliation-conversations-live-turn.workers.test.ts::test_UAT_AC2088_opening_mid_turn_returns_the_turn_so_far_with_cursor_and_live
    - tests/reconciliation-conversations-live-turn.workers.test.ts::test_UAT_AC2089_a_turn_whose_client_leaves_is_held_open_archived_and_aborted
    - tests/reconciliation-conversations-live-turn.workers.test.ts::test_UAT_AC2091_an_unreadable_transcript_fails_the_open_rather_than_reading_empty
    - tests/reconciliation-conversations-live-turn.workers.test.ts::test_UAT_AC2090_reattach_streams_the_rest_from_the_cursor_and_refuses_a_bad_request
    dependency_tests:
    - tests/reconciliation-assistant-chat-ledger.workers.test.ts::test_UAT_AC2110_record_decision_and_name_engagement_write_only_this_conversations_chat_ticket
    - tests/reconciliation-assistant-chat-ledger.workers.test.ts::test_UAT_AC2111_ledger_guidance_states_settled_one_per_call_rejected_and_rename_once_known
    - tests/reconciliation-assistant-chat-ledger.workers.test.ts::test_UAT_AC1792_folding_turns_never_writes_the_body_which_keeps_the_ledger_entry_exactly
    - tests/reconciliation-assistant-conversation-continuity.workers.test.ts::test_UAT_AC1456_a_turn_runs_on_a_process_that_never_opened_the_session
    - tests/reconciliation-assistant-conversation-continuity.workers.test.ts::test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent
    - tests/reconciliation-assistant-conversation-continuity.workers.test.ts::test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion
    hypothesis: 'Four workers test files call the pre-REQ-168 signatures: ticketStoreFor(env)
      without a Scope (throws on scope.businessId) and route(request, env, deps) with
      deps in the slot that is now scope; the REQ-168 cherry-pick 4dc8c492ad changed
      both after iteration 2 went green.'
    instructions: 'Production code is right and matches the reference state; the evidence
      broke because the test helpers drifted from the REQ-168 scope signatures. In
      each of the four files, follow the passing tests/reconciliation-assistant-chat-ledger.workers.test.ts
      (lines 40, 57-67, 91): declare a Scope of { businessId: TENANT } and pass it
      as the second argument of every ticketStoreFor call and as the third argument
      of every route call, moving deps to the fourth. Call sites: deployed.workers.test.ts
      lines 246-247 (ticketStore(tenant) must build { businessId: tenant } so the
      AC1409 neighbour handle stays a different business) and 532-546 (AC1408 path
      one: scope third, { store } fourth); deployed-knowledge.workers.test.ts lines
      336-345; ticket-archive.workers.test.ts lines 201-210 and 241; live-turn.workers.test.ts
      lines 128-130. Tests that go through worker.fetch need no change, because under
      ACCESS_DEV_OPEN resolveScope answers env.TENANT_ID, so the test TENANT is still
      the request business and must equal the Scope the helpers build. Change only
      call plumbing; every assertion stays as written. If a test still fails after
      the plumbing is fixed, read its real failure text (these are workers-pool tests,
      run them via the workers vitest project) and fix within the test files; production
      is frozen and the reference state confirms it.'
    test_scope: test_UAT_AC1057_ or test_UAT_AC1405_ or test_UAT_AC1408_ or test_UAT_AC1409_
      or test_UAT_AC1404_ or test_UAT_AC1651_ or test_UAT_AC1652_ or test_UAT_AC1653_
      or test_UAT_AC1792_ or test_UAT_AC1793_ or test_UAT_AC1794_ or test_UAT_AC2088_
      or test_UAT_AC2089_ or test_UAT_AC2090_ or test_UAT_AC2091_ or test_UAT_AC2110_
      or test_UAT_AC2111_ or test_UAT_AC1456_ or test_UAT_AC1320_ or test_UAT_AC1055_
    ladder:
      rung1: REQ-168 (in scope, later than the owning intents) moved tenant selection
        from env.TENANT_ID to a resolved Scope; it changes how a test addresses the
        store, not what AC-1057/1405/1408/1409/1651-1653/1792-1794/2088/2089/2091
        claim.
      rung2: 'Decided here: at reconcile-src-BUNDLE-35, apps/control-app/src/tickets.ts
        lines 1045-1049 take ticketStoreFor(env, scope: Scope, opts) and apps/control-app/src/router.ts
        lines 3082-3088 take route(request, env, scope, deps, ctx), so the test helpers
        must pass a Scope.'
      rung3: The tests assertions stand unchanged; only their call plumbing changes
        and no production code changes.
  batches_pending: false
---

# Fix Plan — Iteration 3

## Hypothesis
Four workers test files still call the pre-REQ-168 signatures. They call `ticketStoreFor(env)` with no `Scope`, which throws on `scope.businessId`. They call `route(request, env, deps)` with deps in the slot that now holds `scope`. The REQ-168 cherry-pick (`4dc8c492ad`) changed both functions after iteration 2's green run.

## Analysis
- **Prior history**
  - REPORT-6826 (iteration 1) and REPORT-6833 (iteration 2) both diagnosed `nodeDeps()` passing `logDir` in `host.ts`.
  - The builder (REPORT-6835, batch 0 of REPORT-6833) applied that fix, plus the AC2057 `caretaker` stragglers. All 21 failures went green, including AC1651–1653 and AC1792–1794 in the dependency set.
  - That hypothesis is resolved. `host.ts:222` now has `junctions: lib.fileJunctions(...)`. It is not being retried here.
  - REPORT-7539 is the `fix_plan_missing` marker from this iteration's first attempt, which could not file because the session's permission mode refused it.
- **What changed since the green run**
  - `git log --ancestry-path ad89f57959..HEAD` shows the REQ-168 merge `4dc8c492ad` (scope) landing afterwards, followed by REQ-169/178/179/180/184.
  - On this branch:
    - `apps/control-app/src/tickets.ts:463` is now `ticketStoreFor(env: TicketStoreEnv, scope: Scope)`, and it takes the tenant from `scope.businessId`.
    - `apps/control-app/src/router.ts:815` is now `route(request, env, scope: Scope | null, deps = {}, ctx?)`.
    - Under `ACCESS_DEV_OPEN`, `resolveScope` (`scope.ts:249-257`) answers `{ businessId: env.TENANT_ID }`. Through `worker.fetch`, a test's `TENANT_ID` therefore remains the business the request operates on.
- **Old-signature call sites, one per failing file**
  - `tests/reconciliation-assistant-conversation-deployed.workers.test.ts`
    - `:246-247`: `ticketStoreFor({DB, BLOBS, TENANT_ID: tenant})`, used by AC1057, AC1405 and AC1409, including the neighbour-tenant handle in AC1409.
    - `:532-546`: `route(req, env, { store })`, where AC1408 path one passes deps as the scope.
    - AC1404 passes because it never builds a ticket store directly.
  - `tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts:336-345`: `route(req, workerEnv(), deps)` (AC1651, AC1652, AC1653).
  - `tests/reconciliation-assistant-conversation-ticket-archive.workers.test.ts`
    - `:201-210`: `route(req, workerEnv(), deps)`.
    - `:241`: `ticketStoreFor(workerEnv())`.
    - These serve AC1792 (session-file test), AC1793 and AC1794.
  - `tests/reconciliation-conversations-live-turn.workers.test.ts:128-130`: `ticketStoreFor(workerEnv())` (AC2088, AC2089, AC2091). AC2090 passes because it never reads the store.
- **Passing model to follow**: `tests/reconciliation-assistant-chat-ledger.workers.test.ts`, regenerated in `414e106634`, already uses the new form:
  - `const SCOPE: Scope = { businessId: TENANT }` (line 40)
  - `ticketStoreFor(workerEnv(), SCOPE)` (line 91)
  - `route(req, workerEnv(), SCOPE, deps())` (lines 57-67)
- **Reference state agrees.** It has the same Scope-taking signatures:
  - `git show reconcile-src-BUNDLE-35:apps/control-app/src/tickets.ts` lines 1045-1049: `ticketStoreFor(env, scope: Scope, opts = {})`.
  - `router.ts` lines 3082-3088: `route(request, env, scope: Scope | null, deps = {}, ctx?)`.
  - Production code is right, and the tests drifted.
- **Orphan ACs**: the 7 orphan ACs (1408, 1409, 1651, 1652, 1653, 1793, 1794) are orphaned only because their sole tests fail. They clear when the tests pass. No AC change is needed.
- **Isolation**: not a cross-suite problem. The failure is a deterministic TypeError or mis-scoped request in each test's own helpers.
- **Not reproduced locally**: the planner sandbox denies local port binding (`listen EPERM 127.0.0.1` from miniflare). The quality report gave no failure text (JUnit XML missing). The diagnosis rests on the signature mismatch, read statically, together with the pass/fail split. In every file, only tests that reach an old-signature helper fail.
- **Blocked_by / override**: none. There was no `blocked_by` in history, and no XGD tooling defect (BUG-1067) is involved.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-assistant-conversation-continuity.workers.test.ts::test_UAT_AC1055_the_streaming_origin_refuses_in_channel_ahead_of_the_completion` — weak-observation — line 384 lists the R2 prefix `chat/${TENANT}/`. Since REQ-160, transcripts live in the ticket store, not R2, so an absence assertion there is likely vacuous. Assert against the chat ticket instead.
- `tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1404_a_turn_runs_from_the_deploy_secret_and_its_change_lands_in_the_shared_store` — infra-reuse-gap — this file reimplements `scriptedClient`/`says`/`calls`, which `tests/support/scripted-model-client.ts` already provides and chat-ledger uses. Reuse the shared helper when in the file.

## Batches
- **Batch 0 (single batch)**: all 13 failing tests, plus the 7 orphan ACs they cover. Every failure has the same root cause, the REQ-168 signature drift in each test file's own helpers, and the fix touches only the four test files.
  - Keep-green tests in the same files are included: AC1404 and AC2090.
  - The passing chat-ledger and continuity suites are the dependency set.
  - The fix is test-only. Reconcile mode keeps production code frozen, and the fix requires no production change.

## Resolution ladder (REQ-938)
- **Batch 0**: decided at **rung 2**.
  - **Rung 1**: REQ-168, an intent in scope that is later than the ACs' own intents (REQ-146/158/160/171, STORY-103), moved tenant selection from `env.TENANT_ID` to a resolved `Scope`. It does not change what these ACs claim, only how a test addresses the store.
  - **Rung 2**: the reference state's `tickets.ts:1045-1049` and `router.ts:3082-3088` take a `Scope`, so the tests' helpers must pass one.
  - **Rung 3**: the tests' assertions stand unchanged, and only their call plumbing changes.