---
uid: acceptance_criterion-81ef4fca
id: AC-1733
type: acceptance_criterion
title: The site currently open travels with the handover, so a for-the-site file is
  placed at once
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:47.457380+00:00'
updated_at: '2026-09-11T05:42:21.447095+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

The site the client currently has open travels with every handover, so a file given the *put it on
the site* role is placed on that site as part of the handover rather than at some later step, and
the client is told the name it is on the site under.

A file given the *just for you to read* role is reported as material the assistant will read that
will not appear on the site — the client is never told a reference file was placed on their site.

## Verification

With a site open in the workspace, hand a file over with the *put it on the site* role and assert
the site currently open accompanied it, and that what the client is told names the site placement.
Hand another over with the *just for you to read* role and assert the client is told it will be
read and will not appear on the site, with no site placement reported.