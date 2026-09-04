---
uid: story-70a922b9
id: STORY-132
type: story
title: 'Ingestion: a file the client gives us, or one we fetch for them, becomes a
  kept, understood, immediately findable record'
created_by: xgd
created_at: '2026-09-04T03:51:25.275303+00:00'
updated_at: '2026-09-04T03:54:41.134833+00:00'
completed_at: null
last_field_updated: body
status: unplanned
fields:
  intent_uid: bundle-203b1dc2
  capability_uid: capability-ccac1bb4
  story_kind: feature
  story_points: 3
---

## Story

**As a** business owner working with the builder,
**I want** to hand the platform a file — or point it at something worth reading — and have it kept,
understood and immediately findable, without being asked questions about it I cannot answer,
**so that** everything I have given the platform is knowledge my assistant can use rather than an
attachment sitting in a folder, and nothing dangerous or unpublishable slips onto my site along the
way.

## Description

This is the first user-visible capability in this line of work: before it there was no way to put a
byte into the system at all. [[CAP-106]] gave material somewhere to live; this creates it.

**In scope** (this story):

- **Two entry points, one pipeline.** A file the client gives us, and an address we retrieve on
  their behalf. Both converge after the bytes are in hand, so everything below is true of both.
- **What the system decides without asking.** What kind of thing the file is, decided from what the
  bytes are declared to be; and what may be done with it — the rights, whether it may be published
  and whether it may leave the account — decided from *where it came from*. A per-file "do you own
  this?" is a legal question put to a café owner: it is clicked through unread, and it asks for
  information the client frequently does not have.
- **Immediate findability.** Every created record is offered to the account's search index once,
  before the request is answered, so the client can talk about what they just uploaded straight
  away — and so a deployment where nothing can index says so loudly rather than filling a library
  with documents no search will ever return.
- **The ordering guarantee.** No record ever names bytes that are not there. What a crash may leave
  is a record with no file (visible, honest, sweepable) or bytes with no record (collected) —
  never a pointer to nothing.
- **The refusals, in a client's words.** A file too large to hold; an address that must not be
  reached — non-HTTPS, private, loopback, link-local, or a public address that redirects to one of
  those; and material that may never be republished on a site.

**Out of scope**:

- What a file's description actually says, and how a file nobody can read is described honestly —
  the description step and its degraded states are documented separately in this capability.
- The Library surface that lists material, and the drop-to-upload overlay that asks the client what
  a file is *for*. Both post to the entry points this story owns; the entry points predate them and
  work without them.
- Capture bundles, which land as several files on one record with their own re-extraction
  lifecycle.
- The successful half of promotion — putting a client's own file into a site's asset library. The
  gate ships here with its refusal proved; the surface that calls it, and what a successful
  promotion does to the bytes, are documented with that surface.

## Technical Context

The two entry points are treated as a public contract from the start, because the Library and the
upload overlay are written against them rather than alongside them.

Fetched material is not only a network-reach problem. What comes back becomes corpus the assistant
reads, so a fetch is a prompt-injection path into the assistant's context. The address guard covers
the reach half; the other half is carried on the record itself — fetched material is stated to be
third-party in origin and rights, which is what lets everything downstream treat it as untrusted.

Search indexing is delegated to the account's own knowledge base ([[CAP-107]]), which refreshes the
vector index inline and defers the more expensive landscape rebuild behind it. This story owns only
the guarantee that each created record is offered to that index exactly once and that a deployment
which cannot index says so.

The origin-wide no-store requirement (AC-977) already covers the two entry points here; adding a
route without its probe is a failure of that existing criterion rather than a new rule, so no
criterion below restates it.

**Superseded by later intent — deduplication.** REQ-163's own acceptance says "the same file
uploaded twice yields one blob and two records", from a design in which bytes were addressed by
their content hash. The shared ticketing component subsequently withdrew content-addressing
deliberately: a blob shared between two records cannot be moved to the trash without breaking
whichever sibling still names it, and moving it is what makes deletion actually revoke reach. One
record now owns exactly one stored object. That correction is documented against the blob-storage
story in [[CAP-106]] (plan item 12) and is deliberately **not** restated as a criterion here; this
story asserts only that stored bytes are readable back through the record that owns them.

**Known limitation, recorded not closed.** Addresses are checked as written. A hostname that
resolves to a private address defeats that check, and the runtime cannot resolve a name before
fetching it, so the guard cannot be made complete from inside a Worker. This is stated rather than
implied; closing it needs a resolver the platform does not offer. It is not expressed as a
criterion because it describes something the system does not do.

## Reconciliation Decisions

- **An empty file or an empty retrieved document is refused** (decided at reconciliation,
  2026-09-03): the intent names only the 25MB ceiling and is silent about the other end of the
  range. The landed code refuses zero bytes with the same kind of message, because a record whose
  description is derived from no content is a record that can never be found by its contents and
  never repaired by re-describing it. Formalized as part of AC-1542.

- **A retrieved document records the address it finally came from** (decided at reconciliation,
  2026-09-03): the intent requires every redirect hop to be re-validated but is silent on which
  address is recorded as provenance. The landed code records the last hop, not the one the client
  typed, because a provenance record naming an address we were redirected away from is quietly
  wrong. Formalized as AC-1537.

- **An unrecognised file is stored as a document rather than refused** (decided at reconciliation,
  2026-09-03): the intent says the kind comes from the content type, and is silent on a type that
  matches nothing. The landed code files it as a document, which costs an honest "we could not read
  this" and keeps the file — the trade this pipeline makes everywhere else. Formalized as AC-1539.

- **The answer to an upload says whether the file is findable** (decided at reconciliation,
  2026-09-03): the intent asks only that the platform *log* when no indexer is wired. The landed
  code also reports it to the caller, because the surface has to be able to show "stored, but
  nothing has read it" without a second request, and a client watching an upload succeed deserves
  to be told that what they uploaded cannot yet be found. Formalized as AC-1541.

- **A refusal of rights is distinguishable from a refusal of the request** (decided at
  reconciliation, 2026-09-03): the intent asks for messages a non-technical client can act on and
  is silent on how a calling surface tells the cases apart. The landed code answers a
  too-large file, a malformed request and a forbidden publication as three distinguishable
  outcomes, because a surface that cannot tell "try a smaller file" from "this may never go on your
  site" will offer the client the wrong next step. Formalized as part of AC-1542 and AC-1547.

## Dependencies

None. (Plan item 7 of 15; items 8, 9, 10 and 11 depend on this one.)

## Story Points

3
