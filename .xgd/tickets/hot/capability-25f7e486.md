---
uid: capability-25f7e486
id: CAP-84
type: capability
title: 'Edit Render Channel: The Editable Page Surface'
created_by: xgd
created_at: '2026-08-06T21:24:28.756773+00:00'
updated_at: '2026-08-07T16:03:48.647383+00:00'
completed_at: null
last_field_updated: status
status: superseded
fields:
  name: edit_render_channel
  superseded_by_uid: capability-12fee326
---

# Capability: Edit Render Channel — The Editable Page Surface

**Rendering a site's page so it can be edited rather than used: deliberately
non-functional, showing all its content at once, and stamped so every editable
region can be mapped back to the definition that produced it.**

A site's pages are rendered for two audiences today — the visitor (the published
channel) and the operator reviewing a draft (the preview channel). Both render a
page that *works*. Editing needs a third audience and a third page: one where a
link must not navigate, a form must not submit, an animation must not hide the
copy it animates, and every region a person can change is visibly marked and
individually addressable.

This capability owns that third render. It is renderer-side and observable
entirely on rendered output; the editor UI built on top of it (hover treatment,
modals, click handling) is a separate capability.

## Scope

- **The channel** — a third render of the same definition through the same
  renderer, landing in its own output location, never published, never
  content-addressed and never entering a site's revision history.
- **Deliberate inertness** — no navigable link target, no form action or submit
  verb, no behaviour or motion code shipped beside or inside the page.
- **The settled state** — content renders in its final state rather than its
  initial one, so nothing that a visitor's interaction would have revealed is
  hidden from the person editing it. Each behavior module declares what its own
  behaviour-off state looks like.
- **Derived segmentation** — which regions are editable is derived from the
  definition's own structure rather than declared on it, so no page becomes
  silently uneditable through an omitted annotation.
- **Addresses and outlines** — every segment carries a render-scoped address
  that resolves to exactly one node in the definition, and a faint outline drawn
  by the renderer that cannot alter the page's geometry.

## Out of scope

- The editor UI itself — click handling, modals, hover affordances, structural
  editing.
- Any change to the published or preview channels, whose bytes this capability
  must leave untouched.