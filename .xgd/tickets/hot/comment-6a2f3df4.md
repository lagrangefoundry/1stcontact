---
uid: comment-6a2f3df4
id: COMMENT-4843
type: comment
title: Comment on bug BUG-181
created_by: xgd
created_at: '2026-10-03T19:34:07.824360+00:00'
updated_at: '2026-10-03T20:03:02.076346+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-12f2d4c4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1266c10a-70be-4ad1-b845-5db2c8e39447",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="81bbf212-e42b-4dd0-97a8-ebad6e12a10d-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T19:28:09.299064+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="81bbf212-e42b-4dd0-97a8-ebad6e12a10d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T20:02:56.699945+00:00" -->
#### Claude
Scope is clear and operator-approved. Setting status and cutting the branch.

Now the code change.

Tests pass (7/7). Now committing, merging back, and moving the ticket to free_coded (letting the gate do the version bump).

Now updating the ticket body (appending what landed, keeping the existing content) and cleaning up the branch.

The append failed because `--append-body` expects the text as an argument. Retrying with that form.

I've fixed BUG-181. The upload note no longer says an uploaded image is on the client's site. The ticket is at `free_coded`, and I haven't promoted it to `ready_to_reconcile`. That's your call.

**The new wording** (in `uploadNote`, `apps/control-app/src/builder/app.js`):
- **When the copy works:** "Added — **IMAGE-3** is ready to use on your site." If there's no label, the filename in backticks takes its place, as before.
- **When the copy fails:** "It's in your Library, but isn't ready to use on the site yet: <reason>"
- **Unchanged:** the first line naming the file, the reference-role line, the bare "Added.", and the "can't search it yet" line.

**Tests:** the two affected suites passed, 7 of 7.
- **New file:** `tests/test_UAT_FC_BUG-181_upload_note_says_ready_not_on_site.test.ts` runs the real builder and chat pane. It checks a labelled upload, an unlabelled one, a failed copy, and a reference upload. Every case confirms the note never says "on your site as", "it's on your site" or "put it on the site".
- **REQ-287's test:** `tests/test_UAT_FC_REQ-287_the_note_names_the_label.test.ts` now expects the new sentence, and its header notes that BUG-181 changed the wording. What it actually checks, label first and the filename only when there's no label, is unchanged.

**What I didn't run:** the full test suite. Only those two files ran.

**Landing:**
- The fix is commit `193c929`, merged into xgd-working.
- The version bump to 0.2.450 is commit `65d5301`; the free_coded step made that bump itself.
- Both commits are recorded on the ticket.
- The branch and worktree are cleaned up.
- I added a "What landed" section to the ticket body and kept the original text.

REQ-287 is still at `ready_to_reconcile` with the old wording in its tests. If it reconciles before BUG-181, the next reconcile has to settle the wording. BUG-181 landed later, so the new wording should take precedence.

<!-- xgd-chat-end -->