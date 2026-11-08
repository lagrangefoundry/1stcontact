---
uid: comment-cb96f2ef
id: COMMENT-6771
type: comment
title: Comment on epic EPIC-9
created_by: xgd
created_at: '2026-11-02T17:58:46.497874+00:00'
updated_at: '2026-11-08T00:30:44.551085+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-ce0874f2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "79a29cda-8630-473d-bc9d-b76be26e4e74",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="192011ef-c2ba-46dc-8dd5-74806547d520-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T17:57:39.021355+00:00" -->
#### You
Please take a look at GOAL-55 and assess what is the minimum that we need to do to meet that goal from a payments integration POV.

One requirement I would like to discuss - payments testing - we, of course need to test real live payments, but I would also like to consider a small set of special test customers (identified by specific email addresses) and for these customers we route payments to a Stripe sandbox. There is a trade off here between the benfits of introducing easy tests and the potential for bugs leading to real payments going to the wrong place

<!-- xgd-turn id="192011ef-c2ba-46dc-8dd5-74806547d520-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:02:43.514792+00:00" -->
#### Claude
Reading DOC-54's test-marker rules now, since they bear directly on the sandbox-routing question.

I've read GOAL-55, EPIC-9 and the test-marker rules in DOC-54. There's no Stripe code anywhere in `apps/` or `packages/` yet, so all of this is new work. I haven't changed any tickets.

## The payments minimum

GOAL-55's seven items are close to the real floor. Here's where I'd trim, item by item:

| # | Item | Verdict |
|---|---|---|
| 1 | Connect, linking her account as Standard | **Needed, but smaller than EPIC-9's scope 1.** Her account is already verified, so there's no identity check (KYC) to build. It's an OAuth redirect and callback, storing her `acct_` id, and checking `charges_enabled` on `account.updated`. Linking an existing account still means Stripe's Standard OAuth; confirm Stripe hasn't changed that. |
| 2 | No platform fee | No work: we just never set `application_fee_amount`. |
| 3 | Webhooks | **Needed.** One Connect endpoint. Events: `checkout.session.completed` and `.expired`, `payment_intent.amount_capturable_updated`, `.canceled` and `.succeeded`, `charge.refunded`, and `account.updated`. Disputes can wait, because Stripe emails a Standard account holder directly. |
| 4 | Cache rule | **Needed, but keep it to one table.** Store the PaymentIntent and refund status that webhooks write. Don't build a general cache layer yet. |
| 5 | Internal invoices | **Defer if she isn't VAT-registered.** Irish VAT invoices are required for business buyers, not private consumers (I'm fairly sure of this; worth confirming), and there are no PDFs in the minimum. If she isn't registered, the order number can be the reference and invoices come later. If she is, keep them; numbering is just a counter in D1. |
| 6 | Manual capture, capture/release, refunds | **The biggest cost item.** Card holds expire after about 7 days, which is why EPIC-31 has the day-5 reminder and lapsed-hold handling. Taking the money at purchase would remove capture, release, expiry handling, the reminder and the lapsed-hold cancel. The cost is Stripe fees she wouldn't get back on refunds. You've already decided on manual capture, so I'm only flagging the cost. If you keep it, Checkout must allow cards only, because some payment methods can't hold a payment. |
| 7 | Test path | See below. |

Two items aren't optional at any size: never set `invoice_creation`, and keep test and live mode apart.

## Routing test customers to Stripe test mode

**The idea is good. What's risky is using the email address to decide.** The buy flow has no login, so the email is whatever the buyer types. That makes it the input DOC-54 and EPIC-9's test-gutter section rule out: "the signed marker is the only permitted input to credential selection."

The two ways it can go wrong are very different:
- **A real buyer lands in test mode** (someone guesses or learns a test address). They "pay" with Stripe's test card 4242…, the order reads as paid, and Lauren posts a real piece of jewellery for nothing. **This one is theft.**
- **A test buyer lands in live mode.** Their test card is declined, or the operator's real card is charged and refunded. Annoying, nothing more.

So the rule should be: live is the default, and test mode needs proof. These six rules keep a bug from causing harm:

1. **Only a signed marker selects test mode.** Your email allowlist still fits: it becomes the list of people who can be sent the marker by magic link. That proves they own the inbox, rather than trusting what they typed. A missing or bad marker means live.
2. **The mode is chosen once and stored on the order.** Every later call (capture, release, refund) uses the order's stored mode and never works it out again.
3. **One webhook endpoint per mode, each with its own signing secret.** Reject an event whose `livemode` doesn't match its endpoint or its order.
4. **Test orders are synthetic** (DOC-54 R2/R3). They don't appear in her Shop tab or the "to ship" list, so even a forged one is never shipped. That's what closes the theft case.
5. **Test buys use a hidden test product.** Otherwise a test purchase puts a hold on a real one-off piece, and the public site shows it as sold.
6. **Test captures never use her real invoice number series.** Deleting synthetic invoices would leave gaps in it. Also check at startup that the test and live keys are the right way round (`sk_test_` and `sk_live_`).

**One correction:** use Stripe *test mode* on her own connected account, not a Stripe *Sandbox*. A Sandbox is a separate environment that can't see her live account. Test mode on an OAuth-linked Standard account uses the same `acct_` id, and the test orders show in her own test dashboard. I believe that's how it works; check it when we design this.

**Testing live payments is still a separate step.** Test mode proves our code, not her live settings or our live secrets. Before launch, put one real card payment through on live keys and void it rather than capture it, which leaves no processing fee.

**My recommendation:** rules 2–4 have to exist anyway, because GOAL-55 item 3 needs webhooks that know test from live. Adding the marker and synthetic flag now is cheap, and it gives EPIC-15 its permanent test path for payments. Just don't let anything typed on the public form choose the mode.

If you agree, I'll record this in EPIC-9's decisions section and amend GOAL-55 item 7, plus the invoice deferral if you want it.

<!-- xgd-turn id="34e84e1b-8a79-4619-9831-86d94c7dd62e-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:11:48.689852+00:00" -->
#### You
I think we should create invoice Objects - whether we turn these into PDFs send them to customers or what is a separate question. I think every payment and payment attempt should have an invoice that links the payment to an order or a subscript.

<!-- xgd-turn id="34e84e1b-8a79-4619-9831-86d94c7dd62e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:12:38.632384+00:00" -->
#### Claude
I'll record that in EPIC-9 and GOAL-55. It mostly confirms what's already there, so I'll adjust existing lines rather than add a new section.

I've recorded that in EPIC-9 and GOAL-55. These were ticket text changes only, with no code involved. I've withdrawn my suggestion to defer invoices.

**What's now written down:**
- **Invoice objects always exist**, whatever the business's VAT position. Whether one becomes a PDF, gets emailed or is shown to the buyer is left for later.
- **Every payment attempt has an invoice from the start.** The invoice is created as a draft before any money moves. One invoice can have many attempts, for example a declined card followed by a retry.
- **Every invoice links to exactly one order or exactly one subscription.** The invoice is the link between a payment and what it pays for; a payment never points at an order or subscription directly.
- **Subscription invoices are still Stripe's.** We keep a cached copy, and that copy links to the subscription, so the rule holds on both sides without us owning subscription invoices.
- **A draft invoice has no number.** The gap-free number is assigned when the money is taken, and an expired or abandoned attempt voids its draft. So creating an invoice at every attempt doesn't put gaps in the series. This fits EPIC-31's purchase flow, which already makes the draft invoice before Checkout.

**One open question, recorded in EPIC-9:** domain charges are one-off, but they're neither a shop order nor a subscription. Either a domain purchase becomes an order, or an invoice gets a third kind of thing it can link to. Lauren doesn't need domain charges, so it can wait until they're built.

The test-mode routing (the signed marker instead of a typed email, plus the six rules) isn't recorded yet, because you haven't said whether you agree. One part of it touches this decision: test-mode payments also get invoices, and those need their own number series so they never use up numbers in her real one.

<!-- xgd-turn id="261be186-ae22-4b7f-8d00-f8a3ec7d5381-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:14:35.664014+00:00" -->
#### You
domain charges are one-off, <-- domain charges are a subscription???

<!-- xgd-turn id="261be186-ae22-4b7f-8d00-f8a3ec7d5381-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:15:19.985554+00:00" -->
#### Claude
Yes, you're right. A domain renews every year, so it's a subscription. EPIC-9's scope item 7 called it a "one-off charge", and I repeated that without checking it against EPIC-6. That made the open question I raised a false one, and I've removed it.

**What I've changed in EPIC-9:**
- **Scope item 7** now says domain charges are a subscription, marked as corrected today.
- **The "one-off invoices are ours" decision** no longer lists domain charges, only shop orders and deposits.
- **The invoice rule needs no change.** A domain invoice links to its subscription like any other invoice, so there's no third kind of link.

**Two EPIC-6 constraints still apply, now recorded in EPIC-9:**
- **A failed renewal has a different consequence.** A lapsed subscription blocks the tabs; a lapsed domain takes the site and email offline. Stripe Billing's card-retry settings mostly apply to the whole Stripe account, so that difference has to live in how we handle a domain subscription whose renewal payment is overdue.
- **The renewal charge has to come before the registrar's renewal date**, with enough time to retry a failed card before the domain expires.

GOAL-55 needed no change, because domain charges are still out of scope for Lauren.

<!-- xgd-turn id="71990524-f194-4f03-9b04-e80d6ada595d-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T18:45:18.618848+00:00" -->
#### You
ok so what are the minimum requirements we need here?

<!-- xgd-turn id="71990524-f194-4f03-9b04-e80d6ada595d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T18:45:49.724623+00:00" -->
#### Claude
Here's the payments minimum for Lauren's shop, with today's decisions folded in. Everything not listed waits.

**1. Link her existing Stripe account**
- She connects her existing Stripe account to ours as a Standard account, through Stripe's OAuth redirect. We store her Stripe account id against the business.
- We track whether her account can take payments (`charges_enabled`) from Stripe's account-update events. If it can't, the Buy button doesn't take money.
- She charges her customers directly and is the merchant of record. We take no platform fee.
- There are no identity checks to build: her account is already verified.

**2. Invoices**
- Every purchase creates a draft invoice linked to its order, before any money moves.
- Every payment attempt points at that invoice. One invoice can have several attempts, for example a declined card and then a retry.
- The invoice gets its gap-free per-business number when the money is captured. An expired checkout voids the draft, so it never uses up a number.
- A refund creates a credit note against the invoice.
- No PDFs.

**3. Taking the money**
- Checkout with manual capture, cards only.
- Capture when she ships. Release the hold if the order is cancelled. Full or partial refunds.
- Made-to-order items are captured at purchase.
- We never set Checkout's `invoice_creation` option.

**4. Webhooks**
- One public endpoint per mode (test and live), each checked against its own signing secret.
- Each event is processed only once, even when Stripe retries it.
- An event whose mode doesn't match its endpoint or its order is rejected.
- Events handled: checkout completed or expired, payment held, cancelled or succeeded, refund, and account updated.
- Webhooks are what confirm a payment, never the checkout success redirect.

**5. The cache rule**
- We keep one table of payment and refund status, written by webhooks and keyed by Stripe id. Stripe is the truth, and any row can be dropped and re-read.
- Orders, invoices and credit notes are ours, not cache.

**6. Testing**
- **Test mode on her own Stripe account.** We use Stripe's test mode on her same connected account, not a Stripe Sandbox.
- **Mode chosen once and stored.** Each order records whether it is test or live. Every later call for that order uses the stored mode.
- **Test only with a signed marker.** Live is the default. An order is only test-mode when it carries a valid signed marker. That marker is sent by magic link to a short list of test email addresses, never taken from an email typed into the form.
- **Test orders are kept apart.** They're marked synthetic and hidden from her Shop tab and the "to ship" list. They use a hidden test product and their own invoice number series.
- **One real payment before launch.** A real card is authorised on live keys and then voided.

Items 1–5 restate what's already agreed. Item 6 is my recommendation from earlier, and you haven't confirmed it yet. The parts to confirm are the signed marker in place of a typed email, and the test-only product and invoice series.

Once you're happy with item 6, I'll replace GOAL-55's "Minimum from EPIC-9" section with this list and record the test-mode decision in EPIC-9.

<!-- xgd-turn id="68f6b9aa-5c62-49d6-809c-8112d191334c-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:00:19.446041+00:00" -->
#### You
Please read GOAL-55 and EPIC-31 transcript and see if you are aligned with the scope?

<!-- xgd-turn id="68f6b9aa-5c62-49d6-809c-8112d191334c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:01:16.959708+00:00" -->
#### Claude
GOAL-55 seems to have moved on since I first read it (EPIC-31 points at a "Plan and ordering" section). I'm re-reading both.

I'm only partly aligned. GOAL-55 and EPIC-31 moved on after I first read GOAL-55, and the minimum I gave you last turn is out of date in two places. The invoice decisions are aligned.

## Where I was out of date

1. **Capture.** GOAL-55 now takes the money at purchase for launch, and hold-then-capture-on-ship is fast follow #3. You agreed to this in the EPIC-31 session once it was clear capture on ship isn't a legal requirement. I'd listed manual capture, capture, release and the made-to-order exception as minimum. All of that moves to the fast follow.
2. **Refunds.** At launch, refunds are made in her Stripe dashboard and reach us by webhook, with our credit note. The refund operation in our API waits for the Refund button. I'd listed full and partial refunds as an operation we build.

## Where we already agree

- **The invoice rules.** GOAL-55's handshake creates a draft invoice covering the lines plus shipping before Checkout opens, and carries `{business_id, order_id, invoice_id}` in the Stripe metadata. That's the rule you set last turn.
- **Who owns what.** EPIC-31 proposed the split and asks EPIC-9 to confirm it. I agree with it. EPIC-9 owns Connect, the webhook endpoint, the cache, invoices and credit notes, and the operations on her account. The Shop owns orders, the hold lock, the Checkout endpoint, the emails and the public site.
- **The handshake.** The Shop asks EPIC-9 for a draft invoice and then a Checkout session. EPIC-9's webhook updates the cache and the invoice, then calls the Shop's handler with the outcome. I agree.
- **The plan.** EPIC-9's foundation is in week 1, her account is connected in test mode in week 2, the handshake works end to end in week 3, and credit notes and the switch to live come in week 4.

## Changes these cause on the payments side

- **Webhook events at launch:**
  - checkout completed and expired
  - payment succeeded, and payment failed (for each attempt's decline reason)
  - refund (her dashboard refunds)
  - `account.updated`
  - `account.application.deauthorized`, which nobody has listed yet. Under Standard she can disconnect us from her own Stripe dashboard, and the Buy button has to stop taking money when she does.
  - The hold events wait for capture on ship.
- **Payment methods.** Taking the money at purchase would allow SEPA and iDEAL, but they confirm days later. I'd keep cards, Apple Pay and Google Pay only at launch, so every payment confirms during checkout.
- **The live smoke test gets dearer.** Without manual capture we can't authorise a real card and then void it. The live test becomes a small real purchase followed by a dashboard refund, which costs Stripe's fee (cents).
- **The test-routing proposal fits the plan.** You said she'll build her site while we test and fix checkout. The parts of it that must exist from day one anyway are the mode stored on each order and one webhook endpoint per mode, each with its own secret. The signed marker for test customers can follow, but you still haven't said whether you want it.

## What I'd change in GOAL-55

GOAL-55's EPIC-9 section is still marked "EPIC-9 to confirm or revise", and items 6 and 7 still say manual capture and API refunds. I'd revise them and leave the Shop's sections alone:
- **Item 6 becomes:** Checkout with automatic capture, cards and wallets only; dashboard refunds reach us by webhook. Manual capture and the refund operation move under fast follows #3 and #4.
- **Item 3** gains the event list above.
- **Item 7** gets the mode stored on each order, one endpoint per mode, and the live smoke test as a purchase plus refund.
- **Both "EPIC-9 to confirm" markers are cleared**, confirming the ownership table and the handshake.

Shall I make those edits? And is the signed-marker test path in, or left for later?

<!-- xgd-turn id="d9249f7f-2370-4ce4-bdd6-8dfbcb11ea66-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:19:15.258450+00:00" -->
#### You
Yes

<!-- xgd-turn id="d9249f7f-2370-4ce4-bdd6-8dfbcb11ea66-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:20:16.529116+00:00" -->
#### Claude
I've made the edits to GOAL-55 and EPIC-9. These are ticket text changes only, with no code. I left the Shop's sections of GOAL-55 untouched.

**GOAL-55, the payments section:**
- **Item 3, webhooks:** one endpoint each for test and live, each with its own signing secret. An event in the wrong mode is rejected. Webhooks confirm a payment; the redirect never does. The launch events are listed, including `account.application.deauthorized`, and the hold events are put off until capture on ship.
- **Item 6, charging:** the money is taken at purchase, with cards, Apple Pay and Google Pay only. Refunds made in her Stripe dashboard reach us by webhook and get our credit note. Manual capture moves to fast follow 3, and the refund operation to fast follow 4.
- **Item 7, testing:**
  - Stripe test mode on her own account, not a Stripe Sandbox.
  - Each order stores its mode (test or live) when it's created.
  - The live check before launch is a small real purchase followed by a refund.
- **All three "EPIC-9 to confirm" markers are cleared:** on the payments section, the ownership table and the week-1 plan.

**EPIC-9** has a new section, "the launch shape for GOAL-55", with the same decisions. Under it, **"Test mode in production"** records your test-customer idea, the risk trade-off, and the proposed signed-marker mechanism and its safeguards.

Your "yes" covered the edits but not the test-customer question, so I've recorded the signed marker as **proposed, for you to decide**. The day-one parts are already in either way: each order stores its mode, and there's one endpoint per mode. Is the marker in for launch, or a fast follow?

<!-- xgd-turn id="7639d6fc-4e41-4a17-bda4-ca0a908c09c3-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:22:49.111378+00:00" -->
#### You
What is test mode?

<!-- xgd-turn id="7639d6fc-4e41-4a17-bda4-ca0a908c09c3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:23:04.243725+00:00" -->
#### Claude
Test mode is Stripe's built-in practice environment. Every Stripe account has two sides: **live**, where real money moves, and **test**, where nothing does.

**How it works:**
- **Your API key picks the side.** Every Stripe account has two sets of keys: `sk_live_…` for live and `sk_test_…` for test. A call made with a test key happens entirely on the test side.
- **Test card numbers stand in for real ones.** In test mode, Checkout accepts Stripe's published test numbers. `4242 4242 4242 4242` always succeeds, and others are declined, ask for 3-D Secure or fail in particular ways. A real card is refused.
- **Everything else behaves as it would live.** Checkout sessions, payments, refunds and webhooks all happen the same way, so our code runs exactly as it will with real money.
- **Test and live are kept apart.** Test objects have their own ids, sit in a separate view of the Stripe dashboard (a "test mode" switch), and send webhooks signed with a different secret. Nothing on the test side can touch the live side.

**What it means for Lauren:**
- **Her account has a test side already.** Once she links her Stripe account to ours, we can run checkouts on its test side with our test key, using the same account id.
- **Test orders show up in her own dashboard.** They appear in her Stripe dashboard with the test mode switch on, and never in her real payments or payouts.

**What it can't prove.** It shows our code is right, but not that her live account and our live keys are set up correctly. That's why there's also one small real purchase and refund before launch.

**Test mode versus a Sandbox.** Stripe also offers **Sandboxes**: separate, isolated copies of an account for testing. A Sandbox can't see her real connected account, which is why I said test mode rather than "sandbox" earlier. Stripe has been moving people towards Sandboxes, so we should check at design time that test mode still works on a connected account.

**Your test-customer idea in these terms:** for a few chosen people, the shop would create their checkout with our test key instead of the live one. They pay with `4242…`, the whole flow runs for real in production, and no money moves.

<!-- xgd-turn id="3b474b11-6f68-466f-80a1-2123f3b7bcbc-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:24:00.938167+00:00" -->
#### You
So bear in mind that this is not all about Lauren's stripe account we need our own for testing

<!-- xgd-turn id="3b474b11-6f68-466f-80a1-2123f3b7bcbc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:25:10.842217+00:00" -->
#### Claude
Agreed. I'd framed testing too much around Lauren's account. I've updated GOAL-55 (payments item 7) and EPIC-9 so testing runs on our own Stripe accounts, and only touches hers when she's being set up.

**The setup I've written down:**
1. **Our platform account.** This is 1st Contact's own Stripe account with Connect switched on, and we need it anyway.
   - Dev and local use only its test keys.
   - Production holds both its test and live keys as secrets.
   - At startup we check the keys are the right way round.
2. **A test business of ours.** This is a business on 1st Contact with its own Stripe account that we own. We link it through the same flow Lauren will use, so that flow is proven before she touches it.
   - **Its test side** carries all the repeatable testing, including EPIC-15's automated test runs.
   - **Its live side** is for live checks with our own card, refunded. The money is ours, so a mistake costs nothing.
3. **Lauren's account.** Once she links it, we do one test-mode run to prove the link works and that she can take payments. Then she goes live, and routine testing never touches it again.

**What it does to the risk you raised.** Test purchases go to our shop, so nothing lands in her Shop tab, holds one of her pieces or uses up her invoice numbers. I also added one rule for every business: **an order placed in test mode never appears in a "to ship" list**. So even if a bug put a real shop into test mode, the worst outcome is buyers being unable to pay, never jewellery posted for a test card.

**Your test-customer idea now matters much less.** Our own test business covers most of the need with none of the risk. Per-email routing would only be needed for testing on a real customer's shop. I've kept it in EPIC-9 as an option for you to decide on, with the signed-marker safeguards if it's ever built. My recommendation is to leave it out for launch.

**One thing you'll need to do yourself:** set up the second Stripe account, the one for our test business. You can add it under the same Stripe login, and it needs verifying like any real account before its live side can take a payment.

<!-- xgd-turn id="ffdb4264-f16d-42c1-b8b2-c7feeb3549ca-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:26:53.666886+00:00" -->
#### You
I suspect we need a UX to link a stripe account to 1c, right?

Is it possible for a user with no stripe account to create one entirely through our UI? (fast follow)

<!-- xgd-turn id="ffdb4264-f16d-42c1-b8b2-c7feeb3549ca-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:27:52.624980+00:00" -->
#### Claude
Yes, we need a UX to link a Stripe account. I've added it to GOAL-55's minimum (payments item 1). Creating a Stripe account entirely inside our UI is possible, and I've added it as fast follow 5. Both tickets are updated; there's no code yet.

## Linking an existing account (launch)

**Where it lives.** I've proposed a **Payments** section in the Settings tab rather than the Shop tab. The link covers the whole business and will outlive the Shop, since subscriptions will use it later. Until she can take payments, the Shop tab shows a "Connect Stripe to start selling" prompt that opens the section.

**How it works:**
- **Connect Stripe** sends her to Stripe's own hosted page. She signs in to her existing account and approves us, then comes back to the section and sees the result.
- **The section shows one of four states:**
  - not connected
  - connected and able to take payments
  - connected but Stripe needs something from her, with a link to her Stripe dashboard to fix it
  - disconnected, because she removed us from her Stripe dashboard
- **Disconnect** is there too.
- **The Buy button takes money only in the "able to take payments" state.**

**Someone without a Stripe account isn't stuck at launch.** Stripe's hosted page also offers to create a new account. They just do it on Stripe's site rather than ours.

## Creating an account inside our UI (fast follow)

**It's possible, with one limit.** We create the account through Stripe's API and embed Stripe's own sign-up form in the Payments section, so she never leaves 1st Contact.

**The limit:** the identity checks are regulated, so Stripe still collects them, never us. That means legal name, date of birth, address, bank details and possibly a photo of her ID. It happens inside our page, but Stripe does the asking. That's the most "entirely through our UI" can mean without us taking on the compliance burden ourselves, which EPIC-9 already rules out.

**One thing to check when it's designed.** I believe Stripe's embedded sign-up form works for accounts that get their own full Stripe dashboard, as Lauren's does, but I haven't confirmed it. If it doesn't, the fallback is a Stripe-hosted sign-up page, which takes them briefly off our site.

**Still to decide:** whether you're happy with the Settings tab as the home for this, or want it somewhere else.

<!-- xgd-turn id="971bbda7-12cc-4079-a49d-84f9c8bcfc5a-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:32:19.595103+00:00" -->
#### You
Settings is fine

<!-- xgd-turn id="971bbda7-12cc-4079-a49d-84f9c8bcfc5a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:32:44.351026+00:00" -->
#### Claude
I've recorded the Settings tab as the confirmed home in GOAL-55 and EPIC-9. Until a business can take payments, the Shop tab will show a "Connect Stripe to start selling" prompt that opens it.

The payments minimum for GOAL-55 is now agreed. Two decisions are still open:
- **Test customers on a real customer's shop.** I recommend leaving this out of launch, because our own test business covers almost all of the need.
- **Who sets up our two Stripe accounts:** the 1st Contact platform account with Connect switched on, and the account for our test business. Both need verifying before either can take a live payment, and that's something you have to do in Stripe.

GOAL-55's plan has the payments foundation in week 1, which ends Friday 6 Nov, but EPIC-9 has no child tickets yet. When you want work to start, shall I file the first one? It would cover the platform setup, Connect linking with the Settings section, webhooks, the payment cache and invoice records.

<!-- xgd-turn id="3b985226-0781-440b-a5c9-2dbe358d6259-user" -->

<!-- xgd-chat role="user" ts="2026-11-02T19:36:04.421343+00:00" -->
#### You
I need to set up the Stripe accounts - please create a TODO ticket as a child explaining in detail what I need to do.

Why two accounts - real and test? - I thought you said one account could do both?

<!-- xgd-turn id="3b985226-0781-440b-a5c9-2dbe358d6259-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-02T19:38:18.303191+00:00" -->
#### Claude
TODO-18 is created. Now I'm listing it as a child in EPIC-9 and in GOAL-55's week-1 plan.

You were right: one Stripe account does both test and live. I'd made it sound like the two accounts were "real" and "test", and they aren't. Each has a test side and a live side; they're two accounts because they do different jobs.

| | Account | Its job |
|---|---|---|
| **A** | **1st Contact platform** | It holds our API keys, and every business, Lauren's included, links its own Stripe account to it. This is where Connect is switched on. |
| **B** | **1st Contact as a business** | A business on 1st Contact like any other. Its live side is our shop for real-money checks with our own card, refunded. Later it's the merchant that charges our own customers for subscriptions. |

**A and B can't be the same account.** A platform can't link to itself as one of its own businesses. EPIC-9 also already requires that 1st Contact's own business has its own linked account, like every other business, so no code has to treat our own business as a special case. So B was needed anyway, and live testing is a second use for it.

**Testing in test mode needs neither B nor Lauren's account.** Stripe's link page in test mode can create a throwaway test account in one click. I believe it's a "Skip this form" button, which I've flagged in the ticket to check.

**TODO-18, "Stripe: create the platform account and our own business account"**, is filed as a child of EPIC-9 and linked from GOAL-55's week-1 plan. It covers:
- **Section 0, decisions first:** which legal entity and country 1st Contact signs up as, and whether to reuse a Stripe account you already have.
- **Section 1, account A:** sign-up, two-factor authentication, and what Stripe's verification will ask for.
- **Section 2, Connect on A:** the answer to each question on Stripe's platform form, branding, and turning on the link flow (OAuth). Leave the redirect addresses empty until the foundation ticket gives you them.
- **Section 3, API keys:**
  - The test key goes in `~/Documents/secrets/1c.dev.env`.
  - The live key goes **in your password manager only for now**. `bin/deploy` pushes everything in that file to production, and the dev servers read it too, so the foundation ticket has to decide how a production-only key is supplied.
- **Section 4, webhooks:** later, once our endpoints are deployed.
- **Section 5, account B:** create it under the same login, verify it, don't switch on Connect, and don't link it yet. It gets linked through our own Settings → Payments section, which makes it the first real run of the flow Lauren will use.
- **Section 6, for Lauren:** she must be an owner or administrator of her Stripe account to approve the link, and linking early doesn't affect her WooCommerce shop.
- **What to report back:** account ids and the two Connect client ids, none of which are secret. Never paste a secret key into a chat or ticket.

Start sections 1 and 5 first: Stripe's verification is the only part with waiting in it.

<!-- xgd-turn id="5ed0f779-44df-4315-a75a-513b872c2cd1-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:40:20.038251+00:00" -->
#### You
what are the first foundational pieces needed here while I work on the shop UI things?

<!-- xgd-turn id="5ed0f779-44df-4315-a75a-513b872c2cd1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:40:55.918170+00:00" -->
#### Claude
Here's what I'd build first on the payments side, in dependency order. Nothing is filed or built yet; this session writes the tickets, and a child session does the coding.

## 1. Invoices: can start today

None of this calls Stripe, so it doesn't wait for your Stripe setup (TODO-18):

- **Tables** for invoices, invoice lines and credit notes. Amounts are stored in the currency's smallest unit (cents) together with the currency.
- **Invoice states:** `draft` → `paid` → `part credited` / `credited`, and `draft` → `void`.
- **Each invoice links to exactly one order or exactly one subscription**, enforced by the database.
- **Each invoice also records:**
  - its source: ours or Stripe's
  - its mode: test or live
- **Gap-free numbering per business**, assigned in the same step that marks the invoice paid. Test-mode invoices get their own series.
- **The calls the Shop needs** for its handshake: create a draft from lines, mark paid (which assigns the number), void, and issue a credit note.
- **The test-data requirements** from DOC-54: a synthetic flag, a run id, and deletion that cascades from a contact.

The link to an order means invoices depend on EPIC-31's orders table. If orders don't exist yet, that link is added when they do. The Shop's checkout can still be coded against these calls straight away.

## 2. The Stripe connection: needs the test key from TODO-18 section 3

- **The Stripe library running on Workers.** Every call picks its key from one function, using the mode stored on the record. At startup we check that the test and live keys aren't swapped.
- **Deploy hooks** that check each key against Stripe before pushing it. This includes deciding where the live key lives, which TODO-18 leaves open.
- **Linking, with the Settings → Payments section:**
  - the Connect button and the return from Stripe, tied to the business and the signed-in owner
  - the business's Stripe account id, stored against it
  - the four connection states
  - Disconnect
  - This needs TODO-18 section 2: the client ids, and our return addresses registered with Stripe.
- **Webhooks:**
  - one endpoint per mode, each with its own signature check
  - a record of event ids, so a retried event is processed only once
  - a mode check, and dispatch to handlers other code can register (the Shop will register one)
  - handling for the two account events (`account.updated` and disconnection)
  - Locally, the Stripe CLI forwards test events to the dev server. You'll need to install it; the ticket will give you the command.
- **The payment cache:** payment attempts and refunds, keyed by Stripe id, written by webhooks. Any row can be deleted and read back from Stripe.

## Later, in week 3

Creating the Checkout session and the full purchase round trip. Both depend on the Shop's orders and its Checkout endpoint.

## Tickets

I'd file two child requests rather than four:
- **"Payments: invoice records, numbering and credit notes"** (piece 1), which can start now.
- **"Payments: Stripe credentials, Connect linking in Settings, webhooks and payment cache"** (piece 2). It can start scaffolding now, but its Stripe calls can't be tested until you've done TODO-18 sections 1–3.

Both would be written generically, with no customer specifics. Shall I file them?

<!-- xgd-turn id="29e9bdd1-647b-427f-9f98-9b3e7547edb7-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T00:41:52.770415+00:00" -->
#### You
please give me an REQ for Invoices

<!-- xgd-turn id="29e9bdd1-647b-427f-9f98-9b3e7547edb7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T00:43:37.568144+00:00" -->
#### Claude
Inventory (0040) and default currency (0041) already landed. I'm reading them so the invoice REQ fits the existing schema.

I've filed **REQ-637, "Payments: invoice records, gap-free numbering and credit notes"**. It's a child of EPIC-9, left at `draft` for a coding session to pick up, and listed in EPIC-9's children. It calls no Stripe API, so it can start now, before you've done TODO-18. It's written generically, with no customer specifics.

**What it specifies:**
- **The invoice record.** It belongs to one business and links to exactly one order or subscription, which the database enforces. It records:
  - whether it's ours or Stripe's
  - test or live, fixed when it's created
  - one currency
  - This REQ only creates our own invoices, for orders. Subscriptions use the same model later.
- **Lines** are a snapshot of description, quantity and amounts, as of the moment the invoice is created. Editing or deleting the product later never changes an invoice. Amounts are in cents, totals are calculated by us, and there's no VAT handling yet.
- **States:**
  - `draft` (no number), `paid`, `part credited`, `credited` and `void`
  - Only a draft can be voided; a paid invoice is never deleted.
- **Numbering:**
  - The number is assigned at the moment the invoice is marked paid.
  - Numbers have no gaps, with one series per business for live and a separate one for test (`INV-n` and `TEST-INV-n`).
  - Two invoices paid at the same moment get consecutive numbers.
  - Marking an invoice paid twice, as happens when Stripe retries a webhook, uses up no number.
- **Credit notes** cover any amount up to what's left on the invoice. They're numbered in their own series (`CN-n` and `TEST-CN-n`), and a repeated refund doesn't produce a second note.
- **The calls the Shop needs:** create a draft, mark paid, void, issue a credit note, and read invoices. There's also an owner-facing read route, but no UI.
- **Ten tests**, covering numbering under concurrent payments, the test and live series staying independent, the one-target rule, credit notes, the snapshot, and one business never seeing another's invoices.

**One decision I need from you before it's built.** DOC-54 says records filed under a contact are deleted with that contact. But a business generally has to keep paid invoices for tax purposes. The REQ proposes this default:
- A deleted contact's **draft and void invoices** are deleted with them.
- **Paid and credited invoices are kept**, with the buyer's details as they were on the invoice.
- **Test invoices are always cleaned up**, whatever their state.

Is that right?

**How REQ-637 fits with the Shop.** It needs an orders table to link to, and the Shop builds that. REQ-637 asks its coding session to pick a database design that can take a real link to orders later, without rebuilding the invoices table.

<!-- xgd-turn id="d27d068a-efd7-47ef-8083-95c78bbd40b9-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:18:55.060865+00:00" -->
#### You
Please answer the questions in 637's transcript. Put the answers in its ticket body - bring any questions here that need my input

<!-- xgd-turn id="d27d068a-efd7-47ef-8083-95c78bbd40b9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:23:15.898348+00:00" -->
#### Claude
Reading the ticket files directly instead.

I'm checking how existing owner reads expose test data, so the answers to 637's questions match what's already built.

I have what I need. Writing the answers into REQ-637's body now.

The original said "deleted with it"; fixing my match and rerunning.

Now adding the deferred contact-deletion rule to EPIC-9, which REQ-637 points to.

I've answered all four of the coding session's questions in REQ-637's body. Only one needs your decision, and it doesn't hold up REQ-637, which can now be built.

**My answers:**
1. **Deleting a contact:** invoices get no contact column. An invoice points at an order, not a person, so the rule for what happens when a contact is deleted belongs to EPIC-31's orders table, which links the buyer. I've recorded it as open question 5 in EPIC-9, "Contact deletion and invoices".
   - REQ-637 adds invoices, invoice lines and credit notes to the scheduled clean-up of test data.
   - I added one rule the session didn't ask about: **the database refuses to delete a real, live invoice that isn't a draft or void.** "A paid invoice is never deleted" is a tax-records rule, so it shouldn't rely on the code alone.
2. **Linking an invoice to an order before orders exist:** agreed as proposed. The invoice gets an order id and a subscription id, and the database refuses an invoice with neither or both. When EPIC-31 creates the orders table, its migration adds the checks that the order exists and belongs to the same business. It also adds a rule that an order can't be deleted while it has a paid invoice.
3. **Marking test data:** agreed. A new invoice takes the test-data mark from the request's run id, the way lead capture already does. Everything after that takes it from the invoice itself. Test or live mode is a separate fact that the caller passes in.
4. **Routes and number prefixes:** agreed, with one change. **The owner routes won't accept `?synthetic=true` or `?mode=test`.** No owner route anywhere in the control app lets a request switch on test data, and a query parameter would let any owner see it. EPIC-9 also already says test orders are hidden from the Shop tab. The Shop, the webhook and the tests can still ask for test invoices in code. I added a test for this, and an 11th test for the no-delete rule.

**Decision needed (it blocks EPIC-31, not REQ-637):** this is the contact-deletion default I asked about last time, now framed around orders. When a contact is deleted:
- their orders and invoices go with them if every invoice is still a draft or void
- an order with a paid or credited invoice is kept, with the buyer's details as they were on the invoice, and its link to the contact is removed
- test records are always cleaned up

Is that right?

<!-- xgd-turn id="0ae29326-80a6-4ddf-ac48-f3223f04e2a0-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:27:30.743821+00:00" -->
#### You
On deletion, I think that's right - we should probably also cancel any subscriptions.

We wrote fairly extensive designs early on for deletion can you review the chats and design docs to help ensure consistency please

<!-- xgd-turn id="0ae29326-80a6-4ddf-ac48-f3223f04e2a0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:30:11.792552+00:00" -->
#### Claude
I'm searching the design docs and chats for the earlier deletion and erasure designs.

DOC-37 is the main design. Now checking whether its erasure registry exists in code, and what DOC-54, DOC-40 and DOC-43 say about deletion.

Nothing in the product deletes a contact yet; erasure is a request an operator answers. Reading the portal's erasure copy and the other docs' deletion sections.

The portal already promises "your invoices and payments, with you reduced to the least the law allows". Checking the chats and EPIC-9's subscription model next.

I've got the picture. Updating EPIC-9's deletion question to match DOC-37, adding your subscription point, and noting the exception in EPIC-9's test-data section.

Now fixing REQ-637's wording, which still says "kept with the buyer's details".

Your subscription rule is in, and the deletion rule now matches the earlier designs, with one correction. I reviewed DOC-37 (deletion and retention), DOC-54 (test data), DOC-40, DOC-42, DOC-43, the CHAT-21 discussion that produced DOC-37, and the existing code. EPIC-9 open question 5 and REQ-637 are updated; there's no code.

**The correction.** I'd said paid orders keep "the buyer's details as they stood on the invoice". That breaks DOC-37 ("we delete the person and keep the accounting") and a promise the portal's erasure page already makes: "your invoices and payments, with you reduced to the least the law allows". The rule now keeps the transaction, removes the link to the contact, and keeps only the legal minimum about the buyer. Email and phone are never part of it.

**What is consistent:**
- Deleting drafts and void invoices fits DOC-37's list of what is actually destroyed.
- Severing the contact link is exactly DOC-37's idea that erasure severs identity.
- **Subscriptions:** cancelling them is done by deleting the person's Stripe customer on the business's linked account. Stripe cancels their subscriptions immediately, and their email leaves Stripe as well. That is DOC-37's "one action covers the site, the list and the payment processor".
- **REQ-637:** invoices hold no buyer details, and its migration comment declares how each table should be treated by DOC-37's erasure registry, which isn't built yet.

**Two inconsistencies I fixed or found:**
- **EPIC-9 said every table hanging off a contact should cascade on delete.** Orders with a paid invoice can't, so their contact link is set to empty instead. EPIC-9 now records that exception.
- **DOC-54 R5 ("a business can delete a contact, removing everything filed under them")** has the same gap. It needs the same exception, because a business deleting a paying customer still has to keep the invoice. I've recorded that in EPIC-9 but haven't edited DOC-54. Shall I add the exception to R5?

**Also worth knowing:** nothing in the product deletes a contact yet. Erasure is a request an operator handles by hand, so none of this is urgent until EPIC-31 builds orders.

**Three questions for you:**
1. **What is the "legal minimum" kept about a buyer?** DOC-37 left this open, since it varies by country. I'd take one cautious answer everywhere: keep the name and billing address on paid invoices and drop everything else. Does that work?
2. **Does a cancelled subscription refund the rest of its period?** I'd say no automatic refund: cancel immediately and let the business refund by hand if it wants to.
3. **What happens when a 1st Contact business itself is deleted?** Its own 1st Contact plan is cancelled, but its domains are a harder case, because cancelling a domain takes its website and email offline. I'd refuse to delete a business that still holds domains with us until it has transferred them out or chosen to let them lapse. Should I put that in EPIC-9?

<!-- xgd-turn id="89b66c2d-a8ff-43f3-912c-86af01802883-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:36:03.522021+00:00" -->
#### You
1 - that sounds correct - although I wonder if we should also keep email address? I know its PII but if we have business history should we not be able to contact them if something from the past comes up?
2. No we give service to end of term, cancellation just discontinues autorenew
3. Not sure - I think your right we probably don't delete the business but we may delete the content of the business: the site, the library, the inventory etc?

<!-- xgd-turn id="89b66c2d-a8ff-43f3-912c-86af01802883-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:37:00.998358+00:00" -->
#### Claude
I'm recording your answers in EPIC-9. Your answer to 2 changes how subscriptions end, so I'm rewording that bullet too.

I've recorded your answers in EPIC-9. Paid invoices keep the buyer's name and billing address. Cancelling a subscription now only turns off renewal: the buyer keeps the service to the end of the term, and no refund is due. That replaces my earlier "delete the Stripe customer", which would have cancelled the subscription straight away. Three things are still open, and they're your calls.

**1. Keeping the email address: I'd recommend not keeping it.**
- **It contradicts the person.** Someone who asks to be erased is asking specifically not to be contactable. The portal's erasure page already tells them their email address is destroyed, so keeping it would make that page untrue.
- **"Something might come up" isn't a strong legal reason.** The law lets you keep data for a specific, live legal claim, not for a general "just in case".
- **The real cases are disputes, chargebacks and unpaid balances.** For those I'd use a **hold** instead: while an order has an open dispute, an unpaid balance or a refund window still running, erasure of that person's identity waits until it's resolved, then completes. That keeps the email exactly when there's a concrete reason and drops it otherwise.
- **The business isn't left with nothing.** Stripe keeps its own payment records, so a chargeback can still be handled through Stripe.

Does a hold like that cover what you had in mind, or do you want email kept as a permanent part of the minimum? If you choose to keep it, the portal's wording has to change.

**2. Your end-of-term rule and erasure pull in opposite directions.** Giving someone service until the end of their term needs their identity until then, for their login and their deliveries. But the law expects erasure "without undue delay", which is roughly a month. My suggestion:
- Erasure turns off renewal straight away.
- The person is told when the erasure will complete: at the end of their term, if that's within the month, and otherwise when they choose to end the service early.

Or, more simply: asking to be erased ends the service now. Which do you prefer?

**3. Closing a business: I agree, keep the business record and delete its content.** Here's the shape I'd propose:
- **Deleted:** sites and published builds, the library and its stored files, inventory, conversations, and the business's contacts with everything filed under them. We hold contacts on the business's behalf, so the law expects us to delete or return them when the service ends.
- **Kept:**
  - the business record, marked closed
  - our own invoices to that business, since those are our tax records
  - its domains, until they're transferred out or lapse
- **Its plan with us** follows your rule in 2: renewal is turned off, and the content is deleted when the term ends.
- **One wrinkle: the business's own sales invoices.** They are its tax records, not ours. I'd hand them over in an export before deleting anything, and keep them for a short grace period after closure. Ask me before relying on that: I haven't checked how long the period should be.

Closing a business is wider than payments: it touches sites, the library and the Settings tab. So I've noted it in EPIC-9 only as an open item. Once you've answered, should I record the design in DOC-37's section on deleting a whole business, rather than in EPIC-9?

<!-- xgd-turn id="95854c77-b1f8-4bdb-8c31-ed235bc8d14e-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T16:51:36.077803+00:00" -->
#### You
I think its important that we retain anything that is a record of money changing hands - even if the money went to them not us, I still feel like we could be pulled in to a customer dispute - that is unless there is legal reasons that we should not

<!-- xgd-turn id="95854c77-b1f8-4bdb-8c31-ed235bc8d14e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T16:52:17.788000+00:00" -->
#### Claude
Recording this in EPIC-9. One correction to my own note first: I'd written that the payment cache rows "can be deleted and read back from Stripe". Under your rule they're records of money changing hands too, so they're kept.

I've added your rule to EPIC-9: any record of money changing hands is kept, whichever way the money went. That covers a person asking to be erased, a business deleting a contact, and a business closing. I'm not aware of a legal reason against it, and it is a common practice. It is not legal advice, though, and **the terms need a lawyer to look at this before we rely on it.**

**Why it's allowed, and the conditions it comes with:**
- **For a business's own sales, we hold the data on the business's behalf.** By default that means we delete it or hand it back when the service ends.
- **Keeping our own copy to defend a dispute makes that copy ours.** We'd be keeping it in our own legitimate interest in defending legal claims, which the law permits.
- **For that copy to be lawful, four things are needed**, all now recorded in EPIC-9:
  1. **Our terms and privacy notice say so.** That fits our existing policy of disclosing data handling in the terms.
  2. **It's kept for a fixed period, then deleted.** Keeping it forever isn't defensible.
  3. **It's minimised:** the transaction plus the buyer's name and billing address, never the site, its content or the conversations.
  4. **It isn't shown in any product view of a closed business.** Only the platform operator can read it, and only for a dispute.

**What's kept:** paid orders, invoices, their lines, credit notes, and our copies of Stripe payments, refunds and subscription invoices. Test-mode and test-data invoices are still removed, because no real money moved. **Stripe also keeps its own records**, so in a chargeback we aren't the only source.

**Two decisions left:**
1. **How long to keep money records.** I've proposed 7 years: that covers typical tax-record rules and the usual time limit for bringing a claim. OK?
2. **Email.** You raised being drawn into a dispute. I'd still not keep email permanently. Instead, a person's email would be held only while something concrete is open on their order: a dispute, an unpaid balance or a refund window. The rest of their identity is deleted at erasure, and the email goes once nothing is open. A record of a payment doesn't need the email to prove the payment happened. Is that enough, or do you want email kept for the full 7 years? If so, the portal's erasure page has to stop promising that the email is destroyed.

None of this changes REQ-637: it already keeps paid live invoices and lets test ones be deleted.

<!-- xgd-turn id="75336fcb-8fbd-4624-9bd0-4d4edbff729e-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T17:02:28.887747+00:00" -->
#### You
ok so the other principle here is this needs to be automated - I am not going to be deleting records by hand or tracking 7 year timeframes. So whatever rules we come up with they need to be automatable and simple.

How about this:
1. Keep everything for 30 days
2. Have the ability to manually defer deletion - doing so requires recording a reason. Deference can be indefinite but it is 30-180 days at a time. Each deferal needs a recorded reason
3. Keep everything that records the movement of money - note we should only store PII in one place and we should use a reference for it everywhere else - at "deletion" the  PII is replaced with an anonymous ID
4. after 7 years we delete everything

Ok?

<!-- xgd-turn id="75336fcb-8fbd-4624-9bd0-4d4edbff729e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T17:03:39.004103+00:00" -->
#### Claude
Your four rules work, and they make the scheme simpler. They need five refinements to be automatable without a hole. I'm checking REQ-637's status first, because rule 4 affects its delete guard.

Your four rules work and I've written them into EPIC-9 as the deletion lifecycle. One scheduled job runs daily and applies them, so nobody deletes records or tracks dates by hand. Rule 3's "PII in one place" was already in the deletion design doc (DOC-37), so it fits.

I added five things the rules need in order to run without a hole:

1. **Hide immediately, delete at 30 days.** The 30 days covers the undo window and the law's roughly one-month expectation for erasure. During that window the person must already be gone in practice: off lists, never mailed, logged out. Otherwise someone who asked to be deleted keeps getting the newsletter for a month.
2. **If service is still running, the clock starts when it ends.** This answers the end-of-term question. Asking for deletion turns renewal off, the service runs to the end of the term, and the 30 days starts then. Closing a business works the same way with its plan.
3. **Deferral covers the dispute case you raised.** Deferring a deletion with "open dispute" as the reason keeps the email for as long as it's needed, so email doesn't need to be kept by default. The business can defer for its own contacts, and so can we. The same mechanism also pauses the 7-year purge.
4. **The 7 years counts from when the money moved, not from the deletion request.** That way each record needs only one date and there's no case to track. It does mean a live customer's invoices from more than 7 years ago are purged too.
5. **The suppression fingerprint is never deleted.** It's the one-way fingerprint of an erased person's email that keeps them off future list imports. If "delete everything after 7 years" included it, the next import would mail that person again.

Another consequence of "PII in one place": an order's delivery address and any note from the buyer count as personal details. They have to live in that one place, not on the order. EPIC-31 needs that rule when it builds the orders table.

**REQ-637 is already built** (`free_coded`), and its database guard refuses to delete a paid live invoice ever. I've noted on EPIC-9 that whichever ticket builds the daily job has to relax that guard to "not until 7 years after it was paid".

**One decision left.** Your rule 3 replaces the person with an anonymous id. Earlier we agreed paid invoices keep the buyer's name and billing address. Both can't be true, so which wins?
- **Keep name and billing address until year 7.** VAT invoices usually have to show them, and they make a dispute defensible.
- **Fully anonymous.** It's simpler and it's what the portal implies. But an invoice that says "anonymous buyer" may not be a valid tax invoice.

I'd keep the name and billing address.

Separately, this lifecycle belongs in DOC-37, since it now covers far more than payments. Shall I write it into DOC-37 and leave EPIC-9 pointing to it?

<!-- xgd-turn id="092e33d1-a399-453e-aff8-5bb2e0a4ef06-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T17:10:04.231789+00:00" -->
#### You
Yes we keep the minimum that we need to name and billing address - there's no point in keeping records that cannot be tied to the real world somehow. We just want to make it easy to strip out what we don't need.

<!-- xgd-turn id="092e33d1-a399-453e-aff8-5bb2e0a4ef06-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T17:10:33.617174+00:00" -->
#### Claude
Recording that in EPIC-9.

I've recorded it in EPIC-9: paid records keep the buyer's name and billing address, and everything else about the person is removed. There are no open questions left on deletion.

**What happens when someone is deleted:**
- **They have paid us or the business something:** their single identity record is cut down to name and billing address. Email, phone, delivery addresses and everything else are removed. Their invoices and payments still point to that record, so nothing else needs rewriting.
- **They have never paid anything:** the whole identity record is deleted.
- **After 7 years:** the cut-down record is deleted too.

**Making removal easy.** The identity store marks which fields make up the kept minimum. Cutting a record down is then one general step, not a list of fields someone has to keep up to date. **A new identity field is removed by default** unless someone deliberately marks it as part of the minimum. So adding a field later can never quietly keep extra personal data.

The rest of the lifecycle stands as written:
- Records are hidden as soon as deletion is asked for.
- They're deleted after 30 days, or once any service still running has ended.
- Deletion can be put off with a recorded reason, for 30–180 days at a time.
- Everything goes after 7 years, except the fingerprint that keeps an erased email off future mailing lists.
- One daily job runs it all.

Still waiting on you: this lifecycle now covers far more than payments, so it belongs in DOC-37 (the deletion design doc), with EPIC-9 just pointing to it. Shall I move it there? I'd also add the matching exception to DOC-54 R5, a business deleting a contact, while I'm at it.

<!-- xgd-turn id="930a736b-a792-4f25-9c3d-07b0f843f9c2-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T17:11:01.216214+00:00" -->
#### You
Yes please update DOC-37 with this so we are consistent\

<!-- xgd-turn id="930a736b-a792-4f25-9c3d-07b0f843f9c2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T17:12:21.060641+00:00" -->
#### Claude
I'm writing the lifecycle into DOC-37. Then I'll add the exception to DOC-54 R5, and shorten EPIC-9 to point at DOC-37 so the rules exist in one place.

DOC-37 is updated. Next, DOC-54 R5, then EPIC-9.

DOC-37 now holds the full deletion lifecycle, so it's the one place the rules live. I've also brought DOC-54 and EPIC-9 into line with it.

**DOC-37:**
- **A dated note at the top** records what changed today and says DOC-37 wins if an epic disagrees with it.
- **§4.2, new: closing a business.** The business record stays and its content is deleted. Its money records are kept and offered to it in an export first. Its plan with us runs to the end of the term, and its domains are kept until transferred out or lapsed.
- **§6.1, what's kept:**
  - Billing history is kept for 7 years from when the money moved.
  - That covers every record of money changing hands, including a business's own sales.
  - It explains why keeping a business's sales makes us responsible for that copy, the conditions that make it lawful, and that our terms must say so.
  - It sets the subscription rule: cancelling turns off renewal and the service runs to the end of the term.
- **§6.3, the person's details:**
  - At deletion they're cut down to name and billing address, or removed entirely if the person never paid anything.
  - Any new personal field is removed by default unless it's marked as part of what's kept.
  - A delivery address or buyer note is personal detail too, so it never sits on the order.
- **§7.1, new: the lifecycle.** It's one daily job with five rules:
  1. A deleted person is hidden at once.
  2. Their data is destroyed after 30 days.
  3. Destruction can be deferred, with a reason, for 30–180 days at a time.
  4. Money records are kept.
  5. Everything goes after 7 years.
  - The exceptions: the fingerprint that keeps an erased email off future mailing lists is never deleted, and test records follow their own clean-up.
- **§9, open questions:** the legal minimum is answered. Deletion timing and export-before-delete are partly answered.

**DOC-54 R5**, a business deleting a contact, now carries the money-records exception. Test contacts are still removed whole and straight away.

**EPIC-9 open question 5** is cut down to a pointer to DOC-37, plus what EPIC-9 and EPIC-31 must build to match it. That covers the orders' link to contacts, subscriptions, the guard REQ-637 put in, and the terms.

**Still open in DOC-37**, none of it urgent:
- how long deleted data may linger in backups
- whether the portal offers an export to individual people
- what a business is told when one of its customers erases themselves
- how long assistant transcripts are kept

One small wording point: the portal's erasure page says your email address is destroyed. That stays true, except while a deletion is deferred for a dispute. A short line saying deletion can be paused while a dispute is open would make the page fully accurate. That's a code change, so it would need its own ticket if you want it.

<!-- xgd-turn id="e3c6ef27-46ae-4908-b863-a03d04f71699-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T17:39:57.991582+00:00" -->
#### You
PLlease create a ticket - and can you mnake sure that our T&C are consistent with what we are proposing to automate?

<!-- xgd-turn id="e3c6ef27-46ae-4908-b863-a03d04f71699-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T17:42:16.238596+00:00" -->
#### Claude
I'm finding where the terms and privacy notice live. They're legal-doc tickets that the build reads.

The privacy notice has several gaps against the lifecycle. Now checking both versions of the terms for termination, data, payments and processor wording.

DOC-80 is EPIC-29's unpublished draft. Checking whether the suppression fingerprint exists yet, because the portal page already mentions it and the privacy notice doesn't.

That's a different thing: an inbound-mail block. The erasure fingerprint isn't built yet. Creating the ticket now.

I've filed **REQ-640, "Erasure disclosures: portal, privacy notice and terms match the deletion lifecycle"**. It's a child of EPIC-9, left at `draft`, and covers the portal wording, the Privacy Notice and the Terms. I didn't edit the legal documents myself. They come out as drafts for your lawyer to review, and you decide when to publish, since publishing makes every signed-in user accept again.

**Our current terms are not consistent with what we plan to automate.** They promise less retention than we'd keep. Today that's harmless, because nothing is retained yet. They become inaccurate with the first live payment, so REQ-640 has to land before that.

**Where the published documents fall short:**

- **Privacy Notice §6:** it says we delete everything within one month, and that the only exception is "information we must keep by law". Our design keeps more than that:
  - payment records, for 7 years
  - information about an open dispute, kept until it's resolved, which is our own legitimate interest rather than a legal duty
  - a deletion that waits until a term already paid for has ended
  - a closing business's domains, until they're transferred or lapse
- **Privacy Notice §2 and §4:** there is no payments category and no mention of Stripe.
- **Privacy Notice §9 (people who use sites built on 1st Contact):** it says only the business decides what happens to their information. It never mentions that we keep our own copy of their payment records for disputes. That disclosure is what makes the retention lawful, so it's the most important gap.
- **Terms §9.7 (our data-processing agreement with each business):** it says that when a business closes its account we delete its customers' data unless the law requires otherwise. That directly contradicts keeping its sales records.
- **Terms §12 (closing an account):** it doesn't mention the export of sales records, domains being kept, or a plan running to the end of its term.
- **The Terms have no cancellation clause** at all, and paid plans will need one.

**One thing for your lawyer, which could change a decision:** UK and EU consumers have a legal 14-day right to cancel digital services. "Cancelling just stops renewal, with no refund" can't override that. REQ-640 flags it. The same goes for subscriptions a business sells to its own customers: they'll need to be able to refund by hand.

**Two smaller points:**
- **There's an unpublished Terms draft from 31 October, owned by EPIC-29.** REQ-640 says to add the changes to it rather than start a third version, if it's still unpublished.
- **The email fingerprint isn't built yet.** The code's "suppression" is a block on incoming mail, not the fingerprint that keeps an erased email off mailing lists. So the Privacy Notice shouldn't mention the fingerprint yet.

The portal change has a test; the legal documents don't, because they're document changes.

<!-- xgd-turn id="ec5b6998-fa3d-4386-9147-57ad57c81f8f-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T17:54:58.987350+00:00" -->
#### You
**One thing for your lawyer, which could change a decision:** UK and EU consumers have a legal 14-day right to cancel digital services. "Cancelling just stops renewal, with no refund" can't override that. REQ-640 flags it. The same goes for subscriptions a business sells to its own customers: they'll need to be able to refund by hand. <-- really? That is the first I have heard that rule. Are you sure? If so we have to support automated refunds - I'm not doing it by hand. Customers in those regions need to be given refunds if they cancel prior to 14 days before their end of term. (Is that for annual billing too?)

EPIC 29 is responsible for the T&C can you add a note to its ticket pointing to these changes and I will have it update them

<!-- xgd-turn id="ec5b6998-fa3d-4386-9147-57ad57c81f8f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T17:56:52.380640+00:00" -->
#### Claude
I'm adding the cancellation-right correction to EPIC-9 and REQ-640, then the note to EPIC-29.

Now the note for EPIC-29.

One more edit, so two sessions don't both write the legal text: REQ-640 now says its §2 and §3 belong to EPIC-29.

Yes, the rule is real, but I'd been unclear about how it works. **The 14 days runs from when the customer signs up, not up to the end of their term.** I'm confident of the core rule. A lawyer still needs to confirm the details, and one part I'm unsure of is marked below.

**How it works:**
- **Who has the right:** UK and EU consumers who buy online or by phone can cancel within 14 days of the contract starting. It comes from the EU's Consumer Rights Directive and the UK's Consumer Contracts Regulations 2013.
- **Who doesn't:** businesses buying for business purposes have no such right. Most 1st Contact customers are businesses, so for our own plans it mostly won't apply. It does apply to the people buying from a business's shop, who are usually consumers.
- **What they get back:** if they asked for the service to start straight away, which checkout would ask them to confirm, they get back the unused part, pro rata. It isn't a full refund.
- **Annual billing:** the right applies the same way on monthly and annual billing.
- **Renewals:** an automatic renewal normally doesn't open a new 14 days. The exception is the UK's Digital Markets, Competition and Consumers Act 2024, which adds a fresh 14 days after each renewal of a subscription lasting 12 months or more, and after a free trial turns into a paid one. **I'm not sure whether that part is in force yet**, so the lawyer needs to check its start date.
- **Shop goods** have their own rule: 14 days from delivery, and the goods come back.

**Automating it** is straightforward and fits what we've designed:
- **Cancelling inside a cooling-off window** ends the subscription immediately. It triggers an automatic pro-rata refund through Stripe, with its credit note from REQ-637.
- **Cancelling outside one** just stops renewal, as before.

I've recorded this in EPIC-9 as your requirement that these refunds are never done by hand. Businesses will get the same automatic rule for the subscriptions they sell to their own customers.

**Decision for you:** should it apply only to UK and EU consumers, or to everyone? I'd recommend everyone. Restricting it means deciding who counts as a consumer and checking their country on every cancellation, which is exactly the kind of rule that's hard to automate reliably. The cost is small: a pro-rata refund within the first two weeks.

**EPIC-29 has the note.** I've added a section to its ticket listing the changes and pointing to REQ-640 §2 and §3 for the exact wording. It also covers:
- using the unpublished 31 October Terms draft rather than starting a new version
- publishing before the first live payment, and not before
- the points the lawyer needs to review

I've narrowed REQ-640 to the portal page only, so its coding session and EPIC-29 don't both edit the legal documents.

<!-- xgd-turn id="3645d0a4-ea2d-4ccd-b0de-09347c2e5a0e-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T18:02:35.815135+00:00" -->
#### You
Apply it to everyone much simpler

<!-- xgd-turn id="3645d0a4-ea2d-4ccd-b0de-09347c2e5a0e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T18:03:10.338451+00:00" -->
#### Claude
Recording that in EPIC-9, REQ-640 and the EPIC-29 note.

The 14-day cancellation-with-refund rule now applies to everyone, in every country, whether they're a consumer or a business. I've recorded it in EPIC-9, in REQ-640's cancellation clause, and in the note on EPIC-29's ticket.

Cancelling within any of these windows ends the subscription immediately, with an automatic refund of the unused part:
- the first 14 days of any subscription
- the 14 days after each renewal of a subscription that runs 12 months or more
- the 14 days after a free or discounted trial turns into a paid one

Cancelling at any other time stops renewal; the service runs to the end of the term with no refund.

Because everyone gets all three windows, we never need to know whether the UK's new subscription law is in force yet, or which customers it covers. Subscriptions a business sells to its own customers follow the same rule by default.

<!-- xgd-turn id="2c52b908-3a3f-4674-835c-20c773b59e54-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T21:14:56.857378+00:00" -->
#### You
Check the transcript and comments on TODO-18 Stripe accounts are now set up - what's next?

<!-- xgd-turn id="2c52b908-3a3f-4674-835c-20c773b59e54-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T21:15:37.693099+00:00" -->
#### Claude
I'm reading TODO-18 and its comments.

TODO-18 is done. The sandbox side is complete: Connect is switched on with Standard accounts and OAuth, and the test client ID is recorded. You've confirmed `STRIPE_SECRET_KEY_TEST` is in the secrets file. The live steps (two-factor sign-in, verifying both accounts, live Connect and the live client ID) have moved to TODO-20 for you. Meanwhile REQ-637, the invoices piece, is built and at `ready_to_reconcile`.

**What's next is the second foundation piece I outlined earlier: the Stripe connection.** It isn't filed yet. Everything it needs from Stripe now exists in the sandbox, so it can be built and tested end to end in test mode without waiting for TODO-20. It would cover:

- **Stripe on Workers:**
  - Every call picks its key from one function, using the mode stored on the record.
  - At startup the worker checks that the test and live keys aren't swapped.
  - Room for a per-payment platform fee later, set to zero for now (from TODO-18's notes).
- **Where the live key lives.** `bin/deploy` pushes the whole secrets file to production, so the live key can't go there. I'd make it a production-only Worker secret that you set once by hand from your password manager. The deploy checks it's present but never writes it. Deploy also checks each key against Stripe before pushing.
- **Connecting a Stripe account, in Settings → Payments:**
  - A Connect button that sends the owner to Stripe and back.
  - The business's Stripe account id, stored against the business.
  - The four connection states, a Disconnect button, and the "Connect Stripe to start selling" prompt on the Shop tab.
  - It gives you the return addresses to register in Stripe, which TODO-18 left empty.
- **Webhooks:**
  - One endpoint per mode, each with its own signature check.
  - A record of event ids, so a retried event is processed only once.
  - Handlers that other code registers, which is where the Shop and REQ-637's mark-paid plug in.
  - Handling for Stripe's account-change and disconnection events.
  - Locally, the Stripe command-line tool forwards test events to the dev server. You'd install it; the ticket will give you the command.
- **The payment cache:** payment attempts and refunds, recorded from webhooks. Under DOC-37 these are kept as money records, not thrown away.

**Two things the ticket would note from your Stripe setup:**
- **Test keys:** the sandbox's full `sk_test_` key is fine for development. If production uses a restricted key, the "Full access except sensitive operations" tier blocks creating connected accounts through the API.
- **Linking account B:** our own business account will be the first real use of the Connect button. That first link also checks whether Stripe lets B link to A while both sit in the same Stripe organization.

**Not in it:** creating the Checkout session and the purchase round trip. Those wait for the Shop's orders and Checkout endpoint (EPIC-31), as planned for week 3 of GOAL-55.

Shall I file it as a child of EPIC-9?

<!-- xgd-turn id="d5c47cfe-00db-4c92-a046-4303e8e80a36-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T21:17:29.099750+00:00" -->
#### You
Yes lets just get the connection.

Does it cover the UI to link an customer stripe account to the 1c Platform account?

<!-- xgd-turn id="d5c47cfe-00db-4c92-a046-4303e8e80a36-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T21:30:45.785828+00:00" -->
#### Claude
Yes, the Settings → Payments section is the UI where a business owner links their own Stripe account to our platform account. I'll keep this ticket to the connection only. I'm checking the Settings tab code, secrets handling and the migration numbering so the ticket fits what exists.

The ticket was created; the lookup that followed hung. Finding the new id another way.

Yes, it covers that UI. I've filed **REQ-641, "Payments: connect a business's Stripe account (Settings → Payments)"**. It's a child of EPIC-9, left at `draft`. It's connection only: no webhooks, no payment records and no Checkout. It can be built and tested now against the Stripe sandbox you set up.

**The UI, in Settings → Payments:**
- **Connect Stripe** sends the owner to Stripe's own sign-in page. They sign in to their existing account, or create one there, approve 1st Contact, and come back to the section showing the new state. They never handle an account id or a key.
- **The section shows one of four states:**
  - not connected
  - ready to take payments
  - needs attention, which says what Stripe is waiting for and links to their Stripe dashboard
  - disconnected by Stripe, meaning they removed us in their Stripe dashboard, with an offer to connect again
- **Disconnect** asks for confirmation and removes our access in Stripe.
- **The Shop tab** shows "Connect Stripe to start selling" until the business is ready.
- **Only members allowed to manage the business's settings** can connect or disconnect.

**Choices I made in the ticket:**
- **The state is read live from Stripe each time the section opens**, never from our own copy. That's why this ticket doesn't need webhooks: Stripe can disable an account, or the owner can unlink us, without telling us.
- **We store only the Stripe account id.** The sign-in with Stripe also hands us keys for the business's own account; those are thrown away. Every later call uses our platform key on the business's behalf.
- **The live key never goes in the shared secrets file.** It's pushed to production only when you've exported it in your shell for that deploy, from your password manager; otherwise the deploy leaves the production key as it is.
- **Live mode is a configuration change only.** Production says payments "aren't available yet" until TODO-20 supplies the live client ID and key, and it never quietly falls back to test mode.
- **No new libraries:** Stripe is called directly, so there's nothing for you to install.
- **A Stripe account can be linked to only one business.**

**You'll need to register the return addresses in Stripe.** When the coding session finishes, it reports the exact addresses for dev and production for you to paste into your Stripe settings.

The ticket has ten tests. They run against a stand-in for Stripe, plus an optional check against the real sandbox when the test key is present.

That stopped job was only the lookup that hung after the ticket was created. Nothing was lost: REQ-641 exists and is listed under EPIC-9, so there's nothing to rerun.

<!-- xgd-turn id="8775036b-6e44-48e6-9b64-33f2d2196167-user" -->

<!-- xgd-chat role="user" ts="2026-11-03T23:07:52.697459+00:00" -->
#### You
Clicking connect to strripe gives: 

| error |  |
| --- | --- |
| message | "Invalid request: Invalid redirect URI 'https://localhost:8789/api/stripe/connect/return'. Ensure this uri exactly matches one of the uris specified in your application settings" |

<!-- xgd-turn id="8775036b-6e44-48e6-9b64-33f2d2196167-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-03T23:09:09.750083+00:00" -->
#### Claude
This one is a Stripe setting, not a code fault. Stripe only sends an owner back to an address you've registered in its Connect settings, and the dev address isn't registered yet. This is the step I said would come after REQ-641: registering the return addresses in Stripe.

The address the dev app sends is right. It's set in `apps/control-app/wrangler.toml:842` and matches the error exactly.

**To fix it, in the Stripe sandbox (test mode):**
1. Open **Settings → Connect → Onboarding options → OAuth**. In some Dashboard versions this is under **Connect settings → OAuth settings**.
2. Under **Redirects**, add exactly:
   `https://localhost:8789/api/stripe/connect/return`
3. Save it, then click **Connect Stripe** again. You don't need to restart anything.

The address has to match character for character: `https`, port `8789`, and no slash at the end. Test mode accepts localhost addresses.

**Later, for production:** add `https://app.1stcontact.io/api/stripe/connect/return` (`wrangler.toml:661`) to the **live-mode** Connect redirects. That fits with the other live steps on TODO-20, so I'd add it there unless you'd rather do it now.

If it still fails after you've registered the address, send me the new error.

<!-- xgd-turn id="b6968673-9b34-44fd-86cf-ee002fc29195-user" -->

<!-- xgd-chat role="user" ts="2026-11-04T16:06:20.468967+00:00" -->
#### You
Please review that last turn of GOAL-55 I need an REQ for: webhooks, the payment cache and Checkout sessions, plus connecting `canTakePayments`.

<!-- xgd-turn id="b6968673-9b34-44fd-86cf-ee002fc29195-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-04T16:09:14.510469+00:00" -->
#### Claude
I've read the GOAL-55 plan and the current code. Now checking a few signatures so the ticket matches what exists.

Writing the ticket now.

I've filed **REQ-642, "Payments: Stripe webhooks, payment cache and Checkout sessions, wired to canTakePayments"**. It's a child of EPIC-9, at `draft` and high priority. I haven't written any code.

**What it covers:**
- **Connecting `canTakePayments`:** the placeholder at `catalog.ts:33`, which always says no, is deleted and replaced by the real check in `stripe-connect.ts:468`.
  - The mode comes from the business's own Stripe connection, never assumed to be live.
  - If Stripe can't be reached during a site build, the page shows the enquiry link instead of Buy, and the build still succeeds.
  - Connecting or disconnecting in Settings, and Stripe's account-change and disconnection events, all rebuild the business's sites, so Buy appears or disappears.
- **Webhooks:**
  - One endpoint each for test and live, each with its own signing secret. An endpoint with no secret refuses every event.
  - An event marked test arriving at the live endpoint, or the reverse, is rejected.
  - Each event is processed once. One that fails is left for Stripe to retry.
  - Events come from the businesses' own Stripe accounts, so they're matched to a business by the account id.
  - It covers every event on GOAL-55's launch list. A completed checkout marks the invoice paid and numbers it, but only if the amount and currency match the invoice. A mismatch is recorded as a payment issue and never accepted.
- **The payment cache:** payment attempts and refunds, keyed by Stripe id. Any entry can be dropped and read again from Stripe, no card data is stored, and the records are kept as money records.
- **Checkout sessions:** created on the business's own Stripe account from the order's exact amounts. Automatic capture, cards and wallets only, no Stripe invoices, no currency conversion, no Stripe tax, no platform fee. A session is refused if the total doesn't match the invoice, or the business can't take payments.

**How it joins up with the Shop:** the Shop registers a handler, and this ticket calls it with the order and its outcome (paid, expired, failed, refunded or amount mismatch). So REQ-642 can land before or after EPIC-31's orders ticket. **Whichever of the two lands second must pass a full test-mode purchase on our own test business** before it can be marked done.

**You'll need to do two things once it lands:**
- **Locally:** install Stripe's command-line tool to forward test events to the dev server. The coding session will give you the commands.
- **Production:** register both endpoints in Stripe as **events on connected accounts**, and set the two signing secrets. I've put this on TODO-20.

**Not filed yet:** the other two tickets from that GOAL-55 turn belong to EPIC-31: orders, shipping zones, the Checkout endpoint and Buy; then fulfilment, emails and returns. Ask the EPIC-31 session to file them.

<!-- xgd-turn id="f21da50b-250d-494a-81ff-23db689ab0b1-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T22:45:28.709745+00:00" -->
#### You
Do I need these for dev testing?

<!-- xgd-turn id="f21da50b-250d-494a-81ff-23db689ab0b1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T22:47:11.388553+00:00" -->
#### Claude
Checking what the REQ-642 build expects for dev; it has already landed.

You don't need the production half for dev testing. You need the Stripe command-line tool only if you want to watch real events reach your dev server.

**Not needed for dev:** registering the endpoints in Stripe's live settings and setting the live signing secret. That's TODO-20 work, for production only.

**Not needed for the automated tests:** they use a stand-in for Stripe, so they run without the command-line tool or any signing secret.

**Needed to try it by hand:** to see a test payment or a change to a connected account actually reach your dev server, Stripe has to be able to send it events. It can't reach `127.0.0.1` directly, so the command-line tool listens to your sandbox and forwards the events. Without it, the webhook endpoint just never receives anything. REQ-642 has already landed, so this works now:

1. Install it with `brew install stripe/stripe-cli/stripe`, then run `stripe login` and pick the sandbox.
2. Start forwarding. The events come from the businesses' own Stripe accounts, so you need the connected-account flag:
   ```
   stripe listen --forward-connect-to https://127.0.0.1:8789/api/stripe/webhook/test --skip-verify
   ```
   (`--skip-verify` because the dev server's certificate is self-signed.)
3. It prints a `whsec_…` signing secret. Put it in the dev secrets as `STRIPE_WEBHOOK_SECRET_TEST` and restart the dev worker. The test endpoint refuses every event while that secret is missing. The secret stays the same each time you run `stripe listen` on that login, so you only set it once.
4. Then connect a business in Settings → Payments, or run `stripe trigger account.updated`, and the events will show up.

You also don't need a webhook endpoint registered in the sandbox dashboard. The command-line tool takes its place.

One other change: the dev Connect return address in `wrangler.toml` is now `https://127.0.0.1:8789/api/stripe/connect/return`, not the `localhost` one I gave you earlier. A dev sign-in lands on `127.0.0.1`, so returning to `localhost` would leave you signed out. If you registered the `localhost` address in the sandbox, add the `127.0.0.1` one too.

<!-- xgd-turn id="17dd1e7b-2318-45e3-824f-c5b66e4b55bc-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T18:48:46.850215+00:00" -->
#### You
Please review the last few turns for EPIC-19. I am having difficulty completing a payment in dev - please can you review the symptoms and help me work through it.

I need help understanding the Shipping config it feels confusion to me. Can you explain each field and what are legal values please.

There were several bugs landed since I last tried so I am going to redeploy and try again

<!-- xgd-turn id="17dd1e7b-2318-45e3-824f-c5b66e4b55bc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T18:50:10.085470+00:00" -->
#### Claude
Reviewed EPIC-19's thread. BUG-372 (the critical Stripe fix) has since landed, so now I'm reading the current Shipping settings code to explain each field accurately.

I've caught up on EPIC-19's thread, checked what has landed since, and looked at your dev shop's data. **The fix that was blocking every payment (BUG-372) has landed**, so your redeploy should pick it up.

## Where the payment problem stands

The thread found two separate causes for "Payment could not be started":

1. **The EU zone held `EZ` ("Eurozone"), which isn't a country.** Stripe refused it. You've since replaced it: your dev shop now has **UK** (GB, €10.00), **Ireland** (IE, €10.00) and **USA** (US, €20.00). All three are valid.
2. **Our code sent a setting Stripe has retired (`payment_method_types`).** Stripe refused every checkout, whatever the country; this is why Ireland failed too. BUG-372 fixed it on 6 November. We no longer send that setting, and every Stripe request now names one fixed version of Stripe's interface, so a change on Stripe's side can't silently break us again.

There have been no checkout attempts since those two failures at 02:36 and 02:42 UTC, so nothing has been tried against the fixed code yet.

**After you redeploy:**
1. Hard-reload the builder.
2. On the checkout page, pick Ireland, the UK or the USA, then press Continue to payment. Since BUG-368 this works in the draft too; you don't need to publish.
3. Pay with test card `4242 4242 4242 4242`, any future expiry date and any CVC.
4. **If you want the order to show as paid,** keep `stripe listen --forward-connect-to https://127.0.0.1:8789/api/stripe/webhook/test --skip-verify` running, with its `whsec_…` secret set as `STRIPE_WEBHOOK_SECRET_TEST`. Without it Stripe takes the payment, but the confirmation never reaches your dev server, so the order never changes to paid.

**If it still fails:** in the draft, the error now adds "(Owner only: …)" with Stripe's exact reason. Visitors still see only the neutral sentence. You can also run `node tools/generate/bin/1c.mjs stripe smoke --business biz_dbe75328e63c90ffa777b0fa0ba9e1d1`. It opens a real test-mode checkout from your settings, prints Stripe's answer word for word, and then closes it. Send me whichever one you get.

## Shipping settings, field by field

The model: **a zone is a group of countries that all cost the same to ship to.** Each country can be in only one zone.

| Field | What it is | Allowed values |
|---|---|---|
| **Zone name** | Your label for the group, e.g. "Ireland", "Rest of EU", "Worldwide". | Required. No two zones can have the same name, even with different capitals. Any text. |
| **Rate per order (EUR)** | A flat shipping charge for one order to any country in the zone. It's the same for one item or ten. | A plain number as on a price label: `10`, `10.00`, `4.5`. No currency symbol, no commas, nothing negative. At most 2 decimal places (0 for currencies without cents, such as JPY). `0` means free shipping. It's in the business's **Default currency**, which must be set before you can add any zone. |
| **Countries** | Where this rate applies. The buyer's choice of country decides the zone, and Stripe's address form then accepts only that country. | Chosen from a list only; you can't type a code. The list is exactly the countries Stripe will ship to, so regions like "Eurozone" or "EU" can't be picked. **Whole EU** adds every EU member country that isn't already in another zone, each as its own entry you can remove. A zone needs at least one country. |
| **Dispatch note** (one per shop) | A line shown to buyers at checkout, e.g. "Ships within 3 working days". | Optional, up to 500 characters. |

**Two behaviours that aren't obvious:**
- **With no zones, your site shows no Buy button.** Shipping is what makes a product buyable.
- **If every zone has the same rate, checkout doesn't ask for a country.** There's nothing to choose between, so the "Please select a region for delivery" step is skipped and Stripe's address form offers every country you ship to. Your zones are €10 / €10 / €20, so your checkout does ask.

**One correction to the help text:** under Zone name it says "Buyers don't see it". That's wrong. The name appears on Stripe's payment page and on the invoice, as "Shipping — Ireland". Name zones with that in mind. I can file a small bug to fix the wording if you want.

<!-- xgd-turn id="fa1ea94c-0a62-4053-a268-9d43f42379e1-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T19:40:33.878963+00:00" -->
#### You
Ok please correct that text.

Please remove anything from the coutry list that will create an entry Stripe will reject (like EZ).

Then can you take a look at the payments page - I have done this twice now: I get to the region choice and click on the CTA to move forward and I get a blank page with gray boxes that shimmer as if they are loading but nothing happens

<!-- xgd-turn id="fa1ea94c-0a62-4053-a268-9d43f42379e1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T19:42:05.911599+00:00" -->
#### Claude
I've found what's causing the grey shimmering page and filed the fix as **BUG-374** (high, draft, under EPIC-9). It also carries the help-text correction. Nothing has been built yet, since this session only scopes tickets; BUG-374 needs its own session to build it.

**The grey boxes are Stripe's own loading screen, opened inside the builder's preview.** Our side is now working:
- Both of today's attempts, at 19:04 and 19:35 UTC to Ireland, created a test-mode order, and Stripe accepted the checkout session both times. So the BUG-372 fix works.
- The problem is what happens next. To send you to Stripe, the checkout page replaces itself with Stripe's payment page. In the builder that page is inside the preview frame, and Stripe's payment page won't run inside a frame: it draws its grey placeholder boxes and stops.
- An earlier fix (BUG-283) sends clicked links to other sites into a new tab, but this jump comes from the page's own code, not a click, so it isn't caught.
- On the published site the page isn't in a frame, so it works.
- I'm fairly confident of this but haven't seen it in your browser's console. The fix will confirm it with a real browser test.

**What BUG-374 changes:**
1. **In the builder, Continue to payment opens Stripe in a new tab** and the builder stays where it is.
   - The preview says "Payment opened in a new tab."
   - Stripe's "order complete" and "cancelled" pages come back in that tab.
   - If Stripe refuses the payment, no tab is left open and you get the usual error.
2. **The published site is unchanged.** Visitors go to Stripe in the same tab.
3. **More generally, nothing a site's own code sends to another website opens inside the preview.** It goes to a new tab, the same rule clicked links already follow.
4. **The Zone name help text is corrected** to: "Your own label for a group of destinations, e.g. 'Ireland', 'Rest of EU'. Buyers see it: it names the shipping line on the payment page and the invoice ('Shipping — Ireland')."

**The country list needs no change.** Since BUG-372 (deployed in your redeploy) it is exactly Stripe's own list of countries it can ship to. You can't type a code, so "Eurozone", "EU" and the like can no longer be added. If you still see "Eurozone" anywhere after the redeploy, tell me.

**To test a payment before BUG-374 lands, use the published site.** Stripe's page opens normally there. Pay with `4242 4242 4242 4242`, any future expiry date and any CVC. Your two attempts are still marked pending and are holding the piece; each expires on its own 30 minutes after it was created.

<!-- xgd-turn id="8dd62ec6-078a-4388-8ca1-08d85608f13e-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T21:53:07.712693+00:00" -->
#### You
ok good the checlout flow completed. I have not seen an email yet?

<!-- xgd-turn id="26c2ceec-7f10-477c-a315-f83ea330a785-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T21:53:37.111038+00:00" -->
#### You
ok good the checlout flow completed. I have not seen an email yet?

and I do not see my email address captured on the site as a contact?

<!-- xgd-turn id="26c2ceec-7f10-477c-a315-f83ea330a785-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T21:54:36.766585+00:00" -->
#### Claude
Your order is still `pending` in dev, so the payment confirmation never got back to the dev server. Checking now whether the email and the contact would be sent even once it does.

<!-- xgd-turn id="011b3805-ce0e-4a43-b995-32429769910f-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T21:54:39.717295+00:00" -->
#### You
Ah I have not set up stripe webhooks

<!-- xgd-turn id="011b3805-ce0e-4a43-b995-32429769910f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T21:54:58.518508+00:00" -->
#### Claude
Yes, that's the cause. Without webhooks Stripe takes the payment but never tells the dev server, so your order is still `pending`. I checked: no Stripe events have reached the dev server, `STRIPE_WEBHOOK_SECRET_TEST` isn't in your dev secrets, and the Stripe command-line tool isn't installed.

**To set it up in dev:**
1. Install the tool and sign in to your sandbox:
   ```
   brew install stripe/stripe-cli/stripe
   stripe login
   ```
2. Start forwarding, and leave it running while you test:
   ```
   stripe listen --forward-connect-to https://127.0.0.1:8789/api/stripe/webhook/test --skip-verify
   ```
3. It prints a `whsec_…` secret. Add it to `~/Documents/secrets/1c.dev.env` as `STRIPE_WEBHOOK_SECRET_TEST=whsec_…`, then restart the dev worker (or redeploy dev). The secret stays the same each time you run `stripe listen`, so you only add it once.
4. Place another test order. It should change to **paid** within a few seconds. Your earlier orders won't catch up: their events happened before anything was listening.

**Even with webhooks working, you won't get an email or see yourself as a contact yet.** Neither is built:
- **No email:** the order confirmation email, and the shipped, cancellation and refund emails, are in **REQ-644** (EPIC-31's after-sale ticket). It's still at `draft`, and nothing in today's code sends an email when an order is paid. Stripe can send its own test receipt, but only if receipts are switched on in that account's Stripe settings, so you may not see that either.
- **No contact:** a paid order records the buyer's name, email, phone and address on the order itself. It never adds them to the business's contacts. No ticket covers this yet, REQ-644 included.

I'd add "a paid order adds the buyer to the business's contacts, or updates them if already there" to REQ-644, rather than file another ticket, since it happens at the same moment as the confirmation email. REQ-644 belongs to EPIC-31, so shall I add it there, or would you rather raise it in the EPIC-31 session?

<!-- xgd-turn id="1d99b4fb-720b-4428-bb2f-fecb44307c2b-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T01:47:46.915713+00:00" -->
#### You
ok so progress I see "payment received" messages now, but there are no emails it seems in the test environment? I would like to test the email functionality...

Its probably time I set up a staging environment anyway - would I get emails from staging? Would we run real payments from staging?

<!-- xgd-turn id="1d99b4fb-720b-4428-bb2f-fecb44307c2b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T01:48:32.521453+00:00" -->
#### Claude
Good, the "payment received" messages mean webhooks are working and orders are being marked paid.

**The missing emails aren't caused by the test environment.** The dev worker has the Resend key, so it can send real email. Nothing sends an email when an order is paid because those emails haven't been built. The order confirmation, shipped, cancellation and refund emails are all in **REQ-644**, EPIC-31's after-sale ticket, which is still at `draft`. Once it's built, you'll be able to test the emails in dev with test payments.

**On staging:** there isn't one today, only local dev and production. A staging environment would be well worth having, and it would fix the awkward parts of dev testing:
- **Emails: yes.** Staging would send real email through Resend, exactly as production does, so you'd receive order emails in your own inbox.
- **Payments: test mode only, I'd recommend.** Staging would use the Stripe sandbox, so you pay with `4242…` cards and no real money moves. Unlike dev, Stripe can reach staging directly, so you'd register its webhook endpoint in the sandbox once and wouldn't need `stripe listen` running.
- **Real money only on production.** Live Stripe keys can move money, so I'd keep them in exactly one place. A staging copy would also be easy to mistake for production. To check a real payment end to end, make one small purchase on production from our own business and refund it.
- **What staging needs:**
  - its own Worker, database, storage and address (for example `staging.1stcontact.io`)
  - its own secrets, which reuse the test Stripe key and the Resend key
  - a `bin/deploy --env staging` target
  - a way to copy a site into it (the copy tools already handle dev ↔ cloud)

Do you want me to file staging as a ticket? I'd put it under EPIC-16, the environments epic, if that's still the right home.

Also still open from before: shall I add "a paid order adds the buyer to the business's contacts" to REQ-644?

<!-- xgd-turn id="4b0891ca-84be-4dc2-b880-81c7aa735a40-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T16:26:44.327719+00:00" -->
#### You
Ok great - we have end-to-end functionality on ecom - not bad for 6 days work!

There are a few tweaks needed:
1. The default screen for Shop should be Orders (if there are any) the screen should always go back to where it was last put
2. Can we talk through the states an order goes through? 
 - The order I just put through was set to Paid (good - it was) but the default filter was To Ship and it did not show - how does an Order get from Paid -> ToShip - should they be the same state?
 - There are 3 orders that are in "Awaiting payments" because the stripe callbacks were not set up. The payments did go through tho - how are those orders corrected? This could happen in prod if notifications are missed. One approach would be a manual "Refresh state" button on the order. Another approach would be to auto refresh when they are loaded or on some cadence - lets talk this through. I don't want to add arbitrary poll loops but I also want to avoid things going wrong for our customers
3. On Lauren's site the fonts used for the delivery region selection are many multiples in size of the text size. Can you check that our default is fixed and this is a specific issue with this site built after we fixed the default
4. There are some "special" (on demand) pages in this flow a. the product detail page b. the order confirmation page - how are these styled, does the consultant have control - can the owner see the pages? I see a Piece page that previews the product detail page? Can the order confirmation page include an image of the products? Could it link to the product detail pages? (actually there are two order pages - the one at the end of the purchase flow, Thank you page, and the one linked to by email  - should they be the same page? Either way how can the user see these and style them)
5. The flow breaks out of the preview panel when we go to stripe and pops into a new tab - not a big deal but untidy

<!-- xgd-turn id="4b0891ca-84be-4dc2-b880-81c7aa735a40-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T16:34:05.351185+00:00" -->
#### Claude
Working through your five points. Order states and Shop defaults are checked; now looking at the delivery-region font on Lauren's site.

Waiting on two lookups, one on the delivery-region font and one on the shop's special pages; I've got everything I need for the other three points.

Short answers on 1, 2 and 5. Two lookups are still running for 3 (the font) and 4 (the special pages); I'll answer those when they finish. If they don't come back, ask again and I'll redo them.

**Not 6 days well spent so much as 6 days well aimed — it's a real milestone.** Also note: REQ-644 landed this morning (07:54), so after your next deploy a paid order sends the confirmation email, and the shipped/cancel/refund emails exist too.

## 1. Shop should open on Orders and remember where you were

Today Shop always opens on Inventory, and Orders always opens on the "To ship" filter (`builder/shop.js:213`, `builder/orders.js:121`). I'd make it:
- **First visit:** Orders when the business has any orders, else Inventory.
- **After that:** whatever you last had: the mode, the Orders filter and search, and the open item or order, remembered per business on that browser.

## 2. Order states

**What exists:** an order is **Awaiting payment** → **Paid** or **Expired** (checkout abandoned, stock released). A paid order can then become **Shipped**, **Cancelled** or **Returned**.

**Why your order didn't show under To ship:** "To ship" isn't a state. It's a filter for *paid, not yet shipped, and live mode only* (`orders.ts:778`). Your order was a test payment, so it's deliberately left out. And you're right that it overlaps: the "Paid" filter already means "paid and not yet shipped/cancelled/returned", so **Paid and To ship are the same list except for test orders**. I'd merge them:
- One state, shown as **"Paid — to ship"**, and it's the default filter.
- **Test orders appear in it, tagged "Test"**, so you can rehearse shipping with them. (The "Test or live" filter is still there to hide them.)

**Stuck "Awaiting payment" orders.** You've found a real gap that would hit production: if Stripe's notification is missed, nothing ever corrects the order. It stays awaiting payment forever, holds the stock forever, the buyer's thank-you page says "confirming…" forever, and no confirmation email goes out. There's no sweep for these today.

The useful fact: a Stripe checkout lasts 30 minutes, and after that Stripe's answer is final (paid or expired). So we never need to poll *open* checkouts. Asking Stripe once about an order **past its 30 minutes** settles it for good. My proposal, with no new poll loop:
- **When the buyer lands on the thank-you page and the order is still awaiting payment,** ask Stripe about that session directly. This is the common case, and it fixes it within seconds, while the buyer is still looking.
- **When an owner opens Orders,** any order still awaiting payment past its 30 minutes is checked with Stripe once and corrected (marked paid with the buyer's details and the email sent, or expired with the stock released).
- **The existing 10-minute platform tick** does the same for a small batch of such orders, so stock is released even if nobody opens Orders. That tick already runs today for other housekeeping; this adds one bounded query to it.
- **A "Check with Stripe" button** on an awaiting-payment order as the manual fallback. With the three above it should rarely be needed, so I'd include it only if you want it.

A late correction runs the same code as the webhook would, so the order is never processed twice. Your three stuck dev orders would correct themselves the first time you open Orders.

## 5. Stripe opening in a new tab

That's BUG-374, on purpose: Stripe's hosted payment page refuses to run inside a frame, which is what caused the grey boxes. The tidy alternative is **Stripe's embedded checkout**, where Stripe's payment form sits inside our own checkout page. That works in the preview frame too, and on the published site the buyer never leaves the business's site, which is arguably better for buyers as well.

The cost: the checkout page loads Stripe's script from `js.stripe.com`. That's the first third-party script on a customer site, so it has to go through our security rules as an approved exception. It also needs the platform's publishable Stripe key. I'd call it worth doing, but not urgent.

**Once 3 and 4 are back, I'll propose how to ticket all of this.** Items 1, 2 and 5 are fixes to landed Shop work, so they'd be bug tickets. Most of it is EPIC-31's (Shop); the stuck-order correction is payments, so EPIC-9. Do you agree with the merged "Paid — to ship" state and the no-button correction plan?

The special-pages lookup is back, so here's **item 4**. The font lookup for item 3 is still running.

## 4. The special pages

There are four of these pages. All of them are ordinary site pages, drawn in the site's own fonts, colours, header and footer.

| Page | How it's made | Can the consultant style it? | Can the owner see it? |
|---|---|---|---|
| **Product detail** (your "Piece" page) | One template page; the site creates a copy for each item at `/shop/<item>` | Yes. It builds the template along with the shop grid | Yes. It's in the Page menu and previews with the first item |
| **Order complete** (Thank you) | The site's own page if the consultant made one, otherwise a built-in default | In principle, but its guidance doesn't describe this page, so in practice it won't | Not really. The default isn't in the Page menu; you only reach it by typing `/order-complete` or doing a real checkout |
| **Order cancelled** | Same as order complete | Same | Same. Its "Back to the shop" also goes to the home page, not the shop or the piece |
| **Order status** (linked from the emails, new in REQ-644) | A separate page reached by a private link, with no sign-in | Same as order complete | No. It needs the private link from a real order email, so you can't preview it without placing an order |

**Should the thank-you page and the email's status page be one page?** I'd say yes, as one page with two ways in:
- Straight after payment, it shows "Thank you, your order is confirmed" above the order details.
- From the email, the same page shows the order's progress: placed, shipped with tracking, refunded.

That means one page to style, and the buyer sees the same thing in both places. Today they're two separate pages that read different data. I'd keep order cancelled as its own small page.

**Product photos and links:** neither page has them today, but the data is there. Each order line already records which item it was. So both pages can show each item's photo and link its name to the item's product page. The order emails could show the photo too.

**So the owner can see and style these pages:**
- Order complete, order cancelled and order status appear in the Page menu as **shop pages**, marked as shown only during a purchase. They're not flagged as unlinked, and the Piece template isn't either.
- In the preview, each one shows with a sample order: your most recent test order, or made-up lines if there are none. You don't need a real purchase or email link.
- The consultant's guidance covers these pages, so it styles them with the rest of the shop and can change them when you ask.

I'll fold this, plus items 1, 2 and 5, into the ticket proposal once the font answer for item 3 is back.

Item 3's lookup is back too, so here's that, then how I'd ticket everything.

## 3. Delivery-region font on Lauren's site

I couldn't reproduce it. I checked the checkout page of the dev site that took your test orders, which I'm assuming is Lauren's:
- **The default is correct.** Since BUG-373 (landed 6 November, 20:27 UTC), a form control ignores the type set on the boxes around it. It uses its own text style, or else body text.
- **This site's stored page is fine too.** Its region list is set to body text, which is 17px on this site, and nothing around it overrides that. Drawn offline, it comes out at 17px, with today's framework and with the framework from before the fix.

**Something doesn't match, though.** You quoted "Please select a region for delivery", but this site's stored page says "Select region for delivery". So what you saw may not have been this page as stored. It could be a different site, production rather than dev, or a preview tab drawn before the fix.

**To settle it:**
1. Reload the preview.
2. If the text is still huge, send me a screenshot, plus the site's address if it's on production. Or right-click the list, choose **Inspect**, and tell me the font size shown under **Computed**.

## How I'd ticket it

I'd use **one bug** for the Shop work you've just tested, since it's all one branch and one area:
- **Item 1:** Shop opens on Orders when there are orders, and remembers its mode, filter and open order.
- **Item 2:** "Paid" and "To ship" merge into **"Paid — to ship"**, which includes test orders tagged "Test" and is the default filter.
- **Stuck orders:** an order still awaiting payment after its 30 minutes is checked with Stripe once and corrected. That happens on the thank-you page, when Orders is opened, and on the existing 10-minute tick, with no button unless you want one.
- **Item 4:**
  - One order page with two ways in, after payment and from the email.
  - Product photos and links to the product pages, on that page and in the emails.
  - Order complete, order cancelled and order status are listed in the Page menu and preview with a sample order.
  - The consultant's guidance covers these pages.
  - "Back to the shop" goes to the shop.

It would go under EPIC-31, since it's mostly Shop, or under EPIC-9 if you'd rather keep it here.

**Item 5 (embedded checkout)** I'd keep out of it for now, unless you decide to allow Stripe's script on customer sites. That's a security-policy decision rather than a fix. If you say yes, it can be folded into the same bug.

Shall I file it like that? And should the stuck-order "Check with Stripe" button be in it or not?

No response requested.

No response requested.

No response requested.

No response requested.

<!-- xgd-turn id="c4e1c2de-86fa-4765-be60-ae47b35211a9-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T16:49:27.523166+00:00" -->
#### You
On 5 - it is actually desirable to have the checkout occur on a single page - delivery region happens at the top and once it does the rest of the page can populate. Fewer checkout pages generally lead to more conversion. We could put this into the same ticket.

Please create the tickets - yes shop work should go under 31

<!-- xgd-turn id="c4e1c2de-86fa-4765-be60-ae47b35211a9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T16:50:35.023464+00:00" -->
#### Claude
I've filed one ticket for all of it: **BUG-375**, "Shop after the first sale…", under EPIC-31 at `draft`, high priority. Everything is in one area of the code, so splitting it would only add tickets. It needs a session of its own to build it.

**What it covers:**
1. **Shop opens on Orders** when there are any, and after that it reopens where you left it: Inventory or Orders, the filter, and the open item or order.
2. **One "Paid — to ship" state** replaces the separate Paid and To ship filters. It's the default, and it includes test orders, tagged "Test".
3. **Missed Stripe notifications fix themselves.** An order still awaiting payment is checked with Stripe:
   - on the thank-you page, as soon as the buyer comes back from paying;
   - and once it's more than 30 minutes old, whenever you open Orders, and on the platform's existing 10-minute check (a few orders at a time).

   Each order is settled once: marked paid and the confirmation email sent, or expired and the piece released. No new polling and no button. Your three stuck dev orders will correct themselves the first time you open Orders after it lands.
4. **The order pages:**
   - The thank-you page and the email's order page become one page, with each line showing the piece's photo and linking to its product page.
   - The order emails show the photos too.
   - "Back to the shop" goes to the piece or the shop, not the home page.
   - The order pages appear in the Page menu as shop pages and preview with a sample order.
   - The consultant's guidance covers them.
5. **Single-page checkout:**
   - You choose the delivery region at the top, then Stripe's payment form appears below it on the same page.
   - If every zone has the same rate, there's no question and the form appears straight away.
   - It works inside the builder preview, so the new-tab workaround is removed.

**Two things you'll need to know when it's built:**
- **It needs Stripe's publishable test key.** That's the `pk_test_…` key in your Stripe sandbox's API keys page; it's not a secret. The session will tell you the exact name to add to your dev secrets file. The live one joins TODO-20.
- **This is the first outside script on customer sites.** Stripe's script will load only on the checkout page, only from Stripe's own address, and only when the business can take payments. The ticket records this exception in the security policy, with the reason.

The oversized region font isn't in the ticket, because I couldn't reproduce it. If it shows up again, send a screenshot.

One thing still open from yesterday: should a paid order add the buyer to the business's contacts? REQ-644 didn't include it. If you want it, I'll add it to BUG-375.

<!-- xgd-turn id="a1cb3ced-44a9-42a3-84e1-63105c50a8a4-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T17:45:50.447742+00:00" -->
#### You
oh I have started 375. Please create another ticket for that an REQ...

yes this is really important a purchaser is a contact absolutely and any emails that we send them should be tracked in the contact system. If they successfully make a purchase they should graduate to customer (not just contact).

I don't remember seeing a T&C on the purchase flow - I assume we need one? What about privacy?

<!-- xgd-turn id="a1cb3ced-44a9-42a3-84e1-63105c50a8a4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T17:47:30.831649+00:00" -->
#### Claude
I've filed **REQ-659**, "Shop: a buyer becomes a contact, a paid order graduates them to customer, and every order email is tracked on the contact". It's under EPIC-31 at `draft`, high priority, and still needs its own session to build it. It doesn't touch BUG-375, which you've already started.

**What REQ-659 does:**
- **A paid order adds the buyer to the business's contacts.** If their email already belongs to a contact (ignoring capitals), that contact is used, and their name and phone are only filled in where empty. The delivery address stays on the order and isn't copied to the contact.
- **A new "customer" stage**, after lead and invited, is set by their first paid order. A later refund or cancellation never moves them back; the refund just shows in their history.
- **Their history records the order:** paid, then shipped, cancelled, refunded or returned.
- **Every order email is recorded on the contact,** and Stripe-style delivered and bounced notices from our email provider attach to it too, as they already do for other emails.
- **People shows a customer's orders,** each one opening in Shop → Orders, and an order links back to its buyer.
- **Buying never signs anyone up to a mailing list.**
- **Test-mode orders do the same,** marked Test, so you can try it out.

## Terms and privacy at checkout

You're right, neither is there. A business's site today has no terms of sale and no privacy notice. Our own Terms of Service and Privacy Notice (DOC-84/85) only cover the business owners who use our platform, not the business's buyers. This is my understanding rather than legal advice, but for EU/UK sales I believe the minimum is:

- **Terms of sale:**
  - who the seller is, with an address
  - the total price including delivery
  - delivery times
  - the **14-day right to cancel** for distance sales, with how to return an item and any exceptions (made-to-order work, for example)
  - how to complain

  These must be available before the buyer pays, and confirmed afterwards in a lasting form; the confirmation email can do that.
- **Privacy notice:** what the business collects, why, how long it's kept, who processes it (Stripe, us, the email provider), and how to ask for a copy or deletion. Contact forms already need this too, since they collect personal data.

**What I'd propose:**
1. **Two standard pages for every business that sells:** *Terms of sale* and *Privacy notice*.
   - They're drafted from our templates, filled in with the business's own details (name, address, delivery note, shipping zones, returns window).
   - The owner reviews and edits them, and they're published as site pages linked from the footer.
2. **At checkout, one line above the payment button,** with no tick box (tick boxes cost sales): "By paying you agree to our Terms of sale. See our Privacy notice." Both are links. The version shown is recorded against the buyer's contact, using the acceptance records we already have.
3. **The confirmation email includes the terms,** or a lasting link to that exact version.
4. **No Buy button until both pages are published,** just as there's none without a shipping zone. The Shop tab says what's missing.

One caveat: the template wording needs a proper legal review before anyone sells for real. I'd treat that as a launch item for you rather than something the code can settle.

Shall I file this as a third ticket under EPIC-31? It's a separate concern from contacts, so I'd keep it apart from REQ-659.

<!-- xgd-turn id="787bf0f1-931f-4836-a5a4-2896037ccf33-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T17:49:15.877277+00:00" -->
#### You
This is a job for EPIC-29 I will pick it up there.

<!-- xgd-turn id="787bf0f1-931f-4836-a5a4-2896037ccf33-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T17:49:24.234906+00:00" -->
#### Claude
Understood, I'll leave terms of sale and privacy to EPIC-29 and won't file anything for them here. Whenever you raise it there, the proposal from my last message is ready to paste in.

Where things stand from this session:
- **BUG-375 (Shop changes):** under EPIC-31 and already started.
- **REQ-659 (buyers become contacts and customers):** under EPIC-31, at `draft` and waiting for its own session.
- **Region-font issue:** I couldn't reproduce it, so I haven't filed anything. Send a screenshot if you see it again.
- **Staging environment:** not filed yet. Tell me if you want a ticket for it.

<!-- xgd-turn id="b5112742-8ed0-472e-89cd-911316c7656e-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T00:28:59.630696+00:00" -->
#### You
Thes messag in Settings is pretty opque: **1st Contact Business**

Stripe is waiting for:

- person 1UXnqE4GZw3Z6WOcfLgJJuXi verification document live capture
  
  What's needed?

<!-- xgd-turn id="b5112742-8ed0-472e-89cd-911316c7656e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T00:30:39.594070+00:00" -->
#### Claude
**What Stripe wants:** a photo ID for one of the people on the "1st Contact Business" Stripe account, normally you as owner or representative. "Live capture" means Stripe wants the photo taken live with a phone camera, not uploaded from a file. The code `1UXnqE4G…` is just Stripe's internal label for that person.

**What to do:**
1. Sign in to that account's Stripe dashboard.
2. Look for the banner at the top asking you to verify your identity, or go to **Settings → Business → Team / Personal details**.
3. Follow the prompt. It gives you a QR code or link to finish on your phone: you photograph your ID and usually take a selfie too.

**Payments aren't blocked yet.** Your test checkouts went through while this message was showing. Stripe has asked but not yet paused the account. If it isn't done by Stripe's deadline, payments can be paused.

**This is your dev sandbox,** which is in test mode. There Stripe usually lets you finish this step with test data instead of a real ID (a "use test document" option appears during the step). The real ID check will come when you verify the live account on TODO-20.

**I've filed BUG-379** (medium, under EPIC-9) to make this message understandable:
- **Plain words for each request,** for example "Photo ID for one of the people on the account, taken live with a phone camera". Stripe's codes are never shown.
- **Whether payments are affected:**
  - "Payments work, but Stripe needs this by [date]"
  - "Overdue — Stripe may pause payments"
  - "Payments are paused until …"
- **Where to go:** sign in to the Stripe dashboard and look for the banner at the top.
- **The assistants use the same wording** when they report whether payments are ready.

It's at `draft` and needs its own session to build it.

<!-- xgd-chat-end -->