---
uid: request-5765589a
id: REQ-282
type: request
title: '"Not on the site" is a state, not an error: an accent pill when placed, grey
  when not'
created_by: EPIC-19
created_at: '2026-09-19T00:58:36.186954+00:00'
updated_at: '2026-09-19T01:20:52.973612+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d2727e7d
---





Parent: [[EPIC-19]]. Operator, 2026-09-18:

> I see the big red error messages "Not on the site" with a warning triangle —
> that is nonsense. A Site asset has to be a POTENTIAL asset — it's not an error
> if I choose not to use all the photos.

## The badge is firing on a failure that cannot happen

`builder/library.js:319`:

```js
function unplaced(row) {
  return row.role === 'site' && placedList(row).length === 0
}
```

[[REQ-181]] added this deliberately, and the code says why — it reads the two
facts as correlated by construction and concludes that *"an empty `placed_on` on a
site-role row is a failure rather than a category."* The badge carries a warning
glyph and this sentence:

> You asked for this to go on your site and it did not get there. It is still
> here — try adding it again.

**That was true when placement was attempted at upload. It has not been true since
[[BUG-47]].** `material.ts:674`, in the ingest path:

> **NO PLACEMENT HERE (BUG-47).** Which site was open when the file arrived is not
> where its bytes ended up […] `promoteToSiteAsset` writes `placed_on`, after the
> copy it records.

Nothing attempts a placement at upload. `placed_on` is written only when somebody
places the item — the client's **Use on site** button, or the consultant's
`place_on_site`. So `role === 'site' && placed_on === []` is not a failed
placement. **It is the ordinary initial state of every site-role upload**, from the
moment it lands until someone chooses to use it.

The badge therefore fires on every photograph a client gives us for their site, and
tells them something false: that they asked for something, that it did not arrive,
and that they should try again. Nothing was attempted and nothing went wrong.

**REQ-181's predicate lost its meaning when BUG-47 removed the placement it was
detecting.** The badge has had no failure to find since.

## What it should be instead

**One pill, one word, colour carries the state** (operator, 2026-09-18):

> there is one pill, it says (Site Asset). I would like to change the colour of
> the outline and the word depending on the state: used — colour it using the
> theme's accent colour; unused — colour it gray.

- The pill reads **Site Asset** in both states. The label does not change.
- **Used** — outline and word in the theme's accent colour.
- **Unused** — outline and word in grey.

**No second badge, no extra row, no more space than the pill already occupies.**
The operator's reason is the design constraint and is worth stating plainly:

> TBH this is NOT a very valuable thing for the user to know. I do not want to use
> a lot of real estate on it.

That settles it. Whether a photograph is currently in use is minor, ambient
information — the kind a client glances at, not the kind they are told. It gets a
colour, and nothing else.

**And it is never an error mark, in any register.** No warning glyph. No red,
amber, or any colour the rest of the builder uses for something wrong — grey is
the unused colour precisely because it is the absence of emphasis. No hint text
telling the client to try again or to fix anything. No difference in badge shape,
size or weight between the two states. A client who gave us twelve photographs and
used four has eight grey pills, and nothing has gone wrong.

**Drop `UNPLACED_LABEL` and `UNPLACED_HINT` entirely** (`library.js:170-172`).
There is no second string to maintain: one label, two colours.

### The accessibility point, and how to keep it for free

[[REQ-181]] was right that *"colour and shape are both redundant, so a screen
reader and a monochrome display each get the whole fact."* Colour alone does not
survive either reader.

**That does not overturn the design above**, because the operator has judged the
information minor — and minor information may be ambient. But it costs nothing to
keep it reachable: put the state on the pill as an `aria-label` or `title`
("Site Asset — in use" / "Site Asset — not yet used"). **Zero pixels, no layout,
and the fact stops being colour-only** for anyone who cannot use colour.

Recommended, not required. If it complicates the pill, drop it — but drop it
knowingly rather than by omission.

## Two things to keep from REQ-181

That ticket made two arguments that survive the predicate being wrong, and they
should not be discarded with it:

1. **Colour must not be the only carrier.** Its note is explicit — *"colour and
   shape are both redundant, so a screen reader and a monochrome display each get
   the whole fact."* The pill must still say its meaning in words. An accent pill
   and a grey pill that differ only in colour would fail exactly the readers that
   note was written for.
2. **`role` is the client's own statement of intent** and is worth showing. "For
   the site" versus "for you to read" is a real distinction and the pill is a
   reasonable place for it. What it must stop doing is treating the unfulfilled
   half of that intent as an error.

## Is there a real failure left to report?

Not one this predicate can see. A placement that genuinely fails does so inside
`promoteToSiteAsset`, which refuses and returns — and nothing records the attempt
on the row, so an observer cannot distinguish "refused" from "never asked". If a
genuine placement failure is worth surfacing later, it needs a recorded attempt to
hang off, and that is its own ticket rather than a reason to keep a badge that
cannot tell the two apart.

**Do not treat this as cosmetic.** Recolouring while leaving the predicate meaning
"failure" would leave a false claim in the code and in the hint text, waiting for
the next reader.

---

## Part 2 — the asset selector offers the wrong set (operator, 2026-09-18)

> When I open the asset selector from the editor mode on the site tab, that
> selector ONLY shows me images that are shown in the Library as being "On the
> site". This is wrong in two ways: the images without the error include images
> that are not on the site, and the selector needs to show all images — I am far
> more likely to want to select an image that is not yet used than one that is.

### What the picker actually lists

Not the pill, and not the Library. `edit.ts:803` builds the field's enum from
`imageHandles(slug)`:

```ts
async function imageHandles(slug, opts) {
  return (await listSiteAssets(slug, opts)).filter((a) => a.kind === 'image').map((a) => a.src)
}
```

So the picker offers **the site's own assets** — bytes already copied under the
draft's `assets/`, addressed as `/assets/<name>`. The Library is a different list
and the picker has never read it.

**That confirms the first half of the report, by a different route than expected.**
The no-pill set and the picker set are not the same set and were never computed
from each other: a `reference`-role image carries no pill and is not in the picker
either. They agree only by accident, for `site`-role items, which is most of what
a client uploads — which is exactly why the two read as one thing.

So the pill is not merely mis-worded (Part 1); it is also being taken as a
prediction of what the editor will offer, and it is not one.

### The principle (operator, 2026-09-18)

> **The picker needs to offer me what is in the Library. That is the primary
> purpose of the Library.**

This is not "also show the unplaced ones". It is a statement about what the
Library IS: the catalogue of everything this engagement has to work with, and the
list you choose from. **The site's own asset copy is an implementation detail and
should not be a list anybody picks from.** A client choosing a picture is choosing
from what they have; whether we have already copied the bytes under the draft is
our bookkeeping, not their category.

**The product already decided this — for the consultant.** `library-surface.json`
tells it, in these words:

> **Being on the site is a field on a catalogue item, not a different place to
> look.** An item that is on the site says so, in `placed_on`. An item that is not
> is still theirs, still described, still here — it simply has not been placed
> yet. **Do not think of these as two stores; think of one catalogue with a mark
> on some of its entries.**

The consultant is taught one catalogue with a mark. The builder shows the operator
two stores and lets them pick from the smaller one. **The same sentence that is
priming for the AI is the specification for this UI, and only one of the two
surfaces implements it.**

### The second half is the substantive change

The picker should offer the catalogue, not the site's copy of it. A client
choosing a picture for a page is choosing from *what they have*, and what they
have is the Library — with the ones already in use marked, not the ones not yet
used omitted.

**The capability already exists; it is in the wrong place.** `promoteToSiteAsset`
is what the Library's own **Use on site** button calls (`library.ts:13`), and
`place_on_site` is the consultant's equivalent. The operator's workflow today is
to leave the editor, find the item in the Library, place it, and come back to the
picker for it to appear. This collapses that into the pick.

### What the implementation has to get right

1. **Place on SAVE, not on pick.** The modal is *"staged, never committed"* —
   picking changes what `getValue()` reports and the modal's Save is the single
   flush point. Copying bytes onto the site at pick time would leave an asset
   behind when the client cancels. The pick stages an intent; Save performs the
   placement and writes the resulting `/assets/<name>` handle.
2. **An L1 `src` must stay a site-local handle.** `edit.ts:2530` composes
   `/assets/<name>`, and a Library uid is not one. The picker's VALUE is still the
   site handle; only its LIST widens. Nothing the write side validates changes.
3. **Rights refusals must be visible, not silent.** `promoteToSiteAsset` refuses
   anything not `republishable` — which is how `reference`-role and third-party
   material is kept off a published page. Those items should appear in the picker
   as unpickable WITH THE REASON, rather than being filtered out: a client who
   cannot find their own photograph has been told nothing, and this is the same
   mistake Part 1 makes in the other direction.
4. **Mark what is already on the site**, using Part 1's vocabulary — accent for
   placed, grey for not — so one set of words means one thing on both surfaces.
   This is why the two parts are one ticket: they are the same confusion between
   *what the client has* and *what the site is using*, and fixing either alone
   leaves the other still teaching it.

### What follows from the principle

**The picker's list is the Library's image set, full stop** — not the site's
assets, and not the Library filtered by anything the client did not ask for.
Everything in "What the implementation has to get right" above is about HOW a pick
becomes a valid `src`, not about which items appear. The list is decided here.

**"On the site" becomes a mark on an entry, not a membership test.** That is Part
1's accent/grey pill, now doing the job it should always have had: telling the
client which of their pictures are in use, on the one list where all of their
pictures are.

### Scope note

Part 2 is larger than Part 1 and touches the write path. If it will not sit on one
branch, split it — but keep the vocabulary decision (accent/grey, and the words)
in whichever lands first, so the two surfaces never disagree in flight.
