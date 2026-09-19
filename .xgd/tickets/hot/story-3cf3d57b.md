---
uid: story-3cf3d57b
id: STORY-149
type: story
title: Start every conversation knowing both bodies of knowledge, and hear about new
  material the turn after it arrives
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:26:34.496738+00:00'
updated_at: '2026-09-19T14:29:56.698257+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-8e1807f6
  capability_uid: capability-7e4714b7
  story_kind: feature
  story_points: 3
---

## Story

**As a** person whose site is looked after by an assistant, **I want** every
conversation to start knowing both how this system works and what material I
have handed over, to search the two together as one body of knowledge, and to
be told inside the conversation the moment something new of mine arrives —
**so that** I can upload a document while we are talking and have the assistant
use it on the very next thing I say, without waiting for anything to be rebuilt
and without having to tell it twice.

## Description

This story owns what a conversation is told about the two bodies of knowledge
it has, and the channel by which it learns that one of them has grown.

Two knowledge bases exist by the time this story begins: the one that ships with
the software and describes how this system builds and publishes sites, and the
client's own — their brand paper, their menu, their photographs — which is
uploaded, indexed and mapped while conversations are happening. Until this story
they were two things the platform could open and never one thing a conversation
could reach.

In scope:

- **One landscape, both maps.** A conversation is primed with a single
  description of what exists, carrying the client's map and the system's map
  together, the client's first, followed by what this assistant is for and then
  by how to search and what it may do. The two are deliberately *not* presented
  as separate territories: a question half-answered by a design document and
  half by the client's own paper must return both.
- **One search over two independent bodies.** The two knowledge bases keep their
  own material, their own index and their own rebuild rhythm; they meet only at
  the point where results are shown. A search reaches both and comes back as one
  list ordered by the relevance each side itself computed, cut to the number of
  results asked for after the two are merged rather than before.
- **The per-turn arrival notice.** A map is a description, not a notification —
  a new brand document lands inside the existing "brand and positioning"
  territory and changes the map's prose not at all. So each turn separately
  carries what has entered the client's knowledge since the last turn of *this*
  conversation, by name and by exact count, and nothing at all when nothing
  arrived.
- **Each conversation's own place in the record.** What a conversation has
  already been told about advances turn by turn, starts exactly where the map's
  coverage ends, and never announces the same arrival twice — including when
  several documents arrive in the same instant, and including across a reload,
  an eviction or a redeploy, which is what makes a resumed conversation report
  what arrived while the client was away without any separate "while you were
  away" report existing.

Out of scope (owned elsewhere, or declared blocked by the intent):

- The client corpus itself, its indexing and its map rebuilds — owned by the
  project knowledge base capability.
- The conversation's own home as a ticket, its transcript and the record field
  the cursor occupies — owned by the conversation story this one depends on.
- The AI-maintained summary a conversation's record will eventually carry. Until
  something writes it, a conversation carries its identifier and nothing else.
- A temporal query the client can ask directly ("what have we added since we
  last spoke?"). The intent declares this blocked on the knowledge component and
  waiting; it did not ship, and no criterion here claims it.
- Removals. The arrival feed is reliably additive and unreliably subtractive; an
  archived or detached document may not surface. Recorded by the intent, not
  solved by it.

## Technical Context

Both knowledge bases are read through the same granted, read-only knowledge
surface the conversation already has (CAP-90, CAP-100, CAP-111) — this story
adds no new way in and no new operation the assistant may call. Priming reads
each map as an ordinary record read and never touches an index, which is why a
map rebuilt behind a turn is picked up on the next one with no new machinery,
and equally why priming alone can never *notify*.

The merge across the two searches is sound only because both indexes are built
with one embedding model and one set of ranking dials, which the knowledge
component already requires; nothing here re-ranks, re-weights or re-scores, so
there is exactly one answer to how hits are ordered. The intent records this
fan-out as the interim shape: when the component can take one index per
knowledge base the merge moves inside the ranking and this layer deletes. That
is a change of implementation only — every criterion below survives it.

The arrival feed is the same "changed at or after this moment" query the project
knowledge base already consumes for indexing, read with a different bookmark.
Because that query is inclusive at its boundary — chosen so an indexer cannot
miss a document written in the same instant its bookmark was taken — the
bookmark has to travel with the identities that sat exactly on the boundary, or
the newest document is re-announced every turn forever. That is why "nothing is
announced twice" is a criterion and not an implementation note.

The bookmark is advanced before the turn rather than after it, which is the
opposite of the draft-change baseline the same reminder carries. The asymmetry
is deliberate: the assistant cannot write to the corpus, so there are no writes
of its own to absorb, and advancing late would re-announce an upload if a turn
were abandoned. The bookmark is also written without a compare-and-set, unlike
the transcript fold: two turns racing to move a bookmark forward both move it
forward, and refusing a turn to protect a bookmark would be the wrong trade.

Dependency on CAP-90's conversation story is structural rather than incidental:
a bookmark with nowhere to live would be recomputed from the map on every turn,
so the first upload of a conversation would be announced again, and again.

## Reconciliation Decisions

- **The arrival notice covers the client's own knowledge alone** (decided at
  reconciliation, 2026-09-13): REQ-160 says "each turn asks the corpus what
  changed" without saying which corpus, and is silent on the shipped one. The
  landed code sweeps the client's corpus only, and the reasoning is a fact about
  the corpora rather than a shortcut — the shipped knowledge base is a release
  artefact, byte-identical for every client and changed only by upgrading the
  software, so a feed over it is a query that is always empty and asking it every
  turn costs a scan to prove what the deployment model already guarantees.
  Formalizing it also settles the degenerate case the intent never names: a
  conversation with no client knowledge open at all runs its turns with no
  arrival notice rather than failing. Formalized as AC-1808.

- **The arrival notice is placed after everything stable in the turn's context**
  (decided at reconciliation, 2026-09-13): REQ-160 states the rule as a cost
  decision — "stable material sits before volatile material, so the seeded
  prefix stays prompt-cached for the life of the session" — but states it under
  *Decided* rather than under *Acceptance*, so no acceptance line covers it. It
  is observable in the assembled turn and it is the difference between a cached
  prefix and one invalidated every turn, so it is formalized here rather than
  left as commentary. Formalized as AC-1807.

- **The temporal query is deliberately not formalized** (decided at
  reconciliation, 2026-09-13): REQ-160's *Acceptance* lists "a delta above the
  cap … remains reachable through the change-feed operation" and "the change-feed
  operation appears in the projected manual", but the same ticket's *Depends on*
  section says of that operation "the second is genuinely blocked and waits"
  (lagrange-framework REQ-112). The intent scopes it out in its own words, and it
  is absent from the code, so no criterion here claims it. This is an
  un-delivered piece of REQ-160, not a contradiction between intent and code:
  AC-1800 states the truncation and the exact count, and stops there.

## Dependencies

- **STORY-103 (story-a58a0974)** — the conversation homed in a chat ticket, and
  the field on it this story's bookmark occupies. Without it the bookmark has no
  home with a lifetime that matches the conversation.
- The system knowledge base (CAP-100) and the project knowledge base (CAP-111)
  must both be buildable and openable; the arrival notice is inert without a
  corpus that changes.

## Story Points

3