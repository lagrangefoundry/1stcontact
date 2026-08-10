---
uid: acceptance_criterion-ba6fe401
id: AC-875
type: acceptance_criterion
title: 'Every created site carries the layout document: creation takes only a slug,
  offers no mode selection, and produces one starter shape'
created_by: xgd
created_at: '2026-08-06T03:43:19.257394+00:00'
updated_at: '2026-08-10T08:16:10.941998+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Site creation accepts a slug (plus the workspace-root selector shared by every
command) and nothing else: there is no opt-in that selects between a seeded page
and an empty one, and the documented usage advertises none. Every slug creation
is asked for yields a page carrying a valid layout document — the shape does not
vary by slug, by invocation, or by any flag.

## Verification
Create sites for several distinct slugs and assert each one's page carries a
layout document that validates. Assert the command's documented usage for
creation lists only the slug and the shared workspace-root selector, so an author
has no starter mode to choose or to forget.