---
uid: story-d34eccd8
id: STORY-95
type: story
title: 'Serve a published site: a URL names a site, the revision record says which
  bytes'
created_by: xgd
created_at: '2026-08-06T18:47:52.197635+00:00'
updated_at: '2026-11-07T07:16:31.004268+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-e0143ffa
  capability_uid: capability-a12e557f
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-7988e925
  uat_coverage: pass
---

## Story

**As a** visitor arriving at a published site's URL — including the platform's own
front page at the root of its host — **I want** that URL to render the whole page
with its styles, images and fonts intact, and, where the site has accounts, to show
me the sign-in or account control that matches whether I am signed in, **so that**
what the operator published is what I actually see, while anything the operator has
not published stays out of my reach and out of search results.

## Description

This is the visitor half of delivery. The operator half — validating a draft,
minting a revision, rendering it and recording it — is a separate story in the
same capability. Before this capability the public entry point returned a fixed
greeting; nothing described how a published site reaches anyone. The two halves
are independently useful and independently testable: a published revision is
durable with no server, and the serving rules are provable with nothing
published.

In scope:

- **One addressing form, one server.** A published URL names a site only, never
  a revision, and serves whatever revision that site currently calls live. One
  multi-tenant server answers it for every site. There is no second addressing
  form: the snapshot-addressed shareable draft link was produced only by the
  operator-side deploy command and vouched for only by the per-site index object
  that sat beside the bytes, and both were removed when publishing moved into
  the platform. The segment the preview channel reserved inside a site is
  therefore an ordinary segment again — a published site may hold a top-level
  page of that name, because nothing shadows it. Sharing a draft returns later
  as a builder control, on the channel the builder already renders on request.
- **The apex is a published site, addressed like any other (REQ-200).** The root
  of the host is no longer a holding response. It serves the site this
  deployment names as its apex — configuration, never the URL, so no request can
  ask the root for a different site. `/` is that site's index and every path
  outside `/site/` resolves against its live revision under the same grammar,
  clean-URL mapping, typing, not-found and freshness rules as every other site; a
  real site needs its own paths, not just its root, or its document-relative
  stylesheet would not resolve. `/site/` stays a reserved first segment. A
  deployment that names no apex site, or whose apex site has not published,
  answers the same not-found an unpublished site does. The platform's own front
  page is authored in the repository as an ordinary site definition — minimal
  copy, accounts declared, the account chrome mounted in a header slot from the
  shipped preset — which is the dogfooding claim made concrete.
- **The revision record is the authority on what is servable**, not the storage
  key space. A revision whose bytes are in storage but which the record does not
  vouch for — an interrupted publish, or one nobody swept — is unreachable
  rather than quietly live. No component of the requested URL names stored bytes
  unless a record vouched for it first: the only untrusted value that reaches a
  key is the site key from the URL (or the configured apex key), which the
  grammar has already constrained to a plain name, and everything else in the key
  is composed from server-side constants and the record's own value.
- **Live is derived, never stored.** Which revision a site currently serves is
  the highest revision id in its log, computed on read. It is not recorded
  anywhere a second time, so there is nothing that could disagree with the log
  it reads.
- **A published address is the site's key (REQ-190).** A published URL is
  `/site/<siteId>/`, where the segment is the site's own opaque, unguessable
  key: the same value the database joins on, not the slug the operator calls
  the site. It names exactly one site by construction, so nothing is claimed and
  nothing needs to be globally unique. Two businesses may each publish a site
  whose slug is `home`, and each is reachable only at its own key. A key that
  names no site, or a site that has never published, resolves to nothing. The
  only way to learn a site's key is through its own business's store handle, so
  a key for another business's site is not obtainable through any operator
  surface.
- **The address grammar rejects before it reads.** A URL whose components are
  empty, dot-shaped, separator-bearing, or otherwise outside the shapes the
  addressing scheme admits is answered not-found with no stored bytes looked up
  at all, so a traversal-shaped address cannot steer a request at another site,
  at another revision, or at the store's own bookkeeping.
- **The trailing slash is correctness, not tidiness.** Rendered pages reference
  their assets document-relatively so a revision can be served from any path
  prefix. A directory-shaped URL served without its trailing slash would resolve
  every one of those references one level too high, giving an unstyled page; the
  bare form therefore permanently redirects to the slashed form.
- **Published bytes have exactly one serving path.** The builder's own published
  view does not serve them: it resolves the slug to the site's key through the
  business's own store and redirects to that key's published address (a slug the
  business does not hold is not-found rather than a redirect), so the
  resolve-and-serve rules live in one place. The cost is accepted — a site that
  has never published shows this server's not-found rather than a builder-shaped
  message.
- **Session-aware for one purpose only (REQ-200).** A published page that carries
  the account chrome holds every one of the chrome's states in its published
  bytes; the server rewrites one attribute on the chrome root to name the
  visitor's current state — signed out, signed in, or signed in as someone who
  operates a business — and signed out is the identity, so an anonymous visitor
  gets the bytes exactly as published. The session is read for that choice and
  nothing else: no content is gated and nothing else varies by viewer. The read
  is two narrow lookups (is the session live; does that person hold any active
  membership) with no write, and names no site, tenant or business. A session
  cookie counts only on a host inside the domain it was issued for, by the
  browser's rule (exact host or a dot-separated subdomain), so a session never
  crosses onto a customer's own domain. Anything that goes wrong — no cookie, a
  foreign host, an unknown or expired session, a failed read — is signed out,
  which can never grant anything.
- **A private cache policy where content depends on the visitor (REQ-200).** The
  trigger is the chrome's marker in the served bytes, not a database flag. A
  chrome-bearing page is served `private, no-store`, `vary: cookie`, with no
  entity tag (the entity served is not the entity stored), and is never stored in
  the shared edge cache; a request carrying a session never reads the shared
  cache. A header-only request for an HTML path reports the length that would be
  served. A page without the chrome keeps its exact published bytes, its entity
  tag and its shared cacheability.
- **Honest, opaque failure.** A URL that names nothing answers with a plain
  not-found — never a listing of the storage behind it, and never a difference a
  stranger could use to tell an unknown site from one that has not published.
- **A read-only surface.** Fetching and header-only fetching are served;
  anything that would write is refused and says what is allowed.
- **Responses are typed from what answered them.** A served object's content
  type is derived from the extension of the key that answered — markup,
  stylesheets, scripts, JSON, text, XML, images and web fonts, with text formats
  carrying a charset — and an extension the server does not recognise, or none at
  all, is served as generic binary rather than guessed at or taken from what the
  writer recorded.
- **Freshness policy that matches addressing, and a cache that follows it.**
  Published addresses are not revision-scoped, so they carry a short lifetime
  and are never declared immutable. A repeat anonymous request for an address
  that already answered is served without reading the store again, while a
  not-found is never retained — an address that answered not-found begins serving
  the moment a publish makes it real, with no wait and no manual invalidation.
  Published sites are meant to be indexed, so no response asks a crawler to stay
  away.

Out of scope: authentication beyond reading an existing session to pick the
chrome's state — issuing sessions, the sign-in endpoint, and access control are
not here; the account-chrome module itself (its states, markup and preset belong
to the module-catalog story); custom domains and per-site subdomain routing; the
clean-URL agreement between the local preview server and this one, which is its
own story; and minting a revision and writing the bytes, which are the operator
half's.

## Technical Context

- Consumes the published storage layout and the revision log the operator half
  writes, and depends on the relocatable-output rule documented against
  STORY-83 — without document-relative asset emission nothing under a path
  prefix would resolve at all.
- **The seam did what it promised.** "Where the bytes live" has always sat
  behind a seam distinct from "which bytes does this URL name", and the move of
  the authority from a per-site index object to rows in the platform database
  replaced one implementation behind it and left the request path untouched. The
  seam is an internal arrangement, not an acceptance criterion: the criteria
  below are all observable at the HTTP boundary.
- **Root confinement is now a consequence rather than a separate gate.** It was
  originally a correction (BUG-31): the operator's machine kept real sites and
  throwaway scratch in two trees, the shared-storage writer dropped the
  distinction, and the server addressed one tree by accident rather than by
  rule. Both halves of that are gone — the only writer is the platform itself,
  and it only ever writes its own account's real sites, so the scratch tree has
  no writer left to guard against. What survives is stronger and is stated in
  the record-authority criterion instead: every key is composed from a
  server-side constant plus a value the record supplied, so no request can name
  bytes outside a live revision's rendered output — the frozen definition
  shipped beside that output included.
- **The apex holding response is superseded (REQ-200, BUNDLE-38).** The earlier
  criterion that the root returned a fixed greeting and never served a site
  (AC-913) is retired as superseded: REQ-200 states that the greeting is replaced
  by a real published site. The apex-site, session-state and session cache-policy
  criteria replace it; the freshness and repeat-request criteria now carve out
  chrome-bearing pages explicitly.
- **One operator step remains for production.** The front-page definition is
  committed but its key is minted only when it is published, so the apex key
  configuration cannot be committed ahead of it. Until it is set the apex answers
  not-found — correct, because the front page genuinely is not published.
- **Known wart, accepted deliberately by the operator:** published addresses are
  not revision-scoped, so for the length of the short published cache lifetime a
  client can pair newly published markup with a previously cached stylesheet. The
  criteria pin the short lifetime, not the absence of the window; closing it
  (revision-scoped published asset paths, or a purge on publish) is additive.
- **Carried-forward uncertainty:** the end-to-end check against a live bucket and
  the apex custom-domain provisioning have never been run in session. The
  evidence drives the real request entry point — inside the Workers runtime
  against real bindings for the published-revision case, and against a faked
  binding elsewhere — so the serving rules are proven but the wiring to a real
  bucket and a real DNS record is not.

## Reconciliation Decisions

Recorded 2026-08-31 during reconciliation of BUNDLE-20 (REQ-149). Each is a
behaviour the code implements and the source intent did not state either way;
each is formalised as a criterion now rather than left as an open question.

1. **A live revision whose bytes are absent answers not-found, not an error.**
   The record can vouch for a revision whose rendered output never finished
   uploading. Serving that as a server error would report a storage
   inconsistency to a visitor who cannot act on it and would leak that the site
   exists; not-found is the same answer the visitor gets for every other
   unreachable address. Pinned in the live-revision criterion.
2. **Nothing outside a revision's rendered output is addressable.** Each
   revision ships its frozen definition alongside its rendered output, because
   the database holds only the mutable draft and that copy is what makes a
   checkout possible. The intent says it ships; it does not say it is
   unreachable. It is: the key a request reaches is composed to end at the
   rendered half, so the definition is not addressable at any URL the grammar
   admits. Pinned in the record-authority criterion.
3. **Published responses carry no crawler directive at all.** The
   ask-not-to-index directive belonged to the draft-preview channel that was
   removed. The intent removes the channel and is silent on the header. A
   published site is meant to be indexed, and a stray directive surviving its
   channel would silently deindex every customer's site, so its absence is
   asserted rather than assumed. Pinned in the freshness criterion.
4. **The builder's published view resolves through the business's store**
   (decided at reconciliation, BUNDLE-37, 2026-11-04). REQ-190's free-coding
   notes state the redirect now resolves the slug to the site key first, so an
   unheld slug is a 404 rather than a redirect that could only 404 one hop
   later. Formalized in the address criterion, alongside the key-only address.
   The existing redirect criterion (AC-1424) is unchanged in what it asserts:
   one serving path.

Recorded 2026-11-06 during reconciliation of BUNDLE-38 (REQ-200):

5. **A chrome-bearing page is private even when it names signed out.** REQ-200
   says a response "whose content depends on a session" is not served from the
   shared cache; the code applies the private policy to every chrome-bearing
   page, anonymous or not, because whether the bytes depend on a session is a
   property of the page, not of this request. Formalised that way in the session
   cache-policy criterion — it is the conservative reading and keeps a signed-in
   visitor's rendering out of shared storage by construction.
6. **A deployment with no configured cookie domain reads no session at all.**
   The intent requires a cookie be refused on a host it was not issued for; it is
   silent on the unconfigured case. The code treats an absent domain as a
   host-only cookie this server did not issue, so it reads as signed out. Pinned
   in the session-state criterion as the safe direction.
7. **An expired session is signed out**, and **a header-only request for HTML
   reports the served length** — both stated in the free-coding notes or implied
   by the rewrite, and pinned in the session-state and cache-policy criteria
   respectively.

## Dependencies

- The operator half of the same capability — hard: this story serves the storage
  layout and reads the revision log that story writes. Since REQ-190 there is no
  slug claim between them: the address is the site key the store mints.
- The account-chrome module (module-catalog story, REQ-200) — hard for the
  session criteria: the server rewrites the state attribute that module emits.
- REQ-134 (lagrange-framework) sessions — soft: absent session tables read as
  signed out.

## Story Points

3