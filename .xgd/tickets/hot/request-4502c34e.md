---
uid: request-4502c34e
id: REQ-221
type: request
title: HEIC converts at the door, so an iPhone photograph is an ordinary image
created_by: EPIC-1
created_at: '2026-09-10T21:51:10.281072+00:00'
updated_at: '2026-09-10T22:30:12.209797+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-219
  chat_comment: comment-590859ba
---

## The gap

HEIC is what a modern iPhone produces by default, and Chrome decodes none of it.
So a client photographing their own shopfront and dropping it on the builder
hands us bytes that:

- the Library cannot preview,
- the editor cannot open,
- Browser Rendering cannot read,
- and the site cannot serve.

Every part of the image experience this epic builds is unavailable for the single
commonest way a small business takes a photograph.

## What changes

**A HEIC upload is converted at the door**, on the upload path in the Worker, to
a format everything downstream can read. What lands in the Library is an ordinary
image indistinguishable from any other, and every later step — preview, describe,
edit, promote, publish — works on it without knowing what it arrived as.

**The Images binding does it**, which is the strongest single reason that
dependency is worth taking: neither the client's canvas nor Browser Rendering can
decode HEIC, so without it this needs a wasm decoder in the Worker.

**Synchronously with the upload.** A conversion that completes later leaves the
Library showing a broken image and the client wondering what went wrong with
their photograph. The upload is not finished until there are bytes that render.

**The HEIC bytes are discarded, and that is a deliberate exception.** This epic's
rule is that an original is never lost. Here it is: we can do nothing with those
bytes — no preview, no edit, no publish — and the client has the file on their
phone by definition. Keeping an unreadable archival copy would cost storage on
every iPhone upload to buy a copy of a file its owner already has.

**A conversion that fails is a refusal, not a broken row.** The client is told
their photograph could not be read and the material is not created — the failure
DOC-38 §7.3's ordering exists to prevent is a record naming bytes that are not
there.

## Worth checking while in here

Whether the upload path advertises what it accepts at all, and whether a
rejected file says why. A client dropping a photograph and getting silence is the
same experience as this bug, arrived at differently.


---

## Answered from EPIC-1, 2026-09-10

Four of the five questions are answered here. The first is not mine to answer and
is with the operator — **everything below is conditional on it.**

**1. Is the account Enterprise for Images? — OPEN, with the operator.** The
investigation found that Cloudflare's limits page lists HEIC input as Enterprise
only. If it is not available to us, this ticket has no implementation as written
and the fallback is an **honest refusal** carrying the *Settings → Camera →
Formats → Most Compatible* advice — which is still a large improvement on today,
where a HEIC upload produces the actively false *"That file is no longer in
storage."* Do not start on the conversion path until this is confirmed.

Note also that this finding removes one of REQ-219's stated reasons for choosing
the Images binding over Browser Rendering. REQ-219's other reasons — per-publish
cost, and the transform chain fitting the recipe — are untouched, and the choice
stands; the HEIC argument does not.

**2. WebP as the output format — yes.** For the reason given: it is in
`VISION_MEDIA_TYPES`, it is in `TYPE_BY_EXTENSION`, and it is the smallest of the
three. AVIF is excluded because a conversion to it would land **undescribed**,
which is a worse outcome than a slightly larger file — the description is what
the KB indexes and what makes the picture findable later.

**3. `ingestFetch` converts too — yes.** The whole point of converting at the
door is that nothing downstream ever learns what the bytes arrived as. A second
entry path that skips it would reintroduce exactly this bug through a different
door, and the next person would have to discover it twice.

**4. The 20 MB binding ceiling gets its own pre-check and its own message — yes.**
`MAX_MATERIAL_BYTES` is 25 MiB, so a 22 MB HEIC passes our ceiling and fails the
binding. This repository's consistent choice is a named refusal over a translated
500: the client is told their photograph is too large to convert, in those terms,
rather than being shown a server error for a file we accepted.

**5. Detection is by magic number, not content type — confirmed as scope.** A
HEIC arriving as `application/octet-stream` never says `image/heic`, so a
content-type test misses the second of the two failure modes entirely.
`sniffImageFormat` (`tools/generate/src/cli/png.ts:83`) already tests the `ftyp`
brands correctly and lives where the Worker cannot import it; lifting it
somewhere shared is preferable to a second copy that can drift.

**6. The two UI defects split.**

- **The missing `accept` attribute stays in this ticket.** It is how a client
  learns what we take, and after this change the answer to *"can I upload my
  iPhone photo"* is different — so it must be stated where they are choosing the
  file. The module comment at `upload.js:96` already discusses "the accept list"
  as though it existed, which is how it went unnoticed.
- **The silent Library-route failure is a separate defect and needs its own
  ticket.** `receiveFiles` catches the error and surfaces it only when
  `source === 'chat'`, so a Library drop that 400s or 503s produces nothing at
  all. It is independent of HEIC, it predates this work, and folding it in here
  would hide a real bug inside a feature. Raised with the operator.

**7. On the create-then-attach ordering** — correctly identified as the reverse
of DOC-38 §7.3, correctly identified as pre-existing, and correctly left alone.
Converting in `ingestUpload`, before `ingest`, is what gives this ticket its
"a refusal, not a broken row" property regardless: no material ticket exists yet
to be orphaned.

**8. On testing** — the honest shape is agreed. Node-project tests proving the
routing against an injected fake converter (HEIC-by-magic-number routes to it;
`ingest` sees the converted bytes, filename and type; a converter failure raises
`MaterialRejectedError` and **no ticket is created**), plus one workers test of
the wiring. That the binding genuinely decodes HEIC is provable only against the
live API, and the ticket should say so rather than let a green suite imply
otherwise.
