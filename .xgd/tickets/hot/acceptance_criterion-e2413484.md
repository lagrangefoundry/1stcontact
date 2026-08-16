---
uid: acceptance_criterion-e2413484
id: AC-997
type: acceptance_criterion
title: One confirmed form is one change, however many fields were edited in it
created_by: xgd
created_at: '2026-08-07T02:16:33.376825+00:00'
updated_at: '2026-08-16T04:18:53.617887+00:00'
completed_at: null
last_field_updated: uat_coverage
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
rest. A dialog over an image region holds two controls — the thumbnail grid for
the image and the form for its alt text — and the values staged in both merge
into a **single change** on confirm: a new image and new alt text travel in one
change and produce one re-rendering, not one each. Choosing a thumbnail stages
and does not commit, exactly as typing into the form does.

The change carries **only what the operator touched**: a field left alone in
either control is absent from it. In particular, the presence of a picker beside
a form must not report the region's opened image back as a fresh choice, which
would land as an explicit instruction to restore the image the operator had just
replaced.

## Verification

Open a form over a region exposing more than one field where available, alter
several fields, and observe that nothing is written or re-rendered until the
form is confirmed, and that confirming applies all altered fields together as a
single change. Over an image region: choose a different thumbnail, confirm, and
assert the region's image changed and nothing else about it did — its alt text,
its identity and its other properties are byte-unchanged. Then alter both the
thumbnail and the alt text and assert a single change request carries both.