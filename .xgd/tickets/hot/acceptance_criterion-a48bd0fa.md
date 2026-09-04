---
uid: acceptance_criterion-a48bd0fa
id: AC-1503
type: acceptance_criterion
title: A generated reference is searchable exactly as an authored document is, and
  asserts its own membership
created_by: xgd
created_at: '2026-09-04T02:26:44.084787+00:00'
updated_at: '2026-09-04T02:26:44.084787+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

A generated reference is a member of the knowledge base on the same terms as a document written by a person: it is indexed, chunked, mapped and retrievable through the ordinary search path, and a reader asking in their own words for a fact that only a generated reference carries gets that document back.

Nothing else can assert a generated document's membership on its behalf — it has no originating ticket — so the document states its own membership in the metadata the corpus reads, together with the fact that it was generated and the source it came from.

## Verification

Build the knowledge base over a corpus containing both authored documents and generated references, then search it with a question phrased in ordinary words whose answer appears only in a generated reference (for example, what settings a named component takes). Assert the generated document is among the results. Separately, assert every generated document's metadata satisfies whatever the knowledge base declares membership to be, and records that it was generated and where its facts came from.
