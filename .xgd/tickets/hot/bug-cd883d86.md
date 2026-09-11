---
uid: bug-cd883d86
id: BUG-84
type: bug
title: A capture-mirrored picture can reach a site's assets with no catalogue ticket
  and no rights record
created_by: BUG-80
created_at: '2026-09-11T22:27:15.822174+00:00'
updated_at: '2026-09-11T22:37:16.187932+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  severity: medium
  auto_merge_back: true
  needs_review: false
---


## What is wrong

A picture can land in a site's assets without ever becoming a catalogue item, so
the catalogue is not a complete account of what is on a site.

**Scope, 2026-09-11 (operator, revised).** An earlier decision excluded the
assistant's `write_image` drawings from the catalogue; it has been **withdrawn**.
REQ-228 now takes the strong form — one list, every asset is a catalogue item,
and what the client sees in their Library is a filter on `kind` rather than a
second list. Drawings are in.

That makes this ticket one door among several rather than the whole gap. The
others — `write_image` and `add_asset` — are named in REQ-228's Half D. **This
one keeps its own ticket because it is the only one with an exposure attached**,
and that exposure stands whatever happens to the catalogue.

## The exposure

Setting drawings aside — they are a catalogue gap, not a rights one — the raster
picture on a site with no record is **one file**:

```
non-SVG pictures in site_assets : AlchemistLabWithTech.png (2.4 MB)
                                  DSC_7975.jpg (12.7 MB)
material ticket for DSC_7975.jpg: yes — promoted, placed_on recorded correctly
material ticket for Alchemist…  : none
```

Its provenance is the point:

```
storage/references/gigabytealchemy.ai/index/assets/AlchemistLabWithTech.png
storage/sites/gigabytealchemy/draft/assets/AlchemistLabWithTech.png
→ site_d669b155… (slug: gigabytealchemy)
```

It is a subresource **mirrored from a captured third-party website**, which then
reached a site's assets through the seed/push door (`storage/sites/<slug>/draft/`
→ `1c push`). No material ticket was minted, so no `rights` block was ever
written, and `republishable` was never evaluated.

`promoteToSiteAsset` refuses exactly this picture — it checks `republishable` on
the material's own record and raises `NotRepublishableError` for anything
capture-sourced, because DOC-38 §5 calls promoting a capture-sourced asset "the
most damaging single action available in the system": it publishes third-party
copyright under the client's own domain. **That gate is correct, and this door
goes around it**, because a picture with no ticket has nothing for the gate to
read.

The instance here is a development fixture and harms nobody. The door is the bug.

## What works, stated so it is not re-litigated

- **A client upload** mints a `material` ticket through `material.ts`'s
  ingestion — classified, described, indexed.
- **`create_image`** mints one through `generatedMaterialStore` in `imagegen.ts`,
  which exists precisely so that "a generated image is an ordinary `material`".
- **Promotion** copies a material's bytes onto the site, checks the rights gate,
  and records `placed_on` — `DSC_7975.jpg` is in both places, correctly marked.

Three of four doors are right. This is about the fourth.

## The doors that bypass the catalogue

1. **Seed / push from `storage/sites/<slug>/draft/assets/`.** Whatever is in that
   directory becomes a site asset. Capture-mirrored subresources land there, so a
   third party's imagery can reach a client's site with no rights record and no
   gate. This is the live instance and the one that matters.

2. **`add_asset`** — a file from the operator's own disk. Same absence, lower
   stakes: the operator is asserting their own material, and the operation is not
   granted to the consultant.

Not in scope by the decision above: `write_image`.

Also not in scope, and correctly so: fonts (`satoshi-*.woff2`), stylesheets and
other mirrored subresources (`blog.*.css`, `css2`, `index`). Those are build
output and third-party subresources, not the client's material.

## What we want

A **picture** that lands in a site's assets through the seed/push door gets a
catalogue entry carrying its provenance and its rights block — or, if minting a
ticket per seeded asset is the wrong shape, the rights question is answered at
that door some other way. What must not survive is a picture on a client's site
that no record can account for.

The narrower framing, if the broad one is too much: **a capture-mirrored image
must not reach a site's assets without passing the same gate promotion passes.**
That is one rule, at one door, and it closes the exposure without touching the
catalogue's shape.

## Relationship to REQ-228

REQ-228's Half B makes `list_assets` a view over the catalogue, and states the
invariant that makes that safe: **the catalogue must be complete by
construction** — every write path into a site's assets mints its item as part of
the same operation, so there is never a moment where bytes exist and an item does
not. BUG-45 is the evidence for why that is not optional.

This door is one of the ones that breaks the invariant, so closing it is a
precondition of the cut-over rather than an improvement alongside it. The
difference from the other doors is that this one is *also* a rights hole, and
would be worth closing even if the catalogue were never unified.

## Questions to settle when scoping

- Whether the seed/push door mints tickets, or is gated some other way.
- Whether the existing `AlchemistLabWithTech.png` is left alone (a dev fixture),
  or is the test case for whatever gate is added.
- Whether a capture bundle's images should be catalogue items in their own right
  — they are the client's *reference* material, which is a real category with a
  `rights` answer of its own, distinct from anything they own.

## Related

- REQ-228 (`request-77e4e59c`) — the catalogue proposal. Half D names this gap.
- BUG-47 — established `placed_on` as placement rather than upload context.
- BUG-45 — made promotion go *through* `editAssetAdd` rather than past it, so a
  file arriving by one door is treated like one arriving by another. This is the
  same argument, at a door that has no gate at all.
