---
uid: story-c46abfa6
id: STORY-102
type: story
title: Ask my site what assets it has, and get the truth rather than what it happens
  to have declared
created_by: xgd
created_at: '2026-08-07T04:29:09.386086+00:00'
updated_at: '2026-10-26T01:09:24.043353+00:00'
completed_at: null
last_field_updated: story_kind
status: completed
fields:
  intent_uid: request-66e4c630
  capability_uid: capability-b4ac88fc
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
---

## Story

**As a** person who owns a site on this platform — or any surface that has to
offer me a choice of my own assets, including the builder's assistant — **I want**
to ask a site what assets it has and get one honest answer, read any one of them
back by the name I was given or the handle a page holds, and add or remove one
without anything else about my site changing, **so that** I can see what my site
can actually reference, every chooser I am ever offered is drawn from the same
list, and nobody — person or assistant — is ever told a file on my site cannot
be used.

## Description

This is the **site's asset store as a surface of its own**. It answers one
question — *what can this site reference?* — and it answers it in one place, for
every caller: the operator at the command line, the builder origin, and any
editing surface (the assistant's control surface among them) that must present a
closed set of assets to choose from. Three consumers, one listing. The
alternative the operator explicitly rejected while building this was a second
"pickable" listing beside the existing one, which would have meant two ideas of
what a site's assets are.

**In scope**

- **One source: the bytes the store holds.** A site's assets are exactly the
  files in its asset store, and every one of them may be referenced by a page.
  The site definition does not declare, describe or register assets — there is
  no second class of asset ("undeclared", "unregistered") and no flag on any
  entry distinguishing one. A stored definition that still carries the retired
  site-level `assets` key loads unchanged: the key is ignored, never refused, and
  nothing reads it.
- **One handle vocabulary.** Every entry is identified by the same site-local
  reference form a page already holds for an image (`/assets/<name>`). A handle
  taken from the listing can be written straight into a page without
  translation. Entries are in handle order.
- **A usage kind.** Each entry reports what it can be used for, derived from the
  file itself, so a caller needing one kind can narrow the list while a caller
  browsing the whole store still sees fonts and stylesheets.
- **Reading one asset agrees with the listing.** Any asset the listing reports
  can be read back by its id or by its handle, in the listing's own entry shape;
  a name the store does not hold is refused as not found.
- **Writing an asset writes bytes, never the definition.** Adding a file,
  drawing an image (STORY-107) and removing an asset change the stored bytes and
  leave the site definition byte-identical. Each records one draft-journal entry,
  so the assistant is told on its next turn that something arrived or left.
  Adding refuses a name the store already holds (the caller chooses another
  name); drawing refuses one unless replacement is asked for; removing refuses an
  asset a component field still references unless forced.
- **Alt text belongs to the picture element.** No asset carries a description:
  adding and drawing take no alt text and reading an asset reports none. What a
  picture shows is the required alt on the L1 image node that places it.
- **The assistant's manual tells the truth about assets.** No operation
  description or absence presents registration (or any other step) as a
  precondition for using a stored file. The absence the assistant reads when it
  wants a file says it cannot fetch one itself and must ask the client to drop it
  on the site-asset area of the conversation — never send them to a separate
  asset manager — and that a dropped file's description is held on the material
  it came from, to be read there and written onto the image node.
- **The asset-reference value shape survives.** The asset-reference object a
  background or a layer child may carry is unchanged and still accepted; only the
  site-level registry was retired.
- **Reachable without an editing gesture.** The store answers from the command
  line and from the builder's own origin. Neither requires a page, a segment, a
  hover or a modal. A caller that omits the site is told so as its own mistake.

**Out of scope**

- **Importing, converting or resizing an asset**, and promoting a client's
  upload into the store — promotion is STORY-143's; it reaches the store through
  the same add path and inherits the rules above.
- **Licence and provenance obligations** over an asset's bytes — owned by the
  sibling story STORY-92 (story-8685be2d).
- **Choosing an asset for a region of a page.** Offering a closed choice and
  writing it into a page belongs to the copy-editing write path (CAP-86); this
  story only supplies the list it draws from.
- **Any presentation of the list** — a friendly label, a thumbnail, an ordering
  for human eyes. The listing is data.
- **Making the assistant obey its manual.** The manual's wording is asserted on
  the declaration; nothing mechanically stops a model ignoring it.

## Technical Context

- **The registry was deleted, not repaired (BUG-44, operator decision
  2026-09-01).** This story previously specified the listing as the union of a
  declared registry in the site definition and the stored bytes, with provenance
  flags. Analysis found nothing else read that registry — not the renderer,
  publish, import or the picker — its `alt` was superseded by the image node's
  required `alt`, its `focalPoint` had no reader, and 8 of 9 tracked sites had it
  empty. Its one behavioural consumer (`get_asset` reading the registry alone)
  was the bug that told the assistant a client's uploaded logo did not exist.
  The operator: *"we don't actually need the registry at all."* AC-1019
  (declared-asset metadata and declared-but-absent entries) is superseded by
  bundle-5607a08d accordingly.
- **BUG-45 superseded in part.** BUG-45's "promotion registers", "description
  becomes the alt text" and "`registered` stays reportable" were withdrawn by
  BUG-44 and are not specified here. Its surviving behaviours — read agrees with
  listing, the surface's absence and no-stand-in wording — are.
- **What the deletion cost, stated plainly.** A promoted upload no longer
  carries its material's description as alt text automatically; the surface
  instead tells the assistant where the description lives.
- **`present-on-disk` stays on each entry** and is always true; the picker and
  its tests read the field by name. It is not a provenance flag.
- **Relationship to CAP-86 / CAP-70 / STORY-92** unchanged: the image chooser is
  a consumer narrowed to images; binding a handle to served bytes is CAP-70's; a
  licence obligation attaches to the asset, a listing to the site.
- **This replaces a partial truth rather than adding a second one.** No
  registry-backed listing remains and none should be reintroduced. If per-asset
  portable metadata (e.g. a focal point) is ever built, BUG-44 records that it
  belongs in the site definition again, not on tenant-side material tickets.

## Reconciliation Decisions

- **2026-10-25 — adding a file has no replace option.** BUG-44 behaviour 4 says
  "`add_asset` and `write_image` refuse a name the store already holds unless
  told to replace it". Only `write_image` has ever accepted a replacement
  (`replace` on the surface, `force` underneath); `add_asset` refused a taken
  name before BUG-44 and still does, naming a different stored name (`as` /
  `--as`) as the remedy, and BUG-44's own test plan asserts nothing about
  replacing on add. The phrase is read as describing the pair collectively, not
  as asking for a new replace option on add. Formalised: add refuses a held name
  outright with a conflict naming the rename remedy; drawing refuses unless
  replacement is explicit. If the operator meant add to gain a replace option,
  that is new behaviour for an upgrade of its own.

## Dependencies

None.

## Story Points

3
