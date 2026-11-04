---
uid: acceptance_criterion-8e6a7366
id: AC-2235
type: acceptance_criterion
title: The knowledge-base build's search step resolves the system KB against an index
  keyed by its declared source, so all four stages complete
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-02T04:11:33.080473+00:00'
updated_at: '2026-11-04T21:09:52.917532+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

Building the knowledge base runs **all four stages to completion** — corpus, document index, passage index, awareness map — with the map's own validating search succeeding against the freshly built index rather than refusing with *"reads from source 'shipped', which this host has no index for (available: none)"*.

The search the map runs hands the knowledge component its index **keyed by the source name the system knowledge base's declaration resolves to** (`shipped`), not as a single unnamed index. The build-side steps that produce the document and passage indexes are unchanged.

Because the build no longer dies at its last stage, the build stage returns its result (document, chunk, territory and access-point counts) instead of throwing, and the status report's `map: built` describes the map this build wrote rather than one left by a previous build.

This criterion covers the build stage (`buildKb`). It does not itself claim anything about the `1c kb build` process exit code or about `bin/kb-release` going on to `1c assets`; those follow from the stage completing but are not exercised here (see Reconciliation Decision on story-c4f329d3).

## Verification

Over a small fixture corpus in a temporary KB root, with a stubbed embedding and describing model and a stub ticket store (the only boundaries doubled), run the build stage: assert it completes without throwing, that no "no index for" configuration refusal appears, that every stage's artefact exists, and that a fresh awareness map was written by this run (a stale map planted beforehand is replaced). Assert separately that a search over the built system knowledge base, keyed as the build keys it, returns the expected fixture document as its top hit.

Note: the `1c kb build` CLI and `bin/kb-release` write into the repository's own `kb/` tree and need `CLOUDFLARE_API_TOKEN` for the real Workers AI embedder; an end-to-end release run is an operator verification, not part of the UAT.
