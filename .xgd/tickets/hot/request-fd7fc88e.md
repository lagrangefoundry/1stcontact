---
uid: request-fd7fc88e
id: REQ-69
type: request
title: '[superseded by REQ-68] services-grid raw card fill/gradient/badge'
created_by: xgd
created_at: '2026-07-18T15:22:00.385112+00:00'
updated_at: '2026-07-19T00:44:47.676239+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Goal
Let a services-grid **card** author a raw `surfaceFill` (absolute `#hex` or role) and a
`surfaceGradient` panel, and a **badge** author a raw `fill` — instead of only the fixed
`surface`/`variant` enums. Closes gigabytealchemy Type-A gaps ([[REQ-64]]): the last
stacked card's `#e8dfd3` fill, and the `Coming soon`/`In development` badge fills
(`#dbeafe`/`#d0fae5`) are not expressible today.
## Scope
- `ServiceItem.surfaceFill?` — absolute `#hex` OR palette role (resolveColor); inline card
  background, overriding the veil/surface class.
- `ServiceItem.surfaceGradient?` — a `TextRunGradient` panel (resolveSurfaceGradient); inline
  card background, taking precedence over `surfaceFill`.
- `ServiceItem.badge.fill?` — absolute `#hex` OR role; inline badge background over the variant.
Each is an inline style only when authored (omitted == today).


---
**Superseded:** implemented and shipped under REQ-68 in commit `33c0bc78` (both module
generalizations landed together in one free-coded commit). No separate commit for this ticket.