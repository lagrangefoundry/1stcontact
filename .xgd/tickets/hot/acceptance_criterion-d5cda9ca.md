---
uid: acceptance_criterion-d5cda9ca
id: AC-1390
type: acceptance_criterion
title: A refused multi-part write leaves no page, no definition change and no version
  bump
created_by: xgd
created_at: '2026-08-31T09:47:38.328395+00:00'
updated_at: '2026-08-31T09:47:38.328395+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

When a change carrying a stale version expectation is refused, **nothing it would have done
survives** — even when it would have changed many things at once.

For a change that writes a new site definition and several new pages together and is refused:

- None of those pages exists afterwards.
- The site definition is exactly what it was before the attempt.
- The site version is exactly what it was before the attempt.

The observable end state is indistinguishable from the change never having been attempted, and
this holds for a change touching several pages, not only a single-page one.

## Verification

Seed a site, read its version, then advance it by an unrelated write so the first reading is
stale. Attempt a change carrying the stale version that writes a new definition plus several new
pages. Observe the conflict, then read back the pages (none of the new ones present), the
definition (unchanged) and the version (unchanged from immediately before the attempt). The
multi-page shape matters: the criterion is about a partial landing, which a single-write change
could not exhibit.
