---
uid: capability-6cc3e339
id: CAP-111
type: capability
title: 'Project Knowledge Base: The Client''s Own Corpus, Its Index & Its Map'
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:28:22.719590+00:00'
updated_at: '2026-09-11T03:28:22.719590+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: project-knowledge-base
---

# Project Knowledge Base: The Client's Own Corpus, Its Index & Its Map

The other half of "what the assistant knows".

CAP-100 is the **shipped** knowledge base: our design documents, byte-identical for every
client, built once at release and sitting above the tenancy barrier. It is what makes the
assistant know about *websites in general* and about how this product works. This capability
is the half that makes it know something about **this business** — the conversations held
with this client, the material they uploaded, the reference sites captured on their behalf,
and the brief recording what was decided.

## What it is

- A **corpus** that is not a directory: it is the client's own material, read live out of
  the account's own ticket store. There is no export step and no second copy, because the
  corpus is written continuously by the people using the product rather than assembled at
  release.
- An **index** over it, and the index is the load-bearing half. A document that is not
  embedded is invisible, so indexing has to be near-live and therefore cheap — which is why
  it is a change-feed consumer rather than a rebuild, and why there is no "reindex this
  client" operation in normal running.
- A **landscape**: a complete listing while the corpus is small enough to enumerate, and a
  clustered map of described territories once it is not. The switch is a character budget,
  because the map exists only to compress a corpus that does not fit; full enumeration is
  the better case rather than the degraded one.
- **Two clocks**: the index moves on every write, the map only when new material arrives.
  Running both off one trigger is the failure this capability is shaped to avoid — it makes
  the cheap thing rare or the expensive thing constant.

## What makes it different in kind from CAP-100

- **It is tenant data.** Every corpus, every vector and every map belongs to exactly one
  account, and the account is bound into the handle rather than passed per call. The
  isolation is a hard barrier, not a filter: two accounts are two corpora, two indexes and
  two maps that cannot see each other. The *site* is only a predicate inside one account,
  deliberately, because two sites belonging to one client should share what has been
  learned about that client.
- **Its index does not ship.** The shipped index travels in the release artefact because it
  is the same for everyone. This one differs per account and is rewritten continuously, so
  it lives in private storage — and specifically not in the store that serves bytes to the
  public internet, because an index over a client's private material is a derivative of it:
  a vector per brand guideline, a body snippet per positioning paper.
- **Nobody opts a document in.** Membership is the kind of record it is. The client uploads
  a file or holds a conversation, and it is knowledge.

## What this capability is NOT

The store the material lives in and the vocabulary it is recorded with (CAP-106); the
ingestion that creates material from bytes; the Library surface that lists it; the
conversation that consumes the knowledge, including session priming and the per-turn delta.
This capability owns the corpus, its index, its triggers and its landscape — the driven
capability those surfaces call.
