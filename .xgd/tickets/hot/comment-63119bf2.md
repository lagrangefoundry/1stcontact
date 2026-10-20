---
uid: comment-63119bf2
id: COMMENT-5534
type: comment
title: Comment on bug BUG-237
created_by: xgd
created_at: '2026-10-20T23:09:38.410067+00:00'
updated_at: '2026-10-20T23:16:34.290701+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-469de2b1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f445fcfc-54ee-43f1-94dd-653a0d4d831b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9dc4e78e-37df-4f28-914d-8641814ed5ec-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T23:08:47.143561+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9dc4e78e-37df-4f28-914d-8641814ed5ec-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T23:16:32.447623+00:00" -->
#### Claude
Now let me find the layout check code.

I'm working out how to render a real contact-form page in a browser for the UAT. Then I'll fix the checker.

Writing the UAT first to reproduce the false findings.

Keeping `real` identical to `SECTIONS_SCRIPT` and skipping a `<template>` section inside the per-section loop instead.

All three suites pass. Running the host-side suites that use the layout check as a regression check.

Everything passes. Checking my notes on this project's version and promotion gate before committing.

Following the recorded gate order: commit with no manual bump, lock, merge, then `move-to-free-coded` without `--version` so the gate bumps the version itself.

Now updating the ticket body (keeping the original report) before merging.

I've fixed BUG-237: the layout check no longer reports the contact form's hidden labels and honeypot as overlapping or cut-off text. The fix is merged into xgd-working and the ticket is at `free_coded`.

**Cause:** the check in `tools/generate/src/cli/ai/layout-check.ts` measured any text with a box. The form's hidden accessible labels and its honeypot use the standard screen-reader-only pattern: a 1px box that clips its content. The text inside still has full-size boxes, so each visible label "overlapped" its own hidden twin and each hidden label read as cut off.

**Fix:** stated in general terms, with no marker added to the contact form:
- **Hidden text is skipped.** Text inside a box of at most 1px that clips its content (or under such a box) is left out of every measurement. Any component using the same pattern is covered.
- **`<template>` sections are skipped.** Testing turned up one more false finding: the form's hidden success message (a `<template>`) was reported as a section that "takes no height". Section numbering is unchanged, so section addresses still match the ones `describe_page` reports.
- **`aria-hidden` alone does not cause a skip.** The ticket suggested it, but `aria-hidden` only hides text from screen readers. Visible text marked that way can still really overlap something, and that should still be reported. The honeypot is skipped because it's 1px and clipped, not because it's `aria-hidden`.

**Tests:** the new UAT `tests/test_UAT_FC_BUG-237_hidden_text_is_not_checked.test.ts` builds a real contact form with four visibly-labelled fields (text, tel, email, textarea) and checks it at 1280px and 375px. Before the fix it produced 36 findings, matching the ticket. After, it produces none. The existing layout-check and host suites (REQ-415, REQ-418, BUG-235) still pass.

**Ticket:** I added a "Fix (as implemented)" section and a test plan below the original report. Commits are `1000060a` (fix) and `1d7b57cf` (version bump to 0.2.559, which the gate made itself), with story points set to 1. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->