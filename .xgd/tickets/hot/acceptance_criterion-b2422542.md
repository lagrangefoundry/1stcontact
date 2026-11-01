---
uid: acceptance_criterion-b2422542
id: AC-2099
type: acceptance_criterion
title: Packing refuses (non-zero, nothing written) when a document the corpus predicate
  resolves is absent from either the document index manifest or the chunk manifest,
  naming each missing document
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:04:46.320101+00:00'
updated_at: '2026-11-01T09:16:51.246110+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Packing the knowledge base into the application build is **refused** when any document the corpus membership predicate resolves is **absent from the document index manifest, the passage (chunk) index manifest, or both**.

The refusal is a refusal, not a warning:

- the application build exits non-zero;
- **nothing about the knowledge base is written** — the previously shipped packed module is left byte-for-byte as it was, and the served application tree is not replaced;
- the error says the corpus and its index disagree, lists every offending document **by id** under a `MISSING` heading (shipped as text, searchable never), and names the command that repairs it (`1c kb build`, or the release command that runs the whole build in order).

A bundle whose corpus and both manifests agree packs normally and reports no missing document.

## Verification

Build a small knowledge base end to end (two documents, both indexes, a map; the embedding model stood in for) and assert the agreement check finds nothing missing or stale. Then write a third corpus document without re-indexing and assert the check reports exactly that document as missing. Run the asset build against that skewed tree after a coherent one has shipped, and assert it rejects and that the shipped module's contents are unchanged. Assert the formatted refusal names the document under `MISSING` and names `1c kb build`.