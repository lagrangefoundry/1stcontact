---
uid: story-5349d01f
id: STORY-94
type: story
title: 'Ship a site off the laptop: a content-addressed snapshot deploy that returns
  a shareable URL'
created_by: xgd
created_at: '2026-08-06T18:38:28.628910+00:00'
updated_at: '2026-08-09T13:50:16.788867+00:00'
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

**As a** site operator, **I want** to ship a rendered site to shared storage in one
command and get back a URL, **so that** someone other than me — a client, a
reviewer, a visitor — can see it, and so that shipping the same site twice costs
nothing while shipping a changed site never destroys what came before.

## Description

Before this capability a site existed only on the operator's machine: rendering
wrote bytes to a local directory and publishing froze a draft into a revision,
but nothing put either where anyone else could look. This story is the operator
half of delivery — the act of shipping. The visitor half (what a URL serves) is
a separate story in the same capability.

In scope:

- **One command, two channels.** A *draft* deploy mints an immutable, shareable
  **preview** of the current working draft. A *published* deploy ships the site's
  current latest published revision and moves the live pointer.
- **Rendering is not optional.** Every deploy renders first. Previously-rendered
  output on disk is never trusted as an input, so stale bytes cannot be shipped.
- **The artifact is complete.** What ships is both the rendered output *and* the
  site definition it was rendered from, so the shipped snapshot is a whole
  revision rather than only its render — which makes a later migration of the
  store an import rather than a re-derivation from someone's laptop.
- **Shipping is scoped to the store tree the site came from.** The operator's
  machine keeps real sites and throwaway scratch in two separate store trees, and
  that separation survives the crossing: the tree a definition was loaded from is
  part of the address its snapshot ships to. Every key a deploy writes carries it,
  each tree keeps its own deploy index, and a prune enumerates only the tree being
  pruned. Two sites that share a slug across the trees therefore never touch each
  other's bytes, index or live pointer.
- **A snapshot that nothing can serve says so.** Only one store tree is publicly
  servable. A deploy from the other ships and indexes exactly as normal but
  returns no shareable URL, and its report terminates in the snapshot's storage
  prefix with an explicit note that it is not publicly reachable — rather than a
  URL that could never resolve.
- **Content addressing.** A snapshot's identity is a digest of its contents.
  Redeploying identical bytes is a no-op that returns the same URL; changed bytes
  land *beside* the previous snapshot, never on top of it.
- **Two deploys do not silently overwrite each other.** A deploy whose stored
  deploy index changed underneath it fails by name and writes no index of its
  own, leaving the index exactly as the other deploy left it — a concurrent
  deploy loses loudly rather than clobbering the winner's record.
- **Previews are not revisions.** A draft deploy never mints a revision number
  and never enters publish history, so previews can be shared freely without
  polluting the publish record.
- **Publish mints, deploy ships.** The published channel carries no such
  shortcut: a published deploy of a site whose publish history is empty is
  refused by name and writes nothing, directing the operator at the publish
  command rather than shipping an empty channel or minting a revision itself.
- **Rehearsal and cleanup.** A dry run prints the complete plan and writes
  nothing. A prune deletes only stored snapshot objects that the site's deploy
  index does not reference — the orphans an interrupted deploy leaves behind.
- **A legible report.** Every stage names itself on its own line and the report
  terminates in the shareable URL, or — where there is none — in the storage
  prefix and the reason.

Out of scope (explicit non-goals from the intent): moving the canonical site
store off the operator's machine, custom domains, and per-site subdomain
routing. Serving the deployed bytes to a visitor, the confinement of what a URL
may address to the one servable store tree, and the refusal of a snapshot whose
contents would collide with the preview route, belong to the serving story.

Also out of scope: making the non-servable tree servable. A snapshot shipped from
it is uploaded and indexed but unreachable by design; exercising the serving path
means using a throwaway slug in the servable tree instead, which the command's
own help says.

## Technical Context

- **Delivery migrates serving, not storing.** Site definitions remain canonical
  on the operator's machine and authoring is unchanged; only the artifact crosses
  the wire. Moving canonical storage while authoring is local would create a
  bidirectional sync problem that no planned end state has (see DOC-5, REQ-7).
- **Shared storage sits behind a client seam**, so the whole deploy pipeline is
  exercisable end-to-end without network access. The shipping implementation adds
  no new dependencies; because that mechanism cannot enumerate stored objects, a
  write-ahead record of the keys a deploy is about to write is what makes an
  interrupted deploy's orphans collectable. Both are implementation choices the
  acceptance criteria deliberately do not name.
- **Root-scoping was a correction, and the resolution chosen was to namespace
  rather than refuse** (BUG-31). The store-tree distinction existed locally from
  the start; the shared-storage layout originally flattened it, so a scratch
  deploy could read, rewrite and overwrite a real site's index and published bytes
  whenever the two shared a slug. Refusing to deploy the scratch tree outright was
  the considered alternative; namespacing was chosen because it keeps the flag
  uniform across every command instead of adding a one-command refusal, and it
  remains a small follow-on to withdraw the scratch root if it proves dead weight.
- **Known divergence from intent (flag for regression).** The intent specifies a
  *conditional write* (compare-and-swap on the stored deploy index) so a lost
  update fails loudly. The chosen upload mechanism does not expose conditional
  writes, so the implementation compares a re-read of the index against the bytes
  it started from. That preserves the property the intent asked for — a lost
  update fails loudly rather than silently clobbering — but narrows rather than
  closes the race window. Single-operator today; the later database phase removes
  the concern.
- **Preview URLs are unguessable-private by decision, not access-controlled.**
  There is no authentication on a preview link. A content-derived snapshot id is
  in principle computable by anyone who can reproduce the exact rendered bytes;
  this is an accepted v1 trade-off, and the stated fix (a random token in the
  index pointing at the content-addressed location) needs no layout change.
- The deploy command's machine-readable output hygiene is owned by STORY-79
  (1c CLI flag parsing and clean `--json` documents), not by this story.
- Delivery depends on rendered output being relocatable — a snapshot served from
  a path prefix rather than a host root — which STORY-83 owns.

## Dependencies

None. (Pairs with the public-site serving story, which consumes the storage
layout this story defines; the two were designed to be built in parallel against
that layout as a shared spec.)

## Story Points

3