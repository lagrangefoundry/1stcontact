---
uid: acceptance_criterion-92ec2ccc
id: AC-1107
type: acceptance_criterion
title: A drawing's filename is generated from a plain name, and an existing name is
  a conflict unless replacement is explicit
created_by: xgd
created_at: '2026-08-10T09:34:47.101273+00:00'
updated_at: '2026-08-10T09:34:47.101273+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
The name given for a drawing must be one plain lowercase word of letters, digits and hyphens; the stored filename is derived from it under the single generated format. Any name carrying path separators, parent-directory segments, spaces, a leading dot or another extension is refused with a schema-validation error and a hint showing an acceptable name — there is no path to traverse because no path is accepted. A name already in use is refused as a conflict; replacing it requires explicitly asking to, and then the stored bytes are the new ones.

## Verification
Submit names containing a traversal sequence, a directory separator, a foreign extension, a leading dot and a space: each is refused. Write a drawing under a valid name, then write again under the same name: the second call is a conflict. Write it a third time asking explicitly to replace: the call succeeds and the stored file's bytes are the redrawn ones.
