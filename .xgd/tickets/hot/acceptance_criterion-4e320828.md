---
uid: acceptance_criterion-4e320828
id: AC-1038
type: acceptance_criterion
title: One application typeface, set once through the workspace's own font token and
  served from the workspace origin
created_by: xgd
created_at: '2026-08-10T07:46:38.639604+00:00'
updated_at: '2026-08-16T04:19:17.286472+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The workspace, the edit form and the form's controls are all set in one
application typeface. It is applied once, at the workspace's themed root,
through that root's own typographic design value — not by overriding the
component's stylesheet — so everything beneath inherits it and no surface has to
restate it.

The typeface is an application constant, not part of a theme: a theme swaps a
palette, and colour remains a theme value while the family does not. Its faces
are served from the workspace's own origin in two weights, so the workspace has
no third-party font dependency, works offline, and tells nobody outside which
sites the operator is editing; the origin serves web-font files with their
correct content type.

## Verification

Mount the workspace and assert its themed root carries the application typeface
as its own typographic token value, and that this is the family the form and its
controls resolve to. Assert the declared faces are files served from the
workspace origin — present on disk under the workspace's own asset path, in both
weights — and that requesting one from the origin returns a web-font content
type. Assert the family is not declared per theme.