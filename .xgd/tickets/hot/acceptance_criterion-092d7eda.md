---
uid: acceptance_criterion-092d7eda
id: AC-1824
type: acceptance_criterion
title: Capture runs to completion inside the deployed runtime and lands every bundle
  member in the deployment's object storage
created_by: martin-github@westhead.me
created_at: '2026-09-19T13:37:09.778175+00:00'
updated_at: '2026-09-19T13:37:09.778175+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-177897a0
  kind: behavior
  regression_only: false
---

## Criterion

Capturing a page runs to completion **inside the deployed runtime** and lands a
complete bundle in the deployment's object storage. For a capture of a reachable
URL, the resulting bundle holds every member the bundle format names — the
capture record, the full-page screenshot, the post-script DOM, the pre-script
DOM, the multi-viewport oracle, the folded L1 document, the recovered form model
and the structural hints — plus **more than one** per-width ladder screenshot,
one per sampled width.

Each of those members reads back through the bundle codec as the artifact it is:
the capture record names the captured host, the oracle holds at least one
projection, the L1 document holds at least one width, the form model is present,
and the structural hints carry the media breakpoints the page declared.

The bytes are addressed under the capturing account's own key space, so where
they landed is a property of the key and not of a convention.

## Verification

Inside the deployed runtime, against a real object-storage bucket and a real
registry, capture a fixture URL through the production capture path with only the
browser on the far side substituted. Assert the returned bundle name, then list
the bundle's members and assert each named member is present and that more than
one ladder screenshot matching the per-width key pattern exists. Read each member
back through the codec and assert its content. Separately, list the bucket by the
capturing account's prefix and assert the capture record's key appears under it.
