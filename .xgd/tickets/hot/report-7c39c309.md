---
uid: report-7c39c309
id: REPORT-11299
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T05:59:08.921800+00:00'
updated_at: '2026-11-08T05:59:08.921800+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-4cabde9a
  parent_report_uid: report-fe34a964
  batch_index: '0'
---

I fixed the image describer by changing one line in `apps/control-app/src/ai.ts`, the one file the exception allows. All 14 failures in this batch now pass, but two FC_REQ-207 tests still fail for a reason that has nothing to do with this fix. The planner's goal included them, so I'm reporting them rather than calling this done.

**What was wrong.** `describerSession()` registered its backend without saying what the backend can do. The AI library's session manager only lets image content through if the backend declared it can see images, so every image was refused with "declares no vision capability". Each uploaded image was then stored as a describer failure.

**The change.** At `apps/control-app/src/ai.ts:189` the registration now passes the adapter class's own capabilities, `lib.registerBackend(name, () => backend, lib.ClaudeAPIBackend.capabilities)`. This is how the library registers its own backends (for example `register_claude.js:17`). The comment above the line explains why the capabilities can't be left out. Both describers go through this one function, there is no image-only special case, and the two describers keep their separate names.

**Test run.** I ran the three `reconciliation-material-description*` suites, every `test_UAT_FC_REQ-173_*` and `test_UAT_FC_REQ-207_*` file, the FC_REQ-146 AI-host suite and the two `reconciliation-assistant-conversation-*` suites: 75 tests, 73 passed, 2 failed.
- The batch failures now pass: AC2097 in both files, AC2378, AC1690, AC1693, AC1694, AC1697 and AC1698.
- The other `ai.ts` consumer suites and all FC_REQ-173 tests pass.
- Two tests in `tests/test_UAT_FC_REQ-207_image_describer_session.test.ts` still fail, at lines 100 and 183: `test_UAT_FC_REQ_207_the_describer_is_primed_with_the_image_prompt_and_nothing_else` and `test_UAT_FC_REQ_207_the_image_and_document_describers_do_not_cross_wire`.

**Why those two fail.** The test file imports `systemText` from `./support/scripted-model-client`, and that shared helper doesn't export it. The import is undefined, so both tests crash with `TypeError: systemText is not a function` before checking anything. This is a broken test setup and would happen with or without my change. The fix is outside what I'm allowed to edit here: the authorised exception covers only `ai.ts`, test edits are forbidden this pass, and the helper is shared by other suites.

```yaml
## Assessment
status: partial
fixed:
  - test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session
  - test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order
  - test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record
  - test_UAT_AC1690_a_document_with_nothing_extractable_is_stored_and_honestly_described
  - test_UAT_AC1693_an_image_past_the_looking_ceiling_is_stored_whole_and_simply_not_looked_at
  - test_UAT_AC1694_content_nothing_here_can_read_is_stored_and_marked_unreadable_by_type
  - test_UAT_AC1697_every_material_records_one_of_six_outcomes_and_who_produced_the_description
  - test_UAT_AC1698_a_describer_that_is_reached_and_fails_costs_findability_and_nothing_else
files_changed:
  - apps/control-app/src/ai.ts  # registerBackend(name, factory, lib.ClaudeAPIBackend.capabilities) + comment
blocked_by:
  rule: batch_scope
  evidence: "npx vitest run on the batch + ai.ts consumer suites: 73 passed, 2 failed. Both failures are in tests/test_UAT_FC_REQ-207_image_describer_session.test.ts (lines 100, 183) with 'TypeError: systemText is not a function'. Line 35 imports systemText from './support/scripted-model-client', but that module exports only ModelRequest, modelSaw, WireEvent, ModelStep, ScriptedClient, scriptedClient, says, StalledStep, stalls, calls, PacedClient, pacedClient. The failure is in the test setup and does not depend on the ai.ts change."
  proposed_change: "In tests/test_UAT_FC_REQ-207_image_describer_session.test.ts, define systemText locally (the same function already in tests/reconciliation-material-description-session.workers.test.ts:40) and drop it from the import. This avoids editing the shared helper. The alternative is to export systemText from tests/support/scripted-model-client.ts. Either is a test-only change and needs its own batch, because this batch's exception covers only apps/control-app/src/ai.ts."
```