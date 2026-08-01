---
uid: request-66e4c630
id: REQ-118
type: request
title: 'Image selection: click image segment → asset picker → structured src edit'
created_by: xgd
created_at: '2026-07-31T20:43:35.481921+00:00'
updated_at: '2026-07-31T20:43:35.481921+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  depends_on:
  - request-395b67e6
  auto_merge_back: true
  needs_review: false
---

## What this builds

**Image selection** — click an image on the page, pick a different one. The second half
of phase 1's promise (copy *and* images), reusing T3's edit loop end to end.

Phase 1 ticket **T4** of [[DOC-28]] §12. Design: [[DOC-28]] §9.2.

## Scope

- **Click an image segment** (stamped by T2) → an **asset picker** listing the site's
  assets → choosing one writes the L1 `image` node's `src` / `asset-ref`.
- The edit goes through **T3's existing loop** — structured diff → shared validator →
  apply to draft → re-render → refresh. No second write path.
- `alt` text is a copy field and is editable in the same modal.
- The picker is the site's asset store surfaced as a modal. It is the same surface a
  future **asset browser mode** would present ([[DOC-8]] §3.2) — build it so the
  listing is reusable rather than welded into the modal.

## Non-goals — deliberately deferred, not forgotten

**Framing controls** (crop, scale, scrim, rotation, edge effects, free positioning) are
**not in this ticket**. They are blocked on [[DOC-28]] §13 Q5, which must be closed
first:

> The capture/fold pipeline already folds crops and scrims into L1. The editor must
> write **the same fields**, not a parallel vocabulary. Confirm they are identical
> before building any framing control.

When they land, all of them are **non-destructive structured parameters** the renderer
applies — never a newly baked file. One uploaded asset, many framings; the asset store
stays clean and the edits stay round-trippable and undoable like every other structured
edit.

Also out: asset **upload** (the picker lists what exists), and any image processing.

## Acceptance criteria

1. Clicking an image segment in Edit mode opens a picker of the site's available
   assets.
2. Choosing an asset updates the L1 `image` node, re-renders, and the iframe shows the
   new image.
3. The change is applied through **T3's loop and validator** — no separate write path,
   demonstrated by test.
4. `alt` text is editable alongside the image and is saved in the same diff.
5. An asset reference that fails validation is not applied; the draft is unchanged.
6. Nothing is baked: the asset file itself is untouched, and the change is expressed
   entirely as a structured field.
7. The asset listing is callable independently of the modal (so an asset browser mode
   can reuse it).
