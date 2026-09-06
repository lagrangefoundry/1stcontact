---
uid: request-4af0cf7f
id: REQ-200
type: request
title: 'account-chrome: Sign In and the account portal as an L2 module on any site
  with accounts'
created_by: xgd
created_at: '2026-09-06T00:02:10.761978+00:00'
updated_at: '2026-09-06T20:14:33.971440+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-70a8f021
---


**Design ref:** [[CHAT-39]]. Depends on [[REQ-134]] (lagrange-framework) for sessions.

## Sign In is not platform chrome

The obvious way to build this is to have the apex Worker paint a Sign In link in
the corner of 1st Contact's own page. That would be [[DOC-40]] §2.1 rule 1's named
failure — a capability built for the platform that every customer needs too.

A customer's site may have accounts: people who sign in, hold a portal, and have a
relationship with that business. When it does, it needs exactly the same two
controls. So they are a **feature of any 1c site that has accounts**, and 1st
Contact's own site is simply the first one.

**Not of every site.** Plenty of sites have no accounts at all, and a login link on
a brochure site is a dead end that invites confusion. The capability is therefore
present or absent per site.

## An L2 behavior module, placed in an L1 slot

The mechanism already exists. [[REQ-93]] lets an L1 page bind a module instance to
a slot in its tree, and `packages/framework/src/l2/contact-form.ts` is the
precedent — a vetted behavior module with a slot preset registered by behavior id
in `l2/presets.ts`.

`account-chrome` becomes the second such module. That it is a module rather than
Worker-painted chrome is what buys what you asked for: **L1 decides where it goes
and what it looks like.** Placement is a slot; styling is the L1 tree in that slot;
and a site that wants the portal icon in the footer and the Sign In link in the
header can have that, because they are slots and not a fixed corner.

It ships a preset, so a site can instantiate it without authoring any L1.

## Two states, and what is in each

**Signed out** — a Sign In control. Activating it opens a modal asking for an email
address, which posts to the issue endpoint and then says *check your email for a
sign-in link*. That message is shown **whether or not the address was known**
([[REQ-134]]): the response must not reveal who is on the list. Today an unknown
address silently sends nothing; self-signup is a later decision.

**Signed in** — an account portal control, linking to that site's portal.

**And a link into the builder when, and only when, the signed-in person operates at
least one business.** This is the "My Businesses" control, and it is written as a
general rule rather than a platform special case on purpose: *operates a business*
is a fact about the person (`memberships`), not about the site they are looking at.
It happens to be true of one person today. An agency customer would see it too, and
would be right to.

**Falsifier:** a branch anywhere in this module on which site or which business it
is being rendered for.

## Enabled by declaration, never derived

Whether a site has accounts is a property the site declares. It must **not** be
derived from "does this business have any members yet", because the first member
signs up by using the Sign In control — derivation would hide it exactly when it is
needed and produce a site that can never acquire its first account.

## Sessions do not cross a cookie domain, and nothing may assume they do

[[REQ-134]] makes the session cookie's `Domain` host configuration, and that
constraint is load-bearing here rather than incidental.

`1stcontact.io` and `app.1stcontact.io` share a session because a cookie on
`.1stcontact.io` reaches both. A customer site on `alicesplumbing.com` **cannot
read that cookie and never will** — cross-site cookies are not available and should
not be wanted. So a site on its own domain has its own session, scoped to that
domain, and a person signed in to one is not thereby signed in to another.

This is correct rather than a limitation: two businesses' sites sharing a login
would be exactly the cross-tenant reach the tenancy model exists to prevent. What
matters is that nothing is built on the assumption of one global session.

**Falsifier:** any code that reads a session without reference to the domain it was
issued for.

## `public-site` becomes session-aware, and only that

`apps/public-site/src/index.ts` states *"There is no authentication, and published
sites are public by definition."* This amends that sentence, and the amendment is
deliberately narrow: the Worker reads a session cookie **to choose which of the two
states to render**, and for nothing else. Published content stays public and
unauthenticated; no page becomes gated, and no content varies by who is looking.

Caching follows from that: the module's rendered output depends on a cookie, so the
response carrying it cannot be served from the shared edge cache the way an
anonymous page is.

## The 1st Contact apex becomes a published site

`APEX_BODY = 'Hello from 1stcontact.io'` is replaced by a real published 1c site in
the `1stcontact` tenant, using this module — which is the dogfooding claim made
concrete: the platform's own front page is built the way a customer's is.

Its copy is deliberately minimal; the site is in stealth and has nothing to
announce. What it must have is the module, correctly placed.

## What this does not do

- no self-signup — an unknown address sends nothing
- no gated content, no per-viewer content
- no password, no OAuth, no second factor
- no portal itself; `/account` already exists
- no marketing copy beyond a placeholder

## Acceptance

- an `account-chrome` L2 behavior module exists alongside `contact-form`, is
  registered in `l2/presets.ts`, and ships a slot preset
- it can be bound to an L1 slot, and two sites can place it in different slots with
  different styling and both render correctly
- a site declares whether it has accounts; the module is absent when it does not
- the enabled state is declared and is not derived from whether any member exists
- signed out, it renders a Sign In control that opens an address modal and then
  reports *check your email*, identically for a known and an unknown address
- signed in, it renders an account portal control
- signed in, it renders a builder link when the person operates at least one
  business and does not when they operate none
- the module contains no branch on which site or business it renders for
- a session issued for one cookie domain does not authenticate a request on another
- `public-site` reads the session only to select the rendered state; no published
  content becomes gated
- a response whose content depends on a session is not served from the shared edge
  cache
- `1stcontact.io` serves a published site from the `1stcontact` tenant carrying this
  module, and `APEX_BODY` is gone
---

## What was built

The design above is unchanged. This section records the decisions the
implementation had to make, and the behaviour each one produced.

### The declaration is `site.config.capabilities.accounts`

A site says what it **has** in a small closed record on its own definition —
`capabilities`, one optional boolean per capability we ship. Closed rather than
an open bag, so a typo is a validation error and not a declaration nothing
reads; a second capability is one more optional boolean and no new plumbing.

The renderer hands that record to **every** module as a prop, exactly as it
already hands down the site's resolved locale. The gate is then the module's
own: `account-chrome` renders the empty string unless `accounts` is declared.
It belongs there rather than in the renderer because only the module knows what
it should do when its capability is absent, and because the renderer must not
grow a branch naming one.

### Every state is in the published snapshot; the Worker names the current one

A published site is an immutable snapshot of rendered bytes, so there is no
per-request render for the Worker to select a state in. The module therefore
renders **all three** states — signed out, signed in, and the builder link —
into the snapshot, and the Worker rewrites **one attribute** on the module root
to say which is current. The signed-out transform is the identity, so an
anonymous request is served the bytes exactly as published.

The rules that hide the states which are not current are the module's own CSS.
That is an invariant rule and not taste: which state is current is behavioural,
and a static L1 subtree has no axis to express it — the same reasoning the
carousel's current-dot rule already rests on.

The marker's producer and consumer are one file, exported from the framework's
worker entry, so the Worker rewrites the attribute the component emits rather
than one somebody restated.

### The portal and builder controls are links, so L1 gained an anchor control

A control was previously always a form affordance. Both of these are
navigations, and painting them as buttons would give a visitor a control they
cannot open in a new tab, cannot copy the target of, and which announces itself
to assistive technology as the wrong thing. `a` joins the control tags; the
`href` is the module's attribute like any other and passes the same URL
allowlist every rendered URL passes.

### The no-JavaScript baseline is a working sign-in

The dialog is a real `<form method="post">` against the issue endpoint and the
server renders it **open**; the client folds it away behind the Sign In control
and upgrades the submit to a `fetch`. Script therefore only ever subtracts, and
every degraded state is a page on which the address can still be sent.

The *modal* geometry — fixed, centred, over a scrim — is module CSS applied only
once script has taken over. Covering the page is behavioural (a modal that did
not would not be one) and no L1 axis can express it. What the panel looks like is
entirely its slot's.

### "Check your email" never reads the response

The confirmation appears when the request **completes**, at any HTTP status, and
the client never inspects what came back. A known address and an unknown one are
therefore indistinguishable by construction rather than by the endpoint
remembering to be careful. Only a request that never reached the server — a
thrown `fetch` — reports differently, because that is a fact about the network
and not about the address.

### What the Worker reads, and what it refuses to cache

`public-site` gains a session reader over the passwordless component's
`sessions` table plus this deployment's `memberships`. Two narrow reads, no
write, and neither names a site, a tenant or a business: *operates a business*
is a fact about the person.

- A **failed read is "signed out"**, and that is the safe direction. A
  deployment that has not yet stood the sign-in routes up has no `sessions`
  table, and "there are no sessions to be signed in with" is exactly right. The
  answer can never grant anything — the only thing it can do is swap one visible
  control for another on a page that was public either way.
- The **trigger is the marker in the bytes**, not a database column. A page with
  no account chrome cannot depend on a session, so it keeps its etag, its shared
  cacheability, and the exact bytes that were published.
- A session-dependent response carries `cache-control: private, no-store` and
  `vary: cookie`, and is never stored in the shared edge cache. It also carries
  **no etag**, because the entity served is not the entity R2 stored.
- A request that **carries** a session never reads the shared cache either. What
  is stored there is the anonymous rendering, which is exactly wrong for somebody
  signed in.
- A `HEAD` for an HTML path takes the `GET` path, because the length R2 stored is
  not the length that would be served. Every other type keeps its metadata-only
  read.

### The cookie domain is checked, not assumed

`readSessionId` takes the request's host and refuses a cookie that was not issued
for it, by the rule a browser uses (exact match, or a subdomain — the dot is what
makes suffix matching safe). A browser would not have sent one anyway; the check
is there because "the browser would not do that" is not a property this
deployment can hold, and because a session read that does not name the domain it
was issued for is this ticket's own falsifier.

### The apex is addressed like any other site

`APEX_BODY` is gone. `/` is the apex site's index and **every path outside
`/site/`** resolves against that site's live revision — a real site needs its own
paths, not just its root, or its document-relative stylesheet 404s. Which site
the apex is comes from `APEX_SITE_KEY` configuration and never from the URL, so
no request can ask for a different one; a deployment that names none answers the
same 404 an unpublished site does.

`storage/sites/1stcontact/` is the authored site: the platform's own front page
as a 1c site definition in the repo, declaring accounts and mounting the chrome
in a header slot. Its copy is deliberately minimal — the site is in stealth. The
chrome's presentation is the shipped preset **materialised** into the page, and a
UAT compares the two so the committed page cannot drift from the preset it was
instantiated from.

### One operator step remains

The site definition is committed but not published. Publishing it
(`bin/publish --production 1stcontact`, then a publish in the cloud) mints the
site's key, and `APEX_SITE_KEY` in `apps/public-site/wrangler.toml` must then be
set to it. Until that happens the apex answers 404 and `bin/smoke`'s
`apex_resolves` check fails — correctly, because the front page genuinely is not
published yet. The key is opaque and minted at provisioning, so it cannot be
committed ahead of the site existing.

### Two earlier expectations superseded

- `REQ-140` asserted that `storage/sites/1stcontact/` was gone. The slug named a
  dead **example** when that was written and names the platform's real front page
  now. What that criterion protects — a deleted example stays deleted — is
  unchanged for `harbor-cafe`.
- `AC-923` listed `/notsite/<slug>/whitepapers` among URLs the grammar rejects.
  It is the apex site's path now, and gets the same clean-URL mapping every other
  page gets. Its grammar is pinned in the REQ-113 suite instead.

### Deliberately not built here

The sign-in **issue endpoint** and everything that mints a session. This ticket
assumes only that a session exists and that its cookie domain is configurable;
consuming `@lagrangefoundry/auth-passwordless` and standing the sign-in routes up
is its own ticket, to be written against that component's actual surface. The
module posts to a configured URL and reads nothing back.

## Test plan

`tests/test_UAT_FC_REQ-200_account_chrome.test.ts` — the module: catalogued
beside `contact-form`; a slot preset asked for by behavior id; absent on a site
that declares no accounts and present on one that does; the declaration is a
schema field and nothing in the module counts members; the signed-out state is a
working `<form method=post>` with an accurate `aria-expanded`; the signed-in state
links to the portal; the builder link follows the person and not the site; the
state rules are the module's own invariant CSS; the sent message is identical
across a 202, a 404 and a 500 and only an unreachable server differs; two sites
place the chrome in different slots with different paint and both render; and the
ticket's falsifier — no branch on which site or business — as a scan of the
module's own code.

`tests/test_UAT_FC_REQ-200_apex_and_session.test.ts` — the Worker: `APEX_BODY`
gone and `/` serving a published site; apex pages and assets resolving at the
root, and 404 when no apex is configured; the authored apex site validating,
declaring accounts, binding the module to a slot its L1 tree has, and carrying the
preset unmodified; signed-out by default, signed-in with a session, builder
marker only for an operator; a page with no chrome served byte-identically with
or without a session and still shared-cacheable; a session-dependent response
carrying `private, no-store`, no etag, and never stored; a request with a session
never reading the shared cache; and the cookie-domain rule both as a unit and end
to end, where the same cookie on a customer's own host renders signed out.

Regression scope run: the whole node project. Six failures remain and are
pre-existing on `xgd-working` — the same six fail on a clean checkout of the same
files (`AC-960`, `AC-1318`, `AC-1319`, two REQ-123 knowledge cases, and REQ-162's
migration check).
