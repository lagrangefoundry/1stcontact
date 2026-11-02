---
uid: acceptance_criterion-3e2afff1
id: AC-2237
type: acceptance_criterion
title: A search hit from either knowledge base can be read back on both hosts, each
  runtime opened with its index keyed by that KB's declared source (project KB under
  the default source)
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-02T04:11:40.965235+00:00'
updated_at: '2026-11-02T04:11:40.965235+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

On **both hosts** — the deployed Worker conversation and the Node CLI's knowledge runtime — the assistant can **search and then read**: a document hit returned from either knowledge base can be fetched by its id, and is never refused as `not_in_corpus`.

Each knowledge base's runtime is opened with its document and passage indexes **keyed by the source name its own declaration resolves to**:

- the system knowledge base under `shipped`;
- the project (client) knowledge base, which declares no source, under the knowledge component's **default source** (`project`) — named explicitly, never passed unnamed, because index lookup has no fallback for an unnamed index.

The combined search and passage search over both knowledge bases pass each side's indexes through under the same keys, so neither side's search fails with a "no index for" configuration error.

A runtime that is given no index for a knowledge base's source **refuses loudly** at search time; it never returns an empty result or an empty document snapshot that would read as "this knowledge base has nothing in it".

The corpus-store map (which store each KB's text lives in) is a separate seam and keeps its existing keys.

## Verification

Over a small fixture corpus with a stubbed embedding model, open a runtime through the repository's own opener, search, then read the uid that came back: assert the read returns the document. Assert the system runtime's index map carries `shipped` and the project runtime's carries the default source. Assert that opening a runtime with no index for a KB's source makes a search refuse with a configuration error rather than return an empty list.
