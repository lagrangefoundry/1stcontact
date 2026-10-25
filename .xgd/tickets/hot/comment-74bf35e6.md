---
uid: comment-74bf35e6
id: COMMENT-5574
type: comment
title: Comment on bug BUG-258
created_by: xgd
created_at: '2026-10-23T17:18:28.517623+00:00'
updated_at: '2026-10-23T17:25:36.493348+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-98f158e2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "67ffebdd-e633-432a-948d-4260aa61d60a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c141662c-cc9c-48a1-b125-ccbaabfebbc9-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T17:17:31.799671+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c141662c-cc9c-48a1-b125-ccbaabfebbc9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T17:25:35.098366+00:00" -->
#### Claude
Reading the critic code and role setup before cutting the branch.

Found the cause in code; checking the consultant/builder role definitions before cutting the branch.

Plan settled. Moving the ticket to free_coding and cutting the branch.

Writing the UAT now — a tall test picture so every screenshot returns the per-call maximum of 4 tiles.

Both the consultant and builder hold the `screenshot` tool (4 tiles per call), so they also lose their oldest tile under the 3-image default. I'll fix all three roles.

Now the edits.

Now the UAT file.

Fresh worktree lacks the generated artifacts; copying them from the main checkout.

Passing. Confirming the new UAT fails without the role fix:

Reproduces the incident exactly (3 of 24). Adding a UAT for the consultant's own full-call screenshot too.

Running adjacent role/priming node suites as regression scope.

Green. Checking this project's version-bump convention before committing.

Committing the fix, then following the known-good merge order.

Merged. Now updating the ticket body (preserving existing content) and moving to free_coded.

Updating the memory note with what this session found about tool results.

BUG-258 is fixed and merged into xgd-working, and the ticket is at `free_coded`.

**Cause and fix:** the framework keeps only the newest 3 images of a request "live" by default and replaces the rest with text placeholders. The critic is handed up to 36 pictures in one turn, so it only ever saw 3. I set the critic role's live-image limit (`max_live_images`) to a new `CRITIC_MAX_IMAGES` in `critic-core.ts`. It is calculated as pages × widths × tiles per screenshot call, so it stays in step with what `criticFor` sends (36 today). `criticFor` now counts the pictures in its brief and throws an error instead of sending more than that limit. If a later change sends more, the review fails visibly instead of quietly judging from placeholders.

**Other roles:** the consultant and the builder are not affected, so I made no change there. They get pictures back from their `screenshot` tool, and the framework's limit only counts pictures placed directly in a message, never ones inside a tool's result. I first gave both roles a limit too, but the test passed without it, so I took that change out. The ticket body records this.

**Tests:** new file `tests/test_UAT_FC_BUG-258_the_critic_sees_every_picture.workers.test.ts`:
- A two-page review now sends all 24 pictures to the critic, with no placeholder. With the role fix removed it gets 3 of 24, the same failure as on Ariel's site.
- A consultant screenshot of all tiles arrives with all 4 pictures.
- The critic's limit is at least pages × widths × tiles per call.

The new tests, the REQ-427 critic tests and four priming/role-config test files all pass.

**Commits:** `99fe130` (fix) and `b57c3f8` (version 0.2.599), story points 1. Production deploys from xgd-working, but the dev site keeps serving its old snapshot until you run `bin/deploy --env dev`.

<!-- xgd-chat-end -->