---
uid: acceptance_criterion-3ae69518
id: AC-1295
type: acceptance_criterion
title: A document is in the knowledge base only when it explicitly opts in, and only
  as a genuine boolean
created_by: xgd
created_at: '2026-08-20T04:16:45.054659+00:00'
updated_at: '2026-08-20T04:16:45.054659+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A document is in the knowledge base only when it explicitly opts in, and only when the opt-in is a genuine boolean true. Every other state is out:

- the flag absent
- the document carrying no fields at all
- the flag present and false
- the flag present as the *text* "true"
- the flag present as the number 1

A value that merely looks like true is a document whose frontmatter did not parse the way its author assumed; admitting it would hide exactly the failure worth seeing, which is a document silently reaching a client-facing assistant.

## Verification

Assert the membership decision directly across all six shapes, and assert the integration half against the real document store: the set of documents the export produced is exactly the set the rule selects, no document silently added and none silently dropped, and no excluded document has a file in the corpus.
