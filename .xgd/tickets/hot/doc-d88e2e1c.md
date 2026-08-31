---
uid: doc-d88e2e1c
id: DOC-39
type: doc
title: The Knowledge Management System
created_by: xgd
created_at: '2026-08-30T22:55:29.789468+00:00'
updated_at: '2026-08-31T01:13:00.951326+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  doc_kind: architecture
  system_kb: true
  chat_comment: comment-37a5b4a6
  commits:
  - working_sha: 020ec406100d143a1c6a51181231500f2cb208a2
    reconcile_sha: null
    main_sha: null
  - working_sha: d4eff1a96779c560021294043e4982b83ffca0d6
    reconcile_sha: null
    main_sha: null
  version: 0.2.18
  story_points: 3
---

# The Knowledge Management System

## 1. Purpose

How the builder AI knows things it was not told.

[[DOC-38]] §8 decides *which* knowledge bases exist and what is in them. This
document is the mechanism underneath that decision: how a corpus becomes
searchable, how the AI learns what it can search for, what it costs to keep both
true, and what happens in the middle of a conversation when the answer arrives
after the question.

Companion to [[DOC-38]] (what the content is), [[DOC-10]] (chat sessions and
priming), [[DOC-30]] (the control surface, which is the *other* half of what the
AI can reach).

**Scope note.** The knowledge component itself lives in `lagrange-framework` and
is not specified here — see §11, which is a problem rather than a pointer.

## 2. What a knowledge base is

The organizing unit. A KB is declared, not built:

```jsonc
"system": {
  "prompt":    "…what this KB is, in one paragraph…",
  "corpus":    { },                 // the distribution IS the corpus — §3.3
  "landscape": "authored",
  "source":    "shipped",
  "weight":    1
}
```

Four things follow from that shape, and each of them is a decision this document
depends on:

- **The corpus is a predicate, not a collection.** `corpusPredicates()` renders
  a spec to `type=doc AND fields.x=true`, so membership is computed and
  re-carving a KB is a config change over data that never moves. A shipped KB is
  the degenerate case: its predicate is empty because the directory is already
  the boundary (§3.3).
- **Membership overlaps.** Ranked search filters `row.kbs` — a *list*. A document
  belongs to every KB whose predicate matches it. KBs are **views**, not folders.
- **`weight` is a ranking multiplier taken as a maximum** over the KBs a document
  belongs to. So a second KB can only ever *raise* a document's rank; down-
  weighting requires disjoint corpora ([[DOC-38]] §8.2).
- **`landscape` decides visibility, not searchability.** `authored` and `derived`
  publish a map and appear in priming; `none` publishes no map but remains
  searchable and is named in the mechanism section, so an agent can still reach
  it deliberately.

## 3. The two knowledge bases

Per [[DOC-38]] §8. They differ in everything that governs mechanism:

| | `system` | `project` |
|---|---|---|
| Corpus | the shipped `system_kb` documents (§3.1) | `chat`, `material`, `reference`, `brief`, + the site adapter |
| Source | `shipped` — a directory of markdown | the tenant's ticket store |
| Tenancy | **above** the barrier; identical for everyone | tenant data |
| Written | at development time | continuously |
| Index residency | in the Worker bundle | R2 / store-backed |
| Index rebuilt | at release | incrementally, on write |
| Map rebuilt | at release | on material arriving (§5) |

**The system KB is not tickets at runtime.** Its corpus is exported *from*
tickets at build time and read through `DocDirStore` / `bundleDocReader`. No
tickets are created in any tenant, which is exactly what puts it above the
tenancy barrier and makes it byte-identical for every client. What gets exported
is §3.1's business.

### 3.1 Three kinds of document, and only one of them is in the KB

The system KB is **not a subset of the design documents**. It is a different kind
of document with a different reader, and conflating the two is the error this
section exists to prevent.

| Kind | Written for | Source of truth | In the KB |
|---|---|---|---|
| **architecture** | us, building the product | authored | no |
| **system_kb** | the AI, advising a client | authored | **yes** |
| **projected reference** | the AI | the live registry / declared surface | generated, never authored |

An architecture document explains why we chose this and rejected that. It is
addressed to someone deciding how to build the product. An AI advising a nervous
café owner does not need the rejected alternatives; it needs to know what the
system does and how to talk about it. Feeding it the former is not merely noisy —
it is material written for a different reader entirely.

**A document is one kind or the other, never both.** This is why membership is a
`kind` rather than a flag: a boolean invites *"this architecture document is
**also** a system document"*, and that sentence is the category error in
grammatical form. If a fact is needed by both readers, the answer is the third
row, not dual membership.

### 3.2 The third row: project, do not restate

Some facts the AI needs are specified in architecture documents — the module
catalogue, the L1 vocabulary, the control surface. Tagging those into the KB
would break §3.1's exclusivity; writing system-KB counterparts would create two
sources of truth for one fact, which is exactly the drift [[DOC-10]] §6 warned
about.

Neither is necessary, because this system already answers that question twice:
the tool manual is **projected from the declared surface** so instructions and
tools cannot drift apart ([[DOC-10]] §5.1), and capture mapping runs against the
**live module registry** rather than a written catalogue ([[DOC-13]] §8).

So: **machine-readable facts are generated, never authored.** A projected
reference is not a document anybody maintains, and it cannot be stale.

### 3.3 The mechanism: one filter, at build time

At runtime there is **no membership mechanism at all**. The shipped corpus is a
directory of markdown in the distribution, served through the ticket interface by
a read-only store. The system documents are the documents in the distribution —
nothing more, nothing less.

It follows that **the shipped KB's corpus should be unrestricted** (`corpus: {}`,
`source: shipped`). Today it re-applies `type=doc AND fields.system_kb=true` to a
directory where everything already matched by construction — a build-time filter
re-run at query time, which is what made this look like more mechanism than it
is. Leaving it in place means a file dropped into the corpus without the right
frontmatter is silently invisible.

The one real mechanism is the **build-time export**: which tickets are copied
into the distribution as `.md`. That is `fields.kind = "system_kb"`, and it is
the only place membership is decided.

### 3.4 Why author them as tickets at all

The documents ship as flat markdown, so authoring them as tickets is a choice
rather than a necessity. It is worth it for what the ticket store gives that a
directory does not: the editing interface, review, history, and `[[DOC-N]]`
resolution across the whole document set. The cost is one export step in the
release build — which already exists.

### 3.5 What a system-KB document is

*"Authored for the AI"* has to be more than a slogan if people are going to write
these. Concretely, a system-KB document:

- **Is addressed to the AI as its reader.** Not "we decided", but "when a client
  says X, what they usually mean is Y."
- **Is actionable in a conversation.** If nothing in it could change what the AI
  says next, it does not belong.
- **Carries no rationale for our engineering choices.** Why the storage model is
  forward-only is architecture; that published sites cannot be silently edited is
  product behaviour the AI may need to explain.
- **States no machine-readable fact that could be projected instead** (§3.2).
- **Is written in the register it is meant to produce.** These are read by
  something that imitates; a document written in dense internal shorthand teaches
  the AI to speak in dense internal shorthand.

The natural first set is consultation knowledge — how to open a conversation with
someone who has never commissioned design, how to talk about colour and type
without jargon, what to do when a client asks for something that will look bad,
how the web-design market works and what clients are usually comparing us to.

**Which documents exist today, and which get written, is deliberately open.** The
current corpus is seed material ([[DOC-10]] §6.3) chosen so the machinery could
be exercised at all; it is not the intended set and should not be mistaken for
one. See §10.

## 4. Two clocks

The central distinction of this document, and the error it exists to prevent is
running them off one trigger.

| | The vector index | The awareness map |
|---|---|---|
| What | embeddings of documents and chunks | clustered territories, each described in prose, each with validated entry terms |
| Built by | embed the new or changed documents | cluster → LLM-describe each territory → validate every candidate access point with a **real search** → publish |
| Cost | one embedding call per changed document | an LLM call per territory *plus* a search per candidate term |
| If stale | the document is **invisible** — search cannot return what it has not embedded | the AI does not know a *kind* of knowledge exists |
| Cadence | must be near-live | can lag substantially |

The index is cheap and load-bearing; the map is expensive and advisory. Anything
that couples them makes the cheap thing rare or the expensive thing constant.

### 4.1 The index: incremental, on write

`corpusPredicates(spec, {since})` restricts a corpus to `updated_at >= cursor`,
and re-embedding is idempotent. So indexing is a change-feed consumer, not a
rebuild. There is no such thing as "reindexing the project KB" in normal
operation.

Search itself is a brute-force cosine scan, which is correct at this scale — tens
to low thousands of documents is microseconds of dot products, and the crossover
where an ANN index earns its approximation error is around 10⁴–10⁵ rows.

### 4.2 The map: triggered, rarely, and never by conversation

The map's value is **discovery** — telling the AI about knowledge it would not
think to look for. That framing decides every trigger question:

| Corpus member | Index | Map |
|---|---|---|
| **Transcripts** | every ~N thousand characters | **never** |
| **`material` / `reference` / `brief`** | on write | **rebuild** |
| Site adapter (pages) | on write | never |

**Transcripts never move the map.** The AI always knows conversations happened —
it is sitting in one — so describing a "conversations with this client" territory
has approximately zero marginal value against a real describe cost. The territory
is stable from the first turn and its description never usefully changes.

They still need **index** freshness, because search over transcripts answers
questions the current context cannot: earlier turns scrolled past the tail, and
*other sessions on the same site* ([[DOC-10]] §2.3 — *"what did we decide about
the palette?"*). Batching by characters rather than by turn matches the unit
[[DOC-10]] §5.1 already uses for the tail.

**Uploads do move the map, because an upload is a request for attention.** The
client is not adding a document to be thorough; they are adding it because they
want to talk about it now. That is a different event from a conversation
lengthening, and it deserves a different response.

### 4.3 The staleness test, when one is wanted

Rebuilding on *every* material arrival is the v1 answer because uploads are rare
and the trigger is legible. Where a cheaper test is wanted — bulk import, a
capture run, a busy tenant — the ingestion pipeline has already embedded the
document, so:

- **close to an existing territory centroid** → the map already describes it;
  do nothing.
- **far from every centroid** → it is an `OUTLIER`, and that is the signal the
  map has a gap.

This is the component's own vocabulary (`Territory`, `Representative`,
`OUTLIER`), and it fires when the map is *wrong* rather than when a clock says
so.

## 5. A map is a description, not a notification

The problem this section exists for:

> The AI asks *"do you have any positioning material?"* The client says yes and
> uploads it. Nothing tells the AI it arrived.

The instinct is to blame priming freshness, and that is not the fault. Priming
runs **every turn** ([[DOC-10]] §5.1), and the map is fetched by an ordinary
ticket read (`findAwarenessReport`), so a rebuilt map is picked up next turn
without any new mechanism.

The fault is that **re-reading an unchanged description is not a notification.**
A new brand document lands inside the existing "brand and positioning" territory
and changes the map's prose not at all. The map is correct, current, freshly
read — and silent.

So the delta has to be carried separately from the description.

### 5.1 The per-turn delta

Each chat session holds a **cursor**. On each turn, the corpus is asked what
changed since it, and the new documents' titles are inlined alongside the map.
The cursor advances.

No new artifact is required. `updated_at >= cursor` is the same change feed §4.1
already consumes for indexing; this is that query with a different cursor, and
the session is a ticket, so it has somewhere to keep one.

**Why not a change-log ticket.** It was considered and rejected: a log ticket is
rewritten on every upload (a compare-and-set contention point that grows
unboundedly in one body); if it is *in* the corpus it competes with real content
in search results, and if it is *out* it is one more predicate everyone must
remember; and it is only ever as complete as the code paths that remembered to
write to it. The change feed is automatically complete over every corpus member.
What a log would have carried that the feed does not — *why* and *by whom* — is
already in the material ticket's own body and fields ([[DOC-38]] §6).

**Known gap:** the feed is reliably additive and unreliably subtractive. A
removal or detach may not surface in an `updated_at >=` sweep.

### 5.2 And this is what makes the rebuild affordable

A map build is cluster + describe-per-territory + a validating search per
candidate access point. Running that synchronously when a document arrives
mid-conversation stalls the AI at precisely the moment the client is waiting to
discuss it.

The delta removes the need to. Search needs only the **index**, so the sequence
is:

1. **Index synchronously** on upload — the document is now findable.
2. **Delta on the next turn** — the AI knows it exists and can search it.
3. **Map rebuild asynchronously** — the territory description catches up.

The AI is never blocked and never blind. The two clocks of §4 are what make this
decomposition available at all.

## 6. Three surfaces

The AI reaches knowledge three ways, and they answer different questions:

| Surface | Question | Why the others cannot |
|---|---|---|
| **Search** | *"what do we know about X?"* | semantic, ranked, scoped |
| **Change feed** | *"what is new?"* | see below |
| **Priming** | *"what kinds of thing are knowable?"* | the map, injected every turn |

**RAG cannot answer "what changed."** Cosine similarity has no notion of time.
The ranker carries a `recencyFactor`, but that biases *relevance* — it does not
let the AI ask a temporal question. So the change feed is a genuine third
capability, not a convenience: without it, *"what have we added since we last
spoke?"* and *"did we ever upload the pricing deck?"* have no path.

It is an **operation on the declared knowledge surface**, not a bespoke tool —
the same reasoning [[DOC-10]] §5.2 used when it replaced four hand-written memory
tools with declared operations. Declaring it supplies argument validation, the
capability grant, results marked untrusted, the audit trail, and the projected
manual. It takes the same KB scope argument search does, defaulting to all, and
returns uid, title, `kind` and `rights` ordered by time.

Priming's own section ordering is fixed by the component and is load-bearing:
landscape (what exists) → role purpose (what to do) → mechanism and trigger (how
to search; go). The last thing the agent reads is the first thing it does.

### 6.1 The budget, and the principle that sets it

**A map exists to make a good first query possible. It does not exist to convey
knowledge.** Anything in the forced context beyond what is needed to *formulate a
query* is waste twice over: it costs tokens the work needs, and it dilutes the
region it sits in, training the model to skim exactly where the occasional
important line will appear.

So the test for every item below is not *"is this useful?"* — almost anything is
occasionally useful. It is **"does this change what the AI does next, often
enough to justify carrying it every turn?"**

Two structural facts make the budget affordable:

- **The landscape is O(territories), not O(documents).** A map of eight
  territories is the same size over forty documents or four thousand. This is the
  entire reason a map is the right artifact; a summary that grew with the corpus
  would just be the pile again, delayed.
- **Stable content is paid once.** The landscape, role and mechanism do not change
  during a session, so they sit in the prompt prefix and are cached. Re-priming
  "every turn" means the same tokens are present, not that new ones accumulate.

| Moment | What KM contributes | Budget | Paid |
|---|---|---|---|
| **Initiation** | landscape + role purpose + mechanism | ~2–3KB | once; cached thereafter |
| **Resumption** | the same, plus what arrived while away | + ≤400 chars | once per resume |
| **Per turn — nothing changed** | **nothing at all** | **0** | — |
| **Per turn — something changed** | titles of what arrived, capped | ≤400 chars | only on turns that changed |

**KM's marginal cost on a typical turn is zero.** That is the target, and any
design that does not hit it has gone wrong.

### 6.2 Session initiation

`primeSession` assembles three sections, in this order, and the order is the
component's:

1. **The landscape** — the maps of every default-visible KB, in one section.
2. **The role purpose** — what this agent is here to do.
3. **The mechanism and trigger** — how to search, then *"prime yourself now"*.

**Both maps in one section, not two.** Splitting them recreates the failure
[[DOC-10]] §5.2 removed when it merged the transcript tools into the knowledge
surface: the AI having to know which *kind* of thing it was looking for before it
could look. A question half-answered by a system document and half by the
client's own paper should return both, ranked together.

**Project map first, then system** — the client's material is what the session is
about, and the role purpose already frames standing capability. Cheap to flip.

Below the floor the project side is enumerated rather than mapped (§7), and that
is the one place the O(territories) property is deliberately given up — which is
why §7 caps it hard.

What initiation must never do is inline document bodies. That is the whole of
[[DOC-10]] §5.1's argument.

### 6.3 Session resumption

Identical to initiation, plus **one** addition from KM: what entered the corpus
while the client was away, from the session's stored cursor (§5.1). Titles only,
under the same ≤400-character cap as any other delta, so a fortnight's absence
costs the same as an hour's.

**The transcript tail is not KM's contribution and is not counted here.** The
~5k-character tail belongs to [[DOC-10]] §5.1 and is the conversation itself, not
knowledge about it. It is named only so the two are not confused: KM adds a
handful of titles to a resumed session, nothing more.

### 6.4 The per-turn reminder

**On a turn where nothing entered the corpus, KM contributes nothing.** Not a
heading, not *"no changes"*, not a restated mechanism — the landscape and the
mechanism are already in the cached prefix, and repeating them buys nothing while
pushing the prefix out of cache.

On a turn where something did arrive: **titles, capped, and nothing else.**

```
2 documents added: "Brand guidelines 2024", "Q3 positioning note"
```

No excerpts, no summaries, no rights annotations. The AI now knows the material
exists and can search it — which is the entire job, and it is done in one line.
Anything more is answering a question that has not been asked yet.

**The cap holds regardless of volume.** A bulk import or a capture run can land
hundreds of items; the line becomes *"41 documents added, including … — use the
change feed for the rest"* and stays under budget. The change-feed operation (§6)
is what makes truncation safe: nothing is hidden, it is merely not forced.

**An empty delta emits literally nothing.** A line that appears every turn and is
almost always empty is worse than absent — it teaches the model that this region
carries no information, which is precisely the region the non-empty case needs to
be noticed in.

**Volatile content goes last.** The delta must sit after the cached prefix, or
every turn that changes something invalidates the prompt cache from that point
on. Stable first, volatile last, trigger last of all.

## 7. Enumerate, then cluster

A new tenant's project KB holds three documents. Clustering three documents into
territories produces fabricated topology, and that map is the first thing the AI
ever learns about that client.

The resolution is to notice that **a complete listing is strictly better than a
map.** The map exists only because the corpus does not fit in the prompt; it is a
lossy summary accepted under duress. Below the floor we are not degrading, we are
doing the better thing.

So the threshold is not *"too few documents to cluster"* — it is **"few enough to
enumerate in full"**, which makes the real rule a **character budget** rather
than a document count:

- **Enumerate** while the listing fits in **~1KB** — roughly a dozen entries.
- **Cluster** above that.

**Titles, not excerpts.** An earlier draft budgeted ~200 characters of body per
document; that is conveying content, which §6.1 says is not the listing's job.
Titles are enough to formulate a first query, and they are unusually good here
because [[DOC-38]] §6 gives every project-KB entry an AI-written body *and* an
AI-written title — a `material` ticket is not called `Notes.pdf`. Where a title
genuinely is uninformative, a short excerpt is a fallback for that entry, not a
default for all of them.

Two details that matter more than they look:

- **Label the listing as complete.** *"This client's corpus is small enough to
  list in full"* makes a short list read as *"you know everything there is"*
  rather than *"knowledge here is thin"* — very different behaviour in front of a
  new client.
- **This works because of [[DOC-38]] §6.** Every entry in the project KB has an
  AI-written title over an AI-written body — the text shadow for `material`, the
  maintained summary for `chat`. Over raw uploaded filenames it would be far
  weaker, and the excerpt fallback would carry more of the load.

## 8. What this costs

Worth stating so nobody is surprised into abandoning the map:

- **Embedding** — one call per changed document, at query time one per query.
  Index and query must use the *same* model or the vector space does not agree,
  which is why the build requires the same Workers AI credentials the deploy uses.
- **The map** — an LLM describe call per territory, plus one real search per
  candidate access point. Access points are validated rather than asserted, so
  the map cannot promise a term that retrieves nothing. That guarantee is most of
  the cost.
- **Search** — a brute-force cosine scan; negligible until 10⁴–10⁵ rows.

## 9. Deferrals

- **Project-KB index residency.** Bundle-resident is correct for `system` and
  impossible for `project` (tenant data, continuously written). The R2 or
  store-backed path goes behind the same `IndexSource` seam.
- **Whether the system KB's development-process documents hurt retrieval**
  ([[DOC-10]] §6.3) — answered with data.
- **Whether site copy pollutes co-ranking** ([[DOC-38]] §8.3) — same.
- **Cross-tenant cacheability.** A system-KB query is scope-invariant, so its
  results are safely cacheable across tenants; it is the only KB where that
  holds, which makes the cache boundary per-KB rather than per-search.

## 10. Open questions

- **Cursor semantics across sessions.** A cursor per session means a client who
  uploads in session A and opens session B sees the upload as "new" again. That
  is probably right — B genuinely has not seen it — but it should be decided.
- **The delta cap's size**, and whether it is a count or a character budget
  (§6.2 settles that there is one, not what it is).
- **Which system-KB documents get written** (§3.5). The corpus today is seed
  material and the intended set does not exist yet. Sequencing matters: the seed
  set is what [[REQ-158]]'s acceptance test runs against, so it stays until the
  machinery is proven, and is replaced after.
- **`fields.kind` collides with a component convention.** The knowledge component
  writes `fields.kind = AWARENESS_REPORT_KIND` on awareness reports and queries
  it to find them, and uses `KB_FIELD = 'kb'` for KB naming. Our values differ and
  our predicate is type-scoped, so nothing breaks — but the namespace is shared
  and that should be a deliberate choice rather than a collision discovered later.
- **Whether the enumerate/cluster switch is per-KB or global.** A tenant may sit
  below the floor on `project` while `system` is far above it.

## 11. The specification this rests on is missing

Recorded because it is a real risk to any work that codes against the component.

The knowledge component cites **DOC-7** as its design authority throughout — over
a hundred references across the JS and Python peers, including `DOC-7 §2`, `§3`,
`§4`, `§4.2`, `§5`, `§6` (36 references alone), `§8`, and four separate
**Amendments A–D** carrying real contract decisions such as the index-backed
backlinks primitive and the incremental re-index cursor.

`DOC-7` resolves in **no reachable store**: not in `lagrange-framework`, not in
`xgd` (neither the ticket store nor `docs/`), and in 1stcontact the id belongs to
an unrelated document (*Website Framework Architecture Principles*).

So the component's stated specification for ranking, priming, the awareness build
and the corpus contract is currently its own source comments. That is enough to
*use* the component — this document was written from them — but not enough to
argue with it, and any change to ranking or awareness semantics would be made
without the reasoning that produced them. Finding it, or reconstructing it, is
worth a ticket in `lagrange-framework`.
