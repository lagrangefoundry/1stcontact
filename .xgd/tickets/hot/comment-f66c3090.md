---
uid: comment-f66c3090
id: COMMENT-5595
type: comment
title: Comment on bug BUG-268
created_by: xgd
created_at: '2026-10-24T16:01:54.794188+00:00'
updated_at: '2026-10-24T16:10:44.911911+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1cb084fb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "574049eb-4ea6-4557-83f0-143a4d66ca13",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="817577b3-f142-42c8-b0de-10db587e0883-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T16:00:24.747718+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="817577b3-f142-42c8-b0de-10db587e0883-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T16:10:43.601992+00:00" -->
#### Claude
Tracing where the per-request build counter lives in `host-core.ts` to see why it doesn't reset.

Found the counter; checking whether refused `Delegate` calls also get counted as "builds that changed nothing".

Root cause is clear now; writing up the fix scope on the ticket, then cutting a branch.

Worktree is set up. Now making the code change in `host-core.ts`.

Both pass. Now confirming they fail without the fix (stash the source change via patch), then running the regression scope.

Both fail for the right reasons without the fix. Regression scope next.

Commit the fix, then follow the recorded merge-back ordering (lock → merge working in → bump → ff-merge).

BUG-268 is fixed and merged into `xgd-working`, and the ticket is at `free_coded`. I haven't promoted it to reconcile; that's your call.

**What was actually wrong.** The idle-build counter does reset at the start of each client message. Two things made it look as if it carried over:

1. **Refused `Delegate` calls were counted as builds that changed nothing.** No builder ran for a refused call, so the host read its result as "wrote nothing" and added one to the count. Each refusal also repeated the stop note, which is how the count reached 6 and 7 with a limit of 2.
2. **The host kept holding the reply open after building was stopped.** It still continued the reply for unfinished work: layout faults, a review finding, a promise to the client. Each continuation reaches the consultant as a new prompt asking for a fix, so to it that looks like a new request. But it is still the same client message, so every `Delegate` was refused. That matches "two requests in a row".

**Fix** (`tools/generate/src/cli/ai/host-core.ts`):
- Only a `Delegate` that actually ran a builder (its result carries `wrote`) is counted. A refused one gets just its refusal message.
- Once a message's building has been stopped for idleness, the host stops continuing the reply. The request ends with the consultant's report, and the client's next message starts with a fresh allowance.

The existing rule still holds: two real builds in a row that change nothing stop building for the rest of that message.

**Tests.** I added two tests in `tests/test_UAT_FC_BUG-268_an_idle_stop_ends_with_its_message.workers.test.ts`:
- Refused calls after the stop carry no "CHANGED NOTHING" line, and only 2 builders run.
- After an idle stop with layout faults still open, no continuation follows, and the next client message's build is started and writes the page.

Both fail with the fix removed and pass with it. The related BUG-266, REQ-436, BUG-256, REQ-415, REQ-427, REQ-428 and REQ-409 workers suites also pass (7 files, 26 tests). I couldn't run a linter: the project has no lint script and `npx eslint` failed on a root-owned npm cache.

**Not changed:** a message the client sends while work is running is answered by the talker and never reaches the consultant as its own turn, so I left the counter alone in that case.

Commits are `9b2cf572c7` (fix) and `df95fe4b79` (version 0.2.613), with story points set to 2. The ticket body now has the root cause, the fix and the test plan.

<!-- xgd-chat-end -->