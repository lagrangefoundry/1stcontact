---
uid: comment-4df16ee9
id: COMMENT-3947
type: comment
title: Comment on request REQ-323
created_by: xgd
created_at: '2026-09-25T22:54:47.344046+00:00'
updated_at: '2026-09-25T23:13:38.405992+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-cd8a8c9e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "13eb3866-bb5e-46c2-b70c-130871ac8518",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6994cc25-d738-402c-b266-13bb2a6e2c9a-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T22:53:50.194562+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6994cc25-d738-402c-b266-13bb2a6e2c9a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T23:13:37.987490+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is thoroughly specified. Let me examine the code.

Now let me look at the existing tests.

Scope is clear. Let me set up the branch.

Now let me implement. First `page.ts`:

Now `console.ts`:

Environment artifact resolved. Now the one deliberately superseded assertion:

Now the REQ-323 UAT file:

Let me verify the assertions actually bite — negative control with the old document order:

Now the full regression scope for the console:

README claims are still accurate. Now bump the version and commit:

Now let me update the ticket body with the implementation decisions before committing:

Now merge back into `xgd-working`:

Done. REQ-323 is at `free_coded` with commit `ce6a15c`, merged into `xgd-working`, version 0.2.365.

## What landed

**`page.ts` — the document order**

Everything the operator touches or reads now renders after the iteration list, inside one `<div id="controls">`: the ⏸ hold block, the continuation group, the address row, its effect sentence, and the status line last. The list stays ascending; the continuation group keeps BUG-120's position; `notice`, `captured already` and `filings` stay above the list as read-once context. The id is exported as `CONTROLS_ID` so the markup and the redirect cannot disagree. One CSS rule (`scroll-margin-top`) — no border, because on a blank console that would be a line drawn across an empty page.

**`console.ts` — the redirect**

All fourteen `seeOther('/')` call sites become `seeControls()` → `/#controls`. The scope named four presses; in the code those four are twelve sites across four methods, and the remaining two are `/open` and `/iteration/N/recover`. Both also report through the same status line and can leave the page showing a chain, so a bare `/` would land them at a top of the page with nothing actionable on it — the exact complaint the ticket exists to answer. Leaving two of eight buttons on the old target would read as a bug to the next person. Only the artifact trailing-slash redirect keeps its own target, as specified. I recorded that widening explicitly in the ticket body.

**Prose**

"appends the next iteration to the chain **below**" → "…to the chain **this page is showing**" — position rather than direction, so it cannot go stale again. `[clear history]`'s "the iterations above are moved aside" is untouched and asserted still to read that way. Two doc comments that asserted the old geometry were corrected.

**Tests**

- `test_UAT_FC_REQ-323_controls_at_one_end.test.ts` — 7 UATs, one per numbered item. I checked the two ordering UATs against the old document order: they fail on it.
- `test_UAT_FC_BUG-120_...:245` inverted in place with a comment saying it's a deliberate supersession and naming the cost; its other five assertions untouched and green.

Regression: all 27 test files importing `tools/repro-console` — **291 passed, 7 skipped, 0 failed**.

One note on the worktree: two REQ-254 tests that spawn the real `1c` failed there until I copied `apps/control-app/src/generated/` across — a gitignored build artifact missing from a fresh worktree, not a regression from this change. They pass in the main checkout both before and after.

<!-- xgd-chat-end -->