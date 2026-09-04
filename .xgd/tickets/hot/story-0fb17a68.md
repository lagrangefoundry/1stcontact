---
uid: story-0fb17a68
id: STORY-131
type: story
title: 'Knowledge that keeps up: an upload is findable at once, and the landscape
  stays honest as the corpus grows'
created_by: xgd
created_at: '2026-09-04T03:35:17.905423+00:00'
updated_at: '2026-09-04T03:35:17.905423+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-203b1dc2
  capability_uid: capability-7cf24564
  story_kind: feature
  story_points: 2
---

## Story

**As a** business owner talking to the builder assistant,
**I want** a document I have just handed over to be findable in that same conversation without waiting, our long conversations to stay searchable without being reprocessed every turn, and the assistant's sense of what it holds about me to be a complete list while there is little of it,
**so that** I can give the platform something and immediately talk about it, and the assistant is never blind to what I just gave it and never pretending to a summary of a corpus it could simply read in full.

## Description

This is the freshness half of the client's own knowledge ([[CAP-107]]). The sibling story from the
same intent establishes *what* the corpus is, where its index lives and that keeping it current is
incremental; this story establishes **what drives the refreshes, and what the assistant is told the
corpus looks like at each size**.

Two things are kept apart on purpose, and running them off one trigger is the failure this story
exists to prevent:

- **Findability is cheap and must be near-live.** A record that is not indexed is *invisible*, so a
  document being recorded and that document being searchable are the same event from the client's
  point of view.
- **The landscape is expensive and only advisory.** Rebuilding it costs a model call per territory.
  A slightly stale landscape costs the assistant knowledge that a *kind* of thing exists, which is a
  far smaller loss than not finding a document at all — so it is never paid for inside the moment
  the client is waiting.

**In scope** (this story):

- The material trigger: recording a document, reference or brief makes it searchable before the
  recording call returns, and schedules the landscape rebuild behind that call rather than inside it.
- The conversation trigger: a conversation is re-indexed only once it has grown by a threshold
  amount of text, measured from a durable mark that is not kept on the conversation record — and
  conversation growth never rebuilds the landscape at all.
- The enumeration floor: below a **character budget** the landscape is a complete listing of every
  document, says in words that it is complete, emphasises nothing, and costs no model call; above it
  the corpus is clustered into described territories.
- The degraded path above the floor: with no way to describe territories, the rebuild refuses by
  name and the previously published landscape stands.
- The empty case: a client who has given us nothing yet is told so in words.

**Out of scope**:

- The corpus, the isolation guarantee, index residency, the incremental economics and the landscape
  record's lifecycle — the sibling story ([[STORY-130]]) from this same intent.
- Assembling the landscape into a conversation's priming and the per-turn delta channel — REQ-160
  owns these, and this intent explicitly defers to it.
- Calling the document trigger from a real upload path — REQ-161 and REQ-163 own the ingestion and
  Library routes; what lands here is the driven capability those call.
- *Where* the deferred rebuild eventually runs (a queue, a cron, or trailing the request) is
  deliberately left open: the capability ships a driven operation and the deferral is supplied by
  its host, so nothing here assumes a scheduler.

## Technical Context

- Specification: [[DOC-39]] §4 (two clocks, two triggers) and §7 (the enumeration floor). The intent
  states that DOC-39 is the specification and must not be re-decided here.
- **The intent's own enumeration budget was superseded before implementation.** The intent body
  proposed "title plus ~200 characters of body per document" inside a 2–4KB budget; [[DOC-39]] §7
  settles it as **titles only, within ~1KB**, because an excerpt conveys content and §6.1 says that
  is not the listing's job. Per the chain of authority the specification the intent defers to wins,
  and the criteria here are written to the titles-only rule. The excerpt survives only as the narrow
  per-entry fallback §7 allows, for a title that cannot stand alone.
- Nothing in the enumerated listing is emphasised, and that is a semantic rather than a cosmetic
  rule: an emphasised term in a landscape is read downstream as a *validated* search access point —
  one demonstrably shown to retrieve the territory it names — and a complete listing has no
  territories and validated nothing. Emphasis there would be an unearned promise.
- The threshold above which a conversation is re-indexed and the budget below which the corpus is
  enumerated are both tunable per host; the criteria below are written against whatever values a
  host is configured with, not against the shipped defaults.
- Related capabilities: [[CAP-107]] (this capability's corpus, index and residency), [[CAP-90]] (the
  per-site assistant conversations that grow), [[CAP-106]] (where the client's material lives).

## Reconciliation Decisions

- **A client who has given us nothing yet is told so in words** (decided at reconciliation,
  2026-09-03): the intent describes the floor as "enumerate below, cluster above" and says nothing
  about zero documents. The landed code produces a landscape stating plainly that nothing has been
  uploaded, captured or decided and that there is nothing here to search. Formalized rather than
  deferred, because the empty corpus is the *first* state of every account and an empty or absent
  landscape at that moment would read to the assistant as a failure to load rather than as an
  accurate statement about a new client. Formalized as the empty-corpus criterion.
- **A failed landscape rebuild never fails the recording of the document** (decided at
  reconciliation, 2026-09-03): the intent establishes that the rebuild is deferred and that the
  previous map stands when it cannot be built, but does not state what happens when the deferred
  rebuild itself fails. The landed code lets the recording call succeed regardless, leaves the
  previous landscape in place, and lets the next document write try again. Formalized because the
  alternative — an upload reported as failed because an advisory summary could not be regenerated —
  inverts the whole point of separating the two clocks. Formalized within the deferred-rebuild
  criterion.

No contradiction was found between the intent and the landed code. The one supersession the intent
records (its own proposed enumeration budget, overruled by [[DOC-39]] §7) is resolved in favour of
the specification, as the intent itself directs, and the criteria are written accordingly.

## Dependencies

- [[STORY-130]] — the client's own corpus, its index and its residency (plan item 5 of this
  reconciliation). This story is the freshness and landscape behaviour over that corpus.

## Story Points

2
