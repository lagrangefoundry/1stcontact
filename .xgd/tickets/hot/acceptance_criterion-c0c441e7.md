---
uid: acceptance_criterion-c0c441e7
id: AC-1698
type: acceptance_criterion
title: 'A describer that is reached and fails costs findability and nothing else:
  the file is stored and the upload is never reported as failed'
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:45.836910+00:00'
updated_at: '2026-09-11T04:23:45.836910+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

**Description never fails an upload.** A describer that is reached and breaks — a refusal from
the model, a timeout, malformed bytes — costs the material its findability and nothing else.

- The client's file is still stored and the material is still created; the client is told their
  file arrived, never that the upload failed.
- The recorded outcome is the reached-but-failed outcome, held distinct from no-describer-
  configured because the two want different retries.
- The body says the describer failed and carries the reason, so an operator reading the record
  can tell a rate limit from a malformed file.
- No error from the description step escapes into the ingestion result for any kind of material,
  including a malformed file of an otherwise readable type.

## Verification

Configure a describer that throws with a distinctive message and ingest an image: assert the
call returns successfully with a created material, the outcome is reached-but-failed, and the
body contains the distinctive message. Repeat with malformed bytes of a readable document type
and assert the ingestion still returns a material rather than raising.
