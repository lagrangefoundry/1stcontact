---
uid: story-d34eccd8
id: STORY-95
type: story
title: 'Serve a deployed snapshot: shareable previews and live published sites reach
  a visitor'
created_by: xgd
created_at: '2026-08-06T18:47:52.197635+00:00'
updated_at: '2026-08-06T18:47:52.197635+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-e0143ffa
  capability_uid: capability-a12e557f
  story_kind: feature
  story_points: 3
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
- **The deploy index is the authority on what is servable**, not the storage
  key space. A snapshot that exists in storage but which the site's index does
  not reference — an interrupted upload, or one an operator has unlinked but not
  yet swept — is unreachable rather than quietly live. No component of the
  requested URL names stored bytes unless the index vouched for it first.
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
- **A read-only surface.** Fetching and header-only fetching are served;
  anything that would write is refused and says what is allowed.
- **Freshness policy that matches addressing.** Snapshot-addressed bytes can
  never change, so they are cacheable indefinitely; published addresses are not
  revision-scoped, so they carry a short lifetime instead.
- **A reserved first segment.** The preview channel occupies one path segment
  inside a site, so a published snapshot may not contain a top-level entry of
  that name; shipping one is refused at deploy time rather than silently
  producing an unreachable page.

Out of scope: authentication and access control; the apex marketing site (the
apex is deliberately held back to a holding response); custom domains and
per-site subdomain routing; and the clean-URL agreement between the local
preview server and this one, which is its own story.

## Technical Context

- Consumes the storage layout written by the deploy story (STORY-94) in the same
  capability, and depends on the relocatable-output rule documented against
  STORY-83 — without document-relative asset emission nothing under a path
  prefix would resolve at all.
- "Where the bytes live" sits behind a seam distinct from "which bytes does this
  URL name", so the planned move of the authoritative store to the platform
  database replaces one implementation and leaves the request path untouched.
  The seam is an internal arrangement, not an acceptance criterion: the ACs
  below are all observable at the HTTP boundary.
- **Known wart, accepted deliberately by the operator:** published addresses are
  not revision-scoped, so for the length of the short published cache lifetime a
  client can pair newly deployed markup with a previously cached stylesheet. The
  ACs pin the short lifetime, not the absence of the window; closing it (revision
  -scoped published asset paths, or a purge on deploy) is additive.
- **Carried-forward uncertainty from the source intent, not invented here:** the
  end-to-end smoke check against a live bucket and the apex custom-domain
  provisioning were never run in session — the evidence drives the real request
  entry point against a faked storage binding, so the serving rules are proven
  but the wiring to a real bucket and a real DNS record is not.
- **Standing invariant, not currently reachable:** the reserved-segment deploy
  gate cannot be triggered by any site definition today, because rendered pages
  are emitted flat. It is verified at its own entry point and starts earning its
  keep the day rendered output gains nesting.
- The public preview-privacy wording in the product documentation ([[DOC-12]])
  still describes previews as "author only (private)", which the no-authentication
  decision supersedes; the divergence is documentation, not behaviour.

## Dependencies

- Plan item 3 (STORY-94, `1c deploy`) — hard: this story serves the storage
  layout that story writes.
- Plan item 1 — scheduling only; both touch the rendered page's journey to a
  reader, but neither constrains the other.

## Story Points

3
