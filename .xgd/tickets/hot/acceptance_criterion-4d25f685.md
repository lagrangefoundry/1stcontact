---
uid: acceptance_criterion-4d25f685
id: AC-1497
type: acceptance_criterion
title: A material is a valid record before any text has been extracted from it
created_by: xgd
created_at: '2026-09-02T00:31:01.345402+00:00'
updated_at: '2026-09-02T00:31:01.345402+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

A material or a reference is accepted with no text body. The body of such a record is the readable
shadow of what the file *says*, extracted so the material can be searched without pulling its bytes,
and it is written after the record exists — the record is created when the file arrives.

So a material whose extraction has not run yet is an ordinary state rather than an invalid record:
creating one with a complete rights and provenance statement and no body succeeds, and the record
reads back with an empty body. Supplying a body at creation is equally accepted and reads back
unchanged.

This is the opposite of the rule for a brief, which has no later extraction and must carry its
document from the start.

## Verification

Through an account-scoped store, create a material and a reference with a complete rights and
provenance statement and no body, and confirm both are accepted and read back with no body content.
Create one supplying a body and confirm it is returned as supplied.
