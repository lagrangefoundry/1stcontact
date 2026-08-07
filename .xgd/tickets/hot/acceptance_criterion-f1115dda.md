---
uid: acceptance_criterion-f1115dda
id: AC-1029
type: acceptance_criterion
title: The workspace registers an editable mode, and selecting it displays that site's
  edit channel
created_by: xgd
created_at: '2026-08-07T20:47:47.552688+00:00'
updated_at: '2026-08-07T21:19:51.381540+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The display panel the workspace mounts offers an editable mode for the current
site alongside the normal view, and selecting it displays that site's **edit**
channel — the rendering produced for editing — rather than the channel the view
mode displays. The mode and the selected site compose: with the editable mode
active, choosing a different site displays that site's edit channel, and
returning to the view mode displays the current site's ordinary channel again.

The claim is that the shipped workspace registers this mode *itself*. AC-969
proves that a mode contributed from outside the panel works end to end, and
AC-968 that switching modes preserves the pane; both are deliberately
mode-agnostic and a workspace shipping no editable mode of its own would still
satisfy them. This criterion is what makes the mode contract true of two real
modes rather than one real and one hypothetical.

Scope is registration and which channel the mode points at. What the edit
channel *contains* belongs to CAP-87 / STORY-98, and what the editing gesture
does once that document is displayed belongs to STORY-101; neither is asserted
here.

## Verification

Mount the workspace over a store holding rendered sites and assert the panel
offers an editable mode alongside the view mode. Select it and assert the
address the pane is displaying is the currently selected site's edit channel,
distinct from the address the view mode displays for that same site, and that
fetching it over the workspace origin returns that site's edit rendering.
With the editable mode still active, choose a different site and assert the
displayed address follows to that site's edit channel; switch back to the view
mode and assert the displayed address returns to the ordinary channel. The
editable mode used throughout must be the one the workspace registers, not one
supplied by the test.