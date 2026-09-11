---
uid: story-6ccaedd5
id: STORY-140
type: story
title: 'Ingestion: A File Handed To The Platform Becomes Stored, Classified, Findable
  Material'
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:06:12.315229+00:00'
updated_at: '2026-09-11T04:17:56.061463+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-20802191
  story_kind: feature
  story_points: 3
---

## Story

**As a** client of the caretaker platform, **I want** a file I hand the system to be stored,
understood and findable the moment it arrives, **so that** I can talk to the assistant about
it straight away and never have to wonder whether my file made it or what the system now
thinks it may do with it.

## Description

This is the first capability that puts a byte into the system at all. A file arriving through
the platform's own entry point becomes, in one operation:

1. **stored bytes**, in the account's private material store;
2. a **classification** — what kind of thing the file is, and what may be done with it, both
   worked out without asking the client a question they cannot answer;
3. a **material record** whose body is the description of the file, so that the corpus is one
   body of text and there is no second retrieval path for pictures, fonts or PDFs;
4. an **announcement to the index**, so the material is searchable immediately rather than at
   the next rebuild.

Three refusals bound it: a file above the per-file ceiling and a file with no bytes at all are
refused before anything is created, in words a non-technical client can act on; and a client
is never asked whether they own what they are uploading, because the answer would be
confidently wrong and the dangerous action is forbidden outright elsewhere instead.

Two properties make the pipeline safe to interrupt and safe to share. **No record ever names
bytes that are not there** — an interruption can leave a material with nothing attached, or
bytes nothing references, but never a pointer into an empty place. And the bytes land in the
private store under the account's own prefix, never in the store that serves the public
internet, so one account's upload is invisible to another account's list and to another
account's search.

**In scope**: the ingestion path itself — classification, record creation, the ordering, the
ceiling and empty-file refusals, the index announcement, and what happens when no indexer is
configured.

**Out of scope**, each covered by its own story: how a file is described (the extractors, the
six honest outcomes when description is impossible); the guard in front of material fetched on
the client's behalf; the gate in front of promoting material into a site's public asset
library; the declared field vocabulary the record is written in; and the Library surfaces that
list, show and correct material.

## Technical Context

- The material record and its attached bytes live in the client material store (CAP-106):
  tickets in the platform database scoped to one account, with their bytes in a store the
  Worker that serves the public internet has no binding for. This story creates records there;
  it does not own the store.
- The index announcement is a seam. It is wired to the client's own knowledge base
  (STORY-138 / STORY-139), whose refresh is awaited so the material is searchable when the
  upload returns while the expensive awareness-map rebuild is deferred behind it. The seam
  exists so the "exactly once per created material" claim can be observed without standing up
  an embedder.
- An unindexed document is **invisible**, not merely stale: search cannot return what was
  never embedded. That is why an unwired indexer is a loud, named condition rather than a
  silent skip, and why the fact travels in the response as well as the log.
- Rights inference is a platform-policy decision, not a default (see the architecture policy
  on PII and on collecting only what is necessary): asking a café owner per file whether they
  hold the rights produces a confident answer that means nothing while transferring liability
  to someone who did not understand the question.
- The two entry-point routes are ordinary origin routes and carry the origin-wide no-store
  directive required by the builder-workspace origin story's existing criterion. That criterion
  is unchanged; these routes are additional evidence for it, not a new rule.

## Reconciliation Decisions

- **Deduplication is not asserted** (decided at reconciliation, 2026-09-10): REQ-163's
  acceptance says *"the same file uploaded twice yields one blob and two records"*, content
  addressed as `t/<tenant>/blob/<sha256>`. REQ-161 — a later intent in this same bundle —
  withdrew content addressing from the ticketing component with a stated reason: a blob shared
  between two records cannot be moved to the trash without breaking whichever sibling still
  names it, and moving it is what makes deletion actually revoke reach. Later intent supersedes
  earlier intent, so no criterion here claims one stored object for identical bytes. The
  properties that survive — residency under the account's prefix, and identical content
  hashing identically as an integrity record — are asserted instead. The addressing criterion
  itself is restated on the blob-storage story (STORY-127), not here.

- **The crash property is stated as a property, not as an order** (decided at reconciliation,
  2026-09-10): the intent asks for "blob first, then the record". The landed pipeline creates
  the material record first and then attaches, because attaching needs a subject to hang off —
  but the material record holds no pointer to bytes, and the bytes are written before the
  attachment record that addresses them. The failure the intent's ordering exists to prevent
  is therefore still unconstructible. The criterion asserts what must never be observable (a
  record naming absent bytes) rather than the sequence, so a reimplementation that reaches the
  same guarantee another way still satisfies it.

- **An empty file is refused** (decided at reconciliation, 2026-09-10): the intent names only
  the size ceiling. The landed pipeline also refuses a file with no bytes, on both entry
  points, with the same kind of message and with nothing left behind. Formalized as an AC
  because zero bytes cannot be described or indexed, so accepting one would create material
  that is permanently unfindable — the outcome every other refusal in this pipeline exists to
  avoid.

- **An unrecognised file is kept as a document rather than refused** (decided at
  reconciliation, 2026-09-10): the intent names classification from the content type but is
  silent on what happens when the type matches nothing in the closed kind vocabulary.
  Formalized as an AC because it is the same trade the pipeline makes everywhere else — keep
  the client's file, be honest about what is known about it — and because the alternative,
  refusing a file for having an unfamiliar type, is a data-loss outcome nobody asked for.

- **The response says whether the material was indexed** (decided at reconciliation,
  2026-09-10): the intent requires only that the Worker log loudly when no indexer is wired.
  The landed pipeline also reports it in the response. Formalized because a surface must be
  able to tell the client "stored, but nothing can find it yet" without a second request, and
  because a log alone is invisible to the person whose file it is.

## Dependencies

None. (The index announcement resolves to the client's knowledge base where one is configured,
but the pipeline is complete and observable with the seam unwired.)

## Story Points

3