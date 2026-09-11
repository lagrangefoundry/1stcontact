---
uid: acceptance_criterion-3ae69518
id: AC-1295
type: acceptance_criterion
title: A document is in the knowledge base only when its kind says so, and the retired
  boolean is not membership
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

A document is in the knowledge base only when it declares the document kind that means *this document is the assistant's* — `doc_kind: system_kb`, a single-valued kind rather than a flag, so that "this architecture document is **also** a system document" cannot be said. Every other state is out:

- the kind field absent
- the document carrying no fields at all
- the kind present but naming a different kind (`architecture`, `security_policy`, …)
- the kind present as a near-miss spelling of the member kind
- **the retired `system_kb: true` boolean, which is not membership** — a document still carrying it from before the rule changed is not in the knowledge base

The retired boolean is superseded rather than deprecated: nothing honours both markers, so there is one membership rule rather than two. Honouring a marker nobody maintains any more would put a document in front of a client-facing assistant on the strength of it, which is the failure this rule exists to prevent.

## Verification

Assert the membership decision directly across all six shapes. Then assert the integration half against a store holding a known mixture of opted-in and opted-out documents — one document per near-miss shape — and check that the export produced exactly the opted-in one, named every other as skipped, and left no excluded document with a file in the corpus.

The mixture is seeded rather than taken from the real document store, so the verdict cannot turn on data no branch controls: with nothing opted in, a real-store assertion either fails for a reason that is not a defect or passes over an empty set. The real store is still exported and asserted for **agreement** — the set the export produced is exactly the set the rule selects, nothing silently added and nothing silently dropped — a property that holds at any corpus size, zero included.