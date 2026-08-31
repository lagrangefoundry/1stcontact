---
uid: request-26dafd83
id: REQ-165
type: request
title: 'Projected reference: the products own facts, generated rather than authored'
created_by: xgd
created_at: '2026-08-31T21:38:31.838491+00:00'
updated_at: '2026-08-31T21:38:31.838491+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
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

## Open questions

- **Granularity** — one document per module, or one catalogue? Chunk retrieval
  argues for whichever produces coherent chunks; the catalogue is probably right
  until modules are numerous.
- **Whether projections carry into the awareness map's territories** or are
  described separately. They are a different kind of knowledge from consultation
  material and may cluster oddly beside it.
