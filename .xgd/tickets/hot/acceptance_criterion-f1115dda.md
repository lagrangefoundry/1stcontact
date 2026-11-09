---
uid: acceptance_criterion-f1115dda
id: AC-1029
type: acceptance_criterion
title: The workspace registers an editable mode; selecting it displays that site's
  edit channel at the page the reader was on
created_by: xgd
created_at: '2026-08-07T20:47:47.552688+00:00'
updated_at: '2026-11-09T00:10:46.591013+00:00'
completed_at: null
last_field_updated: title
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
channel (the rendering produced for editing) rather than the channel the view
mode displays.

**Switching mode keeps the page ([[REQ-215]]).** The toggle does not return to
the other channel's root. A reader on a page within the site (say `/about`)
in View is on the same page in Edit after the switch, and switching back
returns them to that page in the ordinary channel. Only the channel segment of
the address changes; the path within the channel is the same on both sides.

The mode and the selected site compose. With the editable mode active,
choosing a different site displays that site's edit channel at its root,
because another site's page is not this page in another state. Returning to
the view mode then displays the current site's ordinary channel at the same
page the edit mode was showing.

The claim is that the shipped workspace registers this mode *itself*. AC-969
proves that a mode contributed from outside the panel works end to end, and
AC-968 that switching modes preserves the pane. Both are deliberately
mode-agnostic, and a workspace shipping no editable mode of its own would still
satisfy them. This criterion makes the mode contract true of two real modes
rather than one real and one hypothetical.

Scope is registration, which channel the mode points at, and which page within
that channel it opens on. What the edit channel *contains* belongs to CAP-87 /
STORY-98. What the editing gesture does once that document is displayed belongs
to STORY-101. The scroll offset and open panels that also cross the switch are
asserted by their own criteria under this story.

## Verification

Mount the workspace over a store holding rendered sites with more than one
page, and assert the panel offers an editable mode alongside the view mode.
Select it and assert the address the pane is displaying is the selected site's
edit channel. It must be distinct from the address the view mode displays for
that same site, and fetching it over the workspace origin must return that
site's edit rendering.

Navigate the frame in View to a page other than the home page, switch to Edit,
and assert the displayed address is the edit channel at that same page. Switch
back to View and assert the displayed address is the ordinary channel at that
same page, not the channel root.

With the editable mode still active, choose a different site and assert the
displayed address is that site's edit channel at its root. Switch back to the
view mode and assert the displayed address is the ordinary channel for the
current site. The editable mode used throughout must be the one the workspace
registers, not one supplied by the test.
