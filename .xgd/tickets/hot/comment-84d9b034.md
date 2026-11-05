---
uid: comment-84d9b034
id: COMMENT-5569
type: comment
title: Comment on request REQ-435
created_by: xgd
created_at: '2026-10-23T02:16:02.784300+00:00'
updated_at: '2026-10-23T16:35:20.641088+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-55a6a706
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "af236ca0-0f10-4c6d-86ce-1bd68bf5959f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-23T02:15:59Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-23T02:15:59Z" -->
#### You
It would be helpful to have a visual indicator on the site display that the site is being edited. The hero image was just temporarily removed as the page was edited, but it felt like things could be going in the wrong direction for a moment. Thoughts on an indicator?

<!-- xgd-chat role="assistant" ts="2026-10-23T02:15:59Z" -->
#### Claude
Proposed: hold the last finished version during a build and update once at the end, a pill naming the work, a brief highlight of changed sections, and an optional Watch live.

<!-- xgd-chat role="user" ts="2026-10-23T02:15:59Z" -->
#### You
Your solution is a bit complicated. What if we just put a semi-transparent spinner and text saying 'Updating' in the centre of the image?

<!-- xgd-chat role="assistant" ts="2026-10-23T02:15:59Z" -->
#### Claude
Agreed — filed REQ-435: centred semi-transparent spinner + 'Updating' over the preview from build start until the build finishes and the last refresh lands; cleared on turn end, stop or idle rejoin; refreshes continue underneath; non-blocking; View/Edit only; one status announcement; reduced motion keeps it still.

<!-- xgd-turn id="c092304f-b0fb-45cd-9b98-4d79036d752c-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T16:23:51.482855+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c092304f-b0fb-45cd-9b98-4d79036d752c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T16:35:19.405118+00:00" -->
#### Claude
Reading the builder app to find how build progress reaches the preview.

Still mapping the progress-frame contract (what marks a build vs. a plain reply).

Design settled. Starting the free-coding process: marking the ticket and cutting a branch.

Writing the overlay module.

Wiring the overlay into the panel and app now.

Adding the label next to the Looks preview labels, and the panel's refresh signal.

Now the CSS, beside the panel rules.

That spinner positioning is hacky — restructuring into one pill holding spinner and word.

Moving the live region out of the hidden subtree so screen readers reliably announce it.

Now the UAT. Looking for an existing jsdom test that drives a turn with `progress` frames.

Writing the UAT file.

Running the new suite.

Six pass on the first run. Fixing the CSS path, and tightening the announce-once check so it can't pass vacuously.

All 7 pass. Checking they aren't vacuous by disabling the show call and re-running.

Mutation check confirms the five positive tests depend on the code. Running the regression scope (BUG-248 plus neighbouring preview/chat/CSS suites).

Those two are the known fresh-worktree artifact (missing `control-app/src/generated/`). Copying it in from the main checkout and re-running them.

All green. Checking lint/format on the changed files.

No lint tooling in the repo. Running every suite that mounts the builder app, for wider coverage.

Seven failures — baselining those six files against clean xgd-working in the main checkout before blaming the diff.

Six are pre-existing on clean xgd-working. Checking the seventh (AC1038), which only fails in the worktree.

Font-serving 503 is the known worktree location artifact, unrelated to this change. Running the second batch.

Both pre-existing too. Reading my notes on the free_coded gate before committing.

Updating the ticket body with the design as built (keeping the existing content), then committing.

Committed `785b200`. Now the merge-back tail: lock, merge xgd-working into the branch, bump, merge, promote — as a retry loop.

REQ-435 is built, merged into xgd-working and parked at `free_coded` (commits `785b200` and the version bump `1001a37`, version 0.2.595). I didn't need to ask you anything first. It isn't on dev yet: dev only changes after `bin/deploy --env dev`, and I haven't run that.

**What the client sees:** while a build is changing the site, a dark semi-transparent pill sits in the middle of the preview with a spinner and the word "Updating". The page stays visible underneath and keeps refreshing as before. They can still scroll and click the page through it. It shows on View and Edit only, and comes back if they return there from Input or Looks.

**When it shows and goes:**
- **Builder the consultant delegated to:** it appears when the builder starts and goes once the builder has returned and the last refresh has loaded. So the consultant's report after the build has no overlay.
- **Consultant writing the page itself:** it appears on the first write and stays until that turn ends, because the turn may write again.
- **Stop, turn end, or a reload that finds the turn already over:** it goes.
- **A reply that writes nothing:** it never appears.
- **Safety net:** if the final refresh doesn't load, it goes anyway about 8 seconds after the build ends (the 3-second refresh interval plus 5 seconds), so it can't get stuck on screen.

**Accessibility:** a screen reader hears "Updating" once per build, not on every refresh. With reduced motion the spinner stays still and only the word shows.

**Decisions I made along the way:**
- **Change outside this feature:** a test can now supply its own "rejoin" connection to the builder. The rejoin test needed it, and it doesn't change how the live builder behaves.
- **Spoken text kept separate:** the spoken "Updating" sits in its own hidden region, apart from the visible pill. Otherwise screen readers might miss it when the pill appears.

The ticket body keeps everything that was there, plus a new "As built" section describing the above. I set story points to 3.

**Tests:** the 7 new tests pass. With the line that shows the overlay switched off, the 5 tests that expect it fail, so they do test the feature. I re-ran the BUG-248 refresh tests and 22 nearby preview and chat suites (110 tests), all passing, plus 80 more builder suites. Those had 9 failures: 8 fail the same way on clean xgd-working, and the 9th is a font-loading check that fails in the temporary branch folder and passes in the main checkout.

<!-- xgd-chat-end -->