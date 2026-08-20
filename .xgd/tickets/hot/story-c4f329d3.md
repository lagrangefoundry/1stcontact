---
uid: story-c4f329d3
id: STORY-117
type: story
title: 'System knowledge base: build the assistant''s domain knowledge from our own
  documents, with each document deciding whether it is in'
created_by: xgd
created_at: '2026-08-20T04:15:05.992521+00:00'
updated_at: '2026-08-20T04:15:05.992521+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-77b28def
  capability_uid: capability-45acba5e
  story_kind: feature
  story_points: 3
---

## Story

**As an** operator who writes and maintains this product's design documentation, **I want** to build the builder assistant's domain knowledge out of those documents — as a repeatable release artefact, with each document deciding for itself whether it is in — **so that** the assistant answers from what we actually wrote rather than from a second copy that drifted, and nothing reaches a client-facing agent until somebody has said it should.

## Description

The assistant already knows what it can *do*: the control surface generates its manual. It does not know what the system *is* — how storage works, what the L1 substrate is for, what a behavior module may and may not contain, why a colour is a palette reference. That knowledge exists, written down, reviewed and versioned in the ticket store as `doc` documents. This story is the pipeline that turns it into something an assistant can search.

Three artefacts, built in one order, by one command:

| Step | What it produces | Why it is not optional |
|---|---|---|
| **export** | the corpus — the documents themselves, as files | the retrieval identity is the filename, so this is what a citation resolves to |
| **index** | a vector index over whole documents, and one over passages | a whole design document is far too coarse a unit to hand back as an answer |
| **map** | a generated awareness map: territories, described, with validated ways in | what a cold agent is primed with instead of the documents |

A build that produced only the document index would leave the knowledge base technically present and practically useless, so the whole pipeline is one command and the order is fixed.

**In scope**

- **Building it.** One command runs the whole pipeline and reports what it produced. A second form does the corpus alone — no model, no credentials — and still leaves a coherent tree, because it writes the declaration too. A third reports what is currently built. An unrecognised form is refused with usage and a failing exit.
- **Membership, opt-in, per document, on the document.** A document is in the knowledge base when it carries the opt-in flag as a genuine boolean. Everything else — absent, false, or a value that merely *looks* like true — is out. **Inclusion and not exclusion, deliberately**: an exclusion list answers "what did we throw out", which nobody asks; inclusion answers "what does the assistant know", which is the question that matters, and one a reviewer can settle by reading a single document's frontmatter. It also **fails safe**: a document written tomorrow is outside the knowledge base until somebody says otherwise. The opposite default would put every new document in front of a client-facing agent the moment it was saved.
- **Named exclusions.** Every document the export leaves out is reported **by name**. A bare count tells an operator that something is missing without telling them what, which is the version of the message that generates a support question — and a document silently absent from the corpus is indistinguishable from one that was never written, with the symptom (an assistant that does not know a thing it should) appearing far from the cause.
- **Identity that survives a retitle.** A document is addressed by its human id, never by its title. The address is what a search hit cites and what the incremental build keys on, so a retitle must not silently re-embed the document and dangle every stored citation.
- **Withdrawal is deletion.** A document whose ticket is gone, or which has opted back out, is *removed* from the corpus rather than merely left unrefreshed. A stale file would stay searchable, and confidently wrong, forever.
- **Rebuilds are incremental and honest about it.** An unchanged document is not rewritten; an unchanged corpus is not re-embedded. This is load-bearing rather than tidy: the index keys incremental work on the file's own stamp, so rewriting every byte-identical file each build would re-embed the entire corpus, at cost, while telling the ranker every document had just changed.
- **The map is generated, always.** Clustered from the same vectors the reader searches, described in the corpus's own vocabulary, and validated by *the reader's own search* — a map whose doors were checked by a different query path would promise routes that do not exist for the agent that follows them. A territory with no validated way in is named rather than passed over. The map is kept out of the corpus it describes, or every rebuild would cluster the previous build's map and the knowledge base would slowly fill with descriptions of its own descriptions.
- **The declaration is the thing in force.** Prompt, weight and the membership predicate all come from the declaration. Editing it changes what the build produces; a build never overwrites it.
- **One embedding model on both sides.** The vectors the index is built from and the vectors a query is compared against come from the same model, so comparability holds by construction rather than by argument — the failure mode of two models is not an error but plausible-looking nonsense.

**Out of scope**

- **What a conversation does with the knowledge base** — the session's knowledge surface, its priming, and its behaviour when nothing is built. That extends the assistant's own story.
- **Curating the corpus.** Which documents to drop and which to generate is an editorial pass to be made when there is retrieval data to judge by. The answer to a large corpus remains passage search and a map, not a hand-picked subset.
- **Tenant knowledge bases, and the ticket store on D1.** The system knowledge base needs neither: it is not inside anyone's store, it takes the scope parameters and does not vary by them.
- **Corpus residency for a deployed worker.** The knowledge base is read today by the operator's own builder origin; where the index lives when the host moves is not forced yet.

## Technical Context

- **The corpus is derived, and the declaration is authored.** The built tree is not in version control — a fresh checkout has a declaration and nothing built. That is the point of it being a release artefact: it is reproduced by running the build, never edited in place.
- **`landscape: authored` on disk is not a claim a human wrote the map.** It is the shipped-knowledge-base contract: a fixed artefact that ships, read and never refreshed on a cadence — exactly true of one the build wrote. The build flips to `derived` for its own duration. What makes the result authored is *where it is written*.
- **Divergence from the intent's letter, not its substance.** The intent named the declaration `knowledge_bases.yaml`; what shipped is JSON, so the library needs no parser injected. Same file, same role, same content.
- **One place the "name it, never count it" rule is not followed.** When *no* document has opted in, the build is refused with a message that names the mechanism and reports how many documents were skipped as a count rather than a list. That is the one case where the list is the whole corpus and the operator's problem is the flag, not any particular document — but it is a deliberate exception to the rule the export otherwise holds to, and worth knowing before someone "fixes" one of the two.
- **Only the export step is this repository's.** Index, chunking, ranking, clustering and access-point validation compose the knowledge library's own exported functions, in the same order its own build script calls them, because that script is absent from the packed artifact. Reported upstream; when it is packed, this shrinks to a call.
- **The document store ignores frontmatter timestamps.** It takes both stamps from the file entry, so the exported timestamps are provenance for a human reader and the *file's* stamp is what the incremental build reads. This is why "an unchanged document is not rewritten" is a correctness property rather than an optimisation.
- **Structured fields are dropped rather than coerced.** The corpus format reads one level of fields, so a mapping value has no representation; rendering it as text would put a placeholder in the corpus that is not the value, does not fail, and is indistinguishable from data.
- **The describing model needs no credentials**; the embedding model does, and there is deliberately no local stand-in for it — a stand-in would make laptop vectors incomparable with production ones, which is precisely the failure the single-model rule exists to prevent.
- Related: the assistant's per-site conversation capability consumes this artefact; the control surface's generated manual is the *other* half of what the assistant is primed with.

## Dependencies

None. The build runs with no session, and its corpus-only form runs with no model and no credentials at all.

## Story Points

3
