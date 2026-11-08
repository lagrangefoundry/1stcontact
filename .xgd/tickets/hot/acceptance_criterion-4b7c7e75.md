---
uid: acceptance_criterion-4b7c7e75
id: AC-2097
type: acceptance_criterion
title: Describing a document or an image opens one tool-less, unprimed describer session
  per item that writes no conversation record and is closed afterwards; an image is
  sent as an image content block beside the instruction
created_by: xgd
created_at: '2026-11-01T03:16:54.517390+00:00'
updated_at: '2026-11-08T06:39:31.127656+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

The platform's default describers — for documents and for images — reach the model through the
platform's own AI host as a **lightweight session**, observable at the model boundary and in the
store:

- the model is offered **no tools**;
- its system instruction is the fixed digest instruction for that kind of material (the
  document-digest instruction for a document, the image-digest instruction for an image) and
  nothing else — no landscape of the client's material, no toolbox manual;
- describing a document or an image creates **no conversation record** (no `chat` ticket) in the
  client's store;
- each item gets its **own session**, so two documents (or two images) described in turn never
  share context — the second request carries none of the first's content;
- a document is sent as the text of the request; an **image is sent as an image content block
  carrying the uploaded bytes, with a one-line instruction beside it**, image first — so the
  picture itself is on the wire, not a description of it or its filename;
- the session is closed after the reply, **including when the model call fails**, and the
  failure still surfaces to the description step rather than being swallowed there;
- the describer reports the model that answered, which is what is recorded as the describer.

## Verification

Build the default text describer and the default image describer over a fake model client at
the network boundary. Describe two different documents in turn, and two different images in turn,
and inspect the requests the fake received: assert each offers no tools and carries only its
kind's digest instruction as system content; the second request of each pair carries none of the
first's content; each image request's user turn holds an image block whose data is the uploaded
bytes (base64) and whose media type is the upload's, followed by the instruction text. Assert no
`chat` ticket exists afterwards and no session remains open. Make the fake throw and assert the
describer rejects and the session is still closed.