---
uid: request-f7321dfb
id: REQ-288
type: request
title: Fixing image titles for resizing
created_by: martin-github@westhead.me
created_at: '2026-09-20T23:50:27.799384+00:00'
updated_at: '2026-09-20T23:51:13.593190+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-027b6e4c
---

`transform`** should accept a static translate, in percent of the node's own size**

**Add:** `translateXPct`, `translateYPct` (and optionally `translateXPx`, `translateYPx`) to the `transform` type, applied at paint time, layout unaffected — CSS `transform: translate` semantics.

**Why percent-of-self matters.** A pixel offset is a different number at every width whenever the node's size is responsive, so it needs per-width keyframes and drifts between them. A percentage of the node's own rendered box resolves correctly at every width with a single value and no keyframes.

**The case that produced this.** Lagrange Foundry: four illustration plates, each with a small copper caption plaque that should hang half off the picture's bottom edge like a museum label. Three of the four sit nested inside a section's reading column, which _wraps_ at narrow widths — the column's width jumps rather than sliding, so pinned `geometry` keyframes cannot track it and the plaque drifts into the middle of the picture between stored widths. There is currently **no way to overlap two elements except by pinning coordinates**, so the effect had to be abandoned. With `translateYPct: 50` on a plaque sitting in normal flow, it works at every width with one value.

**Also settle:** paint order for overlapping siblings (later-over-earlier is the sensible default); and that a node translated outside its parent's box still paints rather than being clipped.

**Precedent:** the `motion` type already carries `offsetXPx`/`offsetYPx`, so the renderer can already emit a translate — this exposes it as a static paint offset.

**Rejected:** signed padding (overloads a layout property with a paint one); a stack `overlap` mode or anchored-sibling positioning (much larger spec, and doesn't subsume "by half my own height").