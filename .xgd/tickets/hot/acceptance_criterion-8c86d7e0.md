---
uid: acceptance_criterion-8c86d7e0
id: AC-1460
type: acceptance_criterion
title: An unrecognised viewport preset is refused by name rather than silently defaulted
created_by: xgd
created_at: '2026-08-31T22:53:28.663394+00:00'
updated_at: '2026-08-31T22:53:28.663394+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

A screenshot request naming a viewport preset that does not exist fails, and the
failure names both the unrecognised value and the set of valid preset names. No
image is produced and no substitute size is used.

## Verification

Request a screenshot with an unknown preset name. Assert that the call fails
rather than returning bytes, and that the failure message contains the rejected
name and the three valid names. Assert no browser session was acquired for the
refused request.

A silent fallback would return a correct-looking picture at the wrong width with
nothing anywhere reporting it, which is the exact failure this refusal exists to
prevent.
