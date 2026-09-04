---
uid: acceptance_criterion-4d25f685
id: AC-1497
type: acceptance_criterion
title: A material is a valid record before any text has been extracted from it, and
  says which state it is in through its fields
created_by: xgd
created_at: '2026-09-02T00:31:01.345402+00:00'
updated_at: '2026-09-04T05:07:39.834171+00:00'
completed_at: null
last_field_updated: title
status: active
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

**An empty body is not how that state is read.** The record says which state it is in through its
own fields: a record that states no description outcome is one nothing has yet tried to describe,
while a record that states an outcome has been through the attempt and its answer says how that
went. The two cases an empty body cannot tell apart — nothing has run, and something ran and found
nothing to say — are therefore distinguishable without inspecting the body at all. The body carries
the description; the fields carry whether there is one.

This is the opposite of the rule for a brief, which has no later extraction and must carry its
document from the start.

## Verification

Through an account-scoped store, create a material and a reference with a complete rights and
provenance statement and no body, and confirm both are accepted and read back with no body content.
Create one supplying a body and confirm it is returned as supplied. Then create two records that
both read back with an empty body — one stating no description outcome, one stating that the file
carried no extractable text — and confirm the two are distinguished by their fields rather than by
their bodies, which are identical.
