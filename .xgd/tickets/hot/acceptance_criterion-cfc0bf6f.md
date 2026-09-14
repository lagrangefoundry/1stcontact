---
uid: acceptance_criterion-cfc0bf6f
id: AC-1762
type: acceptance_criterion
title: 1c capture page runs to completion inside the deployed serverless runtime,
  where no filesystem exists
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:48:07.095258+00:00'
updated_at: '2026-09-14T04:48:07.095258+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
`1c capture page <url>` completes successfully when driven inside the deployed
serverless runtime — the runtime that provides no filesystem — writing into the
cloud-backed store it is given and reporting the bundle name it wrote.

The capture pipeline is given its store rather than choosing one: it has no
default backing, so the same pipeline code is what runs on the operator's machine
against `storage/references/` and in the cloud against the client-private bucket.

## Verification
Drive `1c capture page` inside the Workers runtime against a real bucket and a
real tenant registry, with only the browser on the far side of the driver seam
faked. The command returns a result naming the bundle, and the run does not fail
for want of a filesystem. The equivalent run on the operator's machine, given the
filesystem-backed store, produces a bundle under `storage/references/`.
