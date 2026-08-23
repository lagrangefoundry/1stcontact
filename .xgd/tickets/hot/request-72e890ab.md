---
uid: request-72e890ab
id: REQ-18
type: request
title: 'Crawler + batch coverage engine (Phase 1: corpus + classification)'
created_by: xgd
created_at: '2026-07-02T00:20:08.548533+00:00'
updated_at: '2026-08-20T21:38:30.944872+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  story_points: 8
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a86c1b28
---

## Scope

Phase 1 of the [[DOC-15]] coverage program: a breadth/novelty-driven **crawler** + **capture corpus** + **batch classification engine** (covered / generalizable / new, via reproduction + eyes). **Internal framework-development tooling** — capability-learning, not content redistribution ([[DOC-15]] §6). Phases 2–3 (cover Wix/WP template basis set; histogram the tail) are program-level and tracked in [[DOC-15]].

## Dependencies
REQ-12 (capture), REQ-13 (screenshot / eyes), [[DOC-15]], [[DOC-14]] (classification = batch flywheel).

## Deliverables
- **Crawler:** gallery-sourced, polite (robots, rate limits); **novelty dedup** (keep a capture only if it adds design-space coverage).
- **Corpus store:** captures + metadata; internal, transformative (signals, not a content archive).
- **Batch classifier:** attempt reproduction with the current library → eyes → bucket (covered / generalizable / new) + capability spec for gaps.
- **Coverage histogram:** aggregate gaps by frequency × cost → prioritized module backlog.

## UATs (`test_UAT_FC_REQ-18_*`)
- `test_UAT_FC_REQ-18_crawler_dedups` — near-duplicate pages are dropped by the novelty filter.
- `test_UAT_FC_REQ-18_corpus_stores_capture` — a captured site lands in the corpus with metadata.
- `test_UAT_FC_REQ-18_classification_buckets` — fixtures classify into covered / generalizable / new.
- `test_UAT_FC_REQ-18_histogram_aggregates` — gaps aggregate into a ranked backlog.

## Out of scope
Phases 2–3 execution ([[DOC-15]]); customer-facing "site like X" ([[DOC-15]] §7); IP/legal sign-off for at-scale public use.

-