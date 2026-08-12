---
uid: comment-e95b93d2
id: COMMENT-958
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-12T21:44:21.066577+00:00'
updated_at: '2026-08-12T21:44:21.066577+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-65ca9439
  kind: note
---

All four test names satisfy the enforced pattern (the `BAD .` line is my extraction regex catching a `it('` substring inside prose, not a test).

## UATs generated for story story-37a3921b (plan item 2 of 4)

**Test file created:** `tests/reconciliation-copy-edit-image-framing.test.ts`

**Tests written: 4 · passed: 4 · failed: 0**

| Test | AC |
|---|---|
| `test_UAT_AC1132_a_picture_declaring_no_framing_answers_with_what_a_browser_paints` | AC-1132 |
| `test_UAT_AC1131_the_shape_list_carries_the_shape_the_picture_already_holds` | AC-1131 |
| `test_UAT_AC1130_colour_is_adjusted_in_percentages_over_the_fractions_the_definition_holds` | AC-1130 |
| `test_UAT_AC1129_panning_writes_a_typed_percentage_pair_and_centre_removes_it` | AC-1129 |

**Scope.** These are the four ACs on this story with no UAT anywhere in the suite — the ones the story cycle created for REQ-136. The story's other 29 ACs already carry `test_UAT_AC{N}_*` functions in the five sibling `reconciliation-copy-edit-*.test.ts` files, so writing more would have duplicated the AC→test mapping rather than closing a gap.

**Verification done.** Each test drives the real `1c` entry point (`copy get` / `copy set` / `status`, argv in, envelope + exit code out) against a temp workspace, and reads real observables — the draft page bytes on disk, the rendered `index.html`, and `1c status`'s modified-file list. Nothing internal is stubbed.

I proved regression protection with four runtime mutations, each reverted via git:

- removing the empty-bag prune → all 4 fail (the shared identity/no-trace rule)
- removing the shape-list union → only AC-1131 fails
- removing the percentage→fraction projection → AC-1130 and AC-1132 fail
- writing a half-stated pan pair → only AC-1129 fails

The targeting confirms each test is live and attributed to the right criterion. `packages/site-schema/src/l1/edit.ts` is back to its committed state; `git status` shows the new test file as the only change.

**Two things worth flagging for the review step:**

1. **AC-1121 and AC-1122 have a content gap, not a mapping gap.** The story cycle widened both from typography-specific to "every bounded control" / "how a picture is framed, shaped and colour-adjusted", and their verification now says *"Repeat both halves on an image"*. Their existing tests in `reconciliation-copy-edit-typography.test.ts` still cover the copy half only. I could not close this without modifying an existing test file (prohibited here) or emitting a second function bearing those AC numbers (which would break the 1:1 mapping). The underlying behaviour is exercised by my tests — AC-1132 asserts the byte-identical no-op on an image and AC-1130/1131 assert write-in-place and container pruning — but the image half is not attributed to AC-1121/1122. The review prompt can modify those files.

2. **Full-suite state:** 1530 passed, 13 failed, 4 skipped. The 13 failures are in `reconciliation-assistant-conversation.test.ts`, `test_UAT_FC_REQ-122_chat_host.test.ts` and `test_UAT_FC_REQ-127_session_binding.test.ts` — all chat/assistant-session work, unrelated to this story. I confirmed they are pre-existing by deleting my file and re-running those three files: identical 13 failures.

```
test_files_created:
  - "tests/reconciliation-copy-edit-image-framing.test.ts"
```
