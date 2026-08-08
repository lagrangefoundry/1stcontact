---
uid: acceptance_criterion-0867579f
id: AC-935
type: acceptance_criterion
title: No closed colour-role vocabulary survives in the schema, in a definition, or
  on a layer
created_by: xgd
created_at: '2026-08-06T20:51:02.923927+00:00'
updated_at: '2026-08-08T00:44:01.459948+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
No **closed colour-role vocabulary** survives anywhere in the site-definition
schema. The published schema surface exposes no colour-token group and no
colour-role enum, and three consequences are observable at that surface:

- the **theme-token shape has no palette key**. A definition is not required to
  declare colour tokens and cannot obtain any behaviour by declaring them: the
  colour group is not part of the shape, so a leftover palette is discarded on
  parse and reaches nothing downstream. Colour never arrives through the token
  surface again;
- **no site definition declares one**: every site's stored definition carries no
  theme palette;
- **no layer treatment names a colour role.** The art-directed layer's image
  border and its positioned text run no longer accept a colour field at all, and
  a definition still naming one is **rejected as an unknown key** rather than
  quietly ignored. The border keeps its width step and the text run keeps its
  size, weight, family, tracking, leading, alignment and shadow — only the
  colour-role field is gone.

The retirement is a deletion, not a deprecation: there is no alias, no
grandfathered spelling, and nothing anywhere that resolves an old role name to a
colour.

## Verification
Inspect the published schema surface and assert the colour-token group and the
colour-role enum are absent, and that the theme-token shape has no palette key.
Parse a theme declaring a palette and observe the key does not survive into the
parsed value. Validate a definition whose layer image border names a colour role,
and one whose layer text run names a colour role, and observe each rejected with
an unknown-key violation naming that field; validate the same definitions with
the field removed and observe acceptance. Read every stored site definition and
assert none declares a theme palette.