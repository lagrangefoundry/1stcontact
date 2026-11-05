---
uid: comment-74a273a3
id: COMMENT-5571
type: comment
title: Comment on request REQ-437
created_by: xgd
created_at: '2026-10-23T16:21:56.564034+00:00'
updated_at: '2026-10-23T17:05:21.826339+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-fbc174c8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "09ffd7e4-7ce9-4480-99e9-da7ffb30b7a5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-23T16:21:53Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-23T16:21:53Z" -->
#### You
One detail I want to change: we should now have these modes for the panel View | Edit | Input | Looks — can we make this into a single mode-switch matching our (Desktop | Tablet | Phone | Fit pane)? Ticket please.

<!-- xgd-chat role="assistant" ts="2026-10-23T16:21:53Z" -->
#### Claude
Filed REQ-437: the modes become one segmented control using the width switch's builder-segmented component (one shared builder for both), role=group named 'Preview mode', behaviour unchanged (order, setMode, offered-mode rule), old builder-toolbar__modes styling removed.

<!-- xgd-turn id="2ff9069a-6ccf-4bbc-ae34-eb3e418752c1-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T16:58:50.479531+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2ff9069a-6ccf-4bbc-ae34-eb3e418752c1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T17:05:19.868572+00:00" -->
#### Claude
Scope is clear; starting the branch and implementation now.

Writing the shared segmented builder in `toolbar.js` now.

Now the UAT. Checking how existing tests drive a `#show=` link and Playwright builder checks.

I'll base the UAT on the BUG-250 harness (it has Looks offered and link-following). Checking what `#show=` targets exist.

Writing the UAT file.

Regression scope (16 files, 109 tests, including REQ-388, REQ-419, REQ-433, BUG-250) is green, and Chromium did run the measurement. Quick lint, then commit.

Committing the work, then updating the ticket body before the merge-back loop.

Now the merge-back loop (lock → merge working in → bump → xgd-merge → gate).

REQ-437 is done and merged into `xgd-working`. The ticket is at `free_coded` with commits `dc00d167` (the change) and `b7bd1fa7` (version bump to 0.2.597).

**What changed**
- View | Edit | Input | Looks is now one joined segmented strip, styled the same as Desktop | Tablet | Phone | Fit pane.
- Both switches are now built by one shared function, `segmentedControl`, in `toolbar.js`, so the two can't drift apart. Each is a `role="group"` with a name: "Preview mode" and "Preview width".
- **Behaviour is unchanged:** same order, clicks still call `panel.setMode`, and Looks still only appears once a look set exists. The pressed segment follows the mode however it changes (a click, a `#show=` link or the host), because the toolbar is rebuilt on every mode change.
- The old `builder-toolbar__modes` CSS rules are deleted. I kept the class name on the group as a plain hook with no styling, because about a dozen existing tests find the mode buttons by it.

**Tests**
- The new `tests/test_UAT_FC_REQ-437_mode_switch_segmented.test.ts` has 4 tests, all passing. They check the group's name, order and Looks rule, the shared markup with the width switch, and that clicks and `#show=story` / `#show=looks` links move the pressed segment. The fourth runs in a real Chromium and confirms both switches' segments have the same height, font size and font family.
- I re-ran every test that drives the mode buttons, plus the REQ-388, REQ-419, REQ-433 and BUG-250 suites: 16 files, 109 tests, all passing.
- Lint did not run: `npx eslint` failed because npm's cache folder (`~/.npm`) has wrong ownership. The error suggests `sudo chown -R 501:20 "/Users/martin/.npm"`.

The ticket body now records what landed and what the tests cover. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->