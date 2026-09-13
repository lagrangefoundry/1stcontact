---
uid: request-2ac88003
id: REQ-238
type: request
title: 'The 1stc.site hostname: chosen once, and required before publishing'
created_by: EPIC-4
created_at: '2026-09-13T21:17:45.731357+00:00'
updated_at: '2026-09-13T22:00:45.130262+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  depends_on:
  - REQ-236
  epic_parent: epic-0728e1c5
  auto_merge_back: true
  needs_review: false
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
