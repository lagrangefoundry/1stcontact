---
uid: comment-addf5a62
id: COMMENT-8030
type: comment
title: Comment on bug BUG-386
created_by: xgd
created_at: '2026-11-08T20:29:45.787831+00:00'
updated_at: '2026-11-08T20:45:48.697971+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8ec8df32
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5c91dfab-dcc7-4c4d-b76c-fa567f7174ab",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dc34eddd-ceb3-4cfc-aa63-b071cf6c7630-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T20:29:21.439988+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="dc34eddd-ceb3-4cfc-aa63-b071cf6c7630-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T20:45:44.609534+00:00" -->
#### Claude
Found the message source files; reading them now before cutting the branch.

Not a duplicate. Moving to free_coding and cutting the branch.

Mapped every SMS touchpoint (records, routes, pane, assistant core/surface, tests). Now reading the records and enabled-handling code.

Read the assistant core; now reading its surface declaration, then I'll start editing.

Now the pane code.

Now editing. Triggers first: add `recipients`, `optional` + always-on reason, unbracket labels, drop the SMS cap.

Triggers done. Now the records: strip SMS, make on/off effective only for optional triggers, refuse "off" otherwise.

Routes and assistant plumbing next.

Routes pass `recipients`/`optional` through to the assistant automatically. Now the surface declaration text.

Surface done. Now the Paperwork pane.

Pane done. Updating existing tests whose expectations this ticket deliberately supersedes.

Now writing the BUG-386 UATs. Reading the REQ-660 workers harness to reuse it.

Code changes are in; writing the new BUG-386 UATs now (routes + Email assistant suite first).

My test's typo (`order_return_refund` is the real id). Fixing.

Now the order-flow UAT (inside the REQ-644 suite, which owns the shop/Stripe harness).

Workers suites green (35/35). Now the pane (jsdom) UAT; reading the REQ-661 mount harness.

Pane UATs pass (not skipped). Now the delegate-invitation design pin; looking at existing delegate tests.

Writing the last UAT — following a real delegate invitation link — by extending the REQ-369 delegate-access suite's harness.

The delegate link lands on `/` (the builder root), not `/b/<businessId>/` as the ticket's design note says. Checking whether sign-in links can carry a return path (REQ-482).

`sessions` has no tenant column — simplifying that assertion to: the subject is a platform-tenant user, and the cookie admits the builder for that business.

Delegate/sign-in suites green (58/58). Running the broader regression set: everything that imports the message modules, the assistant surface, or the delegates code.

22 failures, all in builder/asset/env suites unrelated to messages. Baselining them in the main checkout (without my change).

Same 22 fail on clean xgd-working — pre-existing, not mine. Checking the worktree is clean of stray artifacts and how this project bumps its version.

Checking nothing else still references removed symbols, then a typecheck of the touched files.

Typecheck clean. Updating the ticket body (keeping the existing content, adding what landed) before committing.

Ticket body updated. Committing on the branch.

Plan: lock → merge into xgd-working (sparse off) → rematerialize → `move-to-free-coded` without `--version` (it bumps itself) → clean.

Merged (no conflicts; overlay check found nothing to change). Moving the ticket to `free_coded`.

`free_coded` at 0.2.831 with both commits recorded. Cleaning up the branch.

BUG-386 is done and merged into xgd-working. The ticket is at `free_coded` (commits `d5b0ab7` plus the version bump to 0.2.831), and the branch is cleaned up. It isn't a duplicate: the related tickets (REQ-660, 661, 662) are the ones that built the Paperwork tab.

**What changed**
1. **SMS/push text is gone everywhere.** It's removed from the message record, the save and preview routes, the Detail pane and the Email assistant (its tools and its priming). If a save still sends it, nothing is stored.
2. **Recipients is its own fixed field.** Each trigger carries the recipients from your table; the five buyer emails read "Buyer". It shows in the Items list next to each message and as a read-only field in Detail, and the Email assistant reports it. Labels are now just the event: "New order", "Cancellation requested".
3. **On/Off only on Order shipped.** No other message shows the switch.
   - Trying to switch any other message off is refused with a reason. For example: "the New order message cannot be switched off: it is how the business learns it has an order to fulfil".
   - A message stored as off before this change is now treated as on, so it sends. It's cleared at its next save rather than by writing a new version, so it doesn't show up as a change the client made.

**Decision for you: the delegate invitation had a small gap.** The link did sign the person in to 1st Contact (not the business's own sign-in under `/c/<id>/`), but it landed on the builder's front page `/`, not on the business they were invited to. I fixed it: the link now opens `/b/<businessId>/`. Other invitations still land on `/`. Say if you'd rather undo that.

**Tests**
- New tests named `test_UAT_FC_BUG-386_*` cover each item in your test plan: two new test files, plus one test added to the shop-fulfilment suite and one to the delegate-access suite.
- I edited four older tests whose expectations this ticket replaces: the SMS-too-long refusal is removed from REQ-660; REQ-661 no longer expects "On" and the audience text on the sign-in row; REQ-205 and REQ-663 drop `sms` from their sample data. These are recorded on the ticket.
- About 60 test files that use the messages, Paperwork, notification, delegate and sign-in code pass, and the type check is clean.
- 22 tests in 7 builder, asset and environment files fail. They fail the same way on xgd-working without this change, so they were already broken.

<!-- xgd-chat-end -->