---
uid: request-616e56ac
id: REQ-257
type: request
title: 'The DNS layer: zones, the Cloudflare client, the external resolver, and the
  operator backfill'
created_by: EPIC-5
created_at: '2026-09-16T03:35:39.898551+00:00'
updated_at: '2026-09-16T03:35:39.898551+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
---

## What this is

**The DNS layer, and nothing that uses it.** A `zones` table, a Cloudflare API
client, a resolver that reads live DNS from outside, and the operator backfill
that attributes the zones already in the platform account.

No customer sees anything this ticket builds. It is the floor the other three
stand on, and it is separated out because all three need it and none of them
needs the others.

## What exists today

**Nothing, and that is verified rather than assumed.** There is no Cloudflare API
client anywhere in the repo — `api.cloudflare.com` appears only in
`tools/generate/src/cli/kb.ts`, which is Workers AI for the knowledge base and
shares no credential, no client and no concern with zone management. There is no
zone concept, no record model, and no external resolver.

What does exist and is not to be rebuilt:

- `newId` (`tools/generate/src/store/ids.ts:38`) — 128 bits from a CSPRNG behind
  a type prefix, per [[REQ-190]]. `zones.id` is `zon_…` from this and never a
  Cloudflare id.
- The migration discipline in `db/migrations/0008_site_domains.sql` — a new file
  rather than an edit, because `wrangler d1 migrations apply` records what it has
  run and an edit reaches neither database. Next number is `0010`.

## `zones`

```
zones(
  id,               -- `zon` prefix, per [[REQ-190]]
  account_id,       -- NULL means unattributed, which means selectable by nobody
  apex,             -- UNIQUE
  cf_zone_id,       -- Cloudflare's, for API calls
  assigned_ns,      -- the pair we showed them
  origin,           -- 'registered' | 'nameserver' | 'operator' | 'platform'
  status,           -- 'pending' | 'active' | 'released' | 'revoked'
  claimed_at, activated_at
)
```

**Account-scoped and not business-scoped.** `entitlements` is account-scoped
because payment is an account concern, and a domain is a thing somebody paid for.
A business is where sites live; an account is where money and assets live. The
pool is the account's; the assignment lands in a business.

**`origin` is written once, at the moment the zone arrives, and is never derived.**
Cloudflare cannot tell us who a zone belongs to — in its model every zone in the
account is equally ours, which is the whole point of the arrangement. The
association is a fact we record and the only reliable source is how the zone got
there. A zone whose origin was inferred by reading anything back from Cloudflare
is a falsifier below.

**`status` mirrors Cloudflare's rather than inventing a parallel one.** Cloudflare
already runs the state machine — `pending` until the nameservers point at the
assigned pair, `active` once it observes that they do. A second, independently
computed notion of activeness is a second thing that can be wrong, and the one
that would be wrong is ours.

**`apex` is UNIQUE and that index is the authority**, on the same reasoning
`0008`'s unique index on `host` is: Cloudflare allows one zone per apex per
account, so a second claimant meets a refusal that came from the database rather
than from a check that raced.

## The Cloudflare client — the write half

One module, one token, and the operations are enumerated rather than a generic
passthrough:

- list zones in the account
- read a zone (id, status, assigned nameservers)
- create a zone, delete a zone
- list, create, update, delete DNS records within a zone
- create and delete a Worker route

**The token is a secret binding and is scoped to exactly those.** `Zone:DNS:Edit`
and `Workers Routes:Edit` on the account, and nothing else. It is never in
`wrangler.toml` — see that file's own rule for `TURNSTILE_SECRET`.

**Absent binding means refuse, not degrade.** The same fail-closed rule
`lead.ts` and `gate.ts` already follow: a deployment with no Cloudflare token
manages no zones; it does not manage them optimistically and reconcile later.

## The resolver — the read half, and it is the half three other tickets want

Reading live DNS **from outside**, against a domain's *current* authoritative
nameservers rather than against our own zone. This is what answers *"is there a
live business on this domain today"* — the question the epic identifies as the
one that actually decides the work.

- resolve `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS` for a name
- **probe DKIM selectors by name, because they are not enumerable over DNS.**
  `google`; `selector1`/`selector2` for Microsoft 365; `k1` for Mailchimp;
  `s1`/`s2` for SendGrid; `resend` for ours. A missed selector breaks signing
  silently and the symptom arrives weeks later as *"our email goes to spam"*.
- classify what it finds into *whose* it is — the provider names a customer can
  recognise, which is what makes *"your email is with Microsoft"* sayable.

**It is built here and consumed in three places**, and that is a deliberate
departure from [[EPIC-5]]'s claim that the propagation suppression window is the
only thing crossing an epic boundary: ticket C's pre-attach check, ticket E's
assistant tools, and [[EPIC-7]]'s check engine all need exactly this and must not
each grow their own. The epic body is amended accordingly.

## The backfill, and why it is not a flow

The operator's own domains are already in the platform Cloudflare account and are
already active. **So the trap case does not apply to them** — no deletion, no
re-add, no reassigned nameserver pair, no downtime window. Their association with
an account is a backfill: an operator names the account, the row is written
`origin = 'operator'`, `status` mirrors Cloudflare's. A human decision, recorded.

## Two guards, both default-closed and both in code

**`1stc.site` and `1stcontact.io` must be permanently unattributable.** They live
in the same account and appear in any naive zone listing. `1stc.site` in
particular carries *every* customer's platform hostname, so attributing it to one
account would hand that account the whole namespace. This is an explicit refusal
against `origin = 'platform'` — not a convention an operator is trusted to
observe, and not a list an operator maintains.

**A zone with no `account_id` is selectable by nobody.** Default closed, which
also buys the drift check below.

## The drift check

List Cloudflare's zones, diff against this table. Anything present there and
absent here is either a platform zone or a mistake. **Somebody adding a zone by
hand in the dashboard is a thing that will happen**, and the alternative to
noticing is a zone nobody can offboard because nothing recorded how it arrived.

Operator-facing output. No automatic reconciliation — the whole point is that
`origin` is a human decision and the drift check is how a human is asked to make
one.

## Not in scope

- **The claim flow** — creating a zone on a customer's say-so, the assigned pair,
  the 14-day expiry of a `pending` claim. That is the nameserver on-ramp, parked
  with ticket D.
- **Serving anything on a zone** → ticket B.
- **Any customer-facing surface** → ticket C.
- **Record templates, SPF merging, `_dmarc` rules** → ticket E. This ticket can
  write a record; it holds no opinion about which records are safe.
- **Buying, transferring, renewing** → [[EPIC-6]].
- **Whether records are still correct tomorrow** → [[EPIC-7]].

## Falsifiers

- A zone attributed to an account by reading anything back from Cloudflare rather
  than from the provenance recorded when it arrived.
- Any path that can attribute an `origin = 'platform'` zone to an account.
- A zone with `account_id` NULL returned by any selection query.
- A second, independently computed notion of whether a zone is active.
- A generic Cloudflare passthrough — a method that takes a path and a body.
- The API token present in `wrangler.toml` rather than as a secret.
- A deployment with no token that writes zone state anyway.
- A DKIM check that enumerates rather than probing known selector names.
- A second external-DNS reader in ticket C, ticket E or [[EPIC-7]].
- `zones.apex` without a unique index.
