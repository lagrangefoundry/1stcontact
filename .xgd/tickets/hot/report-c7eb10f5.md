---
uid: report-c7eb10f5
id: REPORT-11309
type: report
title: 'Report: fix_plan for story-4cabde9a'
created_by: xgd
created_at: '2026-11-08T06:19:34.294027+00:00'
updated_at: '2026-11-08T06:19:34.294027+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-4cabde9a
  fix_iteration: 3
  items:
  - index: 0
    tests:
    - story-4cabde9a — describer sessions on the AI host (REQ-207) test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session
    - story-4cabde9a — describer sessions on the AI host (REQ-207) test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description
    - story-4cabde9a — what the system understands a file to be (digest era) test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else
    - story-4cabde9a — what the system understands a file to be test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at
    - story-4cabde9a — what the system understands a file to be test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description
    - story-4cabde9a — what the system understands a file to be test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else
    - AC-1693 (orphaned acceptance criterion)
    - AC-1697 (orphaned acceptance criterion)
    - AC-1698 (orphaned acceptance criterion)
    dependency_tests:
    - test_UAT_FC_REQ_207_
    - test_UAT_FC_REQ_173_
    - test_UAT_FC_REQ-122_
    - test_UAT_FC_REQ-146_the_walk_reaches_the_workers_real_runtime_modules
    - test_UAT_FC_REQ-146_type_only_imports_are_classified_correctly
    - test_UAT_FC_REQ-146_a_planted_filesystem_import_is_caught
    - test_UAT_FC_REQ-146_comment_stripping_keeps_the_code
    - test_UAT_FC_REQ-146_no_filesystem_module_can_reach_the_worker
    - test_UAT_FC_REQ-146_no_runtime_module_resolution_survives_on_the_worker_path
    - test_UAT_FC_REQ-146_the_ai_library_is_reached_as_a_bundled_static_import
    - test_UAT_FC_REQ-146_the_generated_shim_is_not_committed
    - test_UAT_FC_REQ-146_a_secret_is_scrubbed_from_whatever_the_worker_says
    - test_UAT_FC_REQ-146_redaction_is_inert_when_there_is_nothing_to_protect
    - test_UAT_AC1057_
    - test_UAT_AC1404_
    - test_UAT_AC1405_
    - test_UAT_AC1408_
    - test_UAT_AC1409_
    - test_UAT_AC1792_
    - test_UAT_AC1793_
    - test_UAT_AC1794_
    - test_UAT_AC1688_
    - test_UAT_AC1689_
    - test_UAT_AC1691_
    - test_UAT_AC1692_
    - test_UAT_AC1695_
    - test_UAT_AC1696_
    - test_UAT_AC1699_
    hypothesis: 'All story failures are fixed at HEAD (storeFor scope fix, ai.ts:195
      registerBackend capabilities, systemText export); the only residual failure
      is the out-of-scope REQ-146 router-scrub guard, whose regex misreads the pre-existing
      `error: string` type annotation at router.ts:1144 (fc7ae70124, already on main)
      and which was wrongly included in the iteration-2 dependency set.'
    instructions: 'Verify only, and make no edits. The 11 listed tests and the 3 orphaned
      ACs already pass at HEAD 7cba7c6cf5 (batch_quality_check REPORT-11307: 102 of
      103 passed). The fixes are the storeFor { businessId } scope in the three reconciliation-material-description*.workers.test.ts
      files, lib.ClaudeAPIBackend.capabilities at apps/control-app/src/ai.ts:195,
      and the systemText export at tests/support/scripted-model-client.ts:80. Keep
      all three. Run tests and dependency_tests and confirm they are green. test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed
      has been removed from this batch on purpose. It fails on main because its regex
      matches the type annotation `error: string` at router.ts:1144. That line is
      in no commit of this bundle, and the guard belongs to REQ-146, which is not
      in this story''s scope. Do not edit that test, router.ts, or any other file
      to make it pass. If a listed test does fail, report the exact assertion and
      file:line, and do not widen scope.'
    ladder:
      rung1: 'Decided here: the intents in scope (REQ-207 and the rest of BUNDLE-40)
        require separate toolless describer sessions (AC2097, AC2378), which HEAD
        satisfies; no in-scope intent touches router error scrubbing, so the REQ-146
        guard is not this story''s evidence.'
      rung2: 'Not needed; reconcile-src-BUNDLE-40:apps/control-app/src/ai.ts:294-299
        matches the capabilities fix now at HEAD, and the reference router has no
        `error: string` parameter.'
      rung3: This story's tests stand unchanged and pass; no code change is demanded.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1: the only test that needed a wider grant (test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed)
        is owned by REQ-146, which is out of scope. It fails because of a false-positive
        regex on router.ts:1144 from fc7ae70124, which is already on main, and this
        story''s work did not cause it. It is dropped from the validation set, where
        iteration 2 put it by mistake. The code_frozen rule stands and the batch edits
        no files.'
      files: []
    test_scope: test_UAT_AC2097_ or test_UAT_AC2378_ or test_UAT_AC1690_ or test_UAT_AC1693_
      or test_UAT_AC1694_ or test_UAT_AC1697_ or test_UAT_AC1698_ or test_UAT_FC_REQ_207_
      or test_UAT_FC_REQ_173_ or test_UAT_FC_REQ-122_ or test_UAT_FC_REQ-146_the_walk_reaches_the_workers_real_runtime_modules
      or test_UAT_FC_REQ-146_type_only_imports_are_classified_correctly or test_UAT_FC_REQ-146_a_planted_filesystem_import_is_caught
      or test_UAT_FC_REQ-146_comment_stripping_keeps_the_code or test_UAT_FC_REQ-146_no_filesystem_module_can_reach_the_worker
      or test_UAT_FC_REQ-146_no_runtime_module_resolution_survives_on_the_worker_path
      or test_UAT_FC_REQ-146_the_ai_library_is_reached_as_a_bundled_static_import
      or test_UAT_FC_REQ-146_the_generated_shim_is_not_committed or test_UAT_FC_REQ-146_a_secret_is_scrubbed_from_whatever_the_worker_says
      or test_UAT_FC_REQ-146_redaction_is_inert_when_there_is_nothing_to_protect or
      test_UAT_AC1057_ or test_UAT_AC1404_ or test_UAT_AC1405_ or test_UAT_AC1408_
      or test_UAT_AC1409_ or test_UAT_AC1792_ or test_UAT_AC1793_ or test_UAT_AC1794_
      or test_UAT_AC1688_ or test_UAT_AC1689_ or test_UAT_AC1691_ or test_UAT_AC1692_
      or test_UAT_AC1695_ or test_UAT_AC1696_ or test_UAT_AC1699_
---

# Fix Plan — Iteration 3

## Hypothesis
Every failure in this story is already fixed at HEAD. The fixes are the test `storeFor` scope fix from iteration 1, the `ai.ts` `describerSession()` capabilities fix from iteration 2, and the `systemText` export in `tests/support/scripted-model-client.ts`. What is still failing is one dependency-only test, `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed`. The iteration-2 plan added it to the validation set by mistake. It fails because its regex misreads the type annotation `error: string` at `router.ts:1144`. That line is already on `main`, and the failure has nothing to do with this story.

## Analysis
- **The failure list in this prompt is stale.** It comes from quality report report-93afb665 at commit dc48df09, which ran before iterations 1 and 2. Later results:
  - The latest batch_quality_check (REPORT-11307, 06:13) ran this batch's full scope: 102 of 103 passed. That includes AC1690, AC1693, AC1694, AC1697, AC1698, AC2097 (both files) and AC2378.
  - The only failure was `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed`.
  - The three orphaned-AC entries (AC-1693, AC-1697, AC-1698) were orphaned only because their tests were failing. They now have passing tests.
- **Verified at HEAD (7cba7c6cf5):**
  - `apps/control-app/src/ai.ts:195` calls `lib.registerBackend(name, () => backend, lib.ClaudeAPIBackend.capabilities)`.
  - `tests/support/scripted-model-client.ts:80` exports `systemText`.
  - I ran `vitest --config vitest.node.config.mts` on the FC_REQ-207 and FC_REQ-146 files: 18 passed, 1 failed. The one failure is the router-scrub test: `unscrubbed error value: string`.
  - The workers-pool suites cannot run in this planner's sandbox (it cannot bind a local port). For those I rely on REPORT-11307.
- **The REQ-146 failure is outside this story, and it was already there.**
  - `git blame` puts `router.ts:1144`, `const refuseNonOwner = (event: string, refused: Scope, error: string)`, at fc7ae70124 (2026-11-01). That commit is an ancestor of `main` and is not in this bundle.
  - None of this story's batches edited `router.ts`.
  - The test never touches `ai.ts`. It reads `router.ts` as text, and its regex `/error:\s*([A-Za-z_.$][\w.$]*)/` matches the type keyword `string`.
  - At `reconcile-src-BUNDLE-40` the router has no such parameter, so the test passes there.
  - It is owned by REQ-146 (with REQ-309 in the reference version). Neither is an intent in this bundle's scope.
  - I put it in the dependency set in iteration 2 by matching the whole `test_UAT_FC_REQ-146_` prefix because the file covers the Worker/AI boundary. Only the import-boundary tests in that file are real consumers of `ai.ts`.
- **Why the last batch hit a dead end.** The builder tried to make this out-of-scope test pass by editing it. The `code_frozen` override conformance gate correctly rejected that edit as outside the grant, which named only `ai.ts`. Then the builder reverted, the test failed again, and the loop repeated (report-625f7bf5). Widening the grant to that test file, as proposed, would let this story change a REQ-146 guard to fix a defect this story did not cause. That is the wrong place for the fix.
- **No contamination or flakiness.** The failure is deterministic and has the same message in the isolated and batch runs.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts::test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed` — weak-observation (false positive) — the `error:` regex also matches TypeScript type annotations (`error: string`). It fails on `main` today for a reason that is not a leak. The REQ-146/REQ-309 owner should match only object-literal `error:` values, or exclude type keywords. The `reconcile-src-BUNDLE-40` version of this test already admits literal constants, and it is the natural place to do that.
- `tests/reconciliation-material-description*.workers.test.ts` `storeFor` — infra-reuse-gap — the same wrapper is copied in three files, which is why one `ticketStoreFor` signature change broke all three (carried over from iteration 2).

## Batches
One batch, verify-only: the story's 11 failing tests and 3 orphaned ACs, which pass at HEAD. Its dependency set is the real `ai.ts` consumers:
- FC_REQ-207, FC_REQ-173 and FC_REQ-122;
- the FC_REQ-146 import and scrub tests, named one by one so the router-scrub guard is left out;
- the assistant-conversation ACs and the digest-era sibling ACs.

The builder should confirm everything is green and make no edits.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 1.**
  - Rung 1: the intents in scope (REQ-207, REQ-205, REQ-206, REQ-182, BUG-65 and the rest of BUNDLE-40) require images and documents to be described in their own toolless sessions (AC2097, AC2378), and that requirement is met. No intent in scope says anything about router error scrubbing, and REQ-146 is out of scope, so its router guard is not this story's evidence.
  - Rung 2 was not needed. For the record, `reconcile-src-BUNDLE-40:apps/control-app/src/ai.ts:294-299` matches the fix now at HEAD, and the reference router has no `error: string` parameter.
  - Rung 3: this story's tests stand and pass unchanged.

## Ruling on the blocked_by (code_frozen, report-625f7bf5): declined
- The request was to widen the `code_frozen` grant to `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts`. It is declined at rung 1.
- The only test that needed it is out of scope. It comes from a REQ-146 guard defect that has been on `main` since fc7ae70124, and nothing in this story's work touched or caused it.
- It is removed from the validation set (it was in the `dependency_tests` by my iteration-2 mistake). The rule stands, and this batch edits no files.
- That guard's false positive should be fixed in its own REQ-146 work, not in this reconcile story.
