---
uid: request-4b5c10e9
id: REQ-229
type: request
title: Promotion records the asset name, and a recipe change replaces those bytes
  in place
created_by: EPIC-1
created_at: '2026-09-11T22:46:15.066292+00:00'
updated_at: '2026-09-12T00:06:42.244375+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c682c825
---

## The gap

A client crops their logo in the Library, sees it cropped there, publishes, and
their site serves the picture uncropped. Nothing errors. Every component behaves
exactly as designed; what is missing is the seam between them.

[[REQ-219]] settled how a recipe reaches a published site — **the material records
the site asset name it was promoted to, and a recipe change re-promotes** — and
recorded it as decided. Neither half was built:

- **`promoteToSiteAsset` does not record the promoted name.** It computes one
  through `freeAssetName` — which *may rename on collision* — writes the bytes via
  `editAssetAdd`, then calls `recordPlacement`, which writes `placed_on` slugs and
  nothing else.
- **`reviseRecipe` does not re-promote.** It validates, compiles, writes
  `fields.edits`, and returns. Nothing touches the site's copy.
- **Publish reads no recipe**, which is correct under this design — it ladders
  bytes that promotion was supposed to have already corrected.

So the epic's own title breaks between its third and fourth verbs: *change* does
not reach *publish*.

## What changes

**Promotion records the asset name it wrote.** Not just which sites a material
landed on — the name it landed under, which `freeAssetName` may have altered. This
is the pointer the whole design rests on and the thing that distinguishes a first
placement from a later one.

**A recipe change re-promotes to that recorded name.** The rendered bytes for the
current recipe replace the bytes already at the name the site's pages reference.

## Replacement is explicit, and is not delete-then-add

**This is the decision that makes the ticket safe, and it is the operator's.**
Re-promotion must **replace bytes at an existing name**, as one operation.

**The principle, in the operator's words.** *When I edit a photo, I expect the edit
to replace the existing photo — same name, everything.* That is the whole of it,
and it is what a user of any photo tool expects; a crop that arrives as a second
file called `logo-2.png` is not an edit, it is a copy.

**A second name would be a version mechanism on top of a version mechanism.**
Editing is already non-destructive here: the material retains the **original bytes**
and the **sequence of operations** that produced the current render ([[REQ-219]]'s
recipe). Nothing is lost by overwriting, because the thing being overwritten is a
*derived artifact* — re-derivable from the original and the recipe at any moment.
Minting a new name to preserve the old bytes preserves nothing that is not already
preserved, and pays for it twice: an orphan in the bucket on every commit, and a
site whose pages still point at the stale derivation.

**So naming is settled by what the name addresses.** The site asset name addresses
*this material's picture, as currently edited* — a stable pointer, not a version.
Versions live in the material: the original, plus the operations. One mechanism,
in one place.

**Why not delete and re-add.** Between the two there is a window in which the
site's pages reference an asset that does not exist — a broken picture on the
client's live draft, and a publish in that window renders a snapshot with a hole in
it. It also takes a second trip through `freeAssetName`, which would hand back the
*original* name only if the delete had already committed. Two operations to
express one intent, with a failure mode in between, is the glitchier of the two
paths.

**Why replacement cannot reuse the promotion path as it stands.**
`freeAssetName` (`material.ts:812`) appends `-2`, `-3`, `-4` on collision. A
re-promotion through it mints `logo-2.png` on the first edit and `logo-3.png` on
the second, while every page referencing `logo.png` keeps serving the **unedited**
original and a fresh orphan lands in the bucket on every commit. The client's
crop would be strictly invisible and strictly expensive.

**And that behaviour is correct for the door it guards**, which is why this must
not be "fix `freeAssetName`". Its own comment states the rule: *"promoting a second
`logo.png` would REPLACE the first — silently changing a picture that is live on
the client's site, from a surface whose whole promise is that it only adds."* That
promise holds for every caller except this one.

**So the two doors are told apart explicitly, by the record.** A material with **no
recorded asset name** is a new placement: it takes a free name, exactly as today. A
material that **already records one** is a re-placement: it overwrites that name
and mints nothing. The record is what makes the distinction mechanical rather than
a flag someone has to remember to pass.

**A replacement that finds nothing at the recorded name does not invent one.** If
the name is gone — an operator deleted the asset, a push overwrote the site — the
material's record is stale, and silently re-adding the picture would put back
something somebody removed. It reports rather than repairs.

## What this does not change

**Draft and published still differ, and that is the point.** Re-promotion updates
the **draft**. A published revision is a frozen snapshot and does not change.
Changes reach the live site when the client publishes, which is the product's
semantics everywhere else and wants no exception here.

**No new join key.** This is the shape [[EPIC-1]]'s catalogue principle asks for —
the catalogue is the source of truth and a site's assets are a projection of it. A
material that records where its bytes landed and re-promotes when its recipe
changes *is* that projection. A `material_uid` column on `site_assets` would be a
join between two peer stores, which is the thing being avoided.

**The width ladder is untouched.** [[REQ-222]] ladders whatever bytes it finds in
the site's assets. Once those bytes are the corrected ones, it ladders the
corrected ones. Nothing about the ladder needs to know a recipe exists.

## Where it sits

One of three faces of the same sentence — *the catalogue is the source of truth* —
failing at different points. [[BUG-84]] is the entry half (pictures that reach a
site with no catalogue ticket). [[REQ-228]] is the access half (the AI cannot read
the catalogue as tickets, and cannot promote). **This is the propagation half.**
Fixing any one alone leaves the promise false.

Depends on nothing new. Both halves are edits to `material.ts` plus the site
store's ability to write bytes at an existing name.