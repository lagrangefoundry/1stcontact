---
uid: request-26dafd83
id: REQ-165
type: request
title: 'Projected reference: the products own facts, generated rather than authored'
created_by: xgd
created_at: '2026-08-31T21:38:31.838491+00:00'
updated_at: '2026-09-02T17:48:27.063949+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-cb7fa49c
  commits:
  - working_sha: 52fd6302cc92deaebf47a2c8230a225c4c65b616
    reconcile_sha: null
    main_sha: null
  - working_sha: 9ae7338430d66054b42173f57f20ef83a22ac670
    reconcile_sha: null
    main_sha: null
  - working_sha: c2f6c582ad88ff1bf872907a8297bfe2c4a4b91e
    reconcile_sha: null
    main_sha: null
  version: 0.2.31
  bundled_in: bundle-203b1dc2
---

# Projected reference: the product's own facts, generated rather than authored

## The hole this fills

[[DOC-39]] §3.1 excludes architecture documents from the system knowledge base,
and that is right — they are written to justify engineering decisions to
ourselves, not to advise a client. But it leaves a gap that only appears once the
exclusion takes effect.

After [[REQ-164]] flips the export filter, the AI's system corpus is a handful of
consultation documents and **nothing that says what the product does**. No module
catalogue, no L1 vocabulary, no control-surface reference. It will discuss design
well and be unable to say what a module is.

## The answer is not to write it down

Two obvious repairs are both wrong:

- **Tag the architecture documents into the KB** — breaks [[DOC-39]] §3.1's
  exclusivity, and feeds the AI rationale about rejected alternatives.
- **Write system-KB counterparts** — two sources of truth for one fact, drifting
  apart silently. Exactly the failure [[DOC-10]] §6 records.

[[DOC-39]] §3.2 takes the third option, and it is already precedented twice here:
the tool manual is **projected from the declared surface** so instructions and
tools cannot drift ([[DOC-10]] §5.1), and capture mapping runs against the **live
module registry** rather than a written catalogue ([[DOC-13]] §8).

So: **machine-readable facts are generated from their source of truth, never
authored.** A projected reference is not a document anyone maintains and cannot
go stale.

## What to project

| Source of truth | Projection |
|---|---|
| the live module registry | what modules exist, their dials and ranges |
| the L1 schema ([[DOC-23]], [[DOC-27]]) | the layout vocabulary and what each term means |
| the declared control surface ([[DOC-30]]) | what the AI can change, and how |

## Where it goes

Into the shipped corpus at build time, beside the authored `system_kb` documents
— same directory, same index, same awareness map. The AI should not have to know
which of its knowledge was written and which was generated; it asks a question
and gets an answer.

That means the generator runs in the release build, before `1c kb build`, and its
output is a corpus member like any other.

## Out of scope

- **Authoring system-KB documents** — [[DOC-39]] §3.5, deliberately deferred.
- **Changing any of the three sources.** This reads them.

## Acceptance

- A build step emits projected documents from the three sources into the corpus.
- Changing a module's dials changes the projection on the next build, with no
  document edited by hand.
- The AI, asked what a module supports, answers from the projection.
- No projected fact is also stated in an authored `system_kb` document — asserted
  by review, since the whole point is one source per fact.

---

## What landed

A projector (`tools/generate/src/cli/kb-projection.ts`) and a second corpus
producer beside the ticket export (`writeProjections` in
`tools/generate/src/cli/kb.ts`), run by `1c kb export` and by the assets build
before `1c kb build`.

**Three projections, one source each.** `REF-behaviors` from the framework
behavior catalogue (`CATALOG`), `REF-l1` from the L1 schemas and envelope,
`REF-surface` from the declared control surface (`ai/l1-surface.json`). Each
reads exactly one source and reads no document: every sentence is either
rendered from the shape of the source or lifted verbatim from prose the source
itself carries (a declaration's `description`, a schema's doc comment). A
projection that copied a sentence out of an authored document would recreate the
two-sources failure this ticket exists to avoid; one that invented a sentence
would be a fact with no source at all.

**One catalogue per source, not one document per module.** The granularity
question above is answered by chunk retrieval: a chunk is only useful if it is
coherent alone, and with two behaviors in the catalogue a per-module split
produces documents too small to cluster and a map territory per module. It stays
one document per source until a single module no longer fits a chunk.

**A projection is not `renderManual`.** The shared AI library already projects
the same `l1-surface.json` into a tool manual, and this deliberately does not
call it. A manual is projected *through a grant* — the operations one role was
given, in the second person, as instructions. A reference describes the whole
declared surface to a reader asking what the product can do. One source, two
renderings; §3.2's rule is one source per fact, not one rendering.

### Consequences that had to be decided

- **Two producers, two namespaces, one sweep each.** Projections are named
  `REF-*` and the ticket export's sweep spares that namespace, while the
  projector sweeps only `REF-*`. So a withdrawn document is deleted and a
  withdrawn projection is deleted, and neither producer can delete the other's
  output whatever order they run in. Without the split, a build could lose a
  projection to ordering, and a KB test fixture that supplies its own stubbed
  ticket store would silently get three documents it never asked for — which for
  a suite tuning a corpus to make a clustering assertion is destructive, not
  merely surprising.
- **An unchanged projection is not rewritten.** The index keys its incremental
  manifest on the file stamp, so rewriting an identical file every build would
  re-embed the entire reference every build.
- **Membership is read from the KB declaration, never hardcoded.** An exported
  ticket satisfies the corpus predicate by carrying its own fields; a projection
  has no ticket and must assert membership itself. Hardcoding today's predicate
  would drop the projections out of the KB the day it changed — the one failure a
  generated document is supposed to be incapable of, and a day that has already
  come once (the predicate was `fields.system_kb: true` until [[REQ-164]] made it
  a `doc_kind`).
- **A projection says where its facts came from, in the body as well as the
  frontmatter.** Retrieval returns passages and a passage carries no
  frontmatter, so an assistant reading a chunk mid-conversation can still say
  where the fact came from and where to go to change it. The same banner marks
  the document as rebuilt on every build, so a hand edit is known to be lost.
- **No projection cites an internal ticket.** The sources are read for what they
  declare, not for the `[[DOC-N]]`/`[[REQ-N]]` cross-references our own
  documents carry — sending a client-facing assistant to an internal ticket is a
  dead end for its reader.
- **A definition does not leak out of the shape it was written for.** The L1
  projection scopes each element kind's value sets to that kind, rather than
  pooling them into one vocabulary that would claim every shape accepts every
  value.
- **Frontmatter is the export's own dialect.** `DocDirStore` reads it, so a
  projection formatting its own would be a second dialect in one directory.

## Open questions

- **Whether projections carry into the awareness map's territories** or are
  described separately. They are a different kind of knowledge from consultation
  material and may cluster oddly beside it.