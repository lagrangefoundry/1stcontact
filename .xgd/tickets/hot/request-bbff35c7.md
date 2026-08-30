---
uid: request-bbff35c7
id: REQ-160
type: request
title: 'Session seeding and turn reminders: two-KB priming, the change cursor, and
  the delta channel'
created_by: xgd
created_at: '2026-08-30T23:19:07.355942+00:00'
updated_at: '2026-08-30T23:19:07.355942+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  depends_on:
  - REQ-158
  - REQ-159
  auto_merge_back: true
  needs_review: false
---

# Session seeding and turn reminders: two-KB priming, the change cursor, and the delta channel

## Why

[[REQ-158]] primes a session against one knowledge base. [[REQ-159]] adds a
second that changes *during* the conversation. This ticket is what makes the
second one visible.

The problem, stated concretely:

> The AI asks *"do you have any positioning material?"* The client says yes and
> uploads it. Nothing tells the AI it arrived.

[[DOC-39]] §5 and §6 are the specification. The essential finding it records:
**this is not a priming-freshness bug.** Priming already runs every turn and the
map is an ordinary ticket read, so a rebuilt map is picked up next turn with no
new machinery. The fault is that **a map is a description, not a notification** —
a new brand document lands inside the existing "brand and positioning" territory
and changes the map's prose not at all. Correct, current, freshly read, and
silent.

So the delta has to travel separately from the description.

## Three pieces

### 1. Seeding, with both maps in one landscape

`primeSession` assembles landscape → role purpose → mechanism and trigger, and
that order is the component's and is load-bearing.

Both KBs appear in **one** landscape section. Splitting them would recreate what
[[DOC-10]] §5.2 removed when it merged the transcript tools into the knowledge
surface: the AI having to know which *kind* of thing it was looking for before it
could look. A question half-answered by a design document and half by the
client's own paper must return both, ranked together.

Project map first, then system — the client's material is what the session is
about, and the role purpose already frames standing capability. Cheap to flip.

### 2. The session cursor and the per-turn delta

Each chat session holds a cursor. Each turn asks the corpus what changed since
it, inlines the new titles, and advances it.

**No new artifact.** `updated_at >= cursor` is the same change feed [[REQ-159]]
consumes for indexing; this is that query with a different cursor, and the
session is a ticket, so it already has somewhere to keep one.

A change-log *ticket* was considered and rejected ([[DOC-39]] §5.1): rewritten on
every upload, a compare-and-set contention point, unbounded growth in one body,
and either polluting the corpus or requiring a predicate everyone remembers. The
feed is automatically complete over every corpus member.

Three behaviours that are requirements, not polish:

- **An empty delta emits nothing** — not *"nothing new"*. A line that appears
  every turn and is almost always empty trains the model to skip the region it
  appears in, which is the region the non-empty case needs to be noticed in.
- **The delta is capped** with an *"…and N more"* summary. A bulk import or a
  capture run can put hundreds of entries in one turn, and an unbounded delta
  reintroduces the pile priming exists to avoid.
- **Ordering is a cost decision.** The maps are stable across turns; the delta
  and the transcript tail are not. Stable material sits *before* volatile
  material, so the seeded prefix stays prompt-cached for the life of the session
  instead of being invalidated every turn. Trigger last of all.

### 3. The change-feed operation

**RAG cannot answer "what changed."** Cosine similarity has no notion of time —
the ranker's `recencyFactor` biases relevance, it does not permit a temporal
query. So *"what have we added since we last spoke?"* and *"did we ever upload
the pricing deck?"* have no path today.

It is an **operation on the declared knowledge surface**, not a bespoke tool —
the reasoning [[DOC-10]] §5.2 used for the four memory tools applies unchanged.
Declaring it supplies argument validation, the capability grant, results marked
untrusted, the audit trail, and the projected manual. Same KB scope argument as
search, defaulting to all; returns uid, title, `kind` and `rights`, ordered by
time.

## Depends on

[[REQ-158]] (the surface exists and is wired) and [[REQ-159]] (there is a corpus
that changes). The delta is inert without a second KB, which is why this is not
folded into either.

## Out of scope

- The project KB's corpus, indexing and map triggers — [[REQ-159]].
- Removals. The feed is reliably additive and unreliably subtractive; an archive
  or detach may not surface in an `updated_at >=` sweep. Recorded, not solved.

## Acceptance

- A cold session is primed with both landscapes in one section, then role
  purpose, then mechanism and trigger.
- A small project corpus enumerates in the landscape and says it is complete.
- **The behavioural test:** upload a document mid-session; on the *next* turn the
  AI knows it exists and can answer from it — **without** waiting for a map
  rebuild. This is the criterion that matters; the rest is mechanism.
- An empty delta contributes no tokens.
- A delta above the cap is truncated with a count and remains reachable through
  the change-feed operation.
- The change-feed operation appears in the projected manual without anyone
  writing prose for it.
- A resumed session's first turn reports what arrived while the client was away.

## Open questions

- **Cursor semantics across sessions.** Upload in session A, open session B — B
  sees it as new. Probably right, since B genuinely has not seen it, but it
  should be decided rather than fall out.
- The cap's size, and whether it counts entries or characters.
