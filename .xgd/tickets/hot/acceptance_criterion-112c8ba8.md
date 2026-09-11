---
uid: acceptance_criterion-112c8ba8
id: AC-1714
type: acceptance_criterion
title: A Library sits beside the site tab, presenting the account's material as the
  workspace's own two-pane list-detail with its filters in the list header
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:18:37.005258+00:00'
updated_at: '2026-09-11T05:18:37.005258+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The workspace offers a Library alongside the tab for the site being worked on, and it is the
client's material rather than one site's: opening it presents a two-pane browsing surface — a
list of the account's material on one side, a detail area on the other — with the controls that
narrow the list carried in the list's own header rather than in a bar added above it. Every row
the account holds is present when no filter is set.

The Library is assembled from the workspace's existing two-pane and list-detail presentation and
its existing field-editing controls: the client gets the same selection, collapse and scroll
behaviour they already have elsewhere in the builder, and the surface introduces no editing
control that does not already exist in the workspace.

## Verification

Mount the builder workspace against an account holding a known set of material. Observe that a
Library panel exists beside the site panel, that opening it renders the shared two-pane
list-detail presentation (its list region, its detail region and its list header), that the
filter controls are inside the list header region, and that the number of rows equals the number
of pieces of material the account holds. Observe that the detail area's field rows are the
workspace's existing field-editor rows rather than markup unique to this surface.
