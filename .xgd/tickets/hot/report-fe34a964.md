---
uid: report-fe34a964
id: REPORT-11297
type: report
title: 'Report: fix_plan for story-4cabde9a'
created_by: xgd
created_at: '2026-11-08T05:54:51.048354+00:00'
updated_at: '2026-11-08T05:54:51.048354+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-4cabde9a
  fix_iteration: 2
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
    - test_UAT_FC_REQ-146_
    - test_UAT_FC_REQ-122_
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
    hypothesis: apps/control-app/src/ai.ts:189 describerSession() calls lib.registerBackend(name,
      () => backend) without capabilities, so the @lagrangefoundry/ai registry records
      the image describer as having no vision and refuses every image before it is
      sent.
    instructions: 'Iteration 1 already fixed nine of these tests: the storeFor helpers
      in the three reconciliation-material-description*.workers.test.ts files now
      pass { businessId: tenant } to ticketStoreFor. Keep those edits and do not touch
      the tests again. The two remaining failures (REQ-207 AC2097: images.seen is
      empty; AC2378: image status ''failed'') come from a production defect. In apps/control-app/src/ai.ts,
      describerSession() registers its backend with lib.registerBackend(name, () =>
      backend) and declares no capabilities, so the session manager refuses image
      content with ''declares no vision capability''. Register the backend with the
      adapter class''s declared capabilities, lib.ClaudeAPIBackend.capabilities, as
      the third argument, the way the library registers its own backends, and add
      a short comment explaining why the capabilities are not optional. Apply it in
      describerSession() so both describers get it. Do not special-case the image
      path, and keep the distinct per-describer names. No test or AC changes. Done
      means AC2097 (both files), AC2378, every FC_REQ-207 and FC_REQ-173 UAT, and
      the other ai.ts consumer suites in dependency_tests all pass.'
    ladder:
      rung1: REQ-207, in scope, requires each image to be described in its own toolless
        session with the picture actually sent (AC2097, AC2378). No intent in scope
        asks for images to be refused.
      rung2: 'Decided here: reconcile-src-BUNDLE-40:apps/control-app/src/ai.ts:294-299
        registers the describer backend with lib.ClaudeAPIBackend.capabilities (BUG-214
        comment). The working tree''s two-argument call at line 189 is the defect.'
      rung3: Not reached. The tests stand unchanged and the code changes to match
        the reference.
    override:
      rule: code_frozen
      rung: 2
      justification: The reference state declares the backend's capabilities when
        registering it, so image content passes the vision gate. The working tree
        omits them, so every uploaded image is stored with the describer-failed outcome.
        AC2097 and AC2378 correctly demand that an image is sent and described. The
        code is wrong, not the tests.
      files:
      - apps/control-app/src/ai.ts
      tip_evidence:
      - file: apps/control-app/src/ai.ts
        lines: 294-299
      trust_boundary: false
    test_scope: test_UAT_AC2097_ or test_UAT_AC2378_ or test_UAT_AC1690_ or test_UAT_AC1693_
      or test_UAT_AC1694_ or test_UAT_AC1697_ or test_UAT_AC1698_ or test_UAT_FC_REQ_207_
      or test_UAT_FC_REQ_173_ or test_UAT_FC_REQ-146_ or test_UAT_FC_REQ-122_ or test_UAT_AC1057_
      or test_UAT_AC1404_ or test_UAT_AC1405_ or test_UAT_AC1408_ or test_UAT_AC1409_
      or test_UAT_AC1792_ or test_UAT_AC1793_ or test_UAT_AC1794_ or test_UAT_AC1688_
      or test_UAT_AC1689_ or test_UAT_AC1691_ or test_UAT_AC1692_ or test_UAT_AC1695_
      or test_UAT_AC1696_ or test_UAT_AC1699_
---

# Fix Plan — Iteration 2

## Hypothesis
`describerSession()` in `apps/control-app/src/ai.ts:189` registers each describer backend with `lib.registerBackend(name, () => backend)` and passes no capabilities. The session manager admits content against the registry, and a name registered without capabilities has none, so every image is refused with "declares no vision capability". The reference state fixes this (BUG-214) by passing `lib.ClaudeAPIBackend.capabilities`.

## Analysis
- The failure list in this prompt comes from quality report report-93afb665, which ran BEFORE iteration 1. The iteration-1 builder (report-28984530) has since fixed 9 of the 11 failures with test-only changes. The `storeFor` helper in the three reconciliation files now calls `ticketStoreFor(env, { businessId: tenant })`, which matches the current `ticketStoreFor(env, scope)` signature at `tickets.ts:646`. The three files appear as changed since the last iteration, so those edits are in the working tree. The fix covers AC1690, AC1693, AC1694, AC1697 and AC1698 in both files, plus the digest-era AC2097 test. It should also clear the three orphaned-AC entries (AC-1693, AC-1697, AC-1698), whose only cause was that their tests failed.
- Two failures remain, both in `tests/reconciliation-material-description-session.workers.test.ts`:
  - AC2097 (REQ-207 session): `images.seen` is empty, so no image request ever reached the faked client.
  - AC2378: image status is `'failed'` (text-then-image, line 260).
  `tests/test_UAT_FC_REQ-207_image_describer_session.test.ts` shows the shared cause: `BackendError ... 'material_image_describer' backend declares no vision capability`. The builder's diagnosis is correct and it reported `blocked_by: code_frozen`.
- I checked the reference state. `git show reconcile-src-BUNDLE-40:apps/control-app/src/ai.ts`, lines 294-299, has the comment "THE CAPABILITIES ARE NOT OPTIONAL (BUG-214) ... a name registered without capabilities is recorded as having none, and every image is refused at the gate. Declared from the class, as the library registers its own backends." That comment is followed by `lib.registerBackend(name, () => backend, lib.ClaudeAPIBackend.capabilities)`. The working tree (from commit feb32389ac, which is in this bundle) still has the two-argument call at line 189. The reference therefore settles which way the code should go: the backend must be registered with the class's capabilities. It also confirms that the library's `registerBackend` accepts the third argument.
- No isolation or contamination pattern. The cause is deterministic and the same in the isolated FC file and in the suite.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-material-description*.workers.test.ts` storeFor helper — infra-reuse-gap — three files each define their own `storeFor` wrapper around `ticketStoreFor`. The scope-signature change broke all three at once, so a shared test helper would localise the next signature change.
- `test_UAT_FC_REQ_207_the_DescribeImage_seam_did_not_move` — weak-observation — the name suggests it checks only that the seam's shape is unchanged. It could pass while every image is refused, which is exactly what happened here. Pair it with an assertion that a description came back `ok`.

## Batches
One batch: the two remaining failures (AC2097 session test, AC2378), the nine iteration-1 fixes they share files with (kept green), and the FC_REQ-207 and FC_REQ-173 describer UATs. All of them exercise `describerSession()`. The edit is one line in one production file (`ai.ts`), plus no test changes.

## Mode overrides (REQ-892)
- Batch 0, rule `code_frozen`, rung 2, files [`apps/control-app/src/ai.ts`]. The reference state (`ai.ts:294-299`) registers the describer backend with `lib.ClaudeAPIBackend.capabilities` (BUG-214). The working tree omits them, so the library refuses every image before it is sent. AC2097 and AC2378 are correct and the code is wrong. `dependency_tests` covers every other suite that imports `ai.ts`: FC_REQ-173, FC_REQ-146, FC_REQ-122, the assistant-conversation reconciliation ACs, and the digest-era describer tests.

## Resolution ladder (REQ-938)
- Batch 0, decided at rung 2. Rung 1: REQ-207 requires images to be described in their own session, with a picture actually sent (AC2097, AC2378), and no intent in scope asks for images to be refused. Rung 2: `reconcile-src-BUNDLE-40:apps/control-app/src/ai.ts:294-299` declares the capabilities on registration, so the code changes to match. Rung 3 is not reached; the tests stand unchanged.
