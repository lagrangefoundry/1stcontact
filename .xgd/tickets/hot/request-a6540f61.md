---
uid: request-a6540f61
id: REQ-258
type: request
title: 'Serving a custom domain: the records, the runtime Worker route, and host→site
  resolution'
created_by: EPIC-5
created_at: '2026-09-16T03:35:49.963776+00:00'
updated_at: '2026-09-16T03:35:49.963776+00:00'
completed_at: null
last_field_updated: created_at
status: draft
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