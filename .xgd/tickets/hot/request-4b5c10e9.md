---
uid: request-4b5c10e9
id: REQ-229
type: request
title: Promotion records the asset name, and a recipe change replaces those bytes
  in place
created_by: EPIC-1
created_at: '2026-09-11T22:46:15.066292+00:00'
updated_at: '2026-09-12T00:20:52.277407+00:00'
completed_at: null
last_field_updated: status
status: free_coding
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

**Promotion itself writes the render, not the stored original.** [[REQ-219]]
settled that *the recipe is applied at promotion, not at publish* — that is the
heading the decision sits under — and promotion currently copies the attachment's
bytes untouched. So a picture cropped in the Library and *then* put on the site
arrives uncropped, by the same seam and with the same symptom. Promotion renders
the material's current recipe and writes what comes out. For the overwhelming
case — a file dropped on the overlay, promoted in the same second, with no recipe
at all — the recipe is empty and there is nothing to render, so this costs
nothing where nothing has been edited.

**A recipe change the ASSISTANT makes re-promotes on the same terms.** The client's
modal and `edit_image` are two producers of one fact — the recipe on the record —
and [[REQ-228]] has just made the catalogue reachable by the assistant. A
propagation that fired for one producer and not the other would be the same gap
this ticket closes, re-opened on the surface the product leads with.

**Where this deployment cannot render, the recipe still lands and nothing is
re-promoted.** No `[images]` binding means no bytes to write, which is the state
`rendered: false` already reports. The recipe is on the record and reaches the
site the next time a deployment that can render touches it — the surface says the
client is looking at the picture before the change, which is exactly what it
already says.

**What a re-promotion answers with.** Each recorded placement, the name it was
written at, and whether the bytes were replaced — reported beside the row the
edit returns, so a client's crop that did not reach their site says so on the
turn it happens rather than in a picture somebody looks at next week.

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


---

## Answered from EPIC-1, 2026-09-11 — four things an implementer hits on day one

Swept for unanswered questions across the epic's children. This ticket was the
only one with no epic-level answer pass, and its last chat turn — *"if you have
any questions ask them here"* — never got a reply: the generation failed on a
spend limit. So these are the questions that would have been asked, answered
where the epic's design conversation settles them and escalated where it does
not. **Verified against the code, not inferred from the ticket.**

### 1. Promotion itself must apply the recipe — not only re-promotion

**The body describes two halves and there are three.** As written, this ticket
records the name at promotion and re-promotes when the recipe changes. Both are
right. But `promoteToSiteAsset` (`material.ts:712`) reads the **attachment's
original blob** — `readBlob(tickets, args.uid, attachment.uid)` — and hands those
bytes straight to `editAssetAdd`. It takes no renderer and has no parameter for
one, and none of its three callers (`placeOnSite` at `router.ts:1338`, the
role-change route at `router.ts:2532`, the Library's **Use on site** button at
`library.ts:138`) could supply one.

So the failure this ticket exists to fix has **two doors**, and the body only
shuts one:

- *promote, then crop* — the recorded name is stale. This ticket fixes it.
- *crop, then promote* — promotion writes the uncropped original. **This ticket
  does not fix it**, and the client's experience is identical: they crop in the
  Library, see it cropped, publish, and get the original.

[[REQ-219]] decided *"the recipe is applied at promotion, not at publish"*. Read
literally, that is a statement about **promotion**, and it is the first
placement that most obviously has to honour it. **Both doors are in scope**:
promotion renders the current recipe before it writes, and re-promotion is the
same act against a recorded name. A material with an empty recipe renders to its
original bytes, so there is one path, not two.

### 2. The record is per-site, and it must not be carried in `placed_on`

The body says *"the asset name it landed under"*, singular. It cannot be
singular. `placed_on` is a **list of slugs** and [[REQ-219]] states the
consequence explicitly — *"a material placed on several sites re-promotes to
each, driven by `placed_on`"* — and `freeAssetName` resolves collisions against
**one site's** listing, so the same logo can be `logo.png` on one site and
`logo-2.png` on another. One name would re-promote to the wrong file.

**And the name must not be folded into `placed_on` by changing its element
shape.** That field is `{ type: 'list' }` in `MATERIAL_FIELDS` (`tickets.ts:121`)
— the engine checks only `Array.isArray`, so nothing would stop it — but four
readers would break silently rather than loudly:

- `placedOn()` (`material.ts:799`) filters `typeof v === 'string'`, so every
  object would be dropped and **every placed material would read as unplaced**.
- `MaterialRow.placed_on` is typed `string[]` (`material.ts:923`).
- `library.ts:71` carries it to the client, where the pane's *Used on* field,
  its pill and its "used on this site" filter all read it.
- `router.ts:3229` returns it in the `AlreadyOnSiteError` 409 envelope.

The first of those is the dangerous one: it fails **open**, into the state that
reads as "never placed", which is exactly the state this ticket uses to decide
that a promotion is a *first* one. A shape change would make every existing row
take a free name on its next edit — the `logo-2.png` failure the body is written
to prevent, arrived at through the migration instead.

**So: a second field, keyed by slug**, beside `placed_on` and declared in
`MATERIAL_FIELDS` the way `edits` was. `placed_on` keeps saying *which sites*;
the new field says *under what name on each*. Absence reads as "no recorded
name", which is the first-placement branch — so material that predates the field
needs no migration, the same property `placed_on` and `edits` were both given.

### 3. Re-promotion cannot go through `editAssetAdd`, and fixing that in place is forbidden

`editAssetAdd` (`edit.ts:2287`) throws `CommandError{code:'CONFLICT'}` when the
name is already in `listAssets`. `promoteToSiteAsset`'s own comment relies on
never meeting it — *"The name is already free, so the CONFLICT branch cannot fire
from here"* — which stops being true the moment a re-promotion aims at a recorded
name. The body is right that this must not become "fix `freeAssetName`"; the same
argument applies one layer up, because `editAssetAdd`'s refusal is the same
only-adds promise stated in a different place.

**The replace path is a sibling of `editAssetAdd`, not a flag on it.** The
underlying call is already replace-capable — `opts.store.write(slug, {assets:
[{name, bytes}]})` puts bytes at a name and says nothing about what was there —
so the sibling is that write plus the same draft-journal note (`op:
'asset.replace'`), which is what keeps the assistant told that a picture changed
on the turn it changes. That preserves the property `promoteToSiteAsset`'s
header insists on: *"one write path, one set of rules about names"* — two verbs
over one write, rather than one verb with two meanings.

### 4. `reviseRecipe` has neither of the two things it now needs

`reviseRecipe` (`material.ts:1616`) is `(store, args, deps: {measure?})`. It has
no site store and its only dep **measures** — it never produces bytes. Both have
to be threaded for the re-promote to happen where the body puts it.

Two things to carry through that threading, both already decided elsewhere:

- **The `republishable` gate travels with the bytes.** `promoteToSiteAsset`
  checks it on the material's own ticket before anything is copied, and
  [[BUG-84]] is the ticket about what happens when bytes reach a site without
  that check. A re-promotion is a fresh cross-bucket copy and takes the same
  gate — a material whose rights were narrowed after its first placement must
  not keep pushing new bytes through on every crop.
- **`rendered: false` stays honest.** A deployment with no Images binding already
  stores the recipe and reports that the client is looking at the picture before
  the change. The same deployment cannot re-promote either, and must say so in
  the same field rather than silently recording an edit that never reached the
  site.

### What this does not change

The body's own decisions all stand and none of the above disturbs them:
replacement rather than delete-then-add, no new join key, a stale record
reporting rather than repairing, and the draft/published distinction. The
operator's principle — *an edit replaces the existing photo, same name,
everything* — is what item 1 extends rather than qualifies: the first promotion
of an already-cropped photograph should put the cropped photograph on the site,
for the same reason.

## Test plan

UATs in `tests/test_UAT_FC_REQ-229_recipe_reaches_the_site.workers.test.ts`,
through `route()` against real D1, real R2 and the real `IMAGES` binding — the
suite [[REQ-219]] established, for the reason it established it: a recipe
asserted against a hand-written renderer proves the fake.

**Asserted with `rotate`, deliberately.** Miniflare's local Images implementation
honours `rotate`, `width` and `height` and silently drops trim and every colour
adjustment, so a crop asserted in pixels here would pass against an uncropped
picture. A quarter turn is a real transform the local renderer really performs
and its result is checkable without trusting the renderer's own word — the
picture's width and height swap.

The happy paths:

1. Promotion records the name it wrote, including the one `freeAssetName` renamed.
2. A recipe change replaces the bytes at that name — same name, no second asset.
3. Promotion applies a recipe the material already carried.
4. A second promotion of the same material onto the same site replaces rather
   than minting a new name.
5. A recorded name that is no longer on the site reports and does not re-add it.
6. `edit_image` propagates to the site by the same path the modal does.