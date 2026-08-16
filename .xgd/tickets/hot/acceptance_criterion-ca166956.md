---
uid: acceptance_criterion-ca166956
id: AC-1105
type: acceptance_criterion
title: A drawing carrying anything executable, external or embedding is refused whole,
  with no byte written and no registry change
created_by: xgd
created_at: '2026-08-10T09:34:37.662775+00:00'
updated_at: '2026-08-16T01:57:23.184132+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A drawing containing a script element, an event-handler attribute, an embedded-document element, an external or non-local reference, a stylesheet or style attribute, a document type or entity declaration, or any character entity beyond the five XML names is refused with a schema-validation failure identifying which rule it broke. Refusal is whole: no file is created, no existing file is modified, and the site's asset registry is byte-identical to before the call. A drawing is never rewritten or stripped to make it acceptable.

## Verification
Submit each of a set of hostile-but-legal drawings covering those categories; every one is refused with a schema-validation error. After the whole set, assert the site's assets directory contains no file and the site's stored definition is byte-identical to the snapshot taken before the first attempt.