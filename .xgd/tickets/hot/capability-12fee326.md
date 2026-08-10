---
uid: capability-12fee326
id: CAP-87
type: capability
title: 'In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture'
created_by: xgd
created_at: '2026-08-07T02:14:29.161954+00:00'
updated_at: '2026-08-10T08:50:29.529995+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: In-Page Copy Editing
  uat_coverage: fail
---

# Capability: In-Page Copy Editing — The Editable Render & The Click-to-Edit Gesture

**The operator-facing editable page, end to end: the render that makes a page
editable rather than usable, and the gesture that turns a place on that page into
a change to the site definition, in a real browser.**

This capability owns everything between the pointer and the write path, together
with the rendering that gesture requires. The two were previously separate
capabilities; they are consolidated here because neither is observable without the
other — an address stamped by the render is only meaningful to the gesture that
resolves it, and the gesture is undefined on any other rendering.

## Scope

### The edit render channel
A site's pages are rendered for two audiences today — the visitor (published) and
the operator reviewing a draft (preview). Both render a page that *works*. Editing
needs a third:

- **The channel** — a third render of the same definition through the same
  renderer, landing in its own output location, never published, never
  content-addressed, and never entering a site's revision history.
- **Deliberate inertness** — no navigable link target, no form action or submit
  verb, no behaviour or motion code shipped beside or inside the page.
- **The settled state** — content renders in its final state rather than its
  initial one, so nothing a visitor's interaction would have revealed is hidden
  from the person editing it. Each behavior module declares its own behaviour-off
  state.
- **Derived segmentation and addressing** — which regions are editable is derived
  from the definition, and every editable region is stamped so it maps back to the
  definition that produced it.

### The click-to-edit gesture
- Showing which region is about to be edited, and resolving a click on the page to
  the one region the operator meant — innermost first, scoped to a behavior
  module's instance and slot when the click lands inside one.
- The form that opens over that region's exposed fields, and the rule that one
  confirmed form is exactly one change.
- What the operator sees afterwards — the page showing the new words, the gesture
  still live on the replaced page — and what they see instead when the edit is
  refused, when the region has nothing to edit, or when the rendering they are
  pointing at is too old to carry an address.
- The guarantee that a page being *viewed* is not a page being edited: the gesture
  attaches only to an editable rendering, so viewing behaves exactly as published.

## Out of scope

- The validated write path itself and its addressing contract — owned by
  **Structured Copy Editing**.
- The workspace chrome and origin that host the page — owned by **Builder
  Workspace**.