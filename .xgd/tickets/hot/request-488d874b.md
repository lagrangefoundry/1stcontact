---
uid: request-488d874b
id: REQ-123
type: request
title: 1st contact system KB
created_by: xgd
created_at: '2026-08-07T23:31:49.993341+00:00'
updated_at: '2026-08-13T21:49:59.207833+00:00'
completed_at: null
last_field_updated: body
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
3. **The whole doc set goes in, and the corpus question is closed for now.**
   Every `doc` ticket (33 today), no curation pass. The system must scale to
   thousands of documents, so the answer to a large corpus is chunk search and an
   awareness map, not a hand-picked subset. Some documents are
   development-process knowledge rather than product knowledge; whether that
   hurts retrieval is a question to answer with data once the feature exists, not
   a reason to hold up building it. Build the feature; look at the data after.
4. **The tenant is the account, and it is the hard information barrier.** A site
   is an object — or a set of objects — inside a tenant, not a tenant itself.
   See "Tenancy" below for what that buys and what it obliges.
5. **The system KB sits above tenancy.** It is not inside anyone's store, it
   takes the scope parameters, and it runs the same queries for everyone.
6. **Per-tenant KBs live in the tenant's own store.** Multi-source composition —
   the system KB plus a tenant KB in one runtime — and the guarantee that a
   tenant search cannot cross into another tenant's documents are proven in FW-2.
7. **Index residency follows from FW-1.** A shipped corpus at this scale is a
   bundle-sized artefact; the loader takes its source from the host, so R2 or
   Vectorize remains available without a library change when the corpus grows.

## Tenancy

### The tenant is the account

`tenant_id` is not a column the product sets; it is the axis the store is built
on. `Accessor.forTenant(id)` returns a handle that injects `WHERE tenant_id = ?`
on every read and stamps it on every write, and human-readable ids are allocated
per `(tenant, type)`. Tenancy is bound into the handle at construction and is
never ambient, so crossing tenants means explicitly building a second handle.
That is why the grain is expensive to change later: it decides what "cannot be
seen across" means structurally, what a ticket's number is scoped to, and what a
knowledge base can span.

The account is where the hard barrier belongs, because that is the boundary
between unrelated businesses. Below it, a site is an object inside the tenant —
one client's several sites share a store, and therefore share accumulated
knowledge: brand voice, terminology, decisions already made. That sharing is a
feature. The alternative — a tenant per site — would throw it away and make the
second site start as cold as the first.

### What that obliges

Site isolation is a **predicate**, not a property: `fields.site_id = ?`. Within a
tenant, a query that omits it returns another site's content belonging to the
same client. That is far less serious than cross-client leakage, but it is a
discipline rather than a guarantee, so it must not be left to each call site.

**Bind the site scope once**, into the knowledge runtime's KB scope and the
session's store handle, so nothing downstream can forget it — the same shape the
tenant scope already has, one level down.

### The system KB sits above all of it

The system KB is not tenant data and does not live in any tenant's store. It is a
release artefact: shipped corpus, shipped index, read-only, byte-identical
everywhere. Nothing a tenant does can mutate it, and upgrading the software
changes it for everyone at once rather than being a per-tenant migration.

It still **takes** the scope parameters, and may require them — but it does not
vary by them. That is deliberate on two counts:

- **One call signature.** Every knowledge call carries the scope, so there is no
  second, unscoped code path for a tenant-data query to be accidentally routed
  down. The shipped source simply ignores the scope when selecting its corpus,
  exactly as `store_for` already ignores it when a KB names a shipped source.
- **The audit trail stays complete.** Who asked, in what scope, is recorded for
  every query including the ones whose answer does not depend on it.

A useful consequence: because a system-KB query is scope-invariant, identical
query text yields identical results across every tenant, so results are safely
cacheable *across* tenants. It is the only KB where that is true. The cache
boundary is therefore per-KB, not per-search — a search that spans the system KB
and a tenant KB produces a ranked set whose composition is tenant-specific.

## Open

- **Agency accounts.** The account grain assumes an account's sites belong to one
  business. If the product ever sells to agencies — one account, many unrelated
  end-clients — the weak boundary (the site predicate) would sit exactly where a
  strong one is needed. Not a reason to change the grain now; a reason to know in
  advance that agencies would need a tenant per end-client rather than per agency.

### Deferred

- **Export mechanics.** Whether the corpus directory is committed or generated at
  build time, and how doc → file naming stays stable across renames.
- **Transcript granularity.** The chat archive homes a session as one comment
  holding the whole session file, CAS-updated, rather than a row per message.
  Fine at builder-conversation length; if it stops being fine, the fix is a
  message-granular archive behind the same port in the framework, not a bespoke
  schema here. Recorded in DOC-10 §8.1.

## DOC-10 (chat persistence) — revised, done

DOC-10 predated both the ticket store and KM, and specified bespoke machinery for
each. It has been revised in place rather than annotated, since its design intent
survived intact and only the build-it-here assumption did not. Three sections
replaced:

- **§8's bespoke schema** — `chat_sessions` / `chat_messages` / FTS5 → the ticket
  store: a session is a `chat` ticket, its transcript a `chat_transcript`
  comment, its body the AI-maintained summary. §8.1 records the one real
  divergence (whole-file comment vs message rows).
- **§6's `reference_docs` table + distillation step** → a knowledge base over the
  real documents. Distillation was a workaround for retrieval that did not exist;
  keeping it would have meant a second source of truth that drifts silently.
- **§5.2's four memory tools** — `search_transcripts` / `read_session_range` /
  `list_reference_docs` / `read_reference_doc` → operations on the declared
  knowledge surface, with transcripts and documents as two KBs in one ranked
  search rather than two tool families.

Also corrected: §11's decomposition named REQ-23–REQ-26, numbers that were never
allocated to this work and now belong to unrelated tickets. It points at REQ-122
and REQ-123.

## Related

REQ-122 (builder chat UI) · DOC-10 (chat persistence — revised here) ·
DOC-12 (storage model) · framework REQ-99 / REQ-100 / REQ-101, REQ-71 (shipped KB),
REQ-40–44 / 49 / 53 / 76 (KM in Python), REQ-30 / 33 (Toolbox + ai_ticketing in JS).