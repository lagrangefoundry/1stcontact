---
uid: comment-9048028b
id: COMMENT-7908
type: comment
title: Comment on bug BUG-374
created_by: xgd
created_at: '2026-11-06T20:07:04.885430+00:00'
updated_at: '2026-11-06T20:13:32.346439+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f253ae03
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8b9b7355-fc25-44a5-b62c-af1cca0e3999",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8e8769ff-a0b0-4ebe-878c-46558f5a51cb-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T20:06:32.320577+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="8e8769ff-a0b0-4ebe-878c-46558f5a51cb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T20:13:31.612121+00:00" -->
#### Claude
Not a duplicate. Cutting the branch.

Reading the existing checkout tests to model the new real-browser UAT on them.

Code edits are in; now regenerating the embedded module assets so the shipped `capabilities.js` carries the new client.

Assets regenerated; checking the diff is only my change, then writing the real-browser UAT.

Chromium needs `--single-process` in this sandbox; rerunning the browser UAT that way.

Three of four pass (the core checkout fix works in real Chromium). Debugging the scripted-navigation guard.

Test fixture bug (quotes in the `onclick` attribute), not the guard. Fixing.

Now a small UAT for the Zone name help text under this ticket's name.

Tests green. Updating the ticket body with what landed, then committing.

Ticket updated. Committing on the branch, then merging back.

Following the fast-forward ordering: bring xgd-working into the branch, bump the version there, then fast-forward.

BUG-374 is fixed and merged into xgd-working. The ticket is at `free_coded` with commits `9d31c340` (the fix) and `aa05ecd3` (version bump to 0.2.803), story points 3. It isn't a duplicate: BUG-283 handles clicked links only, and this bug is the checkout's scripted redirect.

**What changed**
- **Checkout in the builder preview:** when the checkout page is running inside the preview frame, pressing Continue opens a new tab straight away, so popup blockers let it through. When Stripe's address arrives, that tab goes there. The preview stays on the draft and says "Payment opened in a new tab." If the payment session can't be created, the tab closes and the usual error shows in the preview.
- **Published site:** unchanged. The buyer goes to Stripe in the same tab.
- **Other scripted redirects (point 3):** the preview now catches any script on the site that sends the page to another domain, and opens that page in a new tab instead. This uses the browser's Navigation API, which Chromium-based browsers have. In a browser without it, only the checkout fix applies. Form submissions are left alone, because the form's data can't follow it to a new tab.
- **Zone name help:** now uses the wording from the ticket. BUG-372's tests had pinned the old "Buyers don't see it" wording, so I removed that check.
- I regenerated the generated copy of the site scripts (`module-assets.ts`) so the published sites get the new checkout code.

**Tests:** 5 new tests, all passing in real Chromium. They cover the preview opening Stripe in a new tab, the published site staying in the same tab, a failed session leaving no tab and showing the error, a scripted redirect to another domain, and the Zone name help text. The neighbouring checkout, preview-link, shipping-editor and generated-asset suites still pass (36 tests). Chromium only runs in this sandbox with `CHROMIUM_LAUNCH_ARGS=--single-process`; without it the browser tests are skipped.

**Before it shows on dev:**
- Dev only picks this up after a redeploy (`bin/deploy --env dev`).
- If the browser blocks the new tab anyway, the checkout falls back to the old behaviour and hangs inside the preview again.

<!-- xgd-chat-end -->