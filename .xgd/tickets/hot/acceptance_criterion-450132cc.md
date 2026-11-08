---
uid: acceptance_criterion-450132cc
id: AC-2378
type: acceptance_criterion
title: The image describer and the document describer are separately registered sessions
  on the same host, so describing an image never reaches the document describer or
  vice versa
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T05:42:12.064951+00:00'
updated_at: '2026-11-08T06:39:30.899134+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

The image describer and the document describer are **separately registered sessions on the same
AI host**. Building both — in either order, as the platform does on every request that may
describe material — never lets one answer for the other:

- a document described after both have been built is answered under the document-digest
  instruction, never the image one;
- an image described after both have been built is answered under the image-digest instruction,
  never the document one;
- this holds whichever of the two was constructed last.

## Verification

Over a fake model client at the network boundary, build the document describer and the image
describer in both orders. After each construction order, describe one document and one image and
inspect the requests the fake received: the document request's system content is the
document-digest instruction and carries no image block; the image request's system content is the
image-digest instruction and carries the image block.

## Reconciliation note

Formalised from REQ-207's "Landed 2026-09-08" consequences, which name the distinct registration
as load-bearing and record that a UAT pins it.