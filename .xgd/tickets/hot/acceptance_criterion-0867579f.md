---
uid: acceptance_criterion-0867579f
id: AC-935
type: acceptance_criterion
title: No closed colour-role vocabulary survives in the schema, in a definition, or
  on a layer
created_by: xgd
created_at: '2026-08-06T20:51:02.923927+00:00'
updated_at: '2026-08-06T20:51:02.923927+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
No **closed colour-role vocabulary** survives anywhere in the site-definition
schema. The published schema surface exposes no colour-token group and no
colour-role enum, and three consequences are observable at that surface:

- the **theme-token shape carries no palette key** — a definition is not required
  to declare one, and one that declares it is rejected as an unknown key rather
  than tolerated as a legacy field;
- **no site definition declares one**: every site's stored definition carries no
  theme palette;
- **no layer treatment names a colour role.** The art-directed layer's image
  border and its positioned text run no longer accept a colour-role field at all;
  a definition still naming one is rejected as an unknown key. The border keeps
  its width step and the text run keeps its size, weight, family, tracking and
  line-height — only the colour-role field is gone.

The retirement is a deletion, not a deprecation: there is no alias, no
grandfathered spelling and no fallback that resolves an old role name.

## Verification
Inspect the published schema surface and assert the colour-token group and the
colour-role enum are absent and that the theme-token shape has no palette key.
Validate a definition whose theme declares a palette, one whose layer image
border names a colour role, and one whose layer text run names a colour role, and
observe each rejected as an unknown key; validate the same definitions with those
fields removed and observe acceptance. Read every stored site definition and
assert none declares a theme palette.
