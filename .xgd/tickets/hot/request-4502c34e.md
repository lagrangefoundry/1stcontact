---
uid: request-4502c34e
id: REQ-221
type: request
title: HEIC converts at the door, so an iPhone photograph is an ordinary image
created_by: EPIC-1
created_at: '2026-09-10T21:51:10.281072+00:00'
updated_at: '2026-09-11T02:05:26.104272+00:00'
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


---

## Rescoped by the operator, 2026-09-10: HEIC conversion is dropped

**The Enterprise question is answered by not answering it.** There is no visible
route to the plan tier or its price, and the epic is not going to wait behind a
procurement question. **Conversion is out of scope for this ticket.**

What remains is worth shipping on its own, needs no plan change, and fixes the
part of this that is actively misleading.

### What this ticket now delivers

**A HEIC upload is refused at the door, honestly.** Detected by magic number,
because the second failure mode never says `image/heic` — a file arriving as
`application/octet-stream` is filed as a *document* today. `sniffImageFormat`
(`tools/generate/src/cli/png.ts:83`) already tests the `ftyp` brands correctly
and wants lifting somewhere the Worker can import it.

**The refusal says what to do about it.** Point the client at *Settings → Camera
→ Formats → Most Compatible*, which changes their phone's default to JPEG and
solves it permanently in one visit. `MaterialRejectedError` already carries a
message to a client, so this is a message and a predicate, not a mechanism.

**And it refuses before any record exists.** In `ingestUpload`, ahead of
`ingest`, so no material ticket is created that names bytes we cannot use.

**The picker advertises what it accepts.** `upload.js:102` sets no `accept`
attribute at all, despite the module comment at line 96 discussing "the accept
list" as though one existed. After this change the answer to *"can I upload my
iPhone photo"* is a real answer, and it must be visible where the client is
choosing the file rather than after they have dropped it.

### Why a refusal is a genuine improvement, not a consolation

Today a HEIC upload produces one of two wrong outcomes and no true one:

- announced as `image/heic`, it is filed as an image, the Library renders
  `<img src>`, Chrome fails to decode, and the error handler prints **"That file
  is no longer in storage."** — a sentence that is false, and that sends the
  client looking for a problem that does not exist;
- announced as nothing, it is filed as a **document**, and simply never behaves
  like a picture again.

A client who is told *"iPhone photos in this format can't be read — here is the
one setting that fixes it"* is strictly better served than by either. This is
the DOC-38 §10 argument: a named state beats a silent wrong one.

**Promotion also needs the guard.** Nothing between `promoteToSiteAsset` and the
public site checks content type today, so a HEIC that predates this change can
still be placed on a site and served to every visitor. Refusing at the door does
not clean up what is already stored.

### What is deliberately left undone

**Conversion.** If the Images binding becomes available, this ticket's detection
point is exactly where the conversion belongs, and the earlier analysis of it
holds in full — convert in `ingestUpload`, before `ingest`; output **WebP**,
never AVIF, because AVIF is not in `VISION_MEDIA_TYPES` and would land
undescribed; change filename and content type together, before `ingest` resolves
the type once at its head; and pre-check the binding's 20 MB input ceiling with
its own refusal, since `MAX_MATERIAL_BYTES` is 25 MiB and would otherwise let a
22 MB file through to a 500. File it as a follow-on rather than reopening this.

**The silent Library-drop failure** stays out, as before: `receiveFiles`
surfaces an upload error only when `source === 'chat'`, so a Library drop that
400s or 503s produces nothing at all. It is independent of HEIC, it predates this
work, and it needs its own ticket — **and this rescope makes it urgent**, because
the refusal above is delivered through exactly that silent path. A honest refusal
nobody ever sees is not a fix.
