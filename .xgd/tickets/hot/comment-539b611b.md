---
uid: comment-539b611b
id: COMMENT-7810
type: comment
title: Comment on request REQ-644
created_by: xgd
created_at: '2026-11-05T15:24:49.379604+00:00'
updated_at: '2026-11-07T15:55:00.088895+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2ac77944
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ec4d5ce8-12c9-4505-a186-d2041f87c92c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="da2f371b-77e0-4714-ab3d-e4d35e8f28a3-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T15:24:24.143241+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="da2f371b-77e0-4714-ab3d-e4d35e8f28a3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T15:26:52.981507+00:00" -->
#### Claude
Reading the ticket and its dependencies (REQ-643 orders, EPIC-9 refunds, EPIC-30 emails) to see what already exists before I scope the build.

Checking how emails are recorded (the buyer has no user/contact id) and how the Orders UI and checkout module are built.

I've read the ticket and the code it builds on. Before I start I need you to settle a few things. The ticket depends on pieces that don't exist yet, and the answers decide how big this one ticket gets.

**What exists today**
- REQ-643's orders only have `pending`, `paid` and `expired`. A database trigger blocks any other state change, so this ticket needs a new migration.
- Refunds made in the Stripe dashboard already come in by webhook and get a credit note (`payments.ts` `processRefund`). There is **no code that creates a refund** (`POST /v1/refunds` on the connected account), and EPIC-9 has no ticket for one.
- `notify()` (REQ-626) can only send to the owner or delegates by user id. It has one kind (`job_done`) and a limit of 5 emails per business per hour. The email system has **no way to send to someone who isn't a user** (each recorded email needs a contact id and address id), and **no reply-to**. EPIC-30 has no ticket for either.

**Questions, each with what I'd do**

1. **Refunds from our buttons.** Should I build it here, inside the ticket? I'd add `createRefund` in `payments.ts`. It would call Stripe on the connected account with a duplicate-request guard, and use the same webhook and credit-note path as a dashboard refund, so one refund never gets two credit notes.
2. **Buyer emails.** Should I build buyer sending here too? I'd record each email in the business's store, keyed to the order rather than a user. They'd come from the business's verified sending domain if it has one, otherwise the platform address with the business's name. I'd add a reply-to field so replies go to the owner. They'd use platform wording and have no unsubscribe link, because they are about the buyer's own purchase.
3. **Owner notifications.** I'd add `new_order` and `cancellation_requested` as `notify()` kinds, sent to the owner and live delegates. I'd **exempt these from the 5-per-hour limit**, otherwise a busy shop would stop hearing about new orders. Is that OK?
4. **"Let buyers request cancellation" default.** I'd make it **on**. The owner still decides every request, so being on can't lose them a sale they've already posted.
5. **Status page module.** I'd add a `status` mode to the `checkout` module rather than the catalogue module. It's dynamic and runs a script, the same as checkout. It would get a default L1 page drawn inside the site's header and footer, like the other checkout pages. Its script would call a new `api/checkout/order` verb (plus `request-cancel`).
6. **The private link.** I'd use a random 32-byte token. Only a hash of it is stored on the order. It would go in the URL after `#` (for example `/order-status#t=…`) so it never shows up in server or CDN logs. Is that OK?
7. **Cancelling after a goodwill refund.** If a paid, unshipped order already has a partial refund, I'd have Cancel refund what's left rather than the full amount. Is that OK?
8. **Size.** With 1 and 2 folded in, this is about 20 story points, the limit for one free-coded ticket. I'd keep it as one ticket and work on a `free-REQ-644` branch over several turns. If you'd rather split refunds and buyer sending into their own EPIC-9 and EPIC-30 tickets, say so.
9. **Definition of done on dev.** It asks for a real test-mode order taken through every step, "with the emails received". I can deploy to dev and drive a Stripe test checkout in Chromium. Two things I need from you:
   - **The inbox:** which address should the test buyer use, so the emails actually arrive? Or is the recorded outgoing message plus Resend's delivered status enough?
   - **Stripe:** is our own test business still connected to a Stripe test account on dev?

If you're happy with my answers, reply "go with your defaults" and tell me the inbox for question 9. I'll write the decisions into the ticket body, set it to `free_coding`, and cut the branch.

<!-- xgd-turn id="2f6a8616-a60c-4b01-8c74-07ea9d9c31d9-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T15:29:24.953030+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="2f6a8616-a60c-4b01-8c74-07ea9d9c31d9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T15:54:59.581639+00:00" -->
#### Claude
No answers to my earlier questions have come in, so I'm going ahead with the defaults I proposed. I'm writing those decisions into the ticket and then starting the build on a `free-REQ-644` branch.

The worktree is set up. Now I'm reading the order and payment code that REQ-643 left behind, so I can plan the migration and the new actions.

Now the payments side: how refunds and credit notes arrive today.

I've read the payments, invoices and notification code. Next are the owner routes, the public checkout endpoints and the checkout module, then I'll write the migration.

I've read the module and generator. Now checking where checkout modes are declared in the schema, then I'll start writing code.

Now writing the migration.

The migration is written. Next is `createRefund` in `payments.ts`: Stripe on the connected account, with an idempotency key, through the same credit-note path as a dashboard refund.

`createRefund` is in. Now the order emails. First I need the builder's deep-link format, so the owner's notifications can open the order directly.

Adding the two owner notification kinds to `notify()`. Both are exempt from the hourly limit and carry the order facts as escaped text.

Notifications are done. Now `orders.ts`: the new states in the summary and list, a "To ship" filter, `site_url` stored at checkout, and refunds and fulfilment in the chronological record.

Now the `orders.ts` edits: the row type, site URL, summary status, To ship filter, refunds and events in the record, and the emails sent on `paid`.

To avoid an import cycle, `orderPaidEmails` goes into `order-emails.ts`, which doesn't import `orders.ts`.

Now `fulfilment.ts`. It holds the owner's actions (ship, cancel, record return, refund, decline), the buyer's status view and cancellation request, and the Shop settings.

I'll export `businessOfSiteKey` and reuse it rather than duplicate the query.

Typecheck is clean. Next, the owner's routes in `shop-routes.ts`.

Now the webhook passes its own origin through, so the `paid` outcome can send the order emails.

Now the buyer's two new endpoints. The cancellation request has to notify the owner with a builder link, so I need the control app's own address inside the service binding.

The backend is wired through and typechecks. I'm checking whether the builder's draft-preview checkout path also lists the verbs.

Implementing the `status` mode across the schema, meta, component, default page and client.

Now the client script for the status page.

I changed `client.js`, so I'll regenerate `module-assets.ts` and keep only the checkout part of the diff. First the builder UI: `orders.js`.

Adding the order-action and settings calls to the transport, then the Orders UI.

I'll reuse the existing Shop button classes rather than add CSS. My memory notes say rules appended to the end of `builder.css` fail REQ-408.

Adding a small "Shop" section to Settings with the two toggles, mounted after Shipping.

Adding the `order` show target, so the owner's notification link opens the order in the Shop tab.

Now regenerating module assets for the new client script.

I'm writing the fulfilment workers UAT now, modelled on the REQ-643 suite. First a quick look at how that suite delivers a paid session.

Test-mode orders never appear in To ship, so that test needs a live-mode shop. I'm checking how the Stripe mode and keys are read.

Now the test cases themselves.

Before running the suite, I'll record the new migration in the manifest. The test schema may check it.

The checkout start returns 500. Looking at the logged error:

The test schema loader lists migrations by hand. Adding 0053 and moving the head marker:

Five of seven pass. The two failures are the test env missing `SESSION_COOKIE_NAME`, which the owner's auto sign-in link needs. Deployed environments set it. I'm adding it to the test env.

Six pass. The last one is my assertion's fault: the link is an auto sign-in link that carries the target URL-encoded. I'll assert on the decoded link.

Writing the status-page UAT in jsdom, against the real generator output and the real client script:

Three pass. The other two failures are in my test fixtures, not the product code. I'm checking how the REQ-643 suite adds a site's own checkout page.

All 5 status-page UATs pass. Now a builder UAT for the Orders UI and the Settings toggles, following the REQ-643 orders UI test.

My 6 Orders UI UATs and REQ-643's 6 all pass. Now the regression scope: the neighbouring payment, invoice, notification, mail, checkout and module-asset suites.

151 of 152 pass. Checking the one REQ-198 failure:

All the node regression suites pass. Searching for other tests that pin the bind-field list or the checkout modes:

Also red on the clean main checkout, so not caused by this change. Now the commit. Checking my notes on the version bump and the `free_coded` gate for this project:

Plan: commit on the branch, merge it into `xgd-working`, then move to `free_coded` without `--version`, which lets the gate do the version bump itself. Checking exactly what to stage:

Before committing, I'm adding a "What landed" section to the ticket body, so every UAT and every technical consequence is stated in the ticket. The existing body stays as it is.

The ticket body is updated. Committing on the branch:

Committed. Taking the merge lock and merging into `xgd-working`:

Merged cleanly. Checking that no other session landed a migration with the same number while I worked, then running the overlay check:

Now moving the ticket to `free_coded`, with the gate doing the version bump:

REQ-644 is at `free_coded` (version 0.2.807). Cleaning up the branch:

REQ-644 is built, merged into `xgd-working` and parked at `free_coded`; I haven't promoted it to reconcile. Two things are still open: a run of the real-Chromium Shop suite, and the definition-of-done walk-through on dev, which needs answers from you.

You hadn't answered my questions from 5 November, so I went with the defaults I proposed then and wrote each one into the ticket under "Decisions made by the session". All of them can be overruled:

- **Refunds from our buttons** are built here, not under EPIC-9. They go through the same credit-note path as a dashboard refund, so one refund never gets two credit notes.
- **Buyer emails** are built here, not under EPIC-30. They're sent in the business's name, replies go to the owner, and there's no unsubscribe link.
- **New order and cancellation-requested notifications** are exempt from the 5-per-hour notification limit.
- **"Let buyers request cancellation" is on by default.**
- **Cancelling an order that already had a partial refund** refunds only what's left.

**What it does now**
- **Orders list:** opens on "To ship" (paid live orders not yet shipped, cancelled or returned; never test orders).
- **Order actions:** Mark shipped (tracking optional), Cancel and refund (asks for confirmation first), Record return (pick the lines, restock or not, refund pre-filled and editable up to what's left), a plain Refund, and Decline a buyer's request with a note. Everything shows up in the order's history.
- **Settings → Shop:** two switches, "Email the buyer when an order ships" and "Let buyers request cancellation", both on by default.
- **Emails:**
  - Owner: a new-order notification, plus one when a buyer asks to cancel. The link signs them in and opens the order.
  - Buyer: confirmation (with the dispatch note), shipped, cancelled, request declined, and return refund. Each carries a fresh private link to the order status page.
- **Order status page:** a new default page on every site that sells, drawn in the site's own design. Buyers see their order, a buyer-safe history and the Request cancellation button. The button only sends a request, and a link only works on its own shop's site.

Two design changes from the ticket's wording:
- **Order state:** I didn't rebuild the orders table to widen its status values, because that would have cascaded into deleting order lines. Shipped, cancelled and returned live in a separate `fulfilment` column alongside the existing payment status.
- **Owner's link:** the order records the control app's address when the payment arrives. That way a buyer's cancellation request can still email the owner a working link, without a new config setting.

**Tests**
- 18 new tests across three files, all passing: the full after-sale flow through the real Workers (Stripe faked at its HTTP boundary), the status page (including injected markup in an item name staying inert), and the Orders and Settings screens.
- The neighbouring suites pass too: payments, invoices, notifications, mail, the REQ-643 checkout suites and the module checks.
- Two older tests fail, and both fail the same way on a clean `xgd-working`, so they aren't from this change. One is REQ-198's email-fields test, which was already out of date after REQ-626; I added three more fields it doesn't list. The other is `reconciliation-workspace-build-artifacts`, which dies with "localD1 is not a function".

**Still needed from you**
- **Chromium suite:** I haven't run the real-Chromium Shop suite (`pnpm test:browser`) that the ticket's test plan names.
- **Dev walk-through:** for the end-to-end order on dev, I need the inbox the test buyer should use (or confirmation that the recorded email plus Resend's "delivered" status is enough), and whether our test business is still connected to a Stripe test account. Once I have those, I'll deploy to dev and take a test order through ship, a cancellation request and decline, and a return with refund.

The ticket is 20 story points, the limit for one free-coded ticket.

<!-- xgd-chat-end -->