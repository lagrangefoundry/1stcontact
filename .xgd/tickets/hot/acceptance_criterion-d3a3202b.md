---
uid: acceptance_criterion-d3a3202b
id: AC-1685
type: acceptance_criterion
title: Each created material is announced for indexing exactly once, identified by
  the material just created
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:08:06.737691+00:00'
updated_at: '2026-09-11T04:17:56.737728+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

Every piece of material the pipeline creates is announced for indexing **exactly once**, and
the announcement identifies the material that was just created.

One ingestion produces one announcement carrying that material's own identifier — not zero
(the material would be invisible to search), not two (the work would be done twice), and not
an announcement naming something else.

## Verification

With a counting stand-in configured as the deployment's indexer, perform one ingestion and
assert the recorded announcements are exactly one, equal to the identifier the ingestion
returned. Repeat for a second ingestion and assert the recorded announcements are exactly the
two identifiers, in order. The stand-in exists so this claim needs no embedding model to
observe.