---
uid: story-d34eccd8
id: STORY-95
type: story
title: 'Serve a published site: a URL names a site, the revision record says which
  bytes'
created_by: xgd
created_at: '2026-08-06T18:47:52.197635+00:00'
updated_at: '2026-08-31T11:55:11.793237+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-e0143ffa
  capability_uid: capability-a12e557f
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-0385746c
  - bundle-b3b7c399
  uat_coverage: pass
---

## Story

**As a** visitor arriving at a published site's URL — **I want** that URL to
render the whole page with its styles, images and fonts intact, **so that** what
the operator published is what I actually see, while anything the operator has
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
- **The revision record is the authority on what is servable**, not the storage
  key space. A revision whose bytes are in storage but which the record does not
  vouch for — an interrupted publish, or one nobody swept — is unreachable
  rather than quietly live. No component of the requested URL names stored bytes
  unless a record vouched for it first: the only untrusted value that reaches a
  key is the site name, which the grammar has already constrained to a plain
  name, and everything else in the key is composed from server-side constants and
  the record's own value.
- **Live is derived, never stored.** Which revision a site currently serves is
  the highest revision id in its log, computed on read. It is not recorded
  anywhere a second time, so there is nothing that could disagree with the log
  it reads.
- **A published address is global, and claimed.** The public URL carries no
  account, so which account's revisions a site name resolves to is settled by
  the claim the operator half records on first publish. A name no account has
  claimed resolves to nothing.
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
  view does not serve them: it redirects here, so the resolve-and-serve rules
  live in one place. The cost is accepted — a site that has never published
  shows this server's not-found rather than a builder-shaped message.
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
  and are never declared immutable. A repeat request for an address that already
  answered is served without reading the store again, while a not-found is never
  retained — an address that answered not-found begins serving the moment a
  publish makes it real, with no wait and no manual invalidation. Published
  sites are meant to be indexed, so no response asks a crawler to stay away.

Out of scope: authentication and access control; the apex marketing site (the
apex is deliberately held back to a holding response); custom domains and
per-site subdomain routing; the clean-URL agreement between the local preview
server and this one, which is its own story; and minting a revision, claiming a
slug and writing the bytes, which are the operator half's.

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

## Dependencies

- The operator half of the same capability — hard: this story serves the storage
  layout and reads the revision log that story writes, and the slug claim it
  records is what makes a global published address safe.

## Story Points

3