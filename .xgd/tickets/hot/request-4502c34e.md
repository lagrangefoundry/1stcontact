---
uid: request-4502c34e
id: REQ-221
type: request
title: HEIC converts at the door, so an iPhone photograph is an ordinary image
created_by: EPIC-1
created_at: '2026-09-10T21:51:10.281072+00:00'
updated_at: '2026-09-12T22:27:41.201852+00:00'
completed_at: null
last_field_updated: body
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on: []
  chat_comment: comment-590859ba
  commits:
  - working_sha: f87c58e2a1dabdfdc5618858b32ce0f19c6fc18f
    reconcile_sha: null
    main_sha: null
  - working_sha: 0191ac5e0665ce211cc3151b3f99f7ef8a8f8e6e
    reconcile_sha: null
    main_sha: null
  version: 0.2.161
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

Today it fails in two different ways depending on what the browser happened to
say about the file. When the browser reports `image/heic`, the material is
classified as an image, the Library renders an `<img>`, the decode fails, and the
client is told *"That file is no longer in storage."* — which is not true, and
sends them looking for the wrong problem. When the browser reports nothing —
which is the ordinary case for a file dragged in from Finder — the material is
filed as a **document**, and a photograph appears in the Library as a thing with
no picture in it. Neither outcome says the word HEIC anywhere.

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

## How it recognises one

**By the bytes, not by what the browser said.** The upload route takes the
browser's `File.type` and falls back to `application/octet-stream`, and that
fallback is the ordinary case for HEIC rather than the exception: a file dragged
from Finder arrives with no type at all, because the browser has no registered
type to give. A converter that waited to be told `image/heic` would therefore
miss the commonest form of exactly the file it exists for. So the leading bytes
are read: HEIC is an ISO base-media file, and the `ftyp` box names a brand —
`heic`, `heix`, `hevc`, `hevx`, `heim`, `heis`, and the generic HEIF brands
`mif1` and `msf1` an iPhone photograph also carries.

**The declared type is not consulted at all**, in either direction. A file that
says `image/heic` and is not one is converted on its bytes or refused on them;
a file that says nothing and is one is still converted. This is the same
principle `resolveContentType` already follows from the other end — the sender's
observation is honoured where it is informative, and the bytes decide where it
is silent.

## What it converts to

**JPEG.** Three constraints pick it and there is no judgement left over. The
vision describer reads JPEG, PNG, GIF and WebP and **not AVIF**, so an AVIF
conversion would land a photograph in the Library undescribed and unsearchable —
the failure mode this ticket exists to remove, arrived at from the other side.
Between JPEG and WebP, what is being stored is the *master* rather than the
delivery copy: the width ladder at publish is what chooses delivery formats
(REQ-222), and the recipe renderer (REQ-219) re-derives from this file every time,
so the stored format wants to be the one every future consumer can open rather
than the one that is smallest today. And JPEG is what the phone itself would have
produced had its owner set *Most Compatible* — which is the sense in which the
converted file is the photograph they took.

**The name changes with the bytes.** `shopfront.HEIC` becomes `shopfront.jpg`.
The filename is shown in the Library, travels onto the attachment record, and is
what `resolveContentType` reads when a later pass re-derives the type; leaving
`.HEIC` on a file that is now JPEG would make the record disagree with itself and
would put a lie in front of the client in the one place they look.

## When it cannot

**A deployment with no Images binding refuses the file.** It does not store the
HEIC and get on with it. Storing it is precisely the broken row above — a
material whose preview cannot render, whose description says the format cannot be
looked at, and which will be exactly as unreadable in six months. The refusal
names the format and says what to do, which is a thing the client can act on in
under a minute: their phone will take JPEGs directly if they ask it to.

**A photograph too large for the converter is refused for being too large**, and
says so in those words. The material ceiling and the converter's own input limit
are different numbers, so there is a band of file sizes this repository accepts
and the converter will not take. A client in that band is owed the reason they
are actually in — a size — rather than a generic failure to read the file.

## Silence is the same bug, arrived at differently

The two halves of this were worth checking while in here, and both are real.

**The upload surface advertises what it accepts.** The file picker offers every
file on the disk today and names no formats at all, so the first thing a client
learns about what we take is a refusal after the upload.

**A refused upload says why, wherever it was dropped.** A drop into the
conversation reports the reason; a drop onto the Library reports nothing at all —
the row simply never appears, and the client is left to conclude the product
ignored them. A refusal the client cannot see is not a refusal, and this ticket's
whole answer to an unreadable photograph is a sentence the client can act on, so
the sentence has to reach them from both drop areas.


## Consequences worth stating, because tests assert them

These follow from the decisions above rather than adding to them, and each is a
thing a later change could quietly reverse.

**AVIF shares the container and is deliberately left alone.** AVIF is an ISO
base-media file too, so a detector that stopped at the `ftyp` box would convert
a format this pipeline already stores, previews and serves — re-encoding a
perfectly good image and losing quality doing it. The brand is what separates
them, which is the reason the brand is what is read.

**Anything that is not HEIC passes through by identity, not by a re-encode.**
This check runs on every upload. A PNG that came out the other side of an image
pipeline would be a different file for no reason, so what is stored for every
other format is byte-for-byte what arrived.

**What we fetch on a client's behalf is not converted.** The conversion belongs
to the door, and `ingestFetch` is not the door: it pulls `reference` material
that is never promoted onto a site. Converting it would be a different change
with a different justification.

**The failure detail is kept for an operator and withheld from the client.**
Whatever the converter says about codecs is addressed to a programmer; what
reaches the client is a sentence they can act on. Both are worth having and they
are not the same sentence, so the original travels as the refusal's cause rather
than being concatenated onto the one the client reads. For the same reason, the
refusals name the format and the remedy and do not name the file — the two
surfaces that show them name the file themselves, and a filename in the sentence
would appear twice in every message anybody reads.

**The name is rewritten even where there is nothing to rewrite.** A photograph
with no extension gains one, because the extension is the only thing the
silent-type path has to read; a name that is only an extension has nothing in
front of the dot to keep and becomes a plain name. Getting this wrong stores the
file as `shopfront.HEIC.jpg`, carrying the extension the rename exists to remove.

**The accept list names HEIC and does not say `image/*`.** Naming HEIC is the
entry that makes the list worth writing — we take an iPhone photograph now, so a
picker that greyed it out would refuse a file the product handles. `image/*`
resolves to whatever the platform thinks an image is, which on some browsers
excludes HEIC and on others admits formats nothing here can read: an
advertisement whose content depends on the client's operating system is not an
advertisement. The list is a hint rather than a gate — a drag never consults it
and *All Files* is always available — so the origin's refusals stay the only
enforcement.

**The sentence the client reads is the origin's own.** The surfaces relay it and
do not compose their own, because the origin is what knows the ceiling, the
format and the remedy. The browser invents a sentence only where there is none to
relay — a dropped connection, an answer that was not JSON.

**A refusal is cleared by the next drop that succeeds.** One left standing above
a list that has since accepted the file would be a worse lie than the silence it
replaced.

**The Images binding is declared on both sides of `wrangler.toml`.** A named
wrangler environment inherits neither vars nor bindings, and this binding's
failure mode is the nastiest of the set: forgetting the production repeat leaves
local dev converting happily while the deployed Worker has no binding at all and
refuses every iPhone photograph. Nothing an operator does locally could notice
it, so the two halves are pinned together.

**And HEIC input is plan-gated at Cloudflare.** It is an Enterprise-plan input
format on their own list. That is exactly what makes the refusal above
load-bearing rather than defensive: a deployment whose plan does not admit HEIC
refuses the file and says so, instead of accepting bytes it cannot decode. What
this repository can prove locally is that the declaration exists, is named
identically on both sides, and is what the code reads — what the live API does
with real HEIC bytes is a question about an account and is not claimed here.



---

## Noted from EPIC-1, 2026-09-11

### The plan question is the operator's and is still open

*"Worth confirming the plan"* has not been answered and cannot be answered from
this repository — whether the account is Enterprise for Images is a fact about
billing, not about code. It is surfaced to the operator rather than guessed at.

**Nothing is blocked on it**, and that is this ticket's own doing: the refusal was
built to carry the weight, so a deployment whose plan does not admit HEIC names
the format and the remedy instead of storing bytes it cannot decode. The answer
changes which of two correct behaviours a client meets, not whether the product
is correct.

### The epic's record of this ticket was stale, and this ticket is better than it

[[EPIC-1]]'s second-pass note says HEIC conversion *"is dropped"* and that this
ticket is rescoped to detection and honest refusal only, with the conversion
design *"recorded for a follow-on if the binding ever becomes available."*

**What landed is both**: conversion where the binding can decode, and a named
refusal where it cannot — chosen at runtime rather than at scoping time. That is
strictly better than the rescope, because it needs no second ticket if the plan
answer turns out to be yes, and degrades to exactly the rescoped behaviour if it
turns out to be no. The epic's note is corrected rather than this ticket's scope.

### The REQ-219 correction you flagged has been made

*"This also weakens one sentence in REQ-219's rationale"* — correct, and it is now
recorded there. The sentence *"it cannot decode HEIC — so it would have solved
this and left the upload path needing a second answer"* does not hold if Images
cannot decode HEIC on this account either. [[REQ-219]]'s conclusion is unaffected;
per-publish cost and transform-chain fit still choose the Images binding, and that
is the renderer that shipped.

### The silent Library-drop failure: fixed here, and the epic had it wrong

For the record, since the epic carried this as an open defect needing its own
ticket after this ticket had already closed it. `receiveFiles` now surfaces a
refusal from the Library drop area as well as the chat, and `library.refused()`
receives it. No ticket was filed; the epic's record was stale, not the code.


### The plan question is answered: the account is not Enterprise

Queried against the Cloudflare API with the deployment's own token, 2026-09-11:

```
GET /client/v4/accounts/<id>
  "type": "standard"
  "legacy_flags": { "enterprise_zone_quota": { "maximum": 0, "current": 0 } }
```

**`type: "standard"` is the answer** — an Enterprise account reports `enterprise`,
and the zero enterprise-zone quota corroborates it. So **Cloudflare Images HEIC
input is not available to this deployment**, and the conversion branch this ticket
built will not run in production.

**What actually runs is the refusal**, which is why this ticket was built the way
it was. A client's iPhone photograph is refused by name, with the *Settings →
Camera → Formats → Most Compatible* remedy — a change that takes them under a
minute and fixes every future upload. That is the product's real behaviour, and it
is correct rather than degraded.

**The upgrade has no published price.** Enterprise is sales-negotiated at
Cloudflare; there is no self-serve tier that adds HEIC input, and nothing in the
dashboard will quote one. So the honest framing for the operator is that this is
not a purchase decision with a number attached — it is a sales conversation, and
not one worth opening for HEIC decode alone.

**Two caveats on the evidence.** The token is scoped narrowly: `/subscriptions`
and the Images endpoints both return `10000 Authentication error`, so this is the
account object's own type rather than a direct read of the Images entitlement. And
the conversion path remains genuinely untested against real HEIC bytes, as the
suite headers already say — if the plan ever changes, that is what to test first.

**The follow-on, if HEIC volume ever justifies it**, is the wasm decoder (libheif)
this ticket's investigation named and deliberately avoided. It needs no plan
change. It is not worth building on today's evidence: the refusal is cheap,
honest, and teaches the client a fix that helps them everywhere else too.


---

## Correction from EPIC-1, 2026-09-12: a stale heading contradicts a later answer

The heading *"The plan question is the operator's and is still open"* is **no
longer true**, and the section that resolves it sits further down the same body:
*"The plan question is answered: the account is not Enterprise"* — queried
against the Cloudflare API with the deployment's own token, `"type": "standard"`,
zero enterprise-zone quota.

Recorded because this ticket is `ready_to_reconcile` and the two sections
disagree in reading order: anyone stopping at the first heading concludes an open
question blocks the ticket, when the answer is forty lines below it.

**The answer, restated once so it cannot be missed:** HEIC input is Enterprise-
only at Cloudflare, this account is standard, so the shipped behaviour is the
**honest refusal** — naming the format and the *Settings → Camera → Formats →
Most Compatible* remedy — and not the conversion. That is what the UATs pin, and
it is correct for this deployment. The wasm decoder (libheif) remains the
follow-on if HEIC volume ever justifies it; it needs no plan change.
