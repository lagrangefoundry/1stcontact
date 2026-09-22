---
uid: request-279636f6
id: REQ-300
type: request
title: A newly created page cannot be given any content — add_page produces a page
  with no L1 document and no operation can create one
created_by: xgd
created_at: '2026-09-22T21:49:40.012443+00:00'
updated_at: '2026-09-22T22:03:11.332663+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-84ac02a3
---

## What I was trying to achieve

Create two additional pages on an existing site and populate them with content, so a client could switch between them in the page selector and compare two design treatments side by side.

## What stopped me

`add_page` succeeds and the page appears in `list_pages` and in the page selector, but it has **no L1 document**. Every operation that could put content on it refuses, because they all assume a document root already exists:

- `set_l1` at path `0` → `NOT_FOUND` — *"Page 'X' has no L1 document"*
- `set_page_style` (any style object) → `NOT_FOUND` — *"Page 'X' has no L1 document"*
- `add_component` with a valid config → `SCHEMA_INVALID` — *"module 'probe' names slot 'main' but the page has no L1 document to mount into"*

`describe_page` on the new page returns `segments: []`, `components: []`, `style: {}`.

There is no operation in the grant that creates a document root. `set_l1` is documented as replacing the element at an address; on an empty page there is no address to replace, and no address can be brought into existence. The page is therefore permanently unreachable — it can be created, renamed, re-pathed and deleted, and nothing else.

## Reproduction

1. `add_page` with a new id and path.
2. `describe_page` on it — `segments` is empty.
3. `set_l1` page=<new id>, path=`0`, node=`{"kind":"stack","id":"root","children":[],"sizing":{"width":{"mode":"fluid","maxPx":880}}}` → `NOT_FOUND`.

Confirmed three independent ways from the consultant session, and independently by two delegated builder workers on separate sessions, each of which read the source page in full and then hit the identical wall. Neither worker found a path through; both reported it as a structural blocker rather than a configuration error.

## Why this is severe

The site's existing page was scaffolded at site-creation time, so it has a root and is fully editable. That masks the defect completely during ordinary work: every edit is a replacement of something that already exists, so the gap is invisible until the first time anyone adds a page. The practical effect is that **a site can never gain a second page** — the product is a one-page-site builder, and the failure surfaces only after the client has been told a new page is being built.

## What would have let me finish

Any one of these:

1. **`add_page` scaffolds a minimal document root**, exactly as site creation already does for the initial page. This is the smallest change and it makes the existing tools sufficient — probably a matter of reusing whatever the site scaffolder already calls. Strongly preferred.
2. **`set_l1` accepts a write at path `0` on a page with no document**, treating it as creating the root rather than replacing it. Slightly more surprising semantically, but it means no new operation.
3. **A distinct `init_page_document` operation.** Least attractive: a step every caller must remember, and forgetting it produces exactly the failure above.

## Related

A companion request has been filed for a page-copy operation. That one is a convenience; this one is a blocker, and copy is worth little until this is fixed.

-