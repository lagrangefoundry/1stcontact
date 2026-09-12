---
uid: epic-f61c15d6
id: EPIC-8
type: epic
title: 'Monitoring tab: site health and site metrics'
created_by: CHAT-48
created_at: '2026-09-12T20:49:29.096735+00:00'
updated_at: '2026-09-12T21:01:41.072303+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
---

## What the client asked for

> "Monitoring tab - this is the home for 4 but it will contain much more
> including google metrics"

## The principle

**One place that answers two questions a business owner actually asks: is my
site working, and did anyone come.**

Those are different questions with different audiences, and the tab is the only
place they meet. Health is mostly ours to act on; traffic is entirely theirs to
care about. Putting them on one surface is right — a site that is down and a site
nobody visited look identical from the customer's side of the glass.

## Why this is legitimately a tab

[[DOC-40]] §2 lists what a business owns: *"a website, a customer list, a
calendar, payments, marketing, **monitoring**, and the knowledge the assistant
accumulates."* Monitoring is business-scoped by the document that defines the
nouns, so it satisfies the rule the tab strip is built on
(`apps/control-app/src/builder/app.js:194-209`, [[REQ-179]]) and needs no
exception. Contrast the billing epic, which does not.

## What exists today

Nothing. No metrics of any kind are collected, exposed or stored. The site is
served by `apps/public-site` and nothing counts a visit.

## Scope

1. **The tab** — a business-scoped entry in `TABS`
   (`apps/control-app/src/builder/config.js:90`).
2. **Site health** — the rendered verdicts from the DNS checks epic: is the
   domain delegated, are the records right, is the certificate valid, is the
   site reachable, is mail still deliverable.
3. **Site metrics** — visitors, pages, sources, over time.
4. **Search presence** — Google Search Console: are we indexed, what queries
   surface us, is anything broken in Google's eyes.
5. **Notification preferences** — which of the checks epic's outputs reach the
   customer, and how.

## Decisions taken, and why

**Health verdicts are rendered here, not computed here.** The checks epic owns
targets, checkers and notification. This tab is a view. The same discipline the
settings epic follows, for the same reason: two places that compute the same
verdict will disagree, and the customer will believe the wrong one.

**Metrics are for the customer; health is mostly for us.** Most health verdicts
are things a customer can do nothing about except worry — the checks epic's
routing rule already says so. What surfaces here should be *"your site is
working"* with detail behind it, not a dashboard of amber warnings that
translates to homework.

## Google metrics: the part that is not like the others

Everything else on this tab is something we observe directly. Google is a
third party with its own account model, and that has consequences worth stating
before anyone scopes it as "add an analytics panel":

- **Search Console requires verified ownership of the domain**, which is a DNS
  TXT record — so it is only available *after* the DNS epic's cutover, and it is
  something we can do on the customer's behalf because we hold the zone. That is
  a genuine advantage of being their DNS host and worth using.
- **Whose Google account?** Verifying under ours makes the data ours and makes it
  awkward to hand over when they leave — which the registrar epic's exit promise
  says must not be awkward. Verifying under theirs requires a Google account
  they may not have.
- **Analytics is a separate product from Search Console**, with a separate
  consent story. Which brings the next point.
- **Cookie consent.** Google Analytics on a UK/EU small business's site is a
  consent banner and a lawful-basis question on *their* site, for *their*
  visitors, created by *our* decision. A first-party, cookie-less count of
  visits avoids the whole problem and answers the question the customer actually
  asked, which is "did anyone come". Recommend starting there and treating GA as
  opt-in.

## Boundaries

- **Computing verdicts, scheduling checks, sending notifications** → DNS checks
  epic.
- **Domain and renewal data** → registrar epic.
- **Changing anything** → settings epic. This tab reports; it does not configure.
  A control that appears here because the data is here is how the two tabs start
  drifting.

## Open questions

1. **First-party analytics or Google Analytics** — recommendation above is
   first-party first, GA opt-in.
2. **Retention.** How long do we keep visit data, and is it personal data under
   UK GDPR once it includes IP-derived location? [[DOC-37]] governs erasure and
   this needs to comply with it.
3. **Does the customer's portal show any of this** to *their* customers? Almost
   certainly not, but the question surfaces because [[DOC-45]] §10 already
   commits to an authenticated surface on a customer host.
4. **Uptime monitoring of the customer's site** — adjacent, obvious, and not
   currently in scope. Worth a decision rather than a drift.

## Children

None yet.


## Siblings

The six epics scoped together in [[CHAT-48]]. Three are surfaces and three are
capabilities, and the split is deliberate: a surface renders what a capability
computes, and never computes it a second time.

| Epic | | |
| --- | --- | --- |
| [[EPIC-4]] | Settings tab | business, site and subdomain (1stc.site) management |
| [[EPIC-5]] | DNS management | nameservers, records, and AI tools |
| [[EPIC-6]] | Registrar management | purchase, transfer, renewal |
| [[EPIC-7]] | DNS checks and monitoring | the check/notify engine |
| [[EPIC-8]] | Monitoring tab | site health and site metrics | ← **this epic**
| [[EPIC-9]] | Billing and payments | Stripe, subscriptions, invoices |

**Surfaces:** [[EPIC-4]], [[EPIC-8]], and [[EPIC-9]]'s (contested — see that
ticket).
**Capabilities:** [[EPIC-5]], [[EPIC-6]], [[EPIC-7]].

**The one cross-epic interface** is the propagation suppression window:
[[EPIC-5]] and [[EPIC-6]] tell [[EPIC-7]] *"I just changed this, expect it to be
wrong until T"*. Specified by the writers, consumed by the checker. Nothing else
crosses.

**Also see** [[TODO-6]] — `1stc.site` housekeeping, whose PSL submission has a
multi-week lead time and no shortcut, so it wants starting before any of this.


## Correction, 2026-09-12 — the contrast drawn with the billing epic was wrong

The "Why this is legitimately a tab" section above ends *"Contrast the billing
epic, which does not."* **Withdrawn.**

[[EPIC-9]] turns out to need two surfaces, not one: a business-scoped tab where
an owner configures what they charge their own customers, and the account-scoped
User Portal where someone pays. The tab half satisfies the same [[REQ-179]] rule
this epic satisfies, for the same reason. The contrast does not hold.

What *is* still true, and is the reason this epic cites the rule at all, is that
[[DOC-40]] §2 lists monitoring among the things a business owns — so this tab
needs no argument beyond that.
