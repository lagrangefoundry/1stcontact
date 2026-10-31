---
uid: comment-bb0ead3d
id: COMMENT-5859
type: comment
title: Comment on bug BUG-316
created_by: xgd
created_at: '2026-10-31T17:50:36.920164+00:00'
updated_at: '2026-10-31T17:57:52.975723+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d9778adf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "736e1fce-588c-4841-b273-d27c16c3186f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ca6c88ac-24ca-41f8-b260-b7715616e90d-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T17:49:26.874739+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="ca6c88ac-24ca-41f8-b260-b7715616e90d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T17:57:49.599430+00:00" -->
#### Claude
Scope is clear from the ticket (and AC-2067 is already rewritten), so no questions — starting the fix now: setting status and cutting the branch.

Now find the existing screenshot-on-the-wire test to model the UAT on.

Found the reference implementation; now locating a Node-host harness for the on-the-wire UAT.

Writing the fix now.

Now the UAT through the real Node host.

All three pass. Confirming the wire test goes red without the fix, then the adjacent regression scope.

Known fresh-worktree gap (control-app `generated/` missing); copying it from the main checkout.

All green (the `internal error` lines are workerd log noise; suites pass). Lint, then update the ticket body before committing.

Typecheck clean for the touched files; the repo has no eslint configured. Updating the ticket body.

Committing on the branch.

Now the merge-back sequence (lock → merge working in → bump → xgd-merge → move-to-free-coded), as a retry loop per the known race.

BUG-316 is fixed and merged into `xgd-working`. The ticket is parked at `free_coded`, ready for you to promote to `ready_to_reconcile` when you want. I didn't need to ask you anything: the ticket body was enough to go on, and AC-2067 had already been rewritten to describe the framed behaviour.

**The fix** (`tools/generate/src/cli/ai/fidelity-core.ts`): I put back the reverted `framed()` step from 0a0f97f216. `contentBlocksFrom` now carries the untrusted-content frame onto the picture's blocks instead of dropping it:
- The opening marker goes at the start of the first text block, or gets its own block if the result starts with the image.
- The closing marker goes at the end of the last text block, or gets its own block if the result ends with the image.

For `screenshot`, the model now receives `["<<<untrusted>>>\n" + description, image, "\n<<</untrusted>>>"]`, so the picture sits inside the frame. A payload with no frame comes back unchanged, and a result with no image (including every refusal) still returns `null`. I also replaced the old code comment that said the markers were "given up".

**Tests** (`tests/test_UAT_FC_BUG-316_the_picture_keeps_its_frame.test.ts`, 3 UATs, all passing):
- **Through the real Node host:** a scripted `screenshot` call, checking what the backend receives next. The first block opens with the marker and still describes the image's size, the last block closes the frame, the PNG is between them, and each marker appears exactly once.
- **Directly:** a result that starts with the image gets its own opening block.
- **Directly:** a payload with no frame comes back unchanged, and a refusal returns `null`.

**Checks:**
- With the fix removed, the host test and the image-first test fail, so they do catch the bug.
- The related suites pass: REQ-157, REQ-206, BUG-229, BUG-258 and BUG-250.
- Typecheck is clean for the changed files. I couldn't lint because the repo has no eslint installed.

**Commits:** `00fefc7f5e` is the fix and tests; `bf0e359695` bumps the version to 0.2.711. I set story points to 1 and added the implementation and test details to the ticket body, keeping the original text.

<!-- xgd-chat-end -->