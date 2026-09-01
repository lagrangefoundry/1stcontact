---
uid: request-bbff35c7
id: REQ-160
type: request
title: 'Session seeding and turn reminders: two-KB priming, the change cursor, and
  the delta channel'
created_by: xgd
created_at: '2026-08-30T23:19:07.355942+00:00'
updated_at: '2026-09-01T19:54:48.501188+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 8
  depends_on:
  - REQ-158
  - REQ-159
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f5f16122
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

**Except that in the Worker it is not one yet, and that is part of this ticket.**
`apps/control-app/src/ai.ts` wires an `R2TranscriptArchive` — the transcript is
an object at `chat/<tenant>/<session>.md` and no `chat` ticket is ever created.
The component's `TicketSessionArchive` is what [[DOC-10]] §8 specifies: the
session homed in a `chat` ticket found or created by `fields.session_id`, the
whole session file in a `chat_transcript` comment on it, the body left for the
AI-maintained summary, writes compare-and-set. Everything is a ticket, and the
transcript is not the exception.

The switch is a drop-in and not a port. `TicketStore` already exposes the six
operations the component's duck-typed `TicketClient` names, with the same
envelopes, and `productTypePack` already merges `chatSchemas()` — so this is a
line in `workerHost` and the deletion of a class, not an adapter.

Three things follow, and each is a reason rather than a side effect:

- **The cursor has a home with a lifetime that matches it.** It is per session,
  and the session is now a ticket, so it is a field on that ticket. It is not
  derived data beside the index — which is where [[REQ-159]] correctly put the
  *transcript* cursors, because those are a property of an index pass and not of
  a conversation.
- **[[REQ-159]]'s `onTranscriptGrew` gets its caller.** It has none today, for
  exactly this reason: there is no chat ticket for a transcript to grow on.
- **Tenancy stops being a convention.** The R2 transcript's isolation is that its
  key sits outside `draft/` and nothing derives an R2 root from a request. Under
  the ticket store it is the same information barrier as everything else, bound
  into the handle by `forTenant`.

The costs are named rather than discovered. The whole session file is rewritten
per turn — [[DOC-10]] §8.1 accepts this and records the message-granular archive
as the fix for the day it hurts. A D1 row is bounded where an R2 object is not,
so a long enough conversation meets a ceiling the R2 archive did not have. And a
concurrent write now fails loudly on the compare-and-set instead of silently
losing the later fold, which is the better failure and still one the junction
serialises upstream.

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
- **The cursor must not re-report the document it stopped on.** The change feed's
  predicate is `updated_at >= cursor`, inclusive at the boundary — the component
  chose that so an indexer cannot miss a document written in the same instant its
  cursor was taken. Inclusivity means a cursor set to the newest timestamp sweeps
  that document up again next turn, and every turn after it. So the boundary
  travels with the uids that sat exactly on it, and those are dropped from the
  next sweep. A bulk import writes many documents in one instant, so it is a list
  and not a single uid — bounded by one timestamp's worth of ties, never by the
  corpus.
- **A corrupt cursor costs a sweep and never a turn.** It is a bookkeeping field;
  one that will not parse is worth one over-wide sweep, which re-announces a
  document at worst. Failing the conversation over it would be the more expensive
  answer, and it is the same judgement [[REQ-159]] made for its transcript
  cursors.
- **A conversation is never reported to itself.** Chat tickets are corpus members
  and are not delta entries. The session's own chat ticket is where the cursor
  lives, so a sweep that included it would announce the conversation to itself
  every turn, forever — and until [[REQ-171]] writes the summary its body is
  reserved for, a chat ticket carries no content to search for anyway. The
  exclusion is the delta's alone: chat tickets stay in the corpus, stay indexed,
  and stay in the landscape.
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

And on the `knowledge` component, through lagrange-framework REQ-112, for the two
things the host cannot supply for itself:

- **Co-ranked search over independent per-KB indexes.** The knowledge bases stay
  independent — separate corpora, separate indexes, separate build cadences — and
  meet only when results are presented. `search` takes a single `IndexSource`
  today, so a session declaring two KBs can only search one of them. Merging the
  two indexes into one artifact would make "independent" false at the layer that
  matters; re-ranking in the host would be a second answer to how hits are
  ordered.
- **The change-feed operation of piece 3**, which has to be declared on the
  surface to get what declaring buys.

The second is genuinely blocked and waits. The first is not, and is delivered
here in the only place available today: the session's knowledge surface fans a
search out to each knowledge base's own runtime — its own index, its own store,
its own declared weight, so the component's full ranking runs within each — and
then merges the results on the component's own scores, sorting by them and
cutting the union to the requested `k`. It does not re-rank, re-weight or
re-score; a second answer to how hits are ordered is what the component refuses
to have, and this does not become one. **Two independent indexes, co-ranked for
presentation** — which is the requirement, not a stand-in for it. A tie breaks
project-first, by the stability of the sort over the same order the landscape
uses.

The scores are comparable by construction, and that is what makes the merge sound
rather than merely plausible: one embedding model across both indexes, which the
component's search already requires, and one set of ranking dials on both sides.
REQ-112 moves the merge inside the ranking, at which point the fan-out here
deletes.

## Out of scope

- The project KB's corpus, indexing and map triggers — [[REQ-159]].
- **The chat ticket's AI-maintained summary.** Making the session a ticket does
  not make the conversation knowledge: the component indexes title and body, the
  transcript is a comment, and the body is deliberately left alone. So a chat
  ticket enters the corpus carrying its session id and nothing else until
  something writes that summary. Named here because [[DOC-39]] §7 leans on chat
  entries having an AI-written body, and after this ticket they still will not.
  [[REQ-171]] owns it, together with the session prompts and turn reminders it
  has to be written into.
- **The audit trail.** `flushAudit` keeps writing one R2 object per record —
  distinct keys cannot collide, which is a different trade from a ticket per
  record and not one this ticket is making.
- **Node's host.** `1c builder` keeps `FileArchive`; there is no writable ticket
  store under the CLI to home a session in.
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
- A turn taken in the Worker leaves a `chat` ticket carrying `session_id`, with
  the session file in a `chat_transcript` comment on it and the body untouched;
  the next turn folds onto it rather than minting a second.
- The session's cursor is a field on that ticket, and it advances by the turn.
- A search reaching both knowledge bases returns one list ordered by the
  component's own scores, with each index read through its own runtime.

## Decided

Both open questions are settled by [[DOC-39]] rather than left to fall out.

- **The cursor starts where the landscape's coverage ends** (§6.3) — concretely,
  the awareness map's build timestamp, and session start below the enumerate
  floor where the listing is generated fresh. Not "now": a document uploaded
  after the last rebuild and before the session opens belongs to neither the map
  nor a start-of-session cursor, and anchoring on the build time makes the two
  exactly complementary. This also answers the cross-session case — B has a
  cursor of its own, so material A saw is new to B only if it postdates B's map.
- **A single oversized title is clipped, not dropped.** The degenerate case of
  the cap: one title longer than the whole budget. A delta reporting that a
  document arrived while naming none would announce that something happened and
  withhold the only part that is actionable.
- **The cap is characters, ~400, and the count is always exact** (§6.4). A
  character budget is a hard stop on content, but the number is one integer and
  is never truncated — so a bulk import reads *"41 documents added, including
  …"* and the AI has both the magnitude and a sample. Truncating the count would
  hide the one thing searching cannot recover.
- **Resumption needs no separate report.** It is identical to initiation (§6.3);
  the cursor rule above is what makes the first turn after a resume carry what
  arrived while the client was away.