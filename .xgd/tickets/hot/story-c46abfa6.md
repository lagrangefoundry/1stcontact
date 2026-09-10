---
uid: story-c46abfa6
id: STORY-102
type: story
title: Ask my site what assets it has, and get the truth rather than what it happens
  to have declared
created_by: xgd
created_at: '2026-08-07T04:29:09.386086+00:00'
updated_at: '2026-09-10T20:45:50.552415+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: request-66e4c630
  capability_uid: capability-b4ac88fc
  story_kind: feature
  story_points: 2
  uat_coverage: pass
---

## Story

**As a** person who owns a site on this platform — or any surface that has to
offer me a choice of my own assets — **I want** to ask a site what assets it has
and get one honest answer, without opening or clicking anything on a page,
**so that** I can see what my site can actually reference, and every chooser I am
ever offered is drawn from the same list rather than from a partial view of it.

## Description

This is the **site's asset store as a surface of its own**. It answers one
question — *what can this site reference?* — and it answers it in one place, for
every caller: the operator at the command line, the builder origin, and any
editing surface that must present a closed set of assets to choose from. Three
consumers, one listing. The alternative the operator explicitly rejected while
building this was a second "pickable" listing beside the existing one, which
would have meant two ideas of what a site's assets are.

**In scope**

- **The union of two sources that genuinely disagree.** A site names its assets
  in two places. The site definition carries a declared registry with descriptive
  metadata (an identity, alt text) but no bytes; the site's asset store carries
  the bytes but no metadata. In practice these disagree badly: every real
  site in the project's storage has an empty registry sitting beside a full
  store, so a registry-only answer names nothing on the sites actually being
  built. The listing reports **both**, merged by handle.
- **Provenance, not a flattened guess.** Each entry says which of the two sources
  vouched for it — whether the store holds bytes for it, and whether the
  definition declares it. An undeclared file is visible as an undeclared file; a
  declared asset with no file is visible as a missing one. Reporting the disagreement is
  the honest answer, and it is what lets a future browser of the store show which
  files are undeclared.
- **One handle vocabulary.** Every entry is identified by the same site-local
  reference form a page already holds for an image, regardless of how its source
  named it. A handle taken from the listing can be written straight into a page
  without translation — the listing must never invent a parallel vocabulary
  beside the one the capture pipeline already writes.
- **A usage kind.** Each entry reports what it can be used for, derived from the
  file itself, so a caller needing one kind can narrow the list while a caller
  browsing the whole store still sees fonts and stylesheets.
- **Reachable without an editing gesture.** The store answers from the command
  line and from the builder's own origin. Neither requires a page, a segment, a
  hover or a modal. A caller that omits the site is told so as its own mistake.

**Out of scope**

- **Uploading, importing, converting or resizing an asset.** The store lists what
  exists; nothing here writes or transforms a file.
- **Licence and provenance obligations** over an asset's bytes — that is a
  project-level question, owned by this capability's sibling story STORY-92
  (story-8685be2d), asked of the same files with an entirely different answer.
- **Choosing an asset for a region of a page.** Offering a closed choice and
  writing it into a page belongs to the copy-editing write path (CAP-86); this
  story only supplies the list it draws from.
- **Any presentation of the list** — a friendly label, a thumbnail, an ordering
  for human eyes. The listing is data.

## Technical Context

- **Relationship to CAP-86 (Structured Copy Editing).** The image chooser in the
  editing surface is a consumer of this listing, narrowed to images. Read and
  write on that surface must derive from the identical set, so the chooser can
  never offer something the write path would refuse. That constraint is stated
  and proved in CAP-86's story; here the obligation is only that one listing
  exists and is shared.
- **Relationship to CAP-70 (Framework Substrate).** Binding a handle to the bytes
  a page actually serves is CAP-70's. This capability stops at enumerating.
- **Relationship to the project-level licence index (STORY-92 / story-8685be2d).**
  Asset provenance and licence compliance was its own capability (CAP-80) when
  this story was written; it has since been consolidated into this capability and
  now sits here as a sibling story — a project-level index of licence obligations
  over governed files. A licence obligation attaches to the asset, a listing
  attaches to the site; the two are deliberately held apart.
- **This replaces a partial truth rather than adding a second one.** An asset
  listing command existed before this work but reported the declared registry
  alone — which, given the state of every real site, was reliably empty. The
  union supersedes it in place; there is no legacy registry-only listing left
  behind and none should be reintroduced.
- **The listing carries no label and no thumbnail, by boundary.** An entry is an
  identity, a source reference, alt text, a usage kind and its two provenance
  flags — nothing that exists for human eyes. That is not a gap waiting to be
  filled here: how a set of choices is *presented* — a friendly name, a
  thumbnail, an ordering — belongs to the editor-gesture capability, which
  derives what it shows from the handle it was given. This capability supplies
  the data and stops. No label or thumbnail is asserted anywhere in this story,
  and none should be added here.
- **Intent/implementation agreement.** The implementation matches the operator's
  stated intent for this item with no divergence found: the listing is exported
  free of any UI, the builder route exists precisely so the store is reachable
  without a modal, and the editing surface deliberately does *not* call that
  route (its choices already travel with the region it reads), which is why no
  acceptance criterion here asserts that it does.

## Dependencies

None.

## Story Points

2