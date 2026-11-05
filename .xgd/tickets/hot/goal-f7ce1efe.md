---
uid: goal-f7ce1efe
id: GOAL-33
type: goal
title: Knowledge management
created_by: xgd
created_at: '2026-08-24T22:38:42.816121+00:00'
updated_at: '2026-09-03T03:25:15.297202+00:00'
completed_at: null
last_field_updated: body
status: concept
fields:
  provenance: planned
  workstream: false
  children:
  - goal-deb3d7f8
  - goal-c1360ece
  - goal-d9c45a7e
---

Bring the knowledge-management system into the 1st Contact app.

DOC-10 commits to the substrate: per-site chat sessions, unbounded append-only growth, tail-prime, infinite scroll, no auto-summarization, plus a platform-level Reference Document library the AI consults on demand. REQ-123 revised that document -- the chat schema, the Reference Document library and the four memory tools are supplied by COMPONENTS rather than built bespoke here. The design intent did not change; the implementation route did.

Scope boundary per DOC-10: this is the conversation-history and AI-consulted-reference substrate. It does NOT cover the per-site Design Brief, which is owned by DOC-9 and stored as a site asset.

Children: core system, system KB, project KB.

## Next: the structured priming chain, upstream first (operator, 2026-09-02)

The next piece of work is **not in this project**. It is the structured priming
rework in lagrange-framework, which must complete before it can be adopted here.
Operator sequencing: *complete the structured priming changes for the KMS in LF
REQ-115 to REQ-118, then apply them to 1stcontact.*

| Ticket | What | Status 2026-09-02 |
|---|---|---|
| lf/REQ-115 | components/ai (Py) -- three-tier priming configuration: product/role/reminder entries with named providers | draft |
| lf/REQ-116 | components/ai (JS) -- three-tier priming configuration peer + conformance corpus | draft |
| lf/REQ-117 | components/knowledge -- KM sheds role purpose; split priming into landscape_text + mechanism_text | draft |
| lf/REQ-118 | components/ai_knowledge -- KM priming providers replace KnowledgeDocs; showcase stops minting role variants | draft |

lf/DOC-22 (Session Priming Configuration: three tiers, static text and
providers) is the design record.

The JS peer (REQ-116) is the one that matters for this project -- the 1c builder
runs in workerd, so the Python tier lands nowhere here. REQ-116 carries a
conformance corpus, which is what makes the two tiers verifiably the same
configuration rather than two implementations that drift.

**Adoption into 1c is not yet ticketed.** REQ-160 (session seeding and turn
reminders: two-KB priming, the change cursor, the delta channel) is
ready_to_reconcile and was built against the *current* priming shape. When the
three-tier configuration lands upstream, the 1c side needs a follow-on to move
onto it; that ticket does not exist. Worth filing before REQ-115 to REQ-118
close, or the adoption step becomes something remembered rather than tracked --
which is how the vendoring gap bit the REQ-93 collapse work on 2026-08-16.

Related open item on the priming-quality side: **REQ-171** (review the session
prompts and turn reminders, make the chat summary one of them) is draft here and
overlaps what REQ-117 changes upstream. Sequence it after, not alongside.

## Evidence as of 2026-09-02

The previous body said *no knowledge-management code in this repo yet -- the substrate arrived elsewhere; this goal is the adoption into the 1c app*. That is no longer true, and it had become the most misleading sentence on this goal. The adoption happened across 09-01 and 09-02, and DOC-39 (The Knowledge Management System) now exists as the design record.

| Ticket | What | Status |
|---|---|---|
| REQ-158 | The system KB in the Worker: bundle-resident index, AI binding, knowledge surface on the builder toolbox | bundled |
| REQ-159 | The project knowledge base: tenant-scoped corpus, incremental index, the two map triggers | bundled |
| REQ-160 | Session seeding and turn reminders: two-KB priming, the change cursor, the delta channel | ready_to_reconcile |
| REQ-162 | The product ticket store: D1 schema, the TypePack, the material types | free_and_reconciled |
| REQ-164 | Corpus export correctness: doc_kind filter, unrestricted shipped corpus, exhaustive listing | bundled |
| REQ-165 | Projected reference: the product own facts, generated rather than authored | bundled |
| REQ-166 | Capture to ticket: bundles become corpus members | ready_to_reconcile |
| REQ-175 | The consultant gets the whole of L1, and keeps getting it | free_coded |
| BUG-49 | kb build should infer CLOUDFLARE_ACCOUNT_ID from the API token | ready_to_reconcile |

Still open: **REQ-171** is draft, and **BUG-48** (a document in the corpus that is not in the index is a shipped lie) is draft.

BUG-48 is the one to watch. REQ-158 recorded on 2026-08-28 that 1c kb build had never run end to end against the real corpus -- kb/system/ held 33 exported markdown documents and no index, chunks or awareness map. That risk has now surfaced as its own bug rather than staying hypothetical: a corpus/index mismatch is exactly the failure an unexercised embed and describe pass was expected to produce, and it is silent by construction -- the assistant does not know what it cannot see.

What this goal asks for is priming correctness, not wiring. The wiring has landed; BUG-48 says the correctness has not been demonstrated yet.