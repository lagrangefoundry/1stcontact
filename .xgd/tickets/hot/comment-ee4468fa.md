---
uid: comment-ee4468fa
id: COMMENT-2310
type: comment
title: Comment on doc DOC-4
created_by: xgd
created_at: '2026-09-07T23:04:25.684856+00:00'
updated_at: '2026-09-08T02:03:00.754172+00:00'
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

<!-- xgd-turn id="34c8174d-e938-4ae4-9471-e34b0971f6a9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T01:50:02.692553+00:00" -->
#### Claude
B12 is now $399/mo bundling scheduling, invoicing, payments, CRM and email marketing — that's our exact capability list. Worth digging into. Let me do the DOC-33 edit and more searches together.

DOC-33 §11 updated — scheduling row added between Email capture and CRM (in-page, stage 1, constrains architecture/copy/layout, plus timezone/cancellation/reminder obligations), the intro sentence now lists it, and I flagged that **DOC-25 doesn't declare scheduling as a behavior module yet** — it only has a `calendar` formatting primitive. Until that declaration exists, scheduling can't appear in the stage-1 capability catalogue, since the catalogue is projected from declarations rather than hand-written. That's a real gap, not a doc nit.

## Comps worth looking at

Two findings first, because they change what you're looking at:

**B12 has moved.** The comparison articles still describe it as the AI+human hybrid for service businesses at $399/mo, bundling scheduling, invoicing, payments, CRM and email marketing — our exact list. But their homepage today reads *"Describe your idea. Launch in minutes."* with stores, web apps, animation and task management, and no mention of scheduling, CRM or email marketing. They've pivoted toward the Lovable/v0 vibe-coding register. If that holds, the position they're vacating — AI-built front office for service businesses, sold as a considered engagement — is the one we're walking into.

**Squarespace bundles by billing, not by design.** They have all seven capabilities, and sell scheduling (Acuity, +$16/mo), email campaigns (+$14–68/mo) and payments as separate subscriptions on top of the site plan — roughly $700–1,200/yr all-in. Acuity is a separate product with its own identity bolted onto your page. That is the not-a-bundle thesis demonstrated by the market leader, and it's the single best concrete example for your copy.

### 1. Capability comps — read these for positioning, not design

| Site | Why |
|---|---|
| b12.io | Closest historical comp; check whether the pivot is real across their whole site or just the homepage |
| honeybook.com | Front office for service businesses done well; strong "client flow" language you'll be competing with |
| dubsado.com, 17hats.com | Same space, solo-founder end. 17hats from $15/mo, Dubsado $20, HoneyBook $39 — all no website |
| squarespace.com + acuityscheduling.com | The add-on seams are visible; look at them side by side |

The gap in all four: HoneyBook/Dubsado/17hats have the front office but **no website**. Squarespace/B12 have the website but bolt the rest on. Nobody designs the two as one thing. That's the wedge.

### 2. AI builders — read these for what you must out-position

Wix ADI, Jimdo Dolphin, Hostinger, Durable. **All of them already claim "the AI asks you questions."** That claim is table stakes now, so it can't be our headline. The difference is that theirs is a two-to-five question intake feeding a template selector; DOC-33 specifies four-to-five hours across ten stages with strategic pushback and a persistent ledger. Your copy has to make that difference legible in a sentence, because from the outside both are "an AI that asks questions."

### 3. Register comps — the most useful category for what you're doing now

You want your site compared to designers, so look at designers' own sites:

- **typewolf.com/design-studios** — "Top 40 Favorite Design Studio Sites," curated and current
- **maxibestof.one/websites/design-studio** — same idea, more visual
- Read these for *copy and restraint*, not layout to copy. Note how few of them lead with a feature list, how they talk about process, and how they signal selectivity.

### 4. Craft comps — the interface pattern

Lovable, v0, Framer. Their own marketing sites are exceptionally well made, and chat + live preview is literally our interface. Worth studying how they show the product working without a demo video.

**What I'd do with these:** the two that will actually change your copy are Squarespace-with-Acuity (photograph the seams — that's your not-a-bundle proof) and the Typewolf list (that's your register). The rest is competitive intelligence you can absorb later.

One caveat on sourcing: I fetched b12.io directly, so the pivot is verified. The pricing and capability details for the others come from 2026 comparison articles rather than the vendors, so spot-check anything you plan to put in public-facing copy.

Sources: [B12](https://www.b12.io/), [Best AI Website Builders 2026](https://blog.designingit.com/best-ai-website-builders-2026/), [HoneyBook vs 17hats](https://www.hellobonsai.com/blog/honeybook-vs-17hats), [17hats vs HoneyBook vs Dubsado](https://www.honeybook.com/blog/17hats-vs-honeybook-vs-dubsado), [Squarespace Pricing Guide 2026](https://www.websitebuilderexpert.com/website-builders/squarespace-pricing/), [Squarespace hidden costs](https://clementinedesign.studio/blog/squarespace-pricing-hidden-costs-2026), [Typewolf design studios](https://www.typewolf.com/design-studios), [MaxiBestOf](https://maxibestof.one/websites/design-studio), [Best AI Website Builders by use case](https://playcode.io/best-ai-website-builders)

<!-- xgd-turn id="69180484-8294-4629-ac6c-430a496883c0-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T02:02:02.452739+00:00" -->
#### You
Would this be useful to us: 

https://www.typewolf.com/free-fonts

<!-- xgd-turn id="69180484-8294-4629-ac6c-430a496883c0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T02:02:59.726473+00:00" -->
#### Claude
Partly — but not in the way the URL suggests. I fetched it: it's not a database, it's a **$39 PDF sales page**. ~1,000 fonts, curated as "free alternatives to popular paid fonts," a Google Fonts pairing section, and "40 best free fonts not on Google Fonts." No API, no structured data, no download links, no mention of variable fonts or self-hosting.

**Verdict: buy it for yourself as research; don't plan on it becoming a dependency.**

### Why the content is genuinely relevant

DOC-31 Pattern 6 puts typography-as-authored-device in the taste-gap category — the highest-yield, zero-technical-risk differentiators — and its diagnostic is *"did they design a rule?"* rather than *"did they pick a nice font."* Premium typefaces are also one of the strongest premium signals a site can carry, and they're exactly what we can't license per-client at our price point.

So the "free alternative to $commercial-font-X" mapping is the useful part. It converts *"the brief says premium editorial, which means something like Söhne, which we can't ship"* into a concrete substitute. That mapping is real knowledge and it's tedious to reconstruct. Worth $39 of your time.

### Why it can't be the catalogue

Three problems, in order of severity:

1. **It's a PDF.** DOC-33 stage 1 needs typography as a brief decision, and the capability catalogue is projected from declarations, never hand-written. A PDF can't feed that. Google Fonts already gives us a complete, free, machine-readable, OFL-licensed corpus — the thing we're missing was never the font list.

2. **Licensing at our scale is different from licensing for one designer.** The 40 non-Google fonts are the interesting half, and Typewolf's own caveat is "always carefully read the license before using any free font." We'd be *serving* those files on behalf of many client sites, commercially. That's redistribution, and it needs a per-font license record, not a blanket "commercial use OK." Separately, the PDF's own contents becoming a product asset in a commercial platform is its own licensing question.

3. **It doesn't cover what we operationally need.** No variable fonts, no self-hosting. We have to self-host regardless — a JAMStack performance budget argues for it, and hotlinking Google Fonts has been found to be a GDPR problem in the EU. So our catalogue needs font *files*, weights/axes, subset strategy and a license record per family. Names alone don't get us there.

### The gap it actually reveals

I grepped the doc tickets: DOC-31 says typography is a top-tier differentiator, DOC-33 stage 1 has a Brand section covering typography, DOC-23 has the layout substrate — but **there's no artifact that tells the AI which typefaces to reach for and why.** No pairings, no scales, no restraint-level mapping, no license records, no self-hosting story.

That's the thing worth building, and it's worth more than the PDF. Shape would be roughly: a small curated set (20–30 families, not 1,000), each with license + file provenance, variable-axis support, a restraint-level tag, tested pairings, and a type-scale rule — projected into the stage-1 capability catalogue so the consultation can actually offer it.

Want me to spec that? It'd be a new doc ticket, so say the word and I'll file one.

<!-- xgd-chat-end -->