---
uid: request-a6540f61
id: REQ-258
type: request
title: 'Serving a custom domain: the records, the runtime Worker route, and host→site
  resolution'
created_by: EPIC-5
created_at: '2026-09-16T03:35:49.963776+00:00'
updated_at: '2026-09-16T18:18:19.531619+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 5
  depends_on:
  - request-616e56ac
  epic_parent: epic-c5175c8f
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c3e2405b
---

## What this is

**A domain whose zone we already hold serves a site.** The DNS records, the
Worker route, and the host→site resolution — the whole mechanism, driven
internally. No customer-facing surface; ticket C is what puts a button on this.

This is the ticket that turns a `site_domains` row from a record into an address.

## The finding that motivates it

**The selector proposed in [[EPIC-5]] writes a row that nothing reads.**
`apps/control-app/src/public-url.ts` states it outright: *"`public-site`
resolves a site from that grammar and from `APEX_SITE_KEY`, and from nothing
else — there is no host→site resolution."* Attaching a custom domain today
produces a correct row, a correct link, and a hostname that resolves nowhere.

**And the request would not arrive at the Worker even if it did.**
`apps/public-site/wrangler.toml` declares its routes statically —
`1stcontact.io` and `*.1stcontact.io/*`. `alicesplumbing.com` is matched by
neither. That step is named nowhere in the epic and it is a prerequisite of
every other word in it.

## What already exists and is not to be rebuilt

The read side is **already kind-agnostic and ready**, which is why this ticket is
smaller than it looks:

- `addressForLinks` (`apps/control-app/src/hostname.ts:429`) already prefers
  `kind === 'custom'` over `platform`. Custom domains win links the day a row
  exists.
- The publish gate is already written over kinds rather than over the platform
  host — `0008_site_domains.sql` records the reasoning: *"`if (!hostname) refuse`
  becomes a wrong refusal the day custom domains land."* It does not become one.
- `site_domains.kind` already carries `custom` in its closed enum.
- `recipientSiteUrl` already takes the host as an argument rather than a
  constant.

**Nothing in `site_domains` needs to change for this ticket**, with the one
exception below.

## Three mechanisms, and all three are needed for one request to succeed

1. **DNS records in our zone** — `A`/`AAAA` for the apex, the `www` record, both
   proxied. A route without a record resolves to nothing, which `wrangler.toml`
   already records for the apex: *"a route alone would resolve to nothing."*
2. **A Worker route, created at runtime via the API** — not a config edit.
   Per zone, when the domain is attached.
3. **Host→site resolution in `public-site`** — `Host:` header → `site_domains`
   → site, filtered to `status = 'active'`, as every read of that table is.

## Root, not `/site/<key>/` — and the legacy form survives as a guarded redirect

**Decided here rather than deferred, because it decides the resolver's shape.**

[[DOC-45]] §4 says a site sits at the root of its host. A customer who buys
`alicesplumbing.com` and is given `alicesplumbing.com/site/dom_9f3a…/` has not
been given an address, and no amount of later cleanup makes that shippable. So
the site is served at the **root** of a custom host.

**But the prefix cannot simply stop working, because it is already in the post.**
`recipientSiteUrl` mints `https://<host>/site/<key>/…` into gated-download emails
today. Those links are permanent and unrecallable. So on a host that resolves:

- **root-relative is canonical** and serves;
- **`/site/<key>/…` where `<key>` is the site that host resolves to** 301s to the
  root-relative equivalent — which keeps every already-mailed link working and
  makes deleting the grammar a later cleanup rather than a flag day;
- **`/site/<key>/…` where `<key>` is any other site 404s.**

**That third rule is the important one and it is a cross-tenant guard, not
tidiness.** `public-site` today serves `/site/<any-key>/` on whatever host it is
routed to, which is correct on the product's own front door and is a leak the
moment the host belongs to a customer: without it, `alicesplumbing.com` serves
Bob's site to anyone who knows Bob's key, from Alice's domain, wearing Alice's
certificate. Routing a customer domain to this Worker is what creates that
exposure, so the guard lands in the same ticket that creates it.

This is [[TODO-6]] §4's redirect reasoning applied one level down: a permanent
redirect is the only form that is both honest about which address is canonical
and safe to have printed on something physical.

## The one schema addition: which host is *the* address

`site_domains` maps host to site and stops. The moment two hosts reach one site —
the apex and `www`, or a second domain the business also owns — something must
say which is canonical, for redirects, for URL construction, and so search
engines are not handed duplicate content. [[DOC-45]] §4's *"a site has exactly one
address"* is a statement about the canonical one, not about how many hosts
resolve.

Cheap now, a migration later. `www` is what forces it: we write both records and
redirect one to the other, and the thing being redirected to has to be nameable.

**Which host is not a question we ask the customer.** Serve the apex, redirect
`www` to it, write both records, decide once. It becomes a real question only when
the apex is already occupied by their existing site — and that is ticket D's
territory, not this one's.

## A risk to settle before building, not after

**Does `wrangler deploy` reconcile the static `routes` array in a way that
removes routes it did not declare?** If it does, every deploy of `public-site`
silently un-publishes every customer domain, and the symptom is every customer
site going dark at once with nothing in the diff to explain it.

This is a twenty-minute experiment against a throwaway zone and it decides
whether runtime routes are viable at all or whether the mechanism has to be a
Worker custom-domain binding instead. **Do it first.** If runtime routes are not
safe, this ticket changes shape and the answer is worth having before any code is
written.

## Two waits this adds, and they are invisible

[[EPIC-5]] names three waits. This adds the fourth and makes the second concrete:

- **Route propagation** — seconds to a minute, and until it finishes the domain
  404s from Cloudflare rather than from us.
- **Certificate issuance** — minutes, and only after the zone is active.
  Universal SSL covers the apex and one label of subdomain automatically for a
  zone in our account, so `www` is covered and nothing deeper is.

Both will read as *"it is broken"* when they are merely slow. Each needs its own
state in whatever renders progress. **Neither is blocked by [[TODO-6]]** — see
below.

## This is not blocked by [[TODO-6]], and that inverts the order of work

[[TODO-6]] §§1 and 5 — the PSL submission, the wildcard `A`/`AAAA`, the
`*.1stc.site` wildcard certificate — gate the **platform apex**. A zone in our own
Cloudflare account gets the records we write it and its own Universal SSL
automatically, with no wildcard and no PSL entry involved.

**So a custom domain can serve before `1stc.site` resolves at all.** [[DOC-45]]'s
order of work puts custom hostnames last, after the platform label work and the
operator tasks. For serving, the dependency runs the other way, and the operator's
own already-active zones are the shortest route to a real site on a real address.

## Accepted limit: no session on a custom host

`SESSION_COOKIE_DOMAIN` is one apex per deployment — `1stcontact.io`. On
`alicesplumbing.com` the cookie is not sent, so **every visitor is signed out,
always**, and `account-chrome` renders its signed-out state.

For published bytes this costs nothing: no page is gated and no published content
varies by session ([[REQ-200]]). It is recorded as an accepted limit rather than
discovered later, and it is [[DOC-45]] §10 arriving earlier than that document
expects.

## Not in scope

- **The selector, the toggle, release** → ticket C.
- **Deleting the `/site/<key>/` grammar** — it is load-bearing for mailed links
  and for the platform apex. This ticket makes it redundant on custom hosts and
  removes it from none.
- **`1stc.site` label resolution** — same resolver eventually, different gate
  ([[TODO-6]] §§1 and 5). Not built here and not blocked on.
- **Zone creation, the claim flow** → parked with ticket D.
- **Which records are safe to write** → ticket E.

## Depends on

Ticket A — the Cloudflare client's record and route operations, and `zones` for
the zone a host belongs to.

## Falsifiers

- A `site_domains` row with `kind = 'custom'` whose host resolves nowhere after
  the mechanism reports success.
- A customer domain added by editing `wrangler.toml`.
- `/site/<other-key>/…` serving anything other than a 404 on a custom host.
- An already-mailed `/site/<key>/…` link on a custom host that stops working.
- A site served at both the root and the prefix with a 200 on each.
- Two hosts reaching one site with nothing recording which is canonical.
- A Worker route created without the DNS record that makes it reachable.
- Serving on a custom host gated on any [[TODO-6]] item.
- A read of `site_domains` that does not filter to `status = 'active'`.


---

## What was built

The mechanism, the resolver and the guard, with the named risk settled first.

### The risk, settled — and it changed `wrangler.toml` rather than the design

**`wrangler deploy` does delete routes it did not declare, and the answer came
out of wrangler's own deploy path rather than out of an experiment.** It splits
the `routes` array in two and treats the halves completely differently:

- an entry **without** `custom_domain` is a **zone route**, published with
  `PUT /accounts/<id>/workers/scripts/<name>/routes` carrying the whole list —
  wrangler's own source comments the line *"PUT will delete previous routes on
  this script."* One zone route in the array makes every deploy a
  reconciliation, and every runtime-created customer route is deleted by it;
- an entry **with** `custom_domain = true` goes to a different resource
  (`PUT …/domains/records`) which cannot touch zone routes at all.

So runtime routes ARE viable and the ticket keeps its shape — provided this
Worker declares **no zone route at all**. `*.1stcontact.io/*` was the only one,
was declared and (by its own comment) never served, and is removed.
`app.1stcontact.io` is `control-app`'s own more-specific route and never
depended on it. A static UAT holds the rule going forward, because the failure
is silent, total, and indistinguishable from an outage.

### The three mechanisms, composed in one place

`apps/control-app/src/serving.ts` — records, then routes, then the row, with
**every step undone in reverse if a later one fails**. Rollback is a technical
consequence of the ordering rather than a separate feature: a refusal partway
through would otherwise leave a zone holding records for a domain that was never
attached, which is the first falsifier wearing different clothes. A record that
was overwritten is restored to what was read, not deleted.

Decisions made inside it, each one a consequence of something above:

- **The serving records point at `192.0.2.1` (RFC 5737) and `100::` (RFC 6666)**
  and are **proxied**. Proxied is load-bearing — a Worker route only intercepts
  a proxied hostname — and the addresses are deliberately unroutable so that a
  bypassed proxy fails rather than reaching whoever owns a real address somebody
  picked as a placeholder.
- **A record already exactly right is not a write**, which makes the operation
  repeatable after a partial failure.
- **Records that already existed at a serving name are reported, never
  swallowed and never refused.** Pointing a domain at us *is* replacing whatever
  its apex pointed at; deciding whether a domain is safe to take over is the
  pre-cutover sweep and a different ticket. What this owes that work is that
  nothing is replaced silently.
- **Depth is refused.** Universal SSL covers the apex and one label beneath it,
  so `a.b.example.com` would resolve, route, and then present a certificate the
  browser rejects. Refusing at the door is the honest version of the limit this
  ticket already records.
- **The zone is found by walking the host's suffixes against the `zones` table**
  (`zoneForHost`), longest match first — which is exact for the domains the
  question is ever asked about and needs no Public Suffix List.
- **[[REQ-257]]'s two zone guards are restated where they bite**: the platform
  apex may not be served from, and a zone with no `account_id` or a non-`active`
  status is refused.

### A custom domain is not final, and that is the opposite of the platform rule

`1stc.site` is scarce, public and first-come, so a platform hostname is revoked
and never re-issued. **A domain the business bought is none of those things**,
so `releaseCustomHosts` **deletes** the rows — a tombstone would make this
product the reason they cannot point their own domain somewhere else tomorrow.
The `kind` in the WHERE clause is what stops that ever touching a platform row.

This is why the client grew one operation, `listRoutes`: `deleteRoute` is
addressed by Cloudflare's route id, and a `site_domains` row records an address
rather than a vendor's handle for one. `Workers Routes:Edit` already admits the
read, so the token's scope did not move.

Taking a domain down also **promotes the site's remaining oldest address to
canonical** (`ensureCanonical`) — otherwise every host the site has left would
301 to a host with no row.

### The operator's entry point

`POST` and `DELETE /api/admin/domains`, gated by `ownsPlatformBusiness` with a
404 refusal, on `/api/admin/zones`' reasoning exactly. It exists because a
mechanism with no entry point is unprovable: every claim here — the ordering,
the guards, the rollback, the cross-tenant refusal — is a claim about a request
arriving somewhere. The customer-facing selector remains ticket C.

The business names the site; a route taking a site key would ask an operator to
hold an opaque value they cannot look up.

### Host→site resolution, and the guard it creates the need for

`public-site` now asks `site_domains` which site a `Host:` header names
(`siteForHost`), filtered to `status = 'active'`, memoised per request, and
**kind-agnostic** so `1stc.site` resolves through the same code the day its DNS
lands. A failed read answers "unbound" rather than propagating — a local
`wrangler dev` runs against a D1 where the table does not exist — and logs every
time, because a customer domain answering 404 is otherwise indistinguishable
from an unpublished site.

`siteOfRoute` is the single spelling of *"which site does this request name"*,
used by the page server, the lead endpoint and the download gate — so the
cross-tenant refusal cannot come to be applied by two of the three. The lead
endpoint needed it as much as the page server: without it a form posted to
`alicesplumbing.com/site/<bob's key>/api/lead` would file an enquiry into Bob's
contact list from Alice's domain.

**Both redirects are decided in one place and cost one hop.** A request to
`www.alicesplumbing.com/site/<key>/about` lands on `/about` at the address in a
single 301, because redirecting for the path and then again for the host would
put an extra round trip in front of exactly the visitor who followed an old
link. A key this host may not serve is **not** redirected anywhere — a 301 would
confirm the site exists, which is the half of the guard that is about
information rather than bytes.

### Syntactic rules for a custom hostname

`normaliseHost` tidies (scheme, path, port, trailing dot, case) and `hostRefusal`
refuses, kept apart exactly as `normaliseLabel` and `labelRefusal` are. It
refuses a single label, an over-long name or part, a hand-written `xn--` part
(the homograph mechanism), anything outside letters/digits/hyphens — and **the
platform apexes**, which is a namespace rule rather than a syntactic one:
`alice.1stc.site` is had through `claimHostname`, with its reserved list, its
finality and its one-per-business rule, and reaching it through the custom path
would be all of those rules walked past.

`normaliseApex` in `zones.ts` is now a name for `normaliseHost`. The two were
written separately and were the same rule, and two spellings of it became two
answers to *"is this host inside that zone"* the moment a host had to be matched
against an apex.

### The canonical column

`0011_site_domains_canonical.sql` — `canonical INTEGER NOT NULL DEFAULT 1` plus
a partial unique index on `(site_id) WHERE canonical = 1 AND status = 'active'`.
A boolean and not a `redirects_to` host: the target is a value this table already
stores, so the two could disagree, and there is no update path on `host` anyway.
Default 1 is the only default that cannot break an existing row — every row today
is a site's only address.

Attaching demotes the previous canonical row and inserts the new ones **in one
D1 batch**, so there is no window in which a site has two canonical addresses or
none. `claimHostname` takes the title only if nothing else holds it, which keeps
a business that attached its own domain first from having its free hostname
quietly become the address.

`addressesOf` orders canonical-first then by age, because `created_at` alone
stopped being a meaningful order once the apex and its `www` are written in the
same operation and can share a timestamp.

### Test evidence

- `tests/test_UAT_FC_REQ-258_runtime_routes_survive_a_deploy.test.ts` — the
  settled risk, held statically: wrangler replaces the whole list, this Worker
  declares no zone route, and the route names the script this repo deploys.
- `tests/test_UAT_FC_REQ-258_a_bound_host_serves_one_site.workers.test.ts` — the
  resolver and the guard: root serving, the prefixed link 301ing, another site's
  key 404ing, the product's own front door unchanged, `www` 301ing, one hop and
  not two, attachment demoting the platform hostname, revocation stopping
  resolution, the lead endpoint, and the mailed download link.
- `tests/test_UAT_FC_REQ-258_serving_a_custom_domain.workers.test.ts` — the
  mechanism: the plan, the records, the ordering, the rollback, the replacement
  report, the no-op re-attachment, the guards running before any write, release
  and re-promotion, and the admin surface's two refusals.

`tests/test_UAT_FC_REQ-257_cloudflare_client.test.ts` grew by one entry — the
assertion is still an equality, which is the property worth keeping rather than
the number.

## Accepted, and not in scope

- **No session on a custom host**, as recorded above — nothing gated, nothing
  session-varying, so it costs nothing for published bytes.
- **The two waits** (route propagation, certificate issuance) have no progress
  surface here; whatever renders progress is ticket C's.
- **The pre-cutover sweep** — what a domain's live mail and verification records
  say before we take it over — is named as a different ticket, and the
  `replaced` report is what this ticket owes it.
