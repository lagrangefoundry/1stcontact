---
uid: request-4502c34e
id: REQ-221
type: request
title: HEIC converts at the door, so an iPhone photograph is an ordinary image
created_by: EPIC-1
created_at: '2026-09-10T21:51:10.281072+00:00'
updated_at: '2026-09-10T21:51:10.281072+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
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
