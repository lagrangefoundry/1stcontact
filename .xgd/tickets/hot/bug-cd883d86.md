---
uid: bug-cd883d86
id: BUG-84
type: bug
title: 'A picture can land in a site''s assets without a catalogue ticket: write_image
  and add_asset mint blobs but no material'
created_by: BUG-80
created_at: '2026-09-11T22:27:15.822174+00:00'
updated_at: '2026-09-11T22:27:15.822174+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  severity: high
  auto_merge_back: true
  needs_review: false
---

## What is wrong

A picture can land in a site's assets without ever becoming a catalogue item.
Every door that writes bytes into a site should mint a `material` ticket for
them, and two of them do not.

This is the defect underneath REQ-228's Half D. That ticket proposes the
catalogue as the single source of truth over both stores; this is the thing that
makes the catalogue *incomplete*, so the mark cannot be trusted until it is fixed.

## The evidence

In the local store, 2026-09-11:

```
SVG pictures in site_assets  : 14
SVG material tickets         :  0
material tickets by origin   : generated 4, uploaded 13
```

Fourteen drawings are live on sites. Not one of them is in the catalogue. The
files are `xgd-echo-1.svg`, `xgd-echo-3.svg`, `xgd-grid-hero.svg`,
`xgd-grid-mark.svg`, `wordmark-option-a.svg`, `wordmark-option-b.svg`,
`wordmark-measure.svg`, `mark-signal.svg`, `mark-orbit.svg`, `mark-block.svg`
and kin — every one of them an assistant's `write_image` output.

`AlchemistLabWithTech.png` (2.4 MB) is on a site with no material ticket either.

## What works, stated so it is not re-litigated

Three of the four doors are correct and must not change:

- **A client upload** mints a `material` ticket through `material.ts`'s ingestion
  — classified, described, indexed. (13 rows, `origin: uploaded`.)
- **`create_image`** mints one through `generatedMaterialStore` in `imagegen.ts`,
  which exists precisely so that "a generated image is an ordinary `material`".
  (4 rows, `origin: generated`.)
- **Promotion** copies a material's bytes onto the site and records `placed_on`,
  which is the mark working exactly as intended —
  `How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf` is in both places with
  `placed_on: ["xgd"]`.

So the model is right and implemented. Two paths bypass it.

## The two paths

**1. `write_image` — the assistant's own drawings.** `toolbox-core.ts`'s
`write_image` handler calls `editAssetWrite`, which writes into the site store
and stops. No ticket, no description, no `placed_on`, no KB entry. This is the
larger of the two by volume: a drawing is the one kind of picture the assistant
makes entirely by itself, and it is the one kind that never enters the catalogue.

The consequences compound. The drawing has no description, so nothing about it is
searchable and the assistant cannot later find its own wordmark by asking what it
looks like. It has no `rights`/`republishable` block, so the gate that governs
every other picture's publication never ran on it. And it cannot be reasoned about
alongside the client's own material, because it is not in the same list.

**2. `add_asset` — a file from the operator's disk.** `editAssetAdd` from a local
path, same shape, same absence. Lower volume, and not currently granted to the
consultant, but the same hole.

There is arguably a third — a site seeded or pushed from `storage/sites/` — which
should be considered when this is scoped.

## What is deliberately NOT in scope

**Not every blob is catalogue material.** A site's assets also hold fonts
(`satoshi-*.woff2`), stylesheets and mirrored subresources from a capture
(`blog.*.css`, `css2`, `index`). Those are build output and third-party
subresources, not the client's material, and minting a ticket per mirrored
stylesheet would fill the Library with noise the client never put there.

The rule this ticket asks for is about **pictures**: a picture that lands in a
site's assets is a catalogue item. Fonts and mirrored subresources stay as they
are.

## What we want

Every picture that enters a site's assets mints a `material` ticket, whatever
door it came through, with `origin` recording which door — a new value for a
drawing the assistant composed, distinct from `uploaded` and `generated`, because
where a picture came from is exactly what `origin` is for and a drawing is a
third provenance.

Once that holds:

- `placed_on` is the whole truth about what is on a site.
- The site's asset listing becomes a *view* of the catalogue filtered by
  `placed_on`, rather than a second store to check.
- REQ-228's "one catalogue with a mark" is true rather than nearly true.

## Questions to settle when scoping

- **Description.** Ingestion describes an upload with a model, and the drawing
  path has something better available: the assistant wrote the SVG and already
  knows what it drew. `write_image`'s surface asks it to "say what it shows", so
  the text may already exist and should be used rather than re-derived.
- **Rights.** A drawing composed by this system is `owned` and `republishable`,
  and its provenance is not in doubt — unlike an upload, where the ticket's own
  header argues rights must be inferred rather than asked. This should be
  settled explicitly, not defaulted into.
- **Ordering.** The bytes are already on the site when the ticket is minted, so
  `placed_on` is known at creation rather than being written by a later
  promotion. Promotion's rule that "placement is recorded here, and only here"
  needs a stated answer for the door where the two happen at once.
- **The existing fourteen.** Whether a backfill mints tickets for drawings
  already on sites, or whether the catalogue simply starts being complete from
  the fix forward. A backfill has no description to write without re-deriving one.

## Related

- REQ-228 (`request-77e4e59c`) — the catalogue proposal this unblocks. Its Half D
  names this gap; this is that gap as a defect with evidence.
- BUG-47 — established `placed_on` as placement rather than upload context.
- BUG-45 — made promotion go *through* `editAssetAdd` rather than past it, so
  that a file arriving by one door is described the same as one arriving by
  another. This is the same argument applied one level up.
