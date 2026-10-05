---
uid: comment-3e2e914e
id: COMMENT-5121
type: comment
title: Comment on request REQ-390
created_by: xgd
created_at: '2026-10-05T01:18:09.671189+00:00'
updated_at: '2026-10-05T01:37:44.563112+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-27e96a06
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1c4dfee4-6d0f-496c-b5ea-c35b9ee836c9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3949c665-d407-474c-b1a4-a540c15f26a7-user" -->

<!-- xgd-chat role="user" ts="2026-10-05T01:16:18.863509+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3949c665-d407-474c-b1a4-a540c15f26a7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-05T01:37:44.499749+00:00" -->
#### Claude
I'm reading the plan model (`plan-core.ts`) to see how `phase` is stored, checked and displayed before I replace it with stages.

Now the surface declaration, seed, and the control-app's plan.ts/tickets.ts.

I've mapped the plan model and the slow-call note code; now finding how the chat UI streams a turn and draws the stop button, so the working line can take the note from there.

I'm checking the existing tests for the progress line and plan panel so the new working line and tracker fit without breaking what's already pinned.

I'm checking whether the ticket store refuses a field the type no longer declares, so removing `phase` won't break old plans.

Now reading the seed, the panel's labels/CSS and the `/api/plan` route.

I have the full picture. Moving the ticket to `free_coding` and cutting the branch.

Branch is cut. Starting with the plan model in `plan-core.ts`: stages replace `phase`.

Now the core constants, types, migration, stale check and checks.

Next: the projections (`planPanel`, `panelView`), the digest, the `set_stage` operation and the `long_text` input.

Now the surface declaration: `set_stage` replaces `set_phase`, plus `long_text` in the input enum.

Now the control-app storage side: migrate a stored `phase` on read, declare `stages` in the type pack.

Now the working line's source: the cadence wrapper reports each announced slow call to the host, which puts a `working` event on the turn's stream.

Now host-core: record the note per site, and emit `working` on the turn's stream.

Server side is done. Now the browser: the working line in `chat.js`.

Now the plan panel: tracker, busy spinner, collapse, and the `long_text` editor.

Wiring it in `app.js`, then CSS.

Code is in. Typechecking now.

Those are the worktree's missing generated files (known, pre-existing). Filtering to errors in files I touched:

Clean. Now finding every existing suite that touches the plan, the panel, cadence or the chat pane.

Many of these mount the real webui chat, which only resolves from the main checkout. Checking what the worktree is missing.

Making the worktree runnable: copy the gitignored `generated/` artifacts and link the shared `@lagrangefoundry` packages in.

Now running the plan/panel/cadence node suites to see what my change broke.

Six failures, all the `phase` assertions this ticket supersedes. Updating them to the stages contract.

Now the two workers suites that pin `phase`.

Existing suites updated. Now writing the REQ-390 UATs; first checking how the panel tests mount and transport.

I'm now writing the REQ-390 workers UAT (working frame on the stream, legacy `phase` migrated on read). Checking whether the test site factory already creates a plan.

Now the node UAT for the stage operations, digest and long answers through the plan surface.

The refusal works; it just comes back as the schema's own error text. Loosening that assertion, and adding a check that the declared stage enum matches the seed list (so the two can't drift).

Node side passes. Now the browser UAT, mounting the real builder: tracker, spinner, working line, long answer.

The first look happened before the once-a-second tick. Waiting for a tick there too, which also proves the no-note line counts on its own.

Browser UAT passes. Now the workers suites (new REQ-390 file plus the updated REQ-356/379/386 ones).

All green. Running the wider set of chat, panel and plan suites for regressions.

Three suites look unrelated to my change (they assert the pre-REQ-388 two-argument prompt call). Confirming by running them against the original `chat.js`/`app.js`.

Same four fail without my change, so they predate this ticket. Files restored. Fixing the one real one, REQ-364's `view.phase`.

Adding one line to the consultant's priming about ticking stages (both copies of the `plan-panel` entry).

REQ-341 is a known pre-existing failure. REQ-357 forbids the display name as a literal in source — my doc comments say "Alice". Checking.

Passes. Re-typechecking, then reviewing the diff.

Everything's green. Updating the ticket body (keeping the existing text) before committing.

Ticket updated. Committing on the branch.

Committed. Taking the merge lock and merging into `xgd-working`.

Another session landed plan changes meanwhile; resolving the conflicts.

Combining both: REQ-389's `public_details` plus my `stages`, without `phase`.

Resolved. Before committing the merge, running the plan suites on the merged tree (with REQ-389's `public_details` alongside).

Merged. Moving the ticket to `free_coded` (letting the gate bump the version itself), then cleaning the branch.

REQ-390 is built, merged into `xgd-working` as `f3ab4c30ba` (version 0.2.495), and the ticket is at `free_coded` with an updated body. I didn't look at it in a real browser, so I haven't seen how much room the tracker takes up.

**What changed**
- **Stages replace `phase`.** The seven stages you approved are stored in the plan data. A new plan starts with "Getting to know you" in progress.
  - The consultant (and the coordinator) mark stages with a new `set_stage` operation, which replaces `set_phase`. Any order, skipping and reopening are all accepted.
  - Old plans are converted when read: the stage their `phase` meant is in progress and everything before it is done.
  - The consultant's per-turn digest lists the stages, and says "the stages are behind the build" when, for example, pages are built but nothing past "Getting to know you" has been started.
- **The tracker** is the first thing on the plan panel, a compact wrapping row: ✓ for done, ● and bold for current, ○ for not started. A ▾/▸ toggle collapses it to the current stage, and the browser remembers the choice. The current stage shows a spinner while a turn runs.
- **The working line** sits just above the composer for the whole turn and counts up every second: "Working · 0:42 so far". When the consultant hands off work or calls a slow tool, it changes to e.g. "Alice is building your home page · about 5 min · 2:14 so far". The name comes from `group-chat.json`. The red stop button is unchanged.
- **Multi-line answers:** questions can now take a long free-text answer, shown as a text box that grows and saves when the client leaves it.

**Decisions I made**
- **Only one stage can be in progress.** Starting one moves the marker. The stage it leaves goes back to "not started" rather than "done", because done needs the client's agreement. The digest tells the consultant to tick finished stages.
- **Hand-offs show the consultant's note as written**, since it already says roughly how long. Only slow tools get the "about N min" estimate.
- **A page reload mid-turn restarts the timer** from the reload, with no note until the next slow call.
- **The older "still working, elapsed N min" heartbeat line still appears** alongside the new working line. They overlap; I can remove the heartbeat if two lines is too much.

**Tests**
- The three new test files pass, in the branch and again on the merged tree.
- I updated the existing tests that asserted `phase` (REQ-356, REQ-364, REQ-379); the ticket body lists exactly what this replaces.
- The wider chat and panel test files pass, except five failures that aren't mine. Four (BUG-64, REQ-127, and AC1065/AC1070 in the assistant-pane test) fail the same way with my changes reverted. The fifth, REQ-341, is a delegation test that was already failing before this work.

The ticket is ready for you to move to `ready_to_reconcile` when you're happy.

<!-- xgd-chat-end -->