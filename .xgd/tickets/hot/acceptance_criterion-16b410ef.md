---
uid: acceptance_criterion-16b410ef
id: AC-1103
type: acceptance_criterion
title: A page's search metadata is written on creation, merged on update, and appears
  in the rendered document
created_by: xgd
created_at: '2026-08-10T09:34:28.087754+00:00'
updated_at: '2026-08-16T01:57:16.708913+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Creating a page accepts search metadata (a title, a description, and optionally a shared-link image) and stores it. Updating a page accepts the same metadata and merges it, so naming only the description leaves the stored title intact. The stored metadata is emitted in the rendered page's document head as its title and its description meta tag. An update naming none of title, path or search metadata is refused with a message saying what may be passed.

## Verification
Create a page with search metadata and read it back. Update only the description and read back: the description is new and the title is the original. Render the site and assert the rendered page's title element and description meta tag carry the stored values. Attempt an update with no fields: it fails with a message naming the accepted fields.