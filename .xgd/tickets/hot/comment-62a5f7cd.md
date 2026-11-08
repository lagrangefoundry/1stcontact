---
uid: comment-62a5f7cd
id: COMMENT-8010
type: comment
title: Comment on bug BUG-379
created_by: xgd
created_at: '2026-11-08T16:44:18.167244+00:00'
updated_at: '2026-11-08T16:52:56.925181+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5641c6e2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "dc55e54a-9f8b-4978-8481-5f920de00b63",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d5e6b2a9-735e-4a13-ae91-ddf028ee603a-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T16:43:04.775361+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="d5e6b2a9-735e-4a13-ae91-ddf028ee603a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T16:52:55.349596+00:00" -->
#### Claude
Not a duplicate (REQ-? 2a88fb08 is the original Payments feature this refines). Now mapping every consumer of the payments state before scoping the change.

Scope is clear and already in the ticket. Marking it `free_coding` and cutting the branch.

Now the core change in `stripe-connect.ts`.

Now the Settings section UI.

Updating the two REQ-641 UATs that pinned the superseded raw-key wording, then writing the BUG-379 UATs.

All new and updated UATs pass. Running the typecheck and the adjacent payments/shop suites now.

Green. Bumping the version and committing.

Committing the work first, then updating the ticket body before the merge-back.

Now the merge-back loop (lock → merge working in → bump → ff-merge → free_coded).

BUG-379 is fixed and merged into `xgd-working` as version 0.2.823. The ticket is at `free_coded` with commits `7588b46` and `bc24ed0`, and the branch is cleaned up. It isn't a duplicate: request-2a88fb08 is the original Payments feature, and this bug refines it.

**What the owner sees now in Settings → Payments**
- **Plain words instead of Stripe's keys.** A small table turns each kind of Stripe requirement into a sentence saying what's needed and who gives it. For example, "Photo ID for one of the people on the account (the owner or representative). Stripe asks for it to be taken live with a phone camera." Stripe's keys and the person ids inside them no longer appear anywhere in the response.
  - Several keys for the same person or the same kind of item become one line.
  - A key the table doesn't know shows "Stripe needs more information about the account." The raw key goes to the log as `stripe_requirement_unmapped`, so it can be added to the table.
- **It says whether payments still work.** The single "needs attention" state is replaced by three:
  - **Due by a date:** "Payments work. Stripe needs a few things from you by 21 November 2026."
  - **Overdue:** payments still work, but "Stripe may pause payments until this is done."
  - **Paused:** "Payments are paused …", with Stripe's reason in plain words.
- **It says where to go:** sign in to the Stripe dashboard and look for the banner at the top, with a link to the test or live dashboard to match.

**Behaviour change to be aware of:** Buy now stays on while something is due or overdue. Previously anything due turned payments off; now payments are only off when Stripe has actually paused charges. Buy, checkout and invoices all read this same answer. The ticket asked for this; I'm flagging it because it changes what customers can do.

**What I left out:**
- **The person's name isn't shown.** Getting it would mean a second call to Stripe every time Settings opens, so the line says "one of the people on the account" instead.
- **No direct link to finish the steps.** These Stripe accounts are connected through Stripe's sign-in flow, and for them the owner's own Stripe dashboard is where Stripe collects these details.
- **No change for the consultant or the Settings assistant.** They only ever got a yes/no on whether the business can take payments, never the raw keys.

**Tests:** six new `test_UAT_FC_BUG-379_*` tests pass. Five run against the real router and database with Stripe stubbed out; one checks the Settings section on screen. The typecheck is clean, and 12 related payments, checkout, shop and orders suites pass. I also updated two older REQ-641 tests that expected the old "needs attention" wording and raw keys; the ticket records that this fix replaces them.

<!-- xgd-chat-end -->