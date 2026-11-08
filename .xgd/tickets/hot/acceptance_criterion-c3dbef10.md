---
uid: acceptance_criterion-c3dbef10
id: AC-2367
type: acceptance_criterion
title: The invite dialog's Subject, To-List and Body fields lie wholly within the
  dialog panel at desktop width and in narrow viewports
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:53:41.325646+00:00'
updated_at: '2026-11-08T02:53:41.325646+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Opening the invite dialog from the Contacts tab (tick one or more contacts, press
**Invite**) shows a composer — Subject, To-List and Body — that lies wholly
inside the dialog panel. Measured in a real browser against the source
stylesheet, with the product's own fonts loaded:

- at a desktop viewport (1280px wide), the right edge of each of Subject, To-List
  and Body is at or inside the panel's content right edge, and the left edge of
  each is at or inside the panel's content left edge;
- at a narrow viewport where the panel is bound by the window rather than by its
  own maximum width, the same holds;
- each field keeps a real width (it is not collapsed to nothing to fit), so
  fitting is not achieved by the composer disappearing.

The dialog holding the composer takes the copy width that the dialog gives its
other copy-sized surfaces (the copy editor, picker and reader), not the narrower
width of a one-sentence message dialog. The composer asks for no width of its own
beyond what the panel gives it, so it can never be wider than the panel in any
viewport. The fields, their order and their labels are unchanged.

## Verification

In a real browser (Playwright against the local builder origin; jsdom performs no
layout and cannot measure this), mount the Contacts panel, tick a contact and open
the invite dialog. At 1280px and again at a narrow viewport, assert for each of
Subject, To-List and Body that its bounding box lies between the panel's content
left and right edges and that its width exceeds a non-trivial floor. A host with
no usable browser skips the measurement loudly, never passes it silently.

Always, without a browser: assert the stylesheet's narrow-message-dialog rule
names the invite composer among the surfaces that keep the copy width, and that
the composer's own rule declares no width or min-width, so re-narrowing the panel
or re-adding a composer minimum fails this criterion.
