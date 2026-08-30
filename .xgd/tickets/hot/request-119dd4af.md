---
uid: request-119dd4af
id: REQ-159
type: request
title: 'The project knowledge base: tenant-scoped corpus, incremental index, and the
  map''s two triggers'
created_by: xgd
created_at: '2026-08-30T23:18:38.731734+00:00'
updated_at: '2026-08-30T23:18:38.731734+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
---

# The project knowledge base: tenant-scoped corpus, incremental index, and the map's two triggers

## Why

[[DOC-38]] §8 declares two knowledge bases. [[REQ-158]] ships the static one.
This is the other half — the client's own knowledge, which is the half that makes
the builder AI know anything about *this* business rather than about websites in
general.

[[DOC-39]] is the specification; this ticket implements §3, §4 and §7 of it. It
should not re-decide anything that document settles.

## The corpus

Types `chat`, `material`, `reference` and `brief` in the **tenant's own ticket
store** — so the KB declares no `source` and reads the project store, unlike
`system` which is `shipped`.

**Tenancy is bound once, into the handle**, never passed per call
([[DOC-10]] §4.1, §4.3). The KB scope and the store scope are the same shape at
different strengths: the tenant is a hard barrier, the site is a predicate — and
that difference is deliberate, because two sites belonging to one client *should*
share accumulated knowledge.

## Index residency: not the bundle

[[REQ-158]] puts the system index in the Worker bundle. **That decision does not
transfer and must not be copied here.** This corpus is tenant data, differs per
tenant, and is written continuously, so it goes behind the R2 or store-backed
`IndexSource` path. Same seam, different implementation.

## Two clocks, two triggers

Per [[DOC-39]] §4, and the failure this ticket exists to avoid is running both
off one trigger.

**The index is a change-feed consumer.** `corpusPredicates(spec, {since})`
restricts to `updated_at >= cursor` and re-embedding is idempotent, so there is
no "reindex the project KB" operation in normal running.

| Corpus member | Index | Map |
|---|---|---|
| Transcripts | every ~N thousand characters | **never** |
| `material` / `reference` / `brief` | on write | **rebuild** |

**Transcripts never trigger a map rebuild.** The territory "conversations with
this client" is stable from the first turn and its description never usefully
changes — the AI already knows it is in a conversation. They still need index
freshness, because search over transcripts answers what the live context cannot:
earlier turns, and *other sessions on the same site*.

**Material does trigger one, because an upload is a request for attention.** The
client is not being thorough; they want to discuss it now.

**The rebuild is asynchronous.** A map build is cluster + an LLM describe per
territory + a validating search per candidate access point. Run synchronously on
upload it stalls the AI exactly when the client is waiting to talk about their
document. Async is safe because search needs only the index — see [[REQ-159]],
which makes the arrival visible without waiting for the map.

## The floor: enumerate, then cluster

A new tenant has three documents, and clustering three documents into territories
invents topology. Below the floor the landscape section is a **complete listing**
— title plus ~200 characters per document — and is **labelled as complete**, so a
short list reads as *"you know everything there is"* rather than *"knowledge here
is thin"*.

The threshold is a **character budget** (~2–4KB, about a dozen documents), not a
document count: the map exists only because a corpus does not fit, so full
enumeration is the better case, not the degraded one.

## Out of scope

- **Seeding, the delta channel and the change-feed operation** — [[REQ-159]].
- **The site source adapter** ([[DOC-38]] §8.3) — a later corpus member; nothing
  here should assume it is absent or present.
- **Attachments** (`lagrange-framework` REQ-104) — `material` tickets carry their
  text shadow in the body, which is all the corpus reads, so this does not wait
  on bytes.

## Acceptance

- A `project` KB resolves its corpus from the tenant's store, and a search
  scoped to a tenant returns nothing belonging to another — asserted, not assumed.
- Indexing is incremental: a new `material` ticket is searchable without a full
  rebuild, and re-running the indexer embeds nothing already embedded.
- A transcript growing past the character threshold becomes searchable **and does
  not trigger a map rebuild** — both halves asserted.
- A new `material` ticket triggers a rebuild that does not block the turn.
- Below the floor the landscape enumerates and says so; above it, it clusters.
- **The behavioural test:** upload a positioning document, then ask a question
  answerable only from it, in a later turn. The AI answers from the document.

## Open questions

- The character thresholds — transcript batching, and the enumerate/cluster
  budget. Start configurable, tune with real corpora.
- Whether the enumerate/cluster switch is per-KB or global ([[DOC-39]] §10).
- Where the async rebuild runs — queue, cron, or trailing the request. The
  component ships a driven operation, not a scheduler.
