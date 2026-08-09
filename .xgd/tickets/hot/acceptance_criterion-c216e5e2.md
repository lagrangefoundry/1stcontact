---
uid: acceptance_criterion-c216e5e2
id: AC-918
type: acceptance_criterion
title: A path whose last segment carries an extension never triggers the mapping,
  and only the last segment is examined
created_by: xgd
created_at: '2026-08-06T19:02:50.974498+00:00'
updated_at: '2026-08-09T13:50:13.988405+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-66115f6b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Whether a URL is eligible for the mapping is decided by its last path segment
alone. A request for a missing asset — anything whose final segment contains an
extension — returns not-found rather than page markup served under the asset's
type, in both environments. Conversely a path whose *intermediate* segments
contain a dot is still eligible, so a dotted directory name does not disable the
clean URL for a page beneath it.

## Verification

Request a missing asset path ending in a recognisable extension in local preview
and against a deployed snapshot the site's deploy index vouches for; assert
not-found in both and that no page markup is returned. Separately, assert that a
path whose intermediate segment contains a dot and whose last segment does not
is treated as eligible, and one whose last segment contains a dot is not. What
is under test is the URL rule rather than how bytes reached the store, so the
nested object the dotted-directory case needs — a shape the flat render cannot
emit — may be seeded into that snapshot directly.