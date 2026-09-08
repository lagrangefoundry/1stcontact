---
uid: comment-ee4468fa
id: COMMENT-2310
type: comment
title: Comment on doc DOC-4
created_by: xgd
created_at: '2026-09-07T23:04:25.684856+00:00'
updated_at: '2026-09-08T01:47:41.941387+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: doc-7937c11c
  kind: chat_transcript
---

<!-- xgd-turn id="c855789c-92f1-4351-9e02-459497dfae89-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T23:03:12.280175+00:00" -->
#### You
Let's talk about how this business proposition may or may not have changed. I feel like the caretaker framing is wrong. I'm not sure if our story has developed since this was created or if I just look at it differently in hindsight. But I feel that this is not just about keeping a website up and running, it is about creating a beautiful non-templated website in consultation with the user and supporting many of the functions that a small business needs.

Let's review at a high-level the functionality that we are planning today:
 - Website creation
 - Contact management
 - Email lists
 - Marketing consultancy - advice on marketing, social media posting, email lists calendar, reminders, content creation support, what's working what's not?
 - Basic invoicing, billing and payments including subscriptions
 - Scheduling - calenderly light
 - Site monitoring

<!-- xgd-turn id="c855789c-92f1-4351-9e02-459497dfae89-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T23:08:46.124385+00:00" -->
#### Claude
I read DOC-4 in full. Your instinct is right, and it isn't hindsight — the story genuinely moved, and there's dated evidence for where it moved to.

## What changed since DOC-4 was written

DOC-4 (2026-06-30) is a *subscription product* document. Everything in it flows from "~$50/month, sits between DIY builder and agency." Three later documents contradict that shape:

- **DOC-33 (Consultation Playbook)** specifies a **paid, 4–5 hour consultative design session** with acts, stage gates, and a decision ledger. That is a service engagement, not a subscription feature. DOC-4 has no concept of it.
- **DOC-32 (Why People Pay For Design)** says the thing people buy is direct access to whoever does the work, an outcome, and *strategic pushback* — and recommends leading with the boutique narrative so we're compared to $2,500–5,000 independent designers rather than $20/mo Wix.
- **DOC-31** makes non-template design the differentiation thesis, and finds that most of the differentiation is taste and restraint, not technical spectacle.

Meanwhile DOC-4's own "Future Expansion" section defers newsletters, appointment booking, marketing content and follow-up automation *until customer demand justifies them* — and your list has five of them as current scope.

So DOC-4 is describing a narrower product at a lower price point with a different sales motion. It isn't wrong so much as superseded.

## Why "caretaker" specifically fails now

Three separate problems, in increasing order of importance:

**It names one of seven functions.** Site monitoring is caretaking. Nothing else on your list is. Website *creation* is the opposite of caretaking — it's the act of making, and it's the moment the client is actually paying attention.

**It's the wrong register commercially.** "Caretaker" is custodial — a janitor for your website. DOC-32's whole finding is that the register decides the comparison set, and the comparison set decides the price. Caretaker anchors against maintenance plans. "Stop worrying about your website" is anxiety relief, which is a $30/mo emotion.

**It obscures the actual differentiator.** Read as a list, your seven functions look like a bundle — Wix + Mailchimp + Calendly + Stripe + HubSpot + Pingdom, cheaper. That's a bad pitch, because a bundle is beaten by a better bundle. What we actually have is different in kind, and I'd argue it's this:

> Every one of those functions was **designed into the page**, and every one of them **shares the memory of the consultation**.

DOC-33 §11 already makes the first half explicit: payments and email capture are *in the page*, CRM is behind it, monitoring around it, marketing off it. The booking surface isn't a third-party embed crashing into the design — it was composed with the page. The second half is the ledger: the record of what was decided and *why*, which the marketing advice and the follow-up sequences read from. Mailchimp does not know why you chose your positioning. That's the moat, and "caretaker" hides it completely.

## The frame I'd replace it with

**The front office.** Everything from "a stranger might become a customer" through "money changes hands." Not accounting, not payroll, not inventory, not fulfilment — those are back office.

It earns its place because it *justifies the exclusions DOC-4 already makes but doesn't explain*. DOC-4 says "the platform should stop at the point where money is collected" and then lists ERP/inventory/shipping/accounting as deliberate exclusions. Those are the same line, drawn twice, unnamed. Name it once and both fall out.

It also maps your seven cleanly: the site is where they find you; contacts is who has reached you; email lists and marketing are how you get them to; scheduling and payments are the transaction; monitoring is making sure the front door is open. And the product name already does this work — *1st Contact* is a name about the moment a business meets a customer.

## The other cut worth making

Your list mixes two kinds of thing, and I think that's a feature rather than a muddle:

- **Consults** — the design session, marketing advice, what's working and what isn't
- **Executes** — the site, contacts, lists, invoicing, scheduling, monitoring

Marketing consultancy is the odd one out on your list *only* if you read the product as software. Read as "an AI that consults, plus machinery that executes what was decided," it's the second instance of the thing DOC-33 already specifies in detail for design. Same shape, different subject, same ledger.

That also gives the two-moment commercial structure DOC-4 lacks: a paid engagement that produces something, then an ongoing relationship that runs it — with the ledger as the continuity between them, which is exactly what DOC-33 §10 hands over at stage 10.

## Two gaps in your list

- **Scheduling appears nowhere** in DOC-4 (except deferred "appointment booking") and is missing from DOC-33 §11's limb table. It's an in-page capability — a booking surface with states and a destination — so it's a stage-1 brief decision, same class as payments. Worth adding to that table.
- **The ~$50/month figure needs re-deriving.** It was set as "cheap agency." DOC-32 says the comparable is B12 at $1,999 one-time plus a subscription, and that $200–$1,000 is a deliberate discount off a real anchor. Those are different positions and DOC-4 encodes the older one.

---

I'd propose rewriting DOC-4 as the front-office proposition: two moments, one relationship, the boundary named once, the not-a-bundle claim made explicitly, and the superseded pricing/deferral sections corrected against DOC-31/32/33. The title would go too — "Webcaretaker" is legacy.

Want me to draft that? And is "front office" the frame you want, or would you rather I put up two or three genuinely different framings first?

<!-- xgd-turn id="e2e91886-f6a7-48b0-b789-323a2eb8907b-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T00:03:10.786758+00:00" -->
#### You
Lets not get drawn into a pricing discussion - we are months off that mattering. Messaging matters now.

Can you update the document with this new perspective - I am starting to work on the 1c website

<!-- xgd-turn id="e2e91886-f6a7-48b0-b789-323a2eb8907b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T00:05:25.145211+00:00" -->
#### Claude
Cross-references check out. Writing the revision now.

DOC-4 is updated and retitled. Frontmatter and fields preserved.

**What's new**

- **The front office** is now the organising frame, with an explicit boundary — stranger → money changes hands, and everything after it is someone else's. The deliberate exclusions are now *consequences* of that line rather than a separate list, and the seven capabilities each get a one-line placement in it.
- **Two moments, one relationship** — the engagement produces the ledger, the operation runs from it. Stage 10 of DOC-33 is framed as the start of the ongoing tier, not a handover.
- **Three theses** where there was one. The expressive thesis is preserved verbatim; added "not a bundle" (capabilities designed *into* the page vs. embedded onto it — the competitor is the seven-tool duct-taped stack, not Wix) and "the machinery remembers the consultation" (the ledger as moat).
- **A Messaging section** you can write site copy from directly: the Not/Is list, primary and secondary value props, and a lead-with/avoid word list derived from DOC-32. *Caretaker*, *maintain*, *hassle-free*, *all-in-one*, *dashboard* are all on the avoid side, with the reasoning recorded so it doesn't get relitigated.
- **Scope corrected** — email lists, scheduling and marketing consultancy moved out of Future Expansion into numbered scope, each tagged with its relationship to the site (in-page / behind / around / off).
- **A revision note** at the bottom saying what changed and why, so the delta is legible later.

**Pricing** — withdrawn from positioning entirely, as you asked. I left one short paragraph in Business Strategy saying it's deliberately deferred and explaining *why* the old ~$50/mo framing came out (it selected the wrong comparison set), with a pointer to DOC-32 for when it becomes live. That felt better than silently deleting it, since the old number is quoted in other places.

**Two things worth your attention:**

1. **Scheduling isn't in DOC-33 §11's limb table.** It's an in-page capability — a booking surface with states and a destination, same class as payments — so it should be a stage-1 brief decision. I flagged it inline in DOC-4 rather than editing DOC-33 without asking. Want me to add that row?

2. **"1st Contact runs its own business on 1st Contact"** — I added that line to the XGD section because it's a strong messaging asset for the site you're about to build (the recursion is provable, not a claim). If that's overstating where the self-hosting actually is today, tell me and I'll pull it.

<!-- xgd-turn id="34c8174d-e938-4ae4-9471-e34b0971f6a9-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T01:47:41.538022+00:00" -->
#### You
Please add scheduling to DOC 33 - its new

Can you identify some candidate comp websites that I should look at?

<!-- xgd-chat-end -->