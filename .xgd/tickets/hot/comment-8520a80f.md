---
uid: comment-8520a80f
id: COMMENT-5553
type: comment
title: Comment on request REQ-425
created_by: xgd
created_at: '2026-10-21T22:58:58.786738+00:00'
updated_at: '2026-10-21T23:17:25.976962+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-85bf0f4c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7e0aa6da-d827-4850-8389-758de7978267",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9dff3bc6-8720-4a84-a990-a67164541168-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T22:57:52.144460+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9dff3bc6-8720-4a84-a990-a67164541168-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T23:17:25.444376+00:00" -->
#### Claude
I'm reading the story board (REQ-408) and focus task (REQ-424) code to see how the positioning card and per-area readiness fit into the plan.

I'm still mapping the plan's stage gates and the board surface. Next I'll check how `set_stage` refuses a stage, then the UI and the tests.

I'm cutting the REQ-425 branch and starting the code: the card and readiness live in the plan core, then the Story pane UI, then the tests.

Writing the story-core changes now: the positioning card's shape, rules, consultant and client operations, and headline sources.

Story-core is done. Now plan-core: readiness on the plan, the `write_positioning` op (the fallback recorded as the `core_story` decision), and the focus task's card and headline steps.

Plan-core logic is in. Now the surface declaration (new `write_positioning` and `set_readiness` ops, `offer_headlines` taking `sources`), `PLAN_KEYS`, and the talker allow-list.

Now typechecking before the UI.

Typecheck is clean in both projects. Now the Story pane: the card above the headline, the source line under each option, and the focus highlights.

Now the story-board.js card rendering.

Next: check the priming text from `7b5db38f70` still matches the new tools.

Now running the existing story-board, focus-task and priming-budget suites to see what my change breaks.

Errors must be declared on the surface. Adding `NO_POSITIONING` to the declared errors list.

Remaining failures are the REQ-408 tests whose behaviour this ticket deliberately changes (headlines now come from the card). Updating those tests.

Board tests pass. Now the workers suites (wire, BUG-233, focus tasks, BUG-129 priming budget, REQ-171).

Existing tests are updated. Now writing REQ-425's own UATs. First, the setup of the pane and wire suites I'll model them on.

Writing the core UAT file (card, headline sources, finish line, fallback, readiness, focus steps).

Core UATs pass. Next is the Story pane UAT (jsdom), then a workers UAT for the wire.

Pane UATs pass. Now the workers UAT through the real routes.

All REQ-425 UATs pass. Now a wider regression run over every suite that touches the plan, story board, focus, priming or the builder panes.

41 failures, all in suites unrelated to the board (chat host, workspace origin, domain section…). Checking them against the main checkout to confirm they're pre-existing.

Those 9 worktree-only failures are the known webui-origin location artifact (503 serving `webui-shell` from a worktree), not this change. Now the 60 related workers suites.

Same 6 fail on clean `xgd-working`, so they're pre-existing. Running lint over the changed files.

No linter is configured, so I'm re-running the typecheck after the later edits.

Typecheck is clean. Updating the ticket body now: the original text kept, plus what was built, the design decisions, and the REQ-408 behaviour this supersedes.

Now committing. Checking how this repo bumps its version first.

The gate allocates the version itself, so no manual bump. Committing my files only.

Committed. Now locking and merging back into `xgd-working`.

Merged. The rematerialize script isn't at that path, so I'm using the `xgd ticket-store` form instead.

Ticket is `free_coded` at version 0.2.580. Tearing down the branch.

REQ-425 is implemented, merged into `xgd-working`, and the ticket is at `free_coded` (commit `22ddcd1521`, version 0.2.580). All 14 REQ-425 UATs pass, and the REQ-408, REQ-424 and BUG-233 suites I updated pass too. In the wider run of related suites, everything else that failed also fails on clean `xgd-working`, or only fails in the branch worktree because it can't serve the webui components (503).

**What the client and consultant now get**
- **Positioning card:** it sits above the headline on the Story board, in three parts: what I'm hearing (2–3 themes), what you're known for, and why each kind of customer picks you, put in terms of what that customer is deciding. The consultant writes it with a new `write_positioning` tool, and it has to name hearted notes as its source. The client hearts it or edits any line in place, and neither starts a turn. Once they have, the card is theirs and the consultant can't rewrite it, the same rule as for notes. The consultant's next turn is told what the client did.
- **Headlines come from the card:** `offer_headlines` is refused until a card exists. Each option has to name the card line it comes from, and the board shows that, e.g. "from why Contractors pick you".
- **Fallback:** `write_positioning` with `fallback: true` writes the honest card ("the most trustworthy choice, and the easiest to get hold of"). It also records the core-story decision as proposed, which the client still settles.
- **Readiness:** a new `readiness` field on the plan holds messaging, look and feel, and site functions, each `unknown`, `has_ideas` or `knows_exactly`. The consultant sets it with `set_readiness`, and it appears in every turn's plan summary.
- **Focus tasks:** a story task now covers one step at a time: react to notes, then confirm the card, then pick a headline. The banner and outline follow the step. While a story task is open, the consultant can't write a new card or offer new headlines.

**Decisions for you to check**
- **Supersedes REQ-408:** REQ-408 said headlines are written directly from hearted notes; now the card is written from hearted notes and headlines from the card. I updated REQ-408's and BUG-233's tests to match and noted this in the ticket body. REQ-408 is still at `ready_to_reconcile`, so its reconcile will meet the new rule.
- **The finish line is advisory, not enforced:** the "Getting to know you" checklist the consultant sees each turn now requires a confirmed card or the fallback. Ticking the stage done is not blocked, because four existing suites tick it freely and REQ-408's finish line was advisory too. Making it a hard block is a small follow-up if you want it.
- **No manual version bump:** the free-coded step allocated 0.2.580 itself when no version was given.

<!-- xgd-chat-end -->