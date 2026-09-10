---
uid: request-f51c8748
id: REQ-222
type: request
title: Publish builds the width ladder; the renderer emits srcset
created_by: EPIC-1
created_at: '2026-09-10T21:51:31.105525+00:00'
updated_at: '2026-09-10T21:56:05.269165+00:00'
completed_at: null
last_field_updated: depends_on
status: draft
fields:
  priority: medium
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-219
  chat_comment: comment-f3ebfc8a
---

## The gap

A photograph taken on a modern phone is several thousand pixels wide and several
megabytes. We serve it to every visitor at that size, on their phone, over their
data. The site is slow for a reason no one chose and the client is paying
bandwidth for pixels nobody can see.

There is nothing between the file a client uploads and the file the public
downloads.

## What changes

**The width ladder is built at publish, in the Worker, and it is JAMStack all the
way down.** `POST /api/publish` (REQ-149) already freezes the draft and writes
rendered bytes to R2; `public-site` only serves what is there. Sizing is part of
that render — nothing is resized on request, ever.

**Into the revision's own R2 prefix**, so the ladder is immutable and versioned
with the revision it belongs to. That is not a new idea imposed on the store: a
published revision is already a frozen byte snapshot, and this is more of the
same bytes.

**The draft gets no ladder.** It is not the public site. It serves the working
rendition, which halves the work and removes any question about keeping a
draft's sizes fresh as a client edits.

**Conventional widths, capped at the source.** Nothing is ever upscaled — a
client's 600px logo does not gain a fictional 2048px rendition. A picture smaller
than the smallest step is simply served as it is.

**`render.ts:2459` is the one place an `<img>` is emitted**, so it gains
`srcset` and `sizes` from the ladder manifest. **`assetRefSchema` does not
change**: it stays `{id, src, alt, focalPoint?}`, and the site document stays
innocent of delivery. Delivery is not a property of the document — it is a
property of the publish that rendered it.

**Renditions are content-addressed** on the original, the recipe and the width.
Publishes are frequent and image edits are rare, so republishing an unchanged
picture costs zero transforms. The material store already content-addresses
blobs (`t/<tenant>/blob/<sha256>`); this is that pattern, applied to derived
bytes.

**The client is never asked about any of this.** Delivery renditions are a
consequence of publishing, not a decision anyone should have to make about their
own photograph. A client answering *"what size should this be?"* is a question we
failed to absorb.

## The line between this and editing

Two axes, and conflating them is how a Library ends up holding five copies of
everything:

- **Editorial versions** are what the picture *is* — the recipe. Visible, the
  client's business, and theirs to change.
- **Delivery renditions** are the same picture at several widths. Invisible,
  derived, disposable, regenerated at publish.

`resize` exists in the editorial vocabulary for the case where a size is part of
what the picture is. The surface prose must state plainly that delivery sizes are
automatic, or the assistant will start hand-optimising bandwidth against this
ladder.

## Falls out of this

The chat's inline picture (REQ-217) wants a small rendition rather than the full
bytes constrained by a stylesheet. Once a ladder exists, it has one.

## Depends on

The renderer from the recipe ticket — the publish path applies a recipe and asks
for a width through the same call the editor and the assistant use.