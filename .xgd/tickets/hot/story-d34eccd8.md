---
uid: story-d34eccd8
id: STORY-95
type: story
title: 'Serve a deployed snapshot: shareable previews and live published sites reach
  a visitor'
created_by: xgd
created_at: '2026-08-06T18:47:52.197635+00:00'
updated_at: '2026-08-07T22:24:17.512962+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-e0143ffa
  capability_uid: capability-a12e557f
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-0385746c
  uat_coverage: pass
---

## Story

**As a** visitor holding a site URL — a client sent a preview link, or the public
arriving at a published site — **I want** that URL to render the whole page with
its styles, images and fonts intact, **so that** what the operator shipped is
what I actually see, while snapshots nobody was given a link to stay out of my
reach and out of search results.

## Description

This is the visitor half of delivery. The operator half — shipping a rendered
snapshot to shared storage and getting a URL back — is a separate story in the
same capability. Before this capability the public entry point returned a fixed
greeting; nothing described how a deployed site reaches anyone. The two halves
are independently useful and independently testable: a shipped artifact is
durable with no server, and the serving rules are provable with nothing shipped.

In scope:

- **Two addressing forms, one server.** A *preview* URL names a site and a
  specific content-addressed snapshot; a *published* URL names only a site and
  serves whatever revision that site currently calls live. One multi-tenant
  server answers both for every site.
- **One servable store tree, fixed in the server.** The operator ships from two
  separate store trees — real sites and throwaway scratch — and exactly one of
  them is public. Which one is a property of the server, never of a request: no
  part of a URL contributes to it, so there is no crafted address that reaches
  the non-servable tree. A site that exists only there is not-found on every URL
  the addressing scheme admits, including one whose path spells out its stored
  location. This is the outermost of the two reachability gates, and it holds by
  construction rather than by a check that could be forgotten at a new call site.
- **The deploy index is the authority on what is servable** within that tree,
  not the storage key space. A snapshot that exists in storage but which the
  site's index does not reference — an interrupted upload, or one an operator has
  unlinked but not yet swept — is unreachable rather than quietly live. No
  component of the requested URL names stored bytes unless the index vouched for
  it first.
- **The address grammar rejects before it reads.** A URL whose components are
  empty, dot-shaped, separator-bearing, or otherwise outside the shapes the
  addressing scheme admits is answered not-found with no stored bytes looked up
  at all, so a traversal-shaped address cannot steer a request at another site,
  another snapshot, or the store's own bookkeeping.
- **The trailing slash is correctness, not tidiness.** Rendered pages reference
  their assets document-relatively so a snapshot can be served from any path
  prefix. A directory-shaped URL served without its trailing slash would resolve
  every one of those references one level too high, giving an unstyled page; the
  bare form therefore permanently redirects to the slashed form.
- **Preview privacy by URL, and only by URL.** There is no authentication:
  previews are private because their addresses are unguessable, a deliberate v1
  decision. Every preview-channel response asks crawlers not to index it.
- **Honest, opaque failure.** A URL that names nothing answers with a plain
  not-found — never a listing of the storage behind it, and never a difference
  a stranger could use to tell an unknown site from one that has not published.
  A site living only in the non-servable tree is answered the same way as one
  that does not exist at all.
- **A read-only surface.** Fetching and header-only fetching are served;
  anything that would write is refused and says what is allowed.
- **Responses are typed from what answered them.** A served object's content
  type is derived from its own extension — markup, stylesheets, scripts, JSON,
  text, XML, images and web fonts, with text formats carrying a charset — and an
  extension the server does not recognise, or none at all, is served as generic
  binary rather than guessed at or taken from what the uploader recorded.
- **Freshness policy that matches addressing, and a cache that follows it.**
  Snapshot-addressed bytes can never change, so they are cacheable indefinitely;
  published addresses are not revision-scoped, so they carry a short lifetime
  instead. A repeat request for an address that already answered is served
  without reading the store again, while a not-found is never retained — an
  address that answered not-found begins serving the moment a deploy makes it
  real, with no wait and no manual invalidation.
- **A reserved first segment.** The preview channel occupies one path segment
  inside a site, so a published snapshot may not contain a top-level entry of
  that name; shipping one is refused at deploy time rather than silently
  producing an unreachable page.

Out of scope: authentication and access control; the apex marketing site (the
apex is deliberately held back to a holding response); custom domains and
per-site subdomain routing; and the clean-URL agreement between the local
preview server and this one, which is its own story.

Also out of scope: any route, flag or address that would make the non-servable
store tree reachable. Its unreachability is the point, not a limitation to be
worked around — exercising the serving path against throwaway content means
using a throwaway slug in the servable tree instead.

## Technical Context

- Consumes the storage layout written by the deploy story (STORY-94) in the same
  capability, and depends on the relocatable-output rule documented against
  STORY-83 — without document-relative asset emission nothing under a path
  prefix would resolve at all.
- **Root confinement was a correction, not an original property** (BUG-31). The
  store-tree separation was honoured everywhere on the operator's machine and
  then dropped at the shared-storage boundary, where every key was built under
  the servable tree regardless of origin. The serving side inherited the same
  omission: it addressed that one tree because it was the only one that existed,
  not because anything said it must. Naming the servable tree as a single fixed
  value in the server turns an accident into a guarantee — and is why the
  criterion is stated as "never derived from a request" rather than "the
  non-servable tree is rejected", which would be a check with call sites to miss.
- "Where the bytes live" sits behind a seam distinct from "which bytes does this
  URL name", so the planned move of the authoritative store to the platform
  database replaces one implementation and leaves the request path untouched.
  The seam is an internal arrangement, not an acceptance criterion: the ACs
  below are all observable at the HTTP boundary. The servable-tree constant lives
  behind that same seam, so the guarantee survives the store's replacement only
  if the replacement restates it — which is why it is an AC and not a note.
- **Known wart, accepted deliberately by the operator:** published addresses are
  not revision-scoped, so for the length of the short published cache lifetime a
  client can pair newly deployed markup with a previously cached stylesheet. The
  ACs pin the short lifetime, not the absence of the window; closing it (revision
  -scoped published asset paths, or a purge on deploy) is additive.
- **Carried-forward uncertainty from the source intent, not invented here:** the
  end-to-end smoke check against a live bucket and the apex custom-domain
  provisioning were never run in session — the evidence drives the real request
  entry point against a faked storage binding, so the serving rules are proven
  but the wiring to a real bucket and a real DNS record is not. The same applies
  to root confinement: it is proven against the real request entry point with the
  binding faked, not against the live bucket.
- **Standing invariant, not currently reachable:** the reserved-segment deploy
  gate cannot be triggered by any site definition today, because rendered pages
  are emitted flat. It is verified at its own entry point and starts earning its
  keep the day rendered output gains nesting.
- [[DOC-12]]'s preview-privacy wording was amended to "link-private, not
  authenticated" (§2 principle 4, and the audience row in §7) to match the
  no-authentication decision (REQ-111). Documentation and behaviour now agree;
  the divergence this note previously recorded is closed.

## Dependencies

- Plan item 3 (STORY-94, `1c deploy`) — hard: this story serves the storage
  layout that story writes, including the store tree each key is scoped to.
- Plan item 1 — scheduling only; both touch the rendered page's journey to a
  reader, but neither constrains the other.

## Story Points

3