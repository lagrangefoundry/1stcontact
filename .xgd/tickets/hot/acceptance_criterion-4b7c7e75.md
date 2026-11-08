---
uid: acceptance_criterion-4b7c7e75
id: AC-2097
type: acceptance_criterion
title: Describing a document or an image opens one tool-less, unprimed describer session
  per item that writes no conversation record and is closed afterwards; an image is
  sent as an image content block beside the instruction
created_by: xgd
created_at: '2026-11-01T03:16:54.517390+00:00'
updated_at: '2026-11-08T10:08:53.464931+00:00'
completed_at: null
last_field_updated: body
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
  carrying the uploaded bytes, whose media type is exactly the upload's own, with a one-line
  instruction beside it**, image first — so the picture itself is on the wire, not a description
  of it or its filename;
- the session is closed after the reply, **including when the model call fails** — no session
  and no live junction remains on the describer's session manager afterwards — and the failure
  still surfaces to the description step rather than being swallowed there;
- the describer reports the model that answered — the `model` of the request actually sent —
  which is what is recorded as the describer (`description_model`).

## Verification

`tests/reconciliation-material-description-session.workers.test.ts`, in workerd, with the
Anthropic client faked at the network boundary and everything else (session manager, role,
in-memory junctions, null archive, D1, R2) real.

- `test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session`:
  ingest two different documents and two different images (a PNG, then a JPEG) through the real
  ingestion. Assert each request offers no tools and carries only its kind's digest instruction;
  the second request of each pair carries none of the first's content; each image request's user
  turn is the image block first — its `source.media_type` equal to the upload's type exactly
  (`image/png`, then `image/jpeg`) and its `source.data` equal to the uploaded bytes in base64 —
  then exactly one instruction text block. Assert the recorded `description_model` equals the
  `model` field of the request the fake received (for a document, `<that model> (text-decode)`).
  Assert no `chat` ticket exists afterwards; a failing model call rejects the describer and a
  later describe is clean; the failure surfaces as a `failed` description.
- `test_UAT_AC2097_no_describer_session_remains_open_after_a_success_or_a_failure`: capture the
  describer's own `SessionManager` (by wrapping the shared class's `createSession`; no production
  seam). For both describers, on a success and on a failing model call, assert exactly one
  `describe-…` junction is open on that manager while the model is being called, and that after
  the describer resolves or rejects its junction store's `discover()` is empty and it holds no
  live session. The same is asserted through the description step's failure path.
