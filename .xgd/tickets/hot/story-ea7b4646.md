---
uid: story-ea7b4646
id: STORY-139
type: story
title: 'Two Clocks For The Client''s Knowledge: Indexed As It Arrives, Described Behind
  The Conversation, And Listed In Full While It Is Small'
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:46:17.623468+00:00'
updated_at: '2026-09-11T04:01:55.641515+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-6cc3e339
  story_kind: feature
  story_points: 3
---

## Story

**As a** small-business owner talking to the assistant about my own business,
**I want** a document I hand over to be findable the moment I mention it, my
conversations to keep being remembered without slowing the next reply down, and
the assistant to be told honestly how much of my material it has — everything,
when everything is a short list,
**so that** it answers from what I have actually given it, and never behaves as
though my business is thinly known when in fact it knows all there is.

## Description

CAP-111's companion story (STORY-138) makes the client's corpus exist, private
to their account and cheap to index. This story is **when that index and that
map are refreshed, and what the assistant is told about the shape of the
corpus**.

The capability rests on two facts about the two artefacts, which have opposite
economics and therefore must run on different clocks:

- **Findability is cheap and load-bearing.** A document that has not been
  indexed is invisible to search, so indexing has to happen close to the moment
  the material arrives.
- **The description of the territory is expensive and advisory.** Rebuilding the
  map costs a model call per territory. A slightly stale map costs the assistant
  the knowledge that a *kind* of thing exists — a much smaller loss than not
  finding a document at all.

Driving both from one trigger fails in one of two directions: either the cheap
thing becomes rare (documents silently unfindable) or the expensive thing
becomes constant (every conversational turn paying for a map rebuild). So:

- **A conversation that grows is indexed in batches and never moves the map.**
  Earlier turns and other sessions for the same client stay searchable, which is
  what the live context cannot supply. The territory "conversations with this
  client" is stable from the first turn — the assistant is sitting in one — so
  re-describing it buys nothing.
- **Material the client gives us is indexed immediately and does move the map.**
  An upload is a request for attention: the client wants to talk about it now,
  so it is searchable before the operation that accepted it returns. The map
  rebuild is handed off rather than awaited, so the client is never waiting on a
  description while trying to discuss the document itself.

And **the landscape has a floor**. Below a budget measured in characters of
listing, the assistant is given a *complete listing of every document*, and told
in words that it is complete. Clustering three documents into territories
invents topology and makes it the first thing the assistant ever learns about
that client; and a short list read as "knowledge here is thin" produces very
different behaviour in front of a new client than the same list read as "you
know everything there is". Full enumeration is the better case, not the degraded
one — the map exists only because a corpus stops fitting.

**In scope**: the conversation-growth trigger and its batching; the
material-write trigger, its immediate findability and its deferred rebuild; the
single recycled map per knowledge base; the enumerate/cluster floor and the
listing's content, wording and restraint; the empty-corpus case; and the refusal
when the corpus has outgrown the listing and no describer is reachable.

**Out of scope**: the corpus, the account barrier, where the index lives and how
incrementally it refreshes (STORY-138, the companion); session priming, the
per-turn delta and the change-feed operation (REQ-160); the ingestion that turns
bytes into material and calls the material trigger (REQ-163); and the Library
surface (REQ-161). What lands here is the driven capability those call — this
story ships triggers, not a scheduler.

## Technical Context

- Both triggers are **driven operations, not a scheduler**. Where a deferred
  rebuild actually runs — trailing the request, on a queue, on a cron — is an
  open question the intent deliberately leaves open, so the hand-off point is a
  seam the caller supplies. The behaviour this story fixes is the *ordering*
  (indexed before return, described after), never the timing.
- **The two artefacts are one artefact downstream.** An enumerated listing and a
  clustered map are published into the same single report per knowledge base and
  read by ordinary priming, which is what makes the floor a local decision
  rather than a second path through the session. That report's record type is
  declared by STORY-138; what publishes into it is this story's.
- **Nothing is emphasised in the enumerated listing, and that is a semantic
  rule, not a style choice.** In the shared knowledge component's vocabulary an
  emphasised term in a landscape is a *validated* access point — one demonstrably
  shown to retrieve the territory it appears in, which the clustered path earns
  by running the reader's own search per candidate. A listing has no territories
  and no routing problem: every document is named. Emphasis there would make an
  unearned promise, and the reader is correctly told to search directly instead.
- **Supersession recorded by the intent itself**: REQ-159's body proposed a
  listing of "title plus ~200 characters per document" inside a 2–4KB budget.
  DOC-39 §7 — which the ticket names as the specification it must not re-decide —
  settles it the other way: **titles only, ~1KB**, because an excerpt conveys
  content and DOC-39 §6.1 says that is not the listing's job. The excerpt
  survives only as the narrow per-entry rescue §7 allows, for a title that cannot
  stand alone. The ACs follow DOC-39 §7. STORY-138 deferred this supersession to
  this story.
- **The known gap above the floor is declared, not accidental.** Clustering needs
  a model to describe each territory, and the knowledge component's own describer
  is unavailable in the deployed runtime. The intent's position is that the
  operation refuses by name and **the previously published map stands**, rather
  than being replaced by a mechanical paragraph that only restates what is
  rendered beside it. The ACs assert the refusal and the standing map; a
  runtime-side describer is a follow-up and is not asserted here.
- Related capabilities: CAP-111 (this capability — STORY-138 is the corpus and
  index half); CAP-100 (System Knowledge Base) shares the component and the
  declaration file but bundles its index at release; CAP-106 (Client Material
  Store) owns the records both triggers read; CAP-90 (AI Site Assistant) is the
  eventual consumer and is wired by REQ-160.

## Reconciliation Decisions

- **An empty corpus is described in words rather than as an empty listing**
  (decided at reconciliation, 2026-09-10): REQ-159 specifies the floor for a
  *small* corpus and is silent on a corpus with nothing in it. The landed
  behaviour states plainly that this client has uploaded, captured and decided
  nothing yet and that there is therefore nothing to search. Formalized as an AC,
  because the empty case is the state every account is in for its first
  conversation, and the failure it guards against is the same one the floor
  exists for: an empty listing with no sentence beside it reads as a knowledge
  base that failed rather than one that is legitimately new. This is
  reconciliation filling a gap in the spec, not an operator request.

- **Repeated conversation growth below the threshold indexes nothing, and the
  batching point is not recorded on the conversation itself** (decided at
  reconciliation, 2026-09-10): REQ-159 states the batching rule ("every ~N
  thousand characters") but not what a caller observes on the second call.
  Formalized as an AC covering both halves — that the batch point advances so the
  same growth is never charged twice, and that the conversation record is
  unchanged by having been indexed — because a batching rule with no durable,
  advancing batch point degrades silently into "index every turn", which is the
  precise failure this design exists to prevent and which no single call can
  reveal.

No contradiction between intent and code was found for this plan item. The one
supersession in play (DOC-39 §7 over the ticket body's own enumeration budget) is
recorded in Technical Context and is intent settling intent, not code overruling
it.

## Dependencies

STORY-138 (plan item 5) — the client's corpus, its account barrier, where its
index lives and its incremental refresh. This story is the clocks over that
index and the description of that corpus.

## Story Points

3