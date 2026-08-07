---
uid: capability-12fee326
id: CAP-87
type: capability
title: 'In-Page Copy Editing: The Click-to-Edit Gesture'
created_by: xgd
created_at: '2026-08-07T02:14:29.161954+00:00'
updated_at: '2026-08-07T02:14:29.161954+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: In-Page Copy Editing
---

The operator's **edit gesture**: turning a place on the rendered page into a
change to the site definition, in a real browser.

This capability owns everything between the pointer and the write path:

- showing which region is about to be edited, and resolving a click on the page
  to the one region the operator meant (innermost first, scoped to a behavior
  module's instance and slot when the click lands inside one);
- the form that opens over that region's exposed fields, and the rule that one
  confirmed form is exactly one change;
- what the operator sees afterwards — the page showing the new words, the
  gesture still live on the replaced page — and what they see instead when the
  edit is refused, when the region has nothing to edit, or when the rendering
  they are pointing at is too old to carry an address;
- the guarantee that a page being *viewed* is not a page being edited: the
  gesture attaches only to an editable rendering, so viewing behaves exactly as
  published.

Out of scope: the validated write path itself and its addressing contract
(Structured Copy Editing), the workspace chrome and origin that host the page
(Builder Workspace), and the rendering that stamps addresses onto elements
(Edit Render Channel).
