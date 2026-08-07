---
uid: acceptance_criterion-96e171f3
id: AC-956
type: acceptance_criterion
title: The published and preview renders are byte-identical to what they were before
  the edit channel existed, and still work
created_by: xgd
created_at: '2026-08-06T21:27:03.522157+00:00'
updated_at: '2026-08-07T17:02:38.378408+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
---

## Criterion

Nothing belonging to the edit channel appears in the two shipped channels. The
published and preview renders of a page carry no region stamp, no address, no
page stamp, no document-level edit marker and no outline treatment — neither the
resting outline nor the hot one — and remain fully functional: their links carry
their destinations and their forms their destination and submit verb.

Rendering the edit channel leaves the shipped channels alone. Asking for an edit
render — once or repeatedly — does not change the bytes the preview or published
channel produces for the same definition, and produces no artefact that either
of them picks up. This is a statement about **edit-channel artefacts and
idempotence**, not about byte-identity with a hypothetical build in which the
edit channel does not exist: a behavior module's presentation-seam marker is
emitted in every channel by design, so the shipped channels are not expected to
match their pre-edit-channel output byte for byte.

## Verification

Render a seeded site's preview channel and keep its bytes as the baseline.
Invoke the edit render twice against the same definition, then render the
preview channel again and assert the file list and every file's bytes are
identical to the baseline. Render the published channel from the locked
revision, and assert both shipped channels' output contains no address, no
region stamp, no page stamp, no edit marker and no outline treatment, and that
link destinations and form destination/verb are present.
