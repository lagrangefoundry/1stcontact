---
uid: comment-2e24d6a8
id: COMMENT-5543
type: comment
title: Comment on bug BUG-244
created_by: xgd
created_at: '2026-10-21T15:06:57.156151+00:00'
updated_at: '2026-10-21T15:14:48.421036+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-bae7a6f0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c7c0d9b0-0605-4664-b9b9-39d97355e743",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e7879f55-bf64-4294-9098-64133d396e1a-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T15:06:30.937992+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e7879f55-bf64-4294-9098-64133d396e1a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T15:14:46.739341+00:00" -->
#### Claude
The ticket is scoped and the framework hooks (`composerAction`, `statusContainer`) are installed; I'm now reading the builder's attachment, chat-mount and plan-panel code to wire them in.

Framework contract confirmed. Now checking which existing tests touch the attach button or status widget, then I'll start the branch.

Edits done. Now writing the UAT, modelled on the REQ-390 suite that mounts the real builder.

Now writing the UAT file.

Placement assertions pass; Stop building doesn't clear the widget in this setup. Checking whether that's the framework's normal behaviour (it waits for the host to end the turn) before deciding.

All 3 UATs pass. Running the adjacent suites: attachments, plan panel, status widget, and builder CSS.

REQ-398 (the banner suite) is probably mine; the others look environmental (sockets/chromium). Inspecting.

Baseline: the BUG-53 and REQ-398 hover failures are pre-existing. Only REQ-398's "no button" check is mine. Checking the remaining four against baseline too.

Only the pre-existing REQ-398 hover failure remains. Running lint on the changed files, then updating the ticket body and committing.

No lint configured. Reading my notes on the free_coded gate before committing.

Updating the ticket body (appending the implementation record, existing text kept), then committing.

Committed on the branch. Now locking and merging into xgd-working.

Merged. Moving the ticket to `free_coded`; leaving out `--version` so the gate bumps the version itself.

BUG-244 is done and merged into xgd-working. The ticket is at `free_coded` with two commits: the change itself and the gate's version bump to 0.2.569.

**What changed**
- **Attach is a "+" inside the text box**, on the left, mirroring Send. It opens the same file picker, and a picked file becomes a chip as before. The "📎 Attach files" row and button are gone. "Attach files" is now only the "+"'s accessible name and tooltip. Drag and drop, chips above the box, choosing site or reference, and sending with the next message all work as before.
- **The status widget is now under the progress banner in the plan panel**, joined to it. It shows "The consultant is …", elapsed time and Stop building as soon as a worker round opens, and is gone when the round ends. The banner only gets taller while the widget shows, and nothing of it remains above the composer. This applies to the main and group conversations; the settings chat keeps its widget above its own composer.
- If the plan panel is collapsed to its rail, the widget is hidden with it.

**Tests**
- New file `tests/test_UAT_FC_BUG-244_plus_in_composer_and_status_under_banner.test.ts`, 3 tests, all passing. They check:
  - the "+" opens the picker and no "Attach files" control exists;
  - during a build the widget sits under the banner, not in the chat, and the composer shows Send (BUG-239 unaffected);
  - Stop building asks the origin to stop the work.
- I changed one line in REQ-398's banner test. Its "no collapse toggle in the banner" check counted every button, and the hidden widget's Stop building button now lives in the banner by design, so the check now ignores the status slot. This is noted in the ticket.
- Of the 57 related suites, these still fail and are not from this change:
  - **Fail identically in the main checkout:** REQ-398's hover/focus tooltip test, BUG-53's `builder-library__confirm-delete` check, BUG-52, and three of the builder-origin tests.
  - **Failed only in my worktree:** two more builder-origin tests (routes with no probe), the copy-edit typeface test (AC1038) and BUG-58. BUG-58 needs a real browser, which the sandbox blocks. For the others, the main checkout has uncommitted changes to the font files (`fonts/platform.json`, `module-assets.ts`), which likely explains it. None of these touch the files I changed.

I appended an "As built" section and the test list to the ticket body; the existing text is kept. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->