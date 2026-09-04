---
uid: acceptance_criterion-c9ccf65b
id: AC-1524
type: acceptance_criterion
title: The client's landscape is publishable from the first build, and one record
  is recycled in place
created_by: xgd
created_at: '2026-09-04T03:20:03.153009+00:00'
updated_at: '2026-09-04T03:32:04.637083+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-bb91191c
  kind: behavior
  regression_only: false
---

## Criterion

A client's landscape can be published and read back from the very first build onward: the record
it is published as is one the client's own store accepts, rather than being refused as an
undeclared kind, and it is retrievable afterwards as that client's landscape.

There is exactly one such record per client knowledge base: a rebuild replaces its body wholesale
and reuses the same record rather than adding a second, so anything holding a reference to the
landscape keeps pointing at the current one. Before any build, asking for the client's published
landscape reports that none exists rather than failing.

## Verification

On an account that has never had one, ask for the published landscape: none, reported as absence.
Build and publish one: it succeeds — no validation refusal for an unrecognised record kind — and
asking again returns it. Build and publish a second time after the corpus has changed: asking
returns one landscape, at the same identity as before, carrying the new body.