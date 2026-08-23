---
uid: request-6a8efe0f
id: REQ-105
type: request
title: 'L1 slot cannot be sized: hoist sizing to a shared shape the way REQ-98 hoisted
  paint'
created_by: xgd
created_at: '2026-07-27T21:24:02.786215+00:00'
updated_at: '2026-08-06T04:54:58.116951+00:00'
completed_at: '2026-08-06T04:54:58.116951+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 518c809b14ec5da541c7fdef58bbd2186652dfd9
    reconcile_sha: null
    main_sha: null
  version: 0.0.222
  story_points: 2
  bundled_in: bundle-ee56a66e
  chat_comment: comment-a65908b7
---

## The gap

`l1SlotSchema` is the one box-rendering node kind with no `sizing`.

REQ-98 made the *paint* group uniform — `l1SurfaceAxesSchema` is spread into
`box`, `container`, `text`, `image`, `slot` and `control` alike, so a slot can be
filled, bordered, rounded and shadowed. But `sizing` was left declared per-kind,
and `slot` never got it:

| kind | `axes` (REQ-98) | `sizing` |
|---|---|---|
| `box` | ✅ | ✅ |
| `container` | ✅ | ✅ |
| `text` | ✅ | ✅ (REQ-97) |
| `image` | ✅ | ✅ |
| `control` | ✅ | ✅ |
| **`slot`** | ✅ | **✗** |

So a mounted behavior module cannot be given a measure or a maximum width. The
seam can be painted but not sized.

## Why it matters

This is the same asymmetry REQ-98 was written to remove, surviving in the one
axis group REQ-98 did not cover — and REQ-97 had already removed exactly this
wrapper tax from `text` one kind earlier. The pattern is now clear enough to
generalise rather than patch a third time.

The workaround is a container that exists only to size the slot: a node with no
content, no paint and no semantic role, present purely because the slot cannot
carry a number. REQ-95 pays it on xgd.dev's beta-capture form. It is cheap in
isolation and corrosive in aggregate — it is the "two nodes for one element"
shape REQ-98 names as the hole in the REQ-96 contract.

## Proposed shape

Hoist `sizing` the way REQ-98 hoisted the surface group: declare it once and
spread it into every kind that renders a box, `slot` included. That is a strictly
additive change — every kind that already carries `sizing` keeps the identical
`l1AxisSizingSchema` shape, and `slot` gains it.

The renderer needs no new logic: a slot already renders as a `div` with an L1
class, so the existing sizing emitter applies unchanged.

Worth checking the same way for the remaining node-level groups (`geometry`,
`visibility`, `transform`, `mask`, `padding`, `responsivePadding`, `interaction`,
`reveal`) — those already appear uniform, but they are declared by hand per kind
and so can drift again the next time a kind is added. A single shared shape ends
the class of bug rather than this instance of it.

## Acceptance criteria

1. A `slot` node accepts `sizing` with the same `l1AxisSizingSchema` shape as
   every other kind, and the renderer honours it.
2. xgd.dev's sizing-only wrapper container around the `signup-form` slot is
   removed, and the form renders identically.
3. Node-level axis groups are declared once and spread, not re-declared per kind,
   so a new kind inherits them.
4. Every existing L1 page renders unchanged.

## Evidence

REQ-95 pass 2 — `storage/sites/xgd/draft/pages/home.json`, the `signup` block.

-