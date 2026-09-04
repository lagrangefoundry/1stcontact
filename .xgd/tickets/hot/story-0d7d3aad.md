---
uid: story-0d7d3aad
id: STORY-129
type: story
title: 'Projected reference: the product''s own facts reach the assistant generated
  from their source, never authored'
created_by: xgd
created_at: '2026-09-04T02:25:23.331501+00:00'
updated_at: '2026-09-04T02:41:23.387004+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-203b1dc2
  capability_uid: capability-45acba5e
  story_kind: feature
  story_points: 3
---

## Story

**As a** small-business owner talking to the site assistant, **I want** the assistant to be able to tell me what the product actually does — what components a site can use and how each is configured, what a page is made of and what the words mean, and what it is able to change on my behalf — **so that** its advice is about my site rather than about design in general, and so that what it tells me is never a stale description of a product that has since moved on.

## Description

The system knowledge base holds the documents the assistant reads. Those documents are written for a client, and the architecture records that describe how the product is built are deliberately kept out of it (DOC-39 §3.1) — they argue engineering decisions to ourselves, rejected alternatives and all. That exclusion is right, and it leaves the corpus a shelf of consultation material with nothing in it that says what the product is.

This capability fills that hole without reopening the exclusion and without writing a second copy of anything. Facts about the product are **generated from the thing that defines them, never authored**: the corpus gains a set of reference documents, one per source of truth, each produced afresh whenever the knowledge base is built. Today there are three sources — the framework's component catalogue, the layout vocabulary and its validation limits, and the declared control surface — and one reference document per source.

A generated reference is a corpus member on exactly the same terms as an authored document: same directory, same index, same awareness map, same retrieval. The assistant is not meant to know, and does not need to know, which of its knowledge was written by a person and which was generated.

**In scope**: the generated reference documents themselves — what each contains, that each is derived from one source and invents nothing, that each asserts its own membership of the knowledge base, that regenerating is safe and cheap and does not disturb the documents the other producer owns, and that each tells its reader where the facts came from.

**Out of scope**: authoring further knowledge-base documents by hand (DOC-39 §3.5, deliberately deferred); changing any of the three sources — this capability only reads them; the corpus export of ticket-derived documents and the knowledge-base status report, which belong to STORY-117; the assistant's grant of the knowledge surface and its priming, which belong to STORY-103.

## Technical Context

- Extends CAP-100 (System Knowledge Base). The corpus now has **two producers**: the ticket export (STORY-117) and this one. They write into one directory and each owns a disjoint namespace of document identities, so each can delete what it no longer produces without touching what the other does. Neither ordering nor a caller that supplies its own ticket store can make one producer damage the other's output.
- Membership is *derived from the knowledge base's own declaration*, not restated. An exported document satisfies the corpus predicate by carrying its originating ticket's fields; a generated document has no ticket and must assert membership itself. The predicate has already moved once (a boolean flag became a document kind, item 1 / REQ-164), and a generated document silently dropping out of the knowledge base the day the rule changes is the one failure a generated document must be incapable of.
- The knowledge index re-embeds a document when its last-changed stamp moves. Regeneration therefore compares before it writes: an unchanged reference is left alone, or every build would re-embed the entire reference at cost while telling the ranker every fact had just changed.
- A reference is **not** the assistant's tool manual. The manual is projected through a role's grant — the operations one session was given, in the second person, as instructions. A reference describes the whole declared surface to a reader asking what the product can do. One source, two renderings; the rule (DOC-39 §3.2) is one source per fact, not one rendering.
- Depends on plan item 1 (STORY-117, corpus export correctness): the membership rule this reads from the declaration is the one that item establishes, and the hole this story fills only opens once that item's filter excludes the architecture documents.
- The knowledge-base status report distinguishes generated documents from ticket-derived ones so that a current corpus is not reported stale by exactly the number of generated documents. That reporting behaviour is owned by STORY-117's status criterion (item 1) and is deliberately not restated here.
- **Intent-declared review assertion, not an acceptance criterion**: REQ-165's acceptance list ends with "no projected fact is also stated in an authored `system_kb` document — *asserted by review*". The intent explicitly assigns that check to review rather than to a test, and it is recorded here rather than formalised as an AC.
- **Open question carried, not resolved** (REQ-165's own): whether generated references cluster sensibly in the awareness map's territories beside consultation material, or want describing separately. They are a different kind of knowledge and may cluster oddly. Nothing in the code decides this, so it is not a behaviour to document.

## Reconciliation Decisions

- **A reference degrades to fewer sentences, never to fewer entries** (decided at reconciliation, 2026-09-03): REQ-165 is silent on what happens when a source's *prose* becomes unreadable — a source file that moves, a comment that is reformatted, a field that is renamed. The landed code makes the structural content (which components exist, which element kinds exist, which operations exist, and their values and bounds) come from the source objects themselves and treats the source's own prose as an addition that can be absent. Formalised because the alternative behaviours are both bad and neither is discoverable: a reference that fails the build over a moved comment, or one that quietly loses entries. Formalised as the degradation criterion below.

- **A meaning is scoped to the shape it was written for** (decided at reconciliation, 2026-09-03): REQ-165's landed half states that value sets are scoped per element kind, but says nothing about the *definitions* lifted from the sources. The landed code scopes those the same way, because a term documented once against one shape and left undocumented on a dozen others would otherwise be printed against all of them and read as authoritative. Formalised as its own criterion because it is a correctness claim about the reference's content, independently observable from the value-set scoping, and a plausible reimplementation would get it wrong.

## Dependencies

- Plan item 1 — System Knowledge Base: corpus export correctness (STORY-117 / story-c4f329d3)

## Story Points

3