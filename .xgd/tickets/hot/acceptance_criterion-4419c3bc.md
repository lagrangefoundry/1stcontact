---
uid: acceptance_criterion-4419c3bc
id: AC-1565
type: acceptance_criterion
title: A correction is attributed to the client and marks the description real, so
  a later re-describe pass leaves their words alone
created_by: xgd
created_at: '2026-09-04T04:27:22.786196+00:00'
updated_at: '2026-09-04T04:45:38.187728+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

A description the client wrote is recorded as theirs: the material's record states that its
description is a real one and names the client as what produced it, rather than naming a model.

A later pass that selects material whose description is missing or degraded — the query that exists
so a re-describe is a selection rather than a migration — does not select material the client has
corrected, whatever its description said before.

## Verification

Ingest a material whose description could not be produced (no describer available), and assert it is
selected by the degraded-description query. Correct its description through the Library. Assert the
record now states the description is a real one and attributes it to the client rather than to a
model, and assert the same degraded-description query no longer returns it.