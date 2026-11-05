---
uid: comment-913432cb
id: COMMENT-7334
type: comment
title: Comment on request REQ-640
created_by: xgd
created_at: '2026-11-03T21:55:20.743011+00:00'
updated_at: '2026-11-03T21:59:11.970019+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-214ab747
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "43dc2470-5eeb-4ce6-9113-da83f6f2752f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="30e13df2-42d3-4a30-aaa5-3a11d9ba8c5a-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T21:54:33.336563+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="30e13df2-42d3-4a30-aaa5-3a11d9ba8c5a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T21:59:11.617773+00:00" -->
#### Claude
Found the portal file and the existing REQ-183 portal test. Reading them now.

Small copy change in one file plus a test, so I'll use the session-lock fast path (no branch) and finish it this turn.

Now the copy edit.

Now the UAT file, reusing the REQ-183 suite's render path.

Text nodes abut without a space — fixing the regex, then checking whether the other failures predate my change.

REQ-640 and REQ-183 all pass. Checking whether the three REQ-180 failures involve my file or were already red.

Now the ticket body (adding a "What changed" section and keeping the existing content), then free_coded.

The "Closing your account" panel now matches the published Privacy Notice (DOC-85 §6 and §9). The new UATs and the existing REQ-183 portal suite pass; three REQ-180 vocabulary-guard tests fail, in files this change doesn't touch.

REQ-640 is at `free_coded` with commit `4183cb06` and version 0.2.748. It was a single-file copy change, so I did it on `xgd-working` under the session lock rather than cutting a branch; the lock is released.

**What the panel says now** (`apps/control-app/src/portal.ts`, `erasureSlot()`):
- **Payment records:** "Your invoices and payments, kept for 7 years from each payment, with you reduced to your name and billing address." The reason gives both the law and disputes: "The law requires some of these records, and a dispute about a payment can come up long afterwards. If one does, this record is what settles it, whichever side raised it."
- **A new "When it happens" heading** comes after the closing sentence, with two lines:
  - "Your information is hidden as soon as you ask, and deleted 30 days later, in case you change your mind. If you have already paid for something that is still running, it runs to the end of its term, and the 30 days start then."
  - "While a dispute, chargeback or unpaid balance is open, deleting the information about it can be paused until it is resolved."
- **Unchanged:** "Ask us and we will do it", the fingerprint and consent-dates items, and the closing sentence "…the three above are the whole of the difference". That sentence stays true because the timing lines sit below it under their own heading, so they don't read as a fourth thing kept.

Three wording choices of mine to check, since they go beyond the ticket's text:
- "in case you change your mind" comes from DOC-85 §6.
- "whichever side raised it" is my own phrasing, to keep the "why it is for you" framing.
- "When it happens" is a heading I added.

**Tests:** `tests/test_UAT_FC_REQ-640_erasure_disclosures.test.ts` has 5 UATs. They render the portal through the real site pipeline and read only the erasure panel. They cover each item in the ticket's test plan, check that the old "least the law allows" wording is gone, and check that the timing text comes after the three-survivors sentence.

**The REQ-180 failures:** they are in `builder/tenant-cost.js`, the `platformBusiness` names in `business.ts` and `hostname.ts`, and the `/api/plan` route. They have nothing to do with this change. I didn't re-run them without my edit; they're just in other files.

The ticket body now has a "What changed" section added below the original scope, so it's ready whenever you want to promote it to `ready_to_reconcile`.

<!-- xgd-chat-end -->