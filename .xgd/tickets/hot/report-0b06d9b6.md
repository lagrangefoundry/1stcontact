---
uid: report-0b06d9b6
id: REPORT-11310
type: report
title: 'Report: fix_plan for story-4cabde9a'
created_by: xgd
created_at: '2026-11-08T06:26:49.696706+00:00'
updated_at: '2026-11-08T06:26:49.696706+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-4cabde9a
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
    hypothesis: All story failures are already fixed at HEAD (storeFor { businessId
      } scope in the story test files, describer backend registered with the Claude
      API backend capabilities, systemText export in the scripted model client); the
      only residual failure is the out-of-scope REQ-146 router-scrub guard, a pre-existing
      false positive on main that iteration 2 wrongly pulled into the dependency set.
    instructions: 'Verify only. The 11 listed story tests and the 3 orphaned ACs already
      pass at HEAD (batch_quality_check REPORT-11307: 102 of 103 green; no product
      or test code has changed since). Run tests and dependency_tests and confirm
      they are green. Make no production edits: the describer registration fix already
      at HEAD is correct and must be kept as is. test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed
      is deliberately excluded: it belongs to REQ-146, which is not in this bundle,
      and it fails on main because its error: regex matches a TypeScript type annotation
      that predates this bundle. Do not edit that test or the router to make it pass.
      Only if a listed story test regresses may you touch the three tests/reconciliation-material-description*.workers.test.ts
      files, and you must report the exact assertion and file:line.'
    ladder:
      rung1: 'Decided here: the intents in scope (REQ-207 and the rest of BUNDLE-40)
        require documents and images to be described in their own toolless, unprimed
        sessions (AC2097, AC2378), which HEAD satisfies; no in-scope intent covers
        router error scrubbing, so the REQ-146 guard is not this story''s evidence.'
      rung2: 'Not needed; the reference''s describer registration matches HEAD, and
        the reference router has no `error: string` parameter, so the guard passes
        there.'
      rung3: The story's tests stand unchanged and pass; no code change is demanded.
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1: the only test needing a wider grant (test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed)
        is owned by REQ-146, which is out of scope, and its failure is a pre-existing
        regex false positive already on main, not caused by this story. It is dropped
        from the validation set; code_frozen stands and the batch touches no production
        file, only (if a story test regresses) the story''s own test files.'
      files:
      - tests/reconciliation-material-description.workers.test.ts
      - tests/reconciliation-material-description-digest.workers.test.ts
      - tests/reconciliation-material-description-session.workers.test.ts
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
  fix_iteration: 3
---

# Fix Plan — Iteration 3 (resubmission after validator refusal)

## Hypothesis
Every failure in this story is already fixed at HEAD. The fixes are the `storeFor` `{ businessId }` scope in the story's test files, the describer backend registration fix (the backend is now registered with the Claude API backend's capabilities), and the `systemText` export in the scripted model client. The one remaining failure, `test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed`, belongs to REQ-146, which is not in this bundle. The iteration-2 plan pulled it into the validation set by mistake, and it is left out here.

## Analysis
- **Why this is a resubmission.** The validator refused REPORT-11309 (report-c7eb10f5) for two mechanical reasons. Its diagnosis still holds:
  1. The `declined` ruling had `files: []`. The validator wants the files the batch may touch listed.
  2. The instructions named a frozen production path. In reconcile mode `code_frozen` freezes production files, and the validator reads a named path as an intended edit.

  This plan fixes both. `files` names only the story's own test files. No production path appears in the instructions, the hypothesis or the ladder.
- **The failure list in the prompt is stale.** It comes from report-93afb665 at dc48df09, which ran before iterations 1 and 2. The latest batch_quality_check (REPORT-11307) ran the full batch scope and passed 102 of 103. That includes every story test: AC1690, AC1693, AC1694, AC1697, AC1698, AC2097 (both describe blocks) and AC2378, in all three `tests/reconciliation-material-description*.workers.test.ts` files.
- **The orphaned ACs.** AC-1693, AC-1697 and AC-1698 were reported orphaned only because their linked tests were failing. All three now have passing tests.
- **Nothing has changed since.** `git diff 7cba7c6cf5 HEAD -- apps tests packages` is empty. The only commits since are workflow and ticket records.
- **The REQ-146 router-scrub test is out of scope and fails on main already.**
  - It reads the router source as text. Its `error:` regex matches the TypeScript type annotation `error: string` on a helper that came in with fc7ae70124. That commit is already an ancestor of `main` and is not in this bundle.
  - The test does not fail at `reconcile-src-BUNDLE-40`.
  - REQ-146 is not an intent in scope, so this test is not this story's evidence.
- **What the builder's blocked_by asked for.** In report-625f7bf5 the builder asked to widen the `code_frozen` grant so it could edit `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts`. That would let this story change another intent's guard to clear a defect this story did not cause. Declined.
- **No contamination or flakiness.** The failure is deterministic, with the same message in the isolated and batch runs.

## Spec Changes Made
None.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts::test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed` — weak-observation (false positive) — the `error:` regex also matches type annotations (`error: string`), so it fails on `main` without any leak. The REQ-146/REQ-309 owner should match only object-literal `error:` values.
- `tests/reconciliation-material-description*.workers.test.ts` `storeFor` — infra-reuse-gap — the same wrapper is copied into three files, so one `ticketStoreFor` signature change broke all three. Move it to `tests/support`.

## Batches
**Batch 0, verify only.** It covers the story's 11 listed tests and the 3 orphaned ACs. Its dependency set is the real consumers of the describer path:
- FC_REQ-207, FC_REQ-173 and FC_REQ-122;
- the FC_REQ-146 import and scrub tests, named one by one so the router-scrub guard is left out;
- the assistant-conversation ACs and the digest-era sibling ACs.

The builder confirms everything is green. Only if a listed story test regresses may it touch that story's own test files, and it must report the regression.

## Ruling on the blocked_by (code_frozen, report-625f7bf5): declined
- **Decided at:** rung 1.
- **Why:** the only test that needed the wider grant belongs to REQ-146, which is out of scope, and its failure predates this bundle.
- **Effect:** it is dropped from the validation set. `code_frozen` stands. The batch edits no production file, and its `files` lists only the three story test files.

## Resolution ladder (REQ-938)
**Batch 0, decided at rung 1.**
- **Rung 1:** the intents in scope (REQ-207 and the rest of BUNDLE-40) require that documents and images are each described in their own session, with no tools and no priming (AC2097, AC2378). HEAD satisfies that. No intent in scope covers router error scrubbing.
- **Rung 2:** not needed. The describer registration at the reference matches HEAD, and the reference router has no `error: string` parameter.
- **Rung 3:** the story's tests stand unchanged and pass.
