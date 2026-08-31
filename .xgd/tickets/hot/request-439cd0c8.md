---
uid: request-439cd0c8
id: REQ-163
type: request
title: 'Ingestion: from a dropped file to an indexed material ticket'
created_by: xgd
created_at: '2026-08-31T20:33:08.539304+00:00'
updated_at: '2026-08-31T20:33:08.539304+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
---

# Ingestion: from a dropped file to an indexed `material` ticket

## Why

[[DOC-38]] §10 specifies the path from bytes to knowledge, and nothing implements
it. [[REQ-162]] gives the tickets somewhere to live; this creates them.

It is also the first user-visible capability in this whole line of work. Until it
exists there is no way to put a byte into the system at all.

## The pipeline

Five steps, per [[DOC-38]] §10:

1. **Store the blob.** Blob-first, then the record — a crash leaves an orphan
   blob a sweep collects, never a dangling pointer nothing can heal. Content
   addressed within the tenant prefix (`t/<tenant>/blob/<sha256>`), so the same
   file uploaded twice is one blob.
2. **Classify.** `kind` from the content type. **`rights` inferred from
   provenance, never asked** — see [[DOC-38]] §10.1, which is a decision, not a
   default: a per-file *"do you own this?"* is a legal question put to a café
   owner, is clicked through unread, and most importantly asks for information
   the client frequently does not have.
3. **Shadow.** The step that makes the material findable, and the reason this
   ticket is not plumbing. Four sub-pipelines with four failure modes:

   | Input | Shadow |
   |---|---|
   | PDF / document | extracted text (and a decision on scanned pages — OCR or refuse) |
   | Image | a written description, from a VLM |
   | Font | family, weights, and what it is for |
   | Capture bundle | what the site is and how it looks |

   Per [[DOC-38]] §7.4 this is ours, not the ticketing component's. The component
   stores bytes and metadata.
4. **Create the ticket** with the shadow as body and §9's fields.
5. **Index incrementally** — the `since` cursor picks it up ([[DOC-39]] §4.1).
   No rebuild. This is what makes the material searchable *immediately*, which is
   what lets the map rebuild run asynchronously behind it ([[DOC-39]] §5.2).

## Entry points in scope

- **Upload** — a file from the client (4a site assets, 4b background material).
- **Fetch** — material we pull on their behalf: an industry report, an article
  (3c).

Both converge after step 1.

## Why the body matters more than it looks

The shadow is what the knowledge base indexes. [[DOC-38]] §6's whole
simplification rests on it: because a photo carries a written description, the KB
indexes bodies uniformly and never learns that images exist, and there is no
second retrieval path for media. A weak shadow is not a cosmetic problem — it is
material that cannot be found.

## Constraints

- **25MB per blob** ([[DOC-38]] §14), enforced with a clear rejection rather than
  discovered as an out-of-memory. Measured, not guessed: the largest member
  across three real capture bundles is 7.4MB; the binding case is image-heavy
  brand-guideline PDFs at 20–50MB.
- **A capture-sourced asset may never be promoted into a site's asset library
  unless its bundle is `republishable`** ([[DOC-38]] §5). This is the most
  damaging single action available in the system — it publishes third-party
  copyright under the client's own domain — and it is one plausible tool call
  away without the gate.

## Out of scope

- **Capture → ticket.** Bundles land in the ReferenceStore and become tickets by
  the same path, but as N attachment records per member ([[DOC-38]] §9). Its own
  ticket.
- **The Library UI** — [[REQ-161]]. This ticket owns the pipeline; that one owns
  the surfaces. Either can be built first, but neither is demonstrable alone.
- **The quarantine write gate** ([[DOC-38]] §11) — the n-gram check on
  control-surface text. v1 is the prompt-level constraint plus the asset gate
  above.

## Acceptance

- A file arriving through the Worker becomes a blob, then a `material` ticket
  whose body is a usable shadow, and is searchable without a full reindex.
- Rights are set from provenance and never from a question.
- The same file uploaded twice yields one blob and two records.
- A blob above the ceiling is rejected with a message a non-technical client can
  act on.
- A crash between blob and record leaves no dangling pointer.
- An image's description is good enough to retrieve it by what it depicts —
  *"the kitchen at dusk"* — not merely by filename.

## Open questions

- **Scanned PDFs.** OCR, or reject with an explanation? OCR is a whole dependency;
  rejecting is honest but will bite someone with a scanned brand book.
- **Shadow regeneration.** If the description model improves, do existing
  materials get re-shadowed? The blob is retained, so it is possible; whether it
  is automatic is a policy question.
- **Fetch transport** — whether pulling a URL on the client's behalf runs through
  the same browser the capture pipeline uses, or a plain fetch.
