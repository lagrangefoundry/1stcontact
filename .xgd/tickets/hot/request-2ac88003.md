---
uid: request-2ac88003
id: REQ-238
type: request
title: 'The 1stc.site hostname: chosen once, and required before publishing'
created_by: EPIC-4
created_at: '2026-09-13T21:17:45.731357+00:00'
updated_at: '2026-09-14T03:49:36.250324+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  depends_on:
  - request-03519106
  epic_parent: epic-0728e1c5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d842395c
---

## What this is

A business chooses one `1stc.site` hostname. The choice is **final**, and a site
cannot be published until the business has an address.

This implements [[DOC-45]] §5 (the mapping table) and §7 (the platform label).
§7 was rewritten on 2026-09-13 and now says the opposite of what it said when
[[EPIC-4]] was written; the superseded rule and both arguments that held it up
are recorded in that section.

## The lifecycle, stated once

| | Business name ([[REQ-237]]) | `1stc.site` hostname |
| --- | --- | --- |
| Visible to | the owner and us | the public |
| Unique across | one account | every hostname ever issued |
| Chosen | early, cheaply | deliberately |
| Changed | freely, no consequence | **not at all** |

The two names sit on the same tab and have opposite lifecycles. That is the
single most important thing the settings assistant has to understand, and it is
why the two are separate tickets rather than one "names" ticket.

## Chosen, never assigned

[[DOC-45]] §7 used to say the label was assigned at provision from the slugified
business name. It is not. **The customer chooses it, and may take as long as they
like** — until a site is published it has no public address and needs none.

The argument that held up the old rule was [[REQ-190]]'s `unnamed` reasoning: a
default must exist and must visibly ask to be changed rather than block someone
on a choice they are not ready to make. It fails here because the name it would
slugify is `Unnamed business`, so the assigned default is `unnamedbusiness` — not
a name that asks to be changed but a name that says nothing, handed to somebody
who never asked for it, in the one namespace on this product that is global,
public and first-come.

## Final

**A hostname is chosen once and does not change.** If it could be swapped freely
and the old one recycled, one business could walk through dozens of good names in
an afternoon, and `1stc.site` is a first-come namespace that only ever gets
smaller. Because nothing is relinquished, nothing is re-issued: the customer who
paints `alice.1stc.site` on a van keeps it, and no stranger can ever inherit
their traffic.

A change path is expected eventually, gated by a **one-off fee** — small, priced
for friction rather than for revenue. [[DOC-45]] §5's table already carries
`status`, so that lands later as a new row and a status flip rather than as a
schema change. **It is not in scope and nothing is to be built in anticipation of
it.**

## Publication is the gate

**To go live a business needs a `1stc.site` hostname, a custom domain, or both.**
At least one address, or there is nothing for `publish` to make reachable. This
is also what makes [[DOC-45]] §4 safe: once the `/site/<key>/` path grammar is
deleted, a published site with no host mapping is unreachable, so the requirement
belongs at the moment of publication rather than at the moment of provision.

**The check is written over address kinds, not over this one.** Custom domains
belong to [[EPIC-6]] and are not built here, but `if (!hostname) refuse` becomes
a wrong refusal the day they land. The question the publish path asks is *does
this business have at least one address*, over a list that has two kinds and one
implementation today.

## Two operations: check, and claim

The experience is a domain registrar's, and that is the design target rather than
a loose analogy. **You type a name, you press return, and you are told "already
taken" or "yes, you can have it."** Then you take it.

So the surface is two operations, not one:

- **`check`** — is this hostname available? No side effect, repeatable, cheap,
  and safe to call as fast as somebody can type. It is what the field on the
  settings pane calls on every return press.
- **`claim`** — take it. Final, and the only operation with a consequence.

**The split is what makes the assistant useful rather than decorative.** A
customer whose first six choices are gone is exactly who needs help, and the
assistant can only help if it can *check* — propose `colesbakery`, find it taken,
propose `colesbakerydublin` and `bakerybycole`, and come back with three that are
actually free. Without a check operation it can only guess, and a suggestion that
turns out to be taken is worse than no suggestion.

**Both operations stand alone.** The pane calls them directly; the assistant
calls the same two. Neither path is a wrapper around the other, and nothing about
the direct route requires a conversation to have happened. That is [[REQ-239]]'s
rule — one API, two callers — and this is the ticket where it does the most work.

### Check is not a promise, and claim is the authority

Two customers can check `alice` in the same second and both be told yes. The
unique index on `host` decides it, and the loser is refused at `claim` — *"that
one went while you were deciding"* — rather than being handed a duplicate. A
check that reserved anything would be a hold on a finite public namespace with no
expiry, obtainable by typing.

**Exposing the check is not an information leak**, and [[DOC-45]] §5 already
disposed of the objection: an existence oracle matters when the value is one a
business would not otherwise disclose, and *"a public address exists in order to
be publicly resolvable"*. DNS gives this away for free to anyone who asks.

## Behaviour

- **`site_domains` per [[DOC-45]] §5** — opaque primary key, `site_id` naming the
  site by key, `host` with a unique index, `kind`, `status`. The host is an
  attribute with a unique index and never a primary key: DNS is a global
  namespace whether we like it or not, and a mapping table with two rows for one
  host would simply be broken. §5 also disposes of the existence-oracle objection
  — a public address exists in order to be publicly resolvable.
- **Syntactic rules are enforced**: 1–63 characters, `a-z0-9-`, no leading or
  trailing hyphen, and the `xn--` prefix is refused so nobody hand-rolls a
  punycode lookalike.
- **The reserved technical family is refused** — `www`, `app`, `api`, `mail`,
  `admin`, `ns1`, `mx`, `_acme-challenge`, `portal`, `support`, `1stcontact`
  ([[DOC-45]] §7, [[TODO-6]] §2).
- **There is no update path on `host`.** Not a guarded one, not an
  operator-only one. [[DOC-45]] §7's falsifier names it directly.
- **`publish` refuses a business with no address**, and says which two things
  would fix it.
- **The choice is presented as the whole host and as permanent.** A permanent
  name, entered as free text, by the low-tech customer this product is for, is a
  permanent typo waiting to happen. Whatever asks shows `alice.1stc.site` as it
  will be, not a bare label field, and says it cannot be changed *at the moment of
  choosing* rather than afterwards.

## What is deliberately not decided here

**What is refused beyond the reserved technical family** — [[DOC-45]] §11 item 6.
Impersonation of a bank, a government or this platform harms a third party
immediately and has no benefit of the doubt to give. The obscenity tail is a
different problem: a substring blocklist eventually refuses a real business its
real name, and answering it badly is worse than deferring it.

Finality sharpens this rather than softening it. If an owner cannot change their
own hostname, a hostname we later want gone can only be revoked by us — an
operator action, not self-service. That is a consequence to be aware of, not a
reason to hold this ticket.

## Surface

This ticket declares its own operations and refusals in the settings surface, for
the reason [[REQ-237]] gives. The prose earns its keep here more than anywhere
else on the tab: "this cannot be changed" has to reach the customer *before* they
commit, and a refusal has to offer somewhere to go next rather than just say no.

**The assistant is not the gate.** It would be judging its own user's request and
can be argued out of a refusal. The list refuses; the assistant explains the
refusal and helps find an alternative — which, with `check` in its hands, means
proposing names that are actually free rather than sympathising.

## Falsifiers

- A published site with no host mapping.
- Any path that updates `site_domains.host` in place.
- A publish check that names the `1stc.site` hostname rather than asking whether
  any address exists.
- An availability check that reserves anything, or a claim that trusts an earlier
  check instead of the unique index.
- A route to claiming a hostname that exists only inside a conversation.


---

## Answers to the implementation questions (EPIC-4, 2026-09-13)

Answered from this epic's design conversation and [[TODO-6]]. Questions 1–3 are
settled; question 4 is confirmed but leaves a gap that is named below and is the
operator's to close.

### 1. Serving-by-host is out of scope. The record, `check`/`claim` and the publish gate are this ticket.

Confirmed — but **one premise in the question is wrong and the conclusion does
not rest on it.** `apps/public-site` *does* have a D1 binding
(`wrangler.toml:53`, `index.ts:63`, and `D1SiteStore(env.DB)` at `index.ts:158`),
so "no D1 binding" is not a reason for anything.

What actually blocks host resolution is outside this repository. [[TODO-6]] §5
lists the wildcard `A`/`AAAA` record and the `*.1stc.site` wildcard certificate
as **[op]** items, and neither is done; §1's PSL submission has a multi-week lead
time that cannot be shortened. Until those exist, host→site resolution is code
that cannot work, and [[DOC-45]] §4 is explicit that the path grammar *"cannot
simply go"* while it is the only address that resolves. So the deletion of
`/site/<key>/` remains an acceptance criterion of the host work, and the host
work is a later ticket blocked on [[TODO-6]] §§1 and 5 — not on this one.

### The publish gate lands here, and the friction is intended

Keep it. *"Publication is the gate"* is this ticket's own language and the reason
[[DOC-45]] §4 is safe to do at all. From that commit a business must claim a
hostname before it can publish, and the claimed hostname will not resolve until
the operator items land — during which the published site is still reachable at
`/site/<key>/`, because that grammar is still there. So this is one added step
before publishing, not a broken publish path. Nothing is published today.

### 2. Revocation: the column, the filter and the operator flip all land here.

[[TODO-6]] §2 is unambiguous — *"Revocation must exist from day one. Whatever the
list says, something will get through it, and the only alternative to revocation
is leaving it up."* Finality is what creates the need: an owner cannot change
their own hostname, so a hostname that has to go can only go by our hand.

- `status` on `site_domains` per [[DOC-45]] §5, and **every read filtered to
  `active`.** The filter is where a revoked host actually stops resolving; the
  column without it is decoration.
- **A revoked host is never re-issued**, for the same reason a claimed one is
  never recycled.
- **The flip is not a new auth surface.** `platformAdminSeed`
  (`apps/control-app/src/identity.ts:967`) is the existing notion of a platform
  operator; the flip is one route gated on it, not an operator console.

This is a deliberate extension of the Behaviour section above, which named
revocation only as a consequence. It is cheap now and it is the safety valve the
finality rule makes necessary.

### 3. The row names the site; "one at a time" is enforced per business. Confirmed.

This is exactly right and matches [[EPIC-4]]'s Correction of 2026-09-13, which
settled [[DOC-45]] §11 item 4: **per business, one at a time** — with one site
per business the distinction is not observable, and it reopens the day a site
selector lands. So:

- implement [[DOC-45]] §5 literally, `site_domains.site_id` naming the site;
- refuse a second `platform`-kind claim anywhere in the business;
- and write the publish gate over `kind` — *does this site have at least one
  active address* — so custom domains need no edit to it. That is this ticket's
  own falsifier and it is worth restating: a publish check that names the
  `1stc.site` hostname specifically is the wrong check.

### 4. No UI in this ticket. Confirmed — but the field now has no home.

The routes and the surface declaration belong here, including the *"this is the
whole host `alice.1stc.site`, and it cannot be changed"* prose, which is the
declaration's own words for the reason [[REQ-237]] gives.

**The gap:** [[REQ-239]] built the Settings pane and deliberately left the
hostname field out — *"REQ-238 is still draft; there is no operation to call and
nothing true to render"* — with the pane written as a list of sections precisely
so the field is an append rather than a rewrite. [[REQ-239]] is now `free_coded`
and parked. So when this ticket lands, nothing owns building the field. Where it
goes — appended to [[REQ-239]] as a further commit, or its own ticket — is the
operator's call and has been raised with them. **Do not create a ticket for it
from this session.**

## Not answered here, and still open

[[TODO-6]] §3 describes label allocation under the **superseded** [[DOC-45]] §7 —
*"assigned at provision from the slugified business name, short discriminator on
collision, freely changeable"*, with old labels retained as redirects. All of
that was withdrawn by [[EPIC-4]]'s Correction of 2026-09-13 and by the rewrite of
[[DOC-45]] §7. Build against this ticket, not against [[TODO-6]] §3. The squatting
concern in that section survives the rewrite and is not addressed here.


### Correction to the Behaviour section: the reserved list is [[TODO-6]] §2's

The Behaviour section above names `www`, `app`, `api`, `mail`, `admin`, `ns1`,
`mx`, `_acme-challenge`, `portal`, `support`, `1stcontact`. **That is a sample,
and building it as the specification would be a bug.** [[TODO-6]] §2 holds the
actual list in four groups — infrastructure, protocol and validation, platform
identity, impersonation and abuse — and it is longer in every group: `smtp`,
`imap`, `ns2`, `cdn`, `static`, `assets`, `dashboard`, `status`, `staging`,
`dev`, `test`, `localhost`, `_dmarc`, `_domainkey`, `autodiscover`, `autoconfig`,
`1stc`, `firstcontact`, `help`, `billing`, `account`, `accounts`, `login`,
`signin`, `secure`, `verify`, `payment`.

Build the first three groups, **keeping them separate in code**, because they
change for different reasons and a single flat array loses that. The fourth group
is not a static list and is not built — [[DOC-45]] §11 item 6 defers it, and
revocation is what carries it meanwhile.

The asymmetry [[TODO-6]] §2 states is the reason to err long: *"a label wrongly
refused is a mild annoyance, a label wrongly granted is unrecoverable once someone
is using it as their business address"* — and finality makes the second half
literally true rather than rhetorical.
