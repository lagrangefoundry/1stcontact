---
uid: comment-de09d013
id: COMMENT-7770
type: comment
title: Comment on request REQ-642
created_by: xgd
created_at: '2026-11-04T17:55:38.251085+00:00'
updated_at: '2026-11-04T18:31:32.957868+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5ab240db
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "de599de5-7f6f-444c-ac69-51a78f14fd90",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="beccab4e-d21e-4233-95f3-ea749c711bbd-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T17:53:04.520601+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="beccab4e-d21e-4233-95f3-ea749c711bbd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T18:31:30.380407+00:00" -->
#### Claude
Reading the existing Stripe Connect and invoice code before scoping the work.

Now the existing tests, migrations, and routing.

Still surveying: tracing how public webhooks are routed and how the live Stripe key is kept out of the shared secrets, so the new signing secrets follow the same path.

Scoping is nearly done — reading the REQ-633 catalogue-rebuild test so the new UATs can check a real rebuilt site for Buy vs the enquiry link.

Moving the ticket to `free_coding`, recording the transcript, and cutting the branch.

Starting the code now — first the deploy hooks for the two webhook signing secrets, then the payments module itself.

Writing the migration.

Now the payments module: signature check, event handling, the payment cache, and Checkout sessions.

Now `catalog.ts`: swap the placeholder for the real answer.

Wiring the router: catalog renders and rebuilds now carry the Stripe fetch, and connect/disconnect trigger a rebuild.

Now the public webhook endpoints in `index.ts`, ahead of the sign-in gate like the email webhook.

Typecheck is clean. Adding the two deploy hooks for the webhook signing secrets (the live one only from the operator's shell).

Code is in place and typechecks. Now writing the UATs; first checking how the workers test project and schema loader pick things up.

Writing the workers UAT file.

Dev-open admission can't manage Settings, so the connect/disconnect calls go through the real router with an owner admission, as REQ-641's suite does.

Publish with no changes is a no-op, so the outage case belongs on a rebuild instead: an `account.updated` arriving while Stripe is unreachable.

All 11 pass. A quick mutation check that the catalogue tests really depend on the new wiring:

Now a node-side UAT for the two webhook-secret deploy hooks and their probe.

Both pass. Now the regression scope: suites touching catalogue, Stripe, invoices, migrations, deploy hooks and probes.

Many failures — likely worktree/baseline artifacts. Checking messages and then running the same files on the unchanged base.

Those pass on base, so check them alone in the worktree.

`USER_COLUMNS` is undefined at query time — an import cycle that my new imports reordered. Finding which one.

The new `payments` import in `index.ts` evaluates `shop.ts`'s graph earlier than before and exposes an existing cycle. Moving that import after the router's restores the old evaluation order.

Fixed. Re-running the full regression scope.

Down to 24 files. Running the same files on the unchanged main checkout as a baseline.

Checking whether two remaining deploy dry-run failures are mine or worktree artifacts; everything payments-related passes.

Both pass alone (load flakes). Last one, AC702, alone:

Fails in the worktree, passes on base. Checking whether that's my diff or the worktree location by running it on the worktree with my tracked changes set aside.

AC702 fails in the worktree without my changes too, so it's a location artifact. The regression scope is clean. Final typecheck and lint:

No lint script exists and the typecheck is clean. Finding the local dev server's address for the operator's `stripe listen` command.

Code and tests are done. Committing on the branch, then updating the ticket before merging back.

Committed. Appending an "as built" section to the ticket (the existing body stays as is), so every UAT traces to ticket language.

Ticket updated. Now merging back: lock, merge `xgd-working` into the branch, bump the version, fast-forward, then move to `free_coded`.

Moved to `free_coded`. Recording story points and tearing down the branch.

REQ-642 is built, merged into `xgd-working` and at `free_coded`, at 13 story points. Its commits are `4c25f20e559c80055f557c0d792f4de68c7d969a` (the work) and `8fa734fec6341e5177a8d7b0fec24016483d21d4` (version 0.2.758). The branch is cleaned up. All 14 new UATs pass, and so do the related suites that pass on the unchanged base.

**What changed**
- **The catalogue:** the placeholder that always said "no" is deleted. A site render now asks the one real `canTakePayments`, in the mode of the business's connection. If Stripe can't be reached the answer is "no", the build still succeeds and the enquiry link shows.
- **Rebuilds:** connecting, disconnecting, `account.updated` and a deauthorisation each rebuild the business's sites, through the same path an item's Save uses.
- **Webhooks** (new `payments.ts`): every event's signature and timestamp are checked with Web Crypto, and each event is processed only once. The answers are:
  - **503** when that endpoint has no secret
  - **400** for a bad signature or a test/live mismatch
  - **500** when processing fails, so Stripe retries
  - **200** for anything processed now or before, or for an account linked to no business

  Completed and expired Checkouts, payment successes and failures, dashboard refunds (exactly one credit note per refund) and the account events are all handled. The Shop is told through a handler it registers.
- **Payment cache:** migration `0046` adds three tables: processed events, payment attempts and refunds keyed by Stripe id, and payment issues for amount mismatches. There's one function to re-read an entry from Stripe.
- **Checkout sessions:** created on the business's own Stripe account, from the order's exact amounts, with the fixed settings from the ticket. They're refused for a total mismatch, an invoice that isn't a draft, or a business that can't take payments.
- **Deploy:** two new secret hooks. The live signing secret is accepted only when exported in your shell, never from the shared file. The deploy check can only confirm a secret's format (`whsec_…`); Stripe has no way to prove one is right.

**Worth knowing**
- **Buy itself is the orders ticket's job.** What this changes today is that the enquiry link disappears for a business that can take payments.
- **Shop handler retries:** if the handler fails, Stripe's retry tells the Shop again, so the Shop may hear the same outcome twice. The invoice itself is never paid, voided or credited twice.
- **Import order:** `index.ts` must import `payments` after the router. In the other order an existing import cycle broke about 20 other suites. There's a comment at the import.
- **Not done:** the optional check against the real Stripe sandbox. It needs a connected test account, which this session didn't have.
- **Seen in testing:** two deploy dry-run tests failed under load but pass when run alone. Two other suites (BUG-50, and AC702 in `reconciliation-behavior-modules.test.ts`) fail in a fresh worktree with or without my changes, and pass in the main checkout.

**Your steps**
- **Dev:** run `bin/deploy --env dev` first (the dev server serves a frozen snapshot), then:
  1. `brew install stripe/stripe-cli/stripe`
  2. `stripe login`
  3. `stripe listen --forward-connect-to http://127.0.0.1:8786/api/stripe/webhook/test`
  4. Put the printed `whsec_…` in the secrets file as `STRIPE_WEBHOOK_SECRET_TEST`, then restart the dev services.
- **Production (TODO-20):** in Stripe, register these two endpoints, each listening to events on connected accounts:
  - `https://app.1stcontact.io/api/stripe/webhook/live`
  - `https://app.1stcontact.io/api/stripe/webhook/test`

  Subscribe each to `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `refund.created`, `refund.updated`, `charge.refunded`, `account.updated` and `account.application.deauthorized`. Then deploy with `STRIPE_WEBHOOK_SECRET_LIVE=whsec_… bin/deploy --env production`.

The ticket body has these decisions, how each UAT maps to the test plan, and the steps above. The end-to-end test purchase falls to whichever of this ticket and the orders ticket lands second; this one landed first.

<!-- xgd-chat-end -->