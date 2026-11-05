---
uid: request-5765589a
id: REQ-282
type: request
title: '"Not on the site" is a state, not an error: an accent pill when placed, grey
  when not'
created_by: EPIC-19
created_at: '2026-09-19T00:58:36.186954+00:00'
updated_at: '2026-09-19T17:07:29.673232+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d2727e7d
  commits:
  - working_sha: 858ad99f72c785e721e63f4a2527c69231f11c6d
    reconcile_sha: null
    main_sha: null
  - working_sha: a9609cf82940297c3ba203bc3a0ff1c9a14e0a46
    reconcile_sha: null
    main_sha: null
  version: 0.2.282
  story_points: 8
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

**One pill, one word; colour and weight carry the state** (operator, 2026-09-18):

> there is one pill, it says (Site Asset). I would like to change the colour of
> the outline and the word depending on the state: used — colour it using the
> theme's accent colour; unused — colour it gray.

> please use bold face for in use as well as colour.

- The pill reads **Site Asset** in both states. The label does not change.
- **Used** — outline and word in the theme's accent colour, **and the word in
  bold**.
- **Unused** — outline and word in grey, at normal weight.

**Weight is the second channel, and it is the operator's own call.** The state is
therefore never carried by colour alone: it survives a monochrome display, a
colour-blind reader and a screen filter, because bold is still bold. That answers
[[REQ-181]]'s rule — *"colour and shape are both redundant, so a screen reader and
a monochrome display each get the whole fact"* — on the display half, at no cost
in space, which is what makes it a better answer than adding a second word.

**No second badge, no extra row, no more space than the pill already occupies.**
The operator's reason is the design constraint and is worth stating plainly:

> TBH this is NOT a very valuable thing for the user to know. I do not want to use
> a lot of real estate on it.

That settles the weight this gets. Whether a photograph is currently in use is
minor, ambient information — the kind a client glances at, not the kind they are
told. Colour and boldness, and nothing else.

**And it is never an error mark, in any register.** No warning glyph. No red,
amber, or any colour the rest of the builder uses for something wrong — grey is
the unused colour precisely because it is the absence of emphasis. No hint text
telling the client to try again or to fix anything. **Note which way the emphasis
runs:** the USED state is the emphasised one (accent, bold) and unused is the
quiet one. That is the opposite of today, where the unplaced item is the one that
shouts, and it is the whole correction in one detail.

**Drop `UNPLACED_LABEL` and `UNPLACED_HINT` entirely** (`library.js:170-172`).
There is no second string to maintain: one label, two treatments.

### One thing left for a screen reader

Bold covers a monochrome or colour-blind reader; it is not announced, so a screen
reader still gets one pill reading "Site Asset" in both states. An `aria-label`
carrying the state ("Site Asset — in use" / "Site Asset — not yet used") closes
that for zero pixels and no layout change.

Recommended, not required — and explicitly NOT a second visible word. If it
complicates the pill, drop it knowingly rather than by omission.

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


---

## What was built (both parts, one branch)

Part 2 did sit on one branch, so the split the scope note allows for was not
needed and the two surfaces landed together with one vocabulary between them.

### Part 1 — the pill

`builder/library.js`. `UNPLACED_LABEL`, `UNPLACED_HINT`, `WARN_GLYPH` and the
`unplaced()` predicate are deleted outright; the badge and its
`.builder-library__badge--unplaced` danger rule are gone from the stylesheet.
What replaces them is **a modifier on the role pill that was already there** —
`inUse(row)` is `placedList(row).length > 0`, and `is-placed` paints the pill in
`--shell-accent` at `font-weight: 700`. Unused keeps the muted colour and weight
`.builder-library__badge` already gave it, so the quiet state costs no rule at
all. No second badge, no extra row, no extra width.

The `aria-label` was taken: `Site asset — in use` / `Site asset — not yet used`,
on the pill, in both states. Zero pixels, no layout change, and the visible pill
still reads one word.

**The role pill is reused rather than joined** because the role IS the sentence
the ticket says to keep — "for the site" vs "for you to read" — and the state is
a treatment of that sentence rather than a second fact needing its own space.

### Part 2 — the picker

**The catalogue is computed in `material.ts`, beside `listMaterial`**, because
that is the one definition of "the client's material" and a second reading of it
assembled in the router would be a second answer to a question the Library tab
already answers. The site's half comes through `listSiteAssets` — the same
listing `imageHandles` reads — so the picker and the write side cannot disagree
about what the site holds.

- `pictureChoices(tickets, sites, slug)` → `PictureChoice[]`:
  `{ value, label, placed, place?, reason? }`. Library first (newest first, which
  is where a just-uploaded picture wants to be), then any site asset no material
  accounts for.
- A Library picture **already on this site offers its site handle**, marked
  placed, asking for no placement — one entry, not two. That needed the recorded
  name, so `MaterialRow` gained `placed_as` beside `placed_on`: the first says
  *is it on a site*, the second says *which file is it there*, and only the
  second can name the handle a page already references.
- **Not republishable → shown with the reason**, never filtered out.
  `NOT_REPUBLISHABLE_SHORT` sits beside `NotRepublishableError` so the tile's
  width and the full sentence cannot drift.

**The list widened and the value did not.** `copyFieldsOf` is untouched: the
descriptor's `enum` is still the site's handles, which is what an L1 `src` may
hold and what the write side validates. The catalogue rides beside it on the
`/api/copy` envelope as `pictures`, the way `palette` already does — two
genuinely different questions, asked in one response.

**Place on SAVE, at the single flush point.** A pick of something not yet on the
site stages `library:<uid>`; the modal's Save posts `place: { src: <uid> }` in
the same body as `values`, and the router turns each one into a handle through
`placePicture` → `promoteToSiteAsset` before `editCopySet` runs. So:

- a cancelled modal leaves no asset behind;
- the rights gate, the byte copy across the bucket boundary, the recipe applied
  on the way, the first-vs-re-placement rule and the `placed_on` record are all
  inherited from `promoteToSiteAsset` rather than restated;
- a refusal is a 403 carrying its own sentence, and the draft is byte-unchanged
  because the placement runs before the write;
- re-picking a picture that is already placed costs no write at all.

`place` is a separate key rather than a magic value inside `values` so that a
`library:` token never has to be told apart from a client's own alt text. Two
guards keep the failure mode loud if the resolution is ever skipped: the enum,
and the envelope validator's URL-scheme allowlist, which refuses a `library:`
scheme outright.

**An origin with no Library still works.** The `1c` dev builder is a site store
with no ticket store, and `BlobsNotConfiguredError` is its named way of saying
so — that one refusal is absorbed and `pictures` is omitted, so the picker draws
the descriptor's own `enum`, which is genuinely every picture such a deployment
has. Any other failure travels out as itself rather than quietly handing back the
narrow list this ticket exists to widen.

**The tiles use Part 1's vocabulary**: the name is accent + bold when the picture
is in use, ordinary when it is not, with a clipped `— in use` / `— not yet used`
for a screen reader. A blocked tile is dimmed, its radio disabled, and its reason
drawn under the name.

### What was deliberately not done

- **No "Use on site" button was added to the Library tab.** The picker collapses
  that round trip into the pick, which is the workflow the report is about.
- **The CLI's `1c copy get` is unchanged.** It answers for what a node may hold;
  the AI reaches the Library through `place_on_site` and its own catalogue.
- **No recorded placement-attempt.** The ticket's own conclusion stands: a
  genuine placement failure needs something to hang off, and that is its own
  ticket.

### Test plan

New:

- `tests/test_UAT_FC_REQ-282_a_state_not_an_error.test.ts` (jsdom, real Library
  panel) — one pill and one word in both states with no second badge; the
  emphasis on the used one, asserted against the stylesheet (accent + weight, not
  danger); nothing marking an error in any register, including that the strings
  and the predicate are gone from the source; the state in words for a screen
  reader and explicitly not a second visible word; background information never
  marked in use.
- `tests/test_UAT_FC_REQ-282_the_picker_offers_the_library.workers.test.ts`
  (workerd, real D1 + two real R2 buckets + the real route table) — an unused
  Library picture is offered and carries the material a Save must place; a placed
  one offers its site handle once; a non-republishable one is offered with the
  reason; a site asset no material accounts for survives; the envelope carries
  the catalogue while the descriptor's `enum` does not widen; a Save places the
  bytes, records `placed_on` and writes `/assets/<name>`; a refusal is a 403 and
  the draft is untouched; placing twice replaces rather than mints.
- `tests/test_UAT_FC_REQ-282_the_picker_stages_a_placement.test.ts` (jsdom) —
  every catalogue entry gets a tile; an unplaced one draws its thumbnail from the
  Library; the mark is Part 1's vocabulary; blocked tiles are shown, unpickable,
  with the reason; a pick is staged and names the material to place; the node's
  current handle is always among the tiles; an origin with no catalogue marks
  nothing; the transport sends `place` in the same body as `values`.

Updated, because REQ-282 supersedes the predicate they were written against:

- `test_UAT_FC_REQ-181_library_badges_the_exception` — the two warning cases are
  removed and the header records the split; what survives (no placement pill, no
  "used on this site" filter, the Library cannot ask which site is open) is
  unchanged.
- `test_UAT_FC_BUG-47_library_agrees` — "which rows are warned" becomes "which
  rows are marked in use", which is the same fact read the right way round.
- `test_UAT_FC_REQ-213_library_role_field` — a role correction that places now
  shows the pill turning accented; one that could not place shows a quiet pill
  and no error, rather than a warning.


### Verification

Run on the branch before merge-back, all in the foreground:

- The three new suites — 19 tests, all passing (12 jsdom, 7 workerd).
- The three superseded suites as updated — 16 tests, all passing.
- Full suite: **5101 passed, 103 skipped, 3 failed.** The three failures
  (`BUG-67_backend_settings`, `BUG-50_builder_env_files`,
  `bug32-webui-scope-rebrand`) are pre-existing: they fail identically on
  `xgd-working` at the merge base, in files this ticket does not touch.
- `tsc --noEmit` clean on both `apps/control-app` and `tools/generate`.