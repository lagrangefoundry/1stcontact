---
uid: epic-c5175c8f
id: EPIC-5
type: epic
title: 'DNS management: nameservers, records, and AI tools'
created_by: CHAT-48
created_at: '2026-09-12T20:49:16.884935+00:00'
updated_at: '2026-09-12T20:49:51.822468+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
---

## What the client asked for

> "We need a flow dns managment with two flavors (1) dns is owned by cloudflare
> (2) nameservers run on cloudflare"
>
> "We need a flow for helping the user make the changes to make cloudflare the
> nameserver"
>
> "DNS management including setting thirparty nameservers, screens for required
> dns management - AI tools for dns management"

## The principle

**A customer's existing mail, and anything else already running on their domain,
survives the move to us without them being asked a question they cannot answer.**

Everything else in this epic is mechanics. That sentence is the acceptance bar,
because the failure it guards against is silent, delayed, and lands on a business
whose email is how they get work.

## What exists today

Nothing. There is no Cloudflare API client, no zone concept, no record model,
and no host→site resolver of the kind [[DOC-45]] §4 requires. `1stc.site` is
registered and otherwise untouched ([[TODO-6]]).

## The on-ramps, and the one that looks easy and is not

All paths end in the same place: **the zone lives in our Cloudflare account and
we manage records through one API.** The differences are upstream of that.

1. **We registered it** (registrar epic). Nameservers are already ours. No
   customer action at all — the best case, and the reason selling domains is
   worth doing.
2. **Registered elsewhere, nameservers pointed at us.** The customer pastes two
   nameservers at GoDaddy/Namecheap/123-reg. This is the bulk of the UX work.
3. **Already on Cloudflare, in the customer's own account.** *This is a trap.*
   It looks like the easiest case and is among the worst: there is no consumer
   OAuth that would let us manage a zone in someone else's account, so the zone
   must be deleted from theirs and re-added to ours — which assigns a
   **different** nameserver pair, so they do the registrar paste anyway, plus a
   deletion step and a window where the site is down. Detect this case
   explicitly rather than letting it fall through as "already on Cloudflare,
   should be easy".

The client's framing of "two flavours" is accepted with one correction agreed in
[[CHAT-48]]: the flavours are not a DNS split. Under all three the DNS surface is
identical. What actually differs — billing, renewal, who holds the transfer
authorisation — is a **registrar** concern and lives in that epic.

## Preservation, not confirmation

The original design asked the customer to confirm their existing mail records
before cutover. The client's objection is correct and decisive: *"our users are
not going to be in a position to confirm anything here."* A furniture restorer
cannot validate an MX record, and a confirmation step they cannot meaningfully
perform is worse than none — it launders our error into their approval.

So the gate stays and stops being a question:

1. **Sweep and snapshot** the live zone before touching anything: MX, SPF,
   DMARC, DKIM, and every other record we did not create.
2. **Copy them forward automatically.** Cloudflare's zone scan does part of this
   and **misses DKIM selectors**, which are not enumerable over DNS — you must
   probe known selector names per provider (`google`; `selector1`/`selector2`
   for Microsoft 365; `k1` for Mailchimp; `s1`/`s2` for SendGrid; and so on).
   A missed selector breaks signing silently, and the symptom arrives weeks
   later as "our email goes to spam".
3. **Notify in their language, do not ask in ours.** *"Your email is with
   Microsoft — I'll keep that working"* is a sentence a customer can read, and
   if it is wrong they will say so. That is the only useful signal they can
   actually give.
4. **Verify after propagation by testing**, comparing re-resolved records
   against the snapshot. A mismatch is our problem to fix, not a question to
   forward.

The snapshot still has to exist — it is what makes both the automatic
preservation and the after-check possible. It stops being a screen.

## The nameserver-change experience

This is where most of the visible work is. It needs:

- the two assigned nameservers, with copy buttons, not a paragraph to transcribe;
- registrar-specific instructions — detect the current nameservers, name the
  registrar, and show the path through *that* control panel;
- a live "checking… still checking… done" indicator rather than "come back
  later", because the customer's real question is *did it work*;
- and it can render as a card in the chat pane rather than as a separate screen,
  which keeps it in the register the product is sold in ([[DOC-46]]).

**It must not be reachable on its own.** A customer who lands on "here are your
nameservers" without having been through the snapshot is a customer whose mail
we are about to break.

## AI tools for DNS management

The assistant needs typed tools over the zone — read records, add, change,
remove — with the dangerous ones constrained rather than merely documented:

- **MX, SPF, DMARC and DKIM changes are privileged.** The assistant should be
  able to *read* them freely and should not be able to casually replace them.
- **SPF merges, never appends.** Two `v=spf1` records on one name is a hard
  failure that breaks all mail from that name, and it is the single most common
  way this goes wrong — see [[TODO-5]], where it happened to us twice, once by
  pasting a field label into the value and once by deleting a load-bearing
  record on a different name. Same name → merge. Different names → leave both.
- Every mutation writes the declared target the monitoring epic checks against.

## Boundaries

- **Buying, transferring, renewing** → registrar epic.
- **Whether records are still correct tomorrow** → DNS checks epic. This epic
  *declares the target*; that one compares reality to it.
- **The propagation suppression window** — this epic tells monitoring "I just
  changed this, expect wrong until T". That handoff is the single interface
  between the two and is specified here, consumed there.
- **Where the customer sees the result** → settings tab, and the chat card.

## Open questions

1. **Do we offer Cloudflare Email Routing at all?** Forwarding is not hosting a
   mailbox, so it survives the client's rule that we never host mailboxes. What
   may kill it is the reply path: forwarding gets mail *in*, and replying *from*
   the address needs SMTP credentials the customer must paste into Gmail. A
   half-feature that receives but cannot reply may be worse than nothing.
2. **How much can the assistant change unsupervised** once a domain is live and
   serving a real business?
3. **What happens on failure mid-cutover** — is there a rollback, given the
   snapshot makes one technically possible?

## Children

None yet.


## Siblings

The six epics scoped together in [[CHAT-48]]. Three are surfaces and three are
capabilities, and the split is deliberate: a surface renders what a capability
computes, and never computes it a second time.

| Epic | | |
| --- | --- | --- |
| [[EPIC-4]] | Settings tab | business, site and subdomain (1stc.site) management |
| [[EPIC-5]] | DNS management | nameservers, records, and AI tools | ← **this epic**
| [[EPIC-6]] | Registrar management | purchase, transfer, renewal |
| [[EPIC-7]] | DNS checks and monitoring | the check/notify engine |
| [[EPIC-8]] | Monitoring tab | site health and site metrics |
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
