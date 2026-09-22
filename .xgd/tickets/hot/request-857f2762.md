---
uid: request-857f2762
id: REQ-301
type: request
title: Copy an existing page to a new one, content and all
created_by: xgd
created_at: '2026-09-22T21:50:10.208614+00:00'
updated_at: '2026-09-22T21:50:10.208614+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What I was trying to achieve

Show a client two alternative design treatments of their home page, as real pages they could switch between in the page selector and compare against the original — rather than describing the treatments in prose or destructively restyling the only page they have.

Both alternatives keep the page's content identical and change only its palette, type scale and column proportions. The content is settled and is the client's own writing; reproducing it was pure transcription with no decisions in it.

## What stopped me

Two things, and the second is what this request is about.

The blocker is filed separately: a newly created page has no document root and cannot be given content at all.

Even with that fixed, there is no way to copy a page. Producing a restyled variant means reading every element of the source page one at a time and writing each one out again on the target. For the page in question that is thirteen top-level elements, several of them deeply nested, and the writes must be sequenced because duplicate element ids are refused — so a page cannot be assembled in one call and must be appended section by section.

I delegated this to two builder workers, precisely because it is a large payload with small decisions. Each read the source page in full — which is most of the cost — before hitting the blocker and returning nothing. That transcription work has to happen on every variant, every time, and it is the single most mechanical thing available to do on this surface.

## What would have let me finish

An operation that creates a new page as a copy of an existing one, with its document, its content and its page style, under a new id and path:

```
copy_page(from: <page id>, page: <new id>, path: <new path>, title: <new title>)
```

Points worth settling in the spec:

- **Element ids must be made unique**, since duplicates are refused. Either namespace them to the new page or suffix them; either is fine as long as intra-page references survive the rewrite.
- **Components should come across with their configuration**, mounted in the corresponding seams.
- **Images should be referenced, not duplicated** — the same `src` handles, no new files on disk.
- **Page style copies too** — background, text colour, widths, column. A copy that arrives unpainted is not a copy.

## Why it is worth building beyond my immediate case

- **Design comparison.** Two treatments of one page, side by side, is the most direct way to put a real design decision to a client. Describing a dark treatment in prose is not remotely the same as letting them switch between it and the original.
- **Safe experiments.** Copy, restyle the copy, keep or discard. Today a significant restyle must be done destructively on the live draft and reversed change by change if the client dislikes it.
- **Repeated page shapes.** Any site with several pages sharing a layout — case studies, services, team pages — currently means transcribing that layout by hand for each one.

## Priority

Lower than the blocker it is filed alongside. Copy is a convenience; being unable to populate a new page at all is a hard stop. But copy is where nearly all the token cost of building a second page actually sits, so the two together are worth much more than the blocker alone.
