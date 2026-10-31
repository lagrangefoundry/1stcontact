---
uid: comment-c0456922
id: COMMENT-5789
type: comment
title: Comment on request REQ-478
created_by: xgd
created_at: '2026-10-27T22:20:29.602698+00:00'
updated_at: '2026-10-27T23:58:24.597846+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-74aaa5ee
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "572ea897-54c4-40d1-8e06-e757128327f8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-27T22:20:24Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-27T22:20:24Z" -->
#### You
Is the card that says The Look we are going for the summary card? It needs a name so we can talk about it - it is the Look summary. Create a ticket to update the title and inform the AI.

<!-- xgd-chat role="assistant" ts="2026-10-27T22:20:24Z" -->
#### Claude
Filed: label becomes Look summary; consultant-facing text names it the Look summary on the comparison board; Your position stays distinct and is never called a summary card.

<!-- xgd-turn id="666864c7-085c-4e0f-b1d2-0e18acef7098-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T23:50:37.365642+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="666864c7-085c-4e0f-b1d2-0e18acef7098-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T23:58:22.627263+00:00" -->
#### Claude
Now let me find all the occurrences.

Found all occurrences: two label constants (`config.js`, `story-core.ts`), plan-surface text, host lines in `plan-core.ts`, and tests pinning the old label. Editing now.

Now retargeting the tests that pin the old label.

Now writing the two new UATs.

REQ-416's two failures were already there on clean xgd-working, so they aren't from this change. Next I'll update the ticket, commit and merge back.

REQ-478 is implemented and merged into xgd-working (`64c02a3`, version bump `3c39eb5`, 0.2.686). The ticket is at `free_coded` with 2 story points.

**What changed**
- **The label:** the card at the head of the comparison board now reads **Look summary**, and its accessible name matches. The How you can help line now reads "Agree the Look summary".
- **The consultant's wording:** every host line now calls the card "the Look summary" instead of `the “The look we’re going for” card`:
  - the reminder while the card waits to be hearted;
  - "Your client hearted the Look summary.";
  - the settled notice;
  - the line after it writes the card, whose suggested message is now "I've written up the Look summary: [the comparison board]";
  - the plan-log entries.
- **Plan-surface text:** it tells the consultant to call the card "the Look summary on the comparison board", never to invent another name for either card, and never to call "Your position" a summary.

**Choices I made**
- I took the example name out of the "never invent a name" rule. The old text quoted "the summary card" as the example, and quoting "the direction card" there would have put the banned phrase in front of the consultant.
- The stage guides (DOC-75) never named this card, so I didn't change them. Code comments that say "direction card" are internal names and stay.

**Tests**
- Both new tests are in `tests/test_UAT_FC_REQ-478_look_summary.test.ts`. One checks the label and accessible name on the real comparison board. The other checks that the plan-surface text and the host lines say "the Look summary", contain none of the old phrases, and never call "Your position" a summary.
- I updated the BUG-302, REQ-432, BUG-269 and BUG-265 tests to the new label.
- I ran 34 related suites: 142 tests pass. The 2 failures are in the REQ-416 worker/talker suite, which fails the same 2 tests on clean xgd-working, so they aren't from this change.

The dev environment serves a frozen snapshot, so you won't see the new label there until you redeploy it with `bin/deploy --env dev`.

<!-- xgd-chat-end -->