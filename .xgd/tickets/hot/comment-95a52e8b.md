---
uid: comment-95a52e8b
id: COMMENT-5466
type: comment
title: Comment on bug BUG-216
created_by: xgd
created_at: '2026-10-17T22:56:44.919459+00:00'
updated_at: '2026-10-17T23:04:13.193378+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b30c59eb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b2dfc43f-3c17-45a7-8060-2f0e07446cc9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0a675f1d-e194-4e23-af65-a3992c24bbda-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:55:29.201786+00:00" -->
#### You
Cards that ask for uploads need an "Uploaded" button - there are several routes to uploading. I used drag and drop but had no way to tell the card I had done it and had to skip

<!-- xgd-turn id="0a675f1d-e194-4e23-af65-a3992c24bbda-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T23:04:09.345106+00:00" -->
#### Claude
Empty ticket. Let me find the upload card code before scoping.I've scoped BUG-216 and cut its branch; now adding the "Uploaded" button and its test.

Now the edits.

Now the UAT, modelled on the BUG-211 one.

Passes (not skipped). Regression across the plan-panel UATs:

All 69 pass; the one failing file is `heic_at_the_door`, which can't import `./generated/ticketing` in a fresh worktree (a missing generated artifact, unrelated). Committing and merging back.

Merged (the overlay check found nothing to hide). Marking it free_coded:

Upload cards on the plan panel now have an **"Uploaded"** button, next to "Upload a document" and "Skip". If you add a file another way, like dragging it onto the chat or the Library, pressing it closes the card as answered, not skipped. The card then reads "Uploaded to the Library" and keeps its Change button. On its next turn the agent is told the file is in the Library, instead of being told you skipped.

- **Which cards:** any card that takes an upload, including typed questions that also accept one. Other cards don't get the button.
- **No server change:** it sends an ordinary answer, the same way the panel saves any other one.
- **One thing to know:** the button doesn't link the card to the specific file you dropped. It only tells the agent "it's in the Library", and the agent has to find the file there.

**Tests:** the new test passes. It checks that pressing the button saves the answer without uploading anything, that the card shows it answered, and that only upload cards have the button. Across the existing plan-panel and upload tests, all 69 tests passed. One older test file couldn't run because a generated file it imports is missing from fresh branches, which has nothing to do with this change.

**Ticket:** BUG-216 is at `free_coded`, 1 story point, with the fix (`9d1a2db`) and the version bump the gate added itself (`1188948`), both now on `xgd-working`. The ticket body describes what was built, and the branch has been cleaned up. Moving it to `ready_to_reconcile` is your call.

I changed `plan-panel.js` and `config.js` (in `apps/control-app/src/builder/`) and `builder.css` (styling only), and added the test file `tests/test_UAT_FC_BUG-216_uploaded_button.test.ts`.

<!-- xgd-chat-end -->