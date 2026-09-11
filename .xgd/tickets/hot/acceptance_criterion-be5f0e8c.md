---
uid: acceptance_criterion-be5f0e8c
id: AC-1692
type: acceptance_criterion
title: With no image describer configured the image is still stored, and the record
  says nothing has looked at it
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:04.117198+00:00'
updated_at: '2026-09-11T04:35:58.406578+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

With **no image describer configured**, an image is still stored and still listed, and the
record says why it has no real description.

- The material is created and the bytes are kept; nothing is refused.
- The body states that nothing has looked at the image yet and that it can be found by name but
  not by what it shows.
- The recorded outcome is the no-describer-configured outcome, held distinct from a describer
  that was reached and failed, because the two wait on different things.
- The recorded describer is explicitly empty rather than naming something that did not run.

## Verification

With no describer configured, hand the step an image and assert: a material is produced, the
outcome is the no-describer-configured one, the recorded describer is empty, and the body says
in words that nothing has looked at it. Assert this outcome differs from the one produced when a
configured describer throws.