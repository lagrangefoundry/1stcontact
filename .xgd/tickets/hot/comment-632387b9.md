---
uid: comment-632387b9
id: COMMENT-2097
type: comment
title: Comment on chat CHAT-34
created_by: xgd
created_at: '2026-09-02T18:33:41.218789+00:00'
updated_at: '2026-09-02T20:59:16.655362+00:00'
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

<!-- xgd-turn id="c2903a4b-2175-4d49-ae99-f372764bf4da-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T18:45:23.437600+00:00" -->
#### Claude
Agreed on all three points — and the KMS half turned out to be the load-bearing one, so I made it explicit in the ticket.

**REQ-173** — *Material description: a digest in the body, the full text in a comment* (draft, high, 3pt)

It specifies the split you described, plus the dependency that has to land first: `buildChunkIndex` in `lagrange-framework` chunks `membership.get(uid)[0].body` and nothing else, so moving the text into a comment before the indexer reads comments would put it somewhere nothing indexes. Two traps flagged for whoever takes that half — the chunk manifest keys on the parent's `updated_at` and the file explicitly justifies that by saying chunks are *"a function of the body"*, which stops being true; and "chunk every comment on every ticket" is a much larger change than chunking a designated one, so a marked comment type keeps it narrow. I left it as one ticket rather than splitting the framework work out — say the word if you want that as its own ticket in the framework store.

I did **not** create the framework ticket, since that's a different project's store.

---

## The pill

It's wrong, and it's wrong in a way that contradicts a promise the product made seconds earlier. **BUG-47** filed.

`site_slug` records **which site was open when you uploaded**. The pill reads it as **"the bytes are on this site."** Nothing reconciles those.

The seam is visible in the transport's own comment in `builder/api.js`:

> `slug` is optional and means "and put it on this site **if the role says so**"

Conditional on the role. But `material.ts` writes it unconditionally:

```js
...(input.siteSlug ? { site_slug: input.siteSlug } : {}),
```

Meanwhile `placeOnSite` — the thing that actually promotes bytes into the site's asset library — is correctly gated: `if (role !== 'site' || !slug) return { site_asset: null }`. So the gate holds where it matters. Your Markdown file is **not** on the site; DOC-38 §5's invariant is intact. This is a display defect, not a leak.

But every consumer of the field reads it as placement — the pill, the rights field labelled **`Used on`**, the `hereOnly` filter ("only show what's used here"), and the file comments in both `library.js` and `material.ts` that say *"used on this site"*. Four things describing placement, one field holding upload context.

Two more problems fell out while I was in there:

- **Even for `role: 'site'`, the pill can lie.** `placeOnSite` is documented to fail softly — *"a failure here does not lose the upload"* — and reports the failure in the envelope. `site_slug` is already written by then, so a promotion that failed is badged identically to one that succeeded.
- **The field is the wrong shape.** DOC-38 §7.7 lets one blob back two sites, so placement is many-to-many. A scalar was fine for "where it was uploaded"; it can't express "on both of this client's sites."

So the fix isn't a condition on the badge — it's that placement should be recorded by `placeOnSite` on success, as a collection, and the pill/label/filter should all read that instead. The ticket states the four invariants that have to hold afterwards rather than picking the field design.

One note: `xgd` committed both tickets locally but the push failed — `This proxy requires authentication`. They're in the store, not on the remote yet.

<!-- xgd-turn id="3adbc7f3-a062-4d6e-93da-c6fc8f102551-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T20:57:22.392680+00:00" -->
#### You
ok I would like to (1) add an initial icon to the item indicating its type - we basically have docs and images so an icon for each please. (2) Item title is in rather large text - and the item plus pills takes two lines I would like it to reduce to one. The addition of the icon for type removes one of our pills lets just put the others after the title.

I would like to change the wording:
"Just for you to read" -> "Background information"
"Put it on the site" -> "Site asset"
"What is it for" -> "Purpose"
"Used on this site" -> "Live on the site" <-- actually I want to check the semantics here does this mean (1) "its currently on the published site" or (2) "its in a version of the site" or (3) its in a version of the site including draft?

This needs to change on the upload overlay and the pills and the field. Can you create a ticket for these changes please?

<!-- xgd-turn id="3adbc7f3-a062-4d6e-93da-c6fc8f102551-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T20:59:16.612336+00:00" -->
#### Claude
Before the ticket — the semantics question has a definite answer, and it rules out your proposed wording.

**REQ-176** filed (draft, medium, 3pt) — covers all three, plus one thing I've flagged as **do not implement as written**.

## The semantics answer: it's (3), and "Live on the site" would be false

`placeOnSite` → `promoteToSiteAsset` → `editAssetAdd`, which writes to **`draft/assets`**. Its own collision message says so: `Asset file '<name>' already exists in draft/assets.` `RenderChannel` is `draft | published`, and publishing is a separate act.

So of your three readings:

1. **currently on the published site** — no
2. **in a version of the site** — no, not until published
3. **in the draft, including unpublished work** — **yes, this is it**

`Live on the site` asserts (1). A client who drops a logo, reads "Live on the site" and never publishes has been told their logo is on their website when it isn't — and given this pill is the one that carries the accent colour precisely because it's *"the answer to a question the client asked"*, it'd be a confident wrong answer.

My suggestion in the ticket: **`Added to the site`** for the pill, `Added to` for the field label. True of a draft, still says something real happened. But I marked it **confirm before implementing** — if what you actually want is for promotion to be publish-visible, that's a different and much bigger ticket, not a wording change.

## The rest

**Icon** — one correction to your framing: it's not just docs and images. `fields.kind` is `document | image | font | capture`, `describeFont` parses SFNT name tables, and the *"Put it on the site"* hint literally reads *"Photos, logos, **fonts**."* So three icons plus a fallback, not two.

**One line** — `.builder-library__row` is `flex-direction: column` today, which is the two lines. Separately, the title is oversized because `renderRow` builds its own span with no `font-size`, so it inherits the shell body size while the component's own `.list-detail-row-title` is 13px. Fixed in `builder.css`, not in `webui-list-detail` — other hosts share that.

**Wording** — the three unambiguous ones are cheaper than expected. `library.js` derives the role pill from the overlay's constant:

```js
const ROLE_LABEL = Object.fromEntries(UPLOAD_AREAS.map((a) => [a.id, a.label]))
```

So editing `UPLOAD_AREAS` in `config.js` changes the overlay *and* the pill. The `id` values (`site`, `reference`) are the wire vocabulary the route validates — labels change, ids don't.

**Ordering** — I've said BUG-47 should land first. It's the same badge, currently firing off `site_slug` (upload context, not placement), which is why it's on all three of your files. Renaming a badge that's showing on the wrong rows just makes it wrong in new words, and BUG-47 may replace the field it reads. The other five changes have no dependency.

Tickets so far this session: **REQ-173** (digest/comment split), **BUG-47** (the pill), **REQ-176** (this). All committed locally — the `xgd` push is still failing on proxy auth, so none have reached the remote.

<!-- xgd-chat-end -->