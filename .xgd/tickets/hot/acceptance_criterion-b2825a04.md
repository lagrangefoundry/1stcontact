---
uid: acceptance_criterion-b2825a04
id: AC-1109
type: acceptance_criterion
title: All four capabilities are reachable from the command line
created_by: xgd
created_at: '2026-08-10T09:34:57.911103+00:00'
updated_at: '2026-08-10T09:34:57.911103+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
The same four capabilities are available from the command line: listing component kinds and adding, reconfiguring and removing an instance on a page; writing a drawing by supplying its content with optional alt text and explicit replacement; creating and updating a page with its search metadata; and writing settings, where the value arrives as text and is read as structured data — the one boundary where a setting genuinely arrives as a string.

## Verification
Run each command against a scratch site and assert the resulting stored definition matches what the equivalent surface call produces: a component instance on a page, a drawing written under its generated filename, a page carrying merged search metadata, and a structured settings group written with the merge rule applied.
