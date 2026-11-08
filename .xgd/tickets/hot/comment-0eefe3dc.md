---
uid: comment-0eefe3dc
id: COMMENT-7924
type: comment
title: Comment on request REQ-659
created_by: xgd
created_at: '2026-11-07T18:26:17.259185+00:00'
updated_at: '2026-11-07T18:44:30.547422+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-86de9c7b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fc33ec8e-4945-4852-a9d0-656d5f5b9447",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6e4ff694-fa3e-4c6c-8935-a2eae90b6c19-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T18:25:46.987730+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="6e4ff694-fa3e-4c6c-8935-a2eae90b6c19-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T18:44:30.085431+00:00" -->
#### Claude
Not a duplicate — checking the code paths now before implementing.

Still mapping the code: email recording, contact events, and the Resend webhook.

Contact identity, events and message records are understood. Now checking whether contacts hold a phone, and where fulfilment emails fire.

Contacts have no phone field today, so I'll add one. Next: the invite's stage transition, fulfilment emails, and the existing REQ-644 tests to build on.

Back-end design is settled. Now the UI: the People detail panel and Shop's order detail.

Reading the People and Shop mount code in app.js so the two panels can link to each other.

Harness found. Before cutting the branch, reading my notes on worktree setup and test gotchas.

Setting the ticket to free_coding and cutting the branch.

Worktree created. Wiring its node_modules the safe way (per-entry links, relative `@1stcontact` links recreated).

Worktree is ready. Now the migration: a phone on contacts and the contact on each order.

Writing migration 0055 and registering it in the test factory.

Index must come after the column; fixing the order.

Now the shared definitions: the **customer** stage and the order event kinds.

Shared definitions done. Now the server side — reading `personDetail` to add the contact's orders and phone.

Editing people.ts: phone on the person, `via` on addContact, orders on the detail, and the invite no longer demoting a customer.

Writing the new `buyers.ts` module — the one place a paid order becomes a contact and order facts land on their history.

Now wiring it into the paid outcome — enrolment before the confirmation email, so the email lands on the contact.

Now the order emails: record against the contact and add `email.sent` to their history.

Typecheck is clean. Now the UI — People's history notes, an Orders section, the phone, and links both ways.

Wiring both directions in app.js.

UI wired. Checking whether the stylesheet tests require a rule for each new class.

CSS in place. Now the tests — checking how the mailer behaves in workers suites and how the Resend webhook is signed.

Writing the workers UAT suite, reusing the REQ-644 harness (signed Stripe webhooks, fake Stripe at its HTTP boundary).

Harness trimmed. Now the cases themselves.

Four of five pass. The one failure is real: the paid event was stamped earlier than the contact's creation, so it would show as their origin. Stamping it after the contact exists instead.

All five pass. Now a UI UAT for People's Orders section and the Shop order's link back — checking how existing panel suites mount.

Writing the jsdom UAT for both panels.

Both panel cases pass. Now typecheck and the adjacent suites (orders, fulfilment, missed payments, contacts tab, invites, webhook).

Many failures — need to see whether they're mine or pre-existing. Looking at the errors.

These look unrelated to my change (name fixtures). Baselining the same suites on the clean xgd-working checkout to compare.

No new failures: the same 51 fail on clean xgd-working (pre-existing). Now running every other suite that imports a file I touched.

That's most of the suite (every workers test uses the D1 factory). Checking my note on running the full suite in batches.

The D1 factory match is what makes it 586. Narrowing to suites that import the changed modules or stylesheet directly.

79 failures across the three chunks. Baselining just the failing files on clean xgd-working.

Seven failures appear only in the branch. They look like worktree-location artifacts (webui serving, fonts), but I'll confirm from the messages.

All seven are worktree artifacts: the worktree has no `apps/control-app/dist-assets`, so the origin answers 503. Linking main's build output and rerunning those two files to be sure.

Those two also fail on clean xgd-working; the other seven now pass, BUG-58 included. No regressions. Running lint on the changed files.

No lint script in this repo; typecheck is clean. One gap to check before writing up: refunds made in Stripe's own dashboard.

Ticket updated. Committing the work on the branch.

Committed. Now the merge-back: lock, merge xgd-working into the branch, bump the version there, fast-forward back.

Lock held. Merging xgd-working into the branch, then bumping the version there.

REQ-659 is now `free_coded`. Recording story points, then cleaning up the branch.

REQ-659 is built and merged into xgd-working. The ticket is at `free_coded` with two commits (`cd6cb095c1…` for the work, `7407b5f262…` for the version bump to 0.2.809) and 8 story points. It wasn't a duplicate. I haven't deployed it, so the ticket's definition-of-done check — a test purchase on dev — is still to do.

**What it does now**
- **A paid order makes the buyer a contact.** The buyer's email is matched to an existing contact (ignoring case) or a new one is added, recorded as coming from the shop. Name and phone are filled in only where empty; the delivery address stays on the order.
- **The buyer becomes a customer.** There's a new **customer** stage after lead and invited. Nothing moves them back: not a refund, not a cancellation, and not an invite either — I made the invite leave a customer at customer, which the ticket didn't ask for directly.
- **History.** A "Bought" event naming the order number and total goes on the contact, then one each for shipped, cancelled, refunded and returned. Test-mode orders are marked Test.
- **Emails.** Every order email is recorded against the contact as `email.sent`. Resend's delivered and bounced updates then show on that contact's Messages, the same way other platform emails work.
- **Links between tabs.** People lists a customer's orders and each opens in Shop → Orders. Shop's order detail has "Open their contact in People".
- **Repeats and consent.** A replayed Stripe webhook adds nothing, and buying records no newsletter or other acceptance.

**Decisions you should know about**
- Contacts had nowhere to store a phone number, so migration `0055` adds `users.phone` (shown read-only in People) and `orders.contact_id`.
- A refund made in Stripe's own dashboard doesn't appear on the contact's history. Stripe's refund notification doesn't say which refund it is, so it can't be told apart from one made with our button. It still shows on the order itself.

All of this is written into the ticket body.

**Tests**
- 7 new UATs pass: 5 run real checkouts through signed Stripe and Resend webhooks, 2 cover the People and Shop panels.
- Typecheck is clean.
- I ran about 190 nearby test files on the branch and compared with clean xgd-working. Nothing new fails; the remaining failures fail on clean xgd-working too. Seven that failed only in the branch were caused by the branch's checkout lacking built assets, and they pass once those are linked in.

**Still to do:** run `bin/deploy --env dev`, make a test-mode purchase on our test business with a new email address, check the buyer appears in People as a customer with the order and confirmation email in their history, and record the result on the ticket. If you'd like me to run the deploy, say so.

<!-- xgd-chat-end -->