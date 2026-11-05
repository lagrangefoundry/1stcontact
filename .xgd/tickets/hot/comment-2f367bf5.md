---
uid: comment-2f367bf5
id: COMMENT-5634
type: comment
title: Comment on bug BUG-283
created_by: xgd
created_at: '2026-10-25T19:29:05.070262+00:00'
updated_at: '2026-10-25T19:36:13.302234+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-3658c1aa
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5e673fb6-e155-4cdf-b174-768a8d2957f5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3fc0de0f-4d14-430f-b57b-47695357e8c7-user" -->

<!-- xgd-chat role="user" ts="2026-10-25T19:27:37.025662+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3fc0de0f-4d14-430f-b57b-47695357e8c7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-25T19:36:10.655533+00:00" -->
#### Claude
Scope is clear. Let me look at the preview's link handling.

Ticket's scope is clear; the fix goes in the preview panel's per-frame `load` hook. Next I'll start the branch and check the existing panel tests.

Now adding the click handler to the frame's `load` hook in `panel.js`.

Passing. Checking that the test fails without the fix, then running the neighbouring panel suites.

Commit the fix first, then update the ticket body, then land it.

Now landing: lock, merge working in, bump, fast-forward, promote.

BUG-283 is fixed and merged into `xgd-working`. In the builder preview, "Get directions" and any other link to an outside site now opens in a new browser tab, and the preview stays on the draft. The new tests pass and the neighbouring preview suites still pass. I haven't tried it in a real browser yet.

**The fix:** the change is in `makeFrame` in `apps/control-app/src/builder/panel.js`. Each time a preview frame loads a page, it now listens for link clicks on that page:
- If the link goes to another site (http or https on a different origin), the click is cancelled and the link opens in a new tab, as `target=_blank` with `noopener` would. All of the site's own pages are served from the builder's origin, so "another site" means exactly "not one of this site's pages".
- Everything else behaves as before:
  - links to the site's own pages, absolute or relative, still navigate inside the preview;
  - `tel:` and `mailto:` links work as they always did;
  - middle clicks and other non-primary clicks are not intercepted;
  - a click that Edit mode has already handled is not intercepted.
- The published site is unchanged.

The ticket mentioned using the preview's "existing link handling", but there wasn't any, so this handler is new.

**Tests:** `tests/test_UAT_FC_BUG-283_external_links_leave_the_preview.test.ts` runs against the real preview panel. It has 4 tests, covering the Maps link, links to the site's own pages, a click Edit mode has handled, and a `tel:` link. When I removed the fix, the Maps test failed and the other three still passed, which is right because those cases should behave the same either way. I also re-ran the BUG-248 refresh, REQ-248 page-control, REQ-115 builder-composition and BUG-192 suites: 36 tests passed. I couldn't run eslint or prettier because `npx` failed on a permissions problem in `~/.npm`.

**Ticket:** BUG-283 is at `free_coded` with commits `3803820e` (the fix) and `942408bf` (version bump to 0.2.641), and the body now describes what was actually built. The branch is cleaned up. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->