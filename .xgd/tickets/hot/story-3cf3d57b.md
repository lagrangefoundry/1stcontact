---
uid: story-3cf3d57b
id: STORY-149
type: story
title: Start every conversation knowing both bodies of knowledge, and hear about new
  material the turn after it arrives
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:26:34.496738+00:00'
updated_at: '2026-11-10T00:23:16.430816+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-8e1807f6
  capability_uid: capability-7e4714b7
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-374f88d6
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

- **One landscape, both maps.** A conversation is primed with the consultant
  system prompt, then a single description of what exists, carrying the client's
  map and the system's map together, the client's first, followed by what this
  assistant is for and then by how to search and what it may do. How to search
  comes last because the last thing read is the first thing done. The two maps
  are deliberately *not* presented as separate territories: a question
  half-answered by a design document and half by the client's own paper must
  return both.
- **The priming actually reaches the model, on every host.** The Node CLI host
  and both Worker paths share one priming configuration, and on each of them the
  model is really sent the system prompt, the landscape, the purpose, how to
  search and the turn's site-change reminder. That holds whether the system
  prompt goes out as one string or as cache-split text blocks. A host whose
  knowledge base has not been built is sent the system prompt and the tool manual
  alone, with no landscape or how-to-search section, and still runs.
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
- **A hit can be read back.** On the deployed Worker, a hit from either body can be read back. In the Node CLI, which hosts only the system knowledge base, a system-KB hit can be read back. Each knowledge base's runtime is opened with its document and passage indexes keyed by the source its own declaration resolves to: the system knowledge base under `shipped` on both hosts, and the client's, which declares no source, under the knowledge component's default source on the Worker. On the Worker, the one search over both passes each side's indexes through under those keys. So a document the search returns can then be fetched rather than refused as "not in the corpus", and a knowledge base with no index for its source refuses loudly instead of answering as though it were empty. The Node CLI has no client knowledge base and no merged search; that is out of scope here (see Reconciliation Decisions).

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

Each side's runtime reads its index through a map keyed by source name (upstream knowledge REQ-112, repaired here by BUG-55). This matters twice over: the search resolves its index through that key, and the runtime seeds the snapshot that decides which documents are readable *from* the same map. A runtime opened with the old singular key searched nothing and placed no document in its snapshot, so every read was refused as "not in the corpus" — an answer, not an error, and exactly how the assistant came to report shipped capabilities as missing. The client's knowledge base declares no source and must be keyed under the component's default source explicitly, because index lookup (unlike store lookup) has no fallback for an unnamed index. The composite runtime that merges the two searches holds no index of its own; it forwards each side's maps.

Priming follows the framework's DOC-22 configuration (BUG-63, REQ-182). It is an
ordered list of named entries, declared in one configuration data file and
loaded through the framework's own role loader. With a knowledge base the
entries are: the consultant role text and the product text (together, the
"consultant system prompt"), the knowledge component's landscape provider, the
purpose text, the knowledge component's mechanism provider (which carries this
session's projected manual), and one cache boundary, last. The boundary puts the
whole priming in one cached prefix, assembled once per session. That is why a
document arriving mid-conversation must reach the session through the per-turn
arrival notice: the map is not re-read. The per-turn reminder is a list of
configured reminder entries, with the arrival notice declared last, because the
role object is frozen and must never be assigned to. Entry names are
configuration and are never rendered into the prompt. No authored entry names a
corpus document (BUG-65): which documents exist reaches the session only through
the map the build generates. The knowledge component still prints its own two
section headings ("What exists", "How to search"), but the old "Your purpose"
heading and the closing "prime yourself now" sentence were deleted along with the
retired assembler. Before this migration, a framework change made the role
constructor silently drop the old system/source/reminder keys while the Worker
still built. That is why the criterion is stated against what the model is sent,
not against what the host constructed.

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

- **Search-then-read across both bodies is formalised as a criterion of this story** (decided at reconciliation, 2026-11-01, BUNDLE-37 / BUG-55): BUG-55 asks that "a hit that comes back from either knowledge base can be fetched" and that "the co-ranked surface searches both knowledge bases on both hosts". AC-1797 pins the merged search but not that its hits are readable, and the read failure was silent, so it is pinned separately as AC-2237. The client knowledge base's key (the default source) is stated in the criterion because it is the one asymmetry a search-only test would miss. The Worker runtimes, the Node system-KB runtime and both merged-search overrides pass source-keyed maps as the intent asks.

- **BUG-55's "both knowledge bases on both hosts" clause is retired as a wrong premise** (decided at reconciliation, 2026-11-04, BUNDLE-37 pass 2, report-ed9f3f94 N1). BUG-55's acceptance says "the co-ranked surface searches both knowledge bases on both hosts: the Worker through `session-knowledge.ts`, the Node CLI through `openKnowledgeRuntime`". The Node CLI has never hosted a client (project) knowledge base. `openKnowledgeRuntime` (tools/generate/src/cli/kb.ts) opens the system knowledge base alone, keyed `shipped`. The Node host (tools/generate/src/cli/ai/host.ts) grants only the system KB, and has done so since the system-KB session wiring landed (commit 40cc0c4f53). It caches one runtime per process because that KB is a release artefact shared by every site. The project knowledge base is a Worker construct backed by the control app's D1/R2 stores (`PROJECT_KB`, `projectKnowledgeFor` in apps/control-app/src/knowledge.ts). tools/generate only scaffolds its declaration into the shared KB config file, and its own doc comment (kb.ts, `PROJECT_KB`) states "This command never serves it: its corpus is the tenant's D1 ticket store, which a release build does not have". So BUG-55 did not take a Node co-ranked surface away; the clause described one that never existed. BUG-55's actual defect was the singular index key, which left every read refused as `not_in_corpus`. It is repaired on both hosts for every knowledge base each host opens, and AC-2237 pins exactly that: either KB on the Worker, the system KB on the Node CLI. This is not a CODE-ISSUE. Giving the Node CLI a client knowledge base would be new scope for a future intent, not a gap in BUG-55's fix.

- **Priming delivery is pinned at the wire, on every host** (decided at
  reconciliation, 2026-11-07, BUNDLE-39 / BUG-63). BUG-63's test plan says the
  regression that matters is "that a constructed session's assembled priming
  actually contains what it is supposed to", asserted on "what the model was
  sent". It names the order: system text, landscape, purpose, mechanism. It also
  names the no-knowledge-base fallback ("primes with the system text and the
  manual, and names no KM section") and the reminder reaching the model on every
  turn. These are formalized as AC-2364. AC-1795 is amended to put the system
  prompt first and to drop its closing "instruction to begin", which BUG-63 says
  was deleted along with `KnowledgeDocs`. The code agrees: one entry list in the
  consultant host assembly serves the Node host and the Worker. The commit message
  names the entries `consultant-system`, `km-landscape`, `purpose` and
  `km-mechanism`, defined in a `kmPrimingEntries` helper in roles.ts. The code on
  this branch builds the same four-entry order inline in host-core.ts under
  `consultant-*` names. Entry names are never rendered into the prompt, so the
  difference cannot be observed and is not a code issue. Out of scope for this
  story, and left to the matrix entries that own them: the describer role's
  digest-only priming, the generated bridge-shim export list, and the
  change signal's conditionality, which belongs to the REQ-131 reminder story.
  The corpus delta's absence when nothing arrived is already pinned here by
  AC-1799.

- **The trailing cache boundary is a criterion of this story** (decided at
  reconciliation, 2026-11-07, BUNDLE-40 / REQ-182). REQ-182's implementation
  scope places one `{cache_boundary: true}` last, so that "the whole assembled
  priming becomes one cached prefix". Its acceptance asks that "the assembled
  cache offsets cover the whole priming" and that "the landscape provider runs
  once for a session, not once per turn". This story owns what reaches the model
  in priming and on which cadence, so AC-2376 pins it here. It covers both
  declared orders, because the corpus-free order also closes with a boundary.
  AC-1807's "arrival notice last" is the per-turn half of the same cost rule and
  stands unchanged.
- **Corpus membership reaches a session only through the build** (decided at
  reconciliation, 2026-11-07, BUNDLE-40 / BUG-65). BUG-65 requires that "the
  `purpose` entry must name no document, of any kind, by id or by title", and
  that adding, demoting or retitling a document costs no edit to the authored
  priming. That is a claim about what a session is told about its knowledge, so
  it is formalised here as AC-2377. It also covers the reminder's method line,
  which BUG-65 brings into scope ("the same defect one tier down"), and both id
  namespaces (`DOC-`, `REF-`) plus titles, as BUG-65's design decisions state.
  The invariant is scoped to text that can reach a model. The configuration
  file's maintainer-only `about` block cites `DOC-22` as format provenance, which
  BUG-65 explicitly allows, so it is not a code issue. Rebuilding the awareness
  map is a build-artefact step and is not claimed. The criterion's end-to-end
  half proves the property over a real fixture build instead.

## Dependencies

- **STORY-103 (story-a58a0974)** — the conversation homed in a chat ticket, and
  the field on it this story's bookmark occupies. Without it the bookmark has no
  home with a lifetime that matches the conversation.
- The system knowledge base (CAP-100) and the project knowledge base (CAP-111)
  must both be buildable and openable; the arrival notice is inert without a
  corpus that changes.

## Story Points

3



## Reconciliation Decisions (BUNDLE-44)

- **The per-turn reminder travels at the tail of the last user message, not in
  the system field** (decided at reconciliation, 2026-11-09, BUNDLE-44 / BUG-83).
  BUG-83's investigation states that the reminder "still reaches the model" but
  that upstream `@lagrangefoundry/ai` now "appends it to the **last user
  message** instead" of folding it into `system`, "for cache-prefix stability — a
  marker on the reminder would put a block guaranteed to differ next turn inside
  the prefix the next request has to match", and that "the distinction is
  load-bearing for REQ-182, whose subject is *where* the reminder sits relative to
  the cache boundary". The "priming actually reaches the model" bullet above is
  read with that placement: the system prompt carries the priming, and the
  turn's reminder (site line, change signal, arrival notice) rides the tail of
  the last user message, in either wire shape (string content or content
  blocks). AC-2364 is amended to state this. No production code in this
  repository changed for it; BUG-83 records the move as upstream drift that left
  the test double's documentation stale, and the shared double now reads the
  system field and the turn tail separately. AC-1807 (arrival notice last in the
  turn's context) and AC-2376 (one trailing cache boundary over the priming) are
  consistent with this placement and stand unchanged.