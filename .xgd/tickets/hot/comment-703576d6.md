---
uid: comment-703576d6
id: COMMENT-5370
type: comment
title: Comment on request REQ-402
created_by: xgd
created_at: '2026-10-17T15:33:56.889394+00:00'
updated_at: '2026-10-17T15:42:20.702732+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4f7a263e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "afd771c8-465b-4231-9e92-d8f82793b0d7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="37a5dcc6-6ca8-4179-8d44-0e3e3e4c1515-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T15:33:09.466946+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="37a5dcc6-6ca8-4179-8d44-0e3e3e4c1515-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T15:42:20.658604+00:00" -->
#### Claude
Reading the existing looks carousel and how it's wired into the preview toolbar and panel.

Now the carousel's `wrap` option.

Now the band in `looks.js`, replacing the toolbar action.

Now CSS.

Re-pointing the REQ-391 / BUG-205 UATs at the band (this ticket supersedes their toolbar placement, dimmed state, stop-at-ends arrows and the old wording).

Writing the new UAT file.

All 22 pass (none skipped). Broader regression over every suite that mounts the builder:

Several failures look environmental (sandbox/browser). Baselining the same files in the main checkout (unchanged code) to separate pre-existing ones:

Updating the ticket body (keeping the existing content, appending what landed and the supersession note):

Committing, then lock and merge into xgd-working.

Merged. Now the gate (letting it bump the version itself), story points, and cleanup.

REQ-402 is done and parked at `free_coded`. The looks controls now sit in a band of their own at the top of the preview, and the band only exists when the page has looks. The new tests pass; I haven't looked at it in a real browser yet.

**What the client sees**
- **No looks on the page:** no band at all. Nothing dimmed, no space kept for it, and the page starts at the top of the pane.
- **Looks on the page:** a full-width band above the page, which moves down to make room. It appears and disappears as the page in the pane changes, in both View and Edit. It never shows in the comp viewer.
- **Left of the band:** `‹ Current · 1 of 3 ›`. Stepping now wraps round, so › from the last look goes back to Current, and the cross-fade comes from the side you stepped towards. Preloading the neighbouring looks still works.
- **Right of the band:** the look's description in full, wrapped and never cut short. For Current it says "Your page as it stands now." Under it is "Tell the consultant which look you prefer, and why." A comment beside that string records that it's a deliberate exception to DOC-66, so a later pass doesn't change it back to "your consultant".
- **Toolbar:** the looks control is gone from View and Edit, so the band is the only place to change looks. No looks mode, no "Choose this one" button, and the Page selector still never lists a look.

**How it's built**
- I reused the existing carousel component and gave it a `wrap` option. The comp viewer uses the same component without it, so its arrows still stop at the ends.
- The band is added just before the preview pane and removed when there are no looks. The pane itself never moves, because moving the preview iframe would reload it.

**Older tests changed on purpose**
This ticket overrides behaviour that REQ-391's and BUG-205's tests pinned: the toolbar placement, the dimmed control on pages with no looks, arrows that stop at the ends, and "your consultant". I updated those tests in the same commit and wrote this up in the ticket body.

**Tests**
- Six new tests in `tests/test_UAT_FC_REQ-402_looks_band.test.ts`, one per line of the test plan, all passing.
- I re-ran the 82 test files that load the builder or its stylesheet. Many of them can't load from a branch checkout, so I ran them in the main checkout with the change applied, then removed it.
- Nine tests fail with or without the change: AC1065, AC1070, AC961, AC963, AC977, BUG-52, BUG-53, REQ-127 and REQ-259. With the change, one that was failing before now passes: BUG-70's toolbar text-size check.

The work is merged into xgd-working in two commits: `ea2b181f` (the change) and `31c13171` (the version bump the gate made). The branch is cleaned up. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->