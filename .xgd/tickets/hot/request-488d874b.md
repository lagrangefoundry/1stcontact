---
uid: request-488d874b
id: REQ-123
type: request
title: 1st contact system KB
created_by: xgd
created_at: '2026-08-07T23:31:49.993341+00:00'
updated_at: '2026-08-13T21:15:50.844238+00:00'
completed_at: null
last_field_updated: status
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
---

# 1st contact system KB

Stand up the two stores the builder AI needs: a **ticket store** on D1 (chat
sessions, tenant content) and a **system knowledge base** shipped with the
release. REQ-122 renders the chat UI; this ticket gives that session something to
persist into and something to know.

## Status

**Blocked on framework work.** The knowledge-management components exist in
Python only, and this project has no Python toolchain. Three tickets now carry
the JS peers in `lagrange-framework`:

| | Ticket | Delivers | Needed for |
|---|---|---|---|
| FW-1 | REQ-99 | `components/knowledge/js` — config, corpus, embedding, index + chunk index, chunking, search, ranking, landscape, priming; a `DocDirStore` peer; a JS `build-shipped-kb` | everything below |
| FW-2 | REQ-100 | `components/ai_knowledge/js` — `KnowledgeToolbox` over the shared `knowledge_surface.json`, `KnowledgeDocs` priming `ContextSource` | tools + priming |
| FW-3 | REQ-101 | Awareness *build* in JS (cluster → describe → derived map) | only when a KB outgrows an authored map, or for tenant KBs |

FW-3 is not on this ticket's critical path: a shipped system KB declares
`landscape: authored`, so v1 ships a map rather than deriving one.

## What already exists (and is not rebuilt here)

| Need | Component | Language |
|---|---|---|
| Ticket store on D1 | `@lagrangefoundry/ticketing` | JS |
| Chat sessions persisted as tickets | `@lagrangefoundry/ai` — `TicketSessionStore` + `chatSchemas()` | JS |
| Ticket ops as AI tools | `@lagrangefoundry/ai-ticketing` | JS |
| The Toolbox (declaration, policy, manual, provenance, audit) | `@lagrangefoundry/ai` | JS |
| Shipped-KB model — corpus from a directory, index and map as release artefacts, **no tickets created** | framework REQ-71 | Py (JS: FW-1) |

`apps/control-app` already runs with `nodejs_compat`. It has **no D1 binding** and
`db/migrations/` is empty, so the store genuinely is greenfield here.

## Scope

### 1. The ticket store

- D1 binding in `apps/control-app/wrangler.toml`; migrations under `db/migrations/`.
- `applySchema` with a product TypePack merged with `chatSchemas()` — one store,
  not a chat store beside a content store.
- `MultiTenantTicketStore` for tenant isolation.

### 2. The system KB

- **Corpus = files that ship with the release**, not seeded tickets. Every `doc`
  ticket (32 today) exported to a corpus directory of frontmatter-bearing
  markdown, which is the shape `DocDirStore` reads. The export must be
  repeatable — it re-runs whenever the design docs move.
- `knowledge_bases.yaml` declaring the KB with `source: shipped`,
  `landscape: authored`.
- A release build step (framework `build-shipped-kb`, JS) producing the index
  beside the corpus.
- Visible to **every** tenant, writable by none.

### 3. Wiring

- `KnowledgeDocs` as the builder chat session's priming source — landscape first,
  so the AI gets a map of what exists plus the means to pull the rest, rather
  than a context stuffed with documents.
- `KnowledgeToolbox` granted to that session (read-only), so search and retrieval
  are declared surface operations with the ordinary guardrails, provenance
  marking and audit.

## Decisions taken

1. **The JS knowledge components are built in the framework**, not here — FW-1/2/3
   above. This repo stands up, seeds, and consumes.
2. **KM runs over both stores.** A corpus is a stored ticket query resolved
   against a *named* source (`store_for`), so "a shipped read-only directory" and
   "this tenant's D1 store" are the same code path with different sources. The
   system KB uses the former; tenant KBs will use the latter.
3. **The whole doc set goes in.** No curation pass for now; the system must scale
   to thousands of documents, so the answer to a large corpus is chunk search and
   an awareness map, not a hand-picked subset. The product-knowledge vs
   development-process boundary stays open (see below).
4. **One shared system KB, plus per-tenant KBs.** Tenants read the system KB and
   own KBs in their own stores. Multi-source composition and the guarantee that
   a tenant search cannot cross into another tenant's documents are proven in
   FW-2.
5. **Index residency follows from FW-1.** A shipped corpus at this scale is a
   bundle-sized artefact; the loader takes its source from the host, so R2 or
   Vectorize remains available without a library change when the corpus grows.

## Open

- **Tenant grain.** Is a tenant a *site*, or an *account* with site as a field?
  A site-grained tenant gives "search never crosses sites" structurally; an
  account-grained one matches how a client with several sites is billed and
  talked to. Needs deciding before the schema lands, because it is expensive to
  change afterwards.
- **Corpus boundary.** Several docs are XGD development-process knowledge
  (branch topology, conformance harness, reproduction runbook) rather than
  product knowledge the builder AI should reason from when talking to a client.
  Deferred deliberately — revisit once there is evidence of it hurting retrieval.
- **Export mechanics.** Whether the corpus directory is committed or generated at
  build time, and how doc → file naming stays stable across renames.

## Supersessions this forces on DOC-10 (chat persistence)

DOC-10 predates the ticket store and KM. Three of its sections are replaced:

- **§8's bespoke schema** — `chat_sessions` / `chat_messages` / FTS5 is replaced
  by the ticket store: a session is a `chat` ticket, its transcript a
  `chat_transcript` comment. One store, not two.
- **§6's `reference_docs` table + distillation step** — replaced by indexing the
  real documents. Hand-distilling docs into a parallel curated set is the work KM
  exists to remove, and it introduces a second source of truth that drifts.
- **§5.2's four memory tools** — `search_transcripts` / `read_session_range` /
  `list_reference_docs` / `read_reference_doc` become the declared knowledge
  surface's operations, with transcripts and documents as two KBs in one search
  rather than two tool families.

DOC-10 needs a supersession note, and REQ-23 / REQ-24 / REQ-26 need retiring or
rewriting against this model.

## Related

REQ-122 (builder chat UI) · DOC-10 (chat persistence — partially superseded) ·
DOC-12 (storage model) · framework REQ-99 / REQ-100 / REQ-101, REQ-71 (shipped KB),
REQ-40–44 / 49 / 53 / 76 (KM in Python), REQ-30 / 33 (Toolbox + ai_ticketing in JS).
