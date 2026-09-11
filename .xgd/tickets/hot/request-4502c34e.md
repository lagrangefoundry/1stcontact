---
uid: request-4502c34e
id: REQ-221
type: request
title: HEIC converts at the door, so an iPhone photograph is an ordinary image
created_by: EPIC-1
created_at: '2026-09-10T21:51:10.281072+00:00'
updated_at: '2026-09-11T02:13:52.361781+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on: []
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
