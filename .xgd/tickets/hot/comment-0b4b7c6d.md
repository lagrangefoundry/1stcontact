---
uid: comment-0b4b7c6d
id: COMMENT-5631
type: comment
title: Comment on bug BUG-280
created_by: xgd
created_at: '2026-10-25T18:58:45.396508+00:00'
updated_at: '2026-10-25T19:08:38.071340+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-04d1bc51
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3b0d3c69-80f1-4900-9354-6a4d316b33e7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4692e663-40f6-475a-951c-4f7261632233-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T18:57:05.379316+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4692e663-40f6-475a-951c-4f7261632233-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T19:08:37.333458+00:00" -->
#### Claude
Reading the REQ-455 copy code (`first-draft-cut.ts`, `first-draft.ts`) to see how the plan is rewound before I cut a branch.

Snapshot-at-cut plan design taking shape; checking `firstDraftPlan` and the REQ-455 UATs' expectations (especially the pruned-log case) before I write it.

Worktree ready. Now writing the change in `first-draft-cut.ts`.

Typecheck clean. Now the UAT — reading the REQ-455 source fixture so I can reuse its approach.

Writing the UAT now (reusing REQ-455's harness pattern: real D1 source, plan written either side of a real instant, provisioned through `route()`).

Both pass. Checking they actually fail on the old code, then running the REQ-450/455 suites.

All 22 pass. Checking for other callers of the renamed function, then lint.

Typecheck clean; there's no lint config in this repo and no tests tsconfig (vitest transpiles). Updating the ticket body before the commit so the UATs are grounded in it.

Committing the work, then the lock → merge → bump → xgd-merge → gate sequence.

The first-draft test copy now rewinds the whole plan to the cut, not just its decisions, so a task written after the hand-over like t6 "Catering page paused" can no longer reach the test copy. The new UATs and the REQ-450/REQ-455 suites pass (22/22), and the new UATs fail on the old code. BUG-280 is merged into xgd-working and sits at `free_coded`, version 0.2.637.

**How it works now** (`first-draft-cut.ts`):
- **Normal case:** the copy reads the plan's whole state from the change log at the last version saved before the cut. Tasks, asks and their answers, comps, board, critique, stage settles and promises all come back as they were then. Anything created after the cut is gone; anything changed after it is restored.
- **Plan created after the cut:** the copy starts from the seed plan.
- **Change log pruned past the cut:** decisions use REQ-455's existing rule: one settled after the cut goes back to its seed, and earlier ones stay. Every other field goes back to its seed rather than being copied.
- **Report of what was left out:** a new `dropped` list sits next to `cut` in the provisioning result and on the destination plan's `first_draft_copy` marker. It reads like `["tasks/t6", "asks/q_late", "critique"]`: `key/id` for an item created after the cut, `key` for a whole field. Restored items aren't listed.

**Things to know:**
- **REQ-450 fixture changed:** the copy fixture stamped its first build at a fixed 2026-10-01, which falls before the plan was ever saved. So the cut came before every saved version, and the fix correctly drops that plan as unrecoverable. I changed the stamp to a moment just after the save, which is what the fixture's own comment says it meant. That edit is in this ticket's commit.
- **Brief/Notes text isn't rewound:** the change log doesn't store the plan body. The decision log in it is still cut as before, but free text added to Brief or Notes after the cut still comes across. This limit is written in the ticket.
- **Existing test business not repaired:** First-Draft-Test Dina's Diner 2 was made with the old code. It needs to be provisioned again to get the corrected plan.

The ticket body now describes what was built and the tests. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->