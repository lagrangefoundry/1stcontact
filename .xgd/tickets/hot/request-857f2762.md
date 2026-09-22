---
uid: request-857f2762
id: REQ-301
type: request
title: Copy an existing page to a new one, content and all
created_by: xgd
created_at: '2026-09-22T21:50:10.208614+00:00'
updated_at: '2026-09-22T22:18:41.529965+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-7fd5af2d
  commits:
  - working_sha: 7ab878e7317a50a6da18dee6f4fbe95875227b24
    reconcile_sha: null
    main_sha: null
  version: 0.2.323
  story_points: 3
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

---

## What is being built

`copy_page(from, page, path, title)` — one write operation on the L1 control
surface, declared in the `ManagePages` capability group beside `add_page`,
`update_page` and `remove_page`, and a `1c page copy <slug> <from> <new-id>`
subcommand over the same function, so the CLI and the assistant author a copy
with one vocabulary.

What it does:

- Creates a new page whose definition **is** the source page's, under a new id,
  a new path and a new title. The L1 document comes across — that is the
  content **and** the page style (background, text colour, widths, column), since
  both live in the page's document. So do the mounted components with their
  configuration and their slot bindings, the search/share metadata, and the page
  kind (an email page copies as an email page, subject and declared placeholders
  included).
- `path` defaults to the new page id, exactly as `add_page` defaults it.
  `title` defaults to the source page's title — a copy that arrives untitled is
  not a copy.
- **Images are referenced, not duplicated.** The copy carries the same `src`
  handles; no bytes are written and the site's asset list is unchanged.
- **Refusals**: an unknown source page is `NOT_FOUND`; a new id already in use, a
  new path already in use, or a page file already stored under that name is
  `CONFLICT`. A refusal validates the whole resulting site before writing
  anything, so it leaves the draft byte-unchanged.
- The write is journalled like every other write and returns the site's change
  count.
- Navigation is untouched. `add_page` adds no nav entry and neither does this;
  which pages are in the menu stays a separate, deliberate decision.

**The copy is a page like any other**: it appears in `list_pages`, `describe_page`
maps it, and `set_l1` / `set_page_style` land on it immediately. That is what
makes this request independent of the blocker filed alongside it — a copied page
is born holding a document root, so nothing here waits on `add_page` learning to
scaffold one.

## Element ids: the premise in this request is wrong, and the copy is better for it

The request assumed ids must be rewritten "since duplicates are refused". They
are refused, but the rule is **per page**: a node id must be unique within its
own document, because it becomes a real DOM id on that page. Module ids are
unique within a page too. The only site-wide uniqueness is the page id and the
page path, and this operation is given fresh values for both.

So a verbatim copy is already valid, and keeping the ids is strictly safer than
renaming them: every intra-page reference survives by construction rather than by
a rewrite remembering to catch it — the `action` that opens a dialog by id, the
`for`↔`id` wiring a control's accessible name is built from, and a `#fragment`
link. **No ids are renamed and none need to be.**

Hrefs are left alone for the same reason they are content rather than structure:
a copied menu should still point at the site's real pages, and a fragment-only
link already resolves inside the copy.

## Why this is one function rather than a transcription loop

A page is `{ id, slug, title, kind?, email?, seoMeta?, modules[], l1? }`. A copy
is that object with three fields replaced. Everything the request lists as
needing care — document, style, components, image handles — is carried by
copying the object, not by walking it. The identity checks (`id` free, `path`
free, file name free) are the ones `add_page` already performs, and they are
lifted into one helper both operations call so the two cannot come to disagree
about what makes a page id available.

## Test plan

`tests/test_UAT_FC_REQ-301_copy_page.test.ts`, driving the real consultant
toolbox (`createL1Toolbox`) with its real grant rather than the edit function
directly — a test calling the edit function would prove a page can be copied and
say nothing about whether the assistant can reach it.

1. **Content, style and components come across.** A copy of a page carrying text,
   an image, a page style and a configured component is identical to the source
   but for id, path and title.
2. **The copy is immediately editable** — `set_l1` and `set_page_style` land on it
   with no scaffolding step, which is the independence-from-the-blocker claim.
3. **Ids are preserved and intra-page references survive** — a dialog and the
   action that opens it still resolve on the copy, and the resulting site
   validates.
4. **Images are referenced, not duplicated** — the asset list is unchanged and the
   copy's `src` handles are the source's.
5. **Refusals**: unknown source is `NOT_FOUND`; a taken id and a taken path are
   both `CONFLICT`; and the draft is unchanged after a refusal.
6. **Defaults**: `path` falls back to the new page id, `title` to the source's.
7. **No new surface**: `copy_page` is declared, is in `ManagePages`, and is
   reachable from the toolbox with the grant that already exists.
8. **One vocabulary**: `1c page copy` drives the same function and produces the
   same page, so the CLI and the assistant cannot come to disagree about what a
   copy is.