---
uid: acceptance_criterion-3e2afff1
id: AC-2237
type: acceptance_criterion
title: 'A search hit can be read back: from either knowledge base on the Worker, from
  the system knowledge base on the Node CLI, each runtime''s indexes keyed by that
  KB''s declared source (project KB under the default source)'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-02T04:11:40.965235+00:00'
updated_at: '2026-11-04T20:11:12.108840+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

The assistant can **search and then read**: a document hit the search returns can be fetched by its id, and is never refused as `not_in_corpus`.

- **On the deployed Worker**, a hit from **either** knowledge base can be read back: the system knowledge base and the project (client) knowledge base.
- **On the Node CLI's knowledge runtime**, a hit from the **system** knowledge base can be read back. The Node CLI hosts only the system knowledge base (`openKnowledgeRuntime` opens it alone), so no project-KB behaviour is claimed there.

Each knowledge base's runtime is opened with its document and passage indexes **keyed by the source name its own declaration resolves to**:

- the system knowledge base under `shipped` (both hosts);
- the project (client) knowledge base, which declares no source, under the knowledge component's **default source** (`project`). This applies on the Worker only. The key is named explicitly and never passed unnamed, because index lookup has no fallback for an unnamed index.

On the Worker, the combined search and passage search over both knowledge bases pass each side's indexes through under the same keys, so neither side's search fails with a "no index for" configuration error.

A runtime that is given no index for a knowledge base's source **refuses loudly** at search time. It never returns an empty result or an empty document snapshot that would read as "this knowledge base has nothing in it".

The corpus-store map (which store each KB's text lives in) is a separate seam and keeps its existing keys.

**Not claimed:** a project knowledge base, or a co-ranked search over two knowledge bases, on the Node CLI. See STORY-149's Reconciliation Decisions.

## Verification

Over a small fixture corpus with a stubbed embedding model, open a runtime through the repository's own opener, run a search, then read the uid that came back, and assert the read returns the document:
- on the Worker, for a system-KB hit and for a project-KB hit;
- on the Node CLI, for a system-KB hit.

Assert that the system runtime's index map carries `shipped` and the Worker's project runtime's map carries the default source. Assert that a search on a runtime opened with no index for a KB's source refuses with a configuration error rather than returning an empty list.
