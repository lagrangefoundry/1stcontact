---
uid: acceptance_criterion-fc456d2d
id: AC-1041
type: acceptance_criterion
title: The site's own font declarations cross into the workspace so the previewed
  family resolves — and only those, replaced each time
created_by: xgd
created_at: '2026-08-10T07:47:45.324881+00:00'
updated_at: '2026-08-16T04:19:19.599750+00:00'
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

The site's own font declarations are brought into the workspace so the family
the box names actually resolves there. The site declares its faces in the
displayed page's own stylesheet, which the workspace document cannot otherwise
see; naming that family without them would be worse than not naming it, because
the box would preview a system face while claiming to preview the page's. The
faces are re-declared in the workspace with their asset references resolved
against the page's own base, so a relative handle that works on the page works
in the form.

**Only the face declarations cross.** Nothing else of the site's stylesheet
enters the workspace — its resets, its layout and its document-level rules stay
where they are, and cannot fight the workspace for control of a document the
site knows nothing about.

The copied set is replaced wholesale each time it is taken, not added to, so
switching to another site or another way of looking at one cannot leave the
previous site's families still resolvable; and a page that declares no faces
leaves none behind.

## Verification

Open the form over copy on a page whose family is bound by a face declaration in
the page's own stylesheet. Assert the workspace document now carries that
declaration, with its asset reference resolved to an address that loads from the
workspace origin. Assert no other rule from the page's stylesheet was copied.
Then open the form against a second page declaring a different family and assert
the workspace carries only the second page's declarations; against a page
declaring none, assert none remain.