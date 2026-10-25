---
uid: comment-926eed03
id: COMMENT-5526
type: comment
title: Comment on bug BUG-234
created_by: xgd
created_at: '2026-10-20T03:33:08.598944+00:00'
updated_at: '2026-10-20T03:37:43.068111+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-426f5c7d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "018573b2-f20d-4fcf-b3ba-ca59a0b0e571",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4be27a51-121d-4b85-97ca-d60e34179411-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T03:32:03.932983+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4be27a51-121d-4b85-97ca-d60e34179411-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T03:37:41.349403+00:00" -->
#### Claude
Scope is clear. Mark free_coding, cut branch.

Now the edits.

Tests pass; committing and merging back now. I'll update the ticket body first so the UAT is motivated.

The ticket also asks for DOC-66's note to be updated. Checking it.

BUG-234 is done and parked at `free_coded`. While the consultant is busy, the working line now reads **"The consultant is …"** instead of "Your consultant is …".

**The change:**
- `tools/generate/src/cli/ai/slow-tools.json`: `"unnamed"` is now `"The consultant"`, and its `about` note says so. Every one-to-one working line takes its wording from this one value, so nothing else in the code needed to change. I searched for any other "Your consultant" the client could see and found none.
- `apps/control-app/src/builder/config.js`: a comment called REQ-402's "Tell the consultant…" an exception to "your consultant". That's no longer true, so I reworded it.
- Group-chat mode still uses the member names from `group-chat.json`, as the ticket says.

**Tests:**
- Updated the three tests that expected the old wording (BUG-205, BUG-215, REQ-390). The BUG-205 one-to-one test was renamed to `…says_the_consultant…`.
- Added `tests/test_UAT_FC_BUG-234_working_line_says_the_consultant.workers.test.ts`. It runs a one-to-one turn through the real session and prompt endpoints. It checks that every working line starts "The consultant is " and contains neither "Your consultant" nor either group-chat member name.
- All four test files pass. A fresh worktree is missing the generated files under `apps/control-app/src/generated`, so I copied them in from the main checkout to run the tests. That folder isn't tracked, so nothing extra was committed.

**Landing:** the commit is `7e7f880b67`, merged into xgd-working. The `move-to-free-coded` step added the version bump as a second commit and recorded both on the ticket. The branch and worktree are cleaned up, and the ticket body now has a section describing what was implemented.

**DOC-66:** as the ticket asked, its running-copy guidance now says "the consultant", and its example reads "The consultant updated your hero section". That's a doc-only edit, made through `xgd ticket update`.

<!-- xgd-chat-end -->