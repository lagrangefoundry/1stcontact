---
uid: acceptance_criterion-3745124c
id: AC-914
type: acceptance_criterion
title: A deploy whose output would collide with the reserved preview segment is refused
  by name and ships nothing
created_by: xgd
created_at: '2026-08-06T18:50:06.214162+00:00'
updated_at: '2026-08-07T22:18:55.562788+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion

The preview channel occupies one reserved path segment immediately inside a
site's address. A deploy whose rendered output contains a top-level entry of that
reserved name is refused before any bytes are shipped, with an error that names
the offending entry, names the reserved segment, and states why the entry would
otherwise be unreachable. A deploy whose output contains that name at any deeper
level, or an entry whose name merely begins with it, proceeds normally.

## Verification

Attempt a deploy of a snapshot whose rendered output contains a top-level entry
of the reserved name and assert it fails with a message naming both the entry and
the reserved segment, and that nothing was written to the store. Attempt deploys
whose output carries that name nested one level deeper, and one whose top-level
entry merely shares its prefix, and assert both succeed.