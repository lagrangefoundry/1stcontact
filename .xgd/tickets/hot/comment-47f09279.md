---
uid: comment-47f09279
id: COMMENT-5590
type: comment
title: Comment on bug BUG-264
created_by: xgd
created_at: '2026-10-24T15:08:41.218275+00:00'
updated_at: '2026-10-24T15:20:17.566792+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-9c252725
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3183ef16-c0d4-445e-8b0f-0918070d63c3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="511aaddd-1ffc-44fc-b641-ca400794ef77-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T15:07:37.145529+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="511aaddd-1ffc-44fc-b641-ca400794ef77-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T15:20:16.053117+00:00" -->
#### Claude
Reading BUG-262's landed mechanism (it's at ready_to_reconcile, so the blocker is in) and the plan model to find where each settling action is recorded.

Mapping which settling actions BUG-262/245 already cue on; looking at the builder's cue triggers now.

Now writing the plan-core part.

Now the edits to plan-core.

Now the server side: notice, finish guard, and PLAN_KEYS.

Core change written; now the UAT (scripted-model host harness, modelled on BUG-262's). Checking the board route and the consultant's board ops.

Writing the workers UAT now.

Workers UATs pass (BUG-264 ×4 and BUG-262 ×5). Now the builder-side UAT for the cue and its debounce.

Writing the builder (jsdom) UAT: two settles in quick succession → one cue; an unchanged view → none.

Both builder UATs pass. Running the regression scope (REQ-424/416/425/431/432/433/434, BUG-245/256/262 suites).

That REQ-416 priming failure matches a known pre-existing one (memory: "REQ-416 hand-over line wrapped — red on clean working"); I touched no priming. Confirming, then the node suites.

Only the known pre-existing REQ-416 priming failure; 125 others pass. Quick type/lint check.

Code and tests done. Before committing, checking my notes on the free_coded gate and version bump.

Updating the ticket body with an "As built" section (existing content preserved).

The append didn't take. Checking how `--append-body` reads its input.

A literal "-" got appended. Rewriting the body: original content kept exactly, the stray dash removed, and the As-built section added.

Ticket body updated. Now merging back (lock → merge working into branch → bump → fast-forward → free_coded).

Moved to free_coded. The rematerialize script path printed by `lock` doesn't exist, so running the CLI form, and checking the warning.

Overlay check reports nothing to hide. Setting story points, then cleaning the branch.

Saving one gotcha to memory: `--append-body -` appends a literal dash.

That gotcha is already recorded (`xgd-append-body-takes-a-string`), so I'm removing my duplicate.

BUG-264 is in: the commits are merged into xgd-working and the ticket is at `free_coded`. When the client settles something the consultant asked for, the consultant now answers promptly, even with no focus round open.

**What BUG-262 already covered:** a focus round finishing, the last open question being answered, and the last site on the comparison board being sent or skipped (that covers "the last site" and "choosing or skipping a look").

**What this adds:** the headline, the positioning card, the visual direction card and the last unreacted note now trigger a reply too.

- **What counts.** When the client acts on the board, the plan checks what the consultant was waiting on before and after. Anything that stopped waiting is recorded in a new plan field, `settled`. So Dina writing her own headline over the offered ones counts. A reaction that leaves other notes waiting doesn't, and nor does re-choosing a headline that was already chosen.
- **No second mechanism.** A settled item is treated as a finish under BUG-262's existing routing and guard. If nothing is running, a cued turn starts; if a build is running, the reply comes from the talker; either way it's told at most once. The notice names what was settled, e.g. "the headline, now 'The perfect stop…'".
- **One reply for quick actions.** The builder waits until the client has paused for 1.5 seconds before sending the cue. So hearting the card and then choosing the headline gets a single reply.

**Tests:** the ticket's test plan is covered by two new test files, a host-level one (four tests) and a builder one in a simulated browser (two tests); all six pass. In the surrounding suites (REQ-408/416/424/425/431/432/433/434 and BUG-245/256/262), 125 tests pass and one fails: the REQ-416 priming test, on priming text I didn't change. My notes record it as already failing on clean xgd-working, but I didn't re-check that baseline this session.

**Ticket:** the original content is kept, with "As built" and "UAT coverage" sections added. Story points are 3, version 0.2.610, commits `ec83696` (the fix) and `d80fb67` (the version bump). The branch and worktree are cleaned up, and the ticket is left for you to promote to reconcile.

Two small things went wrong along the way:
- My first ticket edit appended a stray "-" to the body. I rewrote the body to remove it.
- I created a memory note about that, then found the same gotcha was already recorded. The sandbox won't let me delete the duplicate: `memory/append-body-dash-is-literal.md` can be removed.

<!-- xgd-chat-end -->