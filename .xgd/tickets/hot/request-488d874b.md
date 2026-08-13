---
uid: request-488d874b
id: REQ-123
type: request
title: 1st contact system KB
created_by: xgd
created_at: '2026-08-07T23:31:49.993341+00:00'
updated_at: '2026-08-13T21:40:56.870265+00:00'
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
4. **One shared system KB, plus per-tenant KBs.** Tenants read the system KB and
   own KBs in their own stores. Multi-source composition and the guarantee that
   a tenant search cannot cross into another tenant's documents are proven in
   FW-2.
5. **Index residency follows from FW-1.** A shipped corpus at this scale is a
   bundle-sized artefact; the loader takes its source from the host, so R2 or
   Vectorize remains available without a library change when the corpus grows.

## Open

### Tenant grain — the one decision that must be made before the schema lands

`tenant_id` is not a column the product sets; it is the axis the store is built
on. `Accessor.forTenant(id)` returns a handle that injects `WHERE tenant_id = ?`
on every read and stamps it on every write, and human-readable ids are allocated
per `(tenant, type)`. So the tenant grain decides three things at once: what
"cannot be seen across" means structurally, what a ticket's number is scoped to,
and what a knowledge base can span.

**Tenant = site.** Cross-site leakage becomes structurally impossible — not
enforced by remembering a predicate, but by there being no handle that spans two
sites. That is the strongest possible answer to "can the AI working on site A see
site B's conversation", and it is worth a lot for a product where clients are
unrelated businesses.

The cost lands when one client has several sites. A knowledge base cannot span
them, so a brand's voice, terminology and past decisions do not carry from their
first site to their second — the AI starts cold each time, which is precisely the
value the KB exists to provide. Account-level anything (billing, a session list
across sites, "how do we talk to this client") has to be assembled by querying N
stores and merging outside the store's guarantees.

**Tenant = account, site as a field.** Per-client knowledge accumulates in one
place and every site that client owns benefits. Account-level views are ordinary
queries. This matches how a client is actually billed and talked to.

The cost is that site isolation becomes a predicate — `fields.site_id = ?` — that
every query must carry, and a search that forgets it returns another site's
content *belonging to the same client*. Less catastrophic than cross-client
leakage, but now a discipline rather than a property.

**Recommendation: tenant = account, site as a field**, provided the site
predicate is bound once into the knowledge runtime's KB scope rather than passed
per call. The strong isolation boundary that matters commercially is
*between clients*, and account-grain still gives that structurally. Within one
client, sites sharing knowledge is a feature, not a leak — and the alternative
throws away the accumulated understanding that makes the second site faster than
the first.

Worth confirming against the business model: if the product ever sells to
agencies (one account, many unrelated end-clients), the account grain puts the
weak boundary exactly where the strong one is needed, and site-grain wins instead.

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