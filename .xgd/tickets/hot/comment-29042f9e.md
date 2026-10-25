---
uid: comment-29042f9e
id: COMMENT-3272
type: comment
title: Comment on request REQ-284
created_by: xgd
created_at: '2026-09-19T19:34:18.803820+00:00'
updated_at: '2026-09-19T19:45:57.398147+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2dcd47ec
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "072bdca9-b18a-4192-865f-957f05d3ee00",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="20d71c2d-389d-49e5-840d-530e57110fdc-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T19:33:33.319002+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="20d71c2d-389d-49e5-840d-530e57110fdc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T19:45:56.767933+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now I have the full picture. Let me record the plan on the ticket before coding.

Now the prose edits. First `priming.json` — the two interrupted-turn templates:

Now the fidelity surface prose:

Now `list_changes` in the L1 surface:

Clean. Now the `roles.ts` seam so the settings role gets its own template:

Now the UATs. Let me check how the settings role's reminders are assembled in tests:

Now let me write the UAT suite:

Now typecheck and lint:

Now bump the version and commit:

Now lock, merge back, and claim the ticket:

Done. REQ-284 is at `free_coded`, commit `5c5795e10b`, version `0.2.283`, merged into `xgd-working` and the branch cleaned up.

**What landed**

Three prose surfaces and one seam — no mechanism, no new operation, no change to what any call does.

*Naming the cost where the choice is made.* The summary manual a session is primed with renders group prose, the surface overview, and one line per tool (the operation's `summary`) — that line is the whole of what's in front of a session deciding which instrument to reach for, so the pricing went there rather than only in the detail it would have to ask for. `screenshot`'s line now says it is the most expensive call available, that the image stays in every turn after this one, and names `list_changes` as what answers *what changed?* for almost nothing. `list_changes`'s line says it's the cheap one and says it's what to reach for before a picture. The fidelity overview and group prose carry the same at length, including that `compare` hands back numbers rather than the pictures — so *do these match?* can be asked without either image entering the conversation.

*Stopping the doom loop.* `interrupted-turn` no longer says "Look at the site before you answer". It says to call `list_changes` first — what landed, who landed it — and take a picture only if that is genuinely not enough.

**One decision I made that isn't in the original ticket**, now written into the body: the settings assistant gets its own template. `interrupted-turn` was rendered for both roles, and the settings session has no site, no journal and no camera — a rewrite naming `list_changes` would name a tool it was never granted, which this repo treats as a hard rule. So the template split in two (`interrupted-turn-settings` names `read_business`/`read_addresses`), and `interruptedSignal` takes which. That is the only `.ts` change, and it is one argument.

**Evidence** — `tests/test_UAT_FC_REQ-284_the_cheap_instrument_is_named.test.ts`, 7 UATs. The reminder claims render the real role through the framework's own loader and `assembleReminders` out of the shipped `priming.json`; the manual claims go through the real Toolbox's own projection at the level a session is actually primed at, so pricing that failed to survive the projection would fail here. Regression scope (priming, roles, both settings suites, fidelity, L1 surface, change journal, both BUG-121 suites, workers side): 230 tests, all passing.

One note for when you promote: the two suites that first failed in the fresh worktree (`REQ-174`, `BUG-63`) were the known `src/generated/*` absence, not this change — they pass once those files are copied in.

<!-- xgd-chat-end -->