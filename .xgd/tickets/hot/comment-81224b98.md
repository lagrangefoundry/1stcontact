---
uid: comment-81224b98
id: COMMENT-7797
type: comment
title: Comment on bug BUG-347
created_by: xgd
created_at: '2026-11-04T23:10:41.489142+00:00'
updated_at: '2026-11-04T23:14:35.755456+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1ccd13f9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "23d82bf1-adba-4447-9d04-b12ba4be1018",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d1a34e07-ba69-4989-90d2-50585b807285-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T23:10:17.015465+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="d1a34e07-ba69-4989-90d2-50585b807285-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T23:14:34.244122+00:00" -->
#### Claude
Reading the framework's size-limit error to see where the advice can attach.

Scope is clear and the ticket body already holds the requirements; no questions needed. Starting: marking `free_coding` and cutting the branch.

Now the guidance edit in the worktree.

Fine. Writing the UAT.

All 16 pass. Lint, then commit.

Now merge back into xgd-working.

Now update the ticket body with the implementation, keeping the existing body, then clean up.

I've done the 1stcontact part of BUG-347. The consultant is now told, before it makes a clip, that a looping clip only fits the 2 MB budget at about 6 s or less, so it won't try a 10 s one. The ticket is at `free_coded` and merged into `xgd-working` (commit `6dc06a26`, version 0.2.765).

**What changed:** the AnimateImage notes in `apps/control-app/src/videogen.ts` now say:
- a clip must fit 2 MB (2,000,000 bytes);
- a looping clip fits at about 6 s or less (pingpong at 540p);
- when a client wants a slower loop, offer a slower camera move in a loop of 6 s or less, not a longer clip;
- don't try 8–10 s, because an oversized clip is only refused after it has been made, minutes later, and it still counts toward the client's clip limit.

It doesn't mention a price or name the video service. The text goes in the tool's description rather than the priming, so it doesn't use any priming budget.

**If someone tries a longer clip anyway:** the framework's `over_size_limit` error already names the length that fits. For the 3,055,003-byte, 10 s pingpong in the bug report it says "at most 6 s should fit at 540p". A test now covers this.

**What I didn't add:** a size check that refuses a request before generation. The size is only known once the clip is made, so refusing earlier would be a guess. The new notes are what steer the consultant away from 10 s requests before they're paid for.

**Tests:** I added `tests/test_UAT_FC_BUG-347_loop_length_guidance.workers.test.ts`. It checks the new notes, and that a 10 s pingpong of the reported size is refused with the 6 s advice and nothing stored. It passes, along with the existing clip tests from BUG-336, REQ-461 and REQ-468 (16 tests). I didn't run lint because `eslint` isn't installed in the branch worktree.

**Still open:** as the ticket's decision says, the ticket closes once lagrange-framework REQ-237 (lower bitrate) lands. Then the 6 s figure needs to be re-measured and updated in the notes and tests. I've noted this in the ticket body.

<!-- xgd-chat-end -->