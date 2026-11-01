---
uid: acceptance_criterion-f3a951da
id: AC-2122
type: acceptance_criterion
title: A deactivated business is absent from the selectable set rather than chosen
  and then failing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:02.426906+00:00'
updated_at: '2026-11-01T10:36:59.892810+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When a business the caller is a member of (with a live grant) is deactivated:
- it is no longer reported as selectable to that caller
- an unprefixed request skips it in the first-admissible fallback
- naming it explicitly is refused with the 403 refusal, not a 503 server error.

## Verification
Seed a caller with two live businesses and deactivate the first. Assert the admission marks it not selectable, an unprefixed request resolves to the second, and a request naming the first returns 403.