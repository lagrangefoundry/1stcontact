---
uid: acceptance_criterion-51145d3b
id: AC-2471
type: acceptance_criterion
title: One place decides how the deployment reaches the model; nothing else builds
  a Workers AI embedder or decides from the AI binding
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T21:06:05.284581+00:00'
updated_at: '2026-11-08T21:06:05.284581+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5281f009
  kind: behavior
  regression_only: false
---

## Criterion

Exactly one place in the control application decides how the deployment reaches
the embedding model. It is the only place that builds an embedder against Workers
AI, and no other part of the control application inspects the `AI` binding to
decide whether or how to embed. Both knowledge bases, the session gate and the
upload indexer get their answer from it.

That keeps the rule true over time. The four-way drift this replaced came from
each site answering the question locally, and a new site doing the same would
bring it back silently.

## Verification

Scan the control application's source. Assert that Workers AI embedders are
constructed in exactly one module, and that no source file outside that module
reads the `AI` binding to decide embedding (no `env.AI` gate or binding-built
embedder elsewhere).
