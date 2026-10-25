---
uid: comment-0b94cbb1
id: COMMENT-5484
type: comment
title: Comment on request REQ-408
created_by: xgd
created_at: '2026-10-18T14:32:03.571643+00:00'
updated_at: '2026-10-18T15:44:28.913615+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-214b8e48
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d69ff90e-2074-4409-bcfa-8393c9b87412",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9456e5b2-f141-4dab-8303-295bd53898e9-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T14:31:15.857668+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9456e5b2-f141-4dab-8303-295bd53898e9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T14:57:41.432436+00:00" -->
#### Claude
Reading the ticket and mapping the plan/preview/consultant code it touches before I start (it's a large feature: new preview mode, plan storage, consultant ops, priming).

Still mapping: I've read the plan core (asks, comps, notices). Next is the plan surface declaration, the control-app plan routes, and the builder's View/Edit mode control.

Now looking at the builder UI: how the View/Edit mode control and the "no draft yet" grey placeholder work.

Still investigating: working out how the builder knows "nothing built yet" so Story can open first.

I have the architecture mapped. Now checking the consultant priming, the seed checks (for `weakest_point`), and how builder briefs are assembled.

Still mapping one last piece: where the consultant's delegated builder brief is composed, so copy briefs can carry the headline and hearted notes.

Worktree ready. Writing the board core (`story-core.ts`) first.

Now wiring the board into `plan-core.ts`.

Now the tool manual: board operations, errors and an overview paragraph in `plan-surface.json`.

Now the client's route, `POST /api/plan/board`.

Now the per-turn notice (`session-delta.ts`).

Now builder briefs: appending the story block in the delegation toolbox.

Core wiring done. Type-checking before the UI.

Types are clean. Now the builder UI — first the transport in `api.js`.

Strings added. Checking how `app.js` hands the plan transport to the panel, so the board shares it.

Now the Story pane itself, `story-board.js`.

Now wiring the Story mode into `app.js`, the plan panel's `onView`, and a non-remembered `setMode`.

Now the board's fixed stylesheet in `builder.css`.

UI done. Now the consultant priming (both variants), edited textually per the escape-churn memory.

Updating the pinned REQ-379 pre-publish list, then running the regression scope.

Node regression green (55/55). Now the workerd regression suites.

The two REQ-379 failures are the pre-existing ones the ticket already names; the updated pre-publish assertion passes. Now writing the UATs — first checking how the pane suite mounts the builder.

Now the core UAT suite (consultant operations through the real Toolbox, client actions, notice, priming/manual, weakest_point).

Pin calls aren't landing; printing what `box.run` answers.

The framework's `array` param type takes strings only. Checking whether the declaration format supports arrays of objects.

Found it: arrays of objects need a declared `param_type` with `item_base: object`. Fixing the declaration.

Core suite passes 11/11. Now the pane suite (jsdom, the real builder).

Pane suite 8/8 (executed, not skipped). Last suite: the real route and the next-turn notice in workerd — reading REQ-364's workers suite for its helpers.

Writing the workerd suite: real routes, consultant pins via a scripted model turn, client acts, next turn hears it, no turn started.

All three REQ-408 suites green. Now a broader sweep over every suite that touches the plan, priming, surface declarations, delegation, or the builder.

Many failures — need to know which are mine. Taking the baseline: running the same failing files in the main checkout (which doesn't have my changes).

Still verifying: the baseline comparison mis-fired (zsh passed the file list as one argument); rerunning it properly.

Only one new failure: BUG-205 pins the exact mode list (to prove there's no "looks" mode). REQ-408 deliberately adds Story, so I'll update that assertion and record the supersession on the ticket.

Now the workerd half of the sweep, with the same baseline comparison.

Delegation suites fail — possibly my brief change, possibly pre-existing (memory says delegation suites are red on clean working). Baselining exactly those files in the main checkout.

Workerd: all 13 failures are pre-existing (identical on the main checkout); nothing new from this change. Checking my notes on the version/promotion gate before committing.

Gate order noted (omit `--version`; the gate bumps itself). Checking the worktree diff before committing.

Updating the ticket body (appending an "As built" section; existing text preserved).

Ticket body updated. Committing on the branch (explicit paths).

Committed `c80b1bcd`. Taking the merge lock and merging back into xgd-working.

Concurrent change to `plan-surface.json` on xgd-working. Inspecting the conflict.

Both sides edited the same overview string: HEAD changed the stages sentence, and I appended a paragraph. Combining the two.

Resolved. Before committing the merge, re-running my suites plus the stage suites against the merged tree (HEAD also changed stage logic in `plan-core.ts`).

Merged (`9acfffe8`); `c80b1bcd` is now an ancestor of xgd-working. Moving the ticket to `free_coded`. I'm omitting `--version` so the gate does the version bump itself.

REQ-408 is built, merged into xgd-working and parked at `free_coded`. Its commits are `c80b1bcd` plus the gate's version bump to 0.2.530 (`dd5e5b5c`). The branch is cleaned up and the ticket body has a new "As built" section. I didn't need to ask you anything first; the decisions I made are below.

**What you get**
- **Story mode** sits beside View and Edit. While a site has no first draft, the preview opens on Story instead of the grey page, without saving that as the client's chosen mode. When the first draft lands, the preview switches to View so they see it.
- **Notes and themes:** each note shows its words, one emoji and its theme's colour, and hovering shows the sentence it came from. There are at most six themes, each with a written name and one of six muted colours.
- **Reactions:** ❤️ makes the note slightly larger and lifted, 👍 marks it, 👎 leaves it on the board but pale, and 🗑 deletes it. Only one reaction holds at a time, and clicking the same one again clears it.
- **Client notes:** the client adds a note by clicking a theme name and can edit any note.
- **Headline:** it starts as grey shadow text. Once options are offered it shows the consultant's pick in a dashed outline with `‹ 1 of 3 › · my pick · Choose…`. Once chosen it gets a solid outline, and a line the client typed is marked *your words*. A later offer shows up as "2 new options" and never replaces their choice.
- **Look:** the board uses only fixed colours and fonts, so the site's palette and fonts can't reach it. Notes have a slight tilt and fade in when pinned, with no fade under reduced motion.
- **Consultant tools:** she gets six new tools. One hard refusal applies: she can't reword or remove a note the client wrote, edited, ❤️'d or 👍'd. Headlines must be written from hearted notes, and an option the client passed over can't be offered again.
- **What she's told:** her next turn hears what the client did on the board, and nothing on the board starts a turn by itself. Every turn's plan summary says what "Getting to know you" still needs from the board. Her priming, tool descriptions and the opening message all mention the board.
- **`weakest_point`** falls due after the first draft and when Publish opens. Existing sites pick it up the next time their plan is read.

**Decisions I made where the ticket left room**
- **Builder briefs:** every brief to a builder gets the chosen headline and the hearted notes appended (up to 1,500 characters), not just briefs about copy. Telling which briefs "concern copy" would be a guess. This is the least-tested part: the builder-delegation test suites already fail on xgd-working, so only the appended text itself is tested, not the hand-off.
- **One existing test changed:** a BUG-205 test pinned the exact list of preview modes (to prove there's no "looks" mode). It now expects Story in that list too.

**Tests**
- Three new test files, 20 tests, all passing: plan rules and consultant tools, the builder pane, and the real routes through to her next turn.
- The plan-panel and preview-mode suites you named for regression pass.
- I compared every other failure in the wider run against your main checkout; all fail there too. That includes REQ-379's two builder-session tests, the delegation suites, and a group of chat-host suites.

**Merge:** another session had edited the plan tools' description file at the same time, so the merge conflicted there. I kept both edits and re-ran the tests before committing the merge.

**Something I found that isn't in this ticket:** a tool parameter declared as a plain list only accepts text. `update_brief`'s `audiences` asks the consultant for objects, so it is probably refusing every audience she records, and the refusal comes back as text rather than an error, so it's easy to miss. I hit this with `pin_notes` and fixed it there, and saved it to memory. Say if you want a ticket for `audiences`.

The ticket stays at `free_coded`; moving it to `ready_to_reconcile` is your call.

<!-- xgd-turn id="a1d155b3-e7b4-464c-a773-ca287491d215-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T15:43:47.645655+00:00" -->
#### You
Please create a ticket for the audiences issue

<!-- xgd-turn id="a1d155b3-e7b4-464c-a773-ca287491d215-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T15:44:27.833626+00:00" -->
#### Claude
I've filed the audiences problem as **BUG-223** (`bug-7b4972f5`), in `draft`, under the same epic as REQ-408.

- **Problem:** in the plan tools' description file, `update_brief.audiences` is declared as a plain list, which only accepts text. Its description tells the consultant to send items like `{"who": …, "priority": 1}`, so a call that follows it is refused. That refusal rejects the whole call, so anything else sent with it — other brief fields, the client's quote — is lost too. It comes back as the tool's reply text rather than an error, so she may not notice.
- **Fix:** declare an `item_base: "object"` list type and use it for `audiences`, the same way `pin_notes` was fixed in REQ-408. No change to the plan logic should be needed.
- **Test:** call `update_brief` through the real tool runner and check the audiences are actually stored. Checking only that the reply has no error text isn't enough, because the refusal arrives as text.

I checked that the declaration reads as described but didn't reproduce the refusal itself on `audiences`; it's inferred from the identical `pin_notes` failure. No code changed. The fix belongs in BUG-223's own session.

<!-- xgd-chat-end -->