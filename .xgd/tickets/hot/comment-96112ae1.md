---
uid: comment-96112ae1
id: COMMENT-5629
type: comment
title: Comment on bug BUG-278
created_by: xgd
created_at: '2026-10-25T18:58:38.840886+00:00'
updated_at: '2026-10-25T19:22:29.886760+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e2fe84cf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4581410b-1993-4990-b294-ce53fdd4cd9f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ba89ed4e-911c-4e10-91fc-23b352d4f112-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T18:57:02.044280+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ba89ed4e-911c-4e10-91fc-23b352d4f112-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T19:22:28.314668+00:00" -->
#### Claude
Scope is clear. Let me find BUG-262's implementation.

The shape is clear: the BUG-262 gate already exists; the fix widens it from slow tools to every tool. Starting the free-coding flow.

Now the change: the gate refuses every tool, not just slow ones.

Now the UAT, modelled on BUG-262's harness.

The finished cue is refused with 409 unless the client actually finished something. I'll have the client answer the last open question first, the way the BUG-262 test does.

The first `tool_activity` frame is the refusal itself. Before deciding how to assert, I'll check what that frame carries.

The refused call shows up as an activity frame whose output is the refusal, so nothing actually ran before the line. I'll assert that directly.

I'll run the whole workers suite, since server-side continuation cues aren't visible by grepping tests.

24 failures. I need a baseline: I'll run the same files on the base code (reverting my two source files temporarily, keeping the new test aside).

Six tests newly fail, all on host continuation turns (REQ-427 critique continuation, REQ-428 promise continuation, REQ-449). I'll look at what those scripts do first.

The same helper is already copied into five suites. I'll add one shared `saysThenCalls` to the scripted-model support module and use it in the files I touch. Now the REQ-428 and REQ-449 scripts:

All 14 pass. Now the node-project suites that drive the host:

AC1058 is a known pre-existing failure. I'll baseline the others on the base code.

Same 8 fail on the base, so they were already failing. Now a typecheck of the touched packages.

No typecheck script exists, and the only `speakFirst` callers are the two I updated. I'll check whether any priming or KB text still says the rule covers slow tools only.

Nothing stale. Next: the ticket body, version bump, and commit. First the project's promotion gotchas from memory.

Update the ticket body before committing (preserving existing content, appending implementation notes and the revised test plan):

Now commit on the branch, lock, then follow the memorised order: merge working into the branch, bump, fast-forward.

REQ-459's session holds the merge lock, so I'll wait for it. Meanwhile the merge from xgd-working brought in new suites (e.g. BUG-280). Before landing, I'll check those against the wider gate.

Green. I'll bump only after taking the lock, because REQ-459 will move xgd-working's version when it lands. Polling the lock:

The lock is mine. REQ-459 ("one progress story") just landed and may touch the same cadence code, so I'll re-run its suites alongside mine before committing the bump.

The ticket moved, but with a warning about the version. I'll check exactly what it said.

The ticket is at `free_coded` with both commits and version 0.2.639 recorded; the warning was the gate's standard reminder. Now clean up the branch:

BUG-278 is fixed, merged into xgd-working, and parked at `free_coded`. When the host starts a turn with a cue, the consultant now has to say something to the client before it can use any tool, not only before a slow one.

**The change**
- **Every tool is gated:** the BUG-262 speak-first gate refused only the slow tools listed in `slow-tools.json`. Now it refuses every tool on a host-cued turn until the turn has written text the client can see. After that one line, tools run normally.
- **Unchanged turns:** turns the client starts, and talker turns, behave exactly as before.
- **One rule:** the old slow-tool rule is now covered by the wider one rather than kept as a separate path.
- **Refusal text:** reworded to fit any call: "everything you do before you speak keeps them waiting … Then carry on, starting with this call again."
- **Files:** `tools/generate/src/cli/ai/cadence-core.ts` and `host-core.ts`.

**Decision for you to check:** I applied the rule to every host cue, including the review, promise and stall continuations, as the ticket's "other hidden cues" says. So when a held hand-back is carried on, the consultant first says something like "Before I show you, I am giving it a careful look." That broke six existing tests in REQ-427, REQ-428 and REQ-449, whose scripted model called a tool on a continuation turn without speaking first. I changed only their scripts so the model speaks first; no assertion changed. If you'd rather continuations stay silent, the gate can be limited to the opening, finished and settling cues.

**Tests**
- **New UAT:** `tests/test_UAT_FC_BUG-278_a_cue_turn_speaks_first.workers.test.ts` covers the three cases in the ticket's test plan, and all three pass:
  - A `finished` cue turn calling `read_plan` before speaking is refused, then runs after the line, and the client gets the line before any call has run.
  - A turn the client started is not refused.
  - A cue turn that speaks first has none of its calls refused.
- **Helper:** `saysThenCalls` (a line then a tool call in one model response) was already copied into five test files. It now lives once in `tests/support/scripted-model-client.ts`, used by the files I touched.
- **Regression:** I ran the full workers suite and the node suites that touch the AI host. BUG-262, BUG-264, REQ-432, REQ-427, REQ-428, REQ-449 and REQ-459 pass. The 18 workers failures and 8 node failures that remain also fail with my change removed, so they were already red.

**Landing**
- Commits are `0cc74b4db8` (the fix) and `470b393c0a` (version 0.2.639).
- xgd-working moved twice while I worked, so I rebased the two commits onto it rather than make a merge commit.
- The ticket body now records the change, the continuation decision and the test plan, with story points set to 2. The branch and worktree are cleaned up.

Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->