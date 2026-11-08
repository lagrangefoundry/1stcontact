---
uid: acceptance_criterion-77a6b131
id: AC-2459
type: acceptance_criterion
title: A role correction on fetched or captured material is refused 403 and the surface
  offers no role control for it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:55:12.683801+00:00'
updated_at: '2026-11-08T13:55:12.683801+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Only material the client uploaded can have its role corrected. Origin is the only gate: rights
and republishability play no part in it.

- **On fetched or captured material the surface offers no role control.** *What it is for* is
  shown read-only, like every other row of that record. A control that always fails is worse than
  no control.
- **The route refuses those origins too, 403**, even when called directly, with a statement that
  this material's role was worked out from where it came from rather than chosen. The response
  names the uid. The material is unchanged: the role and `republishable` both stay as stored.
- **A captured material is refused even when it is `owned` and republishable**, as a capture of
  the client's own old site is. Because origin is the gate, an inferred role stays inferred
  however permissive its rights are.
- Material that carries no recorded origin is treated as uploaded, by the surface and the route
  alike, so the two never disagree about the same row.

## Verification

Open a fetched material and a captured material in the Library and observe that *What it is for*
offers no control on either. POST `/api/material/role` directly for each, with either role, and
observe a 403 naming the uid. Read each back and observe that its role and `republishable` are
unchanged. Repeat for a captured material whose rights are `owned` and republishable, and observe
the same 403.
