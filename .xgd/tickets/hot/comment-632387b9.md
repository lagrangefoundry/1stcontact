---
uid: comment-632387b9
id: COMMENT-2097
type: comment
title: Comment on chat CHAT-34
created_by: xgd
created_at: '2026-09-02T18:33:41.218789+00:00'
updated_at: '2026-09-02T18:42:02.848169+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-ded18c49
  kind: chat_transcript
---

<!-- xgd-turn id="d168f3d2-ba63-4d9b-bb39-0075728ea476-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T18:33:30.159086+00:00" -->
#### You
OK I want to talk about the library tab and the display. I made a change to include the full content of a document in a preview window at the top of the detail page. It appears that the entire document is also being displayed in the what this is section. That was not what I was expecting. I was expecting what this is to be a summary, a digest that would be easy for the LLM to consume rather than the whole document. What do you think?

<!-- xgd-turn id="d168f3d2-ba63-4d9b-bb39-0075728ea476-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T18:35:17.995028+00:00" -->
#### Claude
You're right, and the pipeline is already inconsistent about it in a way the reader window has now exposed.

## What's actually happening

`describe.ts` has four branches and they don't agree on what a body is:

- **Image** → asks a model for *"a short title, then two or three sentences saying what the image depicts"*. A genuine digest.
- **Font** → parses the name table into three sentences. A digest.
- **PDF / text** → `clipBody(extractedText)` — the whole document, up to 200,000 characters.

So images get *described*, documents get *transcribed*. `library.js` renders `item.body` into the "What this is" textarea regardless, which is why your brand guidelines land there whole.

DOC-38 §6 contains both readings and that's the root of it. It says the body is *"the attachment description — for a PDF, the extracted text"*, and three paragraphs later says it should *"lead with the words someone would search by: what it depicts, what it concerns, whose business it belongs to."* The second sentence describes a digest. The first sanctioned the dump.

## Why the dump earns its place, though

It isn't gratuitous. `refreshIndex()` builds two indexes: a document-level one and `buildChunkIndex`. Chunking the full text is what makes a fact on page 12 retrievable — DOC-39 §7's *"search wide, read deep."* Replace the body with three sentences and deep retrieval quietly dies. So the answer isn't "make it a digest", it's **both, in different places**.

## Three costs beyond the visual duplication

1. **The field is editable.** `commit: 'auto'` → `transport.save`. Nobody is going to correct a 200k-character extraction in a textarea. A digest is exactly the thing a client *should* fix — *"this is the 2023 deck, superseded."* Right now that affordance is real and unusable.

2. **The enumerate floor.** DOC-39 §7 budgets ~1KB for the whole listing and falls back to an excerpt when a title is uninformative. An excerpt off the top of extracted PDF text is the cover page — the least informative 200 characters in the file.

3. **The document-level vector.** Embedding 200k characters as one vector gives you a centroid of everything, which is a vector of nothing in particular — and that's the vector the awareness map clusters territories from. A digest embeds cleanly. The chunk index is already there to carry the deep half.

## Where the full text should go

Body = the digest. Full text = somewhere the chunk indexer reads and the UI doesn't. Three candidates:

- **A comment on the ticket**, the way DOC-33 §3.1/§3.2 puts the ledger in the body and the verbatim transcript in a `chat_transcript` comment. Structurally the closest analogy and there's working precedent in this codebase.
- **A second blob** alongside the original bytes — content-addressed, keeps the D1 row small, and "the text we pulled out of your PDF" is a legitimate artifact.
- **A `fields.extracted_text`** — simplest, but it's a large field on a hot row, and DOC-38 §2 already flags that an offload threshold has to sit well above 100KB precisely so index builds don't turn into one R2 GET per document.

**The question that has to be settled first**: does `buildChunkIndex` read only ticket bodies? If it does, moving the text out of the body guts deep retrieval unless the indexer is taught the new location — and that may be a `lagrange-framework` change rather than one here. Worth checking before this becomes a ticket, because it decides whether this is a small change or a cross-repo one.

One accepted cost either way: describing documents means an LLM call per document upload, where today only images cost one. Cheap enough — the extraction already ran, so you feed it truncated text rather than the file. The degraded paths need no change; a scanned PDF's *"Scanned document, 14 pages, no extractable text"* is already digest-shaped.

Want me to check the chunk indexer's corpus contract, or go straight to a ticket?

<!-- xgd-turn id="f28dba32-a8ff-4200-9502-7edc2ede71b4-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T18:39:10.311077+00:00" -->
#### You
The KMS should read comments too. I think the right place to put the full text is in a comment. The body should be a short summary or digest.

<!-- xgd-turn id="c2903a4b-2175-4d49-ae99-f372764bf4da-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T18:42:02.810586+00:00" -->
#### You
The KMS should read comments too. I think the right place to put the full text is in a comment. The body should be a short summary or digest. If you agree can you create a ticket for this,

This is a design session you create tickets for me do not start implementing anything - I have the ticket agents for that.

Next question: I uploaded 3 things a PNG, a MD and a PDF. The first I chose "Put it on the site" the second I chose "Just for you to read" All three have a pill that says "On this site"? What is that pill supposed to mean - it seems clearly wrong.

<!-- xgd-chat-end -->