---
uid: request-6893f6ea
id: REQ-158
type: request
title: 'The system KB in the Worker: bundle-resident index, AI binding, knowledge
  surface on the builder toolbox'
created_by: xgd
created_at: '2026-08-28T21:12:01.399464+00:00'
updated_at: '2026-08-28T21:12:01.399464+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
---

# The system KB in the Worker: bundle-resident index, AI binding, knowledge surface on the builder toolbox

## The gap

`1c kb build` produces a corpus, a vector index, a chunk index and an awareness
map as a release artefact. **Nothing in the deployed Worker reads any of it.**

The builder AI therefore cannot search its own design documentation. Asked "what
dial values does the hero-split module support?" or "what are the rules about
third-party reference material?", it has no path to the answer that [[DOC-10]]
§5.1 and [[DOC-38]] §8 both assume it has.

This is a wiring ticket, not a design one. The seam already exists and is
deliberately shaped for exactly this.

## What already exists

- `createL1ToolboxCore` **accepts** a `knowledgeSurface` — `{surface, granted}`.
- The node-side `createL1Toolbox` **builds** one, loading the `ai-knowledge`
  bridge and constructing `new bridge.KnowledgeToolbox(knowledge)` with
  `bridge.knowledgeInstanceConfig([SYSTEM_KB])`.
- `openKnowledgeRuntime()` (`tools/generate/src/cli/kb.ts`) opens a runtime from
  disk.
- `apps/control-app/src/ai.ts` builds the Worker's `HostDeps` and passes
  **no knowledge at all**, so the surface defaults to `null` — *"what a host with
  no knowledge corpus supplies."*

The CLI path works. The Worker path was never connected.

## What is missing

1. **The corpus has never actually been built.** `kb/system/` contains 33
   exported markdown documents and nothing else — no `index/`, no `chunks/`, no
   awareness-map document. Only `1c kb export` has ever run, so the embedder,
   describer and awareness passes are unexercised against the current corpus
   (which has since gained [[DOC-38]]). Running `1c kb build` is a prerequisite
   of this ticket, not part of it, but the ticket is not done until it has been
   run and its output committed to the release path.

2. **No `[ai]` binding** in `apps/control-app/wrangler.toml`. Query-time
   embedding needs `WorkersAiEmbedder({binding: env.AI})`, and the index and the
   query must come from the same model or the vector space does not agree.

   It must be declared **twice** — top level and under `[env.production]`. A
   named environment inherits neither vars nor bindings, and that file's own
   stated rule is that nothing depends on remembering which keys inherit. Every
   other binding there is pinned by a UAT asserting both declarations exist; this
   one gets the same treatment. Absent in production, the failure is not
   degradation — every search throws on `undefined`.

3. **No bundle-resident artefacts.** `openKnowledgeRuntime` builds on
   `nodeIndexSource(...)`, which is filesystem access and does not exist in
   workerd. The Worker needs the index and the documents as generated modules it
   can import.

4. **No Worker-side runtime opener** — the peer of `openKnowledgeRuntime`, built
   from `memoryIndexSource(INDEX)`, `DocDirStore(bundleDocReader(DOCS))` and the
   AI binding. It belongs on the Worker-safe side of the package boundary and
   must not reach `node:fs` transitively.

5. **The surface is never passed.** `ai.ts` must construct the runtime and hand
   `knowledgeSurface` to `createL1ToolboxCore`.

6. **Priming.** `primeSession` injects the awareness map into the session so the
   AI starts with *the map, not the pile* ([[DOC-10]] §5.1). Search without
   priming is a tool the AI does not know it should reach for.

## Decision: the index is bundle-resident for v1

33 documents is roughly 50KB of document vectors and well under 1MB with chunks —
nowhere near a bundle limit. R2 costs a cold-start fetch and buys nothing at this
size.

`IndexSource` is a seam, so moving to R2 later is a swap rather than a rewrite.

**One caveat, recorded so it is not generalised wrongly:** the *project* KB
([[DOC-38]] §8) can never be bundle-resident — it is tenant data, written
continuously, and differs per tenant. It will need the R2 or store-backed path
through the same seam. Bundle-for-system is not a decision that has to hold
twice, and nothing in this ticket should be built as though it does.

## Out of scope

- **The project KB.** Tenant-scoped corpus, incremental indexing, and the
  awareness-map refresh cadence are a separate ticket. This one ships the static
  half.
- **Attachments** (`lagrange-framework` REQ-104) — no dependency in either
  direction.
- **The site source adapter** ([[DOC-38]] §8.3).
- **Awareness-map rebuild triggers.** The system map is built at release time and
  changes only when the documents do.

## Acceptance

- `[ai]` binding declared top-level **and** under `[env.production]`, with a UAT
  asserting both, matching the existing pinned pairs.
- `1c kb build` emits bundle-importable modules for the index and the documents.
- A Worker-safe runtime opener exists, and the existing static-import-graph
  assertion still passes — the query path must not reach `node:fs`.
- `ai.ts` passes a non-null `knowledgeSurface` when the artefacts are present,
  and continues to work when they are absent (a missing corpus degrades to no
  knowledge tools, never to a boot failure).
- Priming injects the awareness map into the session.
- **The behavioural test:** the builder AI, asked a question whose answer lives
  only in a design document, answers from it and names the document. This is the
  acceptance criterion that matters; the rest are the mechanism.

## Open questions

- Whether the generated modules are committed or built in CI. `kb/system/` is
  currently gitignored as derived, but a Worker bundle needs them present at
  build time.
- Whether `SYSTEM_KB` scoping stays hard-coded in the toolbox construction or
  becomes configuration once a second KB exists.
