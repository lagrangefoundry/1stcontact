---
uid: request-5765589a
id: REQ-282
type: request
title: '"Not on the site" is a state, not an error: an accent pill when placed, grey
  when not'
created_by: EPIC-19
created_at: '2026-09-19T00:58:36.186954+00:00'
updated_at: '2026-09-19T00:58:36.186954+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
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

**A state, not an exception** (operator's proposal, adopted): whether an item is on
the site is a fact about the item, and both values are ordinary.

- **On the site** — the pill carries the theme accent.
- **Not on the site** — the pill is grey.

No warning glyph, no red, no hint text telling the client to try again. The words
stay: "Not on the site" is accurate and worth saying, it is only the framing that
was wrong. A client who gave us twelve photographs and used four has eight grey
pills and nothing has gone wrong.

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
