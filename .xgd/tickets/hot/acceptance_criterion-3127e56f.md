---
uid: acceptance_criterion-3127e56f
id: AC-944
type: acceptance_criterion
title: 'A completed retrofit moves no pixel: the site renders byte-identically before
  and after'
created_by: xgd
created_at: '2026-08-06T21:08:08.703116+00:00'
updated_at: '2026-08-07T16:50:15.085589+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Converting a site from colour literals to palette references changes nothing
about what the site renders. For every page of a retrofitted site, the rendered
output after the retrofit is byte-identical to the rendered output produced
from the same definition before it, and every reference in the converted
definition resolves back to exactly the literal it replaced — including its
opacity.

Pixel-identity is a property of the conversion, not a tolerance: any difference
is a conversion defect.

## Verification

Render every page of a stored site, retrofit it, render again, and compare the
outputs byte-for-byte. Independently, resolve every reference in the converted
definition against the written palette and assert each resolves to the literal
that occupied that position before the conversion.