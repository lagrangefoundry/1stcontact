---
uid: request-439cd0c8
id: REQ-163
type: request
title: 'Ingestion: from a dropped file to an indexed material ticket'
created_by: xgd
created_at: '2026-08-31T20:33:08.539304+00:00'
updated_at: '2026-08-31T22:57:11.632203+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0fb97f84
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
3. **Describe.** The step that makes the material findable, and the reason this
   ticket is not plumbing. Four sub-pipelines with four failure modes:

   | Input | Description |
   |---|---|
   | PDF / document | extracted text (and a decision on scanned pages — OCR or refuse) |
   | Image | a written description, from a VLM |
   | Font | family, weights, and what it is for |
   | Capture bundle | what the site is and how it looks |

   Per [[DOC-38]] §7.4 this is ours, not the ticketing component's. The component
   stores bytes and metadata.
4. **Create the ticket** with that description as its body, plus §9's fields.
5. **Index incrementally** — the `since` cursor picks it up ([[DOC-39]] §4.1).
   No rebuild. This is what makes the material searchable *immediately*, which is
   what lets the map rebuild run asynchronously behind it ([[DOC-39]] §5.2).

## Entry points in scope

- **Upload** — a file from the client (4a site assets, 4b background material).
- **Fetch** — material we pull on their behalf: an industry report, an article
  (3c).

Both converge after step 1.

## Why the body matters more than it looks

The description is what the knowledge base indexes. [[DOC-38]] §6's whole
simplification rests on it: because a photo carries a written description, the KB
indexes bodies uniformly and never learns that images exist, and there is no
second retrieval path for media. A weak description is not a cosmetic problem — it is
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
  whose body is a usable description, and is searchable without a full reindex.
- Rights are set from provenance and never from a question.
- The same file uploaded twice yields one blob and two records.
- A blob above the ceiling is rejected with a message a non-technical client can
  act on.
- A crash between blob and record leaves no dangling pointer.
- An image's description is good enough to retrieve it by what it depicts —
  *"the kitchen at dusk"* — not merely by filename.
- The pipeline calls the index seam exactly once per created material, and the
  Worker logs when no indexer is wired.
- A degraded description (no key, scanned, unsupported) still yields a material that
  is visible, honestly described, and selectable by `description_status`.
- A fetch of a private, loopback, link-local or non-HTTPS address is refused, and
  each redirect hop is re-validated.
- Promotion of a non-`republishable` source is refused.

## Decisions from implementation review

**Routes.** This ticket owns exactly two — `POST /api/material` (upload) and
`POST /api/material/fetch` (URL). They are pipeline entry points, not Library
surfaces; `/api/tickets/*` and the drop overlay belong to [[REQ-161]], whose
overlay will POST to these. Treat the contract as public from the start.

**The index step is a seam.** [[REQ-159]] does not exist yet, so step 5 declares
`deps.index?(uid)` and a UAT proves the pipeline calls it exactly once per
created material. Building an index here would be building half of [[REQ-159]].

But an unwired optional hook is a silent failure of the worst kind: [[DOC-39]]
§4 is explicit that an unindexed document is **invisible**, not merely stale. So
the Worker **logs loudly when no indexer is wired**, and [[REQ-159]] promotes it
to a construction-time requirement in the manner of `ticketStoreFor(env)`.

**The image description takes a second LLM path, deliberately.** The AI component's
backend surface is text-only (`promptStream(ref, text)`) with no image content
block anywhere, so `describeImage` calls the SDK directly behind an injectable
seam. This is duplication and is accepted as temporary — **the consolidation
point is named now** ([[REQ-157]], or an image block on the AI component's
surface) so it does not become permanent by default.

**`description_status` is one mechanism for three degraded cases**, not three special
cases: no API key, a scanned PDF with no extractable text, and an unsupported
content type. In each the material is still created, is visible in the Library
with an honest description of what is missing, and is findable **by predicate**
for a later re-describe pass. `description_model` is recorded alongside it.

- **Scanned PDFs are never rejected.** Store the blob, write *"Scanned document,
  14 pages, no extractable text"*, set the status. Refusing a client's scanned
  brand book is the worse failure. No OCR in v1.
- **Regeneration is out of scope but enabled** — no automatic re-describe, and the
  two fields make a later pass a query rather than a migration.

**PDF text extraction takes a dependency** — `unpdf` (pdf.js packaged for
workerd, no native code). The fallback of filename-plus-size guts step 3, and
class 4b *is* PDFs. Two conditions: check the licence, and **measure its
contribution to the Worker bundle** — [[REQ-158]] independently plans to bundle
the KB vector index, neither ticket can see the other's footprint, and the
Cloudflare bundle ceiling is hard. Whoever lands second would otherwise discover
it. Report the measured number to [[REQ-158]].

**Fetch is a plain `fetch`, with a guard this repo does not yet have.** A
*rendered* fetch is capture ([[REQ-166]]). The guard: HTTPS only, no
private/loopback/link-local/metadata addresses, a redirect cap with
re-validation at each hop, and a size cap at the 25MB ceiling.

The guard matters more than the SSRF framing suggests. **Fetched content becomes
corpus material the AI reads**, so this is a prompt-injection path into the
assistant's context, not only a network-reach problem. Two consequences: keep the
guard, *and* mark fetched material untrusted in the manner [[DOC-10]] §5.2
already requires for retrieved content — a fetch of attacker-chosen content is a
risk even when the address is entirely legitimate.

**The asset-promotion gate ships here, unrouted.** There is no material →
site-asset promotion path today, so there is nothing to gate — which is exactly
how [[DOC-38]] §5's "most damaging single action available in the system" reaches
production ungated. Implement the function *with* its refusal now, so [[REQ-161]]
wires a surface to something already safe. It writes a `site_assets` row pointing
at the existing blob; that table exists today and this does not wait on the
`site_assets` migration.

## Open questions

- **Whether `describeImage` should eventually move into the AI component** rather
  than being consolidated via [[REQ-157]]. Both routes close the duplication; they
  differ in who owns vision.
- **Whether a re-describe pass is operator-triggered or automatic** once a better
  model exists. The fields make either possible; nothing chooses yet.