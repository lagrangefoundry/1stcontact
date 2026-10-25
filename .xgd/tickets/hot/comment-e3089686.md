---
uid: comment-e3089686
id: COMMENT-5533
type: comment
title: Comment on request REQ-419
created_by: xgd
created_at: '2026-10-20T23:09:35.426158+00:00'
updated_at: '2026-10-20T23:33:31.664873+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a71bd8f1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "74d88824-6f82-430a-a67b-bd1058c89787",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="50d04453-47c8-4b76-8adc-1429eea947be-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T23:08:44.734028+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="50d04453-47c8-4b76-8adc-1429eea947be-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T23:22:41.371579+00:00" -->
#### Claude
I'm reading the builder's pane-mode code (app.js, panel.js) to see how a mode can be hidden on the toggle until the comp board is raised.

Still mapping the code: the comp viewer, plan panel's comp board, and the chat's `#show=comp` link path. Next I'll create the branch and write the new Comparisons mode.

Branch `free-REQ-419` is cut; now reading the existing comp tests to know which to rewrite before I write the new `comparisons.js` mode.

Server-side has no captured icon, so the fallback tile will show name and address (and swap in if the image fails to load). Now checking config strings and CSS that need moving or deleting.

Now the CSS for the viewer and the panel comp board.

Design settled. Writing the new `comparisons.js` mode now (it takes over the panel's comp board code), then I'll wire it into app.js, the toolbar toggle and the progress-bar tip.

Now config strings: delete the viewer's, add the mode's.

Now stripping the comp board out of the plan panel and adding the stage-tip link.

Now wiring app.js: swap the viewer for the Comparisons mode.

Now panel.js (drop `transient`, document `offered`) and the toolbar toggle.

Now the CSS: replace the comp board and viewer rules with the Comparisons grid in place.

Code is wired; now checking the consultant's priming text, which still says the comp board is on the panel.

Source changes done. Now the tests: a new REQ-419 suite, and updating the REQ-378/391/388/401/408/413/BUG-205/BUG-236 tests that pinned the viewer or panel board.

Now the new REQ-419 suite, driving the real builder in jsdom.

All 10 new tests pass (executed, not skipped). Running the regression scope: plan-panel, story, mode, looks, show and BUG-236 suites.

The palette-popup failure (AC1249) also fails on the clean main checkout, so it's pre-existing. The REQ-403 one pins the panel board, so it needs updating to the new home.

Regression scope is green (the one palette failure is pre-existing on main). Now I'm reading my notes on this project's commit/merge gate before committing.

Committing now. First I'll append an implementation section to the ticket body, keeping what's already there.

Committed `b85d5067`. Now lock and merge into xgd-working.

REQ-419 is done and merged into xgd-working. The ticket is at `free_coded` with two commits: `b85d5067` (the work) and `ecc89708` (the version bump to 0.2.560). The branch has been cleaned up.

**What the client sees now**
- **Comparisons is a fourth mode on the toggle**, after Story. It only appears once the consultant has raised the comps. It works and is remembered like the other modes, and like Story it shows only the toggle (no edit, pages, colours or Publish). There's no "Back to your draft".
- **Every comp is a tile in one grid**, with a line above inviting the client to open each site and look around. Each tile has:
  - a thumbnail of the top of the home page;
  - the site's name and address;
  - **"Open the site ↗"** — it and the thumbnail open the real site in a new tab;
  - who added it, and Remove;
  - likes and dislikes, with the per-site Done.
- **Under the grid:** add a site by address, and "I've finished commenting". These still go through the same route to the consultant as before.
- **A bad picture still gives a full tile.** If there's no screenshot, or the image fails to load, the thumbnail's place shows the name and address instead.
- **Ways in:** clicking a comp card in chat switches to Comparisons and highlights that comp's tile. The "Looking at other sites" stage explanation has a "See the sites we're comparing" link. Clicking a stage still never changes it.
- **Gone:** the comp viewer, its `comp` mode, the panel's "Sites we're comparing" item, and the strings and CSS only they used.

**Decisions I made that you may want to check**
- **Skip moved to Comparisons.** The ticket didn't list it, but it was part of the panel item and is the client's only way to decline comps.
- **The stage explanation now stays open while the pointer is on it.** Without that, the link couldn't be clicked with a mouse.
- **No site icon on the fallback tile.** Captures don't record one today, and the ticket says the capture isn't changed.
- **I updated the consultant's wording** in `plan-surface.json` and `priming.json` so it no longer says the comps are on the client's panel. The tools and how they behave are unchanged.
- **A site whose comps were never raised drops back to View** if it would have opened in Comparisons (remembered from another site).

**Tests**
- **New suite:** `tests/test_UAT_FC_REQ-419_comparisons.test.ts`, 10 tests driving the real builder. All pass and actually ran rather than skipping.
- **Old tests that pinned the viewer or the panel's comp item:**
  - Deleted: the REQ-378 viewer suite, REQ-391's comp-carousel test, REQ-388's comp width test, and REQ-401's comp-item test.
  - Retargeted to the new mode: the BUG-236, REQ-413 and REQ-403 comp tests.
  - Mode lists updated: BUG-205 and REQ-408.
- **Regression:** the plan-panel, story, mode, looks, show, prompt-text and `workers` comp-board suites all pass, including the socket-based `workers` ones.
- **One failure that isn't from this change:** `reconciliation-palette-popup-surface` AC1249 also fails on the clean main checkout.

The ticket body now has an implementation section describing all of the above, so it's ready to promote to `ready_to_reconcile` whenever you want.

<!-- xgd-turn id="bf7c0f19-fbfe-4961-b3cc-71ca03c9e392-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T23:32:06.616151+00:00" -->
#### You
REQ-214 is done, please give me the follow on ticket.

Another detail - when the consultant starts working, the send button becomes a stop button. That is incorrect. It should only be a stop button if the talker is running and only the worker is running at that point. This is confusing to the user - they need to know to typoe despite the stop sign

<!-- xgd-turn id="bf7c0f19-fbfe-4961-b3cc-71ca03c9e392-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T23:33:24.568519+00:00" -->
#### Claude
The send/stop swap is drawn by the upstream `webui-chat` composer, so I'm checking how it handles `turnModes.talk`.

The cause is upstream, in `webui-chat`. Before filing I'll check lagrange-framework doesn't already have a ticket for it.

I took "REQ-214" to mean REQ-419: REQ-214 is an empty, abandoned ticket called "Tool for REQs and BUGs". I've filed the follow-on as **BUG-239** (`bug-f8800a8e`), "Chat composer: Stop shows while only the consultant's worker is running". It's at `draft`, high priority, medium severity.

**Why it happens:** the fix isn't in 1stcontact. The Send/Stop button belongs to the shared chat component (`@lagrangefoundry/webui-chat`) from lagrange-framework. Its rule hides Stop only once the "consultant is building" status panel is showing. In the moment between the consultant starting work and that panel first appearing, an empty message box shows Stop, even though only the worker is running.

That contradicts lagrange-framework's own REQ-210, which says the composer shows Send during a worker round. The fix there is a one-line change: when the session has a talker, show Stop only while the talker is replying.

1stcontact can't fix it on its own side. The only option the chat component gives it would also remove the Stop for a talker's reply.

**What the ticket covers:**
- **The behaviour:** Send whenever only the worker is running; Stop only while the talker is replying, and it stops just that reply; "Stop building" stays the only way to stop the worker.
- **The cause:** the exact rule in the chat component and the line that fixes it.
- **The tests:** a test to add in 1stcontact once the fixed component is installed.

Implementation belongs in BUG-239's own session. Nothing in REQ-419 changed.

Decision for you: the actual change has to happen in lagrange-framework. Do you want me to file the matching ticket there, cross-referenced to BUG-239?

<!-- xgd-chat-end -->