---
uid: acceptance_criterion-279f1f6d
id: AC-1037
type: acceptance_criterion
title: The edit form opens inside the workspace's themed surface, takes its palette,
  and follows a theme change
created_by: xgd
created_at: '2026-08-10T07:46:22.523184+00:00'
updated_at: '2026-08-16T04:19:10.987108+00:00'
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

The form the edit gesture opens is part of the workspace's themed surface, not a
panel beside it. It opens inside the themed subtree, so it resolves that theme's
own palette values and inherits the workspace's application face, and a change
to the workspace's palette reaches the form rather than leaving it showing the
colours of the theme that happened to be current when it was built.

No hardcoded colour stands in for a theme value in the form's chrome — the panel,
its border, its radius, its surface and its text all come from the theme's own
values, so a theme value that failed to resolve would be visible rather than
disguised by a fallback that resembles it. The single stated exception is the
refusal colour, for which the workspace theme has no value yet.

## Verification

Open the edit form over a copy region on the displayed editable page and assert
the dialog element is contained within the workspace's themed root — its parent
is that root, not the document body. Change the workspace theme's palette values
on that root while the form is open and assert the form's rendered chrome colours
follow. Assert the form's chrome references the theme's values without a literal
colour fallback, except the one declared refusal colour.