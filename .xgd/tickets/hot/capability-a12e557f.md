---
uid: capability-a12e557f
id: CAP-82
type: capability
title: 'Site Delivery: Deploy & Public Serving'
created_by: xgd
created_at: '2026-08-06T18:38:00.342753+00:00'
updated_at: '2026-09-10T16:14:22.727258+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  name: site-delivery-deploy-and-public-serving
  uat_coverage: pass
---

# Capability: Site Delivery: Deploy & Public Serving

Getting a rendered site **out of the store it was authored in and in front of a
visitor**.

Every other capability in the matrix stops at rendered output: authoring
produces a site definition, the framework substrate renders it, capture and the
reproduction gate judge it. None of them can show the result to anyone who is
not the author. This capability owns the whole path from "the site has been
rendered" to "a person with a link sees the page".

## Scope

- **Shipping an artifact** — taking a rendered snapshot and its definition,
  naming it by the revision number it was minted as, and placing it in durable
  shared storage so it can be addressed by a URL. The content digest a revision
  carries is an audit value, not an address.
- **The draft/published split at delivery** — the site's mutable draft, which the
  builder renders on request, versus the immutable numbered revisions it
  publishes. The draft is a thing the builder shows its author; only a published
  revision is a thing a visitor can be sent to.
- **Serving** — turning a published revision back into pages and assets for a
  visitor: which URL names which bytes, what a visitor is and is not allowed to
  reach, caching, and how a miss is answered.
- **URL resolution agreement** — the URL an author writes resolves the same way
  in the local preview server and in production.
- **Operator legibility of a delivery** — what a publish reports, what it
  refuses, and what it guarantees it will never destroy: a revision is never
  removed, renumbered or reused.

## What was retired, and why it was recorded rather than ported

The scope above was first written to REQ-110's design, in which delivery was an
operator-side content-addressed deploy command. REQ-149 (2026-08-17) moved
publishing into the platform and retired that design. The removals are recorded
here rather than silently deleted, so a later reader can tell a deliberate
retirement from an omission:

- **Snapshot identity as a digest of contents is gone** (REQ-149 D6, which
  deleted `1c deploy` along with the per-site index that vouched for its
  artifacts). A revision is named by its number, and every stored key and public
  URL is built from that.
- **The shareable, immutable draft preview channel is dropped, not ported**
  (REQ-149 D7). A digest-addressed draft link that cost the site nothing — no
  revision number, no publish history entry — was a second addressing form on
  the deployed site, backed by the index that was deleted. Sharing a draft
  returns later as a builder control, not as a delivery channel. The builder's
  own draft preview is unaffected, but it is behind access control and renders
  the mutable draft on request, so it is not what that bullet described.
- **The deploy command's dry run and prune have no home** once the command is
  gone. What survives of "what it will and will not delete" is the forward-only
  guarantee above; bytes orphaned by an interrupted publish are unreachable,
  because the recorded revision is what vouches for them, and cost only storage.

Out of scope: the canonical site store (delivery moves serving, not storing — a
site's definitions stay canonical in whichever store holds it, the operator's
filesystem or the cloud store, and delivery never becomes that store),
authoring, rendering, custom domains, per-visitor authentication, and subdomain
routing.
