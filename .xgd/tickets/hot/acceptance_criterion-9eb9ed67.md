---
uid: acceptance_criterion-9eb9ed67
id: AC-661
type: acceptance_criterion
title: A colour dial set to a palette role resolves to the themed palette colour
created_by: xgd
created_at: '2026-07-19T03:09:49.739418+00:00'
updated_at: '2026-07-19T03:09:49.739418+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
---

## Criterion

When the same colour dial is set to a palette role name (e.g. `accent`, a status
role) instead of a literal, the published site renders that element using the
theme's palette colour for that role — the named-role path is preserved, so a
from-scratch author's existing site definition renders identically to before this
capability.

## Verification

Author a site setting a colour dial to a role name, build it, and confirm the
element resolves to the theme palette colour for that role (not a literal), matching
the pre-existing role behaviour.
