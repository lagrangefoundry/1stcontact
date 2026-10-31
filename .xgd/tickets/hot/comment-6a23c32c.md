---
uid: comment-6a23c32c
id: COMMENT-5779
type: comment
title: Comment on bug BUG-302
created_by: xgd
created_at: '2026-10-27T20:22:52.821972+00:00'
updated_at: '2026-10-27T20:43:26.153026+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2b687d8f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "60849ed8-86d7-42e9-b6bc-c7ef5be3554e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-27T20:22:47Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-27T20:22:47Z" -->
#### You
On Dina 6 I am fighting with the look we are going for - I made changes several times and the original content returned every time - the consultant could not change it either.

<!-- xgd-chat role="assistant" ts="2026-10-27T20:22:47Z" -->
#### Claude
Every edit of the look card was a POST /api/plan/comp that got 400: compAction in api.js drops `text`, so the server refused it as empty. The consultant only tried the positioning card, refused CLIENTS_WORDS because it was hearted, which is the current design.

<!-- xgd-chat role="user" ts="2026-10-27T20:22:47Z" -->
#### You
I want that design changed - I need to discuss these things with the consultant; if it comes up with something better why am I forced to type its changes in manually. Also make sure the consultant terms track to what the user can see (it said summary card). And put The look we are going for at the top of the comparison board.

<!-- xgd-chat role="assistant" ts="2026-10-27T20:22:47Z" -->
#### Claude
One ticket: fix the save; let the consultant write a revision of either card after discussion (heart cleared, previous version kept, one-click restore, log names the author); consultant text uses the visible labels Your position and The look we are going for; look card first on the board.

<!-- xgd-turn id="b7ce154d-8200-4c8a-8ba3-6538f08cf5ef-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T20:26:02.690792+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b7ce154d-8200-4c8a-8ba3-6538f08cf5ef-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T20:43:22.956117+00:00" -->
#### Claude
Branch `free-BUG-302` is cut; I'm now mapping the code for the two client cards (save path, `CLIENTS_WORDS` guard, labels, board order) before changing anything.

Still mapping: I've found the save bug (`compAction` drops `text`) and the two refusal points. Now reading how the consultant's decision tool handles the look card.

I've mapped all four parts. Next I'm reading the two board UIs, then I'll make the changes.

I've read the code and the tests. Now writing the changes, starting with the server-side revision and restore logic.

Now editing story-core: the positioning card's revision, restore, and its visible name.

Now the story-core edits.

Now plan-core: the look card's revision and restore, the log entries, and the visible names.

Now the plan surface declaration: the new `client_said` parameter, the `CLIENTS_CARD` refusal, and the visible names.

Server side done. Now the browser: the `api.js` fix, then the two boards.

Good, the router already picks up the new actions. Now the `api.js` fix and the config labels.

Both boards now show the revision mark and a "Back to your previous version" button. Adding their styles, then writing the UATs.

Now running the existing card tests against the changes.

All six failures are the old card names or the old refusal, as expected. Retargeting them.

Retargeting the existing tests to the new names and the revision behaviour.

Now the new UATs. Checking how `api.js` builds its requests so the save test can go through the real transport.

Now the browser-side test for the save fix, the board order, and the one-click restore on both boards.

35 of 36 pass. One assertion left in my own labels test; checking it.

All new tests pass. Now checking other suites that pin the old wording, and typechecking.

The long file list hits a known vitest filter limit; running in batches.

Node and browser suites are green. Now the workers suites that touch the cards, and a typecheck.

Workers suites pass and `tools/generate` typechecks clean. Checking control-app types, then committing and merging.

Everything typechecks. Reading my notes on the free_coded gate before committing.

Committing the work on the branch first, then updating the ticket body.

Now updating the ticket body to describe what landed. I'm keeping the existing text and adding the design decisions and the final test plan.

The ticket body is updated. Now merging back, following my gate-order notes: lock, merge in working, bump, fast-forward, then promote.

All four parts of BUG-302 are done and merged into `xgd-working` (commit `0bd13c7c`, version 0.2.680). The ticket is at `free_coded`, and its body now describes what was built.

1. **Edits to the look card save.** `compAction` in `api.js` now passes the client's `text` along, so the server stores the new wording and the board shows it after the redraw.

2. **The consultant can revise a card the client owns.** This works for "Your position" and "The look we're going for".
   - To revise a card the client has hearted or edited, the consultant must quote the client asking for it or agreeing to it, in a new `client_said` parameter. Without that quote the write is refused with a new error, `CLIENTS_CARD`. This is how "never undo their choices" is enforced in code.
   - The card is marked "Revised by your consultant", the client's heart is cleared, and their previous version is kept.
   - A "↩ Back to your previous version" button puts that version back exactly as it was, heart and edited lines included. Its tooltip shows the previous text.
   - The plan's decision log records each revision: who wrote the new version, who wrote the previous one, and the client's words. Going back is logged too, and the consultant is told about it on its next turn.
   - Story-board notes are still protected as before.

3. **The consultant uses the names the client sees.** Every reminder, notice, refusal and tool description now says "Your position" and "The look we're going for". The consultant's instructions also gain a rule to name things by their labels on screen ("Your story board", "Sites we're comparing", and the two cards) and never invent names like "summary card". Tool and parameter names are unchanged.

4. **The look card heads the comparison board.** The order is now: the card, the consultant's note on the sites, the instructions, any error, then the sites. An error from editing the card shows directly under it.

**Decisions I made that you may want to revisit:**
- Only one previous version is kept. If the consultant revises twice before the client acts, the client's version is still the one they can go back to.
- Going back discards the consultant's revision rather than letting the client switch between the two. The log still holds the revised text.
- If the client said "you decide" about the look, the consultant can still rewrite it freely, as before.

**Tests:** two new test files cover the five scenarios in the ticket. The save test goes through the real `api.js` with only the network faked. Nine existing test files changed: most only for the new card names, while the REQ-425 and REQ-432 ones also cover the new revision behaviour. All the affected suites pass, and the typecheck is clean.

Dina's site runs on dev, which serves a fixed snapshot of the code. The fix won't appear on Dina's Diner 6 until someone runs `bin/deploy --env dev`.

<!-- xgd-chat-end -->