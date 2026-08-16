---
uid: acceptance_criterion-b80e8a70
id: AC-1147
type: acceptance_criterion
title: The retrofit fits a shade over the same function the definition resolves through,
  so the drift it reports is the drift the site paints
created_by: xgd
created_at: '2026-08-16T22:26:27.163921+00:00'
updated_at: '2026-08-16T22:44:01.677669+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
---

## Criterion

The drift the retrofit measures and reports is the drift the site will actually
paint, because the fit is searched over the **same shade function the definition
resolves through** rather than a second copy of the colour arithmetic.

Observable consequence: for every colour the command reports as re-expressed as a
shade, resolving that reference through the published palette model — the path
any consumer of the site definition takes — yields exactly the colour the report
said it would, and exactly the reported distance from the literal it replaced.
A change to how a shade resolves therefore changes what the retrofit fits and
reports, in step, rather than leaving the two to disagree.

## Verification

Retrofit a site and, for each entry in the reported drift, resolve the same
entry-and-shade pair through the palette model's own resolution path and assert
it yields the reported colour and the reported per-channel distance. Assert the
same equality holds for every shaded reference in the converted definition, not
only those that drifted.