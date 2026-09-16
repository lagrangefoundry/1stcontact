---
uid: epic-c5175c8f
id: EPIC-5
type: epic
title: 'DNS management: nameservers, records, and AI tools'
created_by: CHAT-48
created_at: '2026-09-12T20:49:16.884935+00:00'
updated_at: '2026-09-16T03:36:47.622090+00:00'
completed_at: null
last_field_updated: body
status: done
fields:
  priority: medium
  chat_comment: comment-e8891c59
  epic_children:
  - request-692325d3
  - request-4b60eae1
  - request-d118c0fc
  - request-616e56ac
  - request-a6540f61
  - request-7334f1da
  - request-59caea02
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

| | | |
| --- | --- | --- |
| [[REQ-249]] | the `1stc.site` hostname field | the box, the check, the lock-in dialog |
| [[REQ-250]] | the publish refusal | [[REQ-238]]'s 409, as a modal with a way out |
| [[REQ-251]] | the hostname assistant | reconcile the declaration, sync the pane |

Scoped on 2026-09-15. [[REQ-251]] depends on [[REQ-249]]: it reconciles the
assistant's wording against that ticket's copy and refreshes that ticket's
section, so building it first would mean reconciling against wording that does
not exist. [[REQ-250]] is independent but wants [[REQ-249]] first, because its
one button has nowhere to go until the field exists.

**Their subject is [[EPIC-4]]'s**, whose title names `1stc.site` management
directly and which parents [[REQ-238]]. That epic is `done`, so they are parented
here rather than reopening it.


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



---

## Design session, 2026-09-15: provenance, the claim/proof split, and what the customer actually configures

Worked through with the operator. This section settles how a zone comes to belong
to a customer, adds the ordering property that makes preservation structural
rather than hoped-for, and cuts the on-ramps on a different axis than the one
above. Nothing above is withdrawn; the three on-ramps are still the three
on-ramps.

### The operator's own domains are in the platform Cloudflare account

Confirmed. They are in the same account everything else runs from, and they are
already active. **So the trap case does not apply to them** — no deletion, no
re-add, no reassigned nameserver pair, no downtime window. Their association with
an account is a backfill, not a flow. This is what makes on-ramp 2 buildable
first, ahead of any registrar work and ahead of the nameserver experience.

### The axis that decides the work is not who owns the domain

Who owns it decides billing, renewal and transfer authorisation, and all three
are [[EPIC-6]]'s. The question that decides *this* epic's work is different:

> **Is there a live business on this domain today?**

That cuts across all three on-ramps rather than along them. A domain we just
registered is green field — write the records, nothing can break. A domain the
operator has owned and parked is also green field. A domain currently carrying
the customer's mail and their old Wix site is the dangerous one, and it can
arrive by on-ramp 2 *or* 3. The whole snapshot / DKIM-probe / SPF-merge apparatus
specified above exists for that case and is dead weight for the others.

So the shape is **one on-ramp (get the zone into our account), one gate (is
anything live on it), one config surface.** The on-ramps differ in how the zone
arrives; they do not differ in what happens after.

### Provenance: how a zone is associated with an account

**Cloudflare cannot tell us.** There is no field on a zone meaning *this belongs
to customer 47*, because in Cloudflare's model every zone in the account is
equally ours — which is the whole point of the arrangement. The association is a
fact we record, and the only reliable source for it is **how the zone got there.**

There are exactly three ways, and each carries an account identity at the moment
it happens:

| Origin | Where `account_id` comes from | Ambiguity |
| --- | --- | --- |
| `registered` — we registered it ([[EPIC-6]]) | the account that paid | none; it is a property of the purchase |
| `nameserver` — they pointed nameservers at us | the logged-in account that started the flow | see the claim/proof split below |
| `operator` — an existing zone attached by hand | an operator names the account | none; a human decision, recorded |

`platform` is a fourth origin and is not a customer's — see the guards below.

Provenance is not bookkeeping. It is what the offboarding path reads: a domain we
registered leaves differently from one the customer pointed at us, and a zone
with no origin recorded cannot be offboarded safely at all.

### `zones`, and why it is account-scoped

```
zones(
  id,               -- our surrogate, `zon` prefix, per [[REQ-190]]
  account_id,       -- NULL means unattributed, which means selectable by nobody
  apex,             -- UNIQUE
  cf_zone_id,       -- Cloudflare's, for API calls
  assigned_ns,      -- the pair we showed them
  origin,           -- 'registered' | 'nameserver' | 'operator' | 'platform'
  status,           -- 'pending' | 'active' | 'released' | 'revoked'
  claimed_at, activated_at
)
```

**Account-scoped and not business-scoped**, and the schema already argues this:
`entitlements` is account-scoped because payment is an account concern, and a
domain is a thing somebody paid for. A business is where sites live; an account
is where money and assets live. So the pool is the account's, and the assignment
lands in a business.

**`status` mirrors Cloudflare's rather than inventing a parallel one.**
Cloudflare already runs the state machine — `pending` while the nameservers do
not yet point at the assigned pair, `active` once it observes that they do. A
second, independently-computed notion of activeness is a second thing that can be
wrong, and the one that would be wrong is ours.

### Claim and proof are separated in time, and the nameserver change is the proof

There is a chicken-and-egg in on-ramp 2: we cannot tell a customer which
nameservers to use until the zone exists in our Cloudflare account, because
**Cloudflare assigns the pair when the zone is added.** So the zone is created
before any proof of ownership exists, and the association is therefore created by
a claim and confirmed by a proof:

- **Claim** — the customer types `alicesplumbing.com` while logged in. We create
  the Cloudflare zone, write the `zones` row `pending` against their account, and
  hand back the assigned pair. **Nothing is proven.**
- **Proof** — the nameservers actually change. **This is the proof and it is a
  good one:** nameservers cannot be repointed without registrar access. Cloudflare
  observes the change and flips its zone to `active`; we mirror that rather than
  re-deriving it.

**This is [[REQ-238]]'s `check`/`claim` split in a second place, and the
repetition is a sign it is right.** There, a check reserves nothing and the unique
index is the authority. Here, a claim proves nothing and the registrar is the
authority. Same shape: the cheap operation is honest about proving nothing, and
the authority is a thing outside our code that cannot be argued with.

**There is to be no separate ownership-verification step** — no TXT record, no
mail to `admin@`. It is a second proof of a fact the nameserver change already
establishes, and it adds a step to the one flow that already has the most steps in
it. Written down here because it is the sort of thing that gets built from habit.

### Squatting, and why it is smaller than it looks

If claiming creates a zone, what stops somebody typing `google.com`? Two things,
and between them they cover most of it.

**Cloudflare refuses outright** when the zone is active in another Cloudflare
account — the same mechanism that makes on-ramp 3 painful, working for us for
once. Every domain already on Cloudflare anywhere is simply unclaimable, and that
is a large share of the domains worth squatting.

**For the rest the claim is weak and it expires.** A `pending` zone that never
sees a nameserver change is deleted from Cloudflare and marked `released` after a
bounded window — 14 days is the working figure. The real cost of a squat is that
it holds the apex inside *our* Cloudflare account, which allows one zone per apex,
so a second and legitimate claimant meets *"that domain is already being set
up"*. That is rare enough to be a support path with an operator release behind it
rather than a self-service one, and building self-service release would hand the
squatter a second lever.

### The pre-cutover ordering, which is what makes preservation structural

The zone exists in `pending` before cutover, so there is a window in which **the
zone is ours and fully populated while nothing yet resolves from it.** That window
is exactly what the preservation section above needs, and the order is:

1. **Create the zone** (`pending`) — we now have somewhere to write.
2. **Sweep their live DNS from outside**, against their *current* authoritative
   nameservers, plus Cloudflare's own scan, plus the DKIM selector probing
   specified above.
3. **Write everything into the pending zone** — everything swept, plus the records
   we are adding.
4. **Then, and only then, show the nameservers.**

By the time the customer pastes, the zone is a complete copy of what is live plus
what we are adding, so **the cutover is a no-op in what resolves.** That is what
turns *"their mail survives"* from an intention into a property of the sequence.
The preservation section above specifies snapshot-and-copy but not this ordering,
and the ordering is the part that makes it true.

It also says where the nameserver card may appear: after step 3, never before.
That is the mechanism behind *"it must not be reachable on its own"*.

### Two guards, both default-closed

**`1stc.site` and `1stcontact.io` must be permanently unattributable.** They live
in the same Cloudflare account and appear in any naive zone listing.
`1stc.site` in particular carries *every* customer's platform hostname, so
attributing it to one account would hand that account the whole namespace. This is
an explicit refusal in code against `origin = 'platform'`, not a convention an
operator is trusted to observe.

**A zone with no `account_id` is selectable by nobody.** Default closed, which
also buys the drift check: list Cloudflare's zones, diff against this table, and
anything present there and absent here is either a platform zone or a mistake.
Somebody adding a zone by hand in the dashboard is a thing that will happen.

### What the customer configures — three controls, and no records

The selector instinct is right, and the surface should be smaller than a selector
implies. For a domain whose zone we already hold, the whole configuration is:

| Control | Default | Why it is exposed at all |
| --- | --- | --- |
| **which domain** — a selector over the account's pool | none | the only genuine choice |
| **send email from this domain** — one toggle | on | it changes what recipients see, and it has a real failure mode |
| **release** — take it off this site | — | it is what makes the relationship reversible |

The selector's query is *zones for this account, `status = 'active'`, minus hosts
already claimed by another site.* One join, and no new exclusivity logic, because
the unique index on `site_domains.host` already decides it.

**Everything else is machinery and must never surface as a field**: `A`/`AAAA`
versus `CNAME`, the `www` redirect, the certificate, the SPF, DKIM and DMARC
values, the propagation wait, the Cloudflare zone id. **If a customer is being
shown a record type, we have failed.** That is the same standard the preservation
section sets — *notify in their language, do not ask in ours* — applied to the
happy path rather than to the dangerous one.

**Which host is not a question we ask.** Serve the apex, redirect `www` to it,
write both records, decide once. It becomes a real question only when the apex is
already occupied by their existing site, and then the answerable form is *"your
main address is in use — shall we put the new site on a subdomain while you
decide?"*, which is a sentence a furniture restorer can act on.

**Authorisation is the thing the selector hides.** The pool is the account's and
the assignment happens inside a business, so a business member who is not the
account holder does not get to spend an account asset: they see *"ask the account
owner to attach a domain"*. Otherwise a member of one business can consume a
domain belonging to a sibling business.

### Three things [[REQ-238]]'s table does not yet say

1. **There is no canonical/redirect distinction, and `www` needs one.**
   `site_domains` maps host to site and stops. The moment two hosts reach one site
   — apex and `www`, or a second domain the business also owns — something must
   say which is *the* address, for redirects, for URL construction and so search
   engines are not handed duplicate content. [[DOC-45]] §4's *"a site has exactly
   one address"* is a statement about the canonical one, not about how many hosts
   resolve. Cheap now, a migration later.

2. **Finality is a `platform` rule and must not be applied to `custom`.**
   [[REQ-238]]'s *"chosen once and does not change"* exists because `1stc.site` is
   scarce, public and first-come. A customer's own domain is none of those: they
   must be able to move it between sites, take it off a site, and take it away
   entirely. Same table, opposite rules, and this is written down because the
   finality rule is the one already implemented and will otherwise be applied
   uniformly by whoever gets there first.

3. **Exclusivity is per host, not per domain.** The unique index already gives
   one site per host. A per-*domain* rule would additionally forbid
   `alicesplumbing.com` reaching one site while `shop.alicesplumbing.com` reaches
   another, which [[DOC-45]] §2.3 already commits to eventually and which is the
   natural way to trial a new site on a domain whose apex still runs the old one.

### Email sending: Resend isolates itself, and only DMARC collides

`apps/control-app/MAIL.md` already carries the record set, verified on
`1stcontact.io`. Applied to a customer domain it is the same six rows, and the
important property is where they sit:

| Name | Type | Collides with existing mail? |
| --- | --- | --- |
| `send.<domain>` | TXT (SPF) | **no** — Resend's own subdomain |
| `send.<domain>` | MX (`feedback-smtp…`) | **no** — Resend's own subdomain |
| `resend._domainkey.<domain>` | TXT (DKIM) | **no** — a selector nobody else uses |
| `_dmarc.<domain>` | TXT | **yes** |
| apex | TXT (SPF) | **yes**, if we touch it |

**Resend puts its return-path on `send.`, so enabling sending on a customer
domain need not touch their apex SPF or their MX at all.** Three records under
names nothing else occupies. The SPF-merge rule above stays a rule and remains
correct; it simply does not fire for this. That is a materially smaller blast
radius than the general case implies, and it is why sending can be configured
alongside the web records rather than as a later, more careful epic.

**`_dmarc` is the one dangerous record, and it is dangerous in a direction not
yet named above.** Publishing a policy on a domain that already sends from
Mailchimp, Microsoft 365 or a booking system can start binning *their* mail, not
ours. So: write `_dmarc` only when absent, only at `p=none`, and never tighten a
policy on a domain we did not start from zero. This is the same class of harm as
a lost DKIM selector — silent, delayed, and landing on a business whose email is
how they get work — so it sits under the same acceptance bar.

### Three waits, not one

The nameserver experience above specifies a live checking indicator for
propagation. There are three independent waits and each fails separately:

1. **Nameserver propagation** — hours. Covered above.
2. **Certificate issuance** — minutes, and only after the zone goes active.
3. **Resend domain verification** — minutes, after the records are written.

Two and three are currently invisible and will read as *"it is broken"* when they
are merely slow. Each needs its own state in whatever renders the first.

### Offboarding belongs in this epic

The zone lives in our account, so when a customer leaves it has to go back: the
zone is deleted from ours and they repoint at whoever is next. That is DNS work
and it belongs here, even though the registrar half — transfer-out, auth codes —
is [[EPIC-6]]'s. It is also what makes *"point your nameservers at us"* an
acceptable thing to ask: the answer to *"can I leave?"* has to be yes, and
demonstrable.

### Additional falsifiers

- A zone attributed to an account by reading anything back from Cloudflare rather
  than from the provenance recorded when it arrived.
- A customer-facing surface that shows a DNS record type, a record value, or a
  Cloudflare zone id.
- Any path that can attribute an `origin = 'platform'` zone to an account.
- A zone with `account_id` NULL appearing in a customer's selector.
- A second ownership-verification step in the nameserver flow.
- A nameserver pair shown before the pending zone has been populated from the
  sweep.
- `_dmarc` written on a domain that already has one, or written at anything other
  than `p=none`.
- The finality rule refusing a change to a `custom`-kind host.

### What this moves in Open questions

Question 3 — *what happens on failure mid-cutover* — is narrowed rather than
answered: with the pending zone populated before the pair is shown, a failed
cutover leaves the customer still resolving from their old nameservers and
nothing lost, so the rollback question applies only to a cutover that completed
and went wrong. Questions 1 and 2 are untouched.

A new one: **do we want to send as the customer's domain at all?** Sending lead
notifications from `alicesplumbing.com` is better for trust and for
deliverability. It also entangles our sending reputation with theirs in both
directions, and it configures their domain for sending by a party they cannot
see. The alternative — sending from ours with their name in the display name — is
safer and slightly worse. Worth deciding deliberately rather than by default,
and the toggle above assumes the answer is yes.


---

## Scoping session, 2026-09-15: four tickets cut, the nameserver experience parked

Worked through with the operator. The design sections above are not withdrawn.
What follows is the build order, three decisions that were open, and two places
where checking the code contradicted something this ticket assumed.

### The tickets

| | | |
| --- | --- | --- |
| [[REQ-257]] | the DNS layer | `zones`, the Cloudflare client, the external resolver, the operator backfill |
| [[REQ-258]] | serving | records, runtime Worker route, host→site resolution |
| [[REQ-259]] | the config surface | the selector, the sending toggle, release |
| [[REQ-260]] | assistant tools | reads, guarded mutations, the change card, undo |

[[REQ-257]] blocks the other three. [[REQ-258]] and [[REQ-259]] are the whole of
*"publish on a domain we already hold"*; [[REQ-260]] follows.

**The nameserver-change experience is deliberately not ticketed.** The snapshot,
the DKIM probing for a live business, the registrar-specific instructions, the
pre-cutover ordering — the operator's call is that it *"needs some thought"*, and
it is the part of this epic where the acceptance bar actually lives. Everything
above about it stands as written and is waiting for a ticket rather than lacking
a design. [[REQ-257]]'s resolver is built in a form that will serve it.

### Serving is not blocked by [[TODO-6]], which inverts [[DOC-45]]'s order of work

[[TODO-6]] §§1 and 5 — the PSL submission, the wildcard `A`/`AAAA`, the
`*.1stc.site` wildcard certificate — gate the **platform apex**. A zone in our own
Cloudflare account gets the records we write it and its own Universal SSL
automatically, with no wildcard and no PSL entry involved.

**So a custom domain can serve before `1stc.site` resolves at all.** [[DOC-45]]'s
order of work puts custom hostnames last, after the label work and the operator
tasks. For serving, the dependency runs the other way, and the operator's own
already-active zones are the shortest path to a real site on a real address.

### Decided: a site sits at the root of a custom host, and the prefix survives as a guarded redirect

[[DOC-45]] §4 says a site sits at the root of its host, and
`recipientSiteUrl` composes `https://<host>/site/<key>/…` today. Once a custom
host resolves, one of those is wrong. Settled in [[REQ-258]]: root is canonical;
`/site/<key>/…` **where the key is the site that host resolves to** 301s to the
root-relative form, which keeps every already-mailed download link working; any
other key 404s.

**That last rule is a cross-tenant guard rather than tidiness.** `public-site`
serves `/site/<any-key>/` on whatever host it is routed to — correct on the
product's own front door, and a leak the moment the host belongs to a customer,
because `alicesplumbing.com` would serve Bob's site under Alice's certificate to
anyone holding Bob's key. Routing a customer domain to that Worker is what creates
the exposure, so the guard lands in the ticket that creates it.

### Decided: the assistant's change card is a notification with an undo, not a confirmation

The proposal on the table was that the assistant may not write DNS directly — it
proposes, a card asks the customer to accept, the change applies on the click.

**Rejected as a consent mechanism, on this epic's own argument**: *"a confirmation
step they cannot meaningfully perform is worse than none — it launders our error
into their approval."* The operator's own framing is the decisive evidence —
*"honestly DNS is something I use so infrequently and which is so arcane — I would
just accept what the AI said too."* A click from someone who cannot evaluate the
proposal records consent that was never informed, and after the first broken
mailbox the audit trail will say they approved it.

**Kept as a notification**, because the operator's actual reason for wanting it was
visibility — *"at least this way it's clear to the user what is going on"* — and
that needs no decision from someone unable to make one. *"I'm setting up email
sending on your domain. Your existing email with Microsoft isn't affected."* →
`Undo`. Present tense, their nouns, a brake rather than a gate. This is *notify in
their language, do not ask in ours* applied to mutation.

**The safety is the constraint set, not the click.** SPF merges rather than
appends; `_dmarc` only when absent and only at `p=none`; a closed set of typed
operations rather than a record editor. Those hold whether or not anyone clicks,
and they are the only thing that stops a confidently-worded wrong proposal. A
safety rule enforced by the card is a falsifier in [[REQ-260]].

### Amendment: the external DNS resolver is a second cross-epic interface

This epic says the propagation suppression window is *"the one cross-epic
interface… Nothing else crosses."* That is now wrong by one. A resolver that reads
live DNS **from outside** — including DKIM selector probing, which is not
enumerable and must be done by name — is needed by this epic's pre-cutover sweep,
by [[REQ-259]]'s pre-attach check, by [[REQ-260]]'s assistant tools and by
[[EPIC-7]]'s check engine.

It is built once, in [[REQ-257]], and consumed by all four. A second implementation
anywhere is a falsifier in three of those tickets. Recorded as an amendment rather
than absorbed silently, because *"nothing else crosses"* was load-bearing when the
six epics were split.

### Correction: the operator's own domains are not all green field

The section above concludes that an operator-owned parked domain is green field
and that the whole snapshot apparatus is dead weight for it. **True for a parked
domain and false as a rule about operator-owned ones.** `1stcontact.io` carries a
live Resend record set today — an apex SPF, an SPF and a `feedback-smtp` MX on
`send.`, a `resend._domainkey` selector, a `_dmarc` at `p=none`
(`apps/control-app/MAIL.md:96-101`).

So ***is there a live business on this domain today?*** fires on the
already-in-our-account path too, and the cheapest form of it — read the existing
`MX`, SPF, `_dmarc` and known selectors before attaching — is a prerequisite of
[[REQ-259]] rather than a follow-on. The axis is right; *"a domain the operator has
owned and parked is also green field"* is right; the inference that operator
ownership implies green field is not.

### Verified while scoping

- **There is no Cloudflare API client anywhere in the repo.**
  `api.cloudflare.com` appears only in `tools/generate/src/cli/kb.ts`, which is
  Workers AI for the knowledge base and shares no credential and no concern.
- **The read side of `site_domains` is already kind-agnostic.**
  `addressForLinks` (`hostname.ts:429`) already prefers `kind === 'custom'`, and
  the publish gate is already written over kinds. Nothing there needs changing.
- **`public-site` has no host→site resolution**, by its own documentation
  (`public-url.ts`), and its routes are static in `wrangler.toml` — so a customer
  host neither arrives at the Worker nor resolves once it does. Both are
  [[REQ-258]]'s.
- **The toolbox already expresses *read freely, cannot write*** — the surface
  declares the API and the grant narrows it (DOC-30, `toolbox.ts:110`). So the
  assistant's read tools are nearly free, while propose-don't-execute has no
  representation in `toolbox-core.ts` at all and is [[REQ-260]]'s real cost.

### One risk that must be settled before [[REQ-258]] is built

**Does `wrangler deploy` reconcile the static `routes` array in a way that removes
routes it did not declare?** If it does, every deploy of `public-site` silently
un-publishes every customer domain at once, with nothing in the diff to explain
it. A short experiment against a throwaway zone decides whether runtime routes are
viable or whether the mechanism must be a Worker custom-domain binding. Named in
[[REQ-258]] as the first thing to do.

### What this moves in Open questions

Question 1 (Email Routing) and question 3 (mid-cutover rollback) are untouched.

Question 2 — *how much can the assistant change unsupervised* — is narrowed by
[[REQ-260]]'s closed operation set and by the card making every change visible,
but is **not settled** and is called out as unsettled in that ticket.

The question added by the last session — *do we want to send as the customer's
domain at all?* — is **assumed yes, defaulting on**, in [[REQ-259]]. If the answer
is no, the toggle and its record set come out of that ticket and the rest stands.
