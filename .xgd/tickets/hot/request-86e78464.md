---
uid: request-86e78464
id: REQ-183
type: request
title: 'The customer portal: the account''s own surface, rendered by the site pipeline'
created_by: xgd
created_at: '2026-09-04T01:41:53.923078+00:00'
updated_at: '2026-09-04T01:41:53.923078+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 8
  auto_merge_back: true
  needs_review: false
---

# The customer portal: the account's own surface, rendered by the site pipeline

## Where this comes from

[[REQ-180]] D1 confirmed the reading and deliberately did not build it. This is
the ticket it split out.

[[DOC-40]] §2.1: the surface showing an account its plan, its invoices and its
details is **the customer portal of the 1st Contact site**, rendered by the code
that will render the portal our customers give their own customers. It appears in
the builder chrome because that is where a person looks for it, not because it
belongs to the builder.

What [[REQ-180]] owed was that building this later requires **no second
implementation** of what it did build. It landed the prohibition — no plan,
billing or invoice view exists as a builder route, asserted — and the avatar
surface ([[REQ-179]]) is bounded to facts about the session: who is signed in,
and which businesses that identity reaches. Nothing has been built here twice.
This ticket has to keep it that way.

## 1. The thing being avoided

[[DOC-40]] §2.1 rule 1 names the failure mode: **the bespoke admin billing
page**. It is the same page a customer needs; building it once for us and once
for them forfeits the whole of §2.1, and the second one gets built by someone
reverse-engineering what the first one decided.

So the test for every decision in this ticket is not "does it work for 1st
Contact" but **"is this the thing a customer's customer will use"**. Anything
that is only ever true of 1st Contact's own account belongs in the admin console
([[REQ-170]]) instead. That line is drawn in §5.

## 2. What it is made of, and why none of it is new

The portal is **a site page, plus a behaviour module, plus an authenticated
API**. That is the shape `contact-form` already has (REQ-93, [[DOC-25]]/[[DOC-26]]):
the fold refuses to synthesize raw controls, a vetted behaviour module binds to a
slot, and the module talks to an endpoint. A portal is that same arrangement with
a different module and an endpoint that requires an identity.

This matters because it is what makes "rendered through the site pipeline" a
buildable sentence rather than an aspiration. The portal is authored as pages in
the platform business's site, edited in the builder like any other page, and
rendered by the renderer that renders everything else. **No new rendering path,
no `apps/control-app` template, no third store adapter.** If this ticket finds
itself adding a rendering path, the reading in §1 has been abandoned and that
needs recording against [[DOC-40]] §2.1 rather than absorbing quietly.

## 3. The decision this ticket has to make first: which origin

**This is the open question, and it should be settled before any of it is
built.** The portal needs a logged-in identity, and the two origins have opposite
properties:

| | `app.1stcontact.io` (control-app) | `1stcontact.io` (public-site) |
| --- | --- | --- |
| identity | Cloudflare Access, verified email, `admit` ([[DOC-40]] §3) | none |
| methods | full | `GET`/`HEAD` only |
| caching | `no-store` on every API answer | edge cache, 60s |
| writes | yes | none — the Worker is read-only by design |

`apps/public-site` is 448 lines whose every property is *public, cacheable,
GET-only*. A per-visitor authenticated surface is the negation of all three, and
the caching one is not a configuration detail: one cached copy of a portal page
is everybody's answer.

**The recommendation is `app.1stcontact.io`, rendered through the site
pipeline.** That is not a retreat to a builder page — the pages are the platform
business's site content and the renderer is the shared one; only the origin
serving them is the already-authenticated one. It buys the identity layer for
free, and [[DOC-40]] §3 already says the credential layer is the rented half:
`users`, `memberships` and `entitlements` do not change when the magic link
replaces Access, so a portal built against `admit` moves to a customer's own
origin without being rewritten. That is precisely the "no second implementation"
property this ticket owes.

**The alternative** — authentication on `public-site` now — buys the level-2
origin sooner and costs the whole of [[DOC-40]] §3's later branch up front:
`auth_tokens`, `sessions`, an email provider, a verified sending domain. It also
makes the read-only Worker a writing one. It is the right eventual answer and the
wrong first step.

If the recommendation is taken, **it must be written down that the origin is
provisional and the pages are not** — otherwise the next hand reads
`app.1stcontact.io` as "the portal is a builder feature after all" and §1's
failure mode arrives by a different door.

## 4. What it shows

Portal capabilities, [[DOC-40]] §2.1's list, in the order they can honestly be
built:

- **See my plan.** The best active grant covering now, per business
  ([[DOC-40]] §5), plus the lapse reason [[REQ-180]] §1 landed for the ones that
  have none. This exists today and is the one capability with real data behind it.
- **Change my details.** `users.display_name` for the account, `tenants.name` for
  each business — the human label, which [[DOC-40]] §2 says may change, and which
  is currently changeable by nobody.
- **See what I have been charged.** There is nothing to show: [[DOC-40]] §5 defers
  the payments funnel and there is no `subscriptions` table. The surface must say
  so honestly rather than render an empty table that reads as a failure to load —
  or be left out, which is a decision this ticket should make rather than inherit.

**Adding a business does not appear here.** [[REQ-180]] D2 reversed that: we are
pre-billing, `provisionBusiness` writes a live `pro` grant, and a
customer-reachable route onto it is an unbounded free-plan mint. It is an
operator action on `POST /api/admin/businesses` until billing exists. A portal
that grows an "add a business" button has re-opened a closed decision.

## 5. The line against the admin console

[[REQ-170]] is the operator's tool: every account, every grant, the invite that
provisions one. This is one account's view of itself. The line is worth drawing
once, here, because both surfaces read the same three tables and the tempting
shortcut is one surface with a privilege check in it.

- **Scope.** The portal answers only about the caller's own account and the
  businesses they hold a live membership on. It reads `admit`'s answer and never
  queries by id — which is what stops it becoming the existence oracle
  `identity.ts` and `scope.ts` both refuse to be.
- **Authority.** The portal *reads* grants and never writes one. Creating and
  revoking entitlements is [[REQ-170]]'s, because a surface that can grant itself
  access is not a portal.
- **Population.** The admin console's left list is accounts. The portal has no
  list of accounts, in the same way a customer's portal has no list of that
  customer's other customers.

## 6. What is deferred, and what is owed to it

The portal our customers give **their** customers is not built here either. What
this ticket owes is the same thing [[REQ-180]] owed it: building that later must
require no second implementation. Concretely —

- the pages are site content in a business's site, not a route table;
- the API is authorised by an identity resolved from `memberships`, not by
  "is this the platform business";
- nothing in it reads `TENANT_ID` ([[REQ-168]] leaves that variable two readers,
  and a portal is not the third).

If those three hold, the level-2 portal is this portal with a different
credential layer and a different tenant, which is the whole claim of
[[DOC-40]] §2.1.

## Acceptance

- The origin decision of §3 is recorded before the surface exists, and the losing
  option is recorded as rejected rather than silently not taken.
- The portal's pages are rendered by the shared site pipeline against the
  platform business — no second renderer, no builder-route template.
- It is reached from the avatar ([[REQ-179]]), which links out rather than owning
  the surface; the avatar dialog stays bounded to facts about the session.
- It shows the account's plan per business, including the lapse reason for a
  business with no live grant.
- Details editable from the portal are the account's display name and each
  business's `tenants.name`.
- The portal reads entitlements and writes none; it answers only about businesses
  the caller holds a live membership on, and a request naming another account's
  business is indistinguishable from one naming a business that does not exist.
- There is no way to add a business from the portal.
- No user-visible string says "tenant" ([[REQ-180]] §3's guard covers the two
  apps; this must not introduce a third surface outside it).

## Open questions

1. **§3's origin.** The one that should be answered first.
2. **Does the charges surface land at all in v1**, given there is nothing to put
   in it, or does the portal ship with plan and details only?
3. **Is the 1st Contact marketing site a prerequisite?** `public-site` currently
   serves a placeholder at the apex, held back "until the marketing site exists".
   A portal that is a page of a site nobody has built is reachable but has no
   surroundings — which may be fine, and should be a decision.
