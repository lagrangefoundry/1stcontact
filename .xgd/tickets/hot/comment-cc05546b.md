---
uid: comment-cc05546b
id: COMMENT-5369
type: comment
title: Comment on request REQ-403
created_by: xgd
created_at: '2026-10-17T15:33:48.669011+00:00'
updated_at: '2026-10-17T16:32:02.490575+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d3825c8a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1d2493d3-5cb8-4574-9788-9e5862aca3d0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b9e1451f-3ef6-4805-a370-7b882c14f946-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T15:33:04.654824+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b9e1451f-3ef6-4805-a370-7b882c14f946-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T15:39:27.092484+00:00" -->
#### Claude
Reading the ticket and the existing REQ-399 §4 code it replaces; next I'll map the preview, plan-panel and chat code.

Still mapping: looking for how the upstream SessionManager records turns, so the stock opening can be written as a real assistant turn without a model call.

Confirmed `postTurn(..., {role:'assistant'})` folds as a genuine assistant turn. Now checking the Anthropic backend builds a valid message list when the history starts with an assistant turn.I've mapped all three panes. Most of this I can decide myself, but one requirement conflicts with how the panel works today, so I need your call on it before I start coding.

**Question: the "Sites we're comparing" board.** On a new plan, the comps board (REQ-378/401) is an open item, and it's drawn in the OPEN QUESTIONS section from the start. So even with zero questions, OPEN QUESTIONS has something in it, and its heading shows. The headings already hide when their section is empty, so this board is the only thing stopping "neither heading shows at the start". I see three options:

- **(a)** Hide the comps board until the plan has at least one ask, or the board has entries or has been settled. Then nothing shows at the start. This is my recommendation, because it matches what the ticket asks for.
- **(b)** Keep the board visible from the start, and accept that OPEN QUESTIONS shows with it in it.
- **(c)** Show the board from the start, but outside both sections, with no heading, until it has entries.

**Decisions I'll make unless you object:**

1. **The opening is recorded as two turns, not one.** The upstream library builds the model's history window from the first *user* turn (`recentTurnPairs` in lagrange-framework). A conversation that starts with an assistant turn would have that turn dropped, so the model would never see the opening.
   - So clicking the button records a hidden cue as a user turn, then the stock text as the assistant turn, using upstream's existing `postTurn`. There's no model call and no spend.
   - The client sees only the assistant turn; REQ-399's existing filter already hides the cue. The model always sees the pair.
   - This needs no change in lagrange-framework.
2. **A new `POST /api/ai/opening` route replaces the `opening: true` branch of `/api/ai/prompt`.** It returns the recorded turn as JSON, or 409 if the conversation has already started. The pane then types the text out itself and shows the composer when it finishes. REQ-399 §4's prompt-driven opening and its tests are replaced, not kept alongside.
3. **"Nothing built yet" means the site still holds only the untouched starter page.** I'll keep seeding the starter, because a site with zero pages risks breaking publish, render and the editor. The server reports that state; the preview shows the grey "Your site will appear here as it's created." panel, and publishing is refused while it holds. `STARTER_HEADING` also becomes "1st Contact" spelling wherever it can still surface.
4. **"All done…" is deleted everywhere.** With no open asks, the count line is simply hidden. The REQ-379 UAT that asserts "All done" at zero gets rewritten to match.

Once you've chosen a comps option, I'll write these decisions into REQ-403's body, set it to `free_coding`, cut the branch and build it.

<!-- xgd-turn id="2020a3c3-8aa5-4502-a0bb-a15231981e34-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T15:56:34.829802+00:00" -->
#### You
The comps board is an "OPEN QUESTION" it should be treated like all the others. It should not appear until triggered by the AI

<!-- xgd-turn id="2020a3c3-8aa5-4502-a0bb-a15231981e34-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T16:32:02.446885+00:00" -->
#### Claude
Got it: the comps board stays hidden until the consultant raises it. First I'll check how the plan records comps, so I can find the trigger.

Branch cut. Checking the worktree can run tests before I start editing.

The fresh worktree is missing the gitignored `generated/` dir; copying it from the main checkout.

The REQ-399 workers suite fails in the fresh worktree. Checking whether it passes in the main checkout, to tell a location artifact from a real break.

Fails in the main checkout too, so it's not the worktree. Finding out what `/api/ai/session` actually returns.

The real failure is `lib.registerDefaults is not a function`: the installed `@lagrangefoundry/ai` doesn't match what host-core expects. Comparing the installed package with upstream source.

The workaround: shadow the shared store with the pre-BUG-83 `ai` build, verify, then delete it. First checking how the workers suite resolves `@lagrangefoundry/ai`.

Baseline is green against the staged build. Confirming `postTurn` with `role` exists in that version too.

Starting the server side. First, where the stage list and the `opening-turn` template live, so the stock message can sit beside them.

Now adding the stock opening message to `plan-seed.json`, beside `stages`.

Now the host side. Checking how `planSeed` is typed in plan-core, then rewriting `openingText` into a function that records the opening.

Updating `roles.ts`: `openingPrompt` becomes `openingCue`.

Now rewriting the host-core opening: `openingText` becomes `openConversation`, which records the two turns with `postTurn`.

Now the router: delete the `opening` branch of `/api/ai/prompt` and add `POST /api/ai/opening`.

Checking whether `/api/ai/prompt` is listed in any access or route tables the new route also needs to join.

No other tables reference it. Now the client: replacing `streamChatOpening` in `api.js` with a JSON call. Checking which JSON helper `api.js` uses.

Adding the CSS: centred start button, composer hidden while typing, and the typing class cleared on every repaint.

Now §2 and the comps trigger in `plan-core`. Reading the plan fields, the panel view, and the reminder lines.

Now declaring `ask_comps` in `plan-surface.json` and adding it to the `KeepComps` group.

Checking the consultant priming for comps guidance that should now mention `ask_comps`.

Now the plan panel: delete "All done", and gate the comps board on `comps_raised`.

Checking that the plan route passes the panel view through whole, so `comps_raised` reaches the client.

Now §1, the preview placeholder. Finding where the builder mounts the draft preview.

Both tests use the constant, so the spelling change is safe. Now reading the preview route and finding the publish route.

I'll put the publish refusal inside `publishSite`, so the route, the CLI and the consultant's tool all get it. Checking how `NoPublicAddressError` is defined and mapped, to mirror it.

Now the publish refusal: a `NothingBuiltError` beside `NoPublicAddressError`, raised in `publishSite` and mapped to 409 by the router.

Adding the placeholder page to the preview route and the 409 mapping for `NothingBuiltError`.

Server and client changes are in. Typechecking next.

Both projects typecheck clean. Next, the UATs. First looking at how existing suites drive a consultant plan operation, the preview route and spend, so I reuse their apparatus.

Plan for tests: a node suite for `ask_comps` via the real Toolbox, a jsdom suite for the panel and chat start, and a workers suite for the routes. Reading the REQ-401 panel harness to reuse.

Running the existing panel, chat and plan suites against my changes to see what breaks.

Not linked to any AC (only REQ-399's own ticket names them). Deleting the two REQ-399 §4 suites, since the behaviour they pinned is replaced, then writing the REQ-403 UATs.

Reusing apparatus for the workers suite: how BUG-43 calls the preview route, and which identity function seeds the starter.

Writing the three REQ-403 suites now, starting with the workers suite for the routes.

All 5 workers UATs pass against the staged library. Next, the node suite for the comps board trigger, driven through the real Toolbox.

Next, the jsdom suite for the panel and the chat start screen, mounted against the real builder and stylesheets.

Tightening one assertion: mid-typing, the composer must exist but be hidden, not simply be absent.

22/22 green, including the updated REQ-378/379/401 suites. Next, regression scope: finding suites that touch what I changed (priming, plan surface, starter, publish, preview, chat pane).

182 files is a lot, and vitest finds nothing past roughly 60 paths, so I'll run in batches of 45.

19 failures in batch 1. Pulling each failure's message to separate mine from pre-existing ones.

All 7 suspects fail identically on baseline source, so they're pre-existing. Running batch 2.

Batch 2 failures follow the same patterns. Baselining the ones not already explained (REQ-127, REQ-180, REQ-182, REQ-204).

Same 10 fail on baseline. Batch 3.

Batch 3 is dominated by `registerDefaults`. Baselining the three files not obviously explained by it (REQ-239 settings session, REQ-251, REQ-295).

Same 17 on baseline. Last batch.

Some workers suites now report `registerDefaults`, which shouldn't happen with the stub pointed at the staged build. Checking the stub.

With the staged build, all 7 now pass (35 passed, 5 skipped). Rerunning every other workers file that failed in batches 1 to 3 the same way, to rule out anything of mine hiding behind the drift.

In production the default transport is used, so `openConversation` is wired. Checking the tree for stray edits, e.g. `module-assets.ts`, which `1c assets` rewrites.

Tree is clean. Reading my notes on this project's version-bump and `free_coded` gate quirks before committing.

Plan: amend the WIP commit's message, sync the ticket body, then lock, merge, and run `move-to-free-coded` without `--version`. Checking whether recent commits here carry an attribution trailer.

Recent commits carry the trailer, so I'll include it. Amending the WIP commit with the real message.

Now syncing the ticket body. Re-reading it first in case it changed during the build.

Unchanged since I wrote it. Updating it to the implementation as it now stands.

Every UAT now traces to body language. Merging back: taking the lock.

Lock held. The main checkout has other sessions' uncommitted files, but none overlap my branch. Merging.

0 candidates, nothing to fix. Moving the ticket to `free_coded`, with no `--version` so the gate bumps the version itself.

The gate is taking a while (its own lock and bump). Checking its output.

Meanwhile, removing the staged pre-BUG-83 library from the main checkout's `node_modules` now that verification is done.

REQ-403 is now `free_coded` (it records the code commit plus the gate's own version-bump commit). Recording story points, then tearing down the branch.

I'll save one note for future sessions: the trick needed to verify behind the BUG-83 drift.

REQ-403 is built, merged into `xgd-working` and parked at `free_coded` (commit `4e61f1b8f6`, version 0.2.514, 8 story points). The branch and worktree are cleaned up, and the ticket body describes what actually landed.

**What changed**
- **Preview:** a site that still holds only its untouched starter page now shows a plain grey panel: "Your site will appear here as it's created." Once the consultant writes something, the page replaces it on the usual reload. Publishing that starter-only site is refused with a 409 (`NOTHING_BUILT`), whether from the toolbar, the CLI or the consultant's own tool. The starter heading is now spelled "1st Contact".
- **Question panel:** the "All done…" line is gone; with no open questions the count line is just hidden. The comps board is treated like any other question: it stays hidden until the consultant raises it with a new `ask_comps` operation. It also shows once a comp is on it or the board has been settled. Her per-turn reminder tells her it hasn't been raised yet.
- **Chat:** a new conversation shows only "Click here to start". Pressing it records the consultant's introduction (about 200 words) with no model call and no spend. The pane types the text out, then shows the text box. A reload shows the transcript instead of the button. The wording lives in `plan-seed.json`, next to the stage list it walks through.
- **How the opening is recorded:** it's stored as two turns, a hidden user cue and then her message. The upstream history window starts at a user turn and would otherwise drop the opening, so the model never saw it. The client sees only her message. REQ-399's model-driven opening is removed, including its two test suites.

**Changes to other tickets' tests**
- The REQ-379 test that asserted "All done" at zero now asserts the line is hidden, and is renamed `…_nothing_at_zero`.
- The REQ-378 and REQ-401 panel suites now mark their sample plans as having raised the comps board.

**Testing**
- 11 new tests across three files all pass. The REQ-378, REQ-379 and REQ-401 suites I changed pass.
- Most suites that open a conversation already fail on a clean checkout with `lib.registerDefaults is not a function`. Upstream lagrange-framework removed that function on 2026-10-10, and an existing ticket (bug-d672f592) tracks it. To get real results anyway, I ran against a temporary copy of the library from before that change, then deleted the copy.
- About 180 nearby test files were run. Every failure also failed without my change: the `registerDefaults` and older `logDir` library mismatches, the known REQ-180/204 failures, and errors that only happen when running from a worktree.

**Not done**
- Nobody has looked at it in a real browser; all the evidence is from simulated-page tests. Dev won't show it until someone runs `bin/deploy --env dev`.
- The `registerDefaults` mismatch still needs fixing in this repo (bug-d672f592). Until then, the normal test suite can't check any conversation code, including this.

Promoting REQ-403 to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->