---
uid: request-129b5b14
id: REQ-327
type: request
title: Zoomable images — let a visitor open a picture large
created_by: xgd
created_at: '2026-09-25T23:28:56.882077+00:00'
updated_at: '2026-09-25T23:28:56.882077+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What I was trying to achieve

Let a visitor click or tap an image on the page and see it **large** — filling the viewport, on a dimmed ground, dismissed by clicking away or pressing Escape.

The case: a site whose argument is carried by four detailed illustrated plates. At their placed width the fine detail — including lettering that is part of the artwork's meaning — is unreadable. The images are the most memorable thing on the page and a visitor currently cannot actually look at any of them.

## What stopped me

There is no way to make an image interactive beyond wrapping it in a link to another page, and no component in the catalogue does this. A link to a standalone page showing the image is a poor substitute: it navigates away, loses scroll position, and turns looking closely into leaving.

## What would let me finish

Either would do:

**A — a field on the picture element.** Something like `zoomable: true`, with the platform supplying the overlay, the dismiss affordances and the focus handling. Cheapest for an author and impossible to get wrong. Worth including an optional larger source, so the zoomed view can use a higher-resolution original than the placed one.

**B — a lightbox component.** Takes a set of images with captions, supplies the overlay and (optionally) next/previous between them. More capable — it gives a gallery — but needs mounting and configuring where A is one field.

I would start with A. Most uses are one image opened on its own, and B can arrive later for genuine galleries.

## Things to settle either way

- Dismiss on click-outside and on Escape.
- Focus moves into the overlay and returns to the trigger on close; the page behind does not scroll while it is open.
- The cursor should indicate the image is openable — otherwise nobody discovers it.
- Which source is shown: placed width is often too small, so the zoomed view should use the original asset rather than a rendered variant.