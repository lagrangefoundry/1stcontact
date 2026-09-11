---
uid: acceptance_criterion-6819cfd6
id: AC-1720
type: acceptance_criterion
title: A description the client wrote is recorded as theirs, so a later re-description
  pass does not select it
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:19:02.230746+00:00'
updated_at: '2026-09-11T05:28:53.174182+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A description the client wrote is recorded as theirs. After a correction, the material's record
states that it now has a description and that the client is who produced it — so a later pass
that selects material still needing description, by asking for material whose description is
missing or was never produced, does not select material the client has described.

The client's own words therefore survive any automated re-description pass without anyone having
to remember which material a human touched.

## Verification

Correct a description whose recorded outcome was "nothing described this" through the Library.
Observe the material's record afterwards stating a successful description and naming the client
as its author. Run the selection a re-description pass uses — material whose description outcome
is anything other than successful — and observe the corrected material is absent from it, while
another still-undescribed material is present.