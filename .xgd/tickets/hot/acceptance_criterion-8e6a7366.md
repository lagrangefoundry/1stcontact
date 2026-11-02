---
uid: acceptance_criterion-8e6a7366
id: AC-2235
type: acceptance_criterion
title: The knowledge-base build's search step resolves the system KB against an index
  keyed by its declared source, so all four stages complete
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-02T04:11:33.080473+00:00'
updated_at: '2026-11-02T04:11:33.080473+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Building the knowledge base runs **all four stages to completion** — corpus, document index, passage index, awareness map — with the map's own validating search succeeding against the freshly built index rather than refusing with *"reads from source 'shipped', which this host has no index for (available: none)"*.

The search the map runs hands the knowledge component its index **keyed by the source name the system knowledge base's declaration resolves to** (`shipped`), not as a single unnamed index. The build-side steps that produce the document and passage indexes are unchanged.

Because the build no longer dies at its last stage, it exits zero, the status report's `map: built` describes the map this build wrote rather than the previous one, and the release command proceeds to packing.

## Verification

Over a small fixture corpus with a stubbed embedding model (the only boundary doubled), run the build: assert it exits zero, that a fresh awareness map was written by this run, and that no "no index for" configuration refusal appears. Assert separately that a search over the built system knowledge base, keyed as the build keys it, returns a hit for a query describing a fixture document.

Note: an end-to-end run against the real Workers AI embedder needs `CLOUDFLARE_API_TOKEN` and is an operator verification, not part of the UAT.
