---
uid: acceptance_criterion-3ae69518
id: AC-1295
type: acceptance_criterion
title: A document is in the knowledge base only when it explicitly opts in, and only
  as a genuine boolean
created_by: xgd
created_at: '2026-08-20T04:16:45.054659+00:00'
updated_at: '2026-09-10T08:04:25.755347+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
  uat_coverage: pass
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

Assert the membership decision directly across all six shapes. Then assert the integration half against a store holding a known mixture of opted-in and opted-out documents — one document per near-miss shape — and check that the export produced exactly the opted-in one, named every other as skipped, and left no excluded document with a file in the corpus.

The mixture is seeded rather than taken from the real document store, so the verdict cannot turn on data no branch controls: with nothing opted in, a real-store assertion either fails for a reason that is not a defect or passes over an empty set. The real store is still exported and asserted for **agreement** — the set the export produced is exactly the set the rule selects, nothing silently added and nothing silently dropped — a property that holds at any corpus size, zero included.