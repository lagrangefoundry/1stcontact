---
uid: acceptance_criterion-6bd6f4e7
id: AC-1420
type: acceptance_criterion
title: An invalid draft publishes nothing, and the failure happens before any write
created_by: xgd
created_at: '2026-08-31T11:34:07.433997+00:00'
updated_at: '2026-08-31T11:46:20.665322+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

An invalid draft publishes nothing at all. Validation happens before any write,
so no revision is minted, no log entry appended, no byte of output or frozen
definition stored, and the draft's lineage pointer is left where it was. The
refusal is reported as the author's error — a bad-request answer carrying the
list of path-pointed validation errors, so the caller can say which field is
wrong rather than "publish failed" — and the site's currently live revision goes
on serving exactly what it served before.

## Verification

Publish a site, then write a definition into its draft that cannot validate and
publish again. Assert the second publish is refused with a bad-request answer
that carries the validation errors and their paths; that the revision log still
holds only the earlier revision; and that the previously published revision is
still readable and unchanged.