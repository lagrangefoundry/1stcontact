---
uid: comment-f76b15ce
id: COMMENT-5531
type: comment
title: Comment on request REQ-418
created_by: xgd
created_at: '2026-10-20T18:30:29.083003+00:00'
updated_at: '2026-10-20T18:44:34.440873+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-e3a1fbb0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "14508a16-e9bc-4b08-99f7-e119d7489570",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e9636fa7-03d9-4e06-8774-bebcb0f12e73-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T18:29:56.225847+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e9636fa7-03d9-4e06-8774-bebcb0f12e73-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T18:44:33.860553+00:00" -->
#### Claude
I'm surveying the L1 schema and every place that dispatches on node kind, so I can size the table element before cutting the branch.

Still mapping the code: now finding where builders are taught the node kinds, so the new table element can be taught the same way.

Design is settled enough to proceed. Checking project conventions (CLAUDE.md) for test running and version bumps before cutting the branch.

Cutting the branch and marking the ticket in progress.

Branch is ready. Now the schema: adding the `table` kind to `schema.ts`.

Schema and shared child-walk helper are in; now wiring the helper into edit, validate, slots and email.

Site-schema typechecks. Now the renderer's `table` case.

Renderer done and typechecking; one exhaustive switch in the layout probes needs a `table` case.

Updating the page map (`segments.ts`) so a table and its cells show up with addresses the builder can write to.

Wiring the remaining tool walks to the shared helper, then typechecking everything.

Typechecks clean across site-schema, framework and tools. Now the teaching side: builder/consultant priming and the layout-check message.

Now the UATs. First checking how the layout check decides "sideways", so the narrow-mode test exercises it correctly.

Adding a line to the consultant's priming so its briefs ask for a table, then writing the UATs.

All 11 UATs pass. Now the regression scope: suites touching the L1 schema, validator, renderer, edit addressing, vocabulary, layout check and priming.

Investigating the reference-projection guard (BUG-48): it lifts each validator rule's doc comment from source, and my new rule isn't being picked up.

Every remaining failure reproduces identically on the untouched main checkout, so nothing in the 130-file scope regressed. Checking for any other copy of the changed finding text, then committing.

Now syncing the ticket body with what was actually built, before committing.

Committed on the branch. Now locking and merging back into xgd-working.

Ticket is at `free_coded` with both commits and version 0.2.557. Tearing down the branch.

REQ-418 is built, merged into xgd-working and parked at `free_coded`. It has two commits: the feature (`f6b641d9`) and the version bump to 0.2.557. I didn't need to ask you anything, so I made the design calls myself; they're listed below.

**What builders get:** a new L1 element, `table`.
- **Fixed width:** `columns` sets how many cells each row has, and each column can be aligned `start`, `center` or `end` (prices go `end`). The validator refuses any row, or the optional header, with a different number of cells. A missing value has to be an empty cell, never a shorter row. Up to 12 columns.
- **Cells are ordinary text nodes**, minus the settings that would place them outside their row (absolute positioning, pinning, layering). So text styles, palette colours, inline variation, links (checked against the usual URL rules), escaping and inline editing all work in cells without new code.
- **Narrow screens:** each table chooses `scroll` (the default: it keeps its grid and scrolls inside its own box) or `stack` (below 600px by default, each row becomes a card with every value labelled by its column heading). Either way, the page itself never scrolls sideways.
- **Output:** a real `<table>` with a header row, so screen readers read it as a table. It's styled with the existing settings: cell padding, a line between rows, the surface fill, and a text style for the whole table.

**Teaching:** builder priming now says price lists, opening hours and any "item and its values" list are a `table`, and explains the two narrow modes. The consultant's on-screen checklist says the same, and that a brief asking for one should say so. The builder's vocabulary lists `table` automatically because it's generated from the schema. The layout check's misaligned-rows message now says to build it as a table, and the check stays in place for pages built the old way.

**Design calls you may want to revisit:**
- **Cell addresses:** a table's cells are its children in reading order: header first, then each row left to right. So a cell has an address like any other node, and an edit writes into the cell's own row. One shared helper now answers "what is under this node", and the validator, edit tools, page map and similar code all use it.
- **No separate header text style:** header cells use the table's text style plus the header row's default bold.
- **`stack` hides the header row** on phones, because every cell is already labelled. Keeping it visible but hidden only from sight made the layout check report overlapping, cut-off text.
- **Layout-check change:** text inside a box that scrolls is no longer reported as "cut off" along the scroll direction. Without this, every `scroll` table wider than a phone would have produced a false finding and an unnecessary repair brief.

**Tests:**
- `tests/test_UAT_FC_REQ-418_table.test.ts` has 11 tests, all passing. They cover: the validator accepting and refusing tables; injected script in cells and headers staying inert; cell addressing and edits; the table's text style reaching every cell; priming and vocabulary; and real-browser checks at 375px and 1280px. Those show rows staying aligned with an empty first cell, and both narrow modes with no sideways scrolling and no layout-check findings.
- I also ran the 130 existing test files that touch the code I changed. The failures remaining in that set also fail on the untouched main checkout, so they were already failing: BUG-48 (4), REQ-285 (6), and one each in REQ-371, AC931, AC694, AC1320 and REQ-341.
- I added the new row-width rule to the BUG-48 test file, which checks every validator rule by name.

**Not done:** email pages still refuse tables. Capturing a reference site doesn't produce tables. Existing pages built as side-by-side columns aren't converted automatically.

The ticket body now records all of this, so it's ready for you to promote to `ready_to_reconcile` when you choose.

<!-- xgd-chat-end -->