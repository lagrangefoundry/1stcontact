---
uid: story-724e4e8c
id: STORY-133
type: story
title: 'The description: material is found by what it says or shows, and says honestly
  when it cannot be read'
created_by: xgd
created_at: '2026-09-04T04:11:22.325267+00:00'
updated_at: '2026-09-04T04:11:22.325267+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-203b1dc2
  capability_uid: capability-ccac1bb4
  story_kind: feature
  story_points: 3
---

## Story

**As a** business owner who has handed the platform a document, a photograph or a typeface,
**I want** the platform to read what I gave it and record what it actually says or shows — and to
tell me honestly, in the record itself, when it could not,
**so that** I can find my own material later by what is *in* it rather than by remembering what I
called the file, and nothing I hand over is ever turned away for being hard to read.

## Description

The knowledge base indexes every piece of material the same way: by the written description carried
on its record. There is no second retrieval path for pictures, for typefaces, or for anything else.
So the description is not decoration — it is the whole of a file's findability. A photograph is
retrieved by *"the kitchen at dusk"* through exactly the mechanism that retrieves a positioning
paper, and a file with a weak description is material that cannot be found at all.

**In scope** (this story):

- **Four ways of reading a file, one promise.** Documents are read for the text they contain;
  images are looked at and described in the words someone would search by; typefaces are read from
  the names their own file carries — family, style, who drew it, and often a sentence from them
  about what it is for; plain text is taken as it stands. Which path a file takes is decided from
  what kind of thing it already is.
- **Nothing is ever turned away for being hard to read.** A scanned brand book with no extractable
  text, an image nobody is configured to look at, a compressed typeface wrapper the platform cannot
  open, a format nothing here understands — every one of them is kept whole, given a written
  description saying plainly what is missing and why it will only be findable by name, and left
  visible.
- **One record of how it went, for every outcome.** Each piece of material states what its
  description is worth and what produced it. Six outcomes are distinguished, because they do not
  want the same treatment later: a real description; nothing configured to look; nothing to extract;
  nothing here can read this; too large to look at (though kept whole); and reached-and-failed.
  Material with no real description is therefore selectable by asking, rather than by re-reading
  every record.
- **Reading a file never fails an upload.** A failure to describe costs findability and nothing
  else. The file is kept, the record is created, and the reason is written into the description —
  because turning *"we could not read your PDF"* into *"your upload failed"* would be untrue and
  would leave the client nothing to retry.
- **A title worth listing.** Every record carries a title someone can recognise in a list.

**Out of scope**:

- How the bytes arrived, what kind of thing they were decided to be, what rights they carry, the
  size ceiling and the address guard — [[STORY-132]] (this story is that pipeline's third step).
- Where the material and its bytes live ([[CAP-106]]) and the search index built over them
  ([[CAP-107]]).
- The Library surface where descriptions are read and corrected, and the client's own correction of
  a description ([[REQ-161]]).
- Re-describing material later. Deliberately enabled and deliberately not built: the recorded
  outcome and producer are exactly what make a later pass a query rather than a migration.
- Optical character recognition. A scanned document is stored with an honest sentence instead.
- Describing a capture bundle, which arrives by its own path and is its own ticket.

## Technical Context

- Every description is written **for retrieval, not for elegance** ([[DOC-38]] §6). A description
  that reads beautifully and never uses the word someone would type has failed at the only job it
  has.
- Describing is the product's concern, not the storage component's ([[DOC-38]] §7.4): the store
  keeps bytes and metadata; turning a file into prose is ours.
- The ceiling on what can be *looked at* is not the ceiling on what can be *held* ([[DOC-38]] §14).
  An image between the two is kept whole and simply not looked at, because the client's photograph
  is not at fault and losing it in order to describe it would be the wrong trade.
- Whoever looks at images is a supplied capability rather than a fixed one, so the behaviour above
  is provable without reaching a model, and so the platform can consolidate onto a single model path
  later without changing anything this story asserts.
- The status vocabulary reaches the declared material record through [[STORY-128]]'s field block
  (plan item 11); this story owns what the values *mean* and when each is produced.

## Reconciliation Decisions

- **Titles are derived, and the derivation is ordered** (decided at reconciliation, 2026-09-03):
  REQ-163 specifies the description body at length and is silent on titles. The landed code derives
  one for every material — a document's own declared title first, otherwise the first substantial
  line of what was read, otherwise the filename — and an image's title comes from the same single
  look that produced its description rather than a second call. This is formalized rather than left
  undocumented because the title is what the knowledge landscape enumerates and what the Library
  lists: an untitled or filename-only record is a real degradation with a user-visible cost.
  Formalized in the document, image and degraded-description criteria.
- **A description body is bounded, and says so when it was cut** (decided at reconciliation,
  2026-09-03): intent is silent on length. The landed code caps the stored text and states the cut
  in the text itself. Formalized because a description that stops mid-sentence with no explanation
  reads as corruption to a client, and because an unbounded body is re-read on every indexing pass.
- **Material of a kind this step does not describe is marked unreadable rather than refused**
  (decided at reconciliation, 2026-09-03): REQ-163's pipeline table lists capture bundles as a
  fourth sub-pipeline, while its own scope boundary puts capture-to-ticket in a separate ticket and
  nothing in this path produces one. The landed code resolves the tension the same way it resolves
  every other unreadable input — keep the file, say what could not be read. Formalized as part of
  the unreadable-material criterion; describing capture bundles remains out of scope.
- **A degraded description is written prose, never an empty body** (decided at reconciliation,
  2026-09-03): intent requires the material be "honestly described"; it does not say what the body
  contains. The landed code always writes a sentence naming what is missing plus the file's own
  identity — name, type, size, and the address it came from where there was one. Formalized because
  the Library shows bodies, and a blank one reads as a bug rather than as a known limitation.

## Dependencies

- [[STORY-132]] (plan item 7) — the ingestion pipeline this step runs inside; it supplies the bytes,
  the kind and the filename, and it is what creates the record this description becomes.

## Story Points

3
