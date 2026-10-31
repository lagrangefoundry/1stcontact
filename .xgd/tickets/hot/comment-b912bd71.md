---
uid: comment-b912bd71
id: COMMENT-5863
type: comment
title: Comment on bug BUG-319
created_by: xgd
created_at: '2026-10-31T20:02:57.499601+00:00'
updated_at: '2026-10-31T20:46:49.579904+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-61df34dd
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f99988ef-f8fd-4f94-9173-aec41cfdb737",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-31T20:02:52Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-31T20:02:52Z" -->
#### You
I was given a look summary too early, before any comp sites had downloaded, and hearted it. When the sites arrived I commented; the consultant changed the look description and asked me to heart it again. The heart should not be available, and definitely not asked for, until all steps are complete and the comp sites are discussed or skipped. The sites were very slow to load and I only got 2. This is downloading a couple of pages and screenshotting the main one - it should be a few seconds each. Are we overdoing the capture complexity? Things the AI needs could be processed in parallel with me looking at and commenting on a site.

<!-- xgd-chat role="assistant" ts="2026-10-31T20:02:52Z" -->
#### Claude
Heart: the card shows its heart as soon as visual_concept is written, and direction_agreed's agenda line asks for it regardless of sites_settled; both facts finish other_sites with no order. Fix: no heart (and no edit-to-agree) until sites_settled, host refuses early agreement, agenda line does not ask before then. Capture: comps run the full fidelity import capture, 6 widths x rest/hover plus a screenshot ladder, height probes and hints, 15+ page loads, budgeted 5 minutes, blocking the consultant's turn serially. Fix: light capture (1280 + 375 screenshots, one extract pass), run in the background in parallel, tiles fill as they land, failures show on the tile. Two tickets under EPIC-19.

<!-- xgd-chat role="user" ts="2026-10-31T20:02:52Z" -->
#### You
2 tickets is good please file

<!-- xgd-turn id="bb2043d2-9ce9-4ec9-a51c-ecf221ed1c3e-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T20:34:37.087901+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="bb2043d2-9ce9-4ec9-a51c-ecf221ed1c3e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T20:46:46.889820+00:00" -->
#### Claude
Ticket is at `free_coding` and branch `free-BUG-319` is cut. Reading the direction/board code next.

Implementing in `plan-core.ts` now. After that come the board UI and the UATs. Existing tests that heart a direction with no comps settled will need their fixtures updated.

Now the board UI: in the forming state the card has no heart and no click-to-edit, and shows a "taking shape" marker.

Code changes are done. Next I'll make the worktree runnable and run the related suites to see which existing fixtures break.

As expected, 9 existing tests fail: they heart a direction while no sites are settled. I'll settle the sites in their fixtures (skip the board).

Fixtures fixed: 11/11 pass. Writing the BUG-319 UATs now.

Writing the UAT file.

6/6 pass. Now a broader regression sweep: every suite that touches the direction or comps, plus typecheck and lint.

Updating the REQ-432 on-the-wire fixture the same way, by skipping the board through the real route before the direction is written.

The wire UAT passes. Checking the four remaining failures against the pre-existing list.

All four fail the same way without my diff, so they're pre-existing; BUG-58 is the Chromium-in-sandbox limit. Running typecheck and lint.

Typecheck is clean. My memory notes say the plan entry sits near its 2,000-character cap, so I'll run the plan-reminder suites too.

REQ-428 also fails without my diff (a 5s timeout), so it's pre-existing. Moving on to version bump and commit. Checking the promotion gate notes first.

Updating the ticket body first: I'm keeping the existing content and adding what landed plus the design decisions.

The ticket body is updated. Committing on the branch, then lock, merge, bump and promote.

The Look summary no longer offers its heart, and the consultant is no longer told to ask for it, until every comparison site is commented on or skipped, or the client skips the board. BUG-319 is at `free_coded`, merged into xgd-working (version 0.2.714). I haven't deployed it, so dev and production still run the old behaviour until the next `bin/deploy`.

**What changed**
- **Before the sites are settled, the card shows the consultant's current wording** with "Taking shape — you can agree it once you've been through the sites". It has no heart, and clicking the text doesn't open it for editing (editing counts as agreeing). "Agree the Look summary" stays out of How you can help and isn't counted on the Input board.
- **The host refuses an early agreement.** A heart or edit sent from a stale tab or a script is refused with code `SITES_FIRST`, and `/api/plan/comp` answers 409. The board shows the reason beside the card. Going back to the previous version still works, and so does taking back a heart on a summary that was already agreed.
- **The consultant isn't told to ask early.** Until the sites are settled, its agenda says to keep the summary current as the client comments but not to ask for a heart yet. Once they are settled, the existing line asks for the heart, once, with the link.
- **A summary already agreed before this change stays agreed.**

**One decision I made that isn't in the ticket:** while the summary is still forming, writing or revising it is no longer announced to the client with a "New on the comparison board" link. Otherwise every revision during the comparisons would be announced as something to agree. The link arrives once the sites are settled, with the request for the heart. I've added this to the ticket body.

**Tests**
- 7 new tests in two files cover: one site still open, an early heart or edit refused, all sites settled, the board skipped, no sites yet, an already-agreed summary, and the 409 through the real route. All pass.
- Seven existing test files (REQ-432, BUG-302, REQ-478, BUG-265) agreed or announced a summary with no sites settled. I changed only their setup to skip the board first; their checks are unchanged, and the tests around the direction, comparisons and plan reminder pass.
- Five other tests fail, none because of this change:
  - Four fail the same way with my change removed: BUG-53, BUG-134, REQ-148, and a REQ-428 timeout.
  - BUG-58 needs a real Chromium, which can't launch inside the sandbox.

Typecheck is clean; prettier wouldn't run (an npm cache permission error), so formatting wasn't checked.

<!-- xgd-chat-end -->