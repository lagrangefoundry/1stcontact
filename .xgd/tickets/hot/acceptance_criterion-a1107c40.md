---
uid: acceptance_criterion-a1107c40
id: AC-1108
type: acceptance_criterion
title: Drawing an image is its own grantable capability, separate from managing files
  a person supplied
created_by: xgd
created_at: '2026-08-10T09:34:52.750404+00:00'
updated_at: '2026-08-10T09:45:46.952758+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
The operation that writes a composed drawing belongs to a capability group of its own, distinct from the group covering the management of files a person supplied. A consumer can therefore be granted the ability to draw without being granted file management: the builder's assistant is granted drawing, and the operations for adding or removing supplied files are declared on the surface but not reachable by it.

## Verification
Read the surface's declared groups and assert the drawing operation and the supplied-file operations sit in different groups. Exercise the assistant's tool set: the drawing operation is present and performs a write, while the supplied-file operations are absent from the offered set.