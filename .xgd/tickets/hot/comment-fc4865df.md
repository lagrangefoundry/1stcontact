---
uid: comment-fc4865df
id: COMMENT-5545
type: comment
title: Comment on bug BUG-246
created_by: xgd
created_at: '2026-10-21T18:22:59.157263+00:00'
updated_at: '2026-10-21T18:41:13.250235+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-add573b7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "aa06306f-ce58-4c5c-85da-5238873d46b6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="52cad799-f7d1-461c-8a95-d95770028583-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T18:22:08.441987+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="52cad799-f7d1-461c-8a95-d95770028583-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T18:41:11.692802+00:00" -->
#### Claude
I'm reading how the client's width reaches the consultant today (REQ-388) so the current view can travel the same path.

Found the shared `ClientView` contract in `roles.ts`; reading it and the digest that states the width.

Design is clear; I'll put the status at free_coding and cut a branch.

Writing the shared pane vocabulary module and the opened-views record.

Wiring the record and the pane report into the builder's `app.js`.

Browser side done; now the server contract in `roles.ts` and the digest line.

Now the UATs. Checking how the REQ-413/REQ-388 builder suites mount the builder and capture what a prompt sends.

Builder side passes. Now the host-side UAT: the digest states the pane, and the priming carries the rules.

Two declared orders (with/without corpus) each hold the entry; applying the same edit to the second.

Both UAT files pass. Running the adjacent regression scope.

REQ-285 is a known pre-existing failure (the test passes `logDir` where upstream now reads `junctions`). Checking the REQ-388 one, which is likely mine.

The REQ-388 test pins the exact `view` shape; BUG-246 deliberately extends it, so I'll loosen that assertion to `toMatchObject` (still pins width and setting).

Test runs rewrote `module-assets.ts` (known artifact); I'll revert it. Then try the workers suites for the route.

Regression scope is green apart from the known REQ-285 failure. Updating the ticket body (appending, keeping existing content), then committing.

Committed. Now lock and merge into xgd-working.

The gate bumped the version itself (0.2.571) and recorded both commits. Cleaning up the branch.

BUG-246 is done and merged into xgd-working. The ticket is at `free_coded` with both commits recorded: the change itself and the gate's version bump to 0.2.571. It's ready for you to move to `ready_to_reconcile` when you want.

**What the consultant now gets each turn:**
- **Which view is open.** Every message's view now says which view the client has open: View, Edit, Story, Comparisons or Looks. A look open in View or Edit counts as Looks. With Comparisons open, it also says how many sites are on the comparison board. The per-turn summary the consultant gets shows it next to the width line: "The client is looking at: Comparisons (4 sites)." Turns that report no view say nothing about it.
- **Views never opened.** The builder remembers, for each business, every view the client has ever had open. This includes Story when the builder put it up before the first draft. The record survives a reload. The summary adds a line such as "Not yet opened: Edit, Story." Only views currently available count, so Comparisons appears only once the comparison sites have been brought up, and Looks only when the page has looks.
- **Bad reports are refused.** The server checks the new fields: an unknown view name, a negative count or an unknown entry in the unopened list makes the message's view invalid, and the server refuses it.
- **New instructions.** The consultant's standing instructions on bringing the right view to the client gained four rules, in both versions of the instructions:
  - When it refers to a view the client isn't looking at, it includes a link to that view rather than switching to it.
  - The first time it points the client at a view they've never opened, it adds one line on where that view is.
  - It switches the view only right after making something new, and only when the client isn't in the middle of something.
  - It names things exactly: "the story board" and "the comparison board", never "the board" on its own.

**Design choices I made:**
- The view names live in one new file, `client-pane.js`, used by both the toggle labels and the consultant's summary, so the two always match.
- The record of opened views is kept in the browser's builder storage, keyed by site, the same way the preview's width setting is remembered. It isn't stored on the server, so a client on a new browser or device starts with nothing marked as opened.

**Tests:** two new test files cover the builder side and the consultant side, and all six tests pass. Nearby tests also pass: the width, show-the-client, Comparisons, Story, looks and instruction checks, including the route tests that run in the Workers runtime.
- I changed one existing test, `test_UAT_FC_REQ-388_preview_width`. It required the message's view to be exactly the width fields; now it requires only that they're present, since the view carries more. The ticket notes this.
- `test_UAT_FC_REQ-285_the_page_arrives_with_the_turn` fails with an error about an old `logDir` option, which comes from the shared AI library rather than this change. It was already failing.

I added a section to the ticket describing what was built and how it's tested, and left your original text as it was.

<!-- xgd-chat-end -->