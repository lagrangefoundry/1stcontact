---
uid: request-488d874b
id: REQ-123
type: request
title: 1st contact system KB
created_by: xgd
created_at: '2026-08-07T23:31:49.993341+00:00'
updated_at: '2026-08-20T12:50:05.432946+00:00'
completed_at: '2026-08-20T12:50:05.432946+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  commits:
  - working_sha: de5e498f4f7263882813c86efff7807200acf8df
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - 2dbf7e705ed58294e3ede858ee834530ca2f5912
  - working_sha: c60cbf756a056f0afcca065147093aeae8f20361
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 99b3cb55f3d5301d13bdbab160832843ea115622
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - da7d31b388e51407e48754b243ee6ab3f4743a0e
  - working_sha: 8581a924ff56bc405b155186e11ad8ff3cc03cce
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.1.52
  bundled_in: bundle-77b28def
  chat_comment: comment-a0602b67
---

# 1st contact system KB

Stand up the **system knowledge base**: the design-doc corpus, its index, its
generated awareness map, and the wiring that makes the builder AI know what
exists and able to pull the rest. REQ-122 renders the chat UI; this ticket gives
that session something to know.

## Status

**Unblocked — the framework peers have landed.** All three JS components are
built and already extracted into the shared artifact store, so consumption needs
no new mechanism: `sharedModuleUrl('knowledge')` resolves today, the same route
`host.ts` already uses for `@lagrangefoundry/ai`.

| | Ticket | State | Delivers |
|---|---|---|---|
| FW-1 | REQ-99 | `ready_to_reconcile` | `components/knowledge/js` — config, corpus, embedding, doc + chunk index, chunking, search, ranking, landscape, priming; a `DocDirStore` peer |
| FW-2 | REQ-100 | `free_coded` | `components/ai_knowledge/js` — `KnowledgeToolbox` over the shared `knowledge_surface.json`, `KnowledgeDocs` priming `ContextSource`, the `describe` seam |
| FW-3 | REQ-101 | `free_coded` | Awareness *build* in JS (cluster → describe → derived map) |

FW-3 landed ahead of plan, which is what lets the map be **generated** rather
than authored — see decision 3.

## Scope

**The D1 ticket store is not in this ticket.** It was scoped here on the
assumption that the builder AI runs in `apps/control-app`, and it does not: the
AI host runs in the Node builder origin (`1c serve`), because every tool bottoms
out in `edit.ts` over the file-backed site store, and sessions persist through the
framework's `FileArchive`. The host moves to workerd *with the store*, at
DOC-12 §7 phase 2 — whose trigger is a server-side builder needing to read and
write the store, still open in DOC-8 §13. A D1 store built now would have no
consumer and a tenancy model with nothing to scope. The tenancy analysis below is
kept because it is the design that ticket inherits, not because it is built here.

**The system KB needs no D1 and no tenancy.** A shipped corpus is a directory
read by `DocDirStore`; the index is a release artefact beside it.

### 1. The corpus

- **Corpus = files that ship with the release**, not seeded tickets. Every `doc`
  ticket (33 at the time of writing, and deliberately not pinned — the export
  reconciles against the store on every run) exported to a corpus directory of
  frontmatter-bearing
  markdown, which is the shape `DocDirStore` reads.
- The export is **repeatable** — it re-runs whenever the design docs move.
- Filenames derive from the doc's human id, not its title: `DocDirStore`'s uid
  *is* the path, so the filename is the retrieval identity and must survive a
  retitle.

### 2. The index and the map

- `knowledge_bases.yaml` declaring the KB with `source: shipped`.
- A build step producing the index beside the corpus, and **generating** the
  awareness map (cluster → describe → validate).
- Composed from the library's public exports (`buildIndex`, `buildChunkIndex`,
  `buildAwareness`, `nodeIndexSource`, `writeIndexModule`) rather than the
  upstream `build-shipped-kb` CLI, which is not in the packed artifact —
  `@lagrangefoundry/knowledge` declares `files: ["src"]` and no `bin`. Reported
  upstream; not worked around here beyond calling the same functions the CLI does.

### 3. Wiring

- `KnowledgeDocs` as the builder chat session's priming source — landscape
  first, so the AI gets a map of what exists plus the means to pull the rest,
  rather than a context stuffed with documents.
- `KnowledgeToolbox` granted to that session (read-only), so search and retrieval
  are declared surface operations with the ordinary guardrails, provenance
  marking and audit.

## What was built

`1c kb build` — export, index, chunk, map, in that order.

| Piece | Where |
|---|---|
| The command (`build` / `export` / `status`) | `tools/generate/src/cli/kb.ts`, dispatched from `cli/index.ts` |
| Corpus export from the ticket store | `exportCorpus` — one `xgd ticket list --view` call, one file per doc |
| KB declaration (authored, scaffolded once) | `kb/knowledge_bases.json` |
| Corpus + both indexes + the map | `kb/system/` (gitignored — all of it is derived) |
| Two surfaces in one Toolbox | `cli/ai/toolbox.ts` — L1 controls plus `KnowledgeToolbox`, read-only, scoped to the system KB on both axes |
| Landscape-first priming | `cli/ai/host.ts` — `KnowledgeDocs` with the projected tool manual as its `mechanism` |

**Credentials.** The index needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`
(the pair the repo already deploys with) because the embedder is Workers AI over
REST. The map needs none: the describe seam resolves `['claude', 'claude_code']`
in order and falls through to the authenticated Claude Code CLI.

**Degradation, not failure.** With no KB built, `openKnowledgeRuntime` returns
`null` and the session is the pre-REQ-123 assistant — tools but no documents. A
KB that was built and then *failed to open* says so on stderr rather than
silently dropping the whole knowledge surface.

### Two things found along the way

- **The packed `@lagrangefoundry/knowledge` has no `bin`.** It declares
  `files: ["src"]`, so `build-shipped-kb` is absent from the shared artifact
  store. Every function that CLI calls is exported, so `kb.ts` composes the same
  pipeline in the same order. Worth reporting upstream; when the `bin` is packed,
  `kb.ts` shrinks to a call.
- **`DocDirStore` ignores frontmatter `created_at` / `updated_at`.** Its module
  comment says a document's frontmatter "wins except `uid`", but `_record` takes
  both stamps from the file entry. The index's incremental manifest keys on
  `updated_at`, so a re-export that rewrote every file would re-embed the whole
  corpus every build. The export therefore writes a file only when its bytes
  actually change, and the two frontmatter timestamps are provenance for a human
  reader rather than something the store reads.

## What already exists (and is not rebuilt here)

| Need | Component | Language |
|---|---|---|
| The Toolbox (declaration, policy, manual, provenance, audit) | `@lagrangefoundry/ai` | JS |
| Chat sessions persisted as transcripts | `@lagrangefoundry/ai` — `FileArchive` | JS |
| Shipped-KB model — corpus from a directory, index and map as release artefacts, **no tickets created** | framework REQ-71 / REQ-99 | Py + JS |
| Ticket store on D1 | `@lagrangefoundry/ticketing` | JS (unused here yet) |

## Decisions taken

1. **The JS knowledge components are built in the framework**, not here — FW-1/2/3
   above. This repo stands up, builds, and consumes.
2. **Membership is opt-in, per document, on the document.** A `doc` ticket is in
   the system KB when it carries `fields.system_kb: true`, and the export skips
   every ticket that does not. Every doc carries it today, so the corpus is
   unchanged — but the mechanism is now the one that decides, rather than the
   absence of one.

   **Inclusion and not exclusion**, deliberately. An exclusion list answers "what
   did we throw out", which nobody asks; inclusion answers "what does the
   assistant know", which is the question that matters and the one a reviewer
   should be able to settle by reading a document's own frontmatter. It also
   fails safe: a new document is outside the KB until somebody says otherwise, so
   nothing reaches the assistant by default. The opposite default would put every
   new document in front of a client-facing agent the moment it was written.

   The decision lives on the TICKET rather than in a list in the KB declaration,
   because it is a fact about the document and has to move with it. An id list
   drifts silently — the document is retired or renamed and the list still names
   it, with nothing to notice.

   The system must still scale to thousands of documents, so the answer to a
   large corpus remains chunk search and an awareness map, not a hand-picked
   subset. This is the dial that makes an editorial pass possible when there is
   retrieval data to justify one; it is not an instruction to curate now.
3. **The awareness map is generated at build time. There is no hand-authored
   map.** Generating it is the point: a map over a corpus this size, spanning product,
   framework and process is exactly what goes stale when hand-maintained.

   The KB nevertheless declares `landscape: authored` at RUNTIME, and that is not
   a contradiction — it is the shipped-KB contract. `authored` means "this map is
   a fixed artefact that ships, read and never refreshed on a cadence", which is
   exactly true of one built by `1c kb build`. Declaring `derived` at runtime
   would invite a rebuild against a corpus store that is structurally read-only.
   The build flips the KB to `derived` for its own duration — upstream's own
   manoeuvre, and the reason its script puts it this way: derived for the build,
   authored on disk. What makes the result authored is *where it is written*.
4. **Build-time and query-time vectors come from one model.** Workers AI
   `@cf/baai/bge-small-en-v1.5`, reachable from a Worker's `AI` binding and from
   Node over REST — so vector-space parity holds by construction rather than by a
   numeric-equivalence argument. The Node origin uses the REST transport with
   `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`, the secrets the repo already
   deploys with; the binding takes over when the host moves into the Worker. No
   local stand-in embedder: it would make laptop vectors incompatible with
   production ones.
5. **The describer needs no credentials.** The `describe` seam resolves
   `['claude', 'claude_code']` in order, so it falls back to the authenticated
   Claude Code CLI when no API key is set.
6. **KM runs over both stores.** A corpus is a stored ticket query resolved
   against a *named* source (`store_for`), so "a shipped read-only directory" and
   "this tenant's D1 store" are the same code path with different sources. The
   system KB uses the former; tenant KBs will use the latter.
7. **The system KB sits above tenancy.** It is not inside anyone's store, it
   takes the scope parameters, and it runs the same queries for everyone.
8. **Index residency follows from FW-1.** A shipped corpus at this scale is a
   bundle-sized artefact; the loader takes its source from the host, so R2 or
   Vectorize remains available without a library change when the corpus grows.

## Tenancy (design inherited by the D1 store ticket, not built here)

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
- **Corpus editorial pass.** Which documents to drop and which to generate, once
  there is retrieval data to judge by (decision 2).

### Deferred

- **Corpus residency for a deployed Worker.** The KB is read today by the Node
  builder origin on the operator's machine, so `kb/system/` is gitignored and
  built on demand. When the host moves into the Worker (DOC-12 §7 phase 2) the
  index has to reach it — `writeIndexModule` emits it as an importable module,
  and the loader takes its source from the host, so R2 or Vectorize stays
  available without a library change. Nothing about that decision is forced yet.
- **Transcript granularity.** The chat archive homes a session as one file
  holding the whole transcript, rather than a row per message. Fine at builder-
  conversation length; if it stops being fine, the fix is a message-granular
  archive behind the same port in the framework, not a bespoke schema here.
  Recorded in DOC-10 §8.1.

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
DOC-12 (storage model — §7 phase 2 gates the D1 store) · DOC-8 §13 ·
framework REQ-99 / REQ-100 / REQ-101, REQ-71 (shipped KB),
REQ-40–44 / 49 / 53 / 76 (KM in Python), REQ-30 / 33 (Toolbox + ai_ticketing in JS).