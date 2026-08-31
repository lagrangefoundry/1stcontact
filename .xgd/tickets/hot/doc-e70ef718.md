---
uid: doc-e70ef718
id: DOC-10
type: doc
title: Chat Session Persistence and AI Memory
created_by: xgd
created_at: '2026-06-30T01:02:05.433710+00:00'
updated_at: '2026-08-31T00:50:27.937839+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
  system_kb: true
---

# Chat Session Persistence and AI Memory

> **Revised (REQ-123).** This document predates both the ticket store and the
> knowledge-management components, and specified bespoke machinery for each. The
> substrate arrived; the design intent did not change. Three things are now
> replaced by components rather than built here — the chat schema (§8), the
> Reference Document library (§6), and the four memory tools (§5.2) — and each
> section says what replaced it and why. Everything else this document commits
> to still holds: per-site sessions, unbounded append-only growth, tail-prime,
> infinite scroll, no auto-summarization.

## 1. Purpose & Scope

The 1st Contact builder is a chat-driven product. Today the chat history lives in browser memory only (`BuilderStore.chatHistory` in `packages/builder-ui/src/store.ts`) and is lost on reload. This document commits the architecture for persistent, searchable, per-site chat sessions plus a platform-level **Reference Document** library the AI consults on demand.

The scope is deliberately narrow to the chat + memory substrate. It does NOT cover the Design Brief (per-site canonical decisions doc) — that is owned by [[DOC-9]]. The Brief is a separate artifact stored as a site asset; this doc is about **conversation history** and **AI-consulted reference material**.

Paired with:

- [[DOC-4]] — product vision
- [[DOC-5]] — platform architecture (Cloudflare substrate)
- [[DOC-7]] — framework principles
- [[DOC-8]] — builder UI principles
- [[DOC-9]] — Web Reference Fetching and the Design Brief (per-site Brief)

**This document commits to:**

- **Per-site chat sessions** — every session belongs to exactly one site. No cross-site references, no global "my chats" view.
- **Multiple sessions per site** — onboarding, theme tuning, content editing, etc. The operator can start a new chat at will; old chats remain accessible from a session list scoped to the current site.
- **Unbounded append-only growth** — no truncation, no summarization, no compaction in the persistence layer. Sessions just grow.
- **Tail-prime + tools** — the AI is primed with the last ~5k characters of the active session on every turn. To reach further it uses tools (§5.2).
- **Infinite-scroll UI** — the chat panel loads the last ~5–10k characters of the active session and lazily fetches older messages as the operator scrolls upward.
- **Cloudflare-native primary store** — D1 for sessions and messages, R2 for blob attachments (screenshots, fetched HTML, future digests). KV cache optional, not required.
- **Sessions are tickets** — the D1 store is the `@lagrangefoundry/ticketing` component with `chatSchemas()` merged into the product TypePack, not a bespoke chat schema (§8).
- **Platform knowledge is a knowledge base, not a curated library** — the AI reaches the real design documents through the declared knowledge surface (§6). There is no parallel distilled document set to maintain.
- **No XGD *methodology* in the product runtime** — the customer-facing product does not carry stories, sprints, or the development workflow. It does carry the ticketing *component*, which is a general-purpose typed document store that XGD also happens to use. That distinction is the whole of the reversal from this document's first draft.

**This document deliberately does not commit to:**

- The knowledge-management implementation itself — it is a framework component (see §6).
- Auto-summarization or compaction (the AI's search tools cover navigation; we revisit only if priming becomes expensive).
- Anything below the tenant boundary being *structurally* isolated. The hard barrier is the account (§4.1); a site is an object inside it, and site isolation is a predicate bound once, not a property of the store.
- A cross-chat "references library" UI for chat search results — the AI consumes search through tools; the user navigates through the session list.
- Reference doc editing UX in v1 — initial docs are seeded; operator editing is a follow-up.

---

## 2. Use Cases

### 2.1 Resume yesterday's conversation

Operator returns to their site. The builder loads with the most-recent chat selected and the last few thousand characters of conversation visible. They scroll up to see what they discussed last time, ask a follow-up. The AI is primed with that same tail.

### 2.2 Start a fresh thread on the same site

Operator clicks "New chat". A new session is created bound to the current site. The previous chat remains in the session list for that site, searchable, scrollable.

### 2.3 "What did we decide about the palette?"

Operator asks the AI a question whose answer lives in an older chat. The AI calls `search_transcripts(query="palette", site_id=…)`, gets matching message ranges, calls `read_session_range` to pull the context, answers grounded in the actual prior discussion.

### 2.4 The AI needs platform knowledge

Operator asks for something the AI doesn't have in its prompt context (e.g., "what dial values does the hero-split module support?"). The AI calls `list_reference_docs` → `read_reference_doc(slug="modules/hero-split")`. The system prompt stays small; deep knowledge is on-demand.

---

## 3. Core Model — Two Memory Surfaces

The AI has two distinct memory surfaces, with different cardinalities and lifetimes:

| Surface | Owner | Lifetime | Mutation pattern | Shape |
|---|---|---|---|---|
| **Chat sessions** | Per-site, per-thread | Unbounded; append-only | Append on every turn | Sequence of role-tagged messages |
| **Reference docs** | Platform-global | Long-lived; edited rarely | Distilled and curated | Markdown with summary + ToC + sections |

The **Design Brief** ([[DOC-9]]) is a third memory surface — per-site canonical decisions — and is orthogonal: it's a site asset, not a chat artifact, and is loaded by name when the AI needs the site's identity.

Key property: **chat sessions are durable but not authoritative**. They are the conversation record. Decisions extracted from chats migrate into the Design Brief (per-site) or, for product-shaping insights, into the reference doc set (platform-wide).

---

## 4. The Chat Session

### 4.1 Identity and scope

- A session has an opaque ID, belongs to a **tenant**, and names a `site_id`. The session list and search are scoped to a single site; no cross-site access.
- **The tenant is the account, and it is the hard information barrier.** A site is an object — or a set of objects — inside a tenant, not a tenant of its own. The store binds tenancy into the handle at construction, so nothing below can reach across it; there is no handle spanning two accounts.
- **Site isolation is one level down, and is a predicate rather than a property.** Within a tenant, `site_id` selects; a query that omits it sees the same client's other sites. So the site scope is bound **once**, into the session's store handle and the knowledge runtime's KB scope, and never left to individual call sites. The two scopes are the same shape at different strengths, and the difference is deliberate: sites belonging to one client *should* share accumulated knowledge — brand voice, terminology, decisions already made — so their second site does not start as cold as their first.
- Session title is AI-generated after the first turn (one-line summary) and operator-editable.
- Sessions carry created/updated timestamps for list ordering.

### 4.2 Messages

- Append-only sequence, ordered, with ordering allocated server-side so it is canonical rather than client-asserted.
- Each message has a role (`user` | `assistant` | `system` | `tool_result`), content, optional tool calls, and a timestamp.
- No editing or deletion of individual messages in v1 (mirrors the append-only model). Session-level delete is supported.
- Appends are compare-and-set against the version read, so two concurrent writers produce a conflict rather than a silent clobber. See §8.1 for how the transcript is actually stored.

### 4.3 Search

- Transcripts are a knowledge base like any other: chunk-indexed and searched
  semantically alongside the platform documents, in one ranked result set (§6).
- Scoping is structural, not a predicate the caller must remember to add. A
  tenant-scoped store handle injects the scope on every read, so "the AI cannot
  see another tenant's conversation" is a property of the handle rather than a
  discipline applied at each call site.
- Returned matches carry enough locator to pull the surrounding context.

### 4.4 Attachments

- Heavy blobs (screenshots, large fetched documents, future Reference Digests from [[DOC-9]]) live in R2.
- The message references attachments by key in `tool_calls_json` or as inline markdown image syntax pointing at `/assets/<key>`.
- Deletion of a session triggers a sweep of its referenced R2 keys.

---

## 5. Tail-Prime & AI Memory Tools

### 5.1 Priming protocol

On every chat turn for the active session:

1. The control-app loads the last ~5000 characters of the session (configurable; not 5000 messages — 5000 *characters* of concatenated content, walked back from the tail).
2. This tail is included verbatim in the messages array sent to the model — it's not a summary, it's the raw recent transcript.
3. The system prompt says the agent is looking at the tail of the session and names how to reach the rest. That wording is *generated*, not written here — the toolbox projects a manual from the declared surface, so the instructions and the tools cannot drift apart.
4. Platform documents are NOT inlined. What is inlined is the knowledge base's **awareness map** — a description of what territories of knowledge exist and how to enter them. The AI fetches bodies on demand.

### 5.2 Tool surface

Superseded. This document specified four tools; they are now operations on the
**declared knowledge surface** (`knowledge_surface.json`), bound to a runtime
holding the knowledge bases this session may see.

| Was | Now |
|---|---|
| `search_transcripts` | knowledge search, scoped to the transcripts KB |
| `read_session_range` | document read, by locator |
| `list_reference_docs` | the awareness map, injected at priming (§5.1) |
| `read_reference_doc` | document read, by uid |

The reason for the change is that the two families were the same operation twice.
Transcripts and platform documents are both corpora of text the AI needs to find
things in; declaring them as two tool families meant the AI had to know which
kind of thing it was looking for *before* it could look, and meant two search
implementations to keep honest. As knowledge bases they are one search with a
scope argument, and a question whose answer is half in a document and half in
last week's conversation returns both, ranked together.

Declaring rather than hand-writing the surface also buys what this document
would otherwise have had to specify per tool: argument validation, the capability
grant, results marked untrusted (documents and transcripts are prose entering a
model's context), an audit trail, and the projected manual from §5.1.

These operations, combined with the builder action tools (the L1 control surface,
[[DOC-30]]), give the AI bounded-prompt access to unbounded memory.

### 5.3 Why this approach

- **No summary risk.** Auto-summarization would hide intent under paraphrase. The AI reads source-of-truth message text every time.
- **No context-window arms race.** Tail size is a single tunable knob. If 5k feels short, dial it. Never need to compact.
- **The map, not the pile.** What primes a session is a description of what knowledge exists and how to enter it, not the knowledge itself. That is what keeps the prompt bounded as the corpus grows to thousands of documents.

---

## 6. Platform Knowledge

This section originally specified a **Reference Document library**: a curated,
hand-distilled set of documents, stored in its own table, seeded at build time,
kept parallel to the real design documents. That is replaced by a **knowledge
base over the real documents**, and the replacement is a simplification rather
than a substitution — the whole distillation step disappears.

### 6.1 Why the distilled set is gone

Distillation was a workaround for retrieval that did not exist. If the only way
to reach knowledge is to list documents and read whole bodies, then the document
set must be small and pre-condensed, or the AI drowns. Chunk-level semantic
search removes that constraint: the AI retrieves the passages that answer the
question, from documents of any length, so the corpus can be the real thing.

Keeping the distilled set would have cost what parallel copies always cost — a
second source of truth that drifts from the first, silently, and is only noticed
when the AI confidently states something the design documents stopped saying
months ago. A curated set is a maintenance obligation that pays for itself only
while retrieval is weak.

### 6.2 The system knowledge base

Platform knowledge is a knowledge base whose corpus is **the design documents
that ship with the release**. It is:

- **shipped, not seeded** — the corpus is a directory of markdown that travels
  with the release, and its vector index is a build artefact beside it. Nothing
  is created in any tenant's store, so there is no per-deployment copy free to
  drift, and upgrading the software is not a data migration.
- **read-only and identical everywhere** — every tenant sees the same system KB.
- **one KB among several** — a tenant's own knowledge (their transcripts, their
  brief, their uploaded material) lives in knowledge bases in *their* store, and
  a search can span the ones the session is scoped to.

### 6.2.1 It sits above tenancy

The system KB is not tenant data and lives in nobody's store, so it is above the
barrier of §4.1 rather than inside it.

It still **takes** the scope parameters — tenant and site — and may require them,
but it does not vary by them: the same queries run for everyone. Requiring a
scope it will not use is deliberate. It means there is exactly one call
signature, so no second, unscoped path exists for a tenant-data query to be
routed down by mistake; and it means the audit trail records who asked, in what
scope, even for the queries whose answer does not depend on the answer.

One consequence worth knowing: because a system-KB query is scope-invariant,
identical query text yields identical results for every tenant, so its results
are safely cacheable *across* tenants. It is the only KB where that holds. The
cache boundary is therefore per-KB and not per-search — a search spanning the
system KB and a tenant KB produces a ranked set whose composition is
tenant-specific even though half its inputs are not.

### 6.3 What is in it

**Seed material, not a policy.** Corrected here because the original wording of
this section read as a settled principle and has since been cited as one.

What it said was that the KB holds *"every design document, in full"*, with
*"deliberately no curation pass"*. What was meant was narrower and temporary:
point the machinery at the documents that already existed, so the indexing,
awareness and retrieval path could be exercised at all. It was a development
expedient chosen to make the system testable, and it was never a claim about what
the finished corpus should contain.

The distinction matters because the two readings lead to different products. As
policy it says the AI should read the documents we write for *ourselves* — design
rationale, rejected alternatives, construction contracts — which is a category
error: material authored for someone deciding how to build the product, consumed
by something advising a client. As seed material it says only that this is what
was lying around when the corpus needed contents.

What the system KB should actually hold is settled in [[DOC-39]] §3, which
distinguishes documents authored **for the AI** from architecture documents
authored **for us**, and treats the two as different kinds rather than as one set
with a membership flag.

**The seed set stays until the machinery is proven.** It is the only corpus that
exists, and the acceptance test for wiring the KB into the Worker is that the AI
answers from a document and names it. Replacing the corpus before that test can
run would remove the thing the test needs. Seed first, verify, then author.

### 6.4 Lifecycle

The corpus is exported from the design documents and indexed as a release build
step, so it re-derives whenever the documents move. Operator-authored knowledge
is not in scope here; when it lands it is a knowledge base in the tenant's own
store, which is the same mechanism with a different source.

---

## 7. UI Behavior

### 7.1 Loading and scrolling

- On chat panel mount, load the last ~5–10k characters of the active session (single paginated API call).
- When the operator scrolls to the top of the visible buffer, fetch the next page upward. The API is a cursor going backwards through the transcript; whether that cursor is a row offset or a position in a stored document is §8.1's business, not the UI's.
- No artificial loading spinner mid-scroll; preload as the operator approaches the top.

### 7.2 Session list

- Sidebar or dropdown in the chat panel listing all sessions for the current site, ordered by `last_message_at` descending.
- Each row shows title + relative timestamp.
- "New chat" action at the top.
- Selecting a session loads its tail.

### 7.3 No cross-site UI

- There is no global chat search UI, no "all my conversations" view. If the user switches sites, the session list updates.
- The AI's search is likewise scoped — operators never see a result from another site, and neither does the AI on their behalf. This is enforced by the scoped store handle, not by the UI (§4.3).

---

## 8. Storage & Schema (logical)

Superseded. The four bespoke tables this section specified — `chat_sessions`,
`chat_messages` + FTS5, `reference_docs` + FTS5 — are replaced by the ticket
store, which is a typed, versioned, multi-tenant document store on D1 with the
schema, validation, tenant scoping, id allocation, linking and comment model
already built and conformance-tested.

The mapping:

| Was | Now |
|---|---|
| `chat_sessions` row | a `chat` ticket (`fields.session_id` for reopen lookup, `fields.backend`, `fields.title`) |
| `chat_messages` rows | the session transcript, held in a `chat_transcript` comment on that ticket |
| `chat_messages_fts` | the transcripts knowledge base (§4.3) |
| `reference_docs` + FTS5 | the shipped system knowledge base (§6) |
| `site_id` on every table | the tenant scope, bound into the store handle |

The chat ticket's **body is not the transcript** — it is the home of the
AI-maintained summary. Transcript and summary are different things with different
lifetimes and the store keeps them apart.

### 8.1 One divergence worth naming

The component homes a session as *one comment holding the whole session file*,
updated compare-and-set, rather than as one row per message. That is a good fit
for resumability — the session's segment chain and thresholds round-trip with the
transcript, so a reopen loses nothing — but it means §4.2's per-message `ord` and
§7.1's `?before=:ord` upward pagination do not map to rows. Paging backwards is
slicing a document, not scanning an index.

At the length of a builder conversation this is a non-issue. If sessions get long
enough that rewriting the whole file per turn or slicing it per scroll starts to
hurt, the fix is a component-level change (a message-granular archive behind the
same port) and not a bespoke schema here. Recorded so that the day it hurts, the
reason is already written down.

---

## 9. Lifecycle, GC, and Non-Goals

- **Session delete**: cascade-deletes messages, sweeps R2 attachment keys referenced from those messages.
- **Site delete**: cascade-deletes all sessions belonging to that site (and their attachments).
- **No archival distinction**: sessions don't have an "archived" status. They exist or they're deleted.
- **No per-message edit/delete** in v1.
- **No automatic pruning** by age or count.
- **No anonymous mode** — every session belongs to a site, which belongs to an account.

---

## 10. What this document got right, and what it did not

Worth recording, because the pattern repeats.

**Right:** the *shape* of the answer. Bounded prompt, unbounded memory, reached
by tools. A map rather than a pile. Source text rather than paraphrase. Nothing
in §2, §3, §5.1, §7 or §9 needed changing.

**Wrong:** assuming each piece had to be built here. The document specified a
chat schema, a search index, a document library, a curation pipeline and four
tools — five pieces of infrastructure, described as product architecture. Four of
them turned out to be general-purpose components that a second consumer would
have needed anyway, and one of them (the distilled library) turned out to be
unnecessary once retrieval was real.

The tell was §10's original title, "Forward Compatibility (KMS)". A section
explaining how a hand-built thing will accommodate the real thing when it arrives
is a section arguing for waiting for the real thing.

---

## 11. Decomposition into REQs

The original decomposition named REQ-23 through REQ-26. Those numbers were never
allocated to this work and now belong to unrelated tickets, so the links were
dangling; the work is carried by:

1. [[REQ-122]] — **Builder chat UI**: the chat panel and its transport.
2. [[REQ-123]] — **Ticket store + system KB**: D1 binding and migrations, the
   product TypePack merged with the chat schemas, tenant scoping, the shipped
   system knowledge base, and the priming and tool wiring that connect them to
   the chat session.

REQ-123 depends on JS peers of the knowledge components, tracked in
`lagrange-framework` as REQ-99 (knowledge), REQ-100 (the AI bridge) and REQ-101
(awareness build).

---

## 12. Open Questions

- Tail size — start at 5000 chars but make it a config knob from day one.
- **Tenant grain** — a tenant per site, or per account with site as a field.
  Decided in REQ-123, before the schema lands.
- Attachments — a separate ticket type, or referenced by key from the transcript.
  (Lean toward referenced-by-key, with GC driven from the reference.)
- Session title generation — sync at end of first turn, or background job?
  (Lean: sync; fall back to a truncated first user message if it fails.)
- Whether development-process documents in the system KB hurt retrieval (§6.3).
  Answered with data, not in advance.

---

## Appendix A — Transcript context

This document and its child REQs originate from a sequence of design conversations. The key excerpts are embedded in each REQ for resumability; the full conversations live in:

- [[CHAT-13]] — AI Web Access (introduces the unbounded-append + tail-prime + knowledge-aware document model)
- The originating conversation — confirms per-site scoping and the reference-docs concept
- The REQ-123 session — replaces the bespoke schema, the reference-doc library and the four memory tools with components; source of the revisions marked in §5.2, §6, §8, §10 and §11

When picking up work in an intent-specific session, the relevant excerpts are already attached to that intent's REQ.