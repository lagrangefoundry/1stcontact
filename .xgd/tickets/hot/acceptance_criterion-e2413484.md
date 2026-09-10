---
uid: acceptance_criterion-e2413484
id: AC-997
type: acceptance_criterion
title: One confirmed form is one change, however many fields were edited in it
created_by: xgd
created_at: '2026-08-07T02:16:33.376825+00:00'
updated_at: '2026-09-10T23:34:26.395719+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Confirming the form produces exactly one change to the draft and one
re-rendering, regardless of how many of its fields the operator altered.
Editing fields within the open form writes nothing; the confirm is the single
moment anything is applied.

This holds when the dialog draws some of its fields itself and delegates the
rest, and it holds across **however many controls the region's fields were
spread across** — that count is derived from what the region exposes, never
written down here. A dialog over an image region holds the thumbnail grid the
dialog draws itself for the picture, the editing box for its alt text, and the
parameter sheet for how the picture is framed, shaped and adjusted; the values
staged in all of them merge into a **single change** on confirm: a new image,
new alt text and an altered framing parameter travel in one change and produce
one re-rendering, not one each. Choosing a thumbnail stages and does not commit,
exactly as typing into the form does. Which control a given field is drawn in is
decided by the field's declared control (AC-1123), not restated here.

The change carries **only what the operator touched**: a field left alone in
any control is absent from it. In particular, the presence of a picker beside
a form must not report the region's opened image back as a fresh choice, which
would land as an explicit instruction to restore the image the operator had just
replaced.

## Verification

Open a form over a region exposing more than one field where available, alter
several fields, and observe that nothing is written or re-rendered until the
form is confirmed, and that confirming applies all altered fields together as a
single change. Over an image region: choose a different thumbnail, confirm, and
assert the region's image changed and nothing else about it did — its alt text,
its identity and its other properties are byte-unchanged. Then alter the
thumbnail, the alt text **and one framing parameter in the sheet**, and assert a
single change request carries all three together and produces one re-rendering.
