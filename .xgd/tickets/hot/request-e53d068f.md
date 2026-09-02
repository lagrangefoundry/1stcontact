---
uid: request-e53d068f
id: REQ-173
type: request
title: 'Material description: a digest in the body, the full text in a comment'
created_by: xgd
created_at: '2026-09-02T18:44:15.116380+00:00'
updated_at: '2026-09-02T18:44:15.116380+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  chat_ticket: chat-ded18c49
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-40983376
---

# Material description: a digest in the body, the full text in a comment

## The gap

`describe.ts` has four branches and they do not agree on what a body is.

- **Image** (`describeImageMaterial`) asks a model for *"a short title, then a
  blank line, then two or three sentences saying what the image depicts"*. A
  digest.
- **Font** (`describeFont`) turns the SFNT name table into three sentences. A
  digest.
- **Document** (`describeDocument` / `describePdf`) returns `clipBody(text)` —
  the whole extracted document, up to `MAX_BODY_CHARS` (200,000).

So images and fonts are *described*; documents are *transcribed*. The Library's
detail pane renders `item.body` into the "What this is" field either way
(`library.js` heading at `builder-library__heading`, field `label: 'What this
is'`), which is why a brand-guidelines PDF now appears there in full.

REQ-172 put a reader window above that field. The full document is therefore on
screen twice — once rendered properly by `reader.js`, once as raw source in a
text field that claims to say what the thing *is*.

[[DOC-38]] §6 contains both readings and is the root of the ambiguity. It says
the body is *"the attachment description — for a PDF, the extracted text"*, and
then says a description should *"lead with the words someone would search by:
what it depicts, what it concerns, whose business it belongs to."* The second
sentence describes a digest. The first sanctioned the dump.

## Why the full text still has to exist

It is not gratuitous. `ProjectKnowledge.refreshIndex` builds two indexes — a
document-level one and `buildChunkIndex` — and chunking the extracted text is
what makes a fact on page 12 of a client's brand book retrievable at all. That
is [[DOC-39]] §7's *"search wide, read deep"*. Replacing the body with three
sentences and stopping there would silently delete deep retrieval.

So this is not "make the body a digest". It is **both, in different places**.

## What should happen

**The body becomes a digest.** A few sentences: what the material is, whose it
is, roughly when it is from, what someone would reach for it for. The same
shape the image branch already produces, written for retrieval rather than
elegance in exactly the sense [[DOC-38]] §6 argues for.

**The full extracted text moves to a comment on the material ticket.** This
follows the precedent [[DOC-33]] §3.1/§3.2 already sets for chat: the durable,
human-scale record in the body, the bulky verbatim artefact in an append-only
comment. The alternatives considered and rejected are a `fields.extracted_text`
(a very large field on a row that every index pass reads) and a second blob
beside the original bytes (workable, but it puts a retrieval input somewhere the
knowledge component has no reason to look).

**The Library shows the digest and not the transcript.** "What this is" keeps
rendering the body, which is now the digest — no change to `library.js` beyond
what falls out of the body being short. The full text is already on screen, better
rendered, in the REQ-172 reader window directly above it.

**The degraded paths are unchanged.** `degraded()` already writes digest-shaped
prose — *"Scanned document, 14 pages, no extractable text"* — and a material with
no extractable text has no comment to write. `description_status` keeps its
current meaning.

## The knowledge-component half

`buildChunkIndex` chunks ticket bodies and only ticket bodies:

```js
// components/knowledge/js/src/chunk_index.js
chunkDocument(membership.get(uid)[0].body || '', { maxChars: maxChunkChars }),
```

For the full text to remain retrievable once it is in a comment, the chunk
indexer has to read a ticket's comments as well as its body. **This is a change
in `lagrange-framework`, not here, and it must land first** — shipping the split
against today's indexer would move the text somewhere nothing indexes.

Two things for whoever picks that up:

1. **Cache invalidation.** The chunk manifest keys on the ticket uid's
   `updated_at` and the file says so explicitly — *"a function of the body, which
   by definition has not changed if `updated_at` has"*. Once comments are chunked
   that premise no longer holds unless writing a comment moves the parent's
   `updated_at`, or the manifest key learns about comments. Getting this wrong is
   silent: the text is stored, and never indexed.

2. **Which comments.** Chunking every comment on every ticket is a different and
   much larger change than chunking a designated one. A marked comment type — the
   way `chat_transcript` is marked — keeps this narrow.

## Why this is worth doing beyond the duplication on screen

1. **The field is editable and currently cannot be used.** The description field
   commits on blur straight to `transport.save`. Nobody is going to correct a
   200,000-character extraction in a textarea. A digest is exactly the thing a
   client *should* correct — *"this is the 2023 deck, superseded by the one
   below"* — and today that affordance is real and unusable.

2. **The enumerate floor.** [[DOC-39]] §7 budgets the whole listing at around a
   kilobyte and falls back to an excerpt where a title is uninformative. An
   excerpt taken off the top of extracted PDF text is the cover page — the least
   informative 200 characters in the file. An excerpt off a digest is the digest.

3. **The document-level vector.** Embedding 200,000 characters as a single vector
   produces a centroid of everything, which is a vector of nothing in particular
   — and that is the vector the awareness map clusters territories from. A digest
   embeds cleanly, and the chunk index carries the deep half, which is the
   division of labour the two indexes were built for.

## Cost accepted

Describing a document means a model call per document upload, where today only
images cost one. That is accepted: the extraction has already run by that point,
so the call is fed truncated text rather than the file, and it is one call per
upload rather than per read. For a long document the digest is written from the
head of the text plus a sample further in, rather than from the head alone.