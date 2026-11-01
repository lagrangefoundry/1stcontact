---
uid: report-b1c1e83d
id: REPORT-7249
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T03:34:48.410650+00:00'
updated_at: '2026-11-01T03:34:48.410650+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-141
  parent_report_uid: report-fddeb967
  batch_index: '0'
---

All four batch failures now pass: AC2097, AC1688, AC1689 and AC1699. One test in the wider scope still fails, `test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else`. I left it alone because it isn't on this batch's list.

**The fix:** `sessionTextDescriber` was building its `Role` with `system:` and `source:` keys, and `Role` silently ignores both. It only accepts system content as `priming` entries, so the describer was sending the model an empty system prompt. In `apps/control-app/src/ai.ts`, the only file the exception allows, I replaced those keys with a single entry: `priming: [new lib.Entry({ name: 'digest-system', text: DOCUMENT_DIGEST_SYSTEM })]`. I checked that the library exports `Entry` (via `core.js`). I also corrected the doc comment that said "No corpus and no priming". I did not port the later REQ-207 consolidation or change how the backend is registered. No tests or tickets were edited, and the earlier deletion of the stale AC1688/1689/1699 copies is still in place.

**Test run** (vitest, scoped to the batch files and the `test_UAT_FC_REQ-173_*` files): 47 passed, 1 failed.

**The remaining failure** expects `client.seen[0].system` to be a plain string and calls `toContain(DOCUMENT_DIGEST_SYSTEM)` on it. Now that priming works, the backend sends system content as an array of text blocks. The batch's own AC2097 test flattens that array first (`systemText()`) and confirms the system content is exactly `DOCUMENT_DIGEST_SYSTEM`. This test isn't a regression from my change: before it, the system content was empty and its assertion couldn't have passed either. The test is stale, not the code. The fix is to flatten the blocks the way AC2097 does, or to let reconcile rename or delete it as part of its normal FC-test cleanup.

**Gates:** eslint couldn't run, because it isn't installed locally and the sandbox blocked downloading it from registry.npmjs.org. `tsc --noEmit -p apps/control-app` printed nothing for `ai.ts`, though I only filtered its output for that file.

```yaml
## Assessment
status: fixed
batch_failures_resolved:
  - test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record
  - test_UAT_AC1688_a_document_that_carries_text_yields_a_digest_body_its_declared_title_and_its_full_text
  - test_UAT_AC1689_a_text_shaped_file_becomes_a_digest_body_with_its_decoded_contents_kept_in_full
  - test_UAT_AC1699_a_body_is_a_bounded_digest_a_title_one_collapsed_line_and_full_text_bounded_separately
files_changed:
  - apps/control-app/src/ai.ts  # under authorised code_frozen exception
out_of_batch_failure:
  test: test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else
  file: tests/test_UAT_FC_REQ-173_describer_session.test.ts:64
  cause: "asserts string toContain on system content that the backend sends as an array of text blocks; failed before this change too (system content was empty)"
  action: "not touched (rule:batch_scope); flatten system blocks as AC2097's systemText() does, or let reconcile rename/delete it"
gates:
  lint: "not run: eslint not installed locally, and the sandbox blocked downloading it"
  typecheck: "tsc printed nothing for ai.ts (output filtered to that file)"
```
