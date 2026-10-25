---
uid: comment-dafd81d9
id: COMMENT-4905
type: comment
title: Comment on bug BUG-202
created_by: xgd
created_at: '2026-10-04T20:54:42.204301+00:00'
updated_at: '2026-10-04T21:29:45.795718+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c3394ee4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f54f9e07-4479-4f4b-a15e-84f09ecf5d38",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0af85889-0a53-4dea-bfab-2925811ab32d-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T20:53:52.290229+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0af85889-0a53-4dea-bfab-2925811ab32d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T21:29:43.844804+00:00" -->
#### Claude
Reading the capture pipeline (navigation, fold, comp board) to scope the fix before cutting the branch.

Still mapping the design: how comp screenshots are served and how client-added comps reach the consultant's turn.

I have the shape of the fix; checking the existing comp-method UAT and priming size limits before cutting the branch.

Branch cut; now editing the two browser drivers so navigation waits for `load` plus a bounded quiet period instead of `networkidle`.

Navigation, retry and inline-URL fixes are in. Next: making a failed L1 fold non-fatal, and dropping out-of-range `viewportResponse` factors in the fold.

Fold failures no longer fail the capture. Now adding the fold pass that drops out-of-range `viewportResponse` factors.

Fold fix done. Now building the comp tile — checking the chat's image styling so a full-page screenshot shows as a hero-sized thumbnail.

Wiring the tile composer into the comp board now (plan-core), then the host side (snapshot URL, client-added notices).

Now the plan-core changes: tile composer, `display` on `add_comp`, and the client-added notice.

Tiles for consultant- and client-added comps are wired. Next: `capture_site` reports the fold warning, and a failed capture still hands back a link-only tile.

Code paths done. Now the method change (fix 3): priming and DOC-64 tell the consultant to search in the same turn it asks, and to show each comp's tile.

Now the UATs. First checking whether real-browser capture tests can run in this sandbox (the never-idle-network case needs Chromium).

Writing the UAT file now, starting with the fold cases, then the tile and capture cases.

All 7 pass. Checking the fold test actually fails without the fix (so it isn't vacuous).

The fold test reproduces the reported error without the fix. Now the real-browser case: a page whose network never goes idle.

Chromium can't launch with default args in this sandbox (known). Retrying with `--single-process`, which a prior session found works here.

Captured correctly but took 36 s — something else still waits. Profiling where the time goes.

Navigation itself is now ~6.5 s; the 30 s is in the driver's `close()`. Looking at it.

Busy-page UAT passes in ~6.6 s. Confirming it fails with the old `networkidle` navigation.

Both navigation UATs discriminate. Now a UAT for the client-added comp path (notice → tile), checking how the REQ-378 workers suite drives it.

All 7 pass. Now the wider regression scope: every suite touching capture, egress, fold, drivers, priming, comps and plan notices.

Now updating my failed-capture UAT so its fake browser "takes" the 30 s timeout via a faked clock.

Fixed. Running the last batch, then baselining the remaining failures against the clean checkout.

Priming wrap fixed. Now baselining the remaining failures (REQ-308/333/350/371/211/269/295 and the "no driverFactory" ones) on the clean xgd-working checkout.

Plan: commit on the branch, update the ticket body and DOC-64, lock, merge into xgd-working, then `move-to-free-coded` without `--version` so it bumps inside its own lock. Committing first.

Before committing, a typecheck of the touched packages.

Typecheck clean. Committing on the branch.

Now DOC-64's comp-review paragraph (a doc ticket, edited through `xgd`).

DOC-64 updated. Now the ticket body: I'll keep everything already there and append a "What landed" section covering the decisions made during implementation.

Ticket body updated. Taking the merge lock and merging into xgd-working.

Merged cleanly. Re-running the BUG-202 UATs and the touched comp/priming suites on merged xgd-working, since other sessions' work has landed in between.

All 50 pass on the merged tree. Moving the ticket to `free_coded` (letting the gate do the version bump itself).

Ticket is at `free_coded` with both commits and version 0.2.492. Setting story points to 8 to match the final scope, then tearing down the branch.

BUG-202 is fixed and at `free_coded`. The code is merged into xgd-working (commit `5e50623d`, plus the gate's version bump to 0.2.492) and the branch is cleaned up.

**What changed**
1. **Busy sites capture.** Both browser drivers now wait for the page to load, then up to 3 s for the network to go quiet, then capture anyway. Before, they waited for the network to go fully idle, which chat and review widgets never allow.
   - While testing I found a second slowdown: a connection the page holds open (like a chat widget's) made closing the browser wait ~30 s. A capture opens about 20 pages, so this is the likeliest cause of BUG-204's 20-minute turn. Drivers now leave the page before closing.
   - Retries stop once 30 s has gone in total. A quick failure such as a dropped connection still gets 3 tries, as BUG-67 requires.
   - Captures now present a normal browser identity instead of "HeadlessChrome".
   - Inline `data:` images are no longer counted as refusals. They were also being blocked, which broke those images.
   - BUG-204's "crawl" isn't one: `pages: 12` counts the screen widths captured for a single page.
2. **A failed fold no longer costs the comp.**
   - The screenshots, page facts and description still land. The failure is recorded in the bundle, on the reference ticket and in `capture_site`'s result.
   - Separately, the fold now drops movement factors beyond the ±10 limit rather than clamping them, so the expertplumbingca-type page folds validly.
3. **Comp tiles.**
   - `add_comp` hands the consultant a markdown tile: the hero thumbnail, the name and host, and "Open the real site ↗".
   - Comps the client adds show up in the consultant's next turn as tiles, once.
   - A comp with no screenshot gets a link-only tile marked "couldn't take a snapshot".
   - Small CSS addition: a thumbnail shows as a hero-sized crop rather than a full-page sliver.
4. **Search as well as ask.** Both priming profiles and DOC-64 now tell the consultant to search in the same turn it asks the client. The client's sites add to its own picks rather than replacing them.

**Decisions you may want to revisit**
- A capture that fails outright is **not** put on the comp board; the board is still a set of captures, as REQ-378 designed. Its error message carries the link-only tile so the consultant can still show the real site. A blocked unsafe address is never linked.
- This overrides REQ-361's UAT on one point: its example of a refused request used `data:` URLs, and now uses `ftp:` ones.

**Tests**
- New BUG-202 UATs, including a real-Chromium one. A page that never stops polling the network now captures in ~6.6 s; with the old wait it fails with "Timeout 30000ms exceeded". Two tile tests were added to the REQ-378 worker suite.
- I ran 178 related test files (not the full suite). Everything passes except 14 tests that fail the same way on clean xgd-working, so they were already broken.
- Running real-Chromium tests in this sandbox needs `CHROMIUM_LAUNCH_ARGS=--single-process`.

**For you**
- DOC-64's change only reaches deployed sessions after a `1c kb build`.
- Promoting the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->